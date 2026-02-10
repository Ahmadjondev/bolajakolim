#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Bolajakolim — Full deployment script for Ubuntu 22.04/24.04
# Domain: startup.soften.uz
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────
DOMAIN="startup.soften.uz"
DEPLOY_USER="inventory"
APP_DIR="/home/${DEPLOY_USER}/bolajakolim"
BACKEND_DIR="${APP_DIR}/backend"
FRONTEND_DIR="${APP_DIR}/frontend"
DEPLOY_DIR="${APP_DIR}/deploy"
PYTHON_VERSION="3.10"  # Matches .python-version
NODE_MAJOR=20

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1 — System packages
# ═══════════════════════════════════════════════════════════════════════════
install_system_packages() {
    info "Updating system packages…"
    sudo apt update && sudo apt upgrade -y

    info "Installing base dependencies…"
    sudo apt install -y \
        python3 python3-pip python3-venv \
        postgresql postgresql-contrib libpq-dev \
        redis-server \
        nginx certbot python3-certbot-nginx \
        git curl build-essential

    # Node.js via NodeSource
    if ! command -v node &>/dev/null; then
        info "Installing Node.js ${NODE_MAJOR}…"
        curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | sudo -E bash -
        sudo apt install -y nodejs
    fi

    # pnpm
    if ! command -v pnpm &>/dev/null; then
        info "Installing pnpm…"
        sudo npm install -g pnpm
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2 — Create deploy user (if needed)
# ═══════════════════════════════════════════════════════════════════════════
# setup_deploy_user() {
#     if ! id "${DEPLOY_USER}" &>/dev/null; then
#         info "Creating user '${DEPLOY_USER}'…"
#         sudo adduser --disabled-password --gecos "" "${DEPLOY_USER}"
#         sudo usermod -aG www-data "${DEPLOY_USER}"
#     fi
# }

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3 — PostgreSQL
# ═══════════════════════════════════════════════════════════════════════════
setup_postgresql() {
    info "Setting up PostgreSQL…"
    sudo systemctl enable --now postgresql

    # Create DB and user if they don't exist
    if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='bolajakolim_user'" | grep -q 1; then
        read -sp "Enter PostgreSQL password for bolajakolim_user: " DB_PASS
        echo
        sudo -u postgres psql <<SQL
CREATE USER bolajakolim_user WITH PASSWORD '${DB_PASS}';
CREATE DATABASE bolajakolim_db OWNER bolajakolim_user;
ALTER ROLE bolajakolim_user SET client_encoding TO 'utf8';
ALTER ROLE bolajakolim_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE bolajakolim_user SET timezone TO 'Asia/Tashkent';
GRANT ALL PRIVILEGES ON DATABASE bolajakolim_db TO bolajakolim_user;
SQL
        info "PostgreSQL database created. Remember to update DATABASE_URL in .env"
        info "DATABASE_URL=postgres://bolajakolim_user:${DB_PASS}@localhost:5432/bolajakolim_db"
    else
        info "PostgreSQL user already exists — skipping."
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 4 — Redis
# ═══════════════════════════════════════════════════════════════════════════
setup_redis() {
    info "Enabling Redis…"
    sudo systemctl enable --now redis-server
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 5 — Backend (Django + Gunicorn)
# ═══════════════════════════════════════════════════════════════════════════
setup_backend() {
    info "Setting up Django backend…"

    cd "${BACKEND_DIR}"

    # Virtual environment
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    source .venv/bin/activate

    # Install dependencies
    pip install --upgrade pip
    pip install -e ".[dev]" 2>/dev/null || pip install -e .

    # Check for .env
    if [ ! -f .env ]; then
        warn ".env not found! Copy from deploy/.env.production.example and fill in values."
        warn "  cp ${DEPLOY_DIR}/.env.production.example ${BACKEND_DIR}/.env"
        warn "  Then edit ${BACKEND_DIR}/.env"
    fi

    # Collect static, migrate
    python manage.py collectstatic --noinput
    python manage.py migrate --noinput

    deactivate

    # Gunicorn log directory
    sudo mkdir -p /var/log/gunicorn
    sudo chown "${DEPLOY_USER}:www-data" /var/log/gunicorn
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 6 — Frontend (Next.js)
# ═══════════════════════════════════════════════════════════════════════════
setup_frontend() {
    info "Setting up Next.js frontend…"

    cd "${FRONTEND_DIR}"

    # Install deps & build
    pnpm install --frozen-lockfile
    pnpm build
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 7 — Systemd services
# ═══════════════════════════════════════════════════════════════════════════
setup_systemd() {
    info "Installing systemd services…"

    sudo cp "${DEPLOY_DIR}/gunicorn.service"  /etc/systemd/system/bolajakolim-backend.service
    sudo cp "${DEPLOY_DIR}/celery.service"    /etc/systemd/system/bolajakolim-celery.service
    sudo cp "${DEPLOY_DIR}/nextjs.service"    /etc/systemd/system/bolajakolim-frontend.service

    sudo systemctl daemon-reload

    sudo systemctl enable --now bolajakolim-backend
    sudo systemctl enable --now bolajakolim-celery
    sudo systemctl enable --now bolajakolim-frontend

    info "Services started."
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 8 — Nginx
# ═══════════════════════════════════════════════════════════════════════════
setup_nginx() {
    info "Configuring Nginx…"

    sudo cp "${DEPLOY_DIR}/nginx.conf" /etc/nginx/sites-available/bolajakolim
    sudo ln -sf /etc/nginx/sites-available/bolajakolim /etc/nginx/sites-enabled/bolajakolim
    sudo rm -f /etc/nginx/sites-enabled/default

    # Test config
    sudo nginx -t
    sudo systemctl reload nginx
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 9 — SSL with Let's Encrypt
# ═══════════════════════════════════════════════════════════════════════════
setup_ssl() {
    info "Obtaining SSL certificate for ${DOMAIN}…"

    # Create webroot for certbot
    sudo mkdir -p /var/www/certbot

    sudo certbot --nginx \
        -d "${DOMAIN}" \
        --non-interactive \
        --agree-tos \
        --email admin@${DOMAIN} \
        --redirect

    # Auto-renewal timer
    sudo systemctl enable --now certbot.timer
    info "SSL certificate installed and auto-renewal enabled."
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 10 — Firewall
# ═══════════════════════════════════════════════════════════════════════════
setup_firewall() {
    info "Configuring UFW firewall…"

    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full'
    sudo ufw --force enable
}

# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════
main() {
    echo "═══════════════════════════════════════════════════════════════"
    echo "  Bolajakolim — Deployment to ${DOMAIN}"
    echo "═══════════════════════════════════════════════════════════════"
    echo

    PS3="Select step to run (or 0 for ALL): "
    options=(
        "ALL — Run everything in order"
        "1. Install system packages"
        "2. Setup deploy user"
        "3. Setup PostgreSQL"
        "4. Setup Redis"
        "5. Setup Backend (Django)"
        "6. Setup Frontend (Next.js)"
        "7. Install systemd services"
        "8. Configure Nginx"
        "9. Setup SSL (Let's Encrypt)"
        "10. Setup Firewall (UFW)"
        "Quit"
    )

    select opt in "${options[@]}"; do
        case $REPLY in
            1) install_system_packages; setup_postgresql; setup_redis;
               setup_backend; setup_frontend; setup_systemd; setup_nginx; setup_ssl; setup_firewall;
               info "✅ Full deployment complete!"; break ;;
            2)  install_system_packages ;;
            3)  # setup_deploy_user ;;
            4)  setup_postgresql ;;
            5)  setup_redis ;;
            6)  setup_backend ;;
            7)  setup_frontend ;;
            8)  setup_systemd ;;
            9)  setup_nginx ;;
            10) setup_ssl ;;
            11) setup_firewall ;;
            12) exit 0 ;;
            *)  warn "Invalid option" ;;
        esac
    done
}

main "$@"
