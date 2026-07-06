#!/usr/bin/env bash
set -e

# ─── Config ─────────────────────────────────────────────────────────
APP_DIR="/opt/billreader"
FRONTEND_PORT=3001
BACKEND_PORT=8001
DOMAIN_OR_IP="electricity.hsnadeeb.in" # leave empty to use server IP
EMAIL="hsnadeeb007@gmail.com"
# ────────────────────────────────────────────────────────────────────

if [ "$EUID" -ne 0 ]; then
  echo "Run with sudo: sudo bash $0 [path-to-project]"
  exit 1
fi

SRC="${1:-$(dirname "$0")}"

echo "==> Installing system packages..."
apt update
apt install -y \
    nodejs \
    python3 \
    python3-pip \
    python3-venv \
    nginx \
    rsync \
    curl \
    certbot \
    python3-certbot-nginx

echo "==> Installing pm2..."
npm install -g pm2

echo "==> Copying project to $APP_DIR..."
mkdir -p "$APP_DIR"

rsync -a --delete \
    --exclude node_modules \
    --exclude .next \
    --exclude backend/venv \
    --exclude .git \
    "$SRC/" "$APP_DIR/"

echo "==> Setting up frontend..."
cd "$APP_DIR"

npm install
npm run build

echo "==> Setting up backend..."
cd "$APP_DIR/backend"

rm -rf venv
python3 -m venv venv

source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

echo "==> Starting apps with pm2..."

pm2 delete billreader-frontend billreader-backend 2>/dev/null || true

pm2 start "npm start -- -p $FRONTEND_PORT" \
    --name billreader-frontend \
    --cwd "$APP_DIR"

pm2 start "uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT" \
    --name billreader-backend \
    --cwd "$APP_DIR/backend"

pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup

echo "==> Configuring nginx..."

if [ -z "$DOMAIN_OR_IP" ]; then
    DOMAIN_OR_IP=$(curl -4 -s ifconfig.me || hostname -I | awk '{print $1}')
fi

# Create nginx config ONLY if it doesn't already exist.
# This preserves the HTTPS configuration that Certbot adds.
if [ ! -f /etc/nginx/sites-available/billreader ]; then

cat >/etc/nginx/sites-available/billreader <<NGINX
server {
    listen 80;
    server_name $DOMAIN_OR_IP;

    client_max_body_size 500M;

    location /api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX

    ln -sf /etc/nginx/sites-available/billreader \
        /etc/nginx/sites-enabled/billreader

    rm -f /etc/nginx/sites-enabled/default
fi

nginx -t
systemctl reload nginx

echo "==> Ensuring HTTPS..."

certbot \
    --nginx \
    --non-interactive \
    --agree-tos \
    --redirect \
    --email "$EMAIL" \
    -d "$DOMAIN_OR_IP" || true

systemctl reload nginx

echo ""
echo "================================================"
echo " Deployment Complete!"
echo ""
echo " Frontend : https://$DOMAIN_OR_IP"
echo " Backend  : https://$DOMAIN_OR_IP/api/"
echo "================================================"
