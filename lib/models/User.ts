import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  avatar?: string;
  orgName?: string;
  role?: string;
}

const UserSchema: Schema = new Schema(
  {
    firstName: { type: String },
    lastName:  { type: String },
    name:      { type: String },
    email:     { type: String },
    avatar:    { type: String },
    orgName:   { type: String },
    role:      { type: String },
  },
  { timestamps: true, collection: 'users' }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema, 'users');
