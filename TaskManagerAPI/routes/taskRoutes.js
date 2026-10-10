const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const auth = require("../middleware/auth");

// Protect all routes in this router with JWT auth middleware
router.use(auth);

// GET / - Retrieve all tasks for the authenticated user
router.get("/", async (req, res, next) => {
    try {
        const tasks = await Task.find({ user: req.user.userId }).sort({ createdAt: -1 });
        res.status(200).json(tasks);
    } catch (error) {
        next(error);
    }
});

// POST / - Create a new task for the authenticated user
router.post("/", async (req, res, next) => {
    try {
        const { title, description, completed } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Validation failed",
                error: "Task title is required"
            });
        }

        const task = new Task({
            title: title.trim(),
            description: description !== undefined ? description.trim() : "",
            completed: Boolean(completed),
            user: req.user.userId
        });

        const savedTask = await task.save();
        res.status(201).json({
            message: "Task created successfully",
            task: savedTask
        });
    } catch (error) {
        next(error);
    }
});

// PUT /:id - Update a task owned by the authenticated user
router.put("/:id", async (req, res, next) => {
    try {
        const { title, description, completed } = req.body;

        if (title !== undefined && (!title || !title.trim())) {
            return res.status(400).json({
                message: "Validation failed",
                error: "Task title cannot be empty"
            });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (completed !== undefined) updateData.completed = Boolean(completed);

        const task = await Task.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user.userId
            },
            updateData,
            {
                returnDocument: "after",
                runValidators: true
            }
        );


        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.status(200).json({
            message: "Task updated successfully",
            task: task
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /:id - Delete a task owned by the authenticated user
router.delete("/:id", async (req, res, next) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.status(200).json({
            message: "Task deleted successfully"
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

