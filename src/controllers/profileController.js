const Profile = require("../models/Profile");

exports.createOrUpdateProfile = async (req, res) => {
    try {
        const { userId, dob, permanentAddress, workExperience, education, certificateUrl, companyName, companyAddress, website, currentSalary, targetSalary } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        let profile = await Profile.findOne({ userId });

        if (profile) {
            // Update existing profile
            profile.dob = dob;
            profile.permanentAddress = permanentAddress;
            profile.workExperience = workExperience;
            profile.education = education;
            profile.certificateUrl = certificateUrl;
            profile.companyName = companyName;
            profile.companyAddress = companyAddress;
            profile.website = website;
            profile.currentSalary = currentSalary;
            profile.targetSalary = targetSalary;
        } else {
            // Create new profile
            profile = new Profile({
                userId,
                dob,
                permanentAddress,
                workExperience,
                education,
                certificateUrl,
                companyName,
                companyAddress,
                website,
                currentSalary,
                targetSalary
            });
        }

        await profile.save();
        res.status(201).json({ message: "Profile saved successfully", profile });
    } catch (error) {
        console.error("🔥 Profile Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const profile = await Profile.findOne({ userId }).populate("userId", "firstName lastName email phone");
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.status(200).json(profile);
    } catch (error) {
        console.error("🔥 Profile Fetch Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
