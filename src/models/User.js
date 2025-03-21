const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },  // Allow empty email
    phone: { type: String, unique: true, sparse: true }, 
    password: { type: String, required: true },
    referralCode: { type: String },
    resetOtp: { type: String },
  resetOtpExpiry: { type: Date },
    role: { type: String, enum: ['cma', 'country_admin', 'state_admin', 'district_admin', 'district_super_admin', 'distributor_admin', 'block_admin', 'GPN_admin' ], required: true },
  },
  { timestamps: true }
);

// ✅ Ensure `phone` index allows multiple null values
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
