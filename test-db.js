const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env.local") });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const events = await db.collection("events").find({}).toArray();
  events.forEach(e => {
    console.log(`Title: ${e.title}, Slug: ${e.slug}, connectCode: ${e.connectCode}, status: ${e.status}, published: ${e.published}`);
  });
  process.exit(0);
}
check();
