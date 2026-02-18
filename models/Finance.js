const mongoose = require("mongoose");

const financeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["sale", "expense"],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  remark: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("Finance", financeSchema);
