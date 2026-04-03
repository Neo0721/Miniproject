const mongoose = require('mongoose');
require('dotenv').config();

const Staff = require('./src/models/Staff');

async function debugStaff() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const allStaff = await Staff.find({});
    console.log(`Found ${allStaff.length} staff members:`);
    
    const fs = require('fs');
    fs.writeFileSync('staff_debug.json', JSON.stringify(allStaff, null, 2));
    console.log('Results written to staff_debug.json');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

debugStaff();
