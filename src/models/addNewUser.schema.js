const mongoose = require("mongoose");

const newUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  referralCode: { type: String, required: true },
  currentUserId: { type: String, required: true },
});

const AddUser = mongoose.model("AddUser", newUserSchema);
module.exports = AddUser;
