const admin = require('firebase-admin');
require('dotenv').config();

let bucket = null;

try {
  // Decode base64 service account from environment variable
  const serviceAccountBase64 = process.env.APP_FIREBASE_SERVICE_ACCOUNT_BASE64;
  const bucketName = process.env.APP_FIREBASE_STORAGE_BUCKET;

  if (serviceAccountBase64 && serviceAccountBase64 !== "YOUR_BASE64_ENCODED_SERVICE_ACCOUNT_JSON" && bucketName && bucketName !== "YOUR_FIREBASE_STORAGE_BUCKET") {
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('ascii');
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Initialize if not already initialized
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: bucketName
      });
    }

    bucket = admin.storage().bucket();
    console.log('Firebase Admin initialized successfully');
  } else {
    console.warn('Firebase Admin credentials missing. Upload feature will be disabled.');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

module.exports = { bucket };
