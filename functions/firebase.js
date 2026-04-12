import admin from 'firebase-admin';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket
  });
}

export const firebaseAdmin = admin;
export const authAdmin = admin.auth();
export const bucket = admin.storage().bucket();
