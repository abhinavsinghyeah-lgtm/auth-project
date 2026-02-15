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
  }
}, { timestamps: true }); // THIS ADDS createdAt & updatedAt

module.exports = mongoose.model("User", userSchema);
