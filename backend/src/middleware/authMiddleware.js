import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing authorization header for:', req.path);
      return res.status(401).json({ message: 'Missing authorization header. Please login again.' });
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
    
    // Log token info for debugging
    console.log('🔍 Verifying token:', {
      path: req.path,
      tokenPreview: token.substring(0, 15) + '...',
      secretUsed: JWT_SECRET.substring(0, 5) + '...',
    });
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        console.log('❌ User not found for token, userId:', decoded.userId);
        return res.status(401).json({ message: 'User not found. Please login again.' });
      }

      req.user = {
        id: user._id,
        role: user.role,
        mobileNumber: user.mobileNumber,
        fullName: user.fullName,
      };

      console.log('✅ Token verified successfully for user:', user.fullName, 'role:', user.role);
      next();
    } catch (jwtError) {
      console.error('❌ JWT verification error:', {
        name: jwtError.name,
        message: jwtError.message,
        path: req.path,
        tokenPreview: token.substring(0, 20) + '...',
      });
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired. Please login again.' });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token. Please login again.' });
      }
      return res.status(401).json({ message: 'Invalid or expired token. Please login again.' });
    }
  } catch (err) {
    console.error('❌ authRequired error:', err);
    return res.status(401).json({ message: 'Authentication failed. Please login again.' });
  }
}

export function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}


