const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  stock: { type: Number, required: true },
  cost: { type: Number, required: true },
  sellPrice: Number,
  margin: Number,
  profit: Number
}, { timestamps: true });

module.exports = mongoose.model("Inventory", inventorySchema);