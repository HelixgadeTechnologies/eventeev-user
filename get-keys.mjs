import mongoose from "mongoose";
import fs from "fs";

async function check() {
  const envFile = fs.readFileSync(".env.local", "utf-8");
  const mongoUri = envFile.match(/MONGODB_URI=(.*)/)[1];
  
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const events = await db.collection("events").find({}).limit(5).toArray();
  
  events.forEach(e => {
    console.log(`Event ID: ${e._id}, Keys: ${Object.keys(e).join(", ")}`);
    console.log(`bannerUrl: ${e.bannerUrl}, bannerImage: ${e.bannerImage}, banner: ${e.banner}, image: ${e.image}, cover: ${e.cover}`);
  });
  process.exit(0);
}
check();
