import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendee extends Document {
  name: string;
  email: string;
  googleId?: string;
  avatarUrl?: string;
  createdAt: Date;
}

const AttendeeSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  googleId: { type: String },
  avatarUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Attendee || mongoose.model<IAttendee>('Attendee', AttendeeSchema);
