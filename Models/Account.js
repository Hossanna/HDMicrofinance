const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    providerAccountId: {
      type: String,
    },

    accountName: {
      type: String,
      required: true,
    },

    accountNumber: {
      type: String,
      required: true,
      unique: true,
    },

    bankCode: {
      type: String,
    },

    bankName: {
      type: String,
    },

    accountType: {
      type: String,
      enum: ["savings", "current"],
      default: "savings",
    },

    balance: {
      type: Number,
      default: 0,
    },

    kycLevel: {
      type: String,
      default: "1",
    },

    providerPayload: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Account",
  accountSchema
);