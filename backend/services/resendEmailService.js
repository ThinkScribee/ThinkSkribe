import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

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

// Get API key with multiple fallbacks for different environments
const apiKey =  process.env.RESEND_API_KEY 

// Debug logging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Environment check:');
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
  console.log('Using API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
}

// Initialize Resend with API key
const resend = new Resend(apiKey);

// Email templates for unread message notifications
export const sendUnreadMessageEmail = async (recipient, sender, message, chatId) => {
  try {
    const emailData = {
      from: 'ThinqScribe <noreply@thinqscribe.com>',
      to: [recipient.email],
      subject: `New unread message from ${sender.name} - ThinqScribe`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8F9FA; border-radius: 8px; overflow: hidden;">
          <!-- Email Header -->
          <div style="background-color: #0D1B2A; padding: 24px; text-align: center;">
            <h1 style="color: #E0B13A; margin: 0; font-size: 24px; font-weight: 700;">New Message from ${sender.name}</h1>
          </div>
          
          <!-- Email Body -->
          <div style="padding: 32px;">
            <h2 style="color: #0D1B2A; margin-top: 0; font-size: 20px;">Hello ${recipient.name},</h2>
            
            <p style="color: #415A77; line-height: 1.6; margin-bottom: 24px;">
              You have received a new message from <strong>${sender.name}</strong> that you haven't read yet.
            </p>
            
            <!-- Message Preview -->
            <div style="background-color: #FFFFFF; border: 1px solid #E6ECF4; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #0D1B2A; margin-top: 0; font-size: 16px;">Message Preview:</h3>
              <p style="color: #415A77; line-height: 1.6; margin-bottom: 0; font-style: italic;">
                "${message.content.length > 150 ? message.content.substring(0, 150) + '...' : message.content}"
              </p>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://thinqscribe.com/chat/${recipient.role || 'user'}/${chatId}" 
                 style="display: inline-block; padding: 14px 28px; background-color: #E0B13A; 
                        color: #0D1B2A; text-decoration: none; border-radius: 6px; 
                        font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
                View Message
              </a>
            </div>
            
            <!-- Notification Settings -->
            <div style="background-color: #E6ECF4; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
              <h3 style="color: #0D1B2A; margin-top: 0; font-size: 14px;">Notification Settings</h3>
              <p style="color: #415A77; font-size: 12px; margin-bottom: 0;">
                You can manage your email notification preferences in your 
                <a href="https://thinqscribe.com" style="color: #E0B13A; text-decoration: none;">account settings</a>.
              </p>
            </div>
          </div>
          
          <!-- Email Footer -->
          <div style="background-color: #E6ECF4; padding: 20px; text-align: center; font-size: 12px; color: #415A77;">
            <p style="margin: 0;">
              This is an automated notification from ThinqScribe. 
              <a href="mailto:support@thinqscribe.com" style="color: #E0B13A; text-decoration: none;">Contact support</a> if you have any questions.
            </p>
            <p style="margin: 8px 0 0 0;">
              © ${new Date().getFullYear()} ThinqScribe. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const data = await sendEmailWithRetry(emailData);
    console.log('Unread message email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending unread message email:', error);
    throw error;
  }
};

// Email for multiple unread messages summary
export const sendUnreadMessagesSummaryEmail = async (recipient, unreadMessages) => {
  try {
    const emailData = {
      from: 'ThinqScribe <noreply@thinqscribe.com>',
      to: [recipient.email],
      subject: `You have ${unreadMessages.length} unread messages - ThinqScribe`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8F9FA; border-radius: 8px; overflow: hidden;">
          <!-- Email Header -->
          <div style="background-color: #0D1B2A; padding: 24px; text-align: center;">
            <h1 style="color: #E0B13A; margin: 0; font-size: 24px; font-weight: 700;">${unreadMessages.length} Unread Messages</h1>
          </div>
          
          <!-- Email Body -->
          <div style="padding: 32px;">
            <h2 style="color: #0D1B2A; margin-top: 0; font-size: 20px;">Hello ${recipient.name},</h2>
            
            <p style="color: #415A77; line-height: 1.6; margin-bottom: 24px;">
              You have <strong>${unreadMessages.length}</strong> unread messages from different conversations.
            </p>
            
            <!-- Messages List -->
            <div style="margin: 24px 0;">
              ${unreadMessages.map(msg => `
                <div style="background-color: #FFFFFF; border: 1px solid #E6ECF4; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h3 style="color: #0D1B2A; margin: 0; font-size: 14px;">From: ${msg.sender.name}</h3>
                    <span style="color: #415A77; font-size: 12px;">${new Date(msg.timestamp).toLocaleString()}</span>
                  </div>
                  <p style="color: #415A77; line-height: 1.4; margin: 0; font-size: 13px;">
                    ${msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content}
                  </p>
                  <a href="https://thinqscribe.com/chat/${recipient.role || 'user'}/${msg.chatId}" 
                     style="color: #E0B13A; text-decoration: none; font-size: 12px; font-weight: 600;">
                    View Conversation →
                  </a>
                </div>
              `).join('')}
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://thinqscribe.com/chat" 
                 style="display: inline-block; padding: 14px 28px; background-color: #E0B13A; 
                        color: #0D1B2A; text-decoration: none; border-radius: 6px; 
                        font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
                View All Messages
              </a>
            </div>
          </div>
          
          <!-- Email Footer -->
          <div style="background-color: #E6ECF4; padding: 20px; text-align: center; font-size: 12px; color: #415A77;">
            <p style="margin: 0;">
              This is an automated notification from ThinqScribe. 
              <a href="mailto:support@thinqscribe.com" style="color: #E0B13A; text-decoration: none;">Contact support</a> if you have any questions.
            </p>
            <p style="margin: 8px 0 0 0;">
              © ${new Date().getFullYear()} ThinqScribe. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const data = await sendEmailWithRetry(emailData);
    console.log('Unread messages summary email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending unread messages summary email:', error);
    throw error;
  }
};

// Test email functionality
export const testResendConnection = async () => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'ThinqScribe <noreply@thinqscribe.com>',
      to: ['test@example.com'],
      subject: 'Test Email from ThinqScribe',
      html: '<p>This is a test email to verify Resend integration.</p>',
    });

    if (error) {
      console.error('Resend test failed:', error);
      return false;
    }

    console.log('Resend test successful:', data);
    return true;
  } catch (error) {
    console.error('Resend test error:', error);
    return false;
  }
};
