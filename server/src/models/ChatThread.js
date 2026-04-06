import mongoose from 'mongoose';

const chatThreadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Trao đổi hỗ trợ',
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'priority', 'resolved'],
      default: 'open',
      index: true,
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastSenderRole: {
      type: String,
      enum: ['user', 'admin', 'system'],
      default: 'system',
    },
    userUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ChatThread', chatThreadSchema);
