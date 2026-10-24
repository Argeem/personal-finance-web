# 🚀 คู่มือการตั้งค่า Server & Deploy (FinTrack Pro)
## การตั้งค่า NGINX ให้ชี้ `/personal/finance` ไปยัง `personal-financial-web`

คู่มือนี้สำหรับนำโปรเจกต์ **personal-financial-web** ไป Deploy ไว้บนเซิร์ฟเวอร์เดียวกับเว็บหลัก (**argeem-web**) โดยเปิดใช้งานผ่าน Subpath:  
👉 `https://<YOUR_DOMAIN>/personal/finance/`

---

## 🏗️ ภาพรวมสถาปัตยกรรม (Architecture)

```text
                                  ┌──────────────────────────────┐
                                  │      Client (Browser)        │
                                  └──────────────┬───────────────┘
                                                 │
                                                 ▼
                                     ┌───────────────────────┐
                                     │     NGINX Server      │
                                     │ (Port 80 / 443 SSL)   │
                                     └───────────┬───────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        │                                                 │
                        ▼                                                 ▼
               Route: `/` (เว็บหลัก)                           Route: `/personal/finance/`
          ┌───────────────────────────┐                     ┌───────────────────────────┐
          │        argeem-web         │                     │   personal-financial-web  │
          │ (Next.js / PM2 / Express) │                     │      (Vite React SPA)     │
          │  Path: /var/www/argeem-web│                     │Path: /var/www/personal-...│
          └───────────────────────────┘                     └───────────────────────────┘
```

---

## 📁 ไฟล์ที่เกี่ยวข้องในโปรเจกต์

