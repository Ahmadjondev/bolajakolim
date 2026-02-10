#!/usr/bin/env bash
# Quick re-deploy script — pull latest code and restart services
set -euo pipefail

APP_DIR="/home/inventory/bolajakolim"
BACKEND_DIR="${APP_DIR}/backend"
FRONTEND_DIR="${APP_DIR}/frontend"

GREEN='\033[0;32m'
NC='\033[0m'
info() { echo -e "${GREEN}[INFO]${NC} $*"; }

cd "${APP_DIR}"

info "Pulling latest code…"
git pull origin main

info "Updating backend…"
cd "${BACKEND_DIR}"
source .venv/bin/activate
pip install -e .
python manage.py migrate --noinput
python manage.py collectstatic --noinput
deactivate

info "Updating frontend…"
cd "${FRONTEND_DIR}"
pnpm install --frozen-lockfile
pnpm build

info "Restarting services…"
sudo systemctl restart bolajakolim-backend
sudo systemctl restart bolajakolim-celery
sudo systemctl restart bolajakolim-frontend

info "Reloading Nginx…"
sudo nginx -t && sudo systemctl reload nginx

info "✅ Re-deploy complete!"

# Show status
echo
sudo systemctl status bolajakolim-backend --no-pager -l
sudo systemctl status bolajakolim-celery --no-pager -l
sudo systemctl status bolajakolim-frontend --no-pager -l
