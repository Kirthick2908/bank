import React, { useState, useEffect } from 'react';
import { Typography, Container, Button, Table, TableBody, TableCell, TableHead, TableRow, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Box, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, addDoc, serverTimestamp } from 'firebase/firestore';

function CustomerPage() {
  const [accounts, setAccounts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [newBalance, setNewBalance] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newLoanAmount, setNewLoanAmount] = useState('');
  const [newLoanPurpose, setNewLoanPurpose] = useState('');
  const [newLoanType, setNewLoanType] = useState('personal');
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        alert('Please log in first.');
        navigate('/login');
        return;
      }

      const accountsQuery = query(collection(db, 'bank_account'), where('userId', '==', user.uid));
      const accountsSnapshot = await getDocs(accountsQuery);
      const accountList = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAccounts(accountList);

      const loansQuery = query(collection(db, 'loan_application'), where('userId', '==', user.uid));
      const loansSnapshot = await getDocs(loansQuery);
      const loanList = loansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLoans(loanList);

      const transactionsQuery = query(collection(db, 'transaction'), where('userId', '==', user.uid));
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionList = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(transactionList);
    };

    fetchUserData();
  }, [navigate]);

  const handleAccountUpdate = async () => {
    if (!selectedAccount || (!newBalance && !newStatus)) {
      alert('Please enter a new balance or status.');
      return;
    }

    const updates = {};
    if (newBalance) updates.acct_balance = Number(newBalance);
    if (newStatus) updates.acct_status = newStatus;

    try {
      await updateDoc(doc(db, 'bank_account', selectedAccount.id), updates);
      setAccounts(accounts.map(account => account.id === selectedAccount.id ? { ...account, ...updates } : account));
      setSelectedAccount(null);
      setNewBalance('');
      setNewStatus('');
      alert('Account updated successfully');
    } catch (error) {
      console.error('Update error:', error.message);
      alert('Failed to update account: ' + error.message);
    }
  };

  const handleAccountDelete = async (accountId) => {
    try {
      await updateDoc(doc(db, 'bank_account', accountId), { acct_status: 'deleted' });
      setAccounts(accounts.filter(account => account.id !== accountId));
      alert('Account marked as deleted');
    } catch (error) {
      console.error('Delete error:', error.message);
      alert('Failed to delete account: ' + error.message);
    }
  };

  const handleLoanCreate = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Please log in first.');
      navigate('/login');
      return;
    }

    const customerDocRef = doc(db, 'customer_detail', user.uid);
    const customerDoc = await getDoc(customerDocRef);
    const customerId = customerDoc.exists() ? customerDoc.data().customer_id : `2025${Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7)}`;
    
    const loanApplNum = `PMBL00${Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7)}`;

    try {
      await addDoc(collection(db, 'loan_application'), {
        userId: user.uid,
        customer_id: customerId,
        loan_appl_num: loanApplNum,
        loan_amt: Number(newLoanAmount),
        loan_type: newLoanType,
        loan_interest: newLoanType === 'personal' ? 8 : newLoanType === 'educational' ? 6 : 10,
        loan_status: 'pending',
        purpose: newLoanPurpose,
        created_at: serverTimestamp()
      });
      setLoans([...loans, {
        userId: user.uid,
        customer_id: customerId,
        loan_appl_num: loanApplNum,
        loan_amt: Number(newLoanAmount),
        loan_type: newLoanType,
        loan_status: 'pending',
        purpose: newLoanPurpose
      }]);
      setNewLoanAmount('');
      setNewLoanPurpose('');
      setNewLoanType('personal');
      alert('Loan application created successfully');
    } catch (error) {
      console.error('Loan create error:', error.message);
      alert('Failed to create loan application: ' + error.message);
    }
  };

  const handleLoanUpdate = async () => {
    if (!selectedLoan || (!newLoanAmount && !newLoanPurpose)) {
      alert('Please enter a new amount or purpose.');
      return;
    }

    const updates = {};
    if (newLoanAmount) updates.loan_amt = Number(newLoanAmount);
    if (newLoanPurpose) updates.purpose = newLoanPurpose;

    try {
      await updateDoc(doc(db, 'loan_application', selectedLoan.id), updates);
      setLoans(loans.map(loan => loan.id === selectedLoan.id ? { ...loan, ...updates } : loan));
      setSelectedLoan(null);
      setNewLoanAmount('');
      setNewLoanPurpose('');
      alert('Loan application updated successfully');
    } catch (error) {
      console.error('Update error:', error.message);
      alert('Failed to update loan application: ' + error.message);
    }
  };

  const handleLoanDelete = async (loanId) => {
    try {
      await deleteDoc(doc(db, 'loan_application', loanId));
      setLoans(loans.filter(loan => loan.id !== loanId));
      alert('Loan application deleted');
    } catch (error) {
      console.error('Delete error:', error.message);
      alert('Failed to delete loan application: ' + error.message);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>Customer Page</Typography>
      

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="customer tabs">
          <Tab label="Accounts" />
          <Tab label="Loans" />
          <Tab label="Transactions" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>Your Accounts</Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/account')} style={{ marginBottom: '20px' }}>
            Create New Account
          </Button>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account Number (Customer ID)</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map(account => (
                <TableRow key={account.id}>
                  <TableCell>{`${account.acct_number} (${account.customer_id})`}</TableCell>
                  <TableCell>{account.acct_balance}</TableCell>
                  <TableCell>{account.acct_status}</TableCell>
                  <TableCell>
                    <Button variant="contained" color="info" onClick={() => setSelectedAccount(account)}>Edit</Button>
                    <Button variant="contained" color="error" onClick={() => handleAccountDelete(account.id)} style={{ marginLeft: '10px' }} disabled={account.acct_status === 'deleted'}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Dialog open={!!selectedAccount} onClose={() => setSelectedAccount(null)}>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogContent>
              {selectedAccount && (
                <>
                  <Typography>Account Number: {selectedAccount.acct_number}</Typography>
                  <Typography>Customer ID: {selectedAccount.customer_id}</Typography>
                  <TextField
                    label="New Balance"
                    type="number"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    helperText="Leave blank to keep current balance"
                  />
                  <TextField
                    label="Status"
                    select
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    helperText="Leave blank to keep current status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="onhold">On Hold</MenuItem>
                  </TextField>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedAccount(null)} color="secondary">Cancel</Button>
              <Button onClick={handleAccountUpdate} color="primary">Save</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {tabValue === 1 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>Your Loans</Typography>
          <Box sx={{ mb: 3 }}>
            <TextField
              label="Loan Amount"
              type="number"
              variant="outlined"
              value={newLoanAmount}
              onChange={(e) => setNewLoanAmount(e.target.value)}
              sx={{ mr: 2 }}
            />
            <TextField
              label="Purpose of Loan"
              variant="outlined"
              value={newLoanPurpose}
              onChange={(e) => setNewLoanPurpose(e.target.value)}
              sx={{ mr: 2 }}
            />
            <TextField
              label="Loan Type"
              select
              variant="outlined"
              value={newLoanType}
              onChange={(e) => setNewLoanType(e.target.value)}
              sx={{ mr: 2 }}
            >
              <MenuItem value="personal">Personal</MenuItem>
              <MenuItem value="educational">Educational</MenuItem>
              <MenuItem value="commercial">Commercial</MenuItem>
            </TextField>
            <Button variant="contained" color="primary" onClick={handleLoanCreate}>
              Apply for Loan
            </Button>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Loan Application Number</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loans.map(loan => (
                <TableRow key={loan.id}>
                  <TableCell>{loan.loan_appl_num}</TableCell>
                  <TableCell>{loan.loan_amt}</TableCell>
                  <TableCell>{loan.loan_type}</TableCell>
                  <TableCell>{loan.purpose}</TableCell>
                  <TableCell>{loan.loan_status}</TableCell>
                  <TableCell>
                    <Button variant="contained" color="info" onClick={() => setSelectedLoan(loan)}>Edit</Button>
                    <Button variant="contained" color="error" onClick={() => handleLoanDelete(loan.id)} style={{ marginLeft: '10px' }}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Dialog open={!!selectedLoan} onClose={() => setSelectedLoan(null)}>
            <DialogTitle>Edit Loan Application</DialogTitle>
            <DialogContent>
              {selectedLoan && (
                <>
                  <Typography>Loan Application Number: {selectedLoan.loan_appl_num}</Typography>
                  <TextField
                    label="New Amount"
                    type="number"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={newLoanAmount}
                    onChange={(e) => setNewLoanAmount(e.target.value)}
                    helperText="Leave blank to keep current amount"
                  />
                  <TextField
                    label="New Purpose"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={newLoanPurpose}
                    onChange={(e) => setNewLoanPurpose(e.target.value)}
                    helperText="Leave blank to keep current purpose"
                  />
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedLoan(null)} color="secondary">Cancel</Button>
              <Button onClick={handleLoanUpdate} color="primary">Save</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {tabValue === 2 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>Your Transactions</Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/transaction')} style={{ marginBottom: '20px' }}>
            Make a Transaction
          </Button>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Transaction ID</TableCell>
                <TableCell>From Account</TableCell>
                <TableCell>To Account</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map(transaction => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.transaction_id}</TableCell>
                  <TableCell>{transaction.from_acct}</TableCell>
                  <TableCell>{transaction.to_acct}</TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>{new Date(transaction.date).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Container>
  );
}

export default CustomerPage;