const mongoose = require("mongoose");

const identityRecordSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["bvn", "nin"],
      required: true,
    },
    valueMasked: {
      type: String,
      required: true,
    },
    holderName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["inserted", "validated", "failed"],
      default: "inserted",
    },
    providerReference: String,
    providerPayload: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("IdentityRecord", identityRecordSchema);
