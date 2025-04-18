
const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, purpose) => {
  try {
    const transporter = createTransporter();
    
    let subject, text, html;
    
    if (purpose === 'password_reset') {
      subject = 'Password Reset OTP - Immersive Homes';
      text = `Your OTP for password reset is: ${otp}. This OTP is valid for 1 hour.`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Immersive Homes</h2>
          <h3 style="color: #555;">Password Reset Request</h3>
          <p>We received a request to reset your password. Use the OTP below to complete the process:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${otp}
          </div>
          <p style="margin-top: 20px;">This OTP is valid for 1 hour. If you didn't request a password reset, please ignore this email.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #777; text-align: center;">
            © ${new Date().getFullYear()} Immersive Homes. All rights reserved.
          </p>
        </div>
      `;
    } else if (purpose === 'email_verification') {
      subject = 'Email Verification OTP - Immersive Homes';
      text = `Your OTP for email verification is: ${otp}. This OTP is valid for 1 hour.`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Immersive Homes</h2>
          <h3 style="color: #555;">Email Verification</h3>
          <p>Thank you for registering! Use the OTP below to verify your email address:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${otp}
          </div>
          <p style="margin-top: 20px;">This OTP is valid for 1 hour.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #777; text-align: center;">
            © ${new Date().getFullYear()} Immersive Homes. All rights reserved.
          </p>
        </div>
      `;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      text,
      html
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

module.exports = {
  sendOTPEmail
};
