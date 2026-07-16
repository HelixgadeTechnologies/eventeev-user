const mongoose = require("mongoose");
const uri = "mongodb+srv://weareeventeev:Helixgade077%40@cluster0.tlihb.mongodb.net/eventeev?appName=Cluster0";

async function check() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const cols = await db.listCollections().toArray();
  console.log("Collections:", cols.map(c => c.name));
  
  const tickets = await db.collection("tickets").find({}).limit(2).toArray();
  console.log("Tickets:", JSON.stringify(tickets, null, 2));
  process.exit(0);
}
check();
