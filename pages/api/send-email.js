// pages/api/send-email.js - UPDATED with email verification template
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, type, data } = req.body;

  if (!to || !subject || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const templates = {
    email_verification: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #F97316, #EF4444); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Maa Saraswati Travels</h1>
          <p style="color: white; opacity: 0.9;">Email Verification</p>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; background: white;">
          <h2>Verify Your Email Address</h2>
          <p>Please use the following OTP to verify your email address:</p>
          <div style="text-align: center; padding: 20px;">
            <span style="font-size: 32px; font-family: monospace; letter-spacing: 5px; background: #f3f4f6; padding: 10px 20px; border-radius: 8px;">
              ${data.otp}
            </span>
          </div>
          <p>This OTP is valid for 10 minutes.</p>
          <hr style="margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
    booking_confirmation: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #F97316, #EF4444); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Booking Confirmed!</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; background: white;">
          <p>Your ride has been booked successfully.</p>
          <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          <p><strong>Pickup:</strong> ${data.pickup}</p>
          <p><strong>Drop:</strong> ${data.drop}</p>
          <p><strong>Fare:</strong> ₹${data.fare}</p>
          <a href="${data.trackingLink}" style="background: #F97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block;">Track Your Ride</a>
        </div>
      </div>
    `,
  };

  const template = templates[type];
  if (!template) {
    return res.status(400).json({ error: 'Invalid email template' });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Email] Would send to ${to}: ${subject}`);
    return res.status(200).json({ success: true, message: 'Email logged (no credentials)' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Maa Saraswati Travels" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: template(data),
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}