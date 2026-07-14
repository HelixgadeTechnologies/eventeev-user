const mongoose = require("mongoose");
const uri = "mongodb+srv://weareeventeev:Helixgade077%40@cluster0.tlihb.mongodb.net/eventeev?appName=Cluster0";

mongoose.connect(uri)
  .then(async () => {
    const Event = mongoose.models.Event || mongoose.model("Event", new mongoose.Schema({}, { strict: false }));
    const events = await Event.find({}, 'title slug _id').limit(10);
    console.log("EVENTS IN DB:", events);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
