import mongoose, { Schema, Document } from 'mongoose';

export interface IPoll extends Document {
  eventId: mongoose.Types.ObjectId;
  question: string;
  options: {
    text: string;
    votes: number;
    voters: mongoose.Types.ObjectId[];
  }[];
  status: 'active' | 'closed';
  createdAt: Date;
}

const PollSchema: Schema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  question: { type: String, required: true },
  options: [{
    text: { type: String, required: true },
    votes: { type: Number, default: 0 },
    voters: [{ type: Schema.Types.ObjectId, ref: 'Attendee' }]
  }],
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Poll || mongoose.model<IPoll>('Poll', PollSchema);
