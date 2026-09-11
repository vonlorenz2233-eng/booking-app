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
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});