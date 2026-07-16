const mongoose = require("mongoose");
const uri = "mongodb+srv://weareeventeev:Helixgade077%40@cluster0.tlihb.mongodb.net/eventeev?appName=Cluster0";

async function check() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const events = await db.collection("events").find({}).toArray();
  events.forEach(e => {
    console.log(`Title: ${e.title}, Slug: ${e.slug}, connectCode: ${e.connectCode}, status: ${e.status}, published: ${e.published}`);
  });
  process.exit(0);
}
check();
