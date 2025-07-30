import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

// Create transporter with improved configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.MAILTRAP_PORT || '2525'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
    // Increased timeout values
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
    // Connection pool settings
    pool: true,
    maxConnections: 5,
    maxMessages: 10,
    // TLS settings
    tls: {
      rejectUnauthorized: false, // only for development/testing
      ciphers: 'SSLv3'
    },
    // Additional options for better reliability
    ignoreTLS: false,
    requireTLS: false,
    // Debug for troubleshooting (remove in production)
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  });
};

let transporter = createTransporter();

// Function to recreate transporter if needed
const ensureTransporter = async () => {
  try {
    await transporter.verify();
    return transporter;
  } catch (error) {
    console.log('Recreating transporter due to verification failure:', error.message);
    transporter = createTransporter();
    return transporter;
  }
};

export const sendEmail = async ({ email, subject, text, html }) => {
  // Input validation
  if (!email || !subject) {
    throw new Error('Email and subject are required');
  }

  // Validate environment variables
  if (!process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS) {
    throw new Error('MAILTRAP_USER and MAILTRAP_PASS environment variables are required');
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Micheal" <mailtrap@demomailtrap.co>',
    to: email,
    subject,
    text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
    html: html
  };

  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      // Ensure transporter is working
      const currentTransporter = await ensureTransporter();
      
      console.log(`Attempting to send email (attempt ${retryCount + 1}/${maxRetries})`);
      
      // Send email with timeout wrapper
      const info = await Promise.race([
        currentTransporter.sendMail(mailOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Send operation timed out')), 45000)
        )
      ]);
      
      console.log('Email sent successfully:', info.messageId);
      return info;
      
    } catch (error) {
      retryCount++;
      console.error(`Email send attempt ${retryCount} failed:`, error.message);
      
      if (retryCount >= maxRetries) {
        // Log detailed error information
        console.error('All email send attempts failed. Final error:', {
          message: error.message,
          code: error.code,
          command: error.command,
          response: error.response,
          responseCode: error.responseCode
        });
        
        // Provide more specific error messages
        if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
          throw new Error('Email service timeout - please check your internet connection and try again');
        } else if (error.code === 'EAUTH') {
          throw new Error('Email authentication failed - please check your Mailtrap credentials');
        } else if (error.code === 'ECONNECTION') {
          throw new Error('Cannot connect to email service - please check your network connection');
        } else {
          throw new Error(`Failed to send email: ${error.message}`);
        }
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export const sendVerificationEmail = async (user, verificationToken) => {
  if (!user || !user.email || !user.name || !verificationToken) {
    throw new Error('User information and verification token are required');
  }

  if (!process.env.CLIENT_URL) {
    throw new Error('CLIENT_URL environment variable is required');
  }

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8F9FA; border-radius: 8px; overflow: hidden;">
      <!-- Email Header -->
      <div style="background-color: #0D1B2A; padding: 24px; text-align: center;">
        <h1 style="color: #E0B13A; margin: 0; font-size: 24px; font-weight: 700;">Edusage Email Verification</h1>
      </div>
      
      <!-- Email Body -->
      <div style="padding: 32px;">
        <h2 style="color: #0D1B2A; margin-top: 0; font-size: 20px;">Hello ${user.name},</h2>
        
        <p style="color: #415A77; line-height: 1.6; margin-bottom: 24px;">
          Thank you for creating an account with ThinkScribe! To complete your registration and unlock full access to our academic services, please verify your email address.
        </p>
        
        <!-- Verification Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" 
             style="display: inline-block; padding: 14px 28px; background-color: #E0B13A; 
                    color: #0D1B2A; text-decoration: none; border-radius: 6px; 
                    font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
            Verify Email Address
          </a>
        </div>
        
        <!-- Alternative Link -->
        <p style="color: #415A77; font-size: 14px; margin-bottom: 8px;">
          Or copy and paste this link into your browser:
        </p>
        <div style="background-color: #E6ECF4; padding: 12px; border-radius: 4px; margin-bottom: 24px; word-break: break-all;">
          <code style="color: #0D1B2A; font-size: 13px;">${verifyUrl}</code>
        </div>
        
        <!-- Academic Benefits -->
        <div style="background-color: #FFFFFF; border-left: 4px solid #E0B13A; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
          <h3 style="color: #0D1B2A; margin-top: 0; font-size: 16px;">Why verify your email?</h3>
          <ul style="color: #415A77; padding-left: 20px; margin-bottom: 0;">
            <li style="margin-bottom: 8px;">Access to expert academic writers</li>
            <li style="margin-bottom: 8px;">Use of premium AI writing tools</li>
            <li>Secure communication with your assigned writer</li>
          </ul>
        </div>
      </div>
      
      <!-- Email Footer -->
      <div style="background-color: #E6ECF4; padding: 20px; text-align: center; font-size: 12px; color: #415A77;">
        <p style="margin: 0;">
          If you didn't create an Edusage account, please ignore this email or contact our 
          <a href="mailto:support@ThinkScribe.com" style="color: #E0B13A; text-decoration: none;">support team</a>.
        </p>
        <p style="margin: 8px 0 0 0;">
          © ${new Date().getFullYear()} ThinkScribe. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify Your ThinkScribe Account',
      html: html
    });
    console.log(`Verification email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send verification email:', error.message);
    throw error;
  }
};

export const sendPasswordResetEmail = async (user, resetToken) => {
  if (!user || !user.email || !user.name || !resetToken) {
    throw new Error('User information and reset token are required');
  }

  if (!process.env.CLIENT_URL) {
    throw new Error('CLIENT_URL environment variable is required');
  }

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8F9FA; border-radius: 8px; overflow: hidden;">
      <!-- Email Header -->
      <div style="background-color: #0D1B2A; padding: 24px; text-align: center;">
        <h1 style="color: #E0B13A; margin: 0; font-size: 24px; font-weight: 700;">Password Reset Request</h1>
      </div>
      
      <!-- Email Body -->
      <div style="padding: 32px;">
        <h2 style="color: #0D1B2A; margin-top: 0; font-size: 20px;">Hello ${user.name},</h2>
        
        <p style="color: #415A77; line-height: 1.6; margin-bottom: 24px;">
          We received a request to reset your ThinkScribe account password. Click the button below to create a new secure password.
        </p>
        
        <!-- Reset Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 14px 28px; background-color: #E0B13A; 
                    color: #0D1B2A; text-decoration: none; border-radius: 6px; 
                    font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
            Reset Password
          </a>
        </div>
        
        <!-- Alternative Link -->
        <p style="color: #415A77; font-size: 14px; margin-bottom: 8px;">
          Or copy and paste this link into your browser:
        </p>
        <div style="background-color: #E6ECF4; padding: 12px; border-radius: 4px; margin-bottom: 24px; word-break: break-all;">
          <code style="color: #0D1B2A; font-size: 13px;">${resetUrl}</code>
        </div>
        
        <!-- Security Notice -->
        <div style="background-color: #FFF4E6; border-left: 4px solid #E0B13A; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
          <h3 style="color: #0D1B2A; margin-top: 0; font-size: 16px;">Security Notice</h3>
          <ul style="color: #415A77; padding-left: 20px; margin-bottom: 0;">
            <li style="margin-bottom: 8px;">This link expires in 10 minutes</li>
            <li style="margin-bottom: 8px;">Never share your password with anyone</li>
            <li>Edusage staff will never ask for your password</li>
          </ul>
        </div>
        
        <p style="color: #415A77; line-height: 1.6;">
          If you didn't request this password reset, please secure your account by changing your password immediately or contacting our support team.
        </p>
      </div>
      
      <!-- Email Footer -->
      <div style="background-color: #E6ECF4; padding: 20px; text-align: center; font-size: 12px; color: #415A77;">
        <p style="margin: 0;">
          Need help? Contact our <a href="mailto:support@ThinkScribe.com" style="color: #E0B13A; text-decoration: none;">support team</a>.
        </p>
        <p style="margin: 8px 0 0 0;">
          © ${new Date().getFullYear()} Edusage. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Edusage Password Reset - Action Required',
      html: html
    });
    console.log(`Password reset email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error.message);
    throw error;
  }
};