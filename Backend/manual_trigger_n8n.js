const mongoose = require("mongoose");
require("dotenv").config();
const NotificationService = require("./src/services/NotificationService");

async function testNotification() {
    try {
        console.log("1. Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("   Connected.");

        console.log("2. Checking Environment...");
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        console.log(`   N8N_WEBHOOK_URL: ${webhookUrl ? "DEFINED (" + webhookUrl + ")" : "UNDEFINED"}`);

        if (!webhookUrl) {
            throw new Error("Missing N8N_WEBHOOK_URL in .env");
        }

        // Mock Issue - Department Mechanical (Has Staff: Mr Nivin)
        const mockIssue = {
            _id: new mongoose.Types.ObjectId(),
            title: "Test Issue for n8n Debugging",
            description: "This is a manual test to verify n8n connectivity.",
            priority: "high",
            category: "Mechanical", // Fallback
            department: "Mechanical", // Primary
            reportedBy: {
                name: "Test User",
                email: "test@example.com"
            },
            createdAt: new Date()
        };

        console.log("3. Triggering NotificationService...");
        await NotificationService.triggerNewIssueAlert(mockIssue);

        console.log("4. Done. Check n8n dashboard.");
        process.exit(0);
    } catch (error) {
        console.error("!!! ERROR !!!", error);
        process.exit(1);
    }
}

testNotification();
