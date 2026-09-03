const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    providerTransactionId: {
      type: String,
      index: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit", "transfer", "fee"],
      default: "transfer",
    },
    status: {
      type: String,
      enum: ["pending", "successful", "failed", "unknown"],
      default: "pending",
    },
    amount: {
      type: Number,
      required: true,
    },
    fee: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    narration: String,
    destinationBankCode: String,
    destinationAccountNumber: String,
    destinationAccountName: String,
    providerMessage: String,
    providerPayload: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
