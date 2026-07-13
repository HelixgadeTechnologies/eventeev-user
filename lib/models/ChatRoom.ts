import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRoom extends Document {
  eventId: mongoose.Types.ObjectId;
  name: string;
  type: 'public' | 'private';
  createdAt: Date;
}

const ChatRoomSchema: Schema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['public', 'private'], default: 'public' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);
