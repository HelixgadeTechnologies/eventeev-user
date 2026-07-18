import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule extends Document {
  eventId: mongoose.Types.ObjectId;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  type: string;
  speakers?: {
    name: string;
    role: string;
  }[];
}

const ScheduleSchema: Schema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String },
  speakers: [{
    name: String,
    role: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', ScheduleSchema);
