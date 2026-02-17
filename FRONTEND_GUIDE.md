# Frontend Integration Guide

## 1. Authentication
Use `axios` for API requests. Store the JWT token in LocalStorage/Cookies.

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1'
});

// Add token to headers
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login Example
const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', res.data.token);
  return res.data;
};
```

## 2. Protected Routes
In React (or similar), use a layout/wrapper to check for token presence.

## 3. Meeting Scheduling
```javascript
const scheduleMeeting = async (investorId, date, time) => {
  try {
    const res = await api.post('/meetings', {
      investorId,
      date, // '2023-10-27'
      time // '14:00'
    });
    console.log('Meeting Scheduled:', res.data);
  } catch (err) {
    console.error(err.response.data.error);
  }
};
```

## 4. Payment (Stripe)
Use `@stripe/react-stripe-js`.

```javascript
/* Frontend sends amount to create intent */
const handleDeposit = async () => {
  const { data } = await api.post('/payments/deposit', { amount: 100 });
  
  // Use clientSecret with Stripe Element
  const result = await stripe.confirmCardPayment(data.clientSecret, {
    payment_method: {
      card: elements.getElement(CardElement),
    }
  });

  if (result.error) {
    console.log(result.error.message);
  } else {
    if (result.paymentIntent.status === 'succeeded') {
        // Confirm on backend (optional if using webhooks correctly)
        await api.post('/payments/confirm', { transactionId: data.transactionId });
    }
  }
};
```

## 5. WebRTC Signaling (Socket.IO)
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

// Join Room
socket.emit('join-room', roomId, userId);

// WebRTC logic (using simple-peer or raw RTCPeerConnection) will listen to:
socket.on('offer', handleOffer);
socket.on('answer', handleAnswer);
socket.on('ice-candidate', handleNewICECandidate);
```
