import React, { useState, useEffect } from 'react';
import { TextField, Button, Container, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

function BankDetails() {
  const [bankName, setBankName] = useState('PMN Bank');
  const [bankAddr, setBankAddr] = useState('');
  const [ifscCode, setIfscCode] = useState('PMB0X');
  const [accounts, setAccounts] = useState([]); // State to store all bank accounts
  const navigate = useNavigate();

  // Admin UID for access control
  const ADMIN_UID = 'pmun96vC5abTJ3pNF522rHpAKOT2';

  useEffect(() => {
    const fetchAccounts = async () => {
      const user = auth.currentUser;
      if (!user || user.uid !== ADMIN_UID) {
        alert('Access denied. Admin privileges required.');
        navigate('/admin');
        return;
      }

      try {
        // Fetch all accounts from bank_account collection
        const querySnapshot = await getDocs(collection(db, 'bank_account'));
        const accountList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAccounts(accountList);
        console.log('Fetched accounts:', accountList);
      } catch (error) {
        console.error('Error fetching accounts:', error.message);
        alert('Failed to load accounts: ' + error.message);
      }
    };

    fetchAccounts();
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user || user.uid !== ADMIN_UID) {
      alert('Access denied. Admin privileges required.');
      navigate('/admin');
      return;
    }

    try {
      await addDoc(collection(db, 'bank_detail'), {
        bank_name: bankName,
        bank_addr: bankAddr,
        ifsc_code: ifscCode
      });
      alert('Bank details saved successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Error saving bank details:', error.message);
      alert('Failed to save bank details: ' + error.message);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>Manage Bank Details</Typography>

      {/* Bank Details Form */}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Bank Address"
          variant="outlined"
          fullWidth
          margin="normal"
          value={bankAddr}
          onChange={(e) => setBankAddr(e.target.value)}
        />
        <TextField
          label="IFSC Code"
          variant="outlined"
          fullWidth
          margin="normal"
          value={ifscCode}
          onChange={(e) => setIfscCode(e.target.value)}
        />
        <Button type="submit" variant="contained" color="primary" style={{ marginBottom: '20px' }}>
          Save Bank Details
        </Button>
      </form>

      {/* Display All User Accounts */}
      <Typography variant="h5" gutterBottom>All User Accounts</Typography>
      {accounts.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Account Number</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Account Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Customer ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.map(account => (
              <TableRow key={account.id}>
                <TableCell>{account.acct_number}</TableCell>
                <TableCell>{account.userId}</TableCell>
                <TableCell>{account.acct_balance}</TableCell>
                <TableCell>{account.acct_type}</TableCell>
                <TableCell>{account.acct_status}</TableCell>
                <TableCell>{account.customer_id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Typography>No accounts found.</Typography>
      )}
    </Container>
  );
}

export default BankDetails;