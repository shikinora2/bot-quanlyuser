# Bot Quản Lý User Discord

> **Quản lý đăng ký thành viên, phân quyền, đổi tên, log sự kiện... cho server Discord**

---

## 🚀 Hướng dẫn cài đặt & chạy bot

### 1. Clone code về máy
```bash
git clone https://github.com/shikinora2/bot-quanlyuser.git
cd bot-quanlyuser
```

### 2. Cài đặt Node.js (nếu chưa có)
- Tải tại: https://nodejs.org/
- Khuyên dùng Node.js 18 trở lên

### 3. Cài thư viện
```bash
npm install discord.js
```

### 4. Tạo file môi trường chứa token/app id
- **Chạy local:**
  - Copy file `.env` mẫu nếu chưa có:
    ```bash
    copy .env.vps.example .env
    ```
  - Mở file `.env` và điền:
    ```env
    BOT_TOKEN=YOUR_BOT_TOKEN
    APP_ID=YOUR_APP_ID
    ```
- **Deploy VPS:**
  - Copy file `.env.vps.example` thành `.env.vps` rồi điền token/app id thật

### 5. Chạy bot
```bash
node index.js
```

---

## 🖥️ Deploy lên VPS & chạy nền với PM2

### 1. Cài PM2 (nếu chưa có)
```bash
npm install -g pm2
```

### 2. Chạy bot bằng PM2
```bash
npm install
pm2 start index.js --name bot-quanlyuser
```

### 3. Quản lý bot với PM2
- Xem trạng thái: `pm2 status`
- Xem log: `pm2 logs bot-quanlyuser`
- Khởi động lại: `pm2 restart bot-quanlyuser`
- Tắt bot: `pm2 stop bot-quanlyuser`

---

## 🔒 Bảo mật token/app id
- **KHÔNG** commit file `.env` hoặc `.env.vps` lên GitHub (đã có sẵn `.gitignore` để chặn)
- Nếu lộ token, hãy vào Discord Developer Portal để tạo lại token mới

---

## 📝 Một số lệnh quản trị bot
- `/setup-form` — Gửi form đăng ký thành viên
- `/set-channel` — Cấu hình kênh cho bot
- `/set-role` — Cấu hình role cho hệ thống

---

## 📂 Cấu trúc file chính
- `index.js` — Code chính của bot
- `.env` — Biến môi trường local (KHÔNG commit)
- `.env.vps` — Biến môi trường VPS (KHÔNG commit)
- `.env.vps.example` — File mẫu cho VPS
- `.gitignore` — Chặn file bí mật khỏi Git

---

## 💬 Liên hệ hỗ trợ
- [GitHub Issues](https://github.com/shikinora2/bot-quanlyuser/issues)
- Hoặc liên hệ trực tiếp chủ repo
