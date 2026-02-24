const mongoose = require("mongoose");

const financeSchema = new mongoose.Schema({
  type: { type: String, enum: ["expense", "sale"], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  remark: { type: String },
  category: { type: String, required: true } // New: e.g., 'Marketing', 'Supplies'
}, { timestamps: true });

module.exports = mongoose.model("Finance", financeSchema);