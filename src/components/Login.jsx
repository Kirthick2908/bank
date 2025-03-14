import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Alert, Link, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showReset, setShowReset] = useState(false);
  const navigate = useNavigate();

  // Regular Customer Login
  const handleEmailLogin = async (event) => {
    event.preventDefault();
    setErrorMessage(''); // Clear previous errors
    console.log('Attempting customer login with email:', email, 'password length:', password.length);

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccessMessage('Successfully logged in as Customer');
      setTimeout(() => {
        setSuccessMessage('');
        navigate('/dashboard'); // Redirect to Customer Dashboard
      }, 2000);
    } catch (error) {
      console.error('Customer login error:', error.code, error.message);
      setErrorMessage('Login failed: ' + error.message);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Admin Login
  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setErrorMessage(''); // Clear previous errors
    console.log('Attempting admin login with email:', email, 'password length:', password.length);

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Optional: Add admin check logic here (e.g., email domain or Firestore role)
      // For now, we'll assume any successful login with this button is an admin
      setSuccessMessage('Successfully logged in as Admin');
      setTimeout(() => {
        setSuccessMessage('');
        navigate('/admin'); // Redirect to Admin Panel
      }, 2000);
    } catch (error) {
      console.error('Admin login error:', error.code, error.message);
      setErrorMessage('Admin login failed: ' + error.message);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setSuccessMessage('Successfully logged in as Customer');
      setTimeout(() => {
        setSuccessMessage('');
        navigate('/dashboard'); // Google login for customers only
      }, 2000);
    } catch (error) {
      console.error('Google login error:', error.message);
      setErrorMessage('Google login failed: ' + error.message);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setSuccessMessage('Password reset email sent. Check your inbox.');
      setShowReset(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Password reset error:', error.code, error.message);
      setErrorMessage('Failed to send reset email: ' + error.message);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Login</Typography>
      {successMessage && <Alert severity="success">{successMessage}</Alert>}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      <form onSubmit={handleEmailLogin}>
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          style={{ marginRight: '10px' }}
        >
          Login as Customer
        </Button>
        <Button
          variant="contained"
          color="warning" // Different color to distinguish admin login
          onClick={handleAdminLogin}
        >
          Login as Admin
        </Button>
        <Link
          component="button"
          variant="body2"
          onClick={() => setShowReset(true)}
          style={{ marginLeft: '10px', cursor: 'pointer' }}
        >
          Forgot Password?
        </Link>
      </form>
      <Button
        variant="contained"
        color="secondary"
        onClick={handleGoogleLogin}
        style={{ marginTop: '10px' }}
      >
        Login with Google (Customer Only)
      </Button>

      {/* Forgot Password Dialog */}
      <Dialog open={showReset} onClose={() => setShowReset(false)}>
        <DialogTitle>Forgot Password</DialogTitle>
        <DialogContent>
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReset(false)} color="secondary">Cancel</Button>
          <Button onClick={handleForgotPassword} color="primary">Send Reset Email</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Login;