# Arthomed Backend API

This is the backend API server for the Arthomed Healthcare Management System, built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

```bash
# From the root of arthomed-1.0 repository
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, Twilio credentials, etc.

# Start the development server
npm start
```

The API server will be available at `http://localhost:3001`

## 📚 Documentation

For complete documentation, please refer to:

- **[Complete Documentation](/backend/docs/ARTHOMED_COMPLETE_DOCUMENTATION.pdf)** - Single comprehensive PDF
- **[Technical Documentation](/backend/docs/TECHNICAL_DOCUMENTATION.md)** - System architecture and implementation
- **[API Reference](/backend/docs/API_DOCUMENTATION.md)** - Complete API endpoints documentation
- **[System Flowcharts](/backend/docs/FLOWCHARTS.md)** - Workflow diagrams
- **[Quick Start Guide](/backend/docs/QUICK_START.md)** - Developer setup guide

## 🏗️ Architecture

### Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT with OTP verification
- **SMS Service:** Twilio
- **File Upload:** Multer
- **Documentation:** Swagger/OpenAPI

### Key Features
- 🔐 **Role-based Authentication** (Admin, Doctor, Receptionist, Patient)
- 📱 **OTP-based Login** via SMS
- 📅 **Appointment Management** with slot booking
- 📄 **File Upload System** for medical documents
- 🛡️ **Comprehensive Security** (Rate limiting, CORS, validation)
- 📖 **API Documentation** with Swagger

## 🔧 Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/arthomed

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Server Configuration
PORT=3001
NODE_ENV=development
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to mobile number
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/refresh-token` - Refresh access token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/doctors` - Get list of doctors

### Appointments
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments/my-appointments` - Get user appointments
- `GET /api/appointments/slots` - Get available time slots

### Files
- `POST /api/files/upload/appointments` - Upload medical documents

For complete API documentation, visit `/api-docs` when the server is running.

## 🚀 Development

### Running the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### Testing
```bash
# Run tests (when implemented)
npm test
```

### Documentation Generation
```bash
# Generate PDF documentation
node scripts/generatePDF.js
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/              # Database and app configuration
│   ├── controllers/         # Business logic controllers
│   ├── middleware/          # Custom middleware (auth, validation, etc.)
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API route definitions
│   └── utils/               # Utility functions
├── docs/                    # Documentation files
├── scripts/                 # Build and utility scripts
├── uploads/                 # File upload directory
├── server.js                # Application entry point
└── swagger.yaml             # API documentation
```

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **OTP Verification** via SMS
- **Role-based Access Control**
- **Rate Limiting** (100 requests per 15 minutes)
- **Input Validation** and sanitization
- **File Upload Restrictions**
- **CORS Protection**
- **Security Headers** via Helmet

## 🗃️ Database Models

### User
- Role-based user system (Admin, Doctor, Receptionist, Patient)
- Profile information with role-specific fields
- Authentication and verification status

### Appointment
- Patient-doctor appointment booking
- Status tracking (pending, confirmed, completed, cancelled)
- File attachments for medical documents

### Slot
- Doctor availability management
- Time slot booking system
- Conflict prevention

### OTP
- SMS-based verification system
- Expiration and attempt tracking
- Rate limiting protection

## 🚀 Deployment

### Environment Setup
1. Set up MongoDB Atlas cluster
2. Configure Twilio SMS service
3. Set environment variables
4. Deploy to your preferred platform (Heroku, AWS, etc.)

### Health Check
The API provides a health check endpoint at `/health` for monitoring.

## 📞 Support

For technical support or questions:
1. Check the comprehensive documentation in `/docs`
2. Review API documentation at `/api-docs`
3. Contact the development team

---

**Repository:** https://github.com/formonexsolutions/arthomed-1.0.git  
**Branch:** dev  
**Backend Location:** `/backend`
