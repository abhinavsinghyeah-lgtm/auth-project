const mongoose = require("mongoose");

const whitelistSchema = new mongoose.Schema({
  username: { type: String, unique: true }
});

module.exports = mongoose.model("Whitelist", whitelistSchema);