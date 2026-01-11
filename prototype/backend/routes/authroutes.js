const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

const router = express.Router();
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ message: 'User registered successfully', user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 });
    res.json({ message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return res.status(400).json({ message: 'Admin credentials not configured on server' });
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ message: 'Invalid admin credentials' });
    let adminUser = await User.findOne({ email });
    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      adminUser = await User.create({ name: 'Admin', email, password: hashed, isAdmin: true });
    } else if (!adminUser.isAdmin) {
      adminUser.isAdmin = true;
      await adminUser.save();
    }
    const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 });
    res.json({ message: 'Admin login successful', user: { id: adminUser._id, name: adminUser.name, email: adminUser.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/admin-config', async (req, res) => {
  try {
    const configured = !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
    let masked = null;
    if (process.env.ADMIN_EMAIL) {
      const parts = process.env.ADMIN_EMAIL.split('@');
      const name = parts[0];
      const domain = parts[1] || '';
      const visible = name.length > 2 ? name.substr(0, 2) + '...' : name;
      masked = visible + (domain ? '@' + domain : '');
    }
    res.json({ configured, email: masked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
