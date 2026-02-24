const mongoose = require("mongoose");

const overviewSchema = new mongoose.Schema({
  totalUsers: Number,
  revenue: Number,
  expenses: Number,
  profit: Number,
  revenueGraph: [Number],
  profitGraph: [Number]
});

module.exports = mongoose.model("Overview", overviewSchema);