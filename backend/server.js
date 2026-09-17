require('dns').setDefaultResultOrder('ipv4first');
require('dotenv').config();

console.log('URL:', process.env.SUPABASE_URL);
console.log('KEY:', process.env.SUPABASE_KEY);

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.get('/', (req, res) => {
  res.send('Backend is working!');
});

app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.get('/api/bookings', async (req, res) => {
  const { data, error } = await supabase.from('bookings').select('*');
  if (error) {
    console.log('FULL ERROR DETAILS:', error);
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

app.post('/api/bookings', async (req, res) => {
  const { customer_name, email, booking_date } = req.body;

  const { data, error } = await supabase
    .from('bookings')
    .insert([{ customer_name, email, booking_date, status: 'pending' }])
    .select();

  if (error) {
    console.log('INSERT ERROR:', error);
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data[0]);
});

// UPDATE a booking (e.g. change status or details)
app.put('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const { customer_name, email, booking_date, status } = req.body;

  const { data, error } = await supabase
    .from('bookings')
    .update({ customer_name, email, booking_date, status })
    .eq('id', id)
    .select();

  if (error) {
    console.log('UPDATE ERROR:', error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data[0]);
});

// DELETE a booking
app.delete('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);

  if (error) {
    console.log('DELETE ERROR:', error);
    return res.status(500).json({ error: error.message });
  }

  res.status(204).send();
});

// Create a PayMongo checkout session for a specific booking
app.post('/api/create-checkout/:id', async (req, res) => {
  const { id } = req.params;

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  try {
    const response = await fetch('https://api.paymongo.com/v2/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64'),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [
              {
                name: `Booking for ${booking.customer_name}`,
                amount: 10000,
                currency: 'PHP',
                quantity: 1,
              },
            ],
            payment_method_types: ['gcash', 'card', 'qrph'],
            success_url: 'https://booking-app-git-main-vonlorenz2233-eng.vercel.app?payment=success',
            cancel_url: 'https://booking-app-git-main-vonlorenz2233-eng.vercel.app?payment=cancelled',
            metadata: {
              booking_id: id,
            },
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('PayMongo error:', data);
      return res.status(500).json({ error: 'Failed to create checkout session' });
    }

    res.json({ checkout_url: data.data.attributes.checkout_url });
  } catch (err) {
    console.log('Checkout error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const crypto = require('crypto');

app.post('/webhooks/paymongo', async (req, res) => {
  const signatureHeader = req.headers['paymongo-signature'];
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

  // Verify this request genuinely came from PayMongo
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.rawBody)
    .digest('hex');

  if (!signatureHeader || !signatureHeader.includes(expectedSignature)) {
    console.log('Invalid webhook signature — ignoring request');
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;

  if (event.data.attributes.type === 'checkout_session.payment.paid') {
    const bookingId = event.data.attributes.data.attributes.metadata.booking_id;

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'paid' })
      .eq('id', bookingId);

    if (error) {
      console.log('Failed to update booking after payment:', error);
    } else {
      console.log(`Booking ${bookingId} marked as paid`);
    }
  }

  res.status(200).send('Webhook received');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});