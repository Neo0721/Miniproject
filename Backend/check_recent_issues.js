const mongoose = require("mongoose");
require("dotenv").config();
const Issue = require("./src/models/Issue");

async function checkRecentIssues() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const recentIssues = await Issue.find().sort({ createdAt: -1 }).limit(5);
        console.log("[CHECK] Recent Issues:", JSON.stringify(recentIssues, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("[CHECK] Error:", error.message);
        process.exit(1);
    }
}

checkRecentIssues();
