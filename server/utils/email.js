const nodemailer = require('nodemailer');

// Create transporter based on environment
const createTransporter = async () => {
  // In development, use a test account or configure with real SMTP
  // In production, use environment variables for real email service
  
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Production configuration
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Development: Create a test account with Ethereal Email
    console.log('Creating Ethereal test email account...');
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('Ethereal Email Account Created:');
    console.log('  Email:', testAccount.user);
    console.log('  Password:', testAccount.pass);
    console.log('  View emails at: https://ethereal.email');
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = await createTransporter();
  
  // Build reset URL - different for local vs production
  const resetUrl = process.env.VERCEL
    ? `https://${process.env.VERCEL_URL}/reset-password/${resetToken}`
    : `http://localhost:3000/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@aliensocial.com',
    to: email,
    subject: 'AlienSocial - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #39ff14;">Password Reset Request</h2>
        <p>You requested to reset your password for your AlienSocial account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #39ff14; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p style="color: #999; font-size: 0.9em; margin-top: 30px;">
          This link will expire in 1 hour.<br>
          If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
    text: `
      Password Reset Request
      
      You requested to reset your password for your AlienSocial account.
      
      Click this link to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      If you didn't request this, please ignore this email.
    `,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    
    // For Ethereal emails, log the preview URL
    if (nodemailer.getTestMessageUrl(info)) {
      console.log('\n=== EMAIL PREVIEW (Ethereal) ===');
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('================================\n');
    }
    
    return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
};
