# DEPLOYMENT.md — Self-host Vnansial

Vnansial is a single Node + static-Vite app. You can run it on any VPS, on
a managed platform, or in Docker. Below: tested paths for two Indonesian
hosts (Sumopod, Jetorbit) and a generic Linux VPS recipe.

> Need only the AI keys? Sumopod gives free credits for Indonesian devs —
> sign up at [sumopod.com](https://sumopod.com) and create a key. The free
> tier handles light demo traffic comfortably.

---

## 1. Prepare your machine

1. **Node 20 LTS or 22.** Verify: `node -v`.
2. **Git.** Verify: `git --version`.
3. (Optional) **better-sqlite3** prerequisites for persistence:
   - Debian/Ubuntu: `sudo apt install -y build-essential python3`
   - macOS: install Xcode CLT (`xcode-select --install`).

---

## 2. Clone & configure

```bash
git clone https://github.com/mukhayyar/OpenClaw2026_BRBSolo_vnansial.git vnansial
cd vnansial
cp .env.example .env
nano .env       # fill in keys
```

`.env` keys (all optional except SumoPod for AI):

```
SUMOPOD_API_KEY=sk-...
SUMOPOD_BASE_URL=https://ai.sumopod.com/v1     # default
SUMOPOD_MODEL=qwen3.6-flash                    # default
TELEGRAM_BOT_TOKEN=                            # optional
VNANSIAL_DB_PATH=./server/data/vnansial.db     # optional
PORT=3001                                      # optional
VITE_API_URL=                                  # leave empty if served from same origin
```

Install:

```bash
npm install
npm install better-sqlite3   # optional — enables persistent storage
npm run build                # produces ./dist
```

Verify locally:

```bash
npm run start                # serves ./dist + /api on PORT
# Visit http://localhost:3001
```

---

## 3. Deploy on Sumopod VPS

Sumopod is Indonesia-based, low-latency for your audience, and offers both
GPU AI inference + cheap CPU VPS plans.

**A. Order a CPU VPS** at https://sumopod.com (Ubuntu 22.04, 1 GB RAM is
enough for demo).

**B. SSH in and install Node:**

```bash
ssh root@your-vps-ip
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs git build-essential nginx
```

**C. Clone & build:**

```bash
git clone https://github.com/<you>/vnansial.git /opt/vnansial
cd /opt/vnansial
cp .env.example .env && nano .env
npm install
npm install better-sqlite3
npm run build
```

**D. Run with systemd:**

```ini
# /etc/systemd/system/vnansial.service
[Unit]
Description=Vnansial
After=network.target

[Service]
WorkingDirectory=/opt/vnansial
EnvironmentFile=/opt/vnansial/.env
ExecStart=/usr/bin/node /opt/vnansial/server/index.js
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable --now vnansial
systemctl status vnansial
```

**E. Front with nginx + TLS (Let's Encrypt):**

```nginx
# /etc/nginx/sites-available/vnansial
server {
    server_name vnansial.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/vnansial /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
apt install -y certbot python3-certbot-nginx
certbot --nginx -d vnansial.yourdomain.com
```

Done. Your app is live with HTTPS.

---

## 4. Deploy on Jetorbit (Indonesia)

Jetorbit (https://jetorbit.com) sells managed VPS and cPanel hosting at
local pricing. Two paths:

### 4a. Jetorbit VPS (recommended)
Same as the Sumopod recipe — pick the Ubuntu 22.04 image, follow steps
C–E above. Jetorbit's panel exposes SSH and DNS, so wiring a subdomain to
your VPS IP takes < 5 minutes.

### 4b. Jetorbit cPanel + Node selector
For static-only deployment without a backend:

1. Run `npm run build` locally.
2. Upload `dist/*` to `public_html/` via cPanel File Manager or FTP.
3. The AI agent will not work in this mode — point users at a remote
   `VITE_API_URL` if you still want it.

For full functionality, prefer 4a.

---

## 5. Deploy with Docker (any provider)

```bash
docker build -t vnansial .
docker run -d --restart=always -p 3001:3001 --env-file .env --name vnansial vnansial
```

The shipped Dockerfile does multi-stage build → small alpine runtime.

---

## 6. Telegram bot (optional)

1. Create a bot with [@BotFather](https://t.me/BotFather), copy the token.
2. Set `TELEGRAM_BOT_TOKEN=...` in `.env`.
3. Restart the service. The bot will start polling automatically — no
   webhook needed.
4. Open Telegram, search your bot, send `/start`. Then `/help` to see the
   commands (`/score`, `/quote`, `/crypto`, `/emiten`, `/ask <question>`).

For high-traffic deployments, use webhooks instead:
```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://vnansial.yourdomain.com/api/telegram/webhook"
```
(You'd need to add a `POST /api/telegram/webhook` handler — see
`server/integrations/telegram.js` for the pattern.)

---

## 7. Customising your install

- **Branding:** edit `index.html` `<title>`, replace the logo SVG in
  `src/components/Layout.tsx`.
- **Data sources:** swap `server/data/ojk.js` for your own list. Insurance
  data lives in `server/lib/insurance.js`.
- **AI model:** set `SUMOPOD_MODEL` to any model your provider exposes
  (e.g. `gpt-4o-mini` if pointing at OpenAI directly).
- **Database location:** set `VNANSIAL_DB_PATH` to a persistent volume.

---

## 8. Health checks

- `GET /api/health` → returns `{ ok, db, sumopod, telegram }`. Use it as a
  status probe.
- `GET /api/agent/test` → pings the LLM end-to-end.
- `GET /api/idx/emiten` → confirms IDX proxy works.
- `GET /api/crypto/top?limit=3` → confirms CoinGecko works.

---

## 9. Updating

```bash
cd /opt/vnansial
git pull
npm install
npm run build
systemctl restart vnansial
```

---

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `db: memory` at startup | better-sqlite3 not installed | `npm install better-sqlite3` |
| 503 from `/api/agent/chat` | missing/invalid SUMOPOD_API_KEY | edit `.env`, restart |
| 403 from IDX endpoints | upstream rate limit / region block | wait 10 min (cache TTL); deploy from an Indonesian IP (Sumopod / Jetorbit) for best results |
| 429 from CoinGecko | rate limit | wait, reduce poll frequency |
| Telegram bot quiet | wrong token / firewall | check log; test `curl https://api.telegram.org/bot$TOKEN/getMe` |
