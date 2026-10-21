import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  attendeeId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  orderId: string;
  tier?: string;
  status: 'valid' | 'used' | 'cancelled' | 'pending';
  isCheckedIn?: boolean;
  checkInTime?: Date;
  createdAt: Date;
}

const TicketSchema: Schema = new Schema({
  attendeeId: { type: Schema.Types.ObjectId, ref: 'Attendee', required: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  orderId: { type: String, required: true, unique: true },
  tier: { type: String, default: 'General Admission' },
  status: { type: String, enum: ['valid', 'used', 'cancelled', 'pending'], default: 'valid' },
  isCheckedIn: { type: Boolean, default: false },
  checkInTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
}, { strict: false });

// Delete the model if it exists to prevent hot-reload caching issues with enums
if (mongoose.models.Ticket) {
  delete mongoose.models.Ticket;
}

export default mongoose.model<ITicket>('Ticket', TicketSchema);
