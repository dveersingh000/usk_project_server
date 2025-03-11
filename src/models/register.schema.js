const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// const {User} = require("../models/User");
const registerSchema = new Schema({
    firstName: { 
        type: String, 
        required: true
    },
    lastName: { 
        type: String, 
        required: true
    },
    email: { 
        type: String, 
        required: true, 
        unique: true
    },
    dob: { 
        type: Date, 
        required: true
    },
    permanentAddress: {
        type: String,
        required: true
    },
    // checkbox: {
    //     type: Boolean,
    //     required: true
    // },
    experience: {
        type: Number,
        required: true
    },
    education: {
        type: String,
        required: true
    },
    certificates: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    companyAddress: {
        type: String,
        required: true
    },
    website: {
        type: String,
        required: true
    },
    currentSalary: {
        type: Number,
        required: true
    },
    targetSalary: {
        type: Number,
        required: true
    },
}, {
        timestamps: true
});

const Register = mongoose.model("Register", registerSchema);
module.exports = Register;