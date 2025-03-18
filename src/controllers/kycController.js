const Kyc = require("../models/Kyc");

exports.submitKyc = async (req, res) => {
    try {
        const { aadharNumber, panNumber, otp } = req.body;

        const kycData = new Kyc({ aadharNumber, panNumber, otp });
        await kycData.save();

        res.status(200).json({ message: "KYC submitted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error submitting KYC", error: error.message });
    }
};
