#!/usr/bin/env bash
# ==============================================================================
# Deploy Script for FinTrack Pro (Personal Financial Web)
# Subpath: /personal/finance/
# ==============================================================================
# รองรับ 2 โหมด:
#   1) On-Server Deploy: รันบน Server โดยตรง (เช่น ssh เข้าไปแล้วสั่ง deploy)
#   2) Remote Deploy: รันจากเครื่องเรา (Local) สคริปต์จะ build และ sync ขึ้น Server ให้
# ==============================================================================

set -euo pipefail

# Text Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

# โหลด Config จาก .env.deploy ถ้ามี
ENV_DEPLOY_FILE="${SCRIPT_DIR}/.env.deploy"
if [ -f "${ENV_DEPLOY_FILE}" ]; then
    info "โหลดค่า Config จาก ${ENV_DEPLOY_FILE}"
    # shellcheck disable=SC1090
    source "${ENV_DEPLOY_FILE}"
fi

# ค่า Default
SERVER_HOST="${SERVER_HOST:-}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_PATH="${SERVER_PATH:-/var/www/personal-financial-web/dist}"
export VITE_BASE_PATH="${VITE_BASE_PATH:-/personal/finance/}"

# ฟังก์ชัน Build โปรเจกต์
build_project() {
    info "กำลังติดตั้ง Dependencies..."
    npm install

    info "กำลัง Build โปรเจกต์ด้วย Base Path: ${VITE_BASE_PATH}..."
    npm run build
    success "Build สำเร็จ! ไฟล์อยู่ที่ ${PROJECT_ROOT}/dist"
}

# ตรวจสอบว่ากำลังรันอยู่บน Server ปลายทางโดยตรงหรือไม่
is_running_on_server() {
    # หากรันบน Linux และมีโฟลเดอร์ /var/www/personal-financial-web ให้ถือว่าอยู่บน Server
    if [ -d "/var/www/personal-financial-web" ] && [ -z "${SERVER_HOST}" ]; then
        return 0
    fi
    return 1
}

# ------------------------------------------------------------------------------
# 1. โหมด On-Server Deploy (รันบนเครื่อง Server)
# ------------------------------------------------------------------------------
if is_running_on_server || [ "${1:-}" == "--server" ]; then
    info "=== กำลัง Deploy ในโหมด On-Server ==="

    if [ -d ".git" ]; then
        info "กำลังดึงโค้ดเวอร์ชันล่าสุดจาก Git..."
        git pull origin main || warn "ไม่สามารถ git pull ได้ จะใช้โค้ดปัจจุบันทำการ build"
    fi

    build_project

    TARGET_DIST="/var/www/personal-financial-web/dist"
    info "กำลังคัดลอกไฟล์ไปยัง ${TARGET_DIST}..."
    mkdir -p "${TARGET_DIST}"
    
    # ลบไฟล์เก่าออกเพื่อความสะอาด
    rm -rf "${TARGET_DIST:?}"/*
    cp -r dist/* "${TARGET_DIST}/"

    # ตั้งสิทธิ์ไฟล์ให้ Web Server (www-data)
    if command -v chown >/dev/null 2>&1; then
        chown -R www-data:www-data /var/www/personal-financial-web || true
        chmod -R 755 /var/www/personal-financial-web || true
    fi

    # Reload Nginx
    if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet nginx; then
        info "กำลัง Reload Nginx..."
        sudo systemctl reload nginx || systemctl reload nginx || true
        success "Reload Nginx สำเร็จ!"
    fi

    success "Deploy เสร็จสิ้นบน Server เรียบร้อยแล้ว!"
    echo -e "ทดสอบเข้าใช้งาน: ${GREEN}/personal/finance/${NC}"
    exit 0
fi

# ------------------------------------------------------------------------------
# 2. โหมด Remote Deploy (รันจากเครื่อง Local แล้ว Sync ขึ้น Server)
# ------------------------------------------------------------------------------
info "=== กำลัง Deploy ในโหมด Remote Deploy (จากเครื่อง Local) ==="

# หากไม่ได้ระบุ SERVER_HOST
if [ -z "${SERVER_HOST}" ]; then
    echo ""
    warn "ไม่พบการตั้งค่า SERVER_HOST ในสคริปต์หรือ scripts/.env.deploy"
    echo -n "กรุณาระบุ IP Address หรือ Domain Name ของ Server: "
    read -r input_host
    if [ -z "${input_host}" ]; then
        error "จำเป็นต้องระบุ Server Host เพื่อดำเนินการต่อ"
        exit 1
    fi
    SERVER_HOST="${input_host}"
fi

# ทำการ Build บนเครื่องเรา
build_project

# ตรวจสอบการเชื่อมต่อ SSH
info "กำลังเชื่อมต่อไปยัง ${SERVER_USER}@${SERVER_HOST}:${SERVER_PORT}..."

# ตรวจสอบว่าปลายทางมีโฟลเดอร์หรือยัง
ssh -p "${SERVER_PORT}" "${SERVER_USER}@${SERVER_HOST}" "mkdir -p ${SERVER_PATH}"

# Sync ไฟล์ขึ้น Server (ใช้ rsync ถ้ามี ถ้าไม่มีใช้ scp)
if command -v rsync >/dev/null 2>&1; then
    info "กำลัง Sync ไฟล์ด้วย rsync..."
    rsync -avz --delete -e "ssh -p ${SERVER_PORT}" dist/ "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"
else
    info "กำลังคัดลอกไฟล์ด้วย scp..."
    scp -P "${SERVER_PORT}" -r dist/* "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"
fi

# ตั้งสิทธิ์และ Reload Nginx บน Server
info "กำลังตั้ง Permissions และ Reload Nginx บน Server..."
ssh -p "${SERVER_PORT}" "${SERVER_USER}@${SERVER_HOST}" bash -c "'
    chown -R www-data:www-data ${SERVER_PATH} || true
    chmod -R 755 ${SERVER_PATH} || true
    if command -v systemctl >/dev/null 2>&1; then
        systemctl reload nginx || true
    fi
'"

success "======================================================================"
success "  🎉 Deploy FinTrack Pro ขึ้น Server สำเร็จเรียบร้อย!"
success "======================================================================"
echo -e "คุณสามารถเข้าชมได้ที่: ${GREEN}https://${SERVER_HOST}/personal/finance/${NC}"
echo "======================================================================"
