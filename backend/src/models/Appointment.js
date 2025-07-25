const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required'],
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required'],
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required'],
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format'],
  },
  duration: {
    type: Number,
    default: 30, // duration in minutes
  },
  reason: {
    type: String,
    required: [true, 'Reason for appointment is required'],
    maxlength: [500, 'Reason cannot exceed 500 characters'],
  },
  symptoms: {
    type: String,
    maxlength: [1000, 'Symptoms description cannot exceed 1000 characters'],
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending',
  },
  purposeOfVisit: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup', 'vaccination', 'health-screening'],
    default: 'consultation',
  },
  images: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadDate: { type: Date, default: Date.now },
    url: String, // For cloud storage URL
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium',
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup'],
    default: 'consultation',
  },
  notes: {
    patient: String, // Notes from patient
    doctor: String,  // Notes from doctor
    receptionist: String, // Notes from receptionist
  },
  prescription: {
    medicines: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String,
    }],
    advice: String,
    nextVisit: Date,
  },
  vitals: {
    temperature: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
    },
    heartRate: Number,
    weight: Number,
    height: Number,
  },
  payment: {
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'paid', 'partially-paid', 'refunded'],
      default: 'pending',
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'insurance'],
    },
    transactionId: String,
    paidAt: Date,
  },
  reminders: [{
    type: {
      type: String,
      enum: ['sms', 'email', 'push'],
    },
    sentAt: Date,
    message: String,
  }],
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledAt: Date,
    refundAmount: Number,
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    submittedAt: Date,
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
appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });
appointmentSchema.index({ createdAt: 1 });

// Compound index to prevent double booking
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, appointmentTime: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $nin: ['cancelled', 'no-show'] } 
    }
  }
);

// Virtual for appointment duration end time
appointmentSchema.virtual('endTime').get(function() {
  if (this.appointmentTime && this.duration) {
    const [hours, minutes] = this.appointmentTime.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(hours, minutes, 0, 0);
    
    const endTime = new Date(startTime.getTime() + this.duration * 60000);
    return `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
  }
  return null;
});

// Virtual for full appointment datetime
appointmentSchema.virtual('appointmentDateTime').get(function() {
  if (this.appointmentDate && this.appointmentTime) {
    const [hours, minutes] = this.appointmentTime.split(':').map(Number);
    const datetime = new Date(this.appointmentDate);
    datetime.setHours(hours, minutes, 0, 0);
    return datetime;
  }
  return null;
});

// Virtual to check if appointment is upcoming
appointmentSchema.virtual('isUpcoming').get(function() {
  return this.appointmentDateTime > new Date() && ['scheduled', 'confirmed'].includes(this.status);
});

// Virtual to check if appointment is today
appointmentSchema.virtual('isToday').get(function() {
  if (!this.appointmentDate) return false;
  
  const today = new Date();
  const appointmentDate = new Date(this.appointmentDate);
  
  return appointmentDate.toDateString() === today.toDateString();
});

// Pre-save middleware to validate appointment time
appointmentSchema.pre('save', function(next) {
  // Ensure appointment is not in the past (only for new appointments)
  if (this.isNew && this.appointmentDateTime < new Date()) {
    return next(new Error('Cannot schedule appointment in the past'));
  }
  
  // Set lastModifiedBy if not set
  if (this.isModified() && !this.isNew && !this.lastModifiedBy) {
    // This should be set by the controller, but just in case
    this.lastModifiedBy = this.createdBy;
  }
  
  next();
});

// Instance method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentTime = this.appointmentDateTime;
  
  // Can't cancel if already cancelled or completed
  if (['cancelled', 'completed', 'no-show'].includes(this.status)) {
    return { allowed: false, reason: 'Appointment is already ' + this.status };
  }
  
  // Can't cancel if appointment is in progress
  if (this.status === 'in-progress') {
    return { allowed: false, reason: 'Cannot cancel appointment in progress' };
  }
  
  // Check if cancellation is too late (less than 2 hours before appointment)
  const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
  if (hoursUntilAppointment < 2) {
    return { allowed: false, reason: 'Cannot cancel appointment less than 2 hours before scheduled time' };
  }
  
  return { allowed: true };
};

// Instance method to calculate refund amount
appointmentSchema.methods.calculateRefund = function() {
  if (!this.payment || this.payment.status !== 'paid') {
    return 0;
  }
  
  const now = new Date();
  const appointmentTime = this.appointmentDateTime;
  const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
  
  // Full refund if cancelled more than 24 hours before
  if (hoursUntilAppointment >= 24) {
    return this.payment.amount;
  }
  
  // 50% refund if cancelled between 2-24 hours before
  if (hoursUntilAppointment >= 2) {
    return this.payment.amount * 0.5;
  }
  
  // No refund if cancelled less than 2 hours before
  return 0;
};

// Static method to find conflicts for a doctor
appointmentSchema.statics.findConflicts = function(doctorId, date, startTime, duration = 30, excludeId = null) {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const startDateTime = new Date(date);
  startDateTime.setHours(startHours, startMinutes, 0, 0);
  
  const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
  const endTime = `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`;
  
  const query = {
    doctor: doctorId,
    appointmentDate: {
      $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
    },
    status: { $nin: ['cancelled', 'no-show'] },
    $or: [
      // New appointment starts during existing appointment
      {
        appointmentTime: { $lte: startTime },
        $expr: {
          $gte: [
            { $dateAdd: {
              startDate: {
                $dateFromParts: {
                  year: { $year: '$appointmentDate' },
                  month: { $month: '$appointmentDate' },
                  day: { $dayOfMonth: '$appointmentDate' },
                  hour: { $toInt: { $substr: ['$appointmentTime', 0, 2] } },
                  minute: { $toInt: { $substr: ['$appointmentTime', 3, 2] } },
                }
              },
              unit: 'minute',
              amount: '$duration'
            }},
            startDateTime
          ]
        }
      },
      // New appointment ends during existing appointment
      {
        appointmentTime: { $gte: startTime, $lt: endTime }
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

// Static method to get doctor's availability for a specific date
appointmentSchema.statics.getDoctorAvailability = async function(doctorId, date) {
  const User = mongoose.model('User');
  const doctor = await User.findById(doctorId);
  
  if (!doctor || doctor.role !== 'doctor') {
    throw new Error('Doctor not found');
  }
  
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
  const schedule = doctor.doctorInfo.schedule.find(s => s.day === dayName && s.isAvailable);
  
  if (!schedule) {
    return { available: false, reason: 'Doctor not available on this day' };
  }
  
  // Get all appointments for this doctor on this date
  const appointments = await this.find({
    doctor: doctorId,
    appointmentDate: {
      $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
    },
    status: { $nin: ['cancelled', 'no-show'] },
  }).select('appointmentTime duration');
  
  return {
    available: true,
    schedule: {
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    },
    bookedSlots: appointments.map(apt => ({
      startTime: apt.appointmentTime,
      endTime: apt.endTime,
    })),
  };
};

module.exports = mongoose.model('Appointment', appointmentSchema);
