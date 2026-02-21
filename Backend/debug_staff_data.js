const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./src/models/User");
const Staff = require("./src/models/Staff");

async function checkStaffData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("--- Registered Staff from User Collection ---");
        const staffUsers = await User.find({ role: "staff" }).select("name email role department");
        console.log(JSON.stringify(staffUsers, null, 2));

        console.log("\n--- Staff Collection Entries ---");
        const staffEntries = await Staff.find();
        console.log(JSON.stringify(staffEntries, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

checkStaffData();
