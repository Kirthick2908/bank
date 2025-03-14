import React, { useState, useEffect } from 'react';
import { TextField, Button, Container, Typography, Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { auth } from '../firebase/firebase';

function TransferForm() {
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [userAccounts, setUserAccounts] = useState([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchAccounts = async () => {
      const snapshot = await getDocs(collection(db, 'bank_account'));
      const userAccounts = snapshot.docs.filter((doc) => doc.data().user_id === user?.uid);
      setUserAccounts(userAccounts.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchAccounts();
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fromAcct = userAccounts.find((acc) => acc.acct_number === fromAccount);
    if (!fromAcct || fromAcct.acct_balance < Number(amount)) {
      alert('Insufficient balance or invalid account.');
      return;
    }

    try {
      await addDoc(collection(db, 'transaction'), {
        from_acct: fromAccount,
        to_acct: toAccount,
        transaction_amt: Number(amount),
        timestamp: serverTimestamp(),
        user_id: user.uid,
      });
      await updateDoc(doc(db, 'bank_account', fromAcct.id), {
        acct_balance: fromAcct.acct_balance - Number(amount),
      });
      const toAcct = userAccounts.find((acc) => acc.acct_number === toAccount);
      if (toAcct) {
        await updateDoc(doc(db, 'bank_account', toAcct.id), {
          acct_balance: toAcct.acct_balance + Number(amount),
        });
      }
      navigate('/dashboard');
    } catch (error) {
      alert('Failed to transfer: ' + error.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Money Transfer</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          select
          label="From Account"
          variant="outlined"
          fullWidth
          margin="normal"
          value={fromAccount}
          onChange={(e) => setFromAccount(e.target.value)}
          required
        >
          {userAccounts.map((acc) => (
            <MenuItem key={acc.id} value={acc.acct_number}>
              {acc.acct_number} (Balance: {acc.acct_balance})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="To Account"
          variant="outlined"
          fullWidth
          margin="normal"
          value={toAccount}
          onChange={(e) => setToAccount(e.target.value)}
          required
        />
        <TextField
          label="Amount"
          variant="outlined"
          fullWidth
          margin="normal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          required
        />
        <Button type="submit" variant="contained" color="primary">
          Transfer
        </Button>
      </form>
    </Container>
  );
}

export default TransferForm;