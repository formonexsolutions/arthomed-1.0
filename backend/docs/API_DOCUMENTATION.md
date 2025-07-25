# Arthomed Backend - API Documentation

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [User Management APIs](#user-management-apis)
3. [Appointment Management APIs](#appointment-management-apis)
4. [File Upload APIs](#file-upload-apis)
5. [Admin APIs](#admin-apis)
6. [Error Codes Reference](#error-codes-reference)

---

## Authentication APIs

### Send OTP
Send OTP to mobile number for authentication.

**Endpoint:** `POST /api/auth/send-otp`

**Request Body:**
```json
{
  "mobileNumber": "9876543210"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "message": "OTP sent to your mobile number",
    "expiresIn": 300
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid mobile number format
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - SMS service failure

---

### Verify OTP
Verify OTP and authenticate user.

**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "mobileNumber": "9876543210",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "user": {
      "_id": "64f1234567890abcdef12345",
      "mobileNumber": "9876543210",
      "name": "John Doe",
      "role": "patient",
      "isVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid OTP
- `401 Unauthorized` - OTP expired or maximum attempts exceeded
- `404 Not Found` - OTP not found

---

### Refresh Token
Refresh access token using refresh token.

**Endpoint:** `POST /api/auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

---

### Logout
Logout user and invalidate tokens.

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## User Management APIs

### Get Current User Profile
Get the authenticated user's profile information.

**Endpoint:** `GET /api/users/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64f1234567890abcdef12345",
      "mobileNumber": "9876543210",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "patient",
      "isActive": true,
      "isVerified": true,
      "profile": {
        "dateOfBirth": "1990-01-15",
        "gender": "male",
        "address": {
          "street": "123 Main St",
          "city": "Mumbai",
          "state": "Maharashtra",
          "pincode": "400001",
          "country": "India"
        }
      },
      "patientInfo": {
        "bloodGroup": "O+",
        "allergies": ["Penicillin"],
        "medicalHistory": []
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### Update User Profile
Update the authenticated user's profile information.

**Endpoint:** `PUT /api/users/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "profile": {
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "address": {
      "street": "456 New St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400002",
      "country": "India"
    }
  },
  "patientInfo": {
    "bloodGroup": "O+",
    "allergies": ["Penicillin", "Dust"]
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      // Updated user object
    }
  }
}
```

---

### Get All Users (Admin Only)
Retrieve all users with pagination and filtering.

**Endpoint:** `GET /api/users`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `role` (optional) - Filter by role
- `search` (optional) - Search by name or mobile number
- `isActive` (optional) - Filter by active status

**Example:** `GET /api/users?page=1&limit=10&role=doctor&search=john`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "64f1234567890abcdef12345",
        "mobileNumber": "9876543210",
        "name": "Dr. John Doe",
        "email": "john@example.com",
        "role": "doctor",
        "isActive": true,
        "isVerified": true,
        "doctorInfo": {
          "specialization": "Cardiology",
          "qualification": "MBBS, MD",
          "experience": 10,
          "consultationFee": 500
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
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

### Get Doctors List
Get list of all doctors with their specializations.

**Endpoint:** `GET /api/users/doctors`

**Query Parameters:**
- `specialization` (optional) - Filter by specialization
- `page` (optional) - Page number
- `limit` (optional) - Items per page

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "64f1234567890abcdef12345",
        "name": "Dr. John Doe",
        "doctorInfo": {
          "specialization": "Cardiology",
          "qualification": "MBBS, MD",
          "experience": 10,
          "consultationFee": 500,
          "schedule": [
            {
              "day": "monday",
              "startTime": "09:00",
              "endTime": "17:00",
              "isAvailable": true
            }
          ]
        },
        "isActive": true
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 3,
      "total": 25,
      "limit": 10
    }
  }
}
```

---

## Appointment Management APIs

### Book Appointment
Book a new appointment with a doctor.

**Endpoint:** `POST /api/appointments/book`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
```
doctorId: 64f1234567890abcdef12345
appointmentDate: 2024-02-15
appointmentTime: 10:00
purposeOfVisit: Regular checkup
reason: Annual health checkup
symptoms: No specific symptoms
images: [file1.jpg, file2.pdf]
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "appointment": {
      "_id": "64f9876543210fedcba09876",
      "patient": {
        "_id": "64f1234567890abcdef12345",
        "name": "John Doe",
        "mobileNumber": "9876543210"
      },
      "doctor": {
        "_id": "64f1234567890abcdef67890",
        "name": "Dr. Jane Smith",
        "doctorInfo": {
          "specialization": "Cardiology"
        }
      },
      "appointmentDate": "2024-02-15",
      "appointmentTime": "10:00",
      "status": "pending",
      "purposeOfVisit": "Regular checkup",
      "reason": "Annual health checkup",
      "symptoms": "No specific symptoms",
      "images": [
        {
          "filename": "64f1234567890abcdef12345_1642234567890_report.jpg",
          "originalName": "medical_report.jpg",
          "path": "uploads/appointments/2024/02/64f1234567890abcdef12345_1642234567890_report.jpg",
          "size": 1024000,
          "mimeType": "image/jpeg"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### Get User Appointments
Get appointments for the authenticated user.

**Endpoint:** `GET /api/appointments/my-appointments`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional) - Filter by status
- `page` (optional) - Page number
- `limit` (optional) - Items per page
- `startDate` (optional) - Filter from date
- `endDate` (optional) - Filter to date

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "64f9876543210fedcba09876",
        "doctor": {
          "_id": "64f1234567890abcdef67890",
          "name": "Dr. Jane Smith",
          "doctorInfo": {
            "specialization": "Cardiology",
            "consultationFee": 500
          }
        },
        "appointmentDate": "2024-02-15",
        "appointmentTime": "10:00",
        "status": "confirmed",
        "purposeOfVisit": "Regular checkup",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 2,
      "total": 15,
      "limit": 10
    }
  }
}
```

---

### Get Available Slots
Get available appointment slots for a doctor on a specific date.

**Endpoint:** `GET /api/appointments/slots`

**Query Parameters:**
- `doctorId` (required) - Doctor's ID
- `date` (required) - Date in YYYY-MM-DD format

**Example:** `GET /api/appointments/slots?doctorId=64f1234567890abcdef67890&date=2024-02-15`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "doctor": {
      "_id": "64f1234567890abcdef67890",
      "name": "Dr. Jane Smith",
      "doctorInfo": {
        "specialization": "Cardiology",
        "consultationFee": 500
      }
    },
    "date": "2024-02-15",
    "availableSlots": [
      {
        "_id": "64f5555555555555555555555",
        "startTime": "09:00",
        "endTime": "09:30",
        "isAvailable": true,
        "consultationFee": 500
      },
      {
        "_id": "64f6666666666666666666666",
        "startTime": "10:00",
        "endTime": "10:30",
        "isAvailable": true,
        "consultationFee": 500
      }
    ],
    "bookedSlots": [
      {
        "startTime": "11:00",
        "endTime": "11:30",
        "isAvailable": false
      }
    ]
  }
}
```

---

### Cancel Appointment
Cancel an existing appointment.

**Endpoint:** `PUT /api/appointments/:appointmentId/cancel`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "reason": "Personal emergency"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "data": {
    "appointment": {
      "_id": "64f9876543210fedcba09876",
      "status": "cancelled",
      "cancellationReason": "Personal emergency",
      "refundInfo": {
        "refundAmount": 250,
        "refundStatus": "processed",
        "refundDate": "2024-01-15T10:30:00.000Z"
      }
    }
  }
}
```

---

### Update Appointment Status (Doctor/Admin)
Update appointment status by doctor or admin.

**Endpoint:** `PUT /api/appointments/:appointmentId/status`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "status": "completed",
  "notes": "Patient is healthy. Prescribed vitamins.",
  "prescription": "Vitamin D3 - 1 tablet daily for 30 days"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Appointment status updated successfully",
  "data": {
    "appointment": {
      "_id": "64f9876543210fedcba09876",
      "status": "completed",
      "notes": "Patient is healthy. Prescribed vitamins.",
      "prescription": "Vitamin D3 - 1 tablet daily for 30 days",
      "completedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

## File Upload APIs

### Upload Appointment Files
Upload medical documents/images for appointments.

**Endpoint:** `POST /api/files/upload/appointments`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
```
files: [file1.jpg, file2.pdf, file3.png]
appointmentId: 64f9876543210fedcba09876
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": {
    "uploadedFiles": [
      {
        "filename": "64f1234567890abcdef12345_1642234567890_report.jpg",
        "originalName": "medical_report.jpg",
        "path": "uploads/appointments/2024/02/64f1234567890abcdef12345_1642234567890_report.jpg",
        "size": 1024000,
        "mimeType": "image/jpeg",
        "url": "/api/files/uploads/appointments/2024/02/64f1234567890abcdef12345_1642234567890_report.jpg"
      }
    ]
  }
}
```

---

### Get File
Retrieve uploaded file.

**Endpoint:** `GET /api/files/:filename`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
- Returns the file content with appropriate Content-Type header

---

### Delete File
Delete an uploaded file.

**Endpoint:** `DELETE /api/files/:filename`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

## Admin APIs

### Get Dashboard Statistics
Get system statistics for admin dashboard.

**Endpoint:** `GET /api/admin/dashboard`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalUsers": 1250,
      "totalDoctors": 45,
      "totalPatients": 1180,
      "totalAppointments": 3456,
      "todayAppointments": 25,
      "pendingAppointments": 12,
      "completedAppointments": 3200,
      "revenue": {
        "today": 12500,
        "thisMonth": 345000,
        "thisYear": 2450000
      }
    },
    "recentAppointments": [
      {
        "_id": "64f9876543210fedcba09876",
        "patient": {
          "name": "John Doe",
          "mobileNumber": "9876543210"
        },
        "doctor": {
          "name": "Dr. Jane Smith"
        },
        "appointmentDate": "2024-02-15",
        "appointmentTime": "10:00",
        "status": "confirmed"
      }
    ],
    "topDoctors": [
      {
        "_id": "64f1234567890abcdef67890",
        "name": "Dr. Jane Smith",
        "specialization": "Cardiology",
        "appointmentCount": 156,
        "rating": 4.8
      }
    ]
  }
}
```

---

### Manage User Status
Activate or deactivate user accounts.

**Endpoint:** `PUT /api/admin/users/:userId/status`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "isActive": false,
  "reason": "Violating terms of service"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "user": {
      "_id": "64f1234567890abcdef12345",
      "isActive": false,
      "statusUpdatedAt": "2024-01-15T10:30:00.000Z",
      "statusUpdatedBy": "64f9999999999999999999999"
    }
  }
}
```

---

## Error Codes Reference

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### Custom Error Codes

| Error Code | Description |
|------------|-------------|
| INVALID_MOBILE_NUMBER | Mobile number format is invalid |
| OTP_EXPIRED | OTP has expired |
| OTP_INVALID | OTP is incorrect |
| OTP_MAX_ATTEMPTS | Maximum OTP attempts exceeded |
| TOKEN_EXPIRED | JWT token has expired |
| TOKEN_INVALID | JWT token is invalid |
| USER_NOT_FOUND | User account not found |
| USER_INACTIVE | User account is deactivated |
| APPOINTMENT_NOT_FOUND | Appointment not found |
| SLOT_UNAVAILABLE | Time slot is not available |
| APPOINTMENT_CANCELLED | Appointment is already cancelled |
| FILE_TOO_LARGE | File size exceeds limit |
| INVALID_FILE_TYPE | File type not allowed |
| PERMISSION_DENIED | Insufficient permissions |
| RATE_LIMIT_EXCEEDED | Too many requests |

### Validation Error Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "mobileNumber",
      "message": "Mobile number must be exactly 10 digits",
      "value": "123456789"
    },
    {
      "field": "email",
      "message": "Please enter a valid email address",
      "value": "invalid-email"
    }
  ]
}
```
