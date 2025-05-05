const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Fallback nodemailer transport for development
const devTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: process.env.SMTP_PORT || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Helper to format date
const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Send email using SendGrid or fallback to nodemailer
const sendEmail = async (options) => {
  try {
    if (process.env.SENDGRID_API_KEY) {
      // Use SendGrid
      await sgMail.send({
        to: options.to,
        from: process.env.FROM_EMAIL || 'noreply@thewebvalue.com',
        subject: options.subject,
        html: options.html
      });
    } else {
      // Fallback to nodemailer
      await devTransport.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@thewebvalue.com',
        to: options.to,
        subject: options.subject,
        html: options.html
      });
    }
    logger.info(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw error;
  }
};

// Send task assignment notification
exports.sendTaskNotification = async (recipientEmail, taskDetails) => {
  const { taskId, title, description, dueDate } = taskDetails;
  const taskUrl = `${process.env.FRONTEND_URL}/tasks/${taskId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">New Task Assigned: ${title}</h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Description:</strong><br>${description}</p>
        <p><strong>Due Date:</strong><br>${formatDate(dueDate)}</p>
      </div>

      <div style="margin: 30px 0;">
        <a href="${taskUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          View Task Details
        </a>
      </div>

      <p style="color: #6c757d; font-size: 0.9em;">
        This is an automated message from the Web Value Employee Manager system.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `New Task Assigned: ${title}`,
    html
  });
};

// Send task status update notification
exports.sendStatusUpdateNotification = async (recipientEmail, taskDetails) => {
  const { taskId, title, status, updatedBy } = taskDetails;
  const taskUrl = `${process.env.FRONTEND_URL}/tasks/${taskId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Task Status Updated</h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Task:</strong> ${title}</p>
        <p><strong>New Status:</strong> ${status}</p>
        <p><strong>Updated By:</strong> ${updatedBy}</p>
      </div>

      <div style="margin: 30px 0;">
        <a href="${taskUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          View Task Details
        </a>
      </div>

      <p style="color: #6c757d; font-size: 0.9em;">
        This is an automated message from the Web Value Employee Manager system.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Task Status Updated: ${title}`,
    html
  });
};

// Send task due date reminder
exports.sendDueDateReminder = async (recipientEmail, taskDetails) => {
  const { taskId, title, dueDate } = taskDetails;
  const taskUrl = `${process.env.FRONTEND_URL}/tasks/${taskId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc3545;">Task Due Date Reminder</h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Task:</strong> ${title}</p>
        <p><strong>Due Date:</strong> ${formatDate(dueDate)}</p>
      </div>

      <div style="margin: 30px 0;">
        <a href="${taskUrl}" 
           style="background-color: #dc3545; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          View Task Details
        </a>
      </div>

      <p style="color: #6c757d; font-size: 0.9em;">
        This is an automated reminder from the Web Value Employee Manager system.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Reminder: Task Due Soon - ${title}`,
    html
  });
};

// Send welcome email to new user
exports.sendWelcomeEmail = async (recipientEmail, userDetails) => {
  const { name, temporaryPassword } = userDetails;
  const loginUrl = `${process.env.FRONTEND_URL}/login`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Welcome to Web Value Employee Manager</h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p>Hello ${name},</p>
        <p>Your account has been created in the Web Value Employee Manager system.</p>
        <p><strong>Your temporary password is:</strong> ${temporaryPassword}</p>
        <p>Please change your password after your first login.</p>
      </div>

      <div style="margin: 30px 0;">
        <a href="${loginUrl}" 
           style="background-color: #28a745; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Login to Your Account
        </a>
      </div>

      <p style="color: #6c757d; font-size: 0.9em;">
        This is an automated message from the Web Value Employee Manager system.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: 'Welcome to Web Value Employee Manager',
    html
  });
};

// Send password reset email
exports.sendPasswordResetEmail = async (recipientEmail, resetDetails) => {
  const { name, resetToken } = resetDetails;
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Password Reset Request</h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p>Hello ${name},</p>
        <p>You have requested to reset your password. Click the button below to set a new password:</p>
      </div>

      <div style="margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>

      <p style="color: #6c757d; font-size: 0.9em;">
        This link will expire in 10 minutes. If you did not request this reset, please ignore this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: 'Password Reset Request',
    html
  });
};
