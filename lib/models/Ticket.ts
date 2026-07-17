import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  attendeeId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  orderId: string;
  tier?: string;
  status: 'valid' | 'used' | 'cancelled' | 'pending';
  createdAt: Date;
}

const TicketSchema: Schema = new Schema({
  attendeeId: { type: Schema.Types.ObjectId, ref: 'Attendee', required: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  orderId: { type: String, required: true, unique: true },
  tier: { type: String, default: 'General Admission' },
  status: { type: String, enum: ['valid', 'used', 'cancelled', 'pending'], default: 'valid' },
  createdAt: { type: Date, default: Date.now },
});

// Delete the model if it exists to prevent hot-reload caching issues with enums
if (mongoose.models.Ticket) {
  delete mongoose.models.Ticket;
}

export default mongoose.model<ITicket>('Ticket', TicketSchema);
