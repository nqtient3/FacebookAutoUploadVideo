/**
 * Facebook Reels Scraper & Downloader Service
 * Tự động quét, phân tích lượt view cao nhất và tải video Facebook Reels
 */

const fs = require('fs');
const path = require('path');
const { execFile, exec } = require('child_process');
const puppeteer = require('puppeteer-core');

const CHROME_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  // Windows
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  // Linux / Docker
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium'
].filter(Boolean);

/**
 * Tìm executable trình duyệt có sẵn
 */
function getBrowserExecutablePath() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

/**
 * Chuyển đổi text lượt xem (VD: 29M, 18M, 8.2M, 692K, 53K, 12,500) thành số nguyên
 */
function parseViewCount(rawText) {
  if (!rawText) return 0;
  const str = String(rawText).trim().replace(/,/g, '.');

  // Match số và đơn vị (M, K, B, Tr, Triệu, Nghìn)
  const match = str.match(/([\d\.]+)\s*([mMkKbBtTrR]|triệu|nghìn|tỷ)?/i);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  if (isNaN(num)) return 0;

  const unit = (match[2] || '').toLowerCase();
  if (unit === 'b' || unit === 'tỷ') {
    return Math.round(num * 1000000000);
  }
  if (unit === 'm' || unit === 'tr' || unit === 'triệu') {
    return Math.round(num * 1000000);
  }
  if (unit === 'k' || unit === 'nghìn') {
    return Math.round(num * 1000);
  }
  return Math.round(num);
}

/**
 * Định dạng số lượt xem hiển thị đẹp
 */
function formatViewNumber(count) {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toLocaleString('vi-VN');
}

/**
 * Quét danh sách Reels từ trang Fanpage Facebook
 * @param {Object} options
 * @param {string} options.pageUrl - URL trang reels (VD: https://www.facebook.com/ThoBayMau/reels/)
 * @param {number} options.maxScrolls - Số lần cuộn trang để nạp thêm (mặc định 4)
 */
async function scanPageReels({ pageUrl = 'https://www.facebook.com/ThoBayMau/reels/', maxScrolls = 4 } = {}) {
  const browserPath = getBrowserExecutablePath();
  if (!browserPath) {
    throw new Error('Không tìm thấy trình duyệt Google Chrome hoặc Edge trên máy để quét dữ liệu.');
  }

  // Chuẩn hóa URL
  let targetUrl = pageUrl.trim();
  if (!targetUrl.startsWith('http')) {
    targetUrl = 'https://' + targetUrl;
  }
  if (!targetUrl.includes('/reels')) {
    targetUrl = targetUrl.replace(/\/$/, '') + '/reels/';
  }

  console.log(`[Scraper] Khởi chạy Chrome quét Reels tại: ${targetUrl}`);

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--disable-notifications',
      '--disable-blink-features=AutomationControlled',
      '--lang=vi-VN,vi'
    ],
    defaultViewport: { width: 1366, height: 768 }
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // Chặn tải các tài nguyên không cần thiết để tăng tốc
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['stylesheet', 'font'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 35000 });

    // Đợi 2.5s nạp component ban đầu
    await new Promise(r => setTimeout(r, 2500));

    // Đóng các popup đăng nhập/chính sách nếu có
    try {
      const closeButtons = await page.$$('div[aria-label="Đóng"], div[aria-label="Close"], [aria-label*="Đóng"], [aria-label*="Close"]');
      for (const btn of closeButtons) {
        await btn.click().catch(() => {});
      }
    } catch (e) {}

    // Cuộn trang để nạp thêm Reels
    for (let i = 0; i < maxScrolls; i++) {
      await page.evaluate(() => window.scrollBy(0, 1200));
      await new Promise(r => setTimeout(r, 1200));
    }

    // Trích xuất danh sách Reels trong DOM
    const rawItems = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/reel/"]'));
      const items = [];
      const seen = new Set();

      for (const a of links) {
        const href = a.href || '';
        const match = href.match(/\/reel\/(\d+)/);
        const reelId = match ? match[1] : null;
        if (!reelId || seen.has(reelId)) continue;
        seen.add(reelId);

        const text = (a.innerText || '').trim();
        const ariaLabel = a.getAttribute('aria-label') || '';
        
        // Tìm ảnh cover thumbnail
        const img = a.querySelector('img');
        const thumbnail = img ? img.src : '';

        // Đọc text thẻ cha để bắt số view nếu anchor chỉ có ảnh
        const parent = a.parentElement || a;
        const parentText = (parent.innerText || '').trim();

        items.push({
          reelId,
          url: `https://www.facebook.com/reel/${reelId}/`,
          text,
          parentText,
          ariaLabel,
          thumbnail
        });
      }

      return {
        pageTitle: document.title,
        items
      };
    });

    // Xử lý và tính toán số lượt xem chuẩn hóa
    const processedReels = rawItems.items.map(item => {
      // Số view thường nằm ở innerText (VD: "29M", "18M", "8.2M")
      const candidateText = item.text || item.parentText || '';
      const viewNumber = parseViewCount(candidateText);

      return {
        reelId: item.reelId,
        url: item.url,
        rawViewText: candidateText.replace(/\n+/g, ' ').slice(0, 30) || '0',
        viewCount: viewNumber,
        formattedViews: formatViewNumber(viewNumber),
        thumbnail: item.thumbnail,
        ariaLabel: item.ariaLabel || 'Facebook Reel',
        title: item.ariaLabel && item.ariaLabel !== 'Reel tile preview' 
          ? item.ariaLabel 
          : `Reel #${item.reelId}`
      };
    });

    // Sắp xếp giảm dần theo số lượt xem (View cao nhất xếp đầu tiên)
    processedReels.sort((a, b) => b.viewCount - a.viewCount);

    // Gán xếp hạng Top
    processedReels.forEach((r, idx) => {
      r.rank = idx + 1;
      r.isHighestView = idx === 0;
    });

    const topReel = processedReels.length > 0 ? processedReels[0] : null;

    return {
      success: true,
      pageUrl: targetUrl,
      pageTitle: rawItems.pageTitle,
      totalFound: processedReels.length,
      topReel,
      reels: processedReels
    };
  } finally {
    await browser.close().catch(() => {});
  }
}

