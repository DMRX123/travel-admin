import nodemailer from 'nodemailer';
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, type, bookingDetails } = req.body;

  if (!to || !subject || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Email templates
  const templates = {
    booking_confirmation: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #F97316, #EF4444); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Maa Saraswati Travels</h1>
          <p style="color: white; opacity: 0.9;">Booking Confirmation</p>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; background: white;">
          <h2>Thank you for booking with us!</h2>
          <p>Your booking has been confirmed. Here are the details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Booking ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.bookingId}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Pickup:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.pickup}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Drop:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.drop}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.vehicle}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Distance:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.distance} km</td></tr>
            <tr><td style="padding: 8px;"><strong>Fare:</strong></td><td style="padding: 8px;"><strong style="color: #F97316;">₹${data.fare}</strong></td></tr>
          </table>
          <p>Driver will contact you within 5-10 minutes. Your ride OTP is: <strong style="font-size: 18px;">${data.rideOtp}</strong></p>
          <hr style="margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">For support, call us at +91 98765 43210 or email support@maasaraswatitravels.com</p>
        </div>
      </div>
    `,
    ride_started: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #F97316, #EF4444); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Your Ride Has Started!</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; background: white;">
          <p>Your driver ${data.driverName} is on the way with vehicle ${data.vehicleNumber}.</p>
          <p>Track your ride live: <a href="${data.trackingLink}" style="color: #F97316;">Click here</a></p>
        </div>
      </div>
    `,
    ride_completed: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Ride Completed!</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; background: white;">
          <p>Thank you for riding with us!</p>
          <p>Total Fare: ₹${data.fare} | Distance: ${data.distance} km</p>
          <a href="${data.reviewLink}" style="background: #F97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block;">Rate Your Ride</a>
        </div>
      </div>
    `,
  };

  const template = templates[type];
  if (!template) {
    return res.status(400).json({ error: 'Invalid email template' });
  }

  // Create transporter only if email credentials exist
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
      html: template(bookingDetails),
    });
    
    // Save to database
    await supabase.from('email_logs').insert({
      to,
      subject,
      type,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}