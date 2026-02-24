const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  task: String,
  completed: Boolean
});

const daySchema = new mongoose.Schema({
  tasks: [taskSchema]
});

const scheduleSchema = new mongoose.Schema({
  days: [daySchema] // Array of 30 days
});

module.exports = mongoose.model("Schedule", scheduleSchema);