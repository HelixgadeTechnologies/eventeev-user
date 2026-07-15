const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });
const uri = process.env.MONGODB_URI;

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
