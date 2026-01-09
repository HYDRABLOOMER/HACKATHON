const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path=require("path");

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());                     
app.use(express.json());             
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,"..","frontend")));


// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch((err) => {
//     console.error("❌ MongoDB connection error:", err);
//     process.exit(1);
//   });

app.get("/index", (req, res) => {
  res.sendFile(path.join(__dirname,"../frontend","index.html"));
});

// app.use("/api/auth", require("./routes/auth.routes"));

// app.use("/api/tasks", require("./routes/task.routes"));

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
