const mongoose = require("mongoose");

const StaffSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        department: {
            type: String,
            required: true,
            trim: true
        },
        staffId: {
            type: String,
            unique: true,
            sparse: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Staff", StaffSchema);
