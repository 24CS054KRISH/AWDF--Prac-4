const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Task title is required"],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    completed: {
        type: Boolean,
        default: false
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User reference is required"]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;

