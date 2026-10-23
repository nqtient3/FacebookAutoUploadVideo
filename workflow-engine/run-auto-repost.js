#!/usr/bin/env node
/**
 * Facebook Reels Auto-Download & Fanpage Upload Runner
 * Chạy trực tiếp từ dòng lệnh: node run-auto-repost.js [url]
 */

const fs = require('fs');
const path = require('path');
const scraper = require('./services/facebook-scraper');
const fbService = require('./services/facebook-service');

const ENV_PATH = path.join(__dirname, '.env');
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');

// Đọc file .env
function loadEnv() {
  const env = {
    FB_PAGE_ID: process.env.FB_PAGE_ID || '',
    FB_PAGE_ACCESS_TOKEN: process.env.FB_PAGE_ACCESS_TOKEN || '',
    FB_GRAPH_API_VERSION: process.env.FB_GRAPH_API_VERSION || 'v19.0'
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
        if (k && !env[k]) env[k] = v;
      }
    }
  }
  return env;
}

async function main() {
  const args = process.argv.slice(2);
  const targetUrl = args[0] || 'https://www.facebook.com/ThoBayMau/reels/';

  console.log('================================================================');
  console.log('🚀 FB AUTO REPOST STUDIO - REELS WORKFLOW RUNNER');
  console.log(`🎯 Trang nguồn: ${targetUrl}`);
  console.log('================================================================\n');

  try {
    // ------------------------------------------------------------
    // BƯỚC 1: Quét danh sách Reels từ trang nguồn
    // ------------------------------------------------------------
    console.log('🔍 [Bước 1/4] Đang quét danh sách Reels và phân tích lượt xem...');
    const scanResult = await scraper.scanPageReels({ pageUrl: targetUrl, maxScrolls: 4 });

    if (!scanResult.reels || scanResult.reels.length === 0) {
      throw new Error('Không tìm thấy video Reel nào trên trang nguồn.');
    }

    console.log(`✅ Đã quét được ${scanResult.totalFound} Reels từ trang: ${scanResult.pageTitle || targetUrl}`);

    // In top 5 video có lượt xem cao nhất
    console.log('\n📊 Top Reels có lượt xem cao nhất:');
    scanResult.reels.slice(0, 5).forEach((r, idx) => {
      const medal = idx === 0 ? '👑 TOP #1' : (idx === 1 ? '🥈 #2' : (idx === 2 ? '🥉 #3' : `   #${idx + 1}`));
      console.log(`  ${medal}: Reel #${r.reelId} | 🔥 ${r.formattedViews} views (${r.viewCount.toLocaleString()} lượt xem)`);
    });

    // ------------------------------------------------------------
    // BƯỚC 2: Chọn video có lượt xem cao nhất
    // ------------------------------------------------------------
    const topReel = scanResult.topReel;
    console.log('\n🏆 [Bước 2/4] Đã chọn video quán quân (Top #1 View):');
    console.log(`  - Reel ID: ${topReel.reelId}`);
    console.log(`  - Số lượt xem: ${topReel.formattedViews} (${topReel.viewCount.toLocaleString()} lượt xem)`);
    console.log(`  - URL xem gốc: ${topReel.url}`);

    // ------------------------------------------------------------
    // BƯỚC 3: Tải video về máy bằng yt-dlp
    // ------------------------------------------------------------
    console.log('\n⬇️ [Bước 3/4] Đang tải video HD về thư mục máy...');
    const downloadResult = await scraper.downloadReel({ reelUrl: topReel.url, outputDir: DOWNLOADS_DIR });
    console.log(`✅ Tải video thành công: ${downloadResult.filePath} (${downloadResult.fileSizeFormatted})`);

    // ------------------------------------------------------------
    // BƯỚC 4: Đăng video lên Fanpage theo cài đặt .env
    // ------------------------------------------------------------
    const config = loadEnv();
    const pageId = config.FB_PAGE_ID;
    const pageToken = config.FB_PAGE_ACCESS_TOKEN;
    const apiVersion = config.FB_GRAPH_API_VERSION || 'v19.0';

    console.log('\n📤 [Bước 4/4] Kiểm tra cài đặt và đăng lên Fanpage...');

    if (!pageId || !pageToken) {
      console.log('⚠️ [CHÚ Ý] Chưa cấu hình FB_PAGE_ID hoặc FB_PAGE_ACCESS_TOKEN trong file .env');
      console.log('📁 Video Top View đã được tải về sẵn sàng tại:');
      console.log(`   👉 ${downloadResult.filePath}`);
      console.log('\n💡 Để tự động đăng lên Fanpage của bạn:');
      console.log('   1. Mở file .env và điền:');
      console.log('      FB_PAGE_ID=Dãy_Số_ID_Fanpage_Của_Bạn');
      console.log('      FB_PAGE_ACCESS_TOKEN=Mã_Truy_Cập_Trang_Dài_Hạn_EAAG...');
      console.log('   2. Chạy lại lệnh: node run-auto-repost.js');
      console.log('   (Hoặc sử dụng giao diện web trực quan tại http://localhost:3000)\n');
      return;
    }

    console.log(`🔑 Đang kết nối đến Fanpage ID: ${pageId}...`);

    // Tạo caption bài đăng
    const caption = `[Thỏ Bảy Màu - Top View: ${topReel.formattedViews}] ${topReel.title}\n\nSiêu phẩm hoạt hình Thỏ Bảy Màu đạt hơn ${topReel.formattedViews} lượt xem!\n\n#ThoBayMau #Reels #TopViews #HoatHinh #HaiHuoc #Viral`;
    const firstComment = '🐰 Cảm ơn các bạn đã ủng hộ Thỏ Bảy Màu! Đừng quên theo dõi fanpage để cập nhật những thước phim mới nhất nhé!';

    const publishResult = await fbService.publishToFacebookPage({
      pageId,
      pageToken,
      apiVersion,
      format: 'reels',
      caption,
      title: `Reel Thỏ Bảy Màu - ${topReel.formattedViews} Views`,
      firstComment,
      mediaFilePath: downloadResult.filePath,
      mediaType: 'video/mp4',
      deleteAfterUpload: true
    });

    if (!publishResult.success) {
      throw new Error(`Đăng lên Fanpage thất bại: ${publishResult.error}`);
    }

    console.log('\n🎉 ================================================================');
    console.log('🎉 XUẤT SẮC! ĐÃ ĐĂNG VIDEO LÊN FANPAGE THÀNH CÔNG!');
    console.log(`📌 Post/Video ID: ${publishResult.videoId || publishResult.postId}`);
    console.log(`🔗 Link bài viết Facebook: ${publishResult.url}`);

    // Dọn dẹp ổ đĩa: xoá video vừa upload thành công (không lưu trữ)
    let cleanedUp = publishResult.fileDeleted;
    if (!cleanedUp && downloadResult && downloadResult.filePath && fs.existsSync(downloadResult.filePath)) {
      try {
        fs.unlinkSync(downloadResult.filePath);
        cleanedUp = true;
      } catch (delErr) {
        console.warn(`⚠️ [Dọn dẹp] Không thể xoá file: ${delErr.message}`);
      }
    }
    if (cleanedUp) {
      console.log(`🗑️ [Dọn dẹp ổ đĩa] Đã tự động xoá file video sau khi upload thành công: ${downloadResult.filePath}`);
    }
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ [LỖI]:', err.message);
    process.exit(1);
  }
}

main();
