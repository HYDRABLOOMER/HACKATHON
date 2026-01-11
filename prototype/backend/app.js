const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const path=require("path");
const fs = require("fs");

const connectDB =require("./config/db.js");
const authRoutes =require("./routes/authroutes.js");
const apiRoutes = require("./routes/api.js");

const app = express();
const PORT = process.env.PORT|| 5000;

connectDB();

const uploadsDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());                     
app.use(express.json());             
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));
app.use(express.static(path.join(__dirname,"..","frontend","pages")));
app.use(express.static(path.join(__dirname,"..","frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname,"../frontend/pages","login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname,"../frontend/pages","signup.html"));
});

app.get("/user_dashboard", (req, res) => {
  res.sendFile(path.join(__dirname,"../frontend/pages","user_dashboard.html"));
});

app.use("/auth",authRoutes);
app.use("/api", apiRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});