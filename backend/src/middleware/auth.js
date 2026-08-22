const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dayflow_odoo_hackathon_secret_key_2026';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Token expired or invalid' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'HR')) {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin or HR access required' });
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  JWT_SECRET
};
