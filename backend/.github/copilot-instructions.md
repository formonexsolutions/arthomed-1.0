<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Arthomed Backend - Custom Instructions for GitHub Copilot

## Project Overview
This is a Node.js Express backend for a healthcare management application called Arthomed. The backend provides:
- Role-based authentication (Admin, Doctor, Receptionist, Patient)
- Mobile OTP-based login system
- Appointment management system
- User management with role-specific features

## Code Style and Patterns

### Error Handling
- Always use the custom `asyncHandler` wrapper for async route handlers
- Use custom error classes (`AppError`, `validationError`, etc.) from `middleware/errorHandler.js`
- Return structured error responses with `success: false` format

### Authentication & Authorization
- Use `authenticate` middleware for protected routes
- Use role-specific middleware (`requireAdmin`, `requireDoctor`, etc.) for authorization
- Always check user permissions before allowing operations
- Use JWT tokens with proper expiration handling

### Validation
- Use express-validator for input validation
- Always call `handleValidationErrors` after validation middleware
- Validate MongoDB ObjectIds using `validateObjectId`
- Sanitize and format mobile numbers using utility functions

### Database Patterns
- Use Mongoose models with proper schemas and indexes
- Implement virtual fields where appropriate
- Use static methods for complex queries
- Always populate related fields when needed
- Use soft deletes (isActive: false) instead of hard deletes

### API Response Format
```javascript
// Success Response
{
  success: true,
  message: "Optional success message",
  data: {
    // Response data
  }
}

// Error Response
{
  success: false,
  message: "Error message",
  errors: [...] // Optional validation errors
}

// Paginated Response
{
  success: true,
  data: {
    items: [...],
    pagination: {
      current: 1,
      pages: 5,
      total: 50,
      limit: 10
    }
  }
}
```

### Security Considerations
- Never expose sensitive data in API responses
- Always validate and sanitize user inputs
- Use rate limiting for sensitive endpoints
- Implement proper CORS configuration
- Hash sensitive data before storing
- Use environment variables for configuration

### Mobile Number Handling
- Format mobile numbers using `formatMobileNumber` utility
- Validate using `isValidMobileNumber` utility
- Store as 10-digit strings (without country code in database)
- Add country code when sending SMS

### OTP Management
- Generate 6-digit OTPs using `generateOTP` utility
- Set proper expiration times
- Implement rate limiting for OTP requests
- Clean up expired OTPs automatically
- Track verification attempts

### Appointment System
- Check doctor availability before booking
- Prevent double bookings using conflict detection
- Calculate refunds based on cancellation timing
- Track appointment status changes
- Validate appointment times against doctor schedules

## Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for models and classes
- Use kebab-case for file names
- Use descriptive names for routes and endpoints
- Prefix controller functions with action name (e.g., `getUsers`, `createAppointment`)

## File Organization
- Controllers: Handle business logic and responses
- Models: Define data schemas and relationships
- Routes: Define API endpoints and middleware
- Middleware: Handle authentication, validation, and error processing
- Utils: Provide helper functions and utilities

## Testing and Development
- Use detailed error messages in development mode
- Include debug information when NODE_ENV is development
- Implement health check endpoints
- Use proper logging for debugging
- Test with various user roles and scenarios

## Role-Based Features
- **Admin**: Full system access, user management, statistics
- **Doctor**: Appointment management, patient data for their appointments
- **Receptionist**: Appointment viewing and scheduling assistance
- **Patient**: Self-registration, appointment booking, profile management

## Common Patterns
When adding new features:
1. Create model with proper validation and indexes
2. Add controller with proper error handling
3. Create routes with authentication and validation
4. Test with different user roles
5. Document API endpoints
6. Update README if needed

## Environment Variables
Always use environment variables for:
- Database connection strings
- JWT secrets
- API keys (Twilio, email)
- Configuration settings
- Feature flags

## MongoDB Best Practices
- Use proper indexes for performance
- Implement data validation at schema level
- Use virtual fields for computed properties
- Implement proper error handling for database operations
- Use transactions for multi-document operations where needed
