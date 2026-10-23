const http = require('http');
const fs = require('fs');
const path = require('path');
const facebookService = require('./services/facebook-service');
const facebookScraper = require('./services/facebook-scraper');

const ENV_PATH = path.join(__dirname, '.env');
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Đọc cấu hình từ .env và biến môi trường hệ thống
function loadEnvConfig() {
  const defaults = {
    FB_PAGE_ID: process.env.FB_PAGE_ID || '',
    FB_PAGE_ACCESS_TOKEN: process.env.FB_PAGE_ACCESS_TOKEN || '',
    FB_GRAPH_API_VERSION: process.env.FB_GRAPH_API_VERSION || 'v19.0',
    PORT: process.env.PORT || '3000'
  };

  if (fs.existsSync(ENV_PATH)) {
    const raw = fs.readFileSync(ENV_PATH, 'utf8');
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const k = trimmed.substring(0, eqIdx).trim();
        const v = trimmed.substring(eqIdx + 1).trim();
        if (k && v) defaults[k] = v;
      }
    }
  }

  // Ưu tiên biến môi trường từ hệ thống/Docker/Cloud hosting nếu có
  if (process.env.FB_PAGE_ID) defaults.FB_PAGE_ID = process.env.FB_PAGE_ID;
  if (process.env.FB_PAGE_ACCESS_TOKEN) defaults.FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
  if (process.env.FB_GRAPH_API_VERSION) defaults.FB_GRAPH_API_VERSION = process.env.FB_GRAPH_API_VERSION;
  if (process.env.PORT) defaults.PORT = process.env.PORT;

  return defaults;
}

// Lưu file .env
function updateEnvConfig(updates) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(ENV_PATH, content.trim() + '\n', 'utf8');
}

let currentConfig = loadEnvConfig();
const PORT = parseInt(process.env.PORT || currentConfig.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, 'frontend');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4'
};

