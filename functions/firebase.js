const admin = require('firebase-admin');
const config = require('../firebase-applet-config.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // Or use service account if available
    projectId: config.projectId,
    storageBucket: config.storageBucket
  });
}

const db = admin.firestore();
const authAdmin = admin.auth();
const bucket = admin.storage().bucket();

module.exports = { admin, db, authAdmin, bucket };
