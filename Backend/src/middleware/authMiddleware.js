const jwt = require("jsonwebtoken");
const config = require("../config/config");
const sessionModel = require("../models/session.model");

async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access token missing"
            });
        }

        const token = authHeader.split(" ")[1];

        
        let decoded;
        try {
            decoded = jwt.verify(token, config.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                message: "Invalid or expired token"
            });
        }

        const { id, sessionId } = decoded;

        if (!sessionId) {
            return res.status(401).json({
                message: "Session ID missing in token"
            });
        }

       
        const session = await sessionModel.findById(sessionId);

        if (!session) {
            return res.status(401).json({
                message: "Session not found"
            });
        }

        if (session.revoked) {
            return res.status(401).json({
                message: "Session revoked. Please login again"
            });
        }

      
        if (session.user.toString() !== id) {
            return res.status(401).json({
                message: "Session-user mismatch"
            });
        }

       
        req.userId = id;
        req.sessionId = sessionId;

        next();

    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

module.exports = authMiddleware;