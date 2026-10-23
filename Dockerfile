FROM node:20-slim

# Cài đặt Chromium, ffmpeg, curl và các thư viện cần thiết cho Headless Browser
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ffmpeg \
    python3 \
    curl \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt yt-dlp bản mới nhất chạy trên Linux
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Thiết lập biến môi trường
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PORT=3000 \
    NODE_ENV=production

WORKDIR /app

# Cài đặt thư viện Node.js từ thư mục workflow-engine
COPY workflow-engine/package*.json ./
RUN npm install --omit=dev

# Copy toàn bộ mã nguồn workflow-engine
COPY workflow-engine/ .

# Tạo thư mục lưu trữ tạm cho downloads
RUN mkdir -p downloads && chmod -R 777 downloads

EXPOSE 3000

CMD ["node", "server.js"]
