const mongoose = require("mongoose");
require("dotenv").config();
const NotificationService = require("./src/services/NotificationService");

async function testITNotification() {
    try {
        console.log("1. Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("   Connected.");

        // Mock Issue - Department IT (Now has Test IT Staff)
        const mockIssue = {
            _id: new mongoose.Types.ObjectId(),
            title: "Test Issue for IT Notification",
            description: "Verifying that IT staff now receive alerts.",
            priority: "medium",
            category: "IT",
            department: "IT",
            reportedBy: {
                name: "Test User",
                email: "test_user@example.com"
            },
            createdAt: new Date()
        };

        console.log("2. Triggering NotificationService for IT...");
        await NotificationService.triggerNewIssueAlert(mockIssue);

        console.log("3. Done.");
        process.exit(0);
    } catch (error) {
        console.error("!!! ERROR !!!", error);
        process.exit(1);
    }
}

testITNotification();
