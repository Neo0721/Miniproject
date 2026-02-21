const mongoose = require("mongoose");
require("dotenv").config();
const Staff = require("./src/models/Staff");

async function checkStaff() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const staffCount = await Staff.countDocuments();
        const staff = await Staff.find();
        console.log(`[CHECK] Total Staff: ${staffCount}`);
        console.log("[CHECK] Data:", JSON.stringify(staff, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("[CHECK] Error:", error.message);
        process.exit(1);
    }
}

checkStaff();
