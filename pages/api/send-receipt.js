// pages/api/send-receipt.js
import nodemailer from 'nodemailer';
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rideId, email } = req.body;

  if (!rideId) {
    return res.status(400).json({ error: 'Ride ID required' });
  }

  try {
    // Fetch ride details
    const { data: ride, error } = await supabase
      .from('rides')
      .select(`
        *,
        user:user_id (full_name, email, phone),
        driver:driver_id (full_name, phone, vehicle_number, vehicle_type)
      `)
      .eq('id', rideId)
      .single();

    if (error) throw error;

    const invoiceNumber = `INV-${ride.id.substring(0, 8).toUpperCase()}`;
    const date = new Date(ride.created_at).toLocaleDateString('en-IN');
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ride Receipt - Maa Saraswati Travels</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .receipt { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #F97316, #EF4444); padding: 30px; text-align: center; color: white; }
          .content { padding: 30px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { background: #fff3e0; padding: 20px; border-radius: 12px; margin-top: 20px; text-align: right; }
          .total .amount { font-size: 32px; font-weight: bold; color: #F97316; }
          .footer { background: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #999; }
          @media print { body { background: white; padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1 style="margin:0">Maa Saraswati Travels</h1>
            <p>Ride Receipt</p>
          </div>
          <div class="content">
            <div class="detail-row"><strong>Invoice No:</strong><span>${invoiceNumber}</span></div>
            <div class="detail-row"><strong>Date:</strong><span>${date}</span></div>
            <div class="detail-row"><strong>Customer:</strong><span>${ride.user?.full_name || 'Guest'}</span></div>
            <div class="detail-row"><strong>Phone:</strong><span>${ride.user?.phone || 'N/A'}</span></div>
            <div class="detail-row"><strong>Pickup:</strong><span>${ride.pickup_address}</span></div>
            <div class="detail-row"><strong>Drop:</strong><span>${ride.drop_address}</span></div>
            <div class="detail-row"><strong>Vehicle:</strong><span>${ride.vehicle_type}</span></div>
            <div class="detail-row"><strong>Distance:</strong><span>${ride.distance} km</span></div>
            ${ride.driver ? `<div class="detail-row"><strong>Driver:</strong><span>${ride.driver.full_name}</span></div>` : ''}
            ${ride.driver ? `<div class="detail-row"><strong>Vehicle No:</strong><span>${ride.driver.vehicle_number}</span></div>` : ''}
            <div class="detail-row"><strong>Payment Method:</strong><span>${ride.payment_method}</span></div>
            <div class="total">
              <p>Total Amount</p>
              <div class="amount">₹${ride.fare}</div>
              <p style="font-size:12px; margin-top:10px;">*GST Included where applicable</p>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for choosing Maa Saraswati Travels!</p>
            <p>For support: +91 98765 43210 | support@maasaraswatitravels.com</p>
          </div>
        </div>
        <div class="no-print" style="text-align:center; margin-top:20px;">
          <button onclick="window.print()" style="background:#F97316; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer;">🖨️ Print Receipt</button>
        </div>
      </body>
      </html>
    `;

    // Send email if email provided
    if (email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Maa Saraswati Travels" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Ride Receipt - ${invoiceNumber}`,
        html: emailHtml,
      });
    }

    // Save to database
    await supabase
      .from('receipts')
      .insert({
        ride_id: rideId,
        invoice_number: invoiceNumber,
        email_sent: email ? true : false,
        sent_at: new Date().toISOString()
      });

    res.status(200).json({ success: true, html: emailHtml });
  } catch (error) {
    console.error('Receipt error:', error);
    res.status(500).json({ error: 'Failed to generate receipt' });
  }
}