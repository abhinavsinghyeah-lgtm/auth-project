const Finance = require("./models/Finance");
const cookieParser = require("cookie-parser");
const path = require("path");
const Overview = require("./models/Overview");
const Whitelist = require("./models/Whitelist");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const User = require("./models/User");
const Supplier = require("./models/Supplier");
const Inventory = require("./models/Inventory");
const Schedule = require("./models/Schedule");
const Note = require("./models/Note");
const Log = require("./models/Log");
const express = require("express");
const mongoose = require("mongoose");

require('dotenv').config();

const app = express();
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get("/login.html", (req, res) => {
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect("/admin");
    } catch {}
  }
  res.sendFile(path.join(__dirname, "public/login.html"));
});

app.get("/index.html", (req, res) => {
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect("/admin");
    } catch {}
  }
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/", (req, res) => {
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect("/admin");
    } catch {}
  }
  res.sendFile(path.join(__dirname, "public/index.html"));
});
app.use(express.static("public", { index: false }));

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Database connected");
    const exists = await Overview.findOne();
    if (!exists) {
      await Overview.create({
        totalUsers: 0,
        revenue: 92000,
        expenses: 45000,
        profit: 47000,
        revenueGraph: [10000,15000,18000,22000,27000],
        profitGraph: [5000,7000,9000,11000,14000]
      });
      console.log("Overview seeded");
    }
  })
  .catch((error) => {
    console.log("Connection error:", error);
  });

function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

async function adminMiddleware(req, res, next) {
  const user = await User.findById(req.userId);
  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    return res.status(403).send("Admin access required");
  }
  next();
}

async function logActivity(userId, action) {
  await Log.create({ userId, action });
}

// REGISTER ROUTE
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }
    const isWhitelisted = await Whitelist.findOne({ username });
    const role = isWhitelisted ? "admin" : "user";
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      role
    });
    await newUser.save();
    await logActivity(newUser._id, `Registered new user: ${username}`);
    res.send("User registered successfully");
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});

// LOGIN ROUTE
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send("User not found");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Invalid password");
    }
    user.lastLogin = new Date();
    await user.save();
    await logActivity(user._id, `Logged in: ${username}`);
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 2 * 60 * 60 * 1000
    });
    res.json({ message: "Login successful" });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});

// PROFILE
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});

// LOGOUT
app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });
  res.json({ message: "Logged out" });
});

// ADMIN PAGE
app.get("/admin", authMiddleware, adminMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin.html"));
});

// USERS
app.get("/api/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch {
    res.status(500).send("Server error");
  }
});

