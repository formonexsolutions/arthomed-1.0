# Arthomed Healthcare Backend - Technical Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Design](#database-design)
3. [API Architecture](#api-architecture)
4. [Authentication System](#authentication-system)
5. [Appointment Management](#appointment-management)
6. [File Upload System](#file-upload-system)
7. [Security Implementation](#security-implementation)
8. [Performance Optimization](#performance-optimization)
9. [Error Handling](#error-handling)
10. [Deployment Architecture](#deployment-architecture)

---

## System Architecture

### High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Native App]
        B[Web Dashboard]
    end
    
    subgraph "API Gateway Layer"
        C[Express.js Server]
        D[Middleware Stack]
    end
    
    subgraph "Business Logic Layer"
        E[Authentication Controller]
        F[User Controller]
        G[Appointment Controller]
        H[File Controller]
    end
    
    subgraph "Data Layer"
        I[MongoDB Atlas]
        J[File System Storage]
    end
    
    subgraph "External Services"
        K[Twilio SMS]
        L[Email Service]
    end
    
    A --> C
    B --> C
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
    E --> I
    F --> I
    G --> I
    H --> J
    E --> K
    G --> L
```

### Component Interaction Flow

```mermaid
sequenceDiagram
    participant Client as React Native App
    participant Gateway as API Gateway
    participant Auth as Auth Middleware
    participant Controller as Controller Layer
    participant Database as MongoDB
    participant External as External Services

    Client->>Gateway: HTTP Request
    Gateway->>Auth: Validate Request
    Auth->>Auth: Check JWT Token
    Auth->>Database: Verify User
    Auth->>Controller: Authorized Request
    Controller->>Database: Data Operations
    Controller->>External: External API Calls
    Controller->>Gateway: Response
    Gateway->>Client: JSON Response
```

---

## Database Design

### Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        String mobileNumber UK
        String name
        String email
        Enum role
        Boolean isActive
        Boolean isVerified
        Object profile
        Object doctorInfo
        Object patientInfo
        Date createdAt
        Date updatedAt
    }
    
    OTP {
        ObjectId _id PK
        String mobileNumber
        String otp
        String purpose
        Number attempts
        Date expiresAt
        Boolean isUsed
        Date createdAt
    }
    
    APPOINTMENT {
        ObjectId _id PK
        ObjectId patient FK
        ObjectId doctor FK
        Date appointmentDate
        String appointmentTime
        Enum status
        String purposeOfVisit
        String reason
        String symptoms
        Array images
        Object paymentInfo
        String notes
        ObjectId createdBy
        Date createdAt
        Date updatedAt
    }
    
    SLOT {
        ObjectId _id PK
        ObjectId doctor FK
        Date date
        String startTime
        String endTime
        Boolean isAvailable
        Boolean isBlocked
        ObjectId appointment FK
        Number maxPatients
        Number bookedPatients
        Number consultationFee
        Date createdAt
        Date updatedAt
    }
    
    USER ||--o{ APPOINTMENT : "patient"
    USER ||--o{ APPOINTMENT : "doctor"
    USER ||--o{ SLOT : "doctor"
    APPOINTMENT ||--o| SLOT : "books"
    USER ||--o{ OTP : "verifies"
```

### Database Schema Details

#### User Collection Schema
```javascript
const userSchema = new mongoose.Schema({
  // Basic Information
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^[6-9]\d{9}$/,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  },
  
  // Role & Status
  role: {
    type: String,
    enum: ['admin', 'doctor', 'receptionist', 'patient'],
    default: 'patient',
    index: true
  },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  
  // Personal Information
  profile: {
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    emergencyContact: {
      name: String,
      relationship: String,
      mobileNumber: String
    }
  },
  
  // Doctor-specific Information
  doctorInfo: {
    specialization: String,
    qualification: String,
    experience: Number,
    consultationFee: Number,
    registrationNumber: String,
    schedule: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String,
      endTime: String,
      isAvailable: { type: Boolean, default: true }
    }]
  },
  
  // Patient-specific Information
  patientInfo: {
    bloodGroup: String,
    allergies: [String],
    medicalHistory: [{
      condition: String,
      diagnosedDate: Date,
      treatment: String,
      doctor: String
    }],
    emergencyContact: {
      name: String,
      relationship: String,
      mobileNumber: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'doctorInfo.specialization': 1 });
userSchema.index({ isActive: 1, isVerified: 1 });
```

---

## API Architecture

### RESTful API Design Pattern

```mermaid
graph TB
    subgraph "HTTP Methods"
        A[GET - Retrieve Data]
        B[POST - Create Data]
        C[PUT - Update Data]
        D[DELETE - Remove Data]
    end
    
    subgraph "Route Structure"
        E[/api/auth/* - Authentication]
        F[/api/users/* - User Management]
        G[/api/appointments/* - Appointments]
        H[/api/files/* - File Operations]
    end
    
    subgraph "Response Format"
        I[Success Response]
        J[Error Response]
        K[Paginated Response]
    end
    
    A --> E
    B --> F
    C --> G
    D --> H
    E --> I
    F --> J
    G --> K
```

### API Response Standards

#### Success Response Format
```javascript
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data object
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Error Response Format
```javascript
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "statusCode": 400,
    "details": "Detailed error information"
  },
  "errors": [
    // Validation errors array
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Paginated Response Format
```javascript
{
  "success": true,
  "data": {
    "items": [
      // Array of items
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 50,
      "limit": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## Authentication System

### OTP-based Authentication Flow

```mermaid
sequenceDiagram
    participant User as User
    participant App as React Native App
    participant API as Backend API
    participant DB as MongoDB
    participant SMS as Twilio SMS

    User->>App: Enter Mobile Number
    App->>API: POST /auth/send-otp
    API->>DB: Check user existence
    API->>API: Generate 6-digit OTP
    API->>DB: Store OTP with expiration
    API->>SMS: Send OTP via SMS
    SMS-->>User: SMS with OTP
    API-->>App: OTP sent confirmation

    User->>App: Enter OTP
    App->>API: POST /auth/verify-otp
    API->>DB: Validate OTP
    API->>DB: Check expiration & attempts
    
    alt Valid OTP
        API->>DB: Mark OTP as used
        alt User exists
            API->>API: Generate JWT tokens
            API-->>App: Login successful
        else New user
            API->>DB: Create new user
            API->>API: Generate JWT tokens
            API-->>App: Registration successful
        end
    else Invalid OTP
        API->>DB: Increment attempts
        API-->>App: Invalid OTP error
    end
```

### JWT Token Management

```mermaid
graph TB
    subgraph "Token Generation"
        A[User Login/Register]
        B[Generate Access Token]
        C[Generate Refresh Token]
        D[Store Refresh Token]
    end
    
    subgraph "Token Validation"
        E[API Request]
        F[Extract Token]
        G[Verify Signature]
        H[Check Expiration]
        I[Validate User]
    end
    
    subgraph "Token Refresh"
        J[Access Token Expired]
        K[Use Refresh Token]
        L[Generate New Access Token]
        M[Return New Token]
    end
    
    A --> B
    B --> C
    C --> D
    E --> F
    F --> G
    G --> H
    H --> I
    J --> K
    K --> L
    L --> M
```

### Authentication Middleware Implementation

```javascript
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Find user and check if still exists and is active
    const user = await User.findById(decoded.id).select('-__v');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated.'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.',
        error: { code: 'TOKEN_EXPIRED' }
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
      error: { code: 'INVALID_TOKEN' }
    });
  }
};
```

---

## Appointment Management

### Appointment Lifecycle Management

```mermaid
stateDiagram-v2
    [*] --> Pending: Patient books appointment
    
    Pending --> Confirmed: Receptionist confirms
    Pending --> Rejected: Receptionist rejects
    Pending --> Cancelled: Patient cancels
    
    Confirmed --> InProgress: Doctor starts consultation
    Confirmed --> Cancelled: Patient/Admin cancels
    Confirmed --> NoShow: Patient doesn't show up
    
    InProgress --> Completed: Consultation finished
    InProgress --> Cancelled: Emergency cancellation
    
    Rejected --> [*]
    Completed --> [*]
    Cancelled --> [*]
    NoShow --> [*]
```

### Slot Management System

```mermaid
flowchart TD
    A[Doctor Schedule] --> B[Generate Daily Slots]
    B --> C[30-minute Time Slots]
    C --> D[Check Availability]
    D --> E{Slot Available?}
    E -->|Yes| F[Mark as Available]
    E -->|No| G[Mark as Unavailable]
    F --> H[Patient Booking]
    G --> I[Show Alternative Slots]
    H --> J[Confirm Booking]
    J --> K[Update Slot Status]
    K --> L[Send Confirmation]
```

### Appointment Booking Flow

```javascript
const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, purposeOfVisit, reason } = req.body;
    const patientId = req.user._id;

    // Check if slot is available
    const slot = await Slot.findOne({
      doctor: doctorId,
      date: appointmentDate,
      startTime: appointmentTime,
      isAvailable: true
    });

    if (!slot) {
      return next(new AppError('Selected time slot is not available', 400));
    }

    // Check for existing appointments (prevent double booking)
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      status: { $nin: ['cancelled', 'rejected', 'no-show'] }
    });

    if (existingAppointment) {
      return next(new AppError('Time slot already booked', 400));
    }

    // Create appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      appointmentDate,
      appointmentTime,
      purposeOfVisit,
      reason,
      status: 'pending',
      createdBy: patientId
    });

    // Handle file uploads if present
    if (req.files && req.files.length > 0) {
      appointment.images = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype
      }));
    }

    await appointment.save();

    // Update slot availability
    slot.isAvailable = false;
    slot.appointment = appointment._id;
    slot.bookedPatients += 1;
    await slot.save();

    // Populate appointment details for response
    await appointment.populate([
      { path: 'patient', select: 'name mobileNumber' },
      { path: 'doctor', select: 'name doctorInfo.specialization' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};
```

---

## File Upload System

### File Upload Architecture

```mermaid
graph TD
    A[Client Upload Request] --> B[Multer Middleware]
    B --> C[File Validation]
    C --> D{Valid File?}
    D -->|Yes| E[Generate Unique Filename]
    D -->|No| F[Reject Upload]
    E --> G[Save to File System]
    G --> H[Store File Path in DB]
    H --> I[Return File URL]
    F --> J[Return Error]
```

### File Storage Structure

```
uploads/
├── appointments/
│   ├── prescriptions/
│   │   ├── 2024/
│   │   │   ├── 01/
│   │   │   │   └── appointment_672b1234_1642234567890_prescription.jpg
│   │   │   └── 02/
│   │   └── 2025/
│   └── reports/
│       ├── 2024/
│       │   ├── 01/
│       │   │   └── appointment_672b5678_1642234567890_report.pdf
│       │   └── 02/
│       └── 2025/
└── profiles/
    ├── 2024/
    │   ├── 01/
    │   │   └── user_672b9012_1642234567890_avatar.jpg
    │   └── 02/
    └── 2025/
```

### File Upload Implementation

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadType = req.params.type || 'appointments';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const uploadPath = path.join('uploads', uploadType, year.toString(), month);
    
    // Create directory if it doesn't exist
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `${req.user._id}_${uniqueSuffix}_${sanitizedName}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum 5 files
  }
});
```

---

## Security Implementation

### Security Architecture

```mermaid
graph TB
    subgraph "Request Security"
        A[Rate Limiting]
        B[CORS Protection]
        C[Helmet Headers]
        D[Request Size Limits]
    end
    
    subgraph "Authentication Security"
        E[JWT Validation]
        F[OTP Verification]
        G[Session Management]
        H[Role-based Access]
    end
    
    subgraph "Data Security"
        I[Input Validation]
        J[SQL Injection Prevention]
        K[XSS Protection]
        L[Data Sanitization]
    end
    
    subgraph "File Security"
        M[File Type Validation]
        N[File Size Limits]
        O[Malware Scanning]
        P[Secure File Storage]
    end
