const cookieParser = require("cookie-parser");
const path = require("path");
const Overview = require("./models/Overview");
const Whitelist = require("./models/Whitelist");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const User = require("./models/User");
const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(cors({
  origin: true,
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());
app.use(express.static("public", {
  index: false
}));

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

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
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


app.post("/test", (req, res) => {
  console.log(req.body);
  res.send("Received!");
});

// REGISTER ROUTE //
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    // Check whitelist
    const isWhitelisted = await Whitelist.findOne({ username });

    // Decide role
    const role = isWhitelisted ? "admin" : "user";

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      role
    });

    await newUser.save();

    res.send("User registered successfully");

  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});




app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).send("User not found");
    }

    // Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send("Invalid password");
    }

    user.lastLogin = new Date();
    await user.save();

    // Create token with role included
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role 
      },
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




app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });

  res.json({ message: "Logged out" });
});
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});

app.get("/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch {
    res.status(500).send("Server error");
  }
});

// UPDATE USER ROLE
app.put("/admin/user/:id/role", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;

    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);

    if (!targetUser) {
      return res.status(404).send("User not found");
    }

    // Only owner can modify admin or owner roles
    if ((targetUser.role === "admin" || targetUser.role === "owner") 
        && currentUser.role !== "owner") {
      return res.status(403).send("Only owner can modify admin/owner");
    }

    targetUser.role = role;
    await targetUser.save();

    res.send("Role updated");
  } catch (err) {
    res.status(500).send("Server error");
  }
});
// DELETE USER
app.delete("/admin/user/:id", authMiddleware, adminMiddleware, async (req, res) => {
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

    res.send("User deleted");
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.get("/api/overview", authMiddleware, async (req, res) => {
  try {
    const overview = await Overview.findOne();

    if (!overview) {
      return res.status(404).json({ message: "Overview not found" });
    }

    res.json(overview);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/admin", authMiddleware, adminMiddleware, (req, res) => {
res.sendFile(path.join(__dirname, "views/admin.html"));
});