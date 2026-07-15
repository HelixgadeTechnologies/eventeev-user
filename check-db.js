const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env.local") });

async function checkDb() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const db = mongoose.connection.db;
  const events = await db.collection("events").find({}).toArray();
  
  console.log("All events in DB:");
  events.forEach(e => {
    console.log(`- Title: ${e.title}, Slug: ${e.slug}, Published: ${e.published}`);
  });
  
  mongoose.disconnect();
}

checkDb().catch(console.error);
