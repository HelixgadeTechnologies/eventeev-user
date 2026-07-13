import mongoose, { Schema, Document } from 'mongoose';

export interface IConnection extends Document {
  requesterId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

const ConnectionSchema: Schema = new Schema({
  requesterId: { type: Schema.Types.ObjectId, ref: 'Attendee', required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: 'Attendee', required: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Connection || mongoose.model<IConnection>('Connection', ConnectionSchema);
