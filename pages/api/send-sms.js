export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone and message required' });
  }

  try {
    // Check if SMS API key is configured
    if (!process.env.SMS_API_KEY) {
      console.log(`[SMS] Would send to ${phone}: ${message}`);
      return res.status(200).json({ success: true, message: 'SMS logged (no API key)' });
    }

    // MSG91 SMS API
    const response = await fetch('https://api.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'authkey': process.env.SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: process.env.SMS_SENDER_ID || 'MSTRAV',
        mobiles: `91${phone}`,
        message: message,
      }),
    });

    const data = await response.json();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('SMS error:', error);
    // Don't fail if SMS fails, just log
    res.status(200).json({ success: true, message: 'SMS send attempted' });
  }
}