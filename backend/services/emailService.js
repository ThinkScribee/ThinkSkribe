import dotenv from 'dotenv';
dotenv.config();
import { Resend } from 'resend';

// Rate limiting configuration
const EMAIL_RATE_LIMIT = 2; // 2 emails per second
const EMAIL_INTERVAL = 1000 / EMAIL_RATE_LIMIT; // 500ms between emails
let lastEmailTime = 0;

// Rate limiting function
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastEmail = now - lastEmailTime;
  
  if (timeSinceLastEmail < EMAIL_INTERVAL) {
    const waitTime = EMAIL_INTERVAL - timeSinceLastEmail;
    console.log(`⏳ Rate limiting: waiting ${waitTime}ms before sending next email`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastEmailTime = Date.now();
};

// Retry logic with exponential backoff
const sendEmailWithRetry = async (emailData, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await waitForRateLimit();
      
      const { data, error } = await resend.emails.send(emailData);
      
      if (error) {
        if (error.name === 'rate_limit_exceeded' && attempt < maxRetries) {
          const backoffTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Rate limit hit, retrying in ${backoffTime}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error.name === 'rate_limit_exceeded' && attempt < maxRetries) {
        const backoffTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Rate limit error, retrying in ${backoffTime}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }
      
      if (attempt === maxRetries) {
        console.error(`❌ Email failed after ${maxRetries} attempts:`, error.message);
        throw error;
      }
    }
  }
};

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY;

console.log('🔍 [EmailService] Initializing email service...');
console.log('🔍 [EmailService] RESEND_API_KEY exists:', !!resendApiKey);
console.log('🔍 [EmailService] RESEND_API_KEY length:', resendApiKey ? resendApiKey.length : 0);

if (!resendApiKey) {
  console.error('❌ RESEND_API_KEY not found in environment variables');
  console.error('❌ This will cause email sending to fail');
  console.error('❌ Please add RESEND_API_KEY to your environment variables');
  // Don't throw error here, let it fail gracefully when trying to send emails
}

let resend = null;
if (resendApiKey) {
  try {
    resend = new Resend(resendApiKey);
    console.log('✅ Resend email service initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Resend:', error.message);
  }
} else {
  console.warn('⚠️ Resend not initialized - email sending will fail');
}

// Main email sending function
export const sendEmail = async ({ email, subject, text, html }) => {
  // Input validation
  if (!email || !subject) {
    throw new Error('Email and subject are required');
  }

  // Check if resend is initialized
  if (!resend) {
    console.error('❌ Resend service not initialized - RESEND_API_KEY missing');
    throw new Error('Email service is not configured. Please contact support.');
  }

  try {
    console.log('📧 Sending email via Resend to:', email);
    console.log('📧 Subject:', subject);
    
    const emailData = {
      from: 'ThinqScribe <noreply@thinqscribe.com>',
      to: [email],
      subject,
      html: html || text,
      text: text || (html ? html.replace(/<[^>]*>/g, '') : '')
    };

    const data = await sendEmailWithRetry(emailData);
    console.log('✅ Email sent successfully via Resend:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.error('❌ Error details:', error);
    throw error;
  }
};

// Email verification function
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
        <h1 style="color: #E0B13A; margin: 0; font-size: 24px; font-weight: 700;">ThinqScribe Email Verification</h1>
      </div>
      
      <!-- Email Body -->
      <div style="padding: 32px;">
        <h2 style="color: #0D1B2A; margin-top: 0; font-size: 20px;">Hello ${user.name},</h2>
        
        <p style="color: #415A77; line-height: 1.6; margin-bottom: 24px;">
          Thank you for creating an account with ThinqScribe! To complete your registration and unlock full access to our academic services, please verify your email address.
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
          If you didn't create a ThinqScribe account, please ignore this email or contact our 
          <a href="mailto:support@thinqscribe.com" style="color: #E0B13A; text-decoration: none;">support team</a>.
        </p>
        <p style="margin: 8px 0 0 0;">
          © ${new Date().getFullYear()} ThinqScribe. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify Your ThinqScribe Account',
      html: html
    });
    console.log(`✅ Verification email sent to ${user.email}`);
  } catch (error) {
    console.error('❌ Failed to send verification email:', error.message);
    throw error;
  }
};

// Password reset email function
export const sendPasswordResetEmail = async (user, resetToken) => {
  if (!user || !user.email || !user.name || !resetToken) {
    throw new Error('User information and reset token are required');
  }

  // Force production URL for password reset
  const resetUrl = `https://thinqscribe.com/reset-password/${resetToken}`;
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
          We received a request to reset your ThinqScribe account password. Click the button below to create a new secure password.
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
            <li>ThinqScribe staff will never ask for your password</li>
          </ul>
        </div>
        
        <p style="color: #415A77; line-height: 1.6;">
          If you didn't request this password reset, please secure your account by changing your password immediately or contacting our support team.
        </p>
      </div>
      
      <!-- Email Footer -->
      <div style="background-color: #E6ECF4; padding: 20px; text-align: center; font-size: 12px; color: #415A77;">
        <p style="margin: 0;">
          Need help? Contact our <a href="mailto:support@thinqscribe.com" style="color: #E0B13A; text-decoration: none;">support team</a>.
        </p>
        <p style="margin: 8px 0 0 0;">
          © ${new Date().getFullYear()} ThinqScribe. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'ThinqScribe Password Reset - Action Required',
      html: html
    });
    console.log(`✅ Password reset email sent to ${user.email}`);
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error.message);
    throw error;
  }
};

