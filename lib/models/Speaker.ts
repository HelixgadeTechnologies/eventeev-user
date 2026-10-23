import mongoose, { Schema, Document } from 'mongoose';

export interface ISpeaker extends Document {
  eventId: mongoose.Types.ObjectId | string;
  firstName: string;
  lastName: string;
  title?: string;
  company?: string;
  bio?: string;
  topic?: string;
  photo?: string;
  socialLinks?: {
    twitter?: string;
    companyTwitter?: string;
    linkedin?: string;
    website?: string;
  };
  sessions?: any[];
  status?: string;
  createdAt: Date;
}

const SpeakerSchema: Schema = new Schema(
  {
    eventId: { type: Schema.Types.Mixed, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    title: { type: String },
    company: { type: String },
    bio: { type: String },
    topic: { type: String },
    photo: { type: String },
    socialLinks: {
      twitter: { type: String },
      companyTwitter: { type: String },
      linkedin: { type: String },
      website: { type: String },
    },
    sessions: [{ type: Schema.Types.Mixed }],
    status: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'speakers',
    strict: false,
  }
);

if (mongoose.models && mongoose.models.Speaker) {
  delete mongoose.models.Speaker;
}

export default mongoose.model<ISpeaker>('Speaker', SpeakerSchema, 'speakers');