```

### Security Middleware Stack

```javascript
// Security middleware configuration
const securityMiddleware = (app) => {
  // Basic security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-frontend-domain.com'] 
      : ['http://localhost:3000', 'http://localhost:19006'], // React Native Metro bundler
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing middleware with limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
};
```

### Input Validation System

```javascript
const { body, param, query, validationResult } = require('express-validator');

// Mobile number validation
const validateMobileNumber = () => [
  body('mobileNumber')
    .isLength({ min: 10, max: 10 })
    .withMessage('Mobile number must be exactly 10 digits')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid Indian mobile number')
    .customSanitizer(value => value.replace(/\D/g, '')) // Remove non-digits
];

// OTP validation
const validateOTP = () => [
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .matches(/^\d{6}$/)
    .withMessage('OTP must contain only numbers')
];

// User registration validation
const validateUserRegistration = () => [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  ...validateMobileNumber(),
  ...validateOTP()
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
    });
  }
  
  next();
};
```

---

## Performance Optimization

### Database Performance

```mermaid
graph TB
    subgraph "Indexing Strategy"
        A[Single Field Indexes]
        B[Compound Indexes]
        C[Text Indexes]
        D[Partial Indexes]
    end
    
    subgraph "Query Optimization"
        E[Aggregation Pipelines]
        F[Population Strategy]
        G[Projection]
        H[Pagination]
    end
    
    subgraph "Connection Management"
        I[Connection Pooling]
        J[Read Preferences]
        K[Write Concerns]
        L[Connection Limits]
    end
