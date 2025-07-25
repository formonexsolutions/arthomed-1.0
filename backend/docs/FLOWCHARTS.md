# Arthomed Backend - System Flow Charts

## Authentication Flow Chart

```mermaid
flowchart TD
    A[User Opens App] --> B[Enter Mobile Number]
    B --> C[Validate Mobile Number Format]
    C --> D{Valid Format?}
    D -->|No| E[Show Error Message]
    D -->|Yes| F[Send OTP Request to Backend]
    E --> B
    F --> G[Backend: Check Rate Limiting]
    G --> H{Rate Limit Exceeded?}
    H -->|Yes| I[Return Rate Limit Error]
    H -->|No| J[Generate 6-digit OTP]
    I --> E
    J --> K[Store OTP in Database with Expiration]
    K --> L[Send OTP via Twilio SMS]
    L --> M[Return Success Response]
    M --> N[Show OTP Input Screen]
    N --> O[User Enters OTP]
    O --> P[Submit OTP to Backend]
    P --> Q[Backend: Validate OTP]
    Q --> R{OTP Valid?}
    R -->|No| S[Increment Attempt Counter]
    S --> T{Max Attempts Reached?}
    T -->|Yes| U[Block OTP for 15 minutes]
    T -->|No| V[Return Invalid OTP Error]
    U --> V
    V --> W[Show Error Message]
    W --> O
    R -->|Yes| X[Mark OTP as Used]
    X --> Y[Check if User Exists]
    Y --> Z{User Exists?}
    Z -->|Yes| AA[Generate JWT Tokens]
    Z -->|No| BB[Create New User Account]
    BB --> CC[Set Default Role as Patient]
    CC --> AA
    AA --> DD[Return Access & Refresh Tokens]
    DD --> EE[Store Tokens in Secure Storage]
    EE --> FF[Navigate to Main App]
```

## User Registration & Profile Setup Flow

```mermaid
flowchart TD
    A[New User After OTP Verification] --> B[Show Profile Setup Screen]
    B --> C[User Enters Basic Information]
    C --> D[Name, Email, Date of Birth, Gender]
    D --> E[Validate Input Fields]
    E --> F{Validation Passed?}
    F -->|No| G[Show Validation Errors]
    G --> C
    F -->|Yes| H[Submit Profile Data]
    H --> I[Backend: Update User Profile]
    I --> J[Validate Email Uniqueness]
    J --> K{Email Already Exists?}
    K -->|Yes| L[Return Email Exists Error]
    L --> G
    K -->|No| M[Save Profile Information]
    M --> N[Update User Status to Verified]
    N --> O[Return Success Response]
    O --> P[Show Profile Success Message]
    P --> Q[Navigate to Role Selection]
    Q --> R{User Role?}
    R -->|Patient| S[Setup Patient Profile]
    R -->|Doctor| T[Setup Doctor Profile]
    R -->|Receptionist| U[Await Admin Approval]
    S --> V[Medical History, Blood Group, Allergies]
    T --> W[Specialization, Qualification, Experience]
    U --> X[Account Pending Approval]
    V --> Y[Save Patient Information]
    W --> Z[Save Doctor Information]
    Y --> AA[Complete Registration]
    Z --> BB[Submit for Admin Verification]
    BB --> CC[Admin Approval Required]
    AA --> DD[Navigate to Dashboard]
    CC --> X
    X --> DD
```

## Appointment Booking Flow

```mermaid
flowchart TD
    A[Patient Opens Appointment Section] --> B[Select Doctor or Specialization]
    B --> C{Search Type?}
    C -->|By Specialization| D[Show Doctors by Specialty]
    C -->|By Doctor Name| E[Search Doctor by Name]
    D --> F[Display Doctor List]
    E --> F
    F --> G[Patient Selects Doctor]
    G --> H[Show Doctor Profile & Schedule]
    H --> I[Select Appointment Date]
    I --> J[Backend: Get Available Slots]
    J --> K[Check Doctor Schedule]
    K --> L[Generate Time Slots]
    L --> M[Filter Available Slots]
    M --> N[Return Available Time Slots]
    N --> O[Display Available Times]
    O --> P[Patient Selects Time Slot]
    P --> Q[Show Appointment Details Form]
    Q --> R[Enter Purpose of Visit]
    R --> S[Add Symptoms Description]
    S --> T[Upload Medical Images/Reports]
    T --> U[Review Appointment Details]
    U --> V[Confirm Booking]
    V --> W[Backend: Validate Slot Availability]
    W --> X{Slot Still Available?}
    X -->|No| Y[Return Slot Unavailable Error]
    Y --> Z[Show Error & Refresh Slots]
    Z --> O
    X -->|Yes| AA[Create Appointment Record]
    AA --> BB[Update Slot Status to Booked]
    BB --> CC[Process File Uploads]
    CC --> DD[Send Confirmation SMS]
    DD --> EE[Send Notification to Doctor]
    EE --> FF[Return Booking Confirmation]
    FF --> GG[Show Success Message]
    GG --> HH[Navigate to Appointments List]
```

