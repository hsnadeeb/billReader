#!/usr/bin/env bash
set -e

# ─── Config ─────────────────────────────────────────────────────────
APP_DIR="/opt/billreader"
FRONTEND_PORT=3001
BACKEND_PORT=8001
DOMAIN_OR_IP="electricity.hsnadeeb.in" # leave empty to use server IP
# ─────────────────────────────────────────────────────────────────────

if [ "$EUID" -ne 0 ]; then
  echo "Run with sudo: sudo bash $0 [path-to-project]"
  exit 1
fi

SRC="${1:-$(dirname "$0")}"

echo "==> Installing system packages..."
apt update && apt install -y nodejs python3 python3-pip python3-venv nginx rsync

echo "==> Installing pm2..."
npm install -g pm2

echo "==> Copying project to $APP_DIR..."
mkdir -p "$APP_DIR"
rsync -a --delete "$SRC/" "$APP_DIR/" --exclude node_modules --exclude .next --exclude backend/venv --exclude .git

echo "==> Setting up frontend..."
cd "$APP_DIR"
npm install
npm run build

echo "==> Setting up backend..."
cd "$APP_DIR/backend"
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo "==> Starting apps with pm2..."
pm2 delete billreader-frontend billreader-backend 2>/dev/null || true
pm2 start "npm start -- -p $FRONTEND_PORT" --name billreader-frontend --cwd "$APP_DIR"
pm2 start "uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT" --name billreader-backend --cwd "$APP_DIR/backend"
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup

echo "==> Configuring nginx..."
if [ -z "$DOMAIN_OR_IP" ]; then
  DOMAIN_OR_IP=$(curl -4 -s ifconfig.me || hostname -I | awk '{print $1}')
fi

cat >/etc/nginx/sites-available/billreader <<NGINX
server {
    listen 80;
    server_name $DOMAIN_OR_IP;

    client_max_body_size 500M;

    location /api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
NGINX

if [ -f /etc/nginx/sites-enabled/billreader ]; then
  rm /etc/nginx/sites-enabled/billreader
fi
ln -s /etc/nginx/sites-available/billreader /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "================================================"
echo " Deployed! Visit: http://$DOMAIN_OR_IP"
echo " Backend API: http://$DOMAIN_OR_IP/api/"
echo "================================================"
