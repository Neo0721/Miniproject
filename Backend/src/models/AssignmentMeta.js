const mongoose = require("mongoose");

const AssignmentMetaSchema = new mongoose.Schema(
    {
        department: {
            type: String,
            required: true,
            unique: true
        },
        lastAssignedStaffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff",
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("AssignmentMeta", AssignmentMetaSchema);
