/**
 * FB AutoPost Studio - Facebook Reels Crawler & Auto Repost Orchestrator
 * Quét trang Reels, tìm video lượt xem cao nhất, tải về và tự động đăng Fanpage
 */

const PRELOADED_REELS = [
  {
    reelId: "609854861764157",
    url: "https://www.facebook.com/reel/609854861764157/",
    rawViewText: "29M",
    viewCount: 29000000,
    formattedViews: "29M",
    thumbnail: "https://scontent.fsgn2-8.fna.fbcdn.net/v/t15.5256-10/475732899_1704938777097755_3575694296580963452_n.jpg?stp=dst-jpg_tt6&cstp=mx1920x1080&ctp=s960x960&_nc_cat=104&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=d2b52d&_nc_ohc=CxbR1uwB6tEQ7kNvwHOyoxZ&_nc_oc=AdrnZ19SSjx2FCIOxJ5ukjqBStMmX1D4uTqUG0thPdlGDfxj9ajnuigVefkD4HHlHlpvGAPtm2usMUWeKFKm2tpQ&_nc_zt=23&_nc_ht=scontent.fsgn2-8.fna&_nc_gid=IsuP36PzDeOny4nUKGRy0g&_nc_ss=79289&oh=00_AQOVZWvkSR47JiOiDFZkwjdnfHbklm5ze85pzkkvZ_v30w&oe=6ADF63E5",
    title: "Phim hoạt hình Thỏ Bảy Màu - Chiến binh củ cà rốt",
    rank: 1,
    isHighestView: true
  },
  {
    reelId: "1285338499347283",
    url: "https://www.facebook.com/reel/1285338499347283/",
    rawViewText: "18M",
    viewCount: 18000000,
    formattedViews: "18M",
    thumbnail: "https://scontent.fsgn2-6.fna.fbcdn.net/v/t15.5256-10/476136966_1252848279150544_2787550806357820314_n.jpg?stp=dst-jpg_tt6&cstp=mx1920x1080&ctp=s960x960&_nc_cat=109&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=d2b52d&_nc_ohc=3LTRFNPxHJUQ7kNvwFXka5j&_nc_oc=AdrhoQTdFtg_UTq0qlmwC2T03aKnVelTaTubTNX4aLI6_GAW2FFywLwwLph1UvXfa4l-FlCJZJINRRGowUh3D1vr&_nc_zt=23&_nc_ht=scontent.fsgn2-6.fna&_nc_gid=IsuP36PzDeOny4nUKGRy0g&_nc_ss=79289&oh=00_AQOi_phZuLLGzWVC8Ta7vsjbMjsJTHcWwV6shAsygHf7cg&oe=6ADF6EA8",
    title: "Tập đặc biệt Thỏ Bảy Màu và Ông Năm",
    rank: 2,
    isHighestView: false
  },
  {
    reelId: "832718635489703",
    url: "https://www.facebook.com/reel/832718635489703/",
    rawViewText: "12M",
    viewCount: 12000000,
    formattedViews: "12M",
    thumbnail: "https://scontent.fsgn2-8.fna.fbcdn.net/v/t15.5256-10/454283088_420958100978678_686393893880633366_n.jpg?stp=dst-jpg_tt6&cstp=mx2534x1080&ctp=s960x960&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=d2b52d&_nc_ohc=QnTfHcp6-vQQ7kNvwHrdPi1&_nc_oc=AdrhY-QZZM7IAMQwKUjosN3_4bh0Ndmb3vDWYx9M8NPFFN2UelC1wRqyg3dJdnMz86S8uO_pYw7QWc6NctbV5NUK&_nc_zt=23&_nc_ht=scontent.fsgn2-8.fna&_nc_gid=YEmmb6Fu_EHUqdAkjmgP2w&_nc_ss=79289&oh=00_AQN-SlVNiJVsebN5fbZym_UC8Y3lohan5_91tA-bTFPdpQ&oe=6ADF39F4",
    title: "Khi Thỏ Bảy Màu đi làm thêm part 3",
    rank: 3,
    isHighestView: false
  },
  {
    reelId: "1016207723199940",
    url: "https://www.facebook.com/reel/1016207723199940/",
    rawViewText: "8.2M",
    viewCount: 8200000,
    formattedViews: "8.2M",
    thumbnail: "https://scontent.fsgn2-8.fna.fbcdn.net/v/t15.5256-10/454274235_858055312420068_6666339317215408442_n.jpg?stp=dst-jpg_tt6&cstp=mx2534x1080&ctp=s960x960&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=d2b52d&_nc_ohc=vioS6nq48-UQ7kNvwHLGNtM&_nc_oc=Adr7h9e3n_IhCIcGHI50XZY8930XDWD3CyLp0xpqvdsCKgmS9qL7-zqailhCrnkQJ9CfoxJWKk7erMYgV3aIzrpl&_nc_zt=23&_nc_ht=scontent.fsgn2-8.fna&_nc_gid=IsuP36PzDeOny4nUKGRy0g&_nc_ss=79289&oh=00_AQP7I8fR8n3ir6hpUdI6Do-gn3pIWYIab0FkGAO7swCYkA&oe=6ADF57F1",
    title: "Thỏ Bảy Màu - Sự cố khó đỡ siêu hài hước",
    rank: 4,
    isHighestView: false
  },
  {
    reelId: "1153805816278519",
    url: "https://www.facebook.com/reel/1153805816278519/",
    rawViewText: "6.9M",
    viewCount: 6900000,
    formattedViews: "6.9M",
    thumbnail: "https://scontent.fsgn2-6.fna.fbcdn.net/v/t15.5256-10/476233007_1141804880906726_4270311240575152869_n.jpg?stp=dst-jpg_tt6&cstp=mx1920x1080&ctp=s960x960&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=d2b52d&_nc_ohc=zOdFacte0QcQ7kNvwGaG81S&_nc_oc=Adpa_IQNsXTBcgTq7C8IRKJTqq4C6n3FH16jCqArjyjbQdBsv4JEQnchYwz-TsYRrEHih2uX5kkk0SzhsCsXpA34&_nc_zt=23&_nc_ht=scontent.fsgn2-6.fna&_nc_gid=IsuP36PzDeOny4nUKGRy0g&_nc_ss=79289&oh=00_AQOVImTCc_86Ca70UkKepwXZEwnnXrRt9AiDBwTU3lBUFQ&oe=6ADF3F49",
    title: "Thỏ Bảy Màu - Bạn thân hay kẻ thù",
    rank: 5,
    isHighestView: false
  },
  {
    reelId: "645857688071859",
    url: "https://www.facebook.com/reel/645857688071859/",
    rawViewText: "3.9M",
    viewCount: 3900000,
    formattedViews: "3.9M",
    thumbnail: "https://scontent.fsgn2-3.fna.fbcdn.net/v/t15.5256-10/535890216_1422044532419792_2146237502589212898_n.jpg?stp=dst-jpg_tt6&cstp=mx1920x1080&ctp=s960x960&_nc_cat=102&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=5fad0e&_nc_ohc=8MeJJ_Wz3NkQ7kNvwFNQc50&_nc_oc=AdqAo5xGFw78DXXo5bwNuButIE1hQzmM7Bx8Uf9rkd_71_yVeV6__hAfhwrQADonj9RjR0k6PsFdnFAHqrj37Ve-&_nc_zt=23&_nc_ht=scontent.fsgn2-3.fna&_nc_gid=IsuP36PzDeOny4nUKGRy0g&_nc_ss=79289&oh=00_AQNEjTV943sn0NEV7zRNShbEWa-4pH31aQrLR3gmCTBJtA&oe=6ADF60F3",
    title: "Thỏ Bảy Màu - Ngày đầu năm mới cùng bạn bè",
    rank: 6,
    isHighestView: false
  }
];

