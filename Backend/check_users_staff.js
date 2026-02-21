const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./src/models/User");

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const staffInUsers = await User.find({ role: "staff" });
        console.log(`[CHECK] Staff in Users collection: ${staffInUsers.length}`);
        console.log("[CHECK] Data:", JSON.stringify(staffInUsers, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("[CHECK] Error:", error.message);
        process.exit(1);
    }
}

checkUsers();
