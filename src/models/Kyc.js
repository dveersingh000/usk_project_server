const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  aadhar_card_number: { type: String, required: true },
  Front_side_of_adhaar: { type: String, required: true },
  Back_side_of_adhaar: { type: String, required: true },
  Pan_number: { type: String, required: true },
  Front_side_of_Pan: { type: String, required: true },
  Enter_OTP: { type: String, required: true },
});
const UserKyc = mongoose.model("UskUser", userSchema);

module.exports = UserKyc;
