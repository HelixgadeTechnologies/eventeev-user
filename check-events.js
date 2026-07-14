require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function checkEvents() {
  await mongoose.connect(process.env.MONGODB_URI);
  const events = await mongoose.connection.collection('events').find({}).toArray();
  console.log('Events in DB:');
  events.forEach(e => console.log(`- Title: ${e.title}, Slug: ${e.slug}, ID: ${e._id}`));
  if (events.length === 0) {
    console.log('No events found. You might want to create one in your database.');
  }
  process.exit(0);
}
checkEvents();
