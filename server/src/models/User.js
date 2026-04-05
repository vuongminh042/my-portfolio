import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, default: '' },
    title: { type: String, default: 'Frontend Developer' },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    facebook: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    backgroundMusicEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
