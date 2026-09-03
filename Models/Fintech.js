const mongoose = require("mongoose");

const fintechSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      required: false,
    },
    // rcNumber: {
    //   type: String,
    //   trim: true,
    // },
    // clientId: {
    //   type: String,
    //   index: true,
    // },
    // status: {
    //   type: String,
    //   enum: ["pending", "active", "suspended"],
    //   default: "pending",
    // },
    providerPayload: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Fintech", fintechSchema);
