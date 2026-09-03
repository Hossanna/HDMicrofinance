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
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    bvn: {
      type: String,
      trim: true,
      select: false,
    },
    nin: {
      type: String,
      trim: true,
      select: false,
    },
    kycType: {
      type: String,
      enum: ["bvn", "nin"],
    },
    kycID: {
      type: String,
    },
    identityValueMasked: String,
    identityVerificationReference: String,
    identityVerifiedAt: Date,
    dob: Date,
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: {
        type: String,
        default: "Nigeria",
      },
    },
    kycLevel: {
      type: String,
      enum: ["1", "2", "3"],
      default: "1",
    },
    kycStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    onboardingStatus: {
      type: String,
      enum: [
        "initiated",
        "identity_verified",
        "account_created",
        "completed",
        "failed",
      ],
      default: "initiated",
    },
    providerCustomerId: String,
    providerPayload: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  },
);

customerSchema.virtual("fullName").get(function getFullName() {
  return [this.firstName, this.middleName, this.lastName]
    .filter(Boolean)
    .join(" ");
});

customerSchema.set("toJSON", { virtuals: true });
customerSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Customer", customerSchema);
