const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Arthomed Healthcare API',
      version: '1.0.0',
      description: 'Complete healthcare management API with role-based authentication, OTP verification, and appointment management for React Native applications.',
      contact: {
        name: 'Arthomed Support',
        email: 'support@arthomed.com'
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-production-domain.com/api'
          : 'http://localhost:5000/api',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d5ec49f1b2c8b1f8e4e1a1' },
            name: { type: 'string', example: 'John Doe' },
            mobileNumber: { type: 'string', example: '9876543210' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', enum: ['admin', 'doctor', 'receptionist', 'patient'] },
            isVerified: { type: 'boolean', example: true },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            profile: {
              type: 'object',
              properties: {
                dateOfBirth: { type: 'string', format: 'date' },
                gender: { type: 'string', enum: ['male', 'female', 'other'] },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    pincode: { type: 'string' },
                    country: { type: 'string', default: 'India' }
                  }
                }
              }
            },
            doctorInfo: {
              type: 'object',
              properties: {
                specialization: { type: 'string', example: 'Cardiology' },
                qualification: { type: 'string', example: 'MD, DM Cardiology' },
                experience: { type: 'number', example: 10 },
                consultationFee: { type: 'number', example: 500 },
                registrationNumber: { type: 'string', example: 'MH12345' }
              }
            }
          }
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d5ec49f1b2c8b1f8e4e1a2' },
            patient: { $ref: '#/components/schemas/User' },
            doctor: { $ref: '#/components/schemas/User' },
            appointmentDate: { type: 'string', format: 'date', example: '2024-01-15' },
            appointmentTime: { type: 'string', example: '10:30' },
            purposeOfVisit: { 
              type: 'string', 
              enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup', 'vaccination', 'health-screening']
            },
            reason: { type: 'string', example: 'Regular checkup' },
            status: { 
              type: 'string', 
              enum: ['pending', 'confirmed', 'rejected', 'in-progress', 'completed', 'cancelled', 'no-show']
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  originalName: { type: 'string' },
                  url: { type: 'string' },
                  uploadDate: { type: 'string', format: 'date-time' }
                }
              }
            },
            payment: {
              type: 'object',
              properties: {
                amount: { type: 'number', example: 500 },
                status: { type: 'string', enum: ['pending', 'paid', 'partially-paid', 'refunded'] }
              }
            },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Slot: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            doctor: { type: 'string', example: '60d5ec49f1b2c8b1f8e4e1a1' },
            date: { type: 'string', format: 'date' },
            startTime: { type: 'string', example: '09:00' },
            endTime: { type: 'string', example: '09:30' },
            duration: { type: 'number', example: 30 },
            fee: { type: 'number', example: 500 },
            available: { type: 'boolean', example: true },
            status: { type: 'string', enum: ['available', 'booked', 'blocked', 'unavailable'] }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                  value: { type: 'string' }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
  swaggerSetup: swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Arthomed API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    }
  })
};
