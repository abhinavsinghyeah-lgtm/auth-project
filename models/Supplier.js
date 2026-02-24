const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount: Number,
  date: Date,
  reason: String
});

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: String,
  address: String,
  activityLevel: { type: String, enum: ["high", "medium", "low"] },
  payments: [paymentSchema]
}, { timestamps: true });

module.exports = mongoose.model("Supplier", supplierSchema);