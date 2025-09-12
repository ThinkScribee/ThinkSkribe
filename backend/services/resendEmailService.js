import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Resend with API key
const resend = new Resend(process.env.VITE_RESEND_API_KEY);

// Email templates for unread message notifications
export const sendUnreadMessageEmail = async (recipient, sender, message, chatId) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'ThinqScribe <notifications@thinqscribe.com>',
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
              <a href="${process.env.CLIENT_URL}/chat/${recipient.role || 'user'}/${chatId}" 
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
                <a href="${process.env.CLIENT_URL}/settings" style="color: #E0B13A; text-decoration: none;">account settings</a>.
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
    });

    if (error) {
      console.error('Resend email error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

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
    const { data, error } = await resend.emails.send({
      from: 'ThinqScribe <notifications@thinqscribe.com>',
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
                  <a href="${process.env.CLIENT_URL}/chat/${recipient.role || 'user'}/${msg.chatId}" 
                     style="color: #E0B13A; text-decoration: none; font-size: 12px; font-weight: 600;">
                    View Conversation →
                  </a>
                </div>
              `).join('')}
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.CLIENT_URL}/chat" 
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
    });

    if (error) {
      console.error('Resend summary email error:', error);
      throw new Error(`Failed to send summary email: ${error.message}`);
    }

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
      from: 'ThinqScribe <notifications@thinqscribe.com>',
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
