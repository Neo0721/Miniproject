const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./src/models/User");
const Staff = require("./src/models/Staff");

async function checkStaff() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("--- Checking Staff Availability ---");

        const departments = ["Mechanical", "IT", "Facilities", "Computer Science", "Administration"];

        for (const dept of departments) {
            const staffUsers = await User.find({ role: "staff", department: dept });
            const staffEntries = await Staff.find({ department: dept });

            console.log(`\nDepartment: ${dept}`);
            if (staffUsers.length > 0) {
                console.log(`  Users (role: staff): ${staffUsers.map(u => u.name + " (" + u.email + ")").join(", ")}`);
            } else {
                console.log("  Users (role: staff): None");
            }

            if (staffEntries.length > 0) {
                console.log(`  Staff Collection: ${staffEntries.map(s => s.name + " (" + s.email + ")").join(", ")}`);
            } else {
                console.log("  Staff Collection: None");
            }
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

checkStaff();
