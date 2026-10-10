const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    try {
        const authHeader = req.headers.authorization || req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access denied. No token provided."
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Access denied. Token missing."
            });
        }

        const secret = process.env.JWT_SECRET || "default_jwt_secret";
        const decoded = jwt.verify(token, secret);

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }
}

module.exports = auth;
