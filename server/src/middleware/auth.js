import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  return applyAuthToken(req, res, next, token, true);
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  return applyAuthToken(req, null, next, token, false);
}

function applyAuthToken(req, res, next, token, required) {
  if (!token) {
    if (required) {
      return res.status(401).json({ message: 'Cần đăng nhập' });
    }
    return next();
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    req.userRole = payload.role;
    return next();
  } catch {
    if (required) {
      return res.status(401).json({ message: 'Phiên không hợp lệ' });
    }
    return next();
  }
}

export async function adminOnly(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin' });
    }
    next();
  } catch {
    return res.status(403).json({ message: 'Không có quyền' });
  }
}
