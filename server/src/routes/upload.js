import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { authRequired, adminOnly } from "../middleware/auth.js";
import User from "../models/User.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

if (!hasCloudinaryConfig) {
  console.warn("⚠️ Thiếu cấu hình Cloudinary, route upload sẽ không hoạt động.");
}

function imageFilter(_req, file, cb) {
  if (/^image\/(jpeg|png|gif|webp|avif)$/i.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận ảnh JPEG, PNG, GIF, WebP, AVIF"));
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const router = Router();

async function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
}

router.post("/register-avatar", upload.single("avatar"), async (req, res, next) => {
  try {
    if (!hasCloudinaryConfig) {
      return res.status(500).json({ message: "Thiếu cấu hình Cloudinary trên server" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Không có file" });
    }
    const result = await uploadBufferToCloudinary(req.file.buffer, "avatars");
    res.json({ avatar: result.secure_url });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/avatar",
  authRequired,
  adminOnly,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      if (!hasCloudinaryConfig) {
        return res.status(500).json({ message: "Thiếu cấu hình Cloudinary trên server" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Không có file" });
      }
      const result = await uploadBufferToCloudinary(req.file.buffer, "avatars");
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản" });
      }
      user.avatar = result.secure_url;
      await user.save();
      const o = user.toObject();
      delete o.password;
      res.json({ avatar: result.secure_url, user: o });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/project",
  authRequired,
  adminOnly,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!hasCloudinaryConfig) {
        return res.status(500).json({ message: "Thiếu cấu hình Cloudinary trên server" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Không có file" });
      }
      const result = await uploadBufferToCloudinary(req.file.buffer, "projects");
      res.json({ image: result.secure_url });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
