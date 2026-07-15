const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

const EventSchema = new mongoose.Schema({
  title: String,
  slug: String,
  description: String,
  date: Date,
  location: String,
  isPaid: Boolean,
  price: Number,
  speakers: [String],
  published: Boolean,
  createdAt: Date,
});
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

async function seedEvent() {
  await mongoose.connect(MONGODB_URI);
  
  const existing = await Event.findOne({ slug: 'EVT2026' });
  if (existing) {
    console.log('Event EVT2026 already exists!');
  } else {
    const newEvent = new Event({
      title: 'Sample Event 2026',
      slug: 'EVT2026',
      description: 'This is a sample event for testing registration.',
      date: new Date('2026-10-10'),
      location: 'Virtual',
      isPaid: false,
      published: true,
      createdAt: new Date(),
    });
    await newEvent.save();
    console.log('Created sample event with code (slug): EVT2026');
  }
  process.exit(0);
}
seedEvent().catch(console.error);
