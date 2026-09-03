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
      index: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    accountType: {
      type: String,
      enum: ["savings", "current", "wallet"],
      default: "savings",
    },
    currency: {
      type: String,
      default: "NGN",
    },
    balance: {
      type: Number,
      default: 0,
    },
    kycLevel: {
      type: String,
      enum: ["1", "2", "3"],
      default: "1",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "restricted", "closed"],
      default: "active",
    },
    providerPayload: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Account", accountSchema);
