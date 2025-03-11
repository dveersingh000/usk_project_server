const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    referralCode: { type: String },
    role: { type: String }, // Assuming you need the role field here too.
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
