# Arthomed Backend - Quick Start Guide

## 🚀 Quick Setup

```bash
# Clone repository
git clone https://github.com/formonexsolutions/arthomed-1.0.git
cd arthomed-1.0

# Switch to dev branch
git checkout dev

# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm start
```

## 📱 Mobile App Integration

### API Base URL
```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

### Authentication Flow
1. Send OTP: `POST /auth/send-otp`
2. Verify OTP: `POST /auth/verify-otp`
3. Use Bearer token for authenticated requests

### Sample Integration Code (React Native)
```javascript
const API_BASE = 'http://localhost:3001/api';

// Send OTP
const sendOTP = async (mobileNumber) => {
  const response = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber })
  });
  return response.json();
};

// Verify OTP
const verifyOTP = async (mobileNumber, otp) => {
  const response = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber, otp })
  });
  return response.json();
};
```

## 🏥 Key Features

- **Role-based Authentication** (Admin, Doctor, Receptionist, Patient)
- **OTP-based Login** via Twilio SMS
- **Appointment Management** with slot booking
- **File Upload** for medical documents
- **Real-time Notifications**
- **Comprehensive API** with Swagger documentation

## 🔧 Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/arthomed

# JWT Secrets
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Server Configuration
PORT=3001
NODE_ENV=development
```

## 📖 Documentation

- **README.pdf** - Complete project overview
- **TECHNICAL_DOCUMENTATION.pdf** - Architecture and implementation
- **API_DOCUMENTATION.pdf** - Complete API reference
- **FLOWCHARTS.pdf** - System workflows and diagrams
- **ARTHOMED_COMPLETE_DOCUMENTATION.pdf** - All documentation combined

## 🎯 API Endpoints Summary

### Authentication
- `POST /api/auth/send-otp` - Send OTP to mobile
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/doctors` - Get doctors list
- `GET /api/users` - Get all users (Admin)

### Appointments
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments/my-appointments` - Get user appointments
- `GET /api/appointments/slots` - Get available slots
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `PUT /api/appointments/:id/status` - Update status

### File Management
- `POST /api/files/upload/appointments` - Upload files
- `GET /api/files/:filename` - Download file
- `DELETE /api/files/:filename` - Delete file

## 🔒 Security Features

- JWT token-based authentication
- Role-based access control
- Rate limiting (100 requests/15min)
- Input validation and sanitization
- File upload restrictions
- CORS protection
- Security headers (Helmet)

## 🚀 Deployment

### Development
```bash
cd backend
npm run dev
```

### Production
```bash
cd backend
npm start
```

### Docker (Optional)
```bash
cd backend
docker build -t arthomed-backend .
docker run -p 3001:3001 arthomed-backend
```

## 🏗️ Project Structure

```
arthomed-1.0/
├── backend/                 # Backend API Server
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   └── utils/           # Utility functions
│   ├── uploads/             # File uploads
│   ├── docs/                # Documentation
│   ├── scripts/             # Build scripts
│   └── server.js            # Entry point
├── src/                     # React Native Frontend
├── android/                 # Android specific files
├── ios/                     # iOS specific files
└── ...                      # Other React Native files
```

## 📞 Support

For questions or issues:
1. Check the documentation in `backend/docs` folder
2. Review API documentation at `/api-docs` endpoint
3. Contact the development team

---

**Repository:** https://github.com/formonexsolutions/arthomed-1.0.git
**Branch:** dev
**Generated on:** ${new Date().toLocaleDateString()}
**Version:** 1.0.0
