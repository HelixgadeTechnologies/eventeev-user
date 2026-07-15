import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  date: Date;
  location: string;
  isPaid: boolean;
  price?: number;
  speakers?: string[];
  published: boolean;
  createdAt: Date;
}

const EventSchema: Schema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  isPaid: { type: Boolean, default: false },
  price: { type: Number },
  speakers: [{ type: String }],
  published: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
