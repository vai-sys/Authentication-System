const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true
    },
    otpHash: {
      type: String,
      required: [true, "Otp hash is required"]
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } 
    }
  },
  {
    timestamps: true
  }
);

const otpModel = mongoose.model("Otp", otpSchema);

module.exports = otpModel;