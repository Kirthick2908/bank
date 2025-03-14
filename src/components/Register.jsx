import React, { useState } from 'react';
import { Button, Container, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';

function Register() {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleGoogleRegister = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const customerId = `2025${Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7)}`;
      await setDoc(doc(db, 'customer_detail', user.uid), {
        customer_id: customerId,
        customer_name: user.displayName || 'New User',
        customer_email: user.email,
        customer_points: 0
      });

      setSuccessMessage('Signed up successfully! Redirecting to login...');
      setTimeout(() => {
        setSuccessMessage('');
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Google registration error:', error.message);
      setErrorMessage('Google registration failed: ' + error.message);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Register</Typography>
      {successMessage && <Alert severity="success">{successMessage}</Alert>}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      <Button variant="contained" color="secondary" onClick={handleGoogleRegister}>
        Sign Up with Google
      </Button>
    </Container>
  );
}

export default Register;