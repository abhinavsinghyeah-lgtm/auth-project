const mongoose = require("mongoose");

const overviewSchema = new mongoose.Schema({
  totalUsers: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },

  revenueGraph: { type: [Number], default: [] },
  profitGraph: { type: [Number], default: [] },

  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Overview", overviewSchema);