/**
 * Tải video Reel về thư mục cục bộ bằng yt-dlp
 * @param {Object} options
 * @param {string} options.reelUrl - URL của reel (VD: https://www.facebook.com/reel/609854861764157/)
 * @param {string} options.outputDir - Thư mục lưu file
 */
function downloadReel({ reelUrl, outputDir = path.join(__dirname, '..', 'downloads') }) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Trích xuất ID từ URL
    const match = reelUrl.match(/\/reel\/(\d+)/);
    const reelId = match ? match[1] : Date.now().toString();

    // Kiểm tra nếu video đã được tải từ trước
    const existingFile = path.join(outputDir, `${reelId}.mp4`);
    if (fs.existsSync(existingFile) && fs.statSync(existingFile).size > 1024 * 100) {
      const stats = fs.statSync(existingFile);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`[Downloader] File đã tồn tại: ${existingFile} (${sizeMB} MB)`);
      return resolve({
        success: true,
        alreadyDownloaded: true,
        reelId,
        fileName: `${reelId}.mp4`,
        filePath: existingFile,
        relativeUrl: `/downloads/${reelId}.mp4`,
        fileSizeBytes: stats.size,
        fileSizeFormatted: `${sizeMB} MB`
      });
    }

    // Tìm yt-dlp phù hợp trên Windows hoặc Linux
    let ytdlpPath = 'yt-dlp';
    const localWindowsBin = path.join(__dirname, '..', 'bin', 'yt-dlp.exe');
    if (process.platform === 'win32' && fs.existsSync(localWindowsBin)) {
      ytdlpPath = localWindowsBin;
    } else if (fs.existsSync(localWindowsBin)) {
      ytdlpPath = localWindowsBin;
    }

    const outputTemplate = path.join(outputDir, `${reelId}.%(ext)s`);
    const args = [
      '-f', 'mp4',
      '-o', outputTemplate,
      '--no-playlist',
      '--no-warnings',
      reelUrl
    ];

    console.log(`[Downloader] Bắt đầu tải video: ${reelUrl}`);

    execFile(ytdlpPath, args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Downloader] Lỗi khi tải video: ${stderr || error.message}`);
        return reject(new Error(`Tải video thất bại: ${stderr || error.message}`));
      }

      // Xác định file đã tải về
      let finalPath = existingFile;
      if (!fs.existsSync(finalPath)) {
        // Tìm file với đuôi bất kỳ theo reelId
        const files = fs.readdirSync(outputDir).filter(f => f.startsWith(reelId));
        if (files.length > 0) {
          finalPath = path.join(outputDir, files[0]);
        }
      }

      if (!fs.existsSync(finalPath)) {
        return reject(new Error('Không tìm thấy file video sau khi yt-dlp hoàn thành.'));
      }

      const stats = fs.statSync(finalPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      console.log(`[Downloader] Tải video thành công: ${finalPath} (${sizeMB} MB)`);

      resolve({
        success: true,
        alreadyDownloaded: false,
        reelId,
        fileName: path.basename(finalPath),
        filePath: finalPath,
        relativeUrl: `/downloads/${path.basename(finalPath)}`,
        fileSizeBytes: stats.size,
        fileSizeFormatted: `${sizeMB} MB`
      });
    });
  });
}

module.exports = {
  scanPageReels,
  downloadReel,
  parseViewCount,
  formatViewNumber
};