- [vite.config.ts](file:///c:/Users/sitth/Documents/side-project/personal-financial-web/vite.config.ts) : กำหนด `base: '/personal/finance/'` อัตโนมัติเมื่อ build production เพื่อให้ asset ทุกตัวอ้างอิง path ที่ถูกต้อง
- [scripts/nginx-personal-finance.conf](file:///c:/Users/sitth/Documents/side-project/personal-financial-web/scripts/nginx-personal-finance.conf) : Snippet Nginx config สำหรับ route `/personal/finance`
- [scripts/server-setup.sh](file:///c:/Users/sitth/Documents/side-project/personal-financial-web/scripts/server-setup.sh) : สคริปต์เตรียมโฟลเดอร์ สิทธิ์ www-data และ copy snippet เข้า `/etc/nginx/snippets/`
- [scripts/deploy.sh](file:///c:/Users/sitth/Documents/side-project/personal-financial-web/scripts/deploy.sh) : สคริปต์ Build และ Deploy (รองรับทั้งรันบนเครื่อง Local และรันบน Server)
- [scripts/deploy.env.example](file:///c:/Users/sitth/Documents/side-project/personal-financial-web/scripts/deploy.env.example) : Template ตัวแปรสำหรับเชื่อมต่อ SSH

---

## 🛠️ ขั้นตอนที่ 1: เตรียม Server (ทำครั้งแรกครั้งเดียว)

### 1.1 SSH เข้าเซิร์ฟเวอร์
```bash
ssh root@<YOUR_SERVER_IP>
```

### 1.2 รันคำสั่ง Setup โฟลเดอร์และ Snippet
คัดลอกไฟล์ [scripts/server-setup.sh](file:///c:/Users/sitth/Documents/side-project/personal-financial-web/scripts/server-setup.sh) ขึ้นเซิร์ฟเวอร์ หรือรันคำสั่งด้านล่างนี้โดยตรง:

```bash
sudo mkdir -p /var/www/personal-financial-web/dist
sudo mkdir -p /etc/nginx/snippets
sudo chown -R www-data:www-data /var/www/personal-financial-web
sudo chmod -R 755 /var/www/personal-financial-web
```

และสร้างไฟล์ snippet ที่ `/etc/nginx/snippets/personal-finance.conf`:
```bash
sudo nano /etc/nginx/snippets/personal-finance.conf
```
วางเนื้อหาต่อไปนี้ลงไป:
```nginx
# 1. Redirect URL ที่ไม่มี trailing slash
location = /personal/finance {
    return 301 /personal/finance/;
}

# 2. Main SPA Location สำหรับ /personal/finance/
location ^~ /personal/finance/ {
    alias /var/www/personal-financial-web/dist/;
    index index.html;
    try_files $uri $uri/ /personal/finance/index.html;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # ไม่แคช index.html เพื่อให้เห็นอัปเดตใหม่ทันที
    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}

# 3. Static Assets Caching (Vite hash files)
location ~* ^/personal/finance/assets/(.+\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))$ {
    alias /var/www/personal-financial-web/dist/assets/$1;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
}
```

---

## ⚙️ ขั้นตอนที่ 2: เชื่อมต่อ NGINX เข้ากับเว็บหลัก (argeem-web)

เปิดไฟล์ NGINX Config เดิมของเว็บหลัก (เช่น `/etc/nginx/sites-available/argeem-web` หรือ `/etc/nginx/sites-available/default`):

```bash
sudo nano /etc/nginx/sites-available/argeem-web
```

เพิ่มบรรทัด `include /etc/nginx/snippets/personal-finance.conf;` ภายในบล็อก `server { ... }` ดังนี้:

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name argeem.com www.argeem.com; # (ชื่อโดเมนของคุณ)

    # ... การตั้งค่า SSL เดิม ...

    # -------------------------------------------------------------
    # 1. เว็บหลักเดิม (argeem-web)
    # -------------------------------------------------------------
    location / {
        proxy_pass http://127.0.0.1:3000; # (หรือ root /var/www/argeem-web/...)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # -------------------------------------------------------------
    # 2. ชี้ /personal/finance ไปยัง FinTrack Pro
    # -------------------------------------------------------------
    include /etc/nginx/snippets/personal-finance.conf;
}
```

### ทดสอบและ Reload NGINX
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🚀 ขั้นตอนที่ 3: วิธีการ Deploy

คุณสามารถเลือก Deploy ได้ 2 วิธีตามความสะดวก:

### วิธีที่ A: Deploy จากเครื่อง Local ของคุณ (แนะนำ สะดวกและประหยัด RAM เซิร์ฟเวอร์)

1. เข้ามาที่โฟลเดอร์ `personal-financial-web` บนเครื่องของคุณ
2. คัดลอกและตั้งค่าไฟล์ `.env.deploy`:
   ```bash
   cp scripts/deploy.env.example scripts/.env.deploy
   ```
3. แก้ไข `SERVER_HOST` ใน `scripts/.env.deploy` ให้เป็น IP หรือ Domain ของ Server
4. สั่งรัน Deploy Script (ใช้ Git Bash หรือ Terminal):
   ```bash
   bash scripts/deploy.sh
   ```
   *สคริปต์จะทำการ `npm run build` ในเครื่องคุณ แล้ว sync โฟลเดอร์ `dist/` ขึ้นไปยัง `/var/www/personal-financial-web/dist/` พร้อม reload Nginx ให้อัตโนมัติ*

---

### วิธีที่ B: Deploy โดยตรงบน Server (ผ่าน Git)

หากเซิร์ฟเวอร์ของคุณมี Git และ Node.js ติดตั้งอยู่แล้ว:

1. Clone โปรเจกต์ลงบนเซิร์ฟเวอร์:
   ```bash
   cd /var/www
   git clone https://github.com/Argeem/personal-finance-web.git personal-financial-web-repo
   ```
2. สั่งรัน Deploy Script:
   ```bash
   cd /var/www/personal-financial-web-repo
   sudo bash scripts/deploy.sh --server
   ```
   *เมื่อมีการอัปเดตโค้ดใหม่บน GitHub เพียงรันคำสั่ง `sudo bash scripts/deploy.sh --server` อีกครั้ง โค้ดจะถูก git pull, build และอัปเดตเว็บทันที*

---

## 🔍 ตรวจสอบความถูกต้องหลัง Deploy

เปิดเบราว์เซอร์ไปที่:
👉 `https://<YOUR_DOMAIN>/personal/finance/`

- [x] หน้าเว็บโหลดขึ้นสมบูรณ์ ไม่เป็นหน้าจอขาว
- [x] Assets ไฟล์ (CSS, JS) โหลดผ่าน `/personal/finance/assets/...` ได้รหัส HTTP 200
- [x] กด Refresh หน้าเว็บแล้วไม่หลุด 404
- [x] เมื่อพิมพ์ URL แบบไม่มี `/` ท้าย (`/personal/finance`) เบราว์เซอร์จะ Redirect ไปยัง `/personal/finance/` อัตโนมัติ (HTTP 301)
