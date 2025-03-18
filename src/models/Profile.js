const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dob: { type: String, required: true },
    permanentAddress: { type: String, required: true },
    workExperience: { type: Number, required: true },
    education: { type: String, required: true },
    certificateUrl: { type: String }, // Will store the URL for the uploaded certificate
    companyName: { type: String },
    companyAddress: { type: String },
    website: { type: String },
    currentSalary: { type: Number },
    targetSalary: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model("Profile", profileSchema);
