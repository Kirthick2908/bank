const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Configure Nodemailer with environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass,
  },
});

// Helper function to fetch customer email
async function getCustomerEmail(customerId) {
  const customerDoc = await admin.firestore()
    .collection('customer_detail')
    .where('customer_id', '==', customerId)
    .limit(1)
    .get();

  if (customerDoc.empty) {
    throw new Error(`Customer not found for customer_id: ${customerId}`);
  }

  return customerDoc.docs[0].data().email;
}

// Cloud Function to send email on account status update
exports.sendAccountStatusEmail = functions.firestore
  .document('bank_account/{accountId}')
  .onUpdate(async (change, context) => {
    const newStatus = change.after.data().acct_status;
    const oldStatus = change.before.data().acct_status;
    const customerId = change.after.data().customer_id;

    if (newStatus !== oldStatus && (newStatus === 'active' || newStatus === 'delete')) {
      try {
        const email = await getCustomerEmail(customerId);

        const mailOptions = {
          from: functions.config().email.user,
          to: email,
          subject: newStatus === 'active' ? 'Account Approved' : 'Account Rejected',
          text: `Your account status has been updated to ${newStatus}.`,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', email);
        return null;
      } catch (error) {
        console.error('Error sending account status email:', error.message);
        return null;
      }
    }
    return null;
  });

// Cloud Function to send email on loan status update
exports.sendLoanStatusEmail = functions.firestore
  .document('loan_application/{loanId}')
  .onUpdate(async (change, context) => {
    const newStatus = change.after.data().loan_status;
    const oldStatus = change.before.data().loan_status;
    const email = change.after.data().email;

    if (newStatus !== oldStatus && (newStatus === 'approved' || newStatus === 'rejected')) {
      try {
        const mailOptions = {
          from: functions.config().email.user,
          to: email,
          subject: newStatus === 'approved' ? 'Loan Approved' : 'Loan Rejected',
          text: `Your loan application status has been updated to ${newStatus}.`,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', email);
        return null;
      } catch (error) {
        console.error('Error sending loan status email:', error.message);
        return null;
      }
    }
    return null;
  });

// Cloud Function to process transactions using onRequest with manual CORS
exports.processTransaction = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send({ error: { code: 'method-not-allowed', message: 'Method Not Allowed' } });
    return;
  }

  try {
    // Verify Firebase Auth token
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      res.status(401).send({ error: { code: 'unauthenticated', message: 'No authentication token provided' } });
      return;
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { fromAccount, toAccount, amount } = req.body;

    if (!fromAccount || !toAccount || !amount || fromAccount === toAccount) {
      res.status(400).send({ error: { code: 'invalid-argument', message: 'Invalid transaction details' } });
      return;
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      res.status(400).send({ error: { code: 'invalid-argument', message: 'Invalid amount' } });
      return;
    }

    const db = admin.firestore();
    const batch = db.batch();

    const fromAccountDoc = await db.collection('bank_account')
      .where('acct_number', '==', fromAccount)
      .where('userId', '==', userId)
      .where('acct_status', '==', 'active')
      .limit(1)
      .get();

    if (fromAccountDoc.empty) {
      res.status(404).send({ error: { code: 'not-found', message: 'Sender account not found or unauthorized' } });
      return;
    }

    const toAccountDoc = await db.collection('bank_account')
      .where('acct_number', '==', toAccount)
      .where('acct_status', '==', 'active')
      .limit(1)
      .get();

    if (toAccountDoc.empty) {
      res.status(404).send({ error: { code: 'not-found', message: 'Receiver account not found or inactive' } });
      return;
    }

    const fromData = fromAccountDoc.docs[0].data();
    const toData = toAccountDoc.docs[0].data();

    if (fromData.acct_balance < amountNum) {
      res.status(400).send({ error: { code: 'failed-precondition', message: 'Insufficient balance in sender account' } });
      return;
    }

    const fromRef = fromAccountDoc.docs[0].ref;
    batch.update(fromRef, {
      acct_balance: fromData.acct_balance - amountNum,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    const toRef = toAccountDoc.docs[0].ref;
    batch.update(toRef, {
      acct_balance: toData.acct_balance + amountNum,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    const transactionId = `TXN${Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7)}`;
    const transactionRef = db.collection('transaction').doc();
    batch.set(transactionRef, {
      transaction_id: transactionId,
      userId: userId,
      from_acct: fromAccount,
      to_acct: toAccount,
      amount: amountNum,
      date: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });

    await batch.commit();
    res.status(200).send({ success: true, transactionId: transactionId });
  } catch (error) {
    console.error('Error in processTransaction:', error.message);
    res.status(500).send({ error: { code: 'internal', message: error.message } });
  }
});