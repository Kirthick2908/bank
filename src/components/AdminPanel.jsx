import React, { useState, useEffect } from 'react';
import { Typography, Container, Button, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { db, auth } from '../firebase/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function AdminPanel() {
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    console.log('Current user in AdminPanel:', user);
    if (!user || user.uid !== 'pmun96vC5abTJ3pNF522rHpAKOT2') {
      alert('Unauthorized access. Redirecting to login.');
      navigate('/login');
      return;
    }

    const fetchPendingAccounts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'pending_accounts'));
        const accountList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPendingAccounts(accountList);
      } catch (error) {
        console.error('Error fetching pending accounts:', error.code, error.message);
      }
    };

    const fetchPendingLoans = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'loan_application'));
        const loanList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPendingLoans(loanList);
      } catch (error) {
        console.error('Error fetching pending loans:', error.code, error.message);
      }
    };

    fetchPendingAccounts();
    fetchPendingLoans();
  }, [navigate]);

  const handleAccountAction = async (id, action) => {
    const accountRef = doc(db, 'pending_accounts', id);
    try {
      if (action === 'delete') {
        await deleteDoc(accountRef);
        setPendingAccounts(pendingAccounts.filter(account => account.id !== id));
      } else if (action === 'accept') {
        const account = pendingAccounts.find(acc => acc.id === id);
        await addDoc(collection(db, 'bank_account'), {
          userId: account.userId,
          acct_balance: account.acct_balance,
          acct_created_at: account.acct_created_at,
          acct_limit: account.acct_limit,
          acct_number: account.acct_number,
          acct_status: 'active',
          acct_type: account.acct_type,
          customer_id: account.customer_id // Ensure customer_id is copied
        });
        await deleteDoc(accountRef);
        setPendingAccounts(pendingAccounts.filter(account => account.id !== id));
      } else {
        await updateDoc(accountRef, { acct_status: action });
        setPendingAccounts(pendingAccounts.map(account => account.id === id ? { ...account, acct_status: action } : account));
      }
      setSelectedAccount(null);
    } catch (error) {
      console.error('Account action error:', error.code, error.message);
      alert('Failed to process account action: ' + error.message);
    }
  };

  const handleLoanAction = async (id, action) => {
    const loanRef = doc(db, 'loan_application', id);
    try {
      if (action === 'delete') {
        await deleteDoc(loanRef);
        setPendingLoans(pendingLoans.filter(loan => loan.id !== id));
      } else {
        await updateDoc(loanRef, { loan_status: action });
        setPendingLoans(pendingLoans.map(loan => loan.id === id ? { ...loan, loan_status: action } : loan));
      }
      setSelectedLoan(null);
    } catch (error) {
      console.error('Loan action error:', error.code, error.message);
      alert('Failed to process loan action: ' + error.message);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>Admin Panel</Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/bank-details')} style={{ marginBottom: '20px' }}>Manage Bank Details</Button>

      <Typography variant="h5" gutterBottom>Pending Accounts</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Account Number</TableCell>
            <TableCell>Customer ID</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pendingAccounts.map(account => (
            <TableRow key={account.id}>
              <TableCell>{account.acct_number}</TableCell>
              <TableCell>{account.customer_id}</TableCell>
              <TableCell>{account.acct_status}</TableCell>
              <TableCell>
                <Button variant="contained" color="info" onClick={() => setSelectedAccount(account)}>View</Button>
                <Button variant="contained" color="primary" onClick={() => handleAccountAction(account.id, 'accept')} disabled={account.acct_status === 'active'}>Accept</Button>
                <Button variant="contained" color="secondary" onClick={() => handleAccountAction(account.id, 'onhold')} style={{ marginLeft: '10px' }} disabled={account.acct_status === 'onhold'}>Hold</Button>
                <Button variant="contained" color="error" onClick={() => handleAccountAction(account.id, 'delete')} style={{ marginLeft: '10px' }}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>Pending Loan Applications</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Loan Application Number</TableCell>
            <TableCell>Customer ID</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pendingLoans.map(loan => (
            <TableRow key={loan.id}>
              <TableCell>{loan.loan_appl_num}</TableCell>
              <TableCell>{loan.customer_id}</TableCell>
              <TableCell>{loan.loan_status}</TableCell>
              <TableCell>
                <Button variant="contained" color="info" onClick={() => setSelectedLoan(loan)}>View</Button>
                <Button variant="contained" color="primary" onClick={() => handleLoanAction(loan.id, 'approved')} disabled={loan.loan_status === 'approved'}>Accept</Button>
                <Button variant="contained" color="secondary" onClick={() => handleLoanAction(loan.id, 'onhold')} style={{ marginLeft: '10px' }} disabled={loan.loan_status === 'onhold'}>Hold</Button>
                <Button variant="contained" color="error" onClick={() => handleLoanAction(loan.id, 'delete')} style={{ marginLeft: '10px' }}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selectedAccount} onClose={() => setSelectedAccount(null)}>
        <DialogTitle>Account Details</DialogTitle>
        <DialogContent>
          {selectedAccount && (
            <>
              <Typography>Account Number: {selectedAccount.acct_number}</Typography>
              <Typography>Customer ID: {selectedAccount.customer_id}</Typography>
              <Typography>Account Type: {selectedAccount.acct_type}</Typography>
              <Typography>Initial Balance: {selectedAccount.acct_balance}</Typography>
              <Typography>Name: {selectedAccount.personal_details.name}</Typography>
              <Typography>Address: {selectedAccount.personal_details.address}</Typography>
              <Typography>Aadhaar Document Name: {selectedAccount.aadhaar_doc_name}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAccount(null)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selectedLoan} onClose={() => setSelectedLoan(null)}>
        <DialogTitle>Loan Application Details</DialogTitle>
        <DialogContent>
          {selectedLoan && (
            <>
              <Typography>Loan Application Number: {selectedLoan.loan_appl_num}</Typography>
              <Typography>Customer ID: {selectedLoan.customer_id}</Typography>
              <Typography>Loan Type: {selectedLoan.loan_type}</Typography>
              <Typography>Loan Amount: {selectedLoan.loan_amt}</Typography>
              <Typography>Purpose: {selectedLoan.purpose}</Typography>
              <Typography>Asset Proof Document Name: {selectedLoan.asset_proof_name}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedLoan(null)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminPanel;