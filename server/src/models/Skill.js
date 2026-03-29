import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: Number, min: 0, max: 100, default: 80 },
    category: { type: String, default: 'general' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Skill', skillSchema);
