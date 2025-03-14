import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from './firebase/firebase';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import AccountForm from './components/AccountForm';
import CustomerPage from './components/CustomerPage'; // Replaced AccountManagement with CustomerPage
import TransactionForm from './components/TransactionForm';
import LoanForm from './components/LoanForm';
import BankDetails from './components/BankDetails';

function App() {
  const [user, setUser] = useState(null);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminError, setAdminError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const ADMIN_UID = 'pmun96vC5abTJ3pNF522rHpAKOT2';
  const ADMIN_EMAIL = 'kirthickdeivasigamani@gmail.com';
  const ADMIN_PASSWORD = 'Audi@555';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.uid === ADMIN_UID) {
          setAdminAuthenticated(true);
          if (location.pathname === '/login' || location.pathname === '/register') {
            navigate('/dashboard');
          }
        } else if (location.pathname === '/admin' && !adminAuthenticated) {
          setAdminDialogOpen(true);
        }
        if (window.location.pathname === '/login' || window.location.pathname === '/register') {
          navigate('/dashboard');
        }
      } else {
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/admin') {
          navigate('/login');
        } else if (window.location.pathname === '/admin') {
          setAdminDialogOpen(true);
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, location, adminAuthenticated]);

  const handleAdminLogin = async () => {
    setAdminError('');
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === ADMIN_UID && adminEmail === ADMIN_EMAIL && adminPassword === ADMIN_PASSWORD) {
        setAdminAuthenticated(true);
        setAdminDialogOpen(false);
        navigate('/admin');
      } else {
        setAdminError('Invalid admin credentials or UID mismatch.');
      }
    } catch (error) {
      console.error('Admin login error:', error.message);
      setAdminError('Login failed: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAdminAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  return (
    <Container maxWidth={false} disableGutters>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Bank Management System
          </Typography>
          {user ? (
            <>
              <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
              <Button color="inherit" component={Link} to="/customer">Customer Page</Button> {/* Updated link */}
              {user.uid === ADMIN_UID && adminAuthenticated && (
                <Button color="inherit" component={Link} to="/admin">Admin Panel</Button>
              )}
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">Login</Button>
              <Button color="inherit" component={Link} to="/register">Register</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container style={{ marginTop: '20px' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/admin"
            element={
              adminAuthenticated || user?.uid === ADMIN_UID ? (
                <AdminPanel />
              ) : (
                <div>Please authenticate as admin to access this panel.</div>
              )
            }
          />
          <Route path="/account" element={<AccountForm />} />
          <Route path="/customer" element={<CustomerPage />} /> {/* Updated route */}
          <Route path="/transaction" element={<TransactionForm />} />
          <Route path="/loan" element={<LoanForm />} />
          <Route path="/bank-details" element={<BankDetails />} />
          <Route path="*" element={<h1>404 - Not Found</h1>} />
        </Routes>
      </Container>

      {/* Admin Login Dialog */}
      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)}>
        <DialogTitle>Admin Login</DialogTitle>
        <DialogContent>
          {adminError && <Alert severity="error">{adminError}</Alert>}
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminDialogOpen(false)} color="secondary">Cancel</Button>
          <Button onClick={handleAdminLogin} color="primary">Login</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default App;