## Doctor Schedule Management Flow

```mermaid
flowchart TD
    A[Doctor Logs In] --> B[Navigate to Schedule Management]
    B --> C[View Current Schedule]
    C --> D[Select Day/Date to Manage]
    D --> E{Action Type?}
    E -->|Set Available Hours| F[Define Working Hours]
    E -->|Block Time Slots| G[Select Slots to Block]
    E -->|Set Consultation Fee| H[Enter Fee Amount]
    F --> I[Set Start Time & End Time]
    I --> J[Define Slot Duration]
    J --> K[Generate Time Slots]
    K --> L[Save Schedule to Database]
    G --> M[Select Specific Time Slots]
    M --> N[Add Reason for Blocking]
    N --> O[Mark Slots as Unavailable]
    H --> P[Set Fee per Consultation]
    P --> Q[Apply to Selected Days]
    L --> R[Update Slot Availability]
    O --> R
    Q --> R
    R --> S[Notify Patients of Changes]
    S --> T[Update Schedule Display]
    T --> U[Return Success Confirmation]
```

## Appointment Status Management Flow

```mermaid
flowchart TD
    A[Appointment Created] --> B[Status: Pending]
    B --> C{Who Takes Action?}
    C -->|Receptionist| D[Review Appointment]
    C -->|Patient| E[Cancel Request]
    C -->|Doctor| F[View Appointment]
    D --> G{Receptionist Decision?}
    G -->|Approve| H[Status: Confirmed]
    G -->|Reject| I[Status: Rejected]
    E --> J{Cancellation Timing?}
    J -->|>24 hrs before| K[Full Refund]
    J -->|<24 hrs before| L[Partial/No Refund]
    K --> M[Status: Cancelled]
    L --> M
    H --> N[Send Confirmation to Patient]
    I --> O[Send Rejection Notice]
    M --> P[Process Refund if Applicable]
    F --> Q[On Appointment Day]
    Q --> R{Patient Shows Up?}
    R -->|Yes| S[Status: In Progress]
    R -->|No| T[Status: No Show]
    S --> U[Doctor Consultation]
    U --> V[Add Notes & Prescription]
    V --> W[Status: Completed]
    N --> X[Patient Notified]
    O --> Y[Patient Notified]
    P --> Z[Patient Notified]
    T --> AA[Patient Notified]
    W --> BB[Patient Notified]
```

## File Upload & Management Flow

```mermaid
flowchart TD
    A[User Selects Files] --> B[Validate File Type]
    B --> C{Valid File Type?}
    C -->|No| D[Show File Type Error]
    C -->|Yes| E[Check File Size]
    E --> F{Size Within Limit?}
    F -->|No| G[Show File Size Error]
    F -->|Yes| H[Check File Count]
    H --> I{Count Within Limit?}
    I -->|No| J[Show File Count Error]
    I -->|Yes| K[Generate Unique Filename]
    K --> L[Create Upload Directory]
    L --> M[Save File to File System]
    M --> N[Generate File URL]
    N --> O[Store File Metadata in DB]
    O --> P[Return File Upload Success]
    P --> Q[Display Uploaded Files]
    D --> R[User Selects Different File]
    G --> R
    J --> R
    R --> A
```

## Admin Dashboard Management Flow

