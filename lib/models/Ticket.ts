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

export default mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
