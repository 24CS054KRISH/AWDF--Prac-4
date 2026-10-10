const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /register - Register a new user
router.post("/register", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !email.trim()) {
            return res.status(400).json({
                message: "Validation failed",
                error: "Email is required"
            });
        }

        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                message: "Validation failed",
                error: "Please enter a valid email address"
            });
        }

        if (!password) {
            return res.status(400).json({
                message: "Validation failed",
                error: "Password is required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Validation failed",
                error: "Password must be at least 6 characters long"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check for duplicate email
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                message: "Validation failed",
                error: "User with this email already exists"
            });
        }

        // Hash password with 10 salt rounds
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email: normalizedEmail,
            password: hashedPassword
        });

        const savedUser = await newUser.save();

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: savedUser._id,
                email: savedUser.email,
                createdAt: savedUser.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /login - Authenticate user & return JWT
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Validation failed",
                error: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        // Generate JWT with 1 hour expiration
        const secret = process.env.JWT_SECRET || "default_jwt_secret";
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email
            },
            secret,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token: token,
            user: {
                id: user._id,
                email: user.email
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /me - Get currently authenticated user
router.get("/me", auth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
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

module.exports = router;
