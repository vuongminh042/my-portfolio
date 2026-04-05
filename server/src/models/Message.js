import mongoose from 'mongoose';

const messageReplySchema = new mongoose.Schema(
  {
    body: { type: String, default: '' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adminName: { type: String, default: '' },
    respondedAt: { type: Date, default: null },
    readByUser: { type: Boolean, default: false },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    subject: { type: String, default: '' },
    body: { type: String, required: true },
    read: { type: Boolean, default: false },
    reply: { type: messageReplySchema, default: undefined },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
