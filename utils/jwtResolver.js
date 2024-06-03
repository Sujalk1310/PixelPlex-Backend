const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;
const BlacklistToken = require('../models/BlacklistToken');

const verifyTokenMiddleware = async (req, res, next) => {
    const token = req.headers.authorization;

    try {
        if (!token) return res.status(401).json({ message: 'No token provided' });

        const blacklistedToken = await BlacklistToken.findOne({ token });
        if (blacklistedToken) return res.status(401).json({ message: 'Token revoked' });

        const decoded = jwt.verify(token, SECRET_KEY);
        
        // Compare the user identification information in the token with the request user
        if (req.headers.uid && decoded.userId !== req.headers.uid) return res.status(401).json({ message: 'Unauthorized access' });

        // Token verification succeeded
        next();
    } catch (error) {
        // Token verification failed
        return res.status(401).json({ message: 'Expired/Invalid token (Re-login)' });
    }
};

module.exports = { verifyTokenMiddleware };