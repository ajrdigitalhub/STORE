import { authAdmin } from './firebase.js';

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decodedToken = await authAdmin.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuthenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    next();
    return;
  }

  try {
    const decodedToken = await authAdmin.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch {
    next();
  }
};

export const isAdmin = (req, res, next) => {
  const user = req.user;
  // Check for admin role in custom claims or by email
  if (!user || (user.role !== 'admin' && user.email !== 'ajrgroupconnect@gmail.com')) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};
