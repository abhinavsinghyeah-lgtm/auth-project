const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["owner", "admin", "user"],
    default: "user"
  },
  lastLogin: {
    type: Date
  },
  theme: { // New field for theme persistence
    type: String,
    enum: ["light", "dark", "blue"],
    default: "light"
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);