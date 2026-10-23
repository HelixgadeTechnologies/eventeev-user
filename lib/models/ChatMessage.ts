import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  room: mongoose.Types.ObjectId | string;
  roomId?: mongoose.Types.ObjectId | string;
  sender: mongoose.Types.ObjectId | string;
  senderId?: mongoose.Types.ObjectId | string;
  senderModel?: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  type?: string;
  createdAt: Date;
}

const ChatMessageSchema: Schema = new Schema(
  {
    room: { type: Schema.Types.Mixed, ref: 'ChatRoom' },
    roomId: { type: Schema.Types.Mixed, ref: 'ChatRoom' },
    sender: { type: Schema.Types.Mixed },
    senderId: { type: Schema.Types.Mixed },
    senderModel: { type: String, default: 'Attendee' },
    senderName: { type: String },
    senderAvatar: { type: String },
    content: { type: String, required: true },
    type: { type: String, default: 'user_message' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'messages' }
);

if (mongoose.models && mongoose.models.ChatMessage) {
  delete mongoose.models.ChatMessage;
}

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema, 'messages');
