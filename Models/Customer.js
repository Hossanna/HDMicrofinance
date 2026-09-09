const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    middleName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    kycType: {
      type: String,
      enum: ["nin", "bvn"],
      required: true,
    },

    kycID: {
      type: String,
      required: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
    },

    address: {
      country: String,
      state: String,
      city: String,
      addressLine: String,
    },

    kycStatus: {
      type: String,
      enum: ["pending", "validated"],
      default: "pending",
    },

    onboardingStatus: {
      type: String,
      enum: [
        "initiated",
        "kyc_validated",
        "account_created",
      ],
      default: "initiated",
    },

    providerCustomerId: {
      type: String,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Customer",
  customerSchema
);