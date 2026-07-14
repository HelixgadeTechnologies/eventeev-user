const mongoose = require('mongoose');

async function check() {
  const uri = 'mongodb+srv://weareeventeev:Helixgade077%40@cluster0.tlihb.mongodb.net/eventeev?appName=Cluster0';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const events = await db.collection('events').find({}).toArray();
  console.log("All events:");
  events.forEach(e => console.log(JSON.stringify(e)));
  
  process.exit(0);
}
check().catch(console.error);
