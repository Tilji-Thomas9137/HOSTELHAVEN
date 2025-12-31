import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send email with login credentials
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.username - Username
 * @param {string} options.password - Temporary password
 * @param {string} options.role - User role
 * @param {boolean} options.isNewLink - If true, this is a notification for linking existing parent to new student
 * @param {string} options.studentName - Name of the student (for parent emails)
 * @returns {Promise} Email send result
 */
export const sendLoginCredentials = async ({ to, name, username, password, role, isNewLink = false, studentName = null }) => {
  try {
    const mailOptions = {
      from: `"HostelHaven" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Your HostelHaven Login Credentials',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .credential-item { margin: 10px 0; }
            .label { font-weight: bold; color: #667eea; }
            .value { font-family: monospace; font-size: 16px; color: #333; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to HostelHaven!</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              
              ${isNewLink 
                ? `<p>We're pleased to inform you that <strong>${studentName}</strong> has been linked to your parent account in HostelHaven. You can now access their information through your parent dashboard.</p>`
                : `<p>Your account has been created successfully in the HostelHaven Smart Hostel Management System. Please find your login credentials below:</p>`
              }
              
              ${!isNewLink ? `
              <div class="credentials">
                <div class="credential-item">
                  <span class="label">Username:</span>
                  <div class="value" style="font-size: 18px; font-weight: 600; letter-spacing: 1px;">${username}</div>
                </div>
                <div class="credential-item">
                  <span class="label">Temporary Password:</span>
                  <div class="value" style="font-size: 18px; font-weight: 600; letter-spacing: 1px; color: #e74c3c;">${password}</div>
                </div>
                <div class="credential-item">
                  <span class="label">Role:</span>
                  <div class="value">${role.charAt(0).toUpperCase() + role.slice(1)}</div>
                </div>
              </div>
              ` : `
              <div class="credentials">
                <div class="credential-item">
                  <span class="label">Your Username:</span>
                  <div class="value" style="font-size: 18px; font-weight: 600;">${username}</div>
                </div>
                <div class="credential-item">
                  <span class="label">Password:</span>
                  <div class="value">Use your existing password to log in</div>
                </div>
              </div>
              `}
              
              ${!isNewLink ? `
              <div class="warning">
                <strong>⚠️ Important Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This is a temporary password. You <strong>must</strong> change it on your first login.</li>
                  <li>Keep your login credentials secure and do not share them with anyone.</li>
                  <li>If you forget your password, you can reset it using the "Forgot Password" link on the login page.</li>
                </ul>
              </div>
              ` : ''}
              
              <p style="margin-top: 20px;">You can now log in to the HostelHaven system using the credentials above.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login" class="button" style="text-decoration: none; padding: 14px 35px; font-size: 16px; font-weight: 600; display: inline-block;">Login to HostelHaven</a>
              </div>
              
              ${!isNewLink ? `
              <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
                <h3 style="margin-top: 0; color: #2980b9;">📧 Need to Reset Your Password?</h3>
                <p style="margin-bottom: 10px;">If you need to reset your password in the future:</p>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Go to the login page</li>
                  <li>Click on "Forgot Password"</li>
                  <li>Enter your email address (${to})</li>
                  <li>Check your email for the reset link</li>
                  <li>Follow the instructions to set a new password</li>
                </ol>
              </div>
              ` : ''}
              
              <div class="footer">
                <p style="margin: 5px 0;"><strong>Welcome to HostelHaven!</strong></p>
                <p style="margin: 5px 0;">If you have any questions or need assistance, please contact the administrator.</p>
                <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">If you did not create this account or received this email in error, please contact the administrator immediately.</p>
                <p style="margin: 5px 0; color: #999; font-size: 11px;">&copy; ${new Date().getFullYear()} HostelHaven - Smart Hostel Management System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to HostelHaven!
        
        Dear ${name},
        
        ${isNewLink 
          ? `We're pleased to inform you that ${studentName || 'a student'} has been linked to your parent account in HostelHaven. You can now access their information through your parent dashboard.`
          : `Your account has been created successfully in the HostelHaven Smart Hostel Management System. Please find your login credentials below:`
        }
        
        ${!isNewLink ? `
        Username: ${username}
        Temporary Password: ${password}
        Role: ${role.charAt(0).toUpperCase() + role.slice(1)}
        
        ⚠️ Important Security Notice:
        - This is a temporary password. You MUST change it on your first login.
        - Keep your login credentials secure and do not share them with anyone.
        - If you forget your password, you can reset it using the "Forgot Password" link on the login page.
        ` : `
        Your Username: ${username}
        Password: Use your existing password to log in
        `}
        
        Login URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login
        
        ${!isNewLink ? `
        Need to Reset Your Password?
        1. Go to the login page
        2. Click on "Forgot Password"
        3. Enter your email address (${to})
        4. Check your email for the reset link
        5. Follow the instructions to set a new password
        ` : ''}
        
        Welcome to HostelHaven!
        If you have any questions or need assistance, please contact the administrator.
        
        If you did not create this account or received this email in error, please contact the administrator immediately.
        
        © ${new Date().getFullYear()} HostelHaven - Smart Hostel Management System. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    // Parse error details for better error messages
    let errorMessage = error.message;
    let errorCode = null;
    
    // Check for SMTP error codes
    if (error.response) {
      errorCode = error.responseCode;
      const responseText = error.response.toString();
      
      // Common SMTP error codes
      if (responseText.includes('550') || responseText.includes('5.1.1')) {
        errorMessage = `Email address "${to}" does not exist or is unable to receive mail. Please verify the email address is correct.`;
      } else if (responseText.includes('551') || responseText.includes('5.1.2')) {
        errorMessage = `Email address "${to}" is not a valid recipient.`;
      } else if (responseText.includes('552') || responseText.includes('5.2.2')) {
        errorMessage = `Mailbox for "${to}" is full and cannot accept new messages.`;
      } else if (responseText.includes('553') || responseText.includes('5.1.3')) {
        errorMessage = `Email address "${to}" is not valid.`;
      } else if (responseText.includes('554')) {
        errorMessage = `Email delivery failed for "${to}". The message was rejected.`;
      }
    }
    
    // Check for connection/auth errors
    if (error.code === 'EAUTH' || error.code === 'ECONNECTION') {
      errorMessage = `Email service configuration error. Please contact the administrator.`;
    }
    
    return { 
      success: false, 
      error: errorMessage,
      errorCode: errorCode,
      originalError: error.message
    };
  }
};