app.put("/api/users/:id/role", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);
    if (!targetUser) {
      return res.status(404).send("User not found");
    }
    if ((targetUser.role === "admin" || targetUser.role === "owner") && currentUser.role !== "owner") {
      return res.status(403).send("Only owner can modify admin/owner");
    }
    targetUser.role = role;
    await targetUser.save();
    await logActivity(req.userId, `Updated role for user ${targetUser.username} to ${role}`);
    res.send("Role updated");
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.delete("/api/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);
    if (!targetUser) {
      return res.status(404).send("User not found");
    }
    if (targetUser.role === "owner") {
      return res.status(403).send("Owner cannot be deleted");
    }
    if (targetUser.role === "admin" && currentUser.role !== "owner") {
      return res.status(403).send("Only owner can delete admin");
    }
    await User.findByIdAndDelete(req.params.id);
    await logActivity(req.userId, `Deleted user ${targetUser.username}`);
    res.send("User deleted");
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// USER THEME UPDATE (for Settings)
app.put("/api/users/:id/theme", authMiddleware, async (req, res) => {
  try {
    const { theme } = req.body;
    const user = await User.findById(req.userId);
    if (user._id.toString() !== req.params.id) {
      return res.status(403).send("Can only update own theme");
    }
    user.theme = theme;
    await user.save();
    await logActivity(req.userId, `Updated theme to ${theme}`);
    res.send("Theme updated");
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// ACTIVITY LOGS
app.get("/api/logs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const logs = await Log.find().populate('userId', 'username').sort({ createdAt: -1 });
    res.json(logs);
  } catch {
    res.status(500).send("Server error");
  }
});

// OVERVIEW
app.get("/api/overview", authMiddleware, async (req, res) => {
  try {
    const overview = await Overview.findOne();
    if (!overview) {
      return res.status(404).json({ message: "Overview not found" });
    }
    // Calculate low stock alerts
    const lowStock = await Inventory.find({ stock: { $lt: 10 } });
    overview.lowStockAlerts = lowStock;
    res.json(overview);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// FINANCE (with categories)
app.get("/api/finance", authMiddleware, async (req, res) => {
  try {
    const entries = await Finance.find().sort({ date: -1 });
    res.json(entries);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/finance", authMiddleware, async (req, res) => {
  try {
    const { type, amount, date, remark, category } = req.body;
    if (!type || !amount || !date || !category) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const newEntry = new Finance({ type, amount, date, remark, category });
    await newEntry.save();
    await logActivity(req.userId, `Added finance entry: ${type} ₹${amount}`);
    // Update overview
    const overview = await Overview.findOne();
    if (type === 'sale') {
      overview.revenue += amount;
      overview.profit += amount; // Simplify; adjust if needed
    } else {
      overview.expenses += amount;
      overview.profit -= amount;
    }
    await overview.save();
    res.json(newEntry);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/finance/:id", authMiddleware, async (req, res) => {
  try {
    const entry = await Finance.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Not found" });
    await Finance.findByIdAndDelete(req.params.id);
    await logActivity(req.userId, `Deleted finance entry: ${entry.type} ₹${entry.amount}`);
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/finance/:id", authMiddleware, async (req, res) => {
  try {
    const { type, amount, date, remark, category } = req.body;
    const updated = await Finance.findByIdAndUpdate(req.params.id, { type, amount, date, remark, category }, { new: true });
    await logActivity(req.userId, `Updated finance entry: ${type} ₹${amount}`);
    res.json(updated);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// SUPPLIERS
app.get("/api/suppliers", authMiddleware, async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/suppliers", authMiddleware, async (req, res) => {
  try {
    const { name, contact, address, activityLevel } = req.body;
    const newSupplier = new Supplier({ name, contact, address, activityLevel });
    await newSupplier.save();
    await logActivity(req.userId, `Added supplier: ${name}`);
    res.json(newSupplier);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/suppliers/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logActivity(req.userId, `Updated supplier: ${updated.name}`);
    res.json(updated);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/suppliers/:id", authMiddleware, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    await Supplier.findByIdAndDelete(req.params.id);
    await logActivity(req.userId, `Deleted supplier: ${supplier.name}`);
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// SUPPLIER PAYMENTS
app.post("/api/suppliers/:id/payments", authMiddleware, async (req, res) => {
  try {
    const { amount, date, reason } = req.body;
    const supplier = await Supplier.findById(req.params.id);
    supplier.payments.push({ amount, date, reason });
    await supplier.save();
    await logActivity(req.userId, `Added payment to supplier ${supplier.name}: ₹${amount}`);
    res.json(supplier);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// INVENTORY
app.get("/api/inventory", authMiddleware, async (req, res) => {
  try {
    const inventory = await Inventory.find();
    // Calculate totals
    const totalStock = inventory.reduce((sum, item) => sum + item.stock, 0);
    const totalValue = inventory.reduce((sum, item) => sum + (item.stock * item.cost), 0);
    const totalProfit = inventory.reduce((sum, item) => sum + item.profit, 0);
    res.json({ items: inventory, totalStock, totalValue, totalProfit });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/inventory", authMiddleware, async (req, res) => {
  try {
    const { name, stock, cost, sellPrice, margin, profit } = req.body;
    const newItem = new Inventory({ name, stock, cost, sellPrice, margin, profit });
    await newItem.save();
    await logActivity(req.userId, `Added inventory item: ${name}`);
    res.json(newItem);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/inventory/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logActivity(req.userId, `Updated inventory item: ${updated.name}`);
    res.json(updated);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/inventory/:id", authMiddleware, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    await Inventory.findByIdAndDelete(req.params.id);
    await logActivity(req.userId, `Deleted inventory item: ${item.name}`);
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// SCHEDULE
app.get("/api/schedule", authMiddleware, async (req, res) => {
  try {
    const schedule = await Schedule.findOne();
    if (!schedule) {
      const newSchedule = new Schedule({ days: Array.from({length: 30}, () => ({ tasks: [] })) });
      await newSchedule.save();
      return res.json(newSchedule);
    }
    res.json(schedule);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/schedule/:dayIndex/task", authMiddleware, async (req, res) => {
  try {
    const { task } = req.body;
    const schedule = await Schedule.findOne();
    schedule.days[req.params.dayIndex].tasks.push({ task, completed: false });
    await schedule.save();
    await logActivity(req.userId, `Added task to day ${req.params.dayIndex + 1}`);
    res.json(schedule);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/schedule/:dayIndex/task/:taskIndex", authMiddleware, async (req, res) => {
  try {
    const { completed } = req.body;
    const schedule = await Schedule.findOne();
    schedule.days[req.params.dayIndex].tasks[req.params.taskIndex].completed = completed;
    await schedule.save();
    await logActivity(req.userId, `Updated task in day ${req.params.dayIndex + 1}`);
    res.json(schedule);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// NOTES
app.get("/api/notes", authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/notes", authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    const newNote = new Note({ title, content, userId: req.userId });
    await newNote.save();
    await logActivity(req.userId, `Added note: ${title}`);
    res.json(newNote);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/notes/:id", authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    const updated = await Note.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { title, content }, { new: true });
    await logActivity(req.userId, `Updated note: ${title}`);
    res.json(updated);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/notes/:id", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    await Note.deleteOne({ _id: req.params.id, userId: req.userId });
    await logActivity(req.userId, `Deleted note: ${note.title}`);
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});