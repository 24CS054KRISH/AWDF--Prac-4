function errorHandler(err, req, res, next) {
    console.error(err);

    // Duplicate key error (e.g. unique email)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || "field";
        return res.status(400).json({
            message: "Validation failed",
            error: `User with this ${field} already exists`
        });
    }

    // Mongoose Validation Error
    if (err.name === "ValidationError") {
        const errors = {};
        for (let field in err.errors) {
            errors[field] = err.errors[field].message;
        }
        return res.status(400).json({
            message: "Validation failed",
            errors: errors
        });
    }

    // Invalid MongoDB ID
    if (err.name === "CastError") {
        return res.status(400).json({
            message: "Invalid ID format"
        });
    }

    // JWT Verification Error
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }

    // Default fallback
    res.status(500).json({
        message: "Internal Server Error"
    });
}

module.exports = errorHandler;

