# BroStock Pro — Production Deployment Guide

This guide provides step-by-step instructions for deploying **BroStock Pro**, a real-time Vietnamese stock market analysis dashboard and automated trading signal platform built with **FastAPI** (Backend) and **Next.js 16** (Frontend).

---

## 🏗 System Architecture Overview

```
                        +----------------------------+
                        |      Client Browser        |
                        +--------------+-------------+
                                       |
                                       v
                        +--------------+-------------+
                        |   Nginx Reverse Proxy      |
                        |   (SSL / HTTPS via Certbot)|
                        +------+--------------+------+
                               |              |
              http://127.0.0.1:3000          http://127.0.0.1:8000
                               |              |
                               v              v
                        +------+------+ +-----+--------+
                        |   Next.js   | |   FastAPI    |
                        |  (PM2 App)  | |  (Systemd)   |
                        +-------------+ +-----+--------+
                                              |
                                              +----> Telegram Bot API
                                              +----> vnstock / DNSE Fallback
                                              +----> SQLite (market_data.db)
```

---

## ⚙️ Prerequisites & Environment Requirements

### Server Minimum Specs (VPS):
- **CPU:** 2 vCPU
- **RAM:** 2 GB RAM (4 GB recommended)
- **OS:** Ubuntu 22.04 LTS / 24.04 LTS
- **Storage:** 20 GB SSD

### Software Dependencies:
- **Python:** 3.11+
- **Node.js:** 18+ or 20+ (LTS) & npm
- **Web Server:** Nginx
- **Process Manager:** `systemd` (Backend) & `pm2` (Frontend)

---

## 🚀 Option 1: VPS Deployment (Recommended)

VPS deployment is recommended because the backend maintains SQLite cache state, runs background market aggregators, and schedules EOD updates.

### 1. Environment Preparation

Connect to your VPS and update packages:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nodejs npm nginx certbot python3-certbot-nginx git
```

Install PM2 globally for managing the Next.js process:
```bash
sudo npm install -y -g pm2
```

Clone the repository:
```bash
cd /var/www
sudo git clone https://github.com/fearmexxx/brostock.git
sudo chown -R $USER:$USER /var/www/brostock
cd /var/www/brostock
```

---

### 2. Backend Setup (FastAPI & Python Environment)

Create and activate Python virtual environment:
```bash
cd /var/www/brostock
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Create backend environment file `.env`:
```bash
cat << 'EOF' > .env
TELEGRAM_BOT_TOKEN=8357372266:AAE3uKPYuv4UF72jIwYQF7ro0XpFYAjueGM
ALLOWED_ORIGINS=https://brostock.yourdomain.com,http://localhost:3000
EOF
```

Test running backend manually:
```bash
python3 backend/main.py
```
*(Press `Ctrl+C` once verified)*

#### Create Systemd Service for Backend
Create `/etc/systemd/system/brostock-backend.service`:
```bash
sudo nano /etc/systemd/system/brostock-backend.service
```

Paste the following configuration:
```ini
[Unit]
Description=BroStock FastAPI Backend Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/brostock
EnvironmentFile=/var/www/brostock/.env
ExecStart=/var/www/brostock/venv/bin/python3 backend/main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable brostock-backend
sudo systemctl start brostock-backend
sudo systemctl status brostock-backend
```

---

### 3. Frontend Setup (Next.js & PM2)

Navigate to the frontend directory:
```bash
cd /var/www/brostock/frontend
```

Create frontend environment file `.env.local`:
```bash
cat << 'EOF' > .env.local
NEXT_PUBLIC_API_URL=https://brostock-api.yourdomain.com
EOF
```

Install dependencies and build production application:
```bash
npm install
npm run build
```

Start frontend with PM2:
```bash
pm2 start npm --name "brostock-frontend" -- run start -- -p 3000
pm2 save
pm2 startup
```

---

### 4. Nginx Reverse Proxy Setup

Create Nginx configuration for API & Frontend:
```bash
sudo nano /etc/nginx/sites-available/brostock
```

Paste the following Nginx configuration:
```nginx
# Frontend Server
server {
    server_name brostock.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API Server
server {
    server_name brostock-api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_redirect off;
    }
}
```

Enable Nginx site configuration & test syntax:
```bash
sudo ln -s /etc/nginx/sites-available/brostock /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Setup SSL / HTTPS via Let's Encrypt Certbot:
```bash
sudo certbot --nginx -d brostock.yourdomain.com -d brostock-api.yourdomain.com
```

---

## ☁️ Option 2: Cloud / Serverless Deployment (Render + Vercel)

### Backend Deployment (Render.com / Railway.app)
1. Push repository to GitHub.
2. Create a new **Web Service** on Render / Railway pointing to your repository.
3. Configure settings:
   - **Root Directory:** `./`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python3 backend/main.py` or `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables:
   - `TELEGRAM_BOT_TOKEN`: `<your_bot_token>`
   - `ALLOWED_ORIGINS`: `https://your-app.vercel.app`

### Frontend Deployment (Vercel)
1. Import repository on [Vercel Dashboard](https://vercel.com/dashboard).
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Next.js`.
4. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend.onrender.com` (no trailing slash `/`)
5. Click **Deploy**.

---

## 🛠 Useful Maintenance Commands

| Action | Command |
|--------|---------|
| Check Backend Status | `sudo systemctl status brostock-backend` |
| View Backend Logs | `sudo journalctl -u brostock-backend -f -n 100` |
| Restart Backend | `sudo systemctl restart brostock-backend` |
| Check Frontend Status | `pm2 status` |
| View Frontend Logs | `pm2 logs brostock-frontend` |
| Restart Frontend | `pm2 restart brostock-frontend` |
| Restart Nginx | `sudo systemctl restart nginx` |

---

## 🔒 Security Checklist

- [ ] Ensure `ALLOWED_ORIGINS` in `.env` specifies only your domain names instead of wildcard `*`.
- [ ] Ensure `.env` and `market_data.db` are listed in `.gitignore`.
- [ ] Set up HTTPS certificates using Certbot for both backend and frontend domains.
- [ ] Configure UFW firewall on Ubuntu: `sudo ufw allow 80,443,22/tcp && sudo ufw enable`.
