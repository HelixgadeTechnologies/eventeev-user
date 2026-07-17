import mongoose, { Schema, Document } from 'mongoose';

export interface ITrivia extends Document {
  eventId?: mongoose.Types.ObjectId; // Optional, if global it's null
  title: string;
  description?: string;
  questions: {
    question: string;
    options: string[];
    correctOptionIndex: number;
    points: number;
  }[];
  leaderboard: {
    attendeeId: mongoose.Types.ObjectId;
    score: number;
  }[];
  isGlobal: boolean;
  status: 'active' | 'closed';
  createdAt: Date;
}

const TriviaSchema: Schema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
  title: { type: String, required: true },
  description: { type: String },
  questions: [{
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true },
    points: { type: Number, default: 10 }
  }],
  leaderboard: [{
    attendeeId: { type: Schema.Types.ObjectId, ref: 'Attendee' },
    score: { type: Number, default: 0 }
  }],
  isGlobal: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Trivia || mongoose.model<ITrivia>('Trivia', TriviaSchema);
