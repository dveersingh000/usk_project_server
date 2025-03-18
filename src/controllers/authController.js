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
            email,
            phone,
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

        // Determine if input is email or phone number
        let email = emailOrPhone.includes("@") ? emailOrPhone : null;
        let phone = emailOrPhone.match(/^\d{10}$/) ? emailOrPhone : null;

        if (!email && !phone) {
            return res.status(400).json({ message: "Please enter a valid email or phone number." });
        }

        // Find user using either email or phone
        let user = await User.findOne({ $or: [{ email }, { phone }] });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check if the role matches
        if (user.role !== role) {
            return res.status(400).json({ message: "Incorrect role selected" });
        }

        // Check if the password is correct
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

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
        return res.status(400).json({ message: "Please provide email or phone number." });
      }
  
      let user = await User.findOne({
        $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      });
  
      if (!user) {
        return res.status(400).json({ message: "User not found." });
      }
  
      // Generate OTP and store it with expiration time (5 minutes)
      const otp = generateOTP();
      user.resetOtp = otp;
      user.resetOtpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes from now
      await user.save();
  
      // Send OTP via email (extend for SMS if needed)
      if (user.email) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Password Reset OTP",
          text: `Your OTP for password reset is: ${otp}. It expires in 5 minutes.`,
        });
      }
  
      res.status(200).json({ message: "OTP sent successfully. Check your email." });
    } catch (error) {
      console.error("🔥 Forgot Password Error:", error.message);
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
  
      let user = await User.findOne({
        $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
        resetOtp: otp,
        resetOtpExpiry: { $gt: Date.now() },
      });
  
      if (!user) {
        return res.status(400).json({ message: "Invalid OTP or OTP expired." });
      }
  
      // Hash new password and update user
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetOtp = undefined;
      user.resetOtpExpiry = undefined;
      await user.save();
  
      res.status(200).json({ message: "Password reset successfully." });
    } catch (error) {
      console.error("🔥 Reset Password Error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
