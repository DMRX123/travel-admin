import nodemailer from 'nodemailer';
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, type, bookingDetails } = req.body;

  // Email templates
  const templates = {
    booking_confirmation: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #F97316, #EF4444); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Maa Saraswati Travels</h1>
          <p style="color: white; opacity: 0.9;">Booking Confirmation</p>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2>Thank you for booking with us!</h2>
          <p>Your booking has been confirmed. Here are the details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Booking ID:</strong></td><td>${data.bookingId}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Pickup:</strong></td><td>${data.pickup}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Drop:</strong></td><td>${data.drop}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Vehicle:</strong></td><td>${data.vehicle}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Fare:</strong></td><td>₹${data.fare}</td></tr>
            <tr><td style="padding: 8px;"><strong>Status:</strong></td><td><span style="background: #10B981; color: white; padding: 2px 8px; border-radius: 20px;">Confirmed</span></td></tr>
          </table>
          <p>Driver will contact you within 5-10 minutes.</p>
          <hr style="margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">For support, call us at +91 98765 43210 or email support@maasaraswatitravels.com</p>
        </div>
      </div>
    `,
    ride_started: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #F97316, #EF4444); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Maa Saraswati Travels</h1>
          <p style="color: white; opacity: 0.9;">Your Ride Has Started!</p>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2>Your driver is on the way!</h2>
          <p>Driver ${data.driverName} has started your ride. Track your driver live:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0;"><strong>Vehicle:</strong> ${data.vehicleNumber}</p>
            <p style="margin: 5px 0 0;"><strong>Driver Contact:</strong> ${data.driverPhone}</p>
          </div>
          <a href="${data.trackingLink}" style="background: #F97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block;">Track Live</a>
        </div>
      </div>
    `,
    ride_completed: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Ride Completed!</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2>Thank you for riding with us!</h2>
          <p>Your ride has been completed successfully.</p>
          <table style="width: 100%; margin: 20px 0;">
            <tr><td><strong>Distance Traveled:</strong></td><td>${data.distance} km</td></tr>
            <tr><td><strong>Duration:</strong></td><td>${data.duration}</td></tr>
            <tr><td><strong>Amount Paid:</strong></td><td>₹${data.fare}</td></tr>
          </table>
          <a href="${data.reviewLink}" style="background: #F97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block;">Rate Your Ride</a>
        </div>
      </div>
    `,
  };

  const template = templates[type];
  if (!template) {
    return res.status(400).json({ error: 'Invalid email template' });
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