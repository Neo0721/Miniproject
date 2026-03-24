require('dotenv').config();
const mongoose = require('mongoose');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./src/models/User');
    const Staff = require('./src/models/Staff');
    const email = 'student@example.com';
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: 'Test Student',
        email,
        role: 'student'
      });
      console.log('Created user:', user.email);
    } else {
      console.log('User already exists:', user.email);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
