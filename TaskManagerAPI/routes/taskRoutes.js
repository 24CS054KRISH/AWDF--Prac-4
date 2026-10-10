const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const auth = require("../middleware/auth");
const taskCache = require("../cache/taskCache");

// Protect all routes in this router with JWT auth middleware
router.use(auth);

// GET /cache/stats or /tasks/cache/stats - Diagnostic cache statistics endpoint
router.get("/cache/stats", (req, res) => {
    const stats = taskCache.getCacheStats();
    res.status(200).json({
        message: "Cache statistics retrieved successfully",
        stats
    });
});

// GET / - Retrieve all tasks for the authenticated user (Cached with 60s TTL)
router.get("/", async (req, res, next) => {
    try {
        const cacheKey = taskCache.getUserTasksKey(req.user.userId);
        const cached = taskCache.get(cacheKey);

        if (cached.hit) {
            res.set("X-Cache", "HIT");
            return res.status(200).json(cached.data);
        }

        // Cache miss: query database
        const tasks = await Task.find({ user: req.user.userId }).sort({ createdAt: -1 });
        taskCache.set(cacheKey, tasks, 60);

        res.set("X-Cache", "MISS");
        res.status(200).json(tasks);
    } catch (error) {
        next(error);
    }
});

// GET /:id - Retrieve single task by ID (Cached individually with 60s TTL)
router.get("/:id", async (req, res, next) => {
    try {
        const cacheKey = taskCache.getSingleTaskKey(req.user.userId, req.params.id);
        const cached = taskCache.get(cacheKey);

        if (cached.hit) {
            res.set("X-Cache", "HIT");
            return res.status(200).json(cached.data);
        }

        // Cache miss: query database
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        taskCache.set(cacheKey, task, 60);
        res.set("X-Cache", "MISS");
        res.status(200).json(task);
    } catch (error) {
        next(error);
    }
});

// POST / - Create a new task (Invalidates user cache)
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

        // Invalidate user's tasks cache after creating new task
        taskCache.invalidateUserCache(req.user.userId);

        res.status(201).json({
            message: "Task created successfully",
            task: savedTask
        });
    } catch (error) {
        next(error);
    }
});

// PUT /:id - Update a task owned by the authenticated user (Invalidates cache)
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

        // Invalidate both individual task and task list cache
        taskCache.invalidateUserCache(req.user.userId, req.params.id);

        res.status(200).json({
            message: "Task updated successfully",
            task: task
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /:id - Delete a task owned by the authenticated user (Invalidates cache)
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

        // Invalidate both individual task and task list cache
        taskCache.invalidateUserCache(req.user.userId, req.params.id);

        res.status(200).json({
            message: "Task deleted successfully"
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;


