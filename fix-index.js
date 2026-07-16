const mongoose = require("mongoose");
const uri = "mongodb+srv://weareeventeev:Helixgade077%40@cluster0.tlihb.mongodb.net/eventeev?appName=Cluster0";

async function fix() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  try {
    await db.collection("attendees").dropIndex("orderId_1");
    console.log("Dropped index orderId_1 from attendees");
  } catch (err) {
    console.log("Error or index doesn't exist:", err.message);
  }
  process.exit(0);
}
fix();