```mermaid
flowchart TD
    A[Admin Logs In] --> B[Load Dashboard Data]
    B --> C[Display System Statistics]
    C --> D[Show User Management Panel]
    D --> E{Admin Action?}
    E -->|Manage Users| F[View All Users]
    E -->|Manage Appointments| G[View All Appointments]
    E -->|System Settings| H[Configure System]
    E -->|Reports| I[Generate Reports]
    F --> J[Search/Filter Users]
    J --> K[Select User]
    K --> L{User Action?}
    L -->|Activate/Deactivate| M[Toggle User Status]
    L -->|Change Role| N[Update User Role]
    L -->|View Details| O[Show User Profile]
    G --> P[Filter Appointments]
    P --> Q[Select Appointment]
    Q --> R{Appointment Action?}
    R -->|Cancel| S[Cancel Appointment]
    R -->|Reschedule| T[Change Date/Time]
    R -->|Update Status| U[Modify Status]
    H --> V[Update System Configuration]
    I --> W[Select Report Type]
    W --> X[Generate Report Data]
    X --> Y[Export Report]
    M --> Z[Update Database]
    N --> Z
    S --> Z
    T --> Z
    U --> Z
    V --> Z
    Z --> AA[Return Success Response]
    AA --> BB[Refresh Dashboard Data]
```

## Error Handling & Recovery Flow

```mermaid
flowchart TD
    A[API Request] --> B[Execute Request Handler]
    B --> C{Error Occurs?}
    C -->|No| D[Return Success Response]
    C -->|Yes| E[Capture Error Details]
    E --> F[Classify Error Type]
    F --> G{Error Type?}
    G -->|Validation Error| H[Format Validation Messages]
    G -->|Authentication Error| I[Return Auth Error]
    G -->|Database Error| J[Handle DB Error]
    G -->|File Upload Error| K[Handle File Error]
    G -->|External API Error| L[Handle External Error]
    G -->|Unknown Error| M[Log Error for Investigation]
    H --> N[Return 400 Bad Request]
    I --> O[Return 401 Unauthorized]
    J --> P{DB Error Type?}
    P -->|Duplicate Key| Q[Return Conflict Error]
    P -->|Cast Error| R[Return Not Found Error]
    P -->|Validation Error| S[Return Validation Error]
    P -->|Connection Error| T[Return Service Unavailable]
    K --> U[Return File Error Message]
    L --> V[Return External Service Error]
    M --> W[Return Internal Server Error]
    N --> X[Send Error Response to Client]
    O --> X
    Q --> X
    R --> X
    S --> X
    T --> X
    U --> X
    V --> X
    W --> X
    D --> Y[Send Success Response to Client]
    X --> Z[Log Error for Monitoring]
    Y --> AA[Log Request for Analytics]
```

## Database Backup & Recovery Flow

```mermaid
flowchart TD
    A[Scheduled Backup Time] --> B[Check Database Connection]
    B --> C{Connection Healthy?}
    C -->|No| D[Alert Administrator]
    C -->|Yes| E[Start Backup Process]
    D --> F[Retry Connection]
    F --> B
    E --> G[Create Database Dump]
    G --> H[Compress Backup File]
    H --> I[Upload to Cloud Storage]
    I --> J[Verify Backup Integrity]
    J --> K{Backup Valid?}
    K -->|No| L[Alert Backup Failure]
    K -->|Yes| M[Update Backup Log]
    L --> N[Retry Backup Process]
    N --> E
    M --> O[Clean Old Backups]
    O --> P[Send Success Notification]
    
    Q[Recovery Request] --> R[Verify Administrator Access]
    R --> S[Select Backup to Restore]
    S --> T[Download Backup File]
    T --> U[Verify Backup Integrity]
    U --> V{Backup Valid?}
    V -->|No| W[Show Error Message]
    V -->|Yes| X[Confirm Recovery Operation]
    X --> Y[Stop Application Services]
    Y --> Z[Restore Database]
    Z --> AA[Restart Application Services]
    AA --> BB[Verify System Functionality]
    BB --> CC[Send Recovery Confirmation]
```

## API Rate Limiting Flow

```mermaid
flowchart TD
    A[Incoming API Request] --> B[Extract Client IP]
    B --> C[Check Rate Limit Window]
    C --> D[Get Current Request Count]
    D --> E{Count < Limit?}
    E -->|Yes| F[Increment Request Counter]
    E -->|No| G[Return Rate Limit Error]
    F --> H[Set/Update Window Expiry]
    H --> I[Process Request Normally]
    I --> J[Return Response]
    G --> K[Include Retry-After Header]
    K --> L[Log Rate Limit Violation]
    L --> M[Return 429 Too Many Requests]
    
    N[Reset Window Timer] --> O[Clear Request Counters]
    O --> P[Reset Window for All IPs]
```
