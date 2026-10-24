#!/usr/bin/env bash
# ==============================================================================
# Server Setup Script for FinTrack Pro (Personal Financial Web)
# Target Subpath: /personal/finance
# Compatible with: Ubuntu / Debian / Debian-based VPS
# ==============================================================================

set -euo pipefail

# Text Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# 1. Check Root Privileges
if [ "$(id -u)" -ne 0 ]; then
    error "สคริปต์นี้จำเป็นต้องใช้สิทธิ์ Root หรือ sudo กรุณารันด้วย: sudo bash $0"
    exit 1
fi

info "เริ่มต้นการตั้งค่า Server สำหรับ Personal Financial Web (/personal/finance)..."

# 2. Config Variables
WEB_ROOT="/var/www/personal-financial-web"
DIST_DIR="${WEB_ROOT}/dist"
SNIPPET_DIR="/etc/nginx/snippets"
SNIPPET_FILE="${SNIPPET_DIR}/personal-finance.conf"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 3. Check & Install Nginx if missing
if ! command -v nginx >/dev/null 2>&1; then
    warn "ไม่พบ Nginx บนระบบ กำลังติดตั้ง Nginx..."
    apt-get update -y
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    success "ติดตั้ง Nginx เรียบร้อยแล้ว"
else
    success "ตรวจพบ Nginx ในระบบเรียบร้อย"
fi

# 4. Create Directory Structure & Permissions
info "กำลังสร้างโฟลเดอร์สำหรับโปรเจกต์ที่ ${DIST_DIR}..."
mkdir -p "${DIST_DIR}"
mkdir -p "${SNIPPET_DIR}"

# สร้างหน้า index.html ชั่วคราว (Placeholder) เพื่อให้ Nginx ทดสอบและเปิดดูได้ทันทีก่อน deploy จริง
if [ ! -f "${DIST_DIR}/index.html" ]; then
    cat <<EOF > "${DIST_DIR}/index.html"
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>FinTrack Pro - Setup Complete</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
        .card { background: #1e293b; padding: 2rem 3rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.3); text-align: center; border: 1px solid #334155; }
        h1 { color: #38bdf8; margin-bottom: 0.5rem; }
        p { color: #94a3b8; }
        code { background: #0f172a; padding: 0.2rem 0.6rem; border-radius: 0.375rem; color: #f43f5e; font-size: 0.95rem; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🎉 FinTrack Pro - Server Setup สำเร็จ!</h1>
        <p>NGINX Route <code>/personal/finance</code> เชื่อมต่อกับ Server เรียบร้อยแล้ว</p>
        <p>ขั้นตอนถัดไป: รันสคริปต์ <code>./scripts/deploy.sh</code> เพื่อ Deploy แอพพลิเคชันจริง</p>
    </div>
</body>
</html>
EOF
fi

# กำหนดสิทธิ์โฟลเดอร์ให้ www-data (Nginx User)
chown -R www-data:www-data "${WEB_ROOT}"
chmod -R 755 "${WEB_ROOT}"
success "ตั้งค่าโฟลเดอร์และ Permissions สำเร็จ: ${WEB_ROOT}"

# 5. Install Nginx Snippet
info "กำลังคัดลอก Nginx snippet ไปยัง ${SNIPPET_FILE}..."
if [ -f "${SCRIPT_DIR}/nginx-personal-finance.conf" ]; then
    cp "${SCRIPT_DIR}/nginx-personal-finance.conf" "${SNIPPET_FILE}"
else
    # กรณีรันเดี่ยวๆ โดยไม่มีไฟล์คู่กัน
    cat <<'EOF' > "${SNIPPET_FILE}"
# FinTrack Pro Nginx Snippet
location = /personal/finance {
    return 301 /personal/finance/;
}

location ^~ /personal/finance/ {
    alias /var/www/personal-financial-web/dist/;
    index index.html;
    try_files $uri $uri/ /personal/finance/index.html;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}

location ~* ^/personal/finance/assets/(.+\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))$ {
    alias /var/www/personal-financial-web/dist/assets/$1;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
}
EOF
fi
success "สร้างไฟล์ Nginx Snippet เรียบร้อยที่ ${SNIPPET_FILE}"

# 6. Assist in Linking snippet to existing Nginx Server Block
info "ตรวจสอบ Nginx Server Block ที่เปิดใช้งานอยู่..."
ACTIVE_CONFIGS=$(find /etc/nginx/sites-enabled -type l -o -type f 2>/dev/null || true)

echo "----------------------------------------------------------------------"
info "วิธีเชื่อมต่อ Nginx เข้ากับเว็บหลักของคุณ:"
echo -e "ให้เพิ่มคำสั่งนี้เข้าไปในไฟล์ Nginx config ของเว็บหลัก (เช่น /etc/nginx/sites-available/argeem-web):"
echo ""
echo -e "    ${GREEN}include /etc/nginx/snippets/personal-finance.conf;${NC}"
echo ""
echo "ตัวอย่างโครงสร้างไฟล์ Server Block:"
echo "    server {"
echo "        server_name yourdomain.com;"
echo "        # ... config เดิมของ argeem-web ..."
echo ""
echo -e "        # FinTrack Pro Subpath"
echo -e "        ${GREEN}include /etc/nginx/snippets/personal-finance.conf;${NC}"
echo "    }"
echo "----------------------------------------------------------------------"

# Auto-inject option if requested or detected
if [ -n "${ACTIVE_CONFIGS}" ]; then
    echo "พบไฟล์ Config ที่เปิดใช้งานอยู่:"
    echo "${ACTIVE_CONFIGS}"
fi

# 7. Test Nginx Configuration
info "ทดสอบความถูกต้องของ Nginx Configuration..."
if nginx -t; then
    success "Nginx Configuration ตรวจสอบผ่านเรียบร้อย!"
    info "กำลัง Reload Nginx..."
    systemctl reload nginx || systemctl restart nginx
    success "Reload Nginx สำเร็จ!"
else
    warn "Nginx config มีจุดที่ต้องตรวจสอบ กรุณาตรวจเช็คด้วย 'nginx -t' หลังแก้ไขไฟล์ config หลัก"
fi

echo ""
echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}  Server Setup เสร็จสมบูรณ์! ${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo "1. เมื่อ include snippet ใน Nginx config หลักแล้ว ทดสอบเข้าชมได้ที่:"
echo "   http://<YOUR_DOMAIN_OR_IP>/personal/finance/"
echo ""
echo "2. สำหรับการ Deploy โปรเจกต์ สามารถรัน:"
echo "   ./scripts/deploy.sh"
echo "======================================================================"
