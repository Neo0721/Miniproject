const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./src/models/User");

async function addTestStaff() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const testStaff = [
            {
                name: "Test IT Staff",
                email: "it_staff_test@example.com",
                role: "staff",
                department: "IT",
                phone: "1234567890"
            },
            {
                name: "Test Facilities Staff",
                email: "facilities_staff_test@example.com",
                role: "staff",
                department: "Facilities",
                phone: "0987654321"
            }
        ];

        for (const data of testStaff) {
            // Check if exists
            const existing = await User.findOne({ email: data.email });
            if (existing) {
                console.log(`User ${data.email} already exists.`);
                // Ensure department is set correctly
                if (existing.department !== data.department) {
                    existing.department = data.department;
                    await existing.save();
                    console.log(`Updated department for ${data.email} to ${data.department}`);
                }
            } else {
                await User.create(data);
                console.log(`Created user: ${data.name} (${data.department})`);
            }
        }

        console.log("Done adding test staff.");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

addTestStaff();
