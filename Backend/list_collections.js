const mongoose = require("mongoose");
require("dotenv").config();

async function listCollections() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("[CHECK] Collections:", collections.map(c => c.name));
        process.exit(0);
    } catch (error) {
        console.error("[CHECK] Error:", error.message);
        process.exit(1);
    }
}

listCollections();
