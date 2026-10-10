const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const taskRoutes = require("./routes/taskRoutes");
const authRoutes = require("./routes/authRoutes");
const auth = require("./middleware/auth");
const User = require("./models/User");

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.log("MongoDB connection failed:", error.message);
    });

// Routes
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/tasks", taskRoutes);

// Direct /me endpoint alias
app.get("/me", auth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

// Global Error Handler
app.use(errorHandler);

// Start Server on Port from ENV or 5000
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;