// Helper đọc JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) { // giới hạn 50MB
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const [reqPath] = req.url.split('?');

  // ==========================================
  // API ROUTE: GET /health & /ping (Chống ngủ đông / Keep-Alive)
  // ==========================================
  if (req.method === 'GET' && (reqPath === '/health' || reqPath === '/ping' || reqPath === '/api/health')) {
    return sendJsonResponse(res, 200, {
      status: 'ok',
      service: 'fb-auto-upload-video',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  }

  // ==========================================
  // API ROUTE 1: GET /api/config
  // ==========================================
  if (req.method === 'GET' && reqPath === '/api/config') {
    currentConfig = loadEnvConfig();
    const token = currentConfig.FB_PAGE_ACCESS_TOKEN || '';
    const maskedToken = token.length > 10 
      ? `${token.substring(0, 6)}...${token.substring(token.length - 4)}` 
      : (token ? '******' : '');

    return sendJsonResponse(res, 200, {
      success: true,
      config: {
        pageId: currentConfig.FB_PAGE_ID || '',
        apiVersion: currentConfig.FB_GRAPH_API_VERSION || 'v19.0',
        hasToken: !!token,
        maskedToken: maskedToken
      }
    });
  }

  // ==========================================
  // API ROUTE 2: POST /api/config (Lưu Page ID & Token)
  // ==========================================
  if (req.method === 'POST' && reqPath === '/api/config') {
    try {
      const body = await parseJsonBody(req);
      const updates = {};

      if (body.pageId !== undefined) updates.FB_PAGE_ID = String(body.pageId).trim();
      if (body.pageToken !== undefined && body.pageToken !== '') {
        updates.FB_PAGE_ACCESS_TOKEN = String(body.pageToken).trim();
      }
      if (body.apiVersion !== undefined) updates.FB_GRAPH_API_VERSION = String(body.apiVersion).trim();

      updateEnvConfig(updates);
      currentConfig = loadEnvConfig();

      return sendJsonResponse(res, 200, {
        success: true,
        message: 'Đã lưu cấu hình Facebook Page ID và Access Token vào .env thành công!',
        config: {
          pageId: currentConfig.FB_PAGE_ID,
          apiVersion: currentConfig.FB_GRAPH_API_VERSION,
          hasToken: !!currentConfig.FB_PAGE_ACCESS_TOKEN
        }
      });
    } catch (err) {
      return sendJsonResponse(res, 400, { success: false, error: err.message });
    }
  }

  // ==========================================
  // API ROUTE 3: POST /api/verify (Kiểm tra token với Meta Graph API)
  // ==========================================
  if (req.method === 'POST' && reqPath === '/api/verify') {
    try {
      currentConfig = loadEnvConfig();
      const body = await parseJsonBody(req);
      const pageId = body.pageId || currentConfig.FB_PAGE_ID;
      const pageToken = body.pageToken || currentConfig.FB_PAGE_ACCESS_TOKEN;
      const apiVersion = body.apiVersion || currentConfig.FB_GRAPH_API_VERSION || 'v19.0';

      if (!pageToken) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Chưa cấu hình Page Access Token.'
        });
      }

      const result = await facebookService.verifyPageCredentials({ pageId, pageToken, apiVersion });
      return sendJsonResponse(res, result.success ? 200 : 400, result);
    } catch (err) {
      return sendJsonResponse(res, 500, { success: false, error: err.message });
    }
  }

  // ==========================================
  // API ROUTE 4: POST /api/publish (Đăng bài hoặc Hẹn giờ)
  // ==========================================
  if (req.method === 'POST' && reqPath === '/api/publish') {
    try {
      currentConfig = loadEnvConfig();
      const body = await parseJsonBody(req);
      const pageId = body.pageId || currentConfig.FB_PAGE_ID;
      const pageToken = body.pageToken || currentConfig.FB_PAGE_ACCESS_TOKEN;
      const apiVersion = body.apiVersion || currentConfig.FB_GRAPH_API_VERSION || 'v19.0';

      if (!pageToken) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Vui lòng cung cấp Page Access Token trước khi đăng bài.'
        });
      }

      const deleteAfterUpload = body.deleteAfterUpload !== undefined ? !!body.deleteAfterUpload : true;

      const result = await facebookService.publishToFacebookPage({
        pageId,
        pageToken,
        apiVersion,
        format: body.format || 'status',
        caption: body.caption || '',
        title: body.title || '',
        firstComment: body.firstComment || '',
        scheduledPublishTime: body.scheduledPublishTime || null,
        mediaBase64: body.mediaBase64 || null,
        mediaFilePath: body.mediaFilePath || null,
        mediaType: body.mediaType || null,
        deleteAfterUpload: deleteAfterUpload
      });

      // Đảm bảo xoá file video sau khi upload thành công nếu yêu cầu
      if (result.success && deleteAfterUpload && body.mediaFilePath && fs.existsSync(body.mediaFilePath)) {
        try {
          fs.unlinkSync(body.mediaFilePath);
          result.fileDeleted = true;
          console.log(`[API /publish] 🗑️ Đã xoá file video sau khi đăng: ${body.mediaFilePath}`);
        } catch (delErr) {
          console.warn(`[API /publish] ⚠️ Không thể xoá file: ${delErr.message}`);
        }
      }

      return sendJsonResponse(res, result.success ? 200 : 400, result);
    } catch (err) {
      return sendJsonResponse(res, 500, { success: false, error: err.message });
    }
  }

  // ==========================================
  // API ROUTE 5: POST /api/reels/scan (Quét trang Reels, tìm video lượt view cao nhất)
  // ==========================================
  if (req.method === 'POST' && reqPath === '/api/reels/scan') {
    try {
      const body = await parseJsonBody(req);
      const pageUrl = body.pageUrl || 'https://www.facebook.com/ThoBayMau/reels/';
      const maxScrolls = parseInt(body.maxScrolls || '4', 10);

      const scanResult = await facebookScraper.scanPageReels({ pageUrl, maxScrolls });
      return sendJsonResponse(res, 200, scanResult);
    } catch (err) {
      return sendJsonResponse(res, 500, { success: false, error: err.message });
    }
  }

  // ==========================================
  // API ROUTE 6: POST /api/reels/download (Tải video Reel về máy)
  // ==========================================
  if (req.method === 'POST' && reqPath === '/api/reels/download') {
    try {
      const body = await parseJsonBody(req);
      const reelUrl = body.reelUrl || body.url;

      if (!reelUrl) {
        return sendJsonResponse(res, 400, { success: false, error: 'Thiếu đường dẫn reelUrl để tải video.' });
      }

      const downloadResult = await facebookScraper.downloadReel({ reelUrl, outputDir: DOWNLOADS_DIR });
      return sendJsonResponse(res, 200, downloadResult);
    } catch (err) {
      return sendJsonResponse(res, 500, { success: false, error: err.message });
    }
  }

  // ==========================================
  // API ROUTE 7: POST /api/reels/auto-workflow (Quét -> Chọn Top View -> Tải -> Tự động Đăng Fanpage)
  // ==========================================
  if (req.method === 'POST' && reqPath === '/api/reels/auto-workflow') {
    const logs = [];
    const addLog = (step, msg) => {
      const time = new Date().toLocaleTimeString('vi-VN');
      logs.push({ time, step, msg });
      console.log(`[AutoWorkflow][${step}] ${msg}`);
    };

    try {
      const body = await parseJsonBody(req);
      const pageUrl = body.pageUrl || 'https://www.facebook.com/ThoBayMau/reels/';
      const maxScrolls = parseInt(body.maxScrolls || '4', 10);
      const pageId = body.pageId || currentConfig.FB_PAGE_ID;
      const pageToken = body.pageToken || currentConfig.FB_PAGE_ACCESS_TOKEN;
      const apiVersion = body.apiVersion || currentConfig.FB_GRAPH_API_VERSION || 'v19.0';
      const scheduledPublishTime = body.scheduledPublishTime || null;
      const firstComment = body.firstComment || '';

      if (!pageId || !pageToken) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Vui lòng cấu hình Page ID và Page Access Token trước khi kích hoạt quy trình tự động.',
          logs
        });
      }

      // Bước 1: Quét trang tìm các Reels
      addLog('SCAN', `Đang quét danh sách Reels từ trang: ${pageUrl}...`);
      const scanResult = await facebookScraper.scanPageReels({ pageUrl, maxScrolls });

      if (!scanResult.reels || scanResult.reels.length === 0) {
        throw new Error('Không tìm thấy video Reel nào trên trang đích.');
      }

      // Bước 2: Chọn video có lượt xem cao nhất (Top 1 view)
      const topReel = scanResult.topReel;
      addLog('ANALYSIS', `Tìm thấy video lượt xem cao nhất: Reel #${topReel.reelId} với ${topReel.formattedViews} lượt xem (${topReel.viewCount.toLocaleString()} views).`);

      // Bước 3: Tải video về thư mục cục bộ
      addLog('DOWNLOAD', `Đang tải video ${topReel.url} về máy bằng yt-dlp...`);
      const downloadResult = await facebookScraper.downloadReel({ reelUrl: topReel.url, outputDir: DOWNLOADS_DIR });
      addLog('DOWNLOAD', `Tải video hoàn tất: ${downloadResult.fileName} (${downloadResult.fileSizeFormatted})`);

      // Bước 4: Tạo nội dung bài đăng
      let finalCaption = body.captionTemplate || `[Thỏ Bảy Màu - ${topReel.formattedViews} views] ${topReel.title}\n\nNguồn: ${topReel.url}\n#ThoBayMau #Reels #TopViews #Viral`;
      finalCaption = finalCaption
        .replace(/\{views\}/g, topReel.formattedViews)
        .replace(/\{title\}/g, topReel.title)
        .replace(/\{url\}/g, topReel.url)
        .replace(/\{reelId\}/g, topReel.reelId);

      const videoTitle = body.title || `Reel Thỏ Bảy Màu - ${topReel.formattedViews} Views`;

      // Bước 5: Tự động đăng lên Fanpage
      addLog('PUBLISH', `Đang đẩy video lên Fanpage ID ${pageId} qua Meta Graph API (${scheduledPublishTime ? 'Hẹn giờ đăng' : 'Đăng ngay lập tức'})...`);

      const deleteAfterUpload = body.deleteAfterUpload !== undefined ? !!body.deleteAfterUpload : true;

      const publishResult = await facebookService.publishToFacebookPage({
        pageId,
        pageToken,
        apiVersion,
        format: 'reels',
        caption: finalCaption,
        title: videoTitle,
        firstComment: firstComment,
        scheduledPublishTime: scheduledPublishTime,
        mediaFilePath: downloadResult.filePath,
        mediaType: 'video/mp4',
        deleteAfterUpload: deleteAfterUpload
      });

      if (!publishResult.success) {
        throw new Error(`Đăng lên Facebook thất bại: ${publishResult.error}`);
      }

      addLog('SUCCESS', `Đăng thành công lên Fanpage! Video ID: ${publishResult.videoId || publishResult.postId}`);

      // Xử lý xoá video sau khi đăng thành công (không lưu trữ)
      let fileDeleted = publishResult.fileDeleted;
      if (deleteAfterUpload && !fileDeleted && downloadResult.filePath && fs.existsSync(downloadResult.filePath)) {
        try {
          fs.unlinkSync(downloadResult.filePath);
          fileDeleted = true;
        } catch (delErr) {
          console.warn(`[AutoWorkflow] ⚠️ Không thể xoá video: ${delErr.message}`);
        }
      }

      if (fileDeleted) {
        addLog('CLEANUP', `🗑️ Đã tự động xoá video (${downloadResult.fileName}) khỏi máy chủ sau khi upload thành công, không lưu trữ.`);
      }

      return sendJsonResponse(res, 200, {
        success: true,
        message: 'Quy trình quét, tải video top view và đăng lên Fanpage hoàn tất xuất sắc!',
        topReel,
        download: downloadResult,
        publish: publishResult,
        caption: finalCaption,
        fileDeleted: !!fileDeleted,
        logs
      });
    } catch (err) {
      addLog('ERROR', err.message);
      return sendJsonResponse(res, 500, { success: false, error: err.message, logs });
    }
  }

  // ==========================================
  // API ROUTE 8: POST /api/media/delete (Xoá file video khỏi thư mục downloads)
  // ==========================================
  if (req.method === 'POST' && reqPath === '/api/media/delete') {
    try {
      const body = await parseJsonBody(req);
      const target = body.filePath || (body.fileName ? path.join(DOWNLOADS_DIR, path.basename(body.fileName)) : null);
      if (!target) {
        return sendJsonResponse(res, 400, { success: false, error: 'Thiếu filePath hoặc fileName để xoá.' });
      }

      const resolved = path.resolve(target);
      if (!resolved.startsWith(path.resolve(DOWNLOADS_DIR))) {
        return sendJsonResponse(res, 403, { success: false, error: 'Chỉ được phép xoá file trong thư mục downloads.' });
      }

      if (fs.existsSync(resolved)) {
        fs.unlinkSync(resolved);
        return sendJsonResponse(res, 200, { success: true, message: 'Đã xoá file thành công.', path: resolved });
      } else {
        return sendJsonResponse(res, 200, { success: true, message: 'File không tồn tại hoặc đã được xoá từ trước.' });
      }
    } catch (err) {
      return sendJsonResponse(res, 500, { success: false, error: err.message });
    }
  }

  // ==========================================
  // SERVE DOWNLOADED MEDIA FILES: /downloads/*
  // ==========================================
  if (reqPath.startsWith('/downloads/')) {
    const fileName = path.basename(reqPath);
    const downloadFilePath = path.join(DOWNLOADS_DIR, fileName);

    if (fs.existsSync(downloadFilePath) && fs.statSync(downloadFilePath).isFile()) {
      const stat = fs.statSync(downloadFilePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(downloadFilePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
        return;
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes'
        };
        res.writeHead(200, head);
        fs.createReadStream(downloadFilePath).pipe(res);
        return;
      }
    }
  }

  // ==========================================
  // STATIC ASSETS SERVING
  // ==========================================
  let staticPath = reqPath === '/' || reqPath === '' ? '/index.html' : reqPath;
  const filePath = path.join(PUBLIC_DIR, staticPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 FB AutoPost Studio Server is running!`);
  console.log(`🌐 Open in your browser: http://localhost:${PORT}`);
  console.log(`🔑 Page ID: ${currentConfig.FB_PAGE_ID || '(Chưa cấu hình)'}`);
  console.log(`🔐 Token Status: ${currentConfig.FB_PAGE_ACCESS_TOKEN ? 'Đã cài đặt' : '(Chưa cấu hình)'}`);
  console.log(`=======================================================`);

  // Cơ chế Keep-Alive tự động chống ngủ đông trên Render Cloud
  // Render tự gán biến môi trường RENDER_EXTERNAL_URL (VD: https://facebookautouploadvideo.onrender.com)
  const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
  if (externalUrl) {
    const pingEndpoint = externalUrl.replace(/\/$/, '') + '/ping';
    console.log(`[Keep-Alive] 🔄 Đã kích hoạt cơ chế chống ngủ đông cho Render Cloud: ${pingEndpoint}`);
    
    // Gửi request mỗi 10 phút (Render đưa vào chế độ ngủ sau 15 phút không hoạt động)
    setInterval(async () => {
      try {
        const res = await fetch(pingEndpoint);
        console.log(`[Keep-Alive] 💓 Ping sống lúc ${new Date().toLocaleTimeString('vi-VN')} -> Status: ${res.status}`);
      } catch (err) {
        console.warn(`[Keep-Alive] ⚠️ Ping thất bại: ${err.message}`);
      }
    }, 10 * 60 * 1000);
  }
});

