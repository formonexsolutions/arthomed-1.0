const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format'],
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format'],
  },
  duration: {
    type: Number,
    default: 30, // duration in minutes
    min: [15, 'Minimum slot duration is 15 minutes'],
    max: [120, 'Maximum slot duration is 120 minutes'],
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  blockReason: {
    type: String,
    enum: ['break', 'emergency', 'maintenance', 'personal', 'other'],
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null,
  },
  maxPatients: {
    type: Number,
    default: 1,
    min: [1, 'Minimum 1 patient per slot'],
    max: [5, 'Maximum 5 patients per slot'],
  },
  bookedPatients: {
    type: Number,
    default: 0,
  },
  slotType: {
    type: String,
    enum: ['regular', 'emergency', 'followup', 'walkin'],
    default: 'regular',
  },
  fee: {
    type: Number,
    min: [0, 'Fee cannot be negative'],
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better performance
slotSchema.index({ date: 1, isAvailable: 1 });
slotSchema.index({ doctor: 1, isAvailable: 1 });

// Compound unique index to prevent overlapping slots
slotSchema.index(
  { doctor: 1, date: 1, startTime: 1 },
  { unique: true }
);

// Virtual for slot status
slotSchema.virtual('status').get(function() {
  if (this.isBlocked) return 'blocked';
  if (!this.isAvailable) return 'unavailable';
  if (this.bookedPatients >= this.maxPatients) return 'full';
  if (this.appointment) return 'booked';
  return 'available';
});

// Virtual to check if slot is in the past
slotSchema.virtual('isPast').get(function() {
  const now = new Date();
  const slotDateTime = new Date(this.date);
  const [hours, minutes] = this.startTime.split(':').map(Number);
  slotDateTime.setHours(hours, minutes, 0, 0);
  
  return slotDateTime < now;
});

// Virtual to check if slot is today
slotSchema.virtual('isToday').get(function() {
  const today = new Date();
  const slotDate = new Date(this.date);
  
  return slotDate.toDateString() === today.toDateString();
});

// Pre-save middleware
slotSchema.pre('save', function(next) {
  // Ensure end time is after start time
  const [startHours, startMinutes] = this.startTime.split(':').map(Number);
  const [endHours, endMinutes] = this.endTime.split(':').map(Number);
  
  const startTimeInMinutes = startHours * 60 + startMinutes;
  const endTimeInMinutes = endHours * 60 + endMinutes;
  
  if (endTimeInMinutes <= startTimeInMinutes) {
    return next(new Error('End time must be after start time'));
  }
  
  // Calculate duration if not provided
  if (!this.duration) {
    this.duration = endTimeInMinutes - startTimeInMinutes;
  }
  
  next();
});

// Static method to generate slots for a doctor's schedule
slotSchema.statics.generateSlotsForDate = async function(doctorId, date, createdBy) {
  const User = mongoose.model('User');
  const doctor = await User.findById(doctorId);
  
  if (!doctor || doctor.role !== 'doctor') {
    throw new Error('Doctor not found');
  }
  
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
  const schedule = doctor.doctorInfo.schedule?.find(s => s.day === dayName && s.isAvailable);
  
  if (!schedule) {
    return [];
  }
  
  const slots = [];
  const slotDuration = 30; // 30 minutes per slot
  
  const [startHours, startMinutes] = schedule.startTime.split(':').map(Number);
  const [endHours, endMinutes] = schedule.endTime.split(':').map(Number);
  
  let currentTime = new Date();
  currentTime.setHours(startHours, startMinutes, 0, 0);
  
  const endTime = new Date();
  endTime.setHours(endHours, endMinutes, 0, 0);
  
  while (currentTime < endTime) {
    const startTimeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
    
    const nextTime = new Date(currentTime.getTime() + slotDuration * 60000);
    const endTimeStr = `${nextTime.getHours().toString().padStart(2, '0')}:${nextTime.getMinutes().toString().padStart(2, '0')}`;
    
    // Check if slot already exists
    const existingSlot = await this.findOne({
      doctor: doctorId,
      date: date,
      startTime: startTimeStr,
    });
    
    if (!existingSlot) {
      const slot = new this({
        doctor: doctorId,
        date: date,
        startTime: startTimeStr,
        endTime: endTimeStr,
        duration: slotDuration,
        fee: doctor.doctorInfo.consultationFee || 0,
        createdBy: createdBy,
      });
      
      slots.push(slot);
    }
    
    currentTime = nextTime;
  }
  
  // Save all slots
  if (slots.length > 0) {
    await this.insertMany(slots);
  }
  
  return slots;
};

// Static method to get available slots for a date
slotSchema.statics.getAvailableSlots = function(doctorId, date) {
  return this.find({
    doctor: doctorId,
    date: {
      $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
    },
    isAvailable: true,
    isBlocked: false,
    $expr: { $lt: ['$bookedPatients', '$maxPatients'] },
  }).populate('doctor', 'name doctorInfo.specialization doctorInfo.consultationFee')
    .sort({ startTime: 1 });
};

// Static method to book a slot
slotSchema.statics.bookSlot = async function(slotId, appointmentId) {
  const slot = await this.findById(slotId);
  
  if (!slot) {
    throw new Error('Slot not found');
  }
  
  if (!slot.isAvailable || slot.isBlocked) {
    throw new Error('Slot is not available');
  }
  
  if (slot.bookedPatients >= slot.maxPatients) {
    throw new Error('Slot is fully booked');
  }
  
  slot.bookedPatients += 1;
  slot.appointment = appointmentId;
  
  if (slot.bookedPatients >= slot.maxPatients) {
    slot.isAvailable = false;
  }
  
  await slot.save();
  return slot;
};

// Static method to release a slot
slotSchema.statics.releaseSlot = async function(slotId) {
  const slot = await this.findById(slotId);
  
  if (!slot) {
    throw new Error('Slot not found');
  }
  
  if (slot.bookedPatients > 0) {
    slot.bookedPatients -= 1;
  }
  
  slot.appointment = null;
  slot.isAvailable = true;
  
  await slot.save();
  return slot;
};

module.exports = mongoose.model('Slot', slotSchema);
