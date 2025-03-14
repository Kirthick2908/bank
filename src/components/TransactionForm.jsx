import React, { useState, useEffect } from 'react';
import { TextField, Button, Container, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { collection, addDoc, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';

function TransactionForm() {
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [accounts, setAccounts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccounts = async () => {
      const user = auth.currentUser;
      if (!user) {
        alert('Please log in first.');
        navigate('/login');
        return;
      }

      const q = query(collection(db, 'bank_account'), where('userId', '==', user.uid), where('acct_status', '==', 'active'));
      const querySnapshot = await getDocs(q);
      const accountList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAccounts(accountList);
    };

    fetchAccounts();
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Please log in first.');
        navigate('/login');
        return;
      }

      const selectedAccount = accounts.find(acc => acc.acct_number === fromAccount);
      if (!selectedAccount) {
        alert('Invalid source account.');
        return;
      }

      const transactionAmount = Number(amount);
      console.log('Transaction details:', {
        fromAccount,
        toAccount,
        amount: transactionAmount,
        currentBalance: selectedAccount.acct_balance
      });

      if (isNaN(transactionAmount) || transactionAmount <= 0) {
        alert('Invalid transaction amount. Please enter a positive number.');
        return;
      }

      if (selectedAccount.acct_balance < transactionAmount) {
        alert('Insufficient balance. Current balance: ' + selectedAccount.acct_balance + ', Requested amount: ' + transactionAmount);
        return;
      }

      // Update the source account balance
      const newBalance = selectedAccount.acct_balance - transactionAmount;
      await updateDoc(doc(db, 'bank_account', selectedAccount.id), {
        acct_balance: newBalance
      });

      // Record the transaction
      const transactionId = `TXN${Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7)}`;
      await addDoc(collection(db, 'transaction'), {
        userId: user.uid,
        transaction_id: transactionId,
        from_acct: fromAccount,
        to_acct: toAccount,
        amount: transactionAmount,
        date: new Date().toISOString()
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Transaction error:', error.message);
      alert('Failed to process transaction: ' + error.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Make a Transaction</Typography>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal">
          <InputLabel>From Account</InputLabel>
          <Select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} label="From Account">
            {accounts.map(account => (
              <MenuItem key={account.id} value={account.acct_number}>{account.acct_number}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="To Account Number"
          variant="outlined"
          fullWidth
          margin="normal"
          value={toAccount}
          onChange={(e) => setToAccount(e.target.value)}
        />
        <TextField
          label="Amount"
          type="number"
          variant="outlined"
          fullWidth
          margin="normal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Button type="submit" variant="contained" color="primary" style={{ marginTop: '10px' }}>
          Transfer
        </Button>
      </form>
    </Container>
  );
}

export default TransactionForm;