import React, { useState, useEffect } from 'react';
import { TextField, Button, Container, Typography, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

function AccountForm() {
  const [acctType, setAcctType] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaarDocName, setAadhaarDocName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [customerId, setCustomerId] = useState(''); // Store fetched customer_id
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomerId = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const customerDocRef = doc(db, 'customer_detail', user.uid);
        const customerDoc = await getDoc(customerDocRef);
        if (customerDoc.exists()) {
          setCustomerId(customerDoc.data().customer_id);
        } else {
          // If no customer_detail exists, generate a new customer_id (shouldn't happen after registration)
          const newCustomerId = `2025${Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7)}`;
          await setDoc(customerDocRef, {
            customer_id: newCustomerId,
            customer_name: user.displayName || 'New User',
            customer_email: user.email,
            customer_points: 0
          });
          setCustomerId(newCustomerId);
        }
      } catch (error) {
        console.error('Error fetching customer ID:', error.message);
      }
    };

    fetchCustomerId();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (initialBalance < 1000) {
      alert('Initial balance must be 1000 or more.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Please log in first.');
        navigate('/login');
        return;
      }

      console.log('Authenticated user UID:', user.uid);

      const acctNumber = `1000${Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7)}`;

      await addDoc(collection(db, 'pending_accounts'), {
        userId: user.uid,
        acct_balance: Number(initialBalance),
        acct_created_at: serverTimestamp(),
        acct_limit: 100000,
        acct_number: acctNumber,
        acct_status: 'pending',
        acct_type: acctType,
        customer_id: customerId, // Use fetched customer_id
        personal_details: { name, address },
        aadhaar_doc_name: aadhaarDocName || 'Not Provided'
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Firestore error:', error.code, error.message);
      alert('Failed to create account: ' + error.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Create Account</Typography>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Account Type</InputLabel>
          <Select value={acctType} onChange={(e) => setAcctType(e.target.value)} label="Account Type">
            <MenuItem value="savings">Savings</MenuItem>
            <MenuItem value="current">Current</MenuItem>
            <MenuItem value="salary">Salary</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Name" variant="outlined" fullWidth margin="normal" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Address" variant="outlined" fullWidth margin="normal" value={address} onChange={(e) => setAddress(e.target.value)} />
        <TextField label="Initial Balance" type="number" variant="outlined" fullWidth margin="normal" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} />
        <TextField
          label="Aadhaar Document Name"
          variant="outlined"
          fullWidth
          margin="normal"
          value={aadhaarDocName}
          onChange={(e) => setAadhaarDocName(e.target.value)}
          helperText="Enter the name of the Aadhaar document (e.g., Aadhaar.pdf)"
        />
        <Button type="submit" variant="contained" color="primary" style={{ marginTop: '10px' }}>Create Account</Button>
      </form>
    </Container>
  );
}

export default AccountForm;