/**
 * Send password reset email
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.resetToken - Password reset token
 * @returns {Promise} Email send result
 */
export const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      const errorMsg = 'SMTP credentials not configured';
      console.error('❌', errorMsg);
      return { success: false, error: errorMsg };
    }

    // Verify transporter connection
    try {
      await transporter.verify();
      console.log('✅ SMTP server connection verified');
    } catch (verifyError) {
      console.error('❌ SMTP server connection failed:', verifyError.message);
      return { 
        success: false, 
        error: `SMTP connection failed: ${verifyError.message}` 
      };
    }

    // Default to port 3000 (standard Vite dev server port)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"HostelHaven" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              
              <p>We received a request to reset your password. Click the button below to reset it:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 10 minutes. If you did not request a password reset, please ignore this email.
              </div>
              
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} HostelHaven. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', info.messageId);
    console.log('   To:', to);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    console.error('   Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Provide more detailed error messages
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP authentication failed. Please check your email credentials.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to SMTP server. Please check your SMTP settings.';
    } else if (error.responseCode === 550) {
      errorMessage = `Email address "${to}" does not exist or is unable to receive mail.`;
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Send notification email
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email message
 * @returns {Promise} Email send result
 */
export const sendNotificationEmail = async ({ to, subject, message }) => {
  try {
    const mailOptions = {
      from: `"HostelHaven" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              ${message}
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} HostelHaven. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: message.replace(/<[^>]*>/g, ''),
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending notification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send outpass exit/return notification email to parent
 * @param {object} options - Email options
 * @param {string} options.to - Parent email
 * @param {string} options.parentName - Parent name
 * @param {string} options.studentName - Student name
 * @param {string} options.studentId - Student ID
 * @param {string} options.type - 'exit' or 'return'
 * @param {Date} options.time - Exit or return time
 * @param {string} options.destination - Destination
 * @param {string} options.purpose - Purpose of outing
 * @returns {Promise} Email send result
 */
export const sendOutpassNotification = async ({ 
  to, 
  parentName, 
  studentName, 
  studentId, 
  type, 
  time, 
  destination, 
  purpose,
  departureDate,
  expectedReturnDate,
  emergencyContact
}) => {
  try {
    const timeStr = new Date(time).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const isExit = type === 'exit';
    const subject = isExit 
      ? `Your child ${studentName} has left the hostel`
      : `Your child ${studentName} has returned to the hostel`;
    
    const actionText = isExit ? 'left' : 'returned to';
    const color = isExit ? '#f59e0b' : '#10b981';
    const icon = isExit ? '🚪' : '🏠';

    const mailOptions = {
      from: `"HostelHaven" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${color}; }
            .time-box { background: ${color}; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; font-size: 18px; font-weight: bold; }
            .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            table { width: 100%; margin: 10px 0; }
            table td { padding: 8px; border-bottom: 1px solid #eee; }
            table td:first-child { font-weight: bold; width: 40%; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${icon} Outpass ${isExit ? 'Exit' : 'Return'} Notification</h1>
            </div>
            <div class="content">
              <p>Dear ${parentName},</p>
              
              <p>This is to inform you that your child <strong>${studentName}</strong> (ID: ${studentId}) has ${actionText} the hostel.</p>
              
              <div class="time-box">
                ${isExit ? 'Exit' : 'Return'} Time: ${timeStr}
              </div>
              
              <div class="details">
                <table>
                  <tr>
                    <td>Student Name:</td>
                    <td>${studentName}</td>
                  </tr>
                  <tr>
                    <td>Student ID:</td>
                    <td>${studentId}</td>
                  </tr>
                  <tr>
                    <td>Destination:</td>
                    <td>${destination || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Purpose:</td>
                    <td>${purpose || 'N/A'}</td>
                  </tr>
                  ${departureDate ? `
                  <tr>
                    <td>Departure Date:</td>
                    <td>${new Date(departureDate).toLocaleString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                  ` : ''}
                  ${expectedReturnDate ? `
                  <tr>
                    <td>Expected Return Date:</td>
                    <td>${new Date(expectedReturnDate).toLocaleString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td>${isExit ? 'Exit' : 'Return'} Time:</td>
                    <td>${timeStr}</td>
                  </tr>
                  ${emergencyContact ? `
                  <tr>
                    <td>Emergency Contact:</td>
                    <td>${emergencyContact.name || 'N/A'} - ${emergencyContact.phone || 'N/A'}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              ${isExit ? `
                <div class="info-box">
                  <p><strong>Note:</strong> Your child is expected to return by the approved return date. You will receive another notification when they return to the hostel.</p>
                </div>
              ` : `
                <div class="info-box" style="border-left-color: #10b981;">
                  <p><strong>Note:</strong> Your child has safely returned to the hostel.</p>
                </div>
              `}
              
              <p>If you have any concerns, please contact the hostel administration.</p>
              
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} HostelHaven. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `${subject}\n\nDear ${parentName},\n\nThis is to inform you that your child ${studentName} (ID: ${studentId}) has ${actionText} the hostel at ${timeStr}.\n\nDestination: ${destination || 'N/A'}\nPurpose: ${purpose || 'N/A'}\n\nIf you have any concerns, please contact the hostel administration.\n\n© ${new Date().getFullYear()} HostelHaven. All rights reserved.`,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending outpass notification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send fee notification email to student
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Student name
 * @param {string} options.feeType - Type of fee (e.g., "Mess Fee", "Room Fee")
 * @param {number} options.amount - Fee amount
 * @param {Date} options.dueDate - Due date
 * @param {string} options.month - Month name (optional)
 * @param {number} options.year - Year (optional)
 * @param {number} options.daysPresent - Number of days present (for mess fees)
 * @param {number} options.dailyRate - Daily rate (for mess fees)
 * @returns {Promise} Email send result
 */
export const sendFeeNotification = async ({ to, name, feeType, amount, dueDate, month = null, year = null, daysPresent = null, dailyRate = null }) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const paymentUrl = `${frontendUrl}/app/student/payments`;
    
    const dueDateStr = new Date(dueDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const mailOptions = {
      from: `"HostelHaven" <${process.env.SMTP_USER}>`,
      to,
      subject: `Fee Generated: ${feeType} - ₹${amount.toLocaleString('en-IN')}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .fee-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
            .fee-amount { font-size: 32px; font-weight: bold; color: #667eea; margin: 10px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            table { width: 100%; margin: 20px 0; }
            table td { padding: 8px; border-bottom: 1px solid #eee; }
            table td:first-child { font-weight: bold; width: 40%; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fee Generated</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              
              <p>A new fee has been generated for your account:</p>
              
              <div class="fee-details">
                <table>
                  <tr>
                    <td>Fee Type:</td>
                    <td>${feeType}</td>
                  </tr>
                  <tr>
                    <td>Amount:</td>
                    <td class="fee-amount">₹${amount.toLocaleString('en-IN')}</td>
                  </tr>
                  ${month ? `<tr><td>Month:</td><td>${month} ${year}</td></tr>` : ''}
                  ${daysPresent !== null ? `<tr><td>Days Present:</td><td>${daysPresent} days</td></tr>` : ''}
                  ${dailyRate !== null ? `<tr><td>Daily Rate:</td><td>₹${dailyRate.toLocaleString('en-IN')}/day</td></tr>` : ''}
                  <tr>
                    <td>Due Date:</td>
                    <td>${dueDateStr}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center;">
                <a href="${paymentUrl}" class="button">Pay Now</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Reminder:</strong> Please make the payment before the due date to avoid late fees.
              </div>
              
              <p>You can view and pay your fees by logging into your HostelHaven dashboard.</p>
              
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} HostelHaven. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Fee notification email sent to ${to}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending fee notification email to ${to}:`, error);
    return { success: false, error: error.message };
  }
};

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP configuration error:', error);
  } else {
    console.log('✅ SMTP server is ready to send emails');
  }
});

