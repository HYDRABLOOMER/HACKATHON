require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

(async function(){
  try{
    await connectDB();
    const email = process.env.ADMIN_EMAIL || process.argv[2];
    const password = process.env.ADMIN_PASSWORD || process.argv[3];
    if (!email || !password) {
      console.error('Usage: set ADMIN_EMAIL and ADMIN_PASSWORD in .env or pass as args: node seedAdmin.js admin@example.com secret');
      process.exit(1);
    }

    let user = await User.findOne({ email });
    if (user) {
      user.isAdmin = true;
      console.log('Found existing user, making admin:', email);
      await user.save();
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    user = await User.create({ name: 'Admin', email, password: hashed, isAdmin: true });
    console.log('Admin user created:', user.email);
    process.exit(0);
  }catch(err){
    console.error('Seed failed', err);
    process.exit(1);
  }
})();
