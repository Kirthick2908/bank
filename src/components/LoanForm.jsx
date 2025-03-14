import React, { useState } from 'react';
import { TextField, Button, Container, Typography, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function LoanForm() {
  const [loanType, setLoanType] = useState('personal');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [assetProofName, setAssetProofName] = useState(''); // Placeholder for asset proof name
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Please log in first.');
        navigate('/login');
        return;
      }

      const customerId = `2025${Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7)}`;
      const loanApplNum = `PMBL00${Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7)}`;

      await addDoc(collection(db, 'loan_application'), {
        customer_id: customerId,
        loan_appl_num: loanApplNum,
        loan_amt: Number(amount),
        loan_type: loanType,
        loan_interest: loanType === 'personal' ? 8 : loanType === 'educational' ? 6 : 10,
        loan_status: 'pending',
        purpose,
        asset_proof_name: assetProofName || 'Not Provided' // Store asset proof name as a placeholder
      }).catch((error) => {
        console.error('Firestore error:', error.code, error.message);
        throw error;
      });

      navigate('/dashboard');
    } catch (error) {
      alert('Failed to apply for loan: ' + error.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Apply for Loan</Typography>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Loan Type</InputLabel>
          <Select value={loanType} onChange={(e) => setLoanType(e.target.value)} label="Loan Type">
            <MenuItem value="personal">Personal</MenuItem>
            <MenuItem value="educational">Educational</MenuItem>
            <MenuItem value="commercial">Commercial</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Loan Amount" type="number" variant="outlined" fullWidth margin="normal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <TextField label="Purpose of Loan" variant="outlined" fullWidth margin="normal" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        <TextField
          label="Asset Proof Document Name"
          variant="outlined"
          fullWidth
          margin="normal"
          value={assetProofName}
          onChange={(e) => setAssetProofName(e.target.value)}
          helperText="Enter the name of the asset proof document (e.g., PropertyDoc.pdf)"
        />
        <Button type="submit" variant="contained" color="primary" style={{ marginTop: '10px' }}>Apply</Button>
      </form>
    </Container>
  );
}

export default LoanForm;