import admin from 'firebase-admin';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

let firebaseAdminInstance;
let authAdminInstance;

const initFirebase = () => {
  if (firebaseAdminInstance) return { firebaseAdminInstance, authAdminInstance };

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }

  firebaseAdminInstance = admin;
  authAdminInstance = admin.auth();

  return { firebaseAdminInstance, authAdminInstance };
};

export const getFirebaseAdmin = () => {
  return initFirebase().firebaseAdminInstance;
};

export const getAuthAdmin = () => {
  return initFirebase().authAdminInstance;
};

// For backward compatibility
export const firebaseAdmin = new Proxy({}, {
  get: (target, prop) => {
    const { firebaseAdminInstance } = initFirebase();
    return firebaseAdminInstance[prop];
  }
});

export const authAdmin = new Proxy({}, {
  get: (target, prop) => {
    const { authAdminInstance } = initFirebase();
    return authAdminInstance[prop];
  }
});
