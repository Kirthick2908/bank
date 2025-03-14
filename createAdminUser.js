const admin = require('firebase-admin');

// Initialize the Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  // Or use a service account key:
  // credential: admin.credential.cert(require('./path-to-service-account-key.json')),
});

async function createAdminUser() {
  try {
    // First, delete the existing user if it exists (optional, to avoid conflicts)
    try {
      await admin.auth().deleteUser('OzupPBfyZ4Qisnj0wovEhlHaRDh2');
      console.log('Existing user deleted');
    } catch (deleteError) {
      console.log('No existing user to delete or error:', deleteError.message);
    }

    // Create the user with the specified UID
    await admin.auth().createUser({
      uid: 'pmun96vC5abTJ3pNF522rHpAKOT2',
      email: 'kirthickdeivasigamani@gmail.com',
      password: 'Audi@555',
      emailVerified: true, // Optional: mark email as verified
      disabled: false, // Ensure the user is enabled
    });
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser().then(() => process.exit());