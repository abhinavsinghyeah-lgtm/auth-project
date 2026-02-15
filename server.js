const Whitelist = require("./models/Whitelist");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const User = require("./models/User");
const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log("Database connected");

  // Auto whitelist default admin
  const defaultAdmin = "architect";

  const exists = await Whitelist.findOne({ username: defaultAdmin });

  if (!exists) {
    await new Whitelist({ username: defaultAdmin }).save();
    console.log("Default admin whitelisted:", defaultAdmin);
  }

})
.catch((error) => {
  console.log("Connection error:", error);
});




function authMiddleware(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).send("No token provided");
  }

  try {
    const decoded = jwt.verify(token, "mysecretkey");
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).send("Invalid token");
  }
}

async function adminMiddleware(req, res, next) {
  const user = await User.findById(req.userId);

  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    return res.status(403).send("Admin access required");
  }

  next();
}


app.get("/", (req, res) => {
  res.send("Backend is working 🚀");
});

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
      "mysecretkey",
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token: token
    });

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
