import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [bookings, setBookings] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [bookingDate, setBookingDate] = useState('');

  const fetchBookings = () => {
    fetch('http://localhost:3000/api/bookings')
      .then((res) => res.json())
      .then((data) => setBookings(data))
      .catch((err) => console.log('Error fetching bookings:', err));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: customerName,
        email: email,
        booking_date: bookingDate,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setCustomerName('');
        setEmail('');
        setBookingDate('');
        fetchBookings();
      })
      .catch((err) => console.log('Error creating booking:', err));
  };

  // Mark a booking as confirmed
  const handleConfirm = (booking) => {
    fetch(`http://localhost:3000/api/bookings/${booking.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: booking.customer_name,
        email: booking.email,
        booking_date: booking.booking_date,
        status: 'confirmed',
      }),
    })
      .then((res) => res.json())
      .then(() => fetchBookings())
      .catch((err) => console.log('Error updating booking:', err));
  };

  // Delete a booking
  const handleDelete = (id) => {
    fetch(`http://localhost:3000/api/bookings/${id}`, {
      method: 'DELETE',
    })
      .then(() => fetchBookings())
      .catch((err) => console.log('Error deleting booking:', err));
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Booking App</h1>

      <h2>New Booking</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Your name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>
          Book Now
        </button>
      </form>

      <h2>All Bookings</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {bookings.map((booking) => (
          <li
            key={booking.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '10px',
              marginBottom: '8px',
            }}
          >
            <div>
              {booking.customer_name} — {booking.email} — {booking.booking_date} —{' '}
              <b>{booking.status}</b>
            </div>
            <div style={{ marginTop: '6px' }}>
              {booking.status !== 'confirmed' && (
                <button onClick={() => handleConfirm(booking)} style={{ marginRight: '8px' }}>
                  Confirm
                </button>
              )}
              <button onClick={() => handleDelete(booking.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;