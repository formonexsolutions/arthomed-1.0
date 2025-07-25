const twilio = require('twilio');
const nodemailer = require('nodemailer');

// Initialize Twilio client
let twilioClient;
if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC') &&
    process.env.TWILIO_ACCOUNT_SID !== 'your-twilio-account-sid') {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (error) {
    console.warn('⚠️  Twilio initialization failed:', error.message);
    twilioClient = null;
  }
} else {
  console.warn('⚠️  Twilio credentials not configured or invalid. SMS service will not be available.');
}

// Initialize email transporter
let emailTransporter;
if (process.env.EMAIL_HOST && 
    process.env.EMAIL_USER && 
    process.env.EMAIL_PASS &&
    process.env.EMAIL_USER !== 'your-email@gmail.com') {
  try {
    emailTransporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } catch (error) {
    console.warn('⚠️  Email transporter initialization failed:', error.message);
    emailTransporter = null;
  }
} else {
  console.warn('⚠️  Email credentials not configured. Email service will not be available.');
}

/**
 * Send OTP via SMS using Twilio
 * @param {string} mobileNumber - Mobile number with country code
 * @param {string} otp - 6-digit OTP
 * @param {string} purpose - Purpose of OTP (login, registration, etc.)
 * @returns {Promise<Object>} - Twilio response or error
 */
const sendOTPViaSMS = async (mobileNumber, otp, purpose = 'login') => {
  if (!twilioClient) {
    throw new Error('SMS service not configured. Please check Twilio credentials.');
  }

  // Format mobile number for Indian numbers
  const formattedNumber = mobileNumber.startsWith('+91') ? mobileNumber : `+91${mobileNumber}`;
  
  const message = `Your Arthomed OTP for ${purpose} is: ${otp}. Valid for ${process.env.OTP_EXPIRE_MINUTES || 5} minutes. Do not share this OTP with anyone.`;

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber,
    });

    return {
      success: true,
      messageId: result.sid,
      status: result.status,
    };
  } catch (error) {
    console.error('SMS sending error:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Send OTP via Email (backup method)
 * @param {string} email - Email address
 * @param {string} otp - 6-digit OTP
 * @param {string} purpose - Purpose of OTP
 * @returns {Promise<Object>} - Email response or error
 */
const sendOTPViaEmail = async (email, otp, purpose = 'login') => {
  if (!emailTransporter) {
    throw new Error('Email service not configured.');
  }

  const subject = `Arthomed - Your OTP for ${purpose}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Arthomed Healthcare</h2>
      <p>Your OTP for ${purpose} is:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
        <h1 style="font-size: 36px; color: #1f2937; margin: 0; letter-spacing: 8px;">${otp}</h1>
      </div>
      <p style="color: #6b7280;">
        This OTP is valid for ${process.env.OTP_EXPIRE_MINUTES || 5} minutes.<br>
        Do not share this OTP with anyone for security reasons.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #9ca3af; font-size: 14px;">
        If you didn't request this OTP, please ignore this email.
      </p>
    </div>
  `;

  try {
    const result = await emailTransporter.sendMail({
      from: `"Arthomed Healthcare" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send OTP using available methods (SMS preferred, email as backup)
 * @param {Object} options - Options object
 * @param {string} options.mobileNumber - Mobile number
 * @param {string} options.email - Email address (optional)
 * @param {string} options.otp - 6-digit OTP
 * @param {string} options.purpose - Purpose of OTP
 * @returns {Promise<Object>} - Sending result
 */
const sendOTP = async ({ mobileNumber, email, otp, purpose = 'login' }) => {
  const results = [];
  
  // In development mode without proper credentials, simulate OTP sending
  if (process.env.NODE_ENV === 'development' && !twilioClient && !emailTransporter) {
    console.log(`📱 [DEV MODE] OTP for ${mobileNumber}: ${otp}`);
    return {
      success: true,
      methods: [{ method: 'console', success: true, messageId: 'dev-mode' }],
      primaryMethod: 'console',
      developmentMode: true,
    };
  }
  
  try {
    // Try SMS first (primary method)
    if (mobileNumber && twilioClient) {
      try {
        const smsResult = await sendOTPViaSMS(mobileNumber, otp, purpose);
        results.push({ method: 'sms', ...smsResult });
      } catch (smsError) {
        console.error('SMS failed:', smsError.message);
        results.push({ method: 'sms', success: false, error: smsError.message });
      }
    }
    
    // Try email as backup if SMS failed and email is available
    if (email && emailTransporter && (!results.length || !results[0].success)) {
      try {
        const emailResult = await sendOTPViaEmail(email, otp, purpose);
        results.push({ method: 'email', ...emailResult });
      } catch (emailError) {
        console.error('Email failed:', emailError.message);
        results.push({ method: 'email', success: false, error: emailError.message });
      }
    }
    
    // Check if at least one method succeeded
    const hasSuccess = results.some(result => result.success);
    
    if (!hasSuccess && results.length > 0) {
      throw new Error('Failed to send OTP via any available method');
    }
    
    if (!hasSuccess && results.length === 0) {
      throw new Error('No OTP delivery service configured. Please configure Twilio or Email service.');
    }
    
    return {
      success: true,
      methods: results,
      primaryMethod: results.find(r => r.success)?.method || 'none',
    };
    
  } catch (error) {
    throw new Error(`OTP sending failed: ${error.message}`);
  }
};

/**
 * Format mobile number for Indian numbers
 * @param {string} mobile - Mobile number
 * @returns {string} - Formatted mobile number
 */
const formatMobileNumber = (mobile) => {
  // Remove all non-digit characters
  const cleaned = mobile.replace(/\D/g, '');
  
  // Handle Indian numbers
  if (cleaned.length === 10 && cleaned.match(/^[6-9]/)) {
    return cleaned; // Return 10-digit number
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.substring(2); // Remove country code
  }
  
  if (cleaned.length === 13 && cleaned.startsWith('091')) {
    return cleaned.substring(3); // Remove country code with 0
  }
  
  return cleaned;
};

/**
 * Validate mobile number format
 * @param {string} mobile - Mobile number
 * @returns {boolean} - Is valid
 */
const isValidMobileNumber = (mobile) => {
  const formatted = formatMobileNumber(mobile);
  return /^[6-9]\d{9}$/.test(formatted);
};

/**
 * Generate a random 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  sendOTP,
  sendOTPViaSMS,
  sendOTPViaEmail,
  formatMobileNumber,
  isValidMobileNumber,
  generateOTP,
};