```

### Database Indexes Implementation

```javascript
// User collection indexes
userSchema.index({ mobileNumber: 1 }, { unique: true }); // Unique index
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'doctorInfo.specialization': 1 });
userSchema.index({ isActive: 1, isVerified: 1 }); // Compound index

// Appointment collection indexes
appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });
appointmentSchema.index({ createdAt: 1 });

// Compound unique index to prevent double booking
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, appointmentTime: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $nin: ['cancelled', 'no-show'] } 
    }
  }
);

// Slot collection indexes
slotSchema.index({ date: 1, isAvailable: 1 });
slotSchema.index({ doctor: 1, isAvailable: 1 });
slotSchema.index(
  { doctor: 1, date: 1, startTime: 1 },
  { unique: true }
);

// OTP collection indexes with TTL
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
otpSchema.index({ mobileNumber: 1, createdAt: 1 });
```

### Pagination Implementation

```javascript
const getPaginatedResults = async (model, query, options) => {
  const {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    populate = null,
    select = null
  } = options;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Build query
  let queryBuilder = model.find(query);
  
  if (select) queryBuilder = queryBuilder.select(select);
  if (populate) queryBuilder = queryBuilder.populate(populate);
  
  // Execute queries in parallel
  const [items, total] = await Promise.all([
    queryBuilder
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    model.countDocuments(query)
  ]);
  
  const pages = Math.ceil(total / limit);
  
  return {
    items,
    pagination: {
      current: parseInt(page),
      pages,
      total,
      limit: parseInt(limit),
      hasNext: page < pages,
      hasPrev: page > 1
    }
  };
};
```

---

## Error Handling

### Error Handling Architecture

```mermaid
graph TD
    A[Request] --> B[Route Handler]
    B --> C[Business Logic]
    C --> D{Error Occurs?}
    D -->|Yes| E[Error Middleware]
    D -->|No| F[Success Response]
    E --> G[Error Classification]
    G --> H[Error Logging]
    H --> I[Error Response]
    F --> J[Client Response]
    I --> J
