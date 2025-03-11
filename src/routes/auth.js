const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Register = require("../models/register.schema");
const Kyc = require("../models/Kyc");
const router = express.Router();
const JWT_SECRET = "your_jwt_secret";
const AddUser = require("../models/addNewUser.schema");

// Dummy data for roles, states, and districts (replace with DB queries)
const roles = ["Super Admin", "State Admin", "District Admin"];
const states = ["State A", "State B", "State C"];
const districts = {
  "State A": ["District 1", "District 2"],
  "State B": ["District 3", "District 4"],
  "State C": ["District 5", "District 6"],
};

// Endpoint to fetch admin roles
router.get("/roles", (req, res) => {
  res.status(200).json(roles);
});

// Endpoint to fetch states
router.get("/states", (req, res) => {
  res.status(200).json(states);
});

// Endpoint to fetch districts based on the selected state
router.get("/districts/:state", (req, res) => {
  const { state } = req.params;
  const districtList = districts[state] || [];
  res.status(200).json(districtList);
});

// Endpoint to fetch hierarchical data based on role, state, and district
router.get("/hierarchy", (req, res) => {
  const { role, state, district } = req.query;

  // Example logic (replace with database queries)
  let data;
  if (role === "Super Admin") {
    data = { message: "Full admin access" };
  } else if (role === "State Admin" && states.includes(state)) {
    data = { message: `State-level data for ${state}` };
  } else if (
    role === "District Admin" &&
    districts[state]?.includes(district)
  ) {
    data = { message: `District-level data for ${district}, ${state}` };
  } else {
    data = { message: "No data found for the specified role and region" };
  }

  res.status(200).json(data);
});
// Signup Route
router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, referralCode, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      referralCode,
      role,
    });

    await user.save();

    // Remove sensitive data before returning the user
    const userToReturn = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      referralCode: user.referralCode,
      role: user.role,
    };

    res
      .status(201)
      .json({ message: "User registered successfully", user: userToReturn });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // if (user.role !== role) {
    //   return res.status(400).json({ message: "Invalid role" });
    // }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(200).json({
      token,
      role: user.role,
      user,
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

const users = [];

router.get("/get-users/:currentUserId", async (req, res) => {
  const { currentUserId } = req.params;
  try {
    const codes = await AddUser.find({ currentUserId });
    const codeArray = codes.map((code) => code.referralCode);
    const users = await User.find({ referralCode: { $in: codeArray } });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
// add new user
router.post("/add-user", async (req, res) => {
  const { email, phone, referralCode, currentUserId } = req.body;
  try {
    const existingUser = await AddUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const newUser = new AddUser({ email, phone, referralCode, currentUserId });
    await newUser.save();

    res.status(201).json({ message: "User added successfully", newUser });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Registraion Route
router.post("/register", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    dob,
    permanentAddress,
    experience,
    education,
    certificates,
    companyName,
    companyAddress,
    website,
    currentSalary,
    targetSalary,
  } = req.body;

  try {
    const parsedDob = new Date(dob.split("/").reverse().join("-"));
    const user = new Register({
      firstName,
      lastName,
      email,
      dob: parsedDob,
      permanentAddress,
      experience,
      education,
      certificates,
      companyName,
      companyAddress,
      website,
      currentSalary,
      targetSalary,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Registration failed", error: error.message });
  }
});

// KYC Submission Route
router.post("/kyc-submit", async (req, res) => {
  const { aadharNumber, panNumber, otp } = req.body;

  try {
    const kycData = new Kyc({
      // userId,
      aadharNumber,
      panNumber,
      otp,
      // aadharFront,
      // aadharBack,
      // panFron,
    });

    await kycData.save();
    res.status(200).json({ message: "KYC submitted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error submitting KYC", error: error.message });
  }
});

module.exports = router;
