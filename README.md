# Portfolio MERN — Frontend Developer

Trang portfolio hiện đại (React + Vite + Tailwind + Framer Motion), backend Express + MongoDB, có **trang công khai**, **đăng ký/đăng nhập**, **Admin** (hồ sơ, avatar, dự án, kỹ năng, tin nhắn liên hệ).

## Yêu cầu

- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/) chạy local hoặc URI cloud (Atlas)

## Cài đặt

### 1. MongoDB

Chạy `mongod` hoặc dùng connection string Atlas.

### 2. Backend

```bash
cd server
copy .env.example .env
```

Sửa `.env`: `MONGODB_URI`, `JWT_SECRET` (chuỗi ngẫu nhiên đủ dài), tùy chọn `ADMIN_EMAIL` (email đăng ký sẽ là admin nếu khớp). User **đầu tiên** đăng ký luôn là **admin**.

```bash
npm install
npm run dev
```

API mặc định: `https://my-portfolio-8oh4.onrender.com/`

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Web: `http://localhost:5173` — proxy gọi `/api` và `/uploads` sang cổng 5000.

Production build: đặt `VITE_API_URL` trỏ tới domain API (xem `client/.env.example`).

## Chức năng

| Khu vực | Mô tả |
|--------|--------|
| Trang chủ | Hero, giới thiệu, kỹ năng, dự án, form liên hệ (lưu DB) |
| Avatar | Ban đầu không ảnh → hiển thị chữ cái; sau khi admin upload avatar thì hiển thị ảnh |
| Admin | Dashboard, hồ sơ + avatar, CRUD dự án (upload ảnh cover), CRUD kỹ năng, đọc/xóa tin nhắn |

## Cấu trúc thư mục

- `server/` — Express, JWT, Multer (`uploads/avatars`, `uploads/projects`)
- `client/` — React SPA, route `/admin/*` bảo vệ theo role admin
