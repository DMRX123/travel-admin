// pages/api/webhooks/razorpay.js - PAYMENT WEBHOOK HANDLER
import crypto from 'crypto';
import { supabaseAdmin } from '../../../lib/supabase';
import { invalidateCache } from '../../../lib/cache';

export const config = {
  api: {
    bodyParser: false, // Raw body needed for signature verification
  },
};

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => { resolve(body); });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('RAZORPAY_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    const body = await readBody(req);
    const signature = req.headers['x-razorpay-signature'];

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(body);
    const { event: eventName, payload } = event;

    console.log(`Webhook received: ${eventName}`);

    // Handle different webhook events
    switch (eventName) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      
      case 'refund.created':
        await handleRefundCreated(payload);
        break;
      
      default:
        console.log(`Unhandled event: ${eventName}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePaymentCaptured(payload) {
  const payment = payload.payment.entity;
  const orderId = payment.order_id;
  const paymentId = payment.id;
  const amount = payment.amount / 100;

  // Find the order
  const { data: order, error: orderError } = await supabaseAdmin
    .from('payment_orders')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (orderError || !order) {
    console.error('Order not found:', orderId);
    return;
  }

  if (order.type === 'wallet') {
    // Add money to wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', order.user_id)
      .single();

    const newBalance = (wallet?.balance || 0) + amount;

    await supabaseAdmin
      .from('wallets')
      .upsert({
        user_id: order.user_id,
        balance: newBalance,
        updated_at: new Date().toISOString()
      });

    // Record transaction
    await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: order.user_id,
        amount: amount,
        type: 'credit',
        description: `Wallet recharge via Razorpay (${paymentId})`,
        status: 'completed',
        payment_id: paymentId,
        created_at: new Date().toISOString()
      });

    // Update order status
    await supabaseAdmin
      .from('payment_orders')
      .update({ 
        status: 'completed', 
        payment_id: paymentId,
        completed_at: new Date().toISOString()
      })
      .eq('id', order.id);

    // Invalidate cache
    invalidateCache(`wallet:${order.user_id}`);

    // Send notification
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: order.user_id,
        title: '💰 Wallet Recharged',
        body: `₹${amount} has been added to your wallet. New balance: ₹${newBalance}`,
        data: { type: 'wallet', amount, newBalance }
      })
    }).catch(() => {});

  } else if (order.type === 'ride') {
    // Update ride payment status
    await supabaseAdmin
      .from('rides')
      .update({ 
        payment_status: 'paid', 
        payment_id: paymentId,
        payment_method: 'card',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.ride_id);

    // Update order status
    await supabaseAdmin
      .from('payment_orders')
      .update({ 
        status: 'completed', 
        payment_id: paymentId,
        completed_at: new Date().toISOString()
      })
      .eq('id', order.id);

    // Send notification to user
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: order.user_id,
        title: '✅ Payment Successful',
        body: `Payment of ₹${amount} for your ride has been completed.`,
        data: { type: 'payment_success', rideId: order.ride_id, amount }
      })
    }).catch(() => {});
  }
}

async function handlePaymentFailed(payload) {
  const payment = payload.payment.entity;
  const orderId = payment.order_id;

  await supabaseAdmin
    .from('payment_orders')
    .update({ 
      status: 'failed', 
      error_message: payment.error_description || 'Payment failed'
    })
    .eq('order_id', orderId);
}

async function handleRefundCreated(payload) {
  const refund = payload.refund.entity;
  const paymentId = refund.payment_id;

  await supabaseAdmin
    .from('refunds')
    .update({ 
      status: 'completed', 
      refund_id: refund.id,
      completed_at: new Date().toISOString()
    })
    .eq('payment_id', paymentId);
}