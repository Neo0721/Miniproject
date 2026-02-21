const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./src/models/User");

async function listUniqueDepartments() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const depts = await User.distinct("department");
        console.log("[CHECK] Unique Departments in Users:", depts);
        process.exit(0);
    } catch (error) {
        console.error("[CHECK] Error:", error.message);
        process.exit(1);
    }
}

listUniqueDepartments();
