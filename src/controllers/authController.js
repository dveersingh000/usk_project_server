const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();


exports.registerUser = async (req, res) => {
    try {
        let { firstName, lastName, emailOrPhone, password, referralCode, role } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !emailOrPhone || !password || !role) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Determine if input is an email or phone number
        let email = emailOrPhone.includes("@") ? emailOrPhone.toLowerCase() : null;
        let phone = emailOrPhone.match(/^\d{10}$/) ? emailOrPhone : null;

        if (!email && !phone) {
            return res.status(400).json({ message: "Please enter a valid email or 10-digit phone number." });
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: "Password must be at least 6 characters long, contain 1 uppercase letter, and 1 number." });
        }

        // Validate role
        role = role.toLowerCase();
        const validRoles = ["cma", "country_admin", "state_admin", "district_admin", "district_super_admin", "distributor_admin", "block_admin", "gpn_admin"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role selected." });
        }

        // Check if the email or phone number already exists
        let emailExists = email ? await User.findOne({ email }) : null;
        let phoneExists = phone ? await User.findOne({ phone }) : null;

        if (emailExists || phoneExists) {
            return res.status(400).json({ message: "User with this email or phone already exists." });
        }

        // Create new user (Mongoose pre-save hook will handle password hashing)
        const newUser = new User({
            firstName,
            lastName,
            email: email || undefined,  // ✅ fixes null storage
            phone: phone || undefined,  // ✅ fixes null storage
            password,
            referralCode,
            role
        });

        await newUser.save();

        res.status(201).json({ message: "Registration successful", user: newUser });
    } catch (error) {
        console.error("🔥 Registration Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


exports.loginUser = async (req, res) => {
  try {
    const { emailOrPhone, password, role } = req.body;

    let email = emailOrPhone.includes("@") ? emailOrPhone.trim().toLowerCase() : null;
    let phone = emailOrPhone.match(/^\d{10}$/) ? emailOrPhone.trim() : null;

    if (!email && !phone) {
      return res.status(400).json({ message: "Please enter a valid email or phone number." });
    }

    // 🔥 Correct precise user lookup
    let user = null;
    if (email) {
      user = await User.findOne({ email });
    } else if (phone) {
      user = await User.findOne({ phone });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🔒 Role match
    if (user.role.toLowerCase().trim() !== role.toLowerCase().trim()) {
      console.log("User role from DB:", user.role);
      console.log("Role from request:", role);
      return res.status(400).json({ message: "Incorrect role selected" });
    }

    // 🔑 Password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    console.error("🔥 Login Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




// Setup Nodemailer (Replace with your SMTP credentials)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Set in .env file
      pass: process.env.EMAIL_PASS, // Set in .env file
    },
  });
  
  // Function to generate random OTP
  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
  
  // Forgot Password API
  exports.forgotPassword = async (req, res) => {
    try {
      const { emailOrPhone } = req.body;
  
      if (!emailOrPhone) {
        return res.status(400).json({ message: "Email or phone is required." });
      }
  
      const email = emailOrPhone.includes("@") ? emailOrPhone.toLowerCase() : null;
      const phone = emailOrPhone.match(/^\d{10}$/) ? emailOrPhone : null;
  
      let user;
      if (email) {
        user = await User.findOne({ email });
      } else if (phone) {
        user = await User.findOne({ phone });
      }
  
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
  
      // Generate and save OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.resetOtp = otp;
      user.resetOtpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
      await user.save();
  
      if (user.email) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Password Reset OTP",
          text: `Your OTP is: ${otp} (valid for 5 mins)`,
        });
      }
  
      res.status(200).json({ message: "OTP sent to your email." });
    } catch (error) {
      console.error("🔥 Forgot Password Error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  

  exports.verifyOtp = async (req, res) => {
    try {
      const { emailOrPhone, otp } = req.body;
  
      if (!emailOrPhone || !otp) {
        return res.status(400).json({ message: "Both email/phone and OTP are required." });
      }
  
      const email = emailOrPhone.includes("@") ? emailOrPhone.toLowerCase() : null;
      const phone = emailOrPhone.match(/^\d{10}$/) ? emailOrPhone : null;
  
      let user;
      if (email) {
        user = await User.findOne({ email });
      } else if (phone) {
        user = await User.findOne({ phone });
      }
  
      if (!user || user.resetOtp !== otp || user.resetOtpExpiry < Date.now()) {
        return res.status(400).json({ message: "Invalid or expired OTP." });
      }
  
      res.status(200).json({ message: "OTP verified successfully." });
    } catch (error) {
      console.error("🔥 Verify OTP Error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  
  // Reset Password API
  exports.resetPassword = async (req, res) => {
    try {
      const { emailOrPhone, otp, newPassword } = req.body;
  
      if (!emailOrPhone || !otp || !newPassword) {
        return res.status(400).json({ message: "All fields are required." });
      }
  
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          message: "Password must be at least 6 characters, contain 1 uppercase letter and 1 number.",
        });
      }
  
      const email = emailOrPhone.includes("@") ? emailOrPhone.toLowerCase() : null;
      const phone = emailOrPhone.match(/^\d{10}$/) ? emailOrPhone : null;
  
      let user;
      if (email) {
        user = await User.findOne({ email });
      } else if (phone) {
        user = await User.findOne({ phone });
      }
  
      if (!user || user.resetOtp !== otp || user.resetOtpExpiry < Date.now()) {
        return res.status(400).json({ message: "Invalid or expired OTP." });
      }
  
      user.password = newPassword;
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      await user.save();
  
      res.status(200).json({ message: "Password reset successful. Please login with your new password." });
    } catch (error) {
      console.error("🔥 Reset Password Error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
