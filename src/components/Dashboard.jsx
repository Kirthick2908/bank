import React from 'react';
import { Typography, Container, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Welcome to Your Dashboard</Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/account')} style={{ margin: '10px' }}>
        Create New Account
      </Button>
      <Button variant="contained" color="secondary" onClick={() => navigate('/account-management')} style={{ margin: '10px' }}>
        Manage Accounts
      </Button>
      <Button variant="contained" color="primary" onClick={() => navigate('/loan')} style={{ margin: '10px' }}>
        Apply for Loan
      </Button>
      <Button variant="contained" color="secondary" onClick={() => navigate('/transaction')} style={{ margin: '10px' }}>
        Make Transaction
      </Button>
    </Container>
  );
}

export default Dashboard;