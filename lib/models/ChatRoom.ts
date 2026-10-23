import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRoom extends Document {
  eventId: mongoose.Types.ObjectId | string;
  event?: mongoose.Types.ObjectId | string;
  name: string;
  type: 'public' | 'private' | 'general' | 'announcement';
  isGroup: boolean;
  participantIds: string[];
  participants: {
    id: string;
    name: string;
    avatar?: string | null;
    role?: string;
    modelType?: string;
  }[];
  leadParticipant?: any;
  createdBy?: any;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

const ChatRoomSchema: Schema = new Schema(
  {
    eventId: { type: Schema.Types.Mixed, ref: 'Event' },
    event:   { type: Schema.Types.Mixed, ref: 'Event' },
    name:    { type: String, required: true },
    type:    { type: String, enum: ['public', 'private', 'general', 'announcement'], default: 'public' },
    isGroup: { type: Boolean, default: true },
    participantIds: [{ type: String }],
    participants: [
      {
        id:        { type: String },
        name:      { type: String },
        avatar:    { type: String, default: null },
        role:      { type: String },
        modelType: { type: String },
      },
    ],
    leadParticipant: { type: Schema.Types.Mixed },
    createdBy:       { type: Schema.Types.Mixed },
    lastMessage:     { type: String },
    lastMessageAt:   { type: Date },
  },
  { timestamps: true, collection: 'rooms' }
);

if (mongoose.models && mongoose.models.ChatRoom) {
  delete mongoose.models.ChatRoom;
}

export default mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema, 'rooms');
