require('dns').setDefaultResultOrder('ipv4first');
require('dotenv').config();

fetch(`${process.env.SUPABASE_URL}/rest/v1/bookings`, {
  headers: {
    apikey: process.env.SUPABASE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_KEY}`
  }
})
  .then(res => res.json())
  .then(data => console.log('SUCCESS:', data))
  .catch(err => console.log('FULL ERROR:', err));