// Welcome email function
export const sendWelcomeEmail = async (user) => {
  if (!user || !user.email || !user.name) {
    throw new Error('User information is required');
  }

  if (!process.env.CLIENT_URL) {
    throw new Error('CLIENT_URL environment variable is required');
  }

  const dashboardUrl = `${process.env.CLIENT_URL}/dashboard`;
  const writersUrl = `${process.env.CLIENT_URL}/writers`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8F9FA; border-radius: 8px; overflow: hidden;">
      <!-- Email Header -->
      <div style="background-color: #0D1B2A; padding: 24px; text-align: center;">
        <h1 style="color: #E0B13A; margin: 0; font-size: 24px; font-weight: 700;">Welcome to ThinqScribe!</h1>
      </div>
      
      <!-- Email Body -->
      <div style="padding: 32px;">
        <h2 style="color: #0D1B2A; margin-top: 0; font-size: 20px;">Hello ${user.name},</h2>
        
        <p style="color: #415A77; line-height: 1.6; margin-bottom: 24px;">
          Welcome to ThinqScribe! Your account has been created successfully. We're excited to help you achieve your academic goals with our expert writers and AI-powered tools.
        </p>
        
        <!-- Get Started Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${dashboardUrl}" 
             style="display: inline-block; padding: 14px 28px; background-color: #E0B13A; 
                    color: #0D1B2A; text-decoration: none; border-radius: 6px; 
                    font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
            Go to Dashboard
          </a>
        </div>
        
        <!-- What's Next Section -->
        <div style="background-color: #FFFFFF; border-left: 4px solid #E0B13A; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
          <h3 style="color: #0D1B2A; margin-top: 0; font-size: 16px;">What's Next?</h3>
          <ul style="color: #415A77; padding-left: 20px; margin-bottom: 0;">
            <li style="margin-bottom: 8px;">Browse our expert academic writers</li>
            <li style="margin-bottom: 8px;">Access AI writing tools and grammar checker</li>
            <li style="margin-bottom: 8px;">Start your first project with confidence</li>
            <li>Get 24/7 support from our team</li>
          </ul>
        </div>
        
        <!-- Quick Links -->
        <div style="text-align: center; margin: 24px 0;">
          <a href="${writersUrl}" 
             style="display: inline-block; padding: 10px 20px; background-color: #0D1B2A; 
                    color: #E0B13A; text-decoration: none; border-radius: 4px; 
                    font-weight: 500; font-size: 14px; margin: 0 8px;">
            Browse Writers
          </a>
          <a href="${process.env.CLIENT_URL}/grammar-checker" 
             style="display: inline-block; padding: 10px 20px; background-color: #0D1B2A; 
                    color: #E0B13A; text-decoration: none; border-radius: 4px; 
                    font-weight: 500; font-size: 14px; margin: 0 8px;">
            AI Tools
          </a>
        </div>
        
        <p style="color: #415A77; line-height: 1.6;">
          If you have any questions or need assistance, don't hesitate to contact our support team. We're here to help you succeed!
        </p>
      </div>
      
      <!-- Email Footer -->
      <div style="background-color: #E6ECF4; padding: 20px; text-align: center; font-size: 12px; color: #415A77;">
        <p style="margin: 0;">
          Need help? Contact our <a href="mailto:support@thinqscribe.com" style="color: #E0B13A; text-decoration: none;">support team</a>.
        </p>
        <p style="margin: 8px 0 0 0;">
          © ${new Date().getFullYear()} ThinqScribe. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Welcome to ThinqScribe - Your Academic Success Partner!',
      html: html
    });
    console.log(`✅ Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.message);
    throw error;
  }
};

// Test email service function
export const testEmailService = async (testEmail = 'test@example.com') => {
  try {
    const testHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8F9FA; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0D1B2A; padding: 24px; text-align: center;">
          <h1 style="color: #E0B13A; margin: 0; font-size: 24px; font-weight: 700;">Email Service Test</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #0D1B2A; margin-top: 0; font-size: 20px;">Test Successful!</h2>
          <p style="color: #415A77; line-height: 1.6;">
            This is a test email to verify that the ThinqScribe email service is working correctly.
          </p>
        </div>
        <div style="background-color: #E6ECF4; padding: 20px; text-align: center; font-size: 12px; color: #415A77;">
          <p style="margin: 0;">© ${new Date().getFullYear()} ThinqScribe. All rights reserved.</p>
        </div>
      </div>
    `;

    const result = await sendEmail({
      email: testEmail,
      subject: 'ThinqScribe Email Service Test',
      html: testHtml
    });

    console.log('✅ Email service test successful:', result);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
    return { success: false, error: error.message };
  }
};