```

### Global Error Handler Implementation

```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Duplicate field value entered';
    
    // Extract field name from error
    const field = Object.keys(err.keyValue)[0];
    if (field === 'mobileNumber') {
      message = 'Mobile number is already registered';
    } else if (field === 'email') {
      message = 'Email address is already registered';
    }
    
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired. Please log in again.';
    error = new AppError(message, 401);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large. Maximum size allowed is 10MB.';
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files. Maximum 5 files allowed.';
    error = new AppError(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      error: error,
      stack: err.stack 
    })
  });
};

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

---

## Deployment Architecture

### Production Deployment Flow

```mermaid
graph TB
    subgraph "Development"
        A[Local Development]
        B[Git Repository]
    end
    
    subgraph "CI/CD Pipeline"
        C[GitHub Actions]
        D[Build Process]
        E[Testing]
        F[Security Scanning]
    end
    
    subgraph "Production Environment"
        G[Load Balancer]
        H[Application Servers]
        I[MongoDB Atlas]
        J[File Storage]
        K[Monitoring]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    H --> J
    H --> K
```

### Environment Configuration

```javascript
// Production environment variables
const productionConfig = {
  // Server
  NODE_ENV: 'production',
  PORT: process.env.PORT || 5000,
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI,
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  
  // External Services
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  
  // Performance
  RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  // Monitoring
  LOG_LEVEL: 'info',
  ENABLE_METRICS: true
};

// Health check endpoint
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  };
  
  try {
    res.send(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).send();
  }
});
```

### Monitoring and Logging

```javascript
// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user._id : 'anonymous',
      timestamp: new Date().toISOString()
    };
    
    if (res.statusCode >= 400) {
      console.error('Request Error:', logData);
    } else {
      console.log('Request:', logData);
    }
  });
  
  next();
};

// Performance monitoring
const performanceMonitor = {
  trackApiResponse: (endpoint, duration, statusCode) => {
    // Send metrics to monitoring service
    console.log(`API Performance: ${endpoint} - ${duration}ms - ${statusCode}`);
  },
  
  trackError: (error, context) => {
    // Send error to error tracking service
    console.error('Application Error:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
};
```

---

## Integration Guidelines

### React Native Integration

```javascript
// API service configuration for React Native
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async sendOTP(mobileNumber) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber }),
    });
  }

  async verifyOTP(mobileNumber, otp) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber, otp }),
    });
  }

  // Appointment methods
  async bookAppointment(appointmentData) {
    return this.request('/appointments/book', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async getAvailableSlots(doctorId, date) {
    return this.request(`/appointments/slots?doctorId=${doctorId}&date=${date}`);
  }
}
```

This comprehensive technical documentation covers all aspects of the Arthomed healthcare backend system, from high-level architecture to implementation details. It serves as a complete reference for developers, system administrators, and stakeholders involved in the project.
