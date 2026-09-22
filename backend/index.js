const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/leetcode-streak";
mongoose
    .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection failed:", err));

// Streak Schema
const streakSchema = new mongoose.Schema({
    username: { type: String, required: true, index: true },
    streak: { type: Number, required: true },
    date: { type: String, required: true, unique: true, sparse: true }, // YYYY-MM-DD
    timestamp: { type: Date, default: Date.now },
});

// Compound index to allow one entry per user per day
streakSchema.index({ username: 1, date: 1 }, { unique: true });

const Streak = mongoose.model("Streak", streakSchema);

// POST /api/streak - Save streak data
app.post("/api/streak", async (req, res) => {
    try {
        const { username, streak, date } = req.body;

        if (!username || streak === undefined || !date) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Upsert: update if exists, create if not
        const result = await Streak.findOneAndUpdate(
            { username, date },
            { streak, timestamp: new Date() },
            { upsert: true, new: true }
        );

        res.json({ success: true, data: result });
    } catch (error) {
        console.error("POST /api/streak error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/streak/:username - Fetch all streak records for a user
app.get("/api/streak/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const streaks = await Streak.find({ username }).sort({ date: 1 }).lean();

        if (!streaks.length) {
            return res.json({ data: [], message: "No streak data found" });
        }

        res.json({ data: streaks });
    } catch (error) {
        console.error("GET /api/streak error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/streak/:username/latest - Get most recent streak
app.get("/api/streak/:username/latest", async (req, res) => {
    try {
        const { username } = req.params;
        const latest = await Streak.findOne({ username }).sort({ date: -1 }).lean();

        if (!latest) {
            return res.json({ data: null, message: "No data found" });
        }

        res.json({ data: latest });
    } catch (error) {
        console.error("GET /api/streak/latest error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`LeetCode Streak Backend running on http://localhost:${PORT}`);
});


