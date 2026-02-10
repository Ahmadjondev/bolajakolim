# Bolajakolim — Deployment Guide

**Target**: Ubuntu 22.04/24.04 · Domain: `startup.soften.uz`  
**Stack**: Django + Gunicorn + Celery | Next.js | Nginx + SSL | PostgreSQL + Redis

---

## Architecture

```
Internet → Nginx (443/80)
              ├── /api/*, /admin/, /schema/  →  Gunicorn :8010  (Django)
              └── /*                         →  Next.js  :3000
```

---

## 1. Server Preparation

SSH into your server and clone the project:

```bash
ssh root@startup.soften.uz

# Create deploy user
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
usermod -aG www-data deploy

# Switch to deploy user
su - deploy

# Clone project
git clone <your-repo-url> /home/deploy/bolajakolim
cd /home/deploy/bolajakolim
```

---

## 2. Automated Deployment (Recommended)

Run the interactive deploy script:

```bash
chmod +x deploy/deploy.sh
sudo bash deploy/deploy.sh
```

Select **option 1** to run all steps, or run individual steps as needed.

---

## 3. Manual Step-by-Step

### 3.1 System Packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv \
    postgresql postgresql-contrib libpq-dev \
    redis-server nginx certbot python3-certbot-nginx \
    git curl build-essential

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm
```

### 3.2 PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE USER bolajakolim_user WITH PASSWORD 'YOUR_STRONG_PASSWORD';
CREATE DATABASE bolajakolim_db OWNER bolajakolim_user;
ALTER ROLE bolajakolim_user SET client_encoding TO 'utf8';
ALTER ROLE bolajakolim_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE bolajakolim_user SET timezone TO 'Asia/Tashkent';
GRANT ALL PRIVILEGES ON DATABASE bolajakolim_db TO bolajakolim_user;
\q
```

### 3.3 Redis

```bash
sudo systemctl enable --now redis-server
```

### 3.4 Backend Environment

```bash
cd /home/deploy/bolajakolim/backend

# Create virtual env
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -e .

# Configure production environment
cp ../deploy/.env.production.example .env
nano .env   # ← Fill in SECRET_KEY, DATABASE_URL, etc.

# Run migrations & collect static
python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py createsuperuser  # optional

deactivate
```

Generate a `SECRET_KEY`:
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3.5 Frontend

```bash
cd /home/deploy/bolajakolim/frontend

# .env.production is already in the repo
# Verify NEXT_PUBLIC_API_BASE=https://startup.soften.uz/api

pnpm install --frozen-lockfile
pnpm build
```

### 3.6 Gunicorn Log Directory

```bash
sudo mkdir -p /var/log/gunicorn
sudo chown deploy:www-data /var/log/gunicorn
```

### 3.7 Systemd Services

```bash
sudo cp deploy/gunicorn.service  /etc/systemd/system/bolajakolim-backend.service
sudo cp deploy/celery.service    /etc/systemd/system/bolajakolim-celery.service
sudo cp deploy/nextjs.service    /etc/systemd/system/bolajakolim-frontend.service

sudo systemctl daemon-reload
sudo systemctl enable --now bolajakolim-backend
sudo systemctl enable --now bolajakolim-celery
sudo systemctl enable --now bolajakolim-frontend
```

### 3.8 Nginx

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/bolajakolim
sudo ln -sf /etc/nginx/sites-available/bolajakolim /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx
```

### 3.9 SSL Certificate

```bash
sudo certbot --nginx -d startup.soften.uz --agree-tos --email admin@startup.soften.uz
sudo systemctl enable --now certbot.timer
```

### 3.10 Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

## 4. Re-deploying After Code Changes

```bash
chmod +x deploy/redeploy.sh
bash deploy/redeploy.sh
```

Or manually:

```bash
cd /home/deploy/bolajakolim && git pull origin main

# Backend
cd backend && source .venv/bin/activate
pip install -e . && python manage.py migrate --noinput && python manage.py collectstatic --noinput
deactivate

# Frontend
cd ../frontend && pnpm install --frozen-lockfile && pnpm build

# Restart
sudo systemctl restart bolajakolim-backend bolajakolim-celery bolajakolim-frontend
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Useful Commands

| Action | Command |
|---|---|
| View backend logs | `sudo journalctl -u bolajakolim-backend -f` |
| View celery logs | `sudo journalctl -u bolajakolim-celery -f` |
| View frontend logs | `sudo journalctl -u bolajakolim-frontend -f` |
| Gunicorn access log | `tail -f /var/log/gunicorn/access.log` |
| Gunicorn error log | `tail -f /var/log/gunicorn/error.log` |
| Nginx error log | `sudo tail -f /var/log/nginx/error.log` |
| Restart backend | `sudo systemctl restart bolajakolim-backend` |
| Restart celery | `sudo systemctl restart bolajakolim-celery` |
| Restart frontend | `sudo systemctl restart bolajakolim-frontend` |
| Status check | `sudo systemctl status bolajakolim-*` |
| Renew SSL | `sudo certbot renew --dry-run` |
| Django shell | `cd backend && source .venv/bin/activate && python manage.py shell` |

---

## 6. File Layout on Server

```
/home/deploy/bolajakolim/
├── backend/
│   ├── .env                    ← production secrets
│   ├── .venv/                  ← Python virtual env
│   ├── staticfiles/            ← collected static (served by Nginx)
│   ├── media/                  ← user uploads (served by Nginx)
│   └── ...
├── frontend/
│   ├── .env.production
│   ├── .next/                  ← built Next.js app
│   └── ...
├── deploy/
│   ├── deploy.sh
│   ├── redeploy.sh
│   ├── gunicorn.conf.py
│   ├── nginx.conf
│   ├── gunicorn.service
│   ├── celery.service
│   ├── nextjs.service
│   └── .env.production.example
```

---

## 7. Troubleshooting

**502 Bad Gateway** — Backend not running:
```bash
sudo systemctl status bolajakolim-backend
sudo journalctl -u bolajakolim-backend -n 50
```

**Static files not loading** — run collectstatic:
```bash
cd backend && source .venv/bin/activate && python manage.py collectstatic --noinput
```

**Database connection errors** — check PostgreSQL:
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"  # list databases
```

**SSL certificate issues**:
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```
