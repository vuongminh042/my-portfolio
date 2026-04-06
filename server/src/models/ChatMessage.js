import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatThread',
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    deliveredToUser: {
      type: Boolean,
      default: false,
    },
    deliveredToAdmin: {
      type: Boolean,
      default: false,
    },
    readByUser: {
      type: Boolean,
      default: false,
    },
    readByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ChatMessage', chatMessageSchema);