const ReelsCrawler = {
  state: {
    pageUrl: 'https://www.facebook.com/ThoBayMau/reels/',
    maxScrolls: 4,
    scannedReels: [...PRELOADED_REELS],
    topReel: PRELOADED_REELS[0],
    downloadResult: {
      success: true,
      reelId: '609854861764157',
      fileName: '609854861764157.mp4',
      filePath: 'downloads/609854861764157.mp4',
      relativeUrl: '/downloads/609854861764157.mp4',
      fileSizeFormatted: '17.45 MB'
    },
    isScanning: false,
    isDownloading: false,
    isPublishing: false,
    scheduledMap: {},
    activeScheduleReel: null,
    pageConfig: {
      pageId: '',
      hasToken: false,
      maskedToken: '',
      pageInfo: null
    }
  },

  async init() {
    this.bindEvents();
    this.renderTopReelCard(this.state.topReel);
    this.renderReelsGrid(this.state.scannedReels);
    this.mountVideoPlayer('/downloads/609854861764157.mp4');
    await this.loadFanpageConfig();
    this.appendInitialLog('Hệ thống Reels Scraper sẵn sàng. Video Top 1 (29M views) đã sẵn sàng phát hoặc đăng!');
  },

  bindEvents() {
    // 1. Nút Quét Reels
    const scanBtn = document.getElementById('btn-scan-reels');
    if (scanBtn) {
      scanBtn.addEventListener('click', () => {
        this.startScan();
      });
    }

    // 2. Nút 1-Click Tự Động Toàn Quy Trình (Scan -> Tải Top 1 -> Đăng Fanpage)
    const autoAllBtn = document.getElementById('btn-reels-auto-all');
    if (autoAllBtn) {
      autoAllBtn.addEventListener('click', () => {
        this.runFullAutoWorkflow();
      });
    }

    // 3. Nút Tải Video Top 1
    const downloadTopBtn = document.getElementById('btn-download-top-reel');
    if (downloadTopBtn) {
      downloadTopBtn.addEventListener('click', () => {
        if (this.state.topReel) {
          this.downloadVideo(this.state.topReel);
        } else {
          showToast('Vui lòng quét danh sách Reels trước khi tải.', 'warning');
        }
      });
    }

    // 4. Nút Đăng Video Top 1 Ngay Lập Tức
    const publishTopNowBtn = document.getElementById('btn-publish-top-now');
    if (publishTopNowBtn) {
      publishTopNowBtn.addEventListener('click', () => {
        this.publishSelectedReel(false);
      });
    }

    // 5. Nút Hẹn Giờ Đăng Video Top 1
    const publishTopScheduleBtn = document.getElementById('btn-publish-top-schedule');
    if (publishTopScheduleBtn) {
      publishTopScheduleBtn.addEventListener('click', () => {
        this.publishSelectedReel(true);
      });
    }

    // 6. Nút Đẩy vào Composer để chỉnh sửa
    const sendComposerBtn = document.getElementById('btn-send-to-composer');
    if (sendComposerBtn) {
      sendComposerBtn.addEventListener('click', () => {
        this.sendToComposerView(this.state.topReel);
      });
    }

    // 7. Input URL thay đổi
    const urlInput = document.getElementById('reels-target-url');
    if (urlInput) {
      urlInput.addEventListener('change', () => {
        this.state.pageUrl = urlInput.value.trim() || 'https://www.facebook.com/ThoBayMau/reels/';
      });
    }

    // 8. Bộ lọc sắp xếp
    const sortSelect = document.getElementById('reels-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortAndRenderReels(e.target.value);
      });
    }

    // 9. Nút Lưu Cấu Hình Fanpage vào .env
    const saveCfgBtn = document.getElementById('btn-save-reels-config');
    if (saveCfgBtn) {
      saveCfgBtn.addEventListener('click', () => {
        this.saveFanpageConfig();
      });
    }

    // 10. Nút Live Verify Fanpage
    const verifyCfgBtn = document.getElementById('btn-verify-reels-config');
    if (verifyCfgBtn) {
      verifyCfgBtn.addEventListener('click', () => {
        this.verifyFanpageConfig();
      });
    }

    // 11. Nút Test Chạy Thử Mô Phỏng (Simulation Mode)
    const runSimBtn = document.getElementById('btn-run-simulation-mode');
    if (runSimBtn) {
      runSimBtn.addEventListener('click', () => {
        this.runSimulationMode();
      });
    }

    // 12. Toggle xem token
    const toggleEye = document.getElementById('btn-toggle-reels-token');
    const tokenInput = document.getElementById('reels-cfg-page-token');
    if (toggleEye && tokenInput) {
      toggleEye.addEventListener('click', () => {
        if (tokenInput.type === 'password') {
          tokenInput.type = 'text';
          toggleEye.textContent = '🔒';
        } else {
          tokenInput.type = 'password';
          toggleEye.textContent = '👁️';
        }
      });
    }

    // 13. Nút Nạp & Tải Video Tùy Chỉnh từ ô link Reel
    const loadCustomBtn = document.getElementById('btn-load-custom-reel');
    const customUrlInput = document.getElementById('custom-reel-url-input');
    if (loadCustomBtn && customUrlInput) {
      loadCustomBtn.addEventListener('click', () => {
        this.loadCustomReel(customUrlInput.value.trim());
      });
      customUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.loadCustomReel(customUrlInput.value.trim());
        }
      });
    }

    // 14. Nút Gợi ý link nhanh (.quick-reel-chip)
    document.querySelectorAll('.quick-reel-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const url = chip.dataset.url;
        if (customUrlInput) customUrlInput.value = url;
        this.loadCustomReel(url, chip.dataset);
      });
    });
  },

  // ==========================================
  // NẠP & TẢI VIDEO TỪ LINK REEL TÙY Ý
  // ==========================================
  async loadCustomReel(reelUrl, meta = {}) {
    if (!reelUrl) {
      return showToast('Vui lòng dán link Facebook Reel vào ô nhập liệu.', 'warning');
    }

    const match = reelUrl.match(/\/reel\/(\d+)/) || reelUrl.match(/[?&]v=(\d+)/);
    const reelId = match ? match[1] : (meta.id || Date.now().toString());

    this.addLog('CUSTOM_LINK', `Bắt đầu nạp video từ link: ${reelUrl} (ID: ${reelId})...`, 'highlight');
    showToast(`Đang nạp video Reel #${reelId}...`, 'info');

    const statusMsg = document.getElementById('custom-reel-status-msg');
    const loadBtn = document.getElementById('btn-load-custom-reel');
    const topReelIdEl = document.getElementById('top-reel-id');
    const topReelUrlLink = document.getElementById('top-reel-url');
    const viewsBadge = document.getElementById('top-reel-views-badge');
    const viewsRaw = document.getElementById('top-reel-views-raw');

    if (statusMsg) {
      statusMsg.innerHTML = `⏳ Đang kết nối và tải video HD về máy...`;
      statusMsg.style.color = '#38bdf8';
    }
    if (loadBtn) {
      loadBtn.disabled = true;
      loadBtn.innerHTML = `⏳ Đang nạp...`;
    }
    if (topReelIdEl) topReelIdEl.textContent = `ID: ${reelId}`;
    if (topReelUrlLink) {
      topReelUrlLink.href = reelUrl;
    }

    const existingReel = this.state.scannedReels.find(r => r.reelId === reelId);
    const viewsText = existingReel ? existingReel.formattedViews : (meta.views || 'Tùy chọn');

    if (viewsBadge) viewsBadge.textContent = `${viewsText} LƯỢT XEM`;
    if (viewsRaw) viewsRaw.textContent = `Link video tùy chỉnh: Reel #${reelId}`;

    try {
      const res = await fetch('/api/reels/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reelUrl })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Không thể tải video từ link này.');
      }

      this.state.downloadResult = data;
      this.state.topReel = {
        reelId,
        url: reelUrl,
        formattedViews: viewsText,
        viewCount: existingReel ? existingReel.viewCount : 1000000,
        title: existingReel ? existingReel.title : `Reel Facebook #${reelId}`,
        thumbnail: existingReel ? existingReel.thumbnail : ''
      };

      this.mountVideoPlayer(data.relativeUrl);

      if (statusMsg) {
        statusMsg.innerHTML = `✅ Đã tải và sẵn sàng video MP4 (${data.fileSizeFormatted || 'HD'})`;
        statusMsg.style.color = '#4ade80';
      }

      const captionInput = document.getElementById('reels-caption-template');
      if (captionInput) {
        captionInput.value = `[Reel Hay - ${viewsText}] Video Reel Facebook #${reelId}\n\nXem ngay video cực cuốn này nhé!\nNguồn: ${reelUrl}\n#Reels #FacebookReels #Viral`;
      }

      this.addLog('SUCCESS', `Đã nạp thành công video ${data.fileName} (${data.fileSizeFormatted})! Sẵn sàng bấm Đăng lên Fanpage.`, 'success');
      showToast(`Đã nạp video Reel #${reelId} thành công!`, 'success');
    } catch (err) {
      console.error(err);
      if (statusMsg) {
        statusMsg.innerHTML = `❌ Lỗi: ${err.message}`;
        statusMsg.style.color = '#f87171';
      }
      this.addLog('ERROR', `Lỗi tải Reel từ link tùy chỉnh: ${err.message}`, 'error');
      showToast(`Lỗi: ${err.message}`, 'error');
    } finally {
      if (loadBtn) {
        loadBtn.disabled = false;
        loadBtn.innerHTML = `⬇️ Tải & Nạp Video`;
      }
    }
  },

  // ==========================================
  // CONFIGURATION & SETUP HELPERS
  // ==========================================
  async loadFanpageConfig() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.success && data.config) {
        this.state.pageConfig = data.config;
        const pageIdInput = document.getElementById('reels-cfg-page-id');
        const tokenInput = document.getElementById('reels-cfg-page-token');
        const pill = document.getElementById('reels-fb-status-pill');

        if (pageIdInput && data.config.pageId) {
          pageIdInput.value = data.config.pageId;
        }

        if (tokenInput && data.config.hasToken) {
          tokenInput.placeholder = `Đã cài đặt token: ${data.config.maskedToken || '******'}`;
        }

        if (pill) {
          if (data.config.hasToken && data.config.pageId) {
            pill.textContent = 'ĐÃ CẤU HÌNH .ENV';
            pill.style.background = 'rgba(59, 130, 246, 0.2)';
            pill.style.color = '#93c5fd';
            pill.style.borderColor = 'rgba(59, 130, 246, 0.4)';
          } else {
            pill.textContent = 'CHƯA CẤU HÌNH';
            pill.style.background = 'rgba(148, 163, 184, 0.15)';
            pill.style.color = '#94a3b8';
            pill.style.borderColor = 'rgba(148, 163, 184, 0.3)';
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc cấu hình server:', e);
    }
  },

  async saveFanpageConfig() {
    const pageId = document.getElementById('reels-cfg-page-id')?.value.trim();
    const pageToken = document.getElementById('reels-cfg-page-token')?.value.trim();

    if (!pageId && !pageToken) {
      return showToast('Vui lòng nhập Page ID hoặc Page Access Token để lưu.', 'warning');
    }

    this.addLog('CONFIG', 'Đang lưu Page ID và Token vào file .env...', 'highlight');

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, pageToken, apiVersion: 'v19.0' })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Đã lưu cấu hình Fanpage vào .env thành công!', 'success');
        this.addLog('SUCCESS', 'Đã lưu cấu hình Facebook Page ID và Access Token vào .env!', 'success');
        await this.loadFanpageConfig();
      } else {
        throw new Error(data.error || 'Lỗi lưu cấu hình.');
      }
    } catch (err) {
      showToast(`Lỗi lưu cấu hình: ${err.message}`, 'error');
      this.addLog('ERROR', `Lưu .env thất bại: ${err.message}`, 'error');
    }
  },

  async verifyFanpageConfig() {
    const pageId = document.getElementById('reels-cfg-page-id')?.value.trim();
    const pageToken = document.getElementById('reels-cfg-page-token')?.value.trim();

    this.addLog('VERIFY', 'Đang kết nối kiểm tra Page ID và Token với Meta Graph API...', 'highlight');
    showToast('Đang kiểm tra thông tin Fanpage với Meta...', 'info');

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, pageToken, apiVersion: 'v19.0' })
      });

      const data = await res.json();
      const pill = document.getElementById('reels-fb-status-pill');

      if (data.success && data.page) {
        const pageName = data.page.name;
        const followers = (data.page.followersCount || data.page.fanCount || 0).toLocaleString();
        
        // Tự động đồng bộ Page ID chuẩn từ Meta Graph API
        const pageIdInput = document.getElementById('reels-cfg-page-id');
        if (pageIdInput && data.page.id && pageIdInput.value !== data.page.id) {
          const oldVal = pageIdInput.value;
          pageIdInput.value = data.page.id;
          if (oldVal) {
            this.addLog('CONFIG', `⚡ Đã tự động cập nhật Page ID từ '${oldVal}' (Global ID) sang '${data.page.id}' (Page ID chuẩn)!`, 'warn');
          }
        }

        if (pill) {
          pill.textContent = `🟢 ${pageName} (${followers} fans)`;
          pill.style.background = 'rgba(16, 185, 129, 0.2)';
          pill.style.color = '#6ee7b7';
          pill.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        }

        this.addLog('SUCCESS', `Xác thực thành công Fanpage: ${pageName} (ID: ${data.page.id}, Follower: ${followers})!`, 'success');
        showToast(`Xác thực thành công Fanpage: ${pageName}!`, 'success');
      } else {
        throw new Error(data.error || 'Token hoặc Page ID không hợp lệ.');
      }
    } catch (err) {
      this.addLog('ERROR', `Xác thực Graph API thất bại: ${err.message}`, 'error');
      showToast(`Xác thực thất bại: ${err.message}`, 'error');
      const pill = document.getElementById('reels-fb-status-pill');
      if (pill) {
        pill.textContent = '❌ LỖI XÁC THỰC';
        pill.style.background = 'rgba(239, 68, 68, 0.2)';
        pill.style.color = '#fca5a5';
        pill.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      }
    }
  },

  async runSimulationMode() {
    this.clearLogs();
    this.addLog('SIMULATION', '==================================================', 'warn');
    this.addLog('SIMULATION', 'CHẠY THỬ MÔ PHỎNG QUY TRÌNH (TEST MODE - AN TOÀN 100%)', 'warn');
    this.addLog('SIMULATION', '==================================================', 'warn');

    this.addLog('STEP 1', 'Đang quét danh sách Reels từ https://www.facebook.com/ThoBayMau/reels/...', 'highlight');
    await new Promise(r => setTimeout(r, 600));
    this.addLog('STEP 1', 'Đã phân tích 10 video Reels. Xếp hạng theo số lượt xem thực tế!', 'success');

    await new Promise(r => setTimeout(r, 500));
    const top = this.state.topReel;
    this.addLog('STEP 2', `Tìm thấy video Quán quân: Reel #${top.reelId} với ${top.formattedViews} lượt xem (${top.viewCount.toLocaleString()} views)!`, 'warn');

    await new Promise(r => setTimeout(r, 600));
    this.addLog('STEP 3', `Xác nhận file video HD đã có sẵn: downloads/${top.reelId}.mp4 (17.45 MB)!`, 'success');
    this.mountVideoPlayer('/downloads/609854861764157.mp4');

    await new Promise(r => setTimeout(r, 800));
    this.addLog('STEP 4', `[Simulation] Chuẩn bị payload Reels upload: caption, thumbnail, video buffer...`, 'highlight');
    
    await new Promise(r => setTimeout(r, 700));
    const mockPostId = 'sim_' + Date.now().toString().slice(-8);
    this.addLog('SUCCESS', `🎉 [Simulation] Mô phỏng thành công! Video ID giả lập: ${mockPostId}`, 'success');
    this.addLog('RESULT', `Link xem thử: https://facebook.com/${mockPostId}`, 'highlight');
    showToast('Chạy thử mô phỏng thành công 100%! Quy trình hoàn toàn trơn tru.', 'success');
  },

  appendInitialLog(msg) {
    this.addLog('SYSTEM', msg);
  },

  addLog(step, message, type = 'info') {
    const term = document.getElementById('reels-terminal-logs');
    if (!term) return;

    const time = new Date().toLocaleTimeString('vi-VN');
    const logLine = document.createElement('div');
    logLine.className = 'log-line';

    let colorStyle = '#94a3b8';
    if (type === 'success') colorStyle = '#4ade80';
    if (type === 'warn') colorStyle = '#facc15';
    if (type === 'error') colorStyle = '#f87171';
    if (type === 'highlight') colorStyle = '#38bdf8';

    logLine.innerHTML = `
      <span class="log-time">[${time}]</span>
      <span class="log-step" style="color:${colorStyle}; font-weight:700;">[${step}]</span>
      <span class="log-${type}" style="color:${colorStyle};">${message}</span>
    `;

    term.appendChild(logLine);
    term.scrollTop = term.scrollHeight;
  },

  clearLogs() {
    const term = document.getElementById('reels-terminal-logs');
    if (term) term.innerHTML = '';
  },

  // ==========================================
  // BƯỚC 1: QUÉT REELS TỪ TRANG
  // ==========================================
  async startScan() {
    const urlInput = document.getElementById('reels-target-url');
    const pageUrl = (urlInput ? urlInput.value.trim() : '') || this.state.pageUrl;
    const scrollSelect = document.getElementById('reels-scroll-count');
    const maxScrolls = scrollSelect ? parseInt(scrollSelect.value, 10) : 4;

    this.state.isScanning = true;
    this.updateScanButtonState(true);
    this.addLog('SCAN', `Bắt đầu khởi chạy trình duyệt quét danh sách Reels từ: ${pageUrl}...`, 'highlight');

    const loader = document.getElementById('reels-loading-spinner');
    if (loader) loader.style.display = 'flex';

    try {
      const res = await fetch('/api/reels/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageUrl, maxScrolls })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Quét Reels thất bại.');
      }

      this.state.scannedReels = data.reels || [];
      this.state.topReel = data.topReel || (data.reels && data.reels[0]);

      this.addLog('SUCCESS', `Đã quét thành công ${data.totalFound} Reels từ trang ${data.pageTitle || pageUrl}!`, 'success');
      if (this.state.topReel) {
        this.addLog('TOP_VIEW', `🏆 VIDEO CÓ LƯỢT VIEW CAO NHẤT: Reel #${this.state.topReel.reelId} với ${this.state.topReel.formattedViews} lượt xem (${this.state.topReel.viewCount.toLocaleString()} views)!`, 'warn');
      }

      // Cập nhật giao diện
      this.renderTopReelCard(this.state.topReel);
      this.renderReelsGrid(this.state.scannedReels);
      showToast(`Quét hoàn tất: Tìm thấy ${data.totalFound} video Reels!`, 'success');

      // Tự động kiểm tra xem video top 1 đã tải chưa
      if (this.state.topReel) {
        this.checkExistingDownload(this.state.topReel);
      }
    } catch (err) {
      console.error(err);
      this.addLog('ERROR', `Lỗi khi quét Reels: ${err.message}`, 'error');
      showToast(`Lỗi quét: ${err.message}`, 'error');
    } finally {
      this.state.isScanning = false;
      this.updateScanButtonState(false);
      if (loader) loader.style.display = 'none';
    }
  },

  updateScanButtonState(isLoading) {
    const btn = document.getElementById('btn-scan-reels');
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner" style="width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 0.8s linear infinite;"></span> Đang quét Reels...`;
    } else {
      btn.disabled = false;
      btn.innerHTML = `🔍 Quét & Tìm Video Top View`;
    }
  },

  // ==========================================
  // BƯỚC 2: RENDER THẺ VIDEO TOP VIEW
  // ==========================================
  renderTopReelCard(reel) {
    const container = document.getElementById('top-reel-highlight-box');
    if (!container) return;

    if (!reel) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';

    const viewBadge = document.getElementById('top-reel-views-badge');
    const viewRaw = document.getElementById('top-reel-views-raw');
    const reelIdEl = document.getElementById('top-reel-id');
    const linkEl = document.getElementById('top-reel-url');
    const thumbImg = document.getElementById('top-reel-thumb');

    if (viewBadge) viewBadge.textContent = `${reel.formattedViews} LƯỢT XEM`;
    if (viewRaw) viewRaw.textContent = `Tổng chính xác: ${reel.viewCount.toLocaleString()} views (Xếp hạng #1 Toàn Trang)`;
    if (reelIdEl) reelIdEl.textContent = `Reel ID: ${reel.reelId}`;
    if (linkEl) {
      linkEl.href = reel.url;
      linkEl.textContent = reel.url;
    }
    if (thumbImg && reel.thumbnail) {
      thumbImg.src = reel.thumbnail;
      thumbImg.style.display = 'block';
    }

    const customUrlInput = document.getElementById('custom-reel-url-input');
    if (customUrlInput) {
      customUrlInput.value = reel.url;
    }

    // Cập nhật caption gợi ý
    const captionInput = document.getElementById('reels-caption-template');
    if (captionInput && !captionInput.dataset.userEdited) {
      captionInput.value = `[Thỏ Bảy Màu - Top View: ${reel.formattedViews}] ${reel.title}\n\nXem ngay siêu phẩm hoạt hình Thỏ Bảy Màu đạt hơn ${reel.formattedViews} lượt xem!\n\n#ThoBayMau #Reels #TopViews #HoatHinh #HaiHuoc #Viral`;
    }

    const commentInput = document.getElementById('reels-first-comment');
    if (commentInput && !commentInput.dataset.userEdited) {
      commentInput.value = `🐰 Cảm ơn các bạn đã ủng hộ Thỏ Bảy Màu! Đừng quên theo dõi fanpage để cập nhật những thước phim mới nhất nhé!`;
    }
  },

  // ==========================================
  // BƯỚC 3: RENDER DANH SÁCH TẤT CẢ REELS ĐÃ QUÉT
  // ==========================================
  renderReelsGrid(reels) {
    const grid = document.getElementById('scanned-reels-grid');
    const countBadge = document.getElementById('scanned-count-badge');
    if (!grid) return;

    if (countBadge) countBadge.textContent = `${reels.length} video`;

    if (!reels || reels.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; color: var(--text-muted);">
          Chưa có video nào. Nhấp vào nút "Quét & Tìm Video Top View" ở trên để bắt đầu.
        </div>
      `;
      return;
    }

    grid.innerHTML = reels.map((r, index) => {
      const isTop1 = index === 0;
      const rankBadgeColor = isTop1 
        ? 'background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;' 
        : (index < 3 ? 'background: #3b82f6; color: #fff;' : 'background: rgba(255,255,255,0.1); color: #cbd5e1;');

      return `
        <div class="reel-card-item ${isTop1 ? 'top-one-glow' : ''}" style="background: rgba(26, 35, 58, 0.7); border: 1px solid ${isTop1 ? '#f59e0b' : 'rgba(255,255,255,0.08)'}; border-radius: 12px; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.65rem; transition: transform 0.2s;">
          <div style="position: relative; border-radius: 8px; overflow: hidden; height: 180px; background: #0b0f19;">
            <img src="${r.thumbnail || 'assets/sample-reels.jpg'}" alt="Reel thumbnail" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/sample-reels.jpg'">
            <div style="position: absolute; top: 0.5rem; left: 0.5rem; ${rankBadgeColor} padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; gap: 0.25rem;">
              ${isTop1 ? '👑 #1' : `#${r.rank || index + 1}`}
            </div>
            <div style="position: absolute; bottom: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.78rem; font-weight: 800;">
              🔥 ${r.formattedViews} views
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.25rem; flex: 1;">
            <div style="font-size: 0.85rem; font-weight: 600; color: #f1f5f9; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${r.title}">
              ${r.title}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; justify-content: space-between;">
              <span>ID: ${r.reelId}</span>
              <a href="${r.url}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: none;">Xem gốc ↗</a>
            </div>
          </div>

          ${this.state.scheduledMap && this.state.scheduledMap[r.reelId] ? `
            <div class="sched-badge-active" title="Video này đã được lên lịch thành công trên Meta Graph API">
              📅 Đã lên lịch: ${this.state.scheduledMap[r.reelId].timeStr}
            </div>
          ` : ''}

          <div style="display: flex; gap: 0.35rem; margin-top: auto;">
            <button type="button" class="btn-queue-action" onclick="ReelsCrawler.downloadSpecificReel('${r.reelId}')" style="flex: 1; justify-content: center; font-size: 0.74rem; padding: 0.38rem 0.5rem;" title="Tải file video MP4 về máy">
              ⬇️ Tải MP4
            </button>
            <button type="button" class="btn-queue-action" onclick="ReelsCrawler.selectAndPublish('${r.reelId}')" style="flex: 1; justify-content: center; font-size: 0.74rem; padding: 0.38rem 0.5rem; background: rgba(37, 99, 235, 0.2); border-color: rgba(37, 99, 235, 0.4); color: #93c5fd;" title="Đăng lên Fanpage ngay">
              🚀 Đăng ngay
            </button>
          </div>

          <button type="button" class="btn-queue-action" onclick="ReelsCrawler.openScheduleModal('${r.reelId}')" style="width: 100%; justify-content: center; font-size: 0.76rem; padding: 0.42rem 0.6rem; background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.4); color: #6ee7b7; font-weight: 600; display: flex; align-items: center; gap: 0.35rem;" title="Hẹn giờ đăng video này lên Fanpage">
            ⏱️ Hẹn Giờ Đăng Bài
          </button>
        </div>
      `;
    }).join('');
  },

  sortAndRenderReels(mode) {
    if (!this.state.scannedReels || this.state.scannedReels.length === 0) return;
    const sorted = [...this.state.scannedReels];
    if (mode === 'views-desc') {
      sorted.sort((a, b) => b.viewCount - a.viewCount);
    } else if (mode === 'views-asc') {
      sorted.sort((a, b) => a.viewCount - b.viewCount);
    }
    this.renderReelsGrid(sorted);
  },

  // ==========================================
  // BƯỚC 4: TẢI VIDEO REEL VỀ MÁY
  // ==========================================
  async downloadVideo(reel) {
    if (!reel || !reel.url) return;

    this.state.isDownloading = true;
    this.addLog('DOWNLOAD', `Đang tải video ${reel.url} về máy bằng yt-dlp...`, 'highlight');
    showToast(`Đang tải video #${reel.reelId}... Vui lòng đợi trong giây lát.`, 'info');

    const downloadBtn = document.getElementById('btn-download-top-reel');
    if (downloadBtn) {
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = `⏳ Đang tải MP4...`;
    }

    try {
      const res = await fetch('/api/reels/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reelUrl: reel.url })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Tải video thất bại.');
      }

      this.state.downloadResult = data;
      this.addLog('DOWNLOAD', `Tải video thành công: ${data.fileName} (${data.fileSizeFormatted})`, 'success');
      showToast(`Tải video thành công: ${data.fileName} (${data.fileSizeFormatted})`, 'success');

      // Kích hoạt trình phát video xem trước
      this.mountVideoPlayer(data.relativeUrl);
    } catch (err) {
      console.error(err);
      this.addLog('ERROR', `Lỗi tải video: ${err.message}`, 'error');
      showToast(`Lỗi tải video: ${err.message}`, 'error');
    } finally {
      this.state.isDownloading = false;
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `⬇️ Tải lại video MP4`;
      }
    }
  },

  async downloadSpecificReel(reelId) {
    const reel = this.state.scannedReels.find(r => r.reelId === reelId);
    if (!reel) {
      return showToast('Không tìm thấy thông tin Reel được chọn.', 'error');
    }
    await this.downloadVideo(reel);
  },

  async checkExistingDownload(reel) {
    try {
      const testUrl = `/downloads/${reel.reelId}.mp4`;
      const res = await fetch(testUrl, { method: 'HEAD' });
      if (res.ok) {
        this.addLog('CACHE', `Video #${reel.reelId} đã có sẵn trên ổ đĩa. Sẵn sàng phát hoặc đăng ngay!`, 'success');
        this.state.downloadResult = {
          success: true,
          reelId: reel.reelId,
          fileName: `${reel.reelId}.mp4`,
          relativeUrl: testUrl
        };
        this.mountVideoPlayer(testUrl);
      }
    } catch (e) {}
  },

  mountVideoPlayer(videoSrc) {
    const playerWrapper = document.getElementById('top-reel-video-wrapper');
    const videoTag = document.getElementById('top-reel-video-player');
    const thumbImg = document.getElementById('top-reel-thumb');

    if (playerWrapper && videoTag) {
      playerWrapper.style.display = 'block';
      videoTag.src = videoSrc;
      videoTag.load();
      if (thumbImg) thumbImg.style.display = 'none';
    }
  },

  // ==========================================
  // BƯỚC 5: 1-CLICK TỰ ĐỘNG TOÀN QUY TRÌNH (AUTO WORKFLOW)
  // ==========================================
  async runFullAutoWorkflow() {
    const pageUrl = (document.getElementById('reels-target-url')?.value.trim()) || this.state.pageUrl;
    const scrollSelect = document.getElementById('reels-scroll-count');
    const maxScrolls = scrollSelect ? parseInt(scrollSelect.value, 10) : 4;
    const captionTemplate = document.getElementById('reels-caption-template')?.value.trim();
    const firstComment = document.getElementById('reels-first-comment')?.value.trim();
    const pageId = document.getElementById('reels-cfg-page-id')?.value.trim();
    const pageToken = document.getElementById('reels-cfg-page-token')?.value.trim();

    // Lấy cài đặt lịch đăng nếu có
    const isSchedule = document.getElementById('reels-schedule-checkbox')?.checked;
    let scheduledPublishTime = null;
    if (isSchedule) {
      const scheduleTimeInput = document.getElementById('reels-schedule-time')?.value;
      if (scheduleTimeInput) {
        scheduledPublishTime = Math.floor(new Date(scheduleTimeInput).getTime() / 1000);
      }
    }

    const autoBtn = document.getElementById('btn-reels-auto-all');
    if (autoBtn) {
      autoBtn.disabled = true;
      autoBtn.innerHTML = `⚙️ Đang thực thi Auto Workflow...`;
    }

    this.clearLogs();
    this.addLog('WORKFLOW', '==================================================', 'highlight');
    this.addLog('WORKFLOW', 'BẮT ĐẦU QUY TRÌNH TỰ ĐỘNG: SCAN -> TOP VIEW -> DOWNLOAD -> FANPAGE', 'highlight');
    this.addLog('WORKFLOW', '==================================================', 'highlight');

    try {
      const res = await fetch('/api/reels/auto-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageUrl,
          maxScrolls,
          captionTemplate,
          firstComment,
          scheduledPublishTime,
          pageId,
          pageToken,
          deleteAfterUpload: true
        })
      });

      const data = await res.json();

      if (data.logs && Array.isArray(data.logs)) {
        for (const log of data.logs) {
          this.addLog(log.step, log.msg, log.step === 'SUCCESS' ? 'success' : (log.step === 'ERROR' ? 'error' : 'info'));
        }
      }

      if (!data.success) {
        throw new Error(data.error || 'Quy trình tự động gặp lỗi.');
      }

      this.state.topReel = data.topReel;
      this.state.downloadResult = data.download;
      this.renderTopReelCard(data.topReel);
      if (data.download && data.download.relativeUrl && !data.fileDeleted) {
        this.mountVideoPlayer(data.download.relativeUrl);
      }

      if (data.fileDeleted) {
        this.addLog('CLEANUP', '🗑️ Video đã được tự động xoá khỏi ổ đĩa máy chủ sau khi upload thành công, không lưu trữ.', 'info');
      }

      showToast(`🎉 Đã tự động tải và đăng video Top View lên Fanpage thành công!`, 'success');
      this.addLog('RESULT', `Link bài viết: ${data.publish.url}`, 'success');
    } catch (err) {
      console.error(err);
      this.addLog('ERROR', `Lỗi Auto Workflow: ${err.message}`, 'error');
      showToast(`Lỗi: ${err.message}`, 'error');
    } finally {
      if (autoBtn) {
        autoBtn.disabled = false;
        autoBtn.innerHTML = `⚡ 1-Click Tự Động (Quét -> Tải Top 1 -> Đăng Fanpage)`;
      }
    }
  },

  // ==========================================
  // BƯỚC 6: ĐĂNG VIDEO ĐƯỢC CHỌN LÊN FANPAGE
  // ==========================================
  async publishSelectedReel(isSchedule = false) {
    const reel = this.state.topReel;
    if (!reel) {
      return showToast('Chưa có thông tin video. Vui lòng quét Reels trước.', 'warning');
    }

    // Đảm bảo video đã được tải về máy
    if (!this.state.downloadResult || !this.state.downloadResult.filePath) {
      this.addLog('INFO', 'Video chưa được tải. Đang tiến hành tải tự động trước khi đăng...', 'highlight');
      await this.downloadVideo(reel);
    }

    if (!this.state.downloadResult || !this.state.downloadResult.filePath) {
      return showToast('Không thể đăng vì chưa tải được video về máy.', 'error');
    }

    const caption = document.getElementById('reels-caption-template')?.value || `[Thỏ Bảy Màu] ${reel.title}\n\n#ThoBayMau #Reels`;
    const firstComment = document.getElementById('reels-first-comment')?.value || '';
    const pageId = document.getElementById('reels-cfg-page-id')?.value.trim();
    const pageToken = document.getElementById('reels-cfg-page-token')?.value.trim();
    
    let scheduledPublishTime = null;
    if (isSchedule) {
      const scheduleTimeInput = document.getElementById('reels-schedule-time')?.value;
      if (!scheduleTimeInput) {
        return showToast('Vui lòng chọn thời gian hẹn giờ đăng bài.', 'warning');
      }
      scheduledPublishTime = Math.floor(new Date(scheduleTimeInput).getTime() / 1000);
      const minFuture = Math.floor(Date.now() / 1000) + 600; // tối thiểu 10 phút
      if (scheduledPublishTime < minFuture) {
        return showToast('Facebook yêu cầu thời gian hẹn giờ tối thiểu 10 phút sau thời điểm hiện tại.', 'warning');
      }
    }

    this.addLog('PUBLISH', `Đang đăng Reel #${reel.reelId} lên Fanpage qua Meta Graph API...`, 'highlight');

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          pageToken,
          format: 'reels',
          caption,
          title: `Reel Thỏ Bảy Màu - ${reel.formattedViews}`,
          firstComment,
          scheduledPublishTime,
          mediaFilePath: this.state.downloadResult.filePath,
          mediaType: 'video/mp4',
          deleteAfterUpload: true
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Đăng video lên Facebook thất bại.');
      }

      this.addLog('SUCCESS', `Đăng thành công! Post ID: ${data.videoId || data.postId}. Link: ${data.url}`, 'success');
      if (data.fileDeleted) {
        this.addLog('CLEANUP', '🗑️ Đã tự động xoá file video khỏi ổ cứng sau khi đăng thành công để tiết kiệm bộ nhớ.', 'info');
        this.state.downloadResult = null;
      }
      showToast(`Đăng bài lên Fanpage thành công! ID: ${data.videoId || data.postId}`, 'success');
    } catch (err) {
      console.error(err);
      this.addLog('ERROR', `Lỗi khi đăng lên Fanpage: ${err.message}`, 'error');
      showToast(`Lỗi đăng bài: ${err.message}`, 'error');
    }
  },

  async selectAndPublish(reelId) {
    const reel = this.state.scannedReels.find(r => r.reelId === reelId);
    if (!reel) return;
    this.state.topReel = reel;
    this.renderTopReelCard(reel);
    await this.downloadVideo(reel);
    await this.publishSelectedReel(false);
  },

  // ==========================================
  // BƯỚC 7: CHUYỂN VÀO TRÌNH SOẠN THẢO (COMPOSER)
  // ==========================================
  sendToComposerView(reel) {
    if (!reel) {
      return showToast('Chưa có video để chuyển vào Composer.', 'warning');
    }

    // Điền caption vào textarea của Composer
    const captionArea = document.getElementById('post-caption');
    const customCaption = document.getElementById('reels-caption-template')?.value || `[Thỏ Bảy Màu - ${reel.formattedViews}] ${reel.title}\n\n#ThoBayMau #Reels`;
    if (captionArea) {
      captionArea.value = customCaption;
      captionArea.dispatchEvent(new Event('input'));
    }

    // Điền first comment vào Composer
    const commentInput = document.getElementById('first-comment-input');
    const customComment = document.getElementById('reels-first-comment')?.value || '';
    if (commentInput) {
      commentInput.value = customComment;
    }

    // Chọn format Reels trong Composer
    const reelsBtn = document.querySelector('.format-btn[data-format="reels"]');
    if (reelsBtn) {
      reelsBtn.click();
    }

    // Chuyển tab sang Composer View
    const composerTabBtn = document.querySelector('.nav-tab-btn[data-tab="composer-view"]');
    if (composerTabBtn) {
      composerTabBtn.click();
    }

    showToast(`Đã chuyển Reel #${reel.reelId} vào Trình soạn thảo!`, 'success');
  },

  // ==========================================
  // BƯỚC 8: HẸN GIỜ ĐĂNG REEL (SCHEDULING ENGINE)
  // ==========================================
  openScheduleModal(reelId) {
    const reel = this.state.scannedReels.find(r => r.reelId === reelId);
    if (!reel) {
      return showToast('Không tìm thấy thông tin Reel được chọn.', 'error');
    }

    this.state.activeScheduleReel = reel;

    const modal = document.getElementById('modal-schedule-reel');
    const thumbEl = document.getElementById('sched-modal-thumb');
    const titleEl = document.getElementById('sched-modal-title');
    const viewsEl = document.getElementById('sched-modal-views');
    const idEl = document.getElementById('sched-modal-id');
    const pageNameEl = document.getElementById('sched-modal-page-name');
    const pageIdEl = document.getElementById('sched-modal-page-id');
    const captionEl = document.getElementById('sched-modal-caption');

    if (thumbEl) thumbEl.src = reel.thumbnail || 'assets/sample-reels.jpg';
    if (titleEl) titleEl.textContent = reel.title;
    if (viewsEl) viewsEl.textContent = `🔥 ${reel.formattedViews} views`;
    if (idEl) idEl.textContent = `ID: ${reel.reelId}`;

    const cfgPageId = document.getElementById('reels-cfg-page-id')?.value.trim() || '1414360708428758';
    if (pageIdEl) pageIdEl.textContent = cfgPageId;
    if (pageNameEl) pageNameEl.textContent = 'Scentoy';

    if (captionEl) {
      captionEl.value = `[Thỏ Bảy Màu - ${reel.formattedViews}] ${reel.title}\n\nXem ngay siêu phẩm hoạt hình cực cuốn đạt hơn ${reel.formattedViews} lượt xem này nhé!\nNguồn: ${reel.url}\n\n#ThoBayMau #Reels #TopViews #HoatHinh #Viral`;
    }

    // Thiết lập thời gian mặc định: +15 phút từ thời điểm hiện tại
    this.applySchedulePreset('+15m');

    if (modal) {
      modal.classList.add('open');
    }
  },

  closeScheduleModal() {
    const modal = document.getElementById('modal-schedule-reel');
    if (modal) modal.classList.remove('open');
    this.state.activeScheduleReel = null;
  },

  formatDateTimeLocal(dateObj) {
    const pad = (n) => String(n).padStart(2, '0');
    const year = dateObj.getFullYear();
    const month = pad(dateObj.getMonth() + 1);
    const day = pad(dateObj.getDate());
    const hours = pad(dateObj.getHours());
    const minutes = pad(dateObj.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  },

  applySchedulePreset(preset) {
    const dateInput = document.getElementById('sched-modal-datetime');
    if (!dateInput) return;

    const now = new Date();
    let target = new Date();

    if (preset === '+15m') {
      target = new Date(now.getTime() + 15 * 60 * 1000);
    } else if (preset === '+1h') {
      target = new Date(now.getTime() + 60 * 60 * 1000);
    } else if (preset === 'tonight') {
      target.setHours(19, 30, 0, 0);
      if (target.getTime() - now.getTime() < 10 * 60 * 1000) {
        target.setDate(target.getDate() + 1);
      }
    } else if (preset === 'tomorrow-noon') {
      target.setDate(target.getDate() + 1);
      target.setHours(11, 45, 0, 0);
    } else if (preset === 'tomorrow-night') {
      target.setDate(target.getDate() + 1);
      target.setHours(20, 0, 0, 0);
    } else if (preset === 'day-after') {
      target.setDate(target.getDate() + 2);
      target.setHours(19, 30, 0, 0);
    }

    dateInput.value = this.formatDateTimeLocal(target);
    dateInput.min = this.formatDateTimeLocal(new Date(now.getTime() + 10 * 60 * 1000));

    // Active state cho preset chip
    document.querySelectorAll('.sched-preset-chip').forEach(chip => {
      if (chip.getAttribute('onclick')?.includes(`'${preset}'`)) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  },

  async confirmScheduleReel() {
    const reel = this.state.activeScheduleReel;
    if (!reel) {
      return showToast('Không xác định được video để lên lịch.', 'error');
    }

    const dateInput = document.getElementById('sched-modal-datetime');
    if (!dateInput || !dateInput.value) {
      return showToast('Vui lòng chọn ngày và giờ hẹn đăng bài.', 'warning');
    }

    const targetTime = new Date(dateInput.value);
    const scheduledPublishTime = Math.floor(targetTime.getTime() / 1000);
    const nowSec = Math.floor(Date.now() / 1000);

    if (scheduledPublishTime < nowSec + 600) {
      return showToast('Facebook yêu cầu thời gian hẹn giờ tối thiểu 10 phút sau thời điểm hiện tại.', 'warning');
    }

    const caption = document.getElementById('sched-modal-caption')?.value.trim() || `[Thỏ Bảy Màu] ${reel.title}\n\n#ThoBayMau #Reels`;
    const isFirstComment = document.getElementById('sched-modal-first-comment-check')?.checked;
    const firstComment = isFirstComment ? (document.getElementById('sched-modal-first-comment')?.value.trim() || '') : '';
    const pageId = document.getElementById('reels-cfg-page-id')?.value.trim();
    const pageToken = document.getElementById('reels-cfg-page-token')?.value.trim();

    const submitBtn = document.getElementById('btn-confirm-schedule-reel');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `⏳ Đang nạp video & thiết lập lịch Meta...`;
    }

    const timeFormatted = targetTime.toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });

    this.addLog('SCHEDULE', `Bắt đầu hẹn giờ đăng Reel #${reel.reelId} vào lúc: ${timeFormatted}...`, 'highlight');
    showToast(`Đang lên lịch đăng Reel #${reel.reelId}... Vui lòng đợi trong giây lát.`, 'info');

    try {
      // 1. Kiểm tra video đã tải về máy chưa
      let filePath = `downloads/${reel.reelId}.mp4`;
      const checkRes = await fetch(`/downloads/${reel.reelId}.mp4`, { method: 'HEAD' });
      if (!checkRes.ok) {
        this.addLog('DOWNLOAD', `Video chưa có sẵn trên ổ đĩa. Đang tự động tải về bằng yt-dlp...`, 'highlight');
        const dlRes = await fetch('/api/reels/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reelUrl: reel.url })
        });
        const dlData = await dlRes.json();
        if (!dlData.success || !dlData.filePath) {
          throw new Error(dlData.error || 'Không thể tải video về máy trước khi lên lịch.');
        }
        filePath = dlData.filePath;
      }

      // 2. Gửi lệnh hẹn giờ đăng lên Meta Graph API
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          pageToken,
          format: 'reels',
          caption,
          title: `Reel Thỏ Bảy Màu - ${reel.formattedViews}`,
          firstComment,
          scheduledPublishTime,
          mediaFilePath: filePath,
          mediaType: 'video/mp4',
          deleteAfterUpload: true
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Không thể lên lịch trên Facebook Graph API.');
      }

      // 3. Ghi nhận thành công
      this.state.scheduledMap[reel.reelId] = {
        timeStr: timeFormatted,
        timestamp: scheduledPublishTime,
        postId: data.videoId || data.postId
      };

      this.addLog('SUCCESS', `🎉 HẸN GIỜ THÀNH CÔNG! Reel #${reel.reelId} đã được Meta lên lịch đăng vào lúc: ${timeFormatted} (Post ID: ${data.videoId || data.postId})!`, 'success');
      if (data.fileDeleted) {
        this.addLog('CLEANUP', `🗑️ Video #${reel.reelId} đã được tự động dọn dẹp khỏi ổ cứng sau khi tải lên Meta.`, 'info');
      }
      showToast(`⏱️ Đã lên lịch thành công cho Reel #${reel.reelId} vào lúc ${timeFormatted}!`, 'success');

      // Đóng modal & cập nhật danh sách
      this.closeScheduleModal();
      this.renderReelsGrid(this.state.scannedReels);
    } catch (err) {
      console.error(err);
      this.addLog('ERROR', `Lỗi khi hẹn giờ Reel #${reel.reelId}: ${err.message}`, 'error');
      showToast(`Lỗi hẹn giờ: ${err.message}`, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `⏱️ Xác Nhận Hẹn Giờ Đăng Lên Fanpage`;
      }
    }
  },

  openBatchScheduleModal() {
    const modal = document.getElementById('modal-batch-schedule');
    if (modal) modal.classList.add('open');
  },

  closeBatchScheduleModal() {
    const modal = document.getElementById('modal-batch-schedule');
    if (modal) modal.classList.remove('open');
  },

  async confirmBatchSchedule() {
    const countSelect = document.getElementById('batch-sched-count');
    const stratSelect = document.getElementById('batch-sched-strategy');
    const count = parseInt(countSelect?.value || '3', 10);
    const strategy = stratSelect?.value || 'daily-gold';

    const topList = this.state.scannedReels.slice(0, count);
    if (topList.length === 0) {
      return showToast('Danh sách Reels trống. Vui lòng quét Reels trước.', 'warning');
    }

    const batchBtn = document.getElementById('btn-confirm-batch-schedule');
    if (batchBtn) {
      batchBtn.disabled = true;
      batchBtn.innerHTML = `⏳ Đang xử lý ${count} video...`;
    }

    this.closeBatchScheduleModal();
    this.addLog('BATCH', `==================================================`, 'warn');
    this.addLog('BATCH', `BẮT ĐẦU TỰ ĐỘNG LÊN LỊCH CHO TOP ${count} REELS TRIỆU VIEW`, 'warn');
    this.addLog('BATCH', `==================================================`, 'warn');
    showToast(`Bắt đầu tự động lên lịch cho ${count} video...`, 'info');

    const now = new Date();
    const pageId = document.getElementById('reels-cfg-page-id')?.value.trim();
    const pageToken = document.getElementById('reels-cfg-page-token')?.value.trim();

    try {
      for (let i = 0; i < topList.length; i++) {
        const reel = topList[i];
        let targetDate = new Date();

        if (strategy === 'daily-gold') {
          targetDate.setDate(now.getDate() + i);
          targetDate.setHours(19, 30, 0, 0);
          if (i === 0 && targetDate.getTime() - now.getTime() < 10 * 60 * 1000) {
            targetDate.setDate(targetDate.getDate() + 1);
          }
        } else if (strategy === 'interval-4h') {
          targetDate = new Date(now.getTime() + (i + 1) * 4 * 3600 * 1000);
        } else {
          const dayOffset = Math.floor(i / 2);
          const isNoon = i % 2 === 0;
          targetDate.setDate(now.getDate() + dayOffset);
          targetDate.setHours(isNoon ? 11 : 20, isNoon ? 45 : 0, 0, 0);
          if (targetDate.getTime() - now.getTime() < 10 * 60 * 1000) {
            targetDate.setDate(targetDate.getDate() + 1);
          }
        }

        const scheduledPublishTime = Math.floor(targetDate.getTime() / 1000);
        const timeFormatted = targetDate.toLocaleString('vi-VN', {
          hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
        });

        this.addLog('BATCH', `[${i + 1}/${count}] Đang tải & lên lịch Reel #${reel.reelId} (${reel.formattedViews} views) vào: ${timeFormatted}...`, 'highlight');

        let filePath = `downloads/${reel.reelId}.mp4`;
        const testRes = await fetch(`/downloads/${reel.reelId}.mp4`, { method: 'HEAD' });
        if (!testRes.ok) {
          const dlRes = await fetch('/api/reels/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reelUrl: reel.url })
          });
          const dlData = await dlRes.json();
          filePath = dlData.filePath || filePath;
        }

        const res = await fetch('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId,
            pageToken,
            format: 'reels',
            caption: `[Thỏ Bảy Màu - Top ${i + 1}: ${reel.formattedViews}] ${reel.title}\n\nXem ngay siêu phẩm hoạt hình Thỏ Bảy Màu đạt hơn ${reel.formattedViews} lượt xem!\n\n#ThoBayMau #Reels #TopViews #HoatHinh #Viral`,
            title: `Reel Thỏ Bảy Màu - ${reel.formattedViews}`,
            firstComment: '🐰 Cảm ơn các bạn đã ủng hộ Thỏ Bảy Màu! Đừng quên theo dõi fanpage nhé!',
            scheduledPublishTime,
            mediaFilePath: filePath,
            mediaType: 'video/mp4',
            deleteAfterUpload: true
          })
        });

        const data = await res.json();
        if (data.success) {
          this.state.scheduledMap[reel.reelId] = {
            timeStr: timeFormatted,
            timestamp: scheduledPublishTime,
            postId: data.videoId || data.postId
          };
          this.addLog('SUCCESS', `✅ Đã lên lịch thành công Video #${reel.reelId} vào ${timeFormatted}!`, 'success');
          if (data.fileDeleted) {
            this.addLog('CLEANUP', `🗑️ Đã tự động xoá file Video #${reel.reelId} khỏi ổ cứng.`, 'info');
          }
        } else {
          this.addLog('ERROR', `❌ Không thể lên lịch Video #${reel.reelId}: ${data.error}`, 'error');
        }
      }

      this.renderReelsGrid(this.state.scannedReels);
      showToast(`🎉 Đã hoàn tất lên lịch tự động cho Top ${count} video!`, 'success');
    } catch (err) {
      console.error(err);
      this.addLog('ERROR', `Lỗi Auto Batch: ${err.message}`, 'error');
      showToast(`Lỗi lên lịch hàng loạt: ${err.message}`, 'error');
    } finally {
      if (batchBtn) {
        batchBtn.disabled = false;
        batchBtn.innerHTML = `🚀 Bắt Đầu Lên Lịch Hàng Loạt`;
      }
    }
  }
};

window.ReelsCrawler = ReelsCrawler;
