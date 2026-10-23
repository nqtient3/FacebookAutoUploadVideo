/**
 * FB AutoPost Studio - Workflow Engine Bridge
 * Quản lý kết nối Graph API Backend, Xác thực Page Token,
 * Lên lịch đăng bài thật và Chạy mô phỏng (Simulation).
 */

const WorkflowBridge = {
  currentConfig: {
    apiVersion: 'v19.0',
    pageId: '',
    pageToken: '',
    hasToken: false,
    pageInfo: null
  },

  async init() {
    this.bindEvents();
    await this.fetchServerConfig();
    this.updateJsonPreview();
  },

  bindEvents() {
    // 1. Sao chép JSON
    const copyBtn = document.getElementById('btn-copy-json');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        this.copyJsonToClipboard();
      });
    }

    // 2. Chạy mô phỏng (Simulation)
    const runSimBtn = document.getElementById('btn-run-simulation');
    if (runSimBtn) {
      runSimBtn.addEventListener('click', () => {
        this.runSimulation();
      });
    }

    // 3. Xóa log terminal
    const clearLogsBtn = document.getElementById('btn-clear-logs');
    if (clearLogsBtn) {
      clearLogsBtn.addEventListener('click', () => {
        const term = document.getElementById('terminal-logs');
        if (term) term.innerHTML = '';
      });
    }

    // 4. Lưu cấu hình vào .env
    const saveConfigBtn = document.getElementById('btn-save-config');
    if (saveConfigBtn) {
      saveConfigBtn.addEventListener('click', () => {
        this.saveConfigToServer();
      });
    }

    // 5. Kiểm tra kết nối Fanpage (Live Verify)
    const verifyBtn = document.getElementById('btn-verify-token');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', () => {
        this.verifyToken();
      });
    }

    // 6. Thực thi đăng thật lên Fanpage (Live Graph API)
    const runLiveBtn = document.getElementById('btn-run-live');
    if (runLiveBtn) {
      runLiveBtn.addEventListener('click', () => {
        this.runLivePublish();
      });
    }

    // 7. Toggle xem/ẩn token
    const toggleEye = document.getElementById('btn-toggle-token-visibility');
    const tokenInput = document.getElementById('page-token-input');
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

    // 8. Tự động cập nhật JSON preview khi người dùng nhập ID/Token
    const pageIdInput = document.getElementById('page-id-input');
    if (pageIdInput) {
      pageIdInput.addEventListener('input', () => {
        this.currentConfig.pageId = pageIdInput.value.trim();
        this.updateJsonPreview();
      });
    }
  },

  // Đọc cấu hình hiện tại từ backend (.env)
  async fetchServerConfig() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.success && data.config) {
        this.currentConfig.pageId = data.config.pageId || '';
        this.currentConfig.apiVersion = data.config.apiVersion || 'v19.0';
        this.currentConfig.hasToken = data.config.hasToken || false;

        const pageIdInput = document.getElementById('page-id-input');
        const apiVerInput = document.getElementById('api-version-input');
        const tokenInput = document.getElementById('page-token-input');

        if (pageIdInput && this.currentConfig.pageId) pageIdInput.value = this.currentConfig.pageId;
        if (apiVerInput && this.currentConfig.apiVersion) apiVerInput.value = this.currentConfig.apiVersion;
        if (tokenInput && data.config.hasToken) {
          tokenInput.placeholder = `Đã lưu token (${data.config.maskedToken}). Để nguyên hoặc nhập mã mới để thay thế.`;
        }

        if (this.currentConfig.pageId && this.currentConfig.hasToken) {
          this.appendLog('CONFIG', `Đã tải cấu hình: Page ID ${this.currentConfig.pageId}, Token đã cài đặt.`, 'info');
          // Tự động kiểm tra tính hợp lệ
          this.verifyToken(true);
        } else {
          this.appendLog('CONFIG', 'Chưa có cấu hình Page ID hoặc Page Access Token trong .env. Vui lòng cung cấp 2 thông tin này.', 'warning');
        }
      }
    } catch (err) {
      console.warn('Lỗi đọc cấu hình từ server:', err);
    }
  },

  // Lưu cấu hình vào .env
  async saveConfigToServer() {
    const pageId = document.getElementById('page-id-input')?.value.trim();
    const pageToken = document.getElementById('page-token-input')?.value.trim();
    const apiVersion = document.getElementById('api-version-input')?.value.trim() || 'v19.0';

    if (!pageId) {
      showToast('Vui lòng nhập Page ID trước khi lưu.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, pageToken, apiVersion })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Đã lưu Page ID và Token vào file .env thành công!', 'success');
        this.appendLog('CONFIG', `Đã ghi nhận cấu hình mới vào .env: Page ID ${pageId}.`, 'success');
        this.currentConfig.pageId = pageId;
        this.currentConfig.apiVersion = apiVersion;
        if (pageToken) this.currentConfig.hasToken = true;
        this.updateJsonPreview();
        // Tự động verify ngay
        this.verifyToken();
      } else {
        showToast(`Lỗi khi lưu cấu hình: ${data.error}`, 'warning');
      }
    } catch (err) {
      showToast(`Không thể kết nối đến máy chủ: ${err.message}`, 'warning');
    }
  },

  // Kiểm tra tính hợp lệ của Page ID & Token qua Facebook Graph API
  async verifyToken(isSilent = false) {
    const pageId = document.getElementById('page-id-input')?.value.trim() || this.currentConfig.pageId;
    const pageToken = document.getElementById('page-token-input')?.value.trim();
    const apiVersion = document.getElementById('api-version-input')?.value.trim() || this.currentConfig.apiVersion;

    if (!pageId) {
      if (!isSilent) showToast('Vui lòng nhập Page ID trước khi kiểm tra.', 'warning');
      return;
    }

    this.appendLog('AUTH', `Đang kiểm tra thông tin Fanpage ID ${pageId} với Facebook Graph API ${apiVersion}...`, 'info');

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, pageToken, apiVersion })
      });
      const data = await res.json();

      if (data.success && data.page) {
        const p = data.page;
        this.currentConfig.pageInfo = p;

        // Cập nhật thẻ trạng thái kết nối
        this.updateConnectionStatusUI({
          connected: true,
          title: `Đã kết nối: ${p.name}`,
          desc: `ID: ${p.id} • ${p.followersCount.toLocaleString()} người theo dõi • Trạng thái: Hoạt động`,
          badge: 'ĐÃ XÁC THỰC',
          badgeColor: '#10b981',
          icon: '🟢'
        });

        // Cập nhật Header Navbar
        const navName = document.getElementById('nav-page-name');
        const navStatus = document.getElementById('nav-status-text');
        const navDot = document.getElementById('nav-status-dot');
        const navAvatar = document.getElementById('nav-page-avatar');
        const navVerified = document.getElementById('nav-verified-icon');

        if (navName) navName.textContent = p.name;
        if (navStatus) navStatus.textContent = `Đã kết nối • ${p.followersCount.toLocaleString()} Followers`;
        if (navDot) navDot.style.background = '#10b981';
        if (navAvatar && p.pictureUrl) navAvatar.src = p.pictureUrl;
        if (navVerified) navVerified.style.display = 'inline-block';

        this.appendLog('AUTH', `✅ XÁC THỰC THÀNH CÔNG: Fanpage "${p.name}" (Followers: ${p.followersCount}). Quyền hợp lệ!`, 'success');
        if (!isSilent) showToast(`Kết nối Fanpage "${p.name}" thành công!`, 'success');
      } else {
        const errMsg = data.error || 'Token không hợp lệ hoặc không có quyền truy cập trang.';
        this.updateConnectionStatusUI({
          connected: false,
          title: 'Kết nối Fanpage thất bại',
          desc: errMsg,
          badge: 'LỖI XÁC THỰC',
          badgeColor: '#ef4444',
          icon: '🔴'
        });
        this.appendLog('AUTH', `❌ THẤT BẠI: ${errMsg}`, 'error');
        if (!isSilent) showToast(`Lỗi xác thực: ${errMsg}`, 'warning');
      }
    } catch (err) {
      this.appendLog('AUTH', `❌ Lỗi mạng: ${err.message}`, 'error');
      if (!isSilent) showToast(`Lỗi mạng: ${err.message}`, 'warning');
    }
  },

  updateConnectionStatusUI({ connected, title, desc, badge, badgeColor, icon }) {
    const titleEl = document.getElementById('connection-status-title');
    const descEl = document.getElementById('connection-status-desc');
    const pillEl = document.getElementById('connection-status-pill');
    const iconEl = document.getElementById('status-icon-box');

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (pillEl) {
      pillEl.textContent = badge;
      pillEl.style.color = badgeColor;
      pillEl.style.borderColor = badgeColor;
    }
    if (iconEl) iconEl.textContent = icon;
  },

  buildWorkflowSchema() {
    const caption = document.getElementById('caption-input')?.value || '';
    const dateVal = document.getElementById('schedule-date')?.value || new Date().toISOString().split('T')[0];
    const timeVal = document.getElementById('schedule-time')?.value || '19:30';
    const jitterVal = parseInt(document.getElementById('anti-spam-jitter')?.value || '8');
    const firstComment = document.getElementById('first-comment-input')?.value || '';
    const isPin = document.getElementById('check-pin-post')?.checked || false;

    const { actualDate } = computeJitterTime(dateVal, timeVal, jitterVal);
    const targetUnixTimestamp = Math.floor(actualDate.getTime() / 1000);

    const pageId = document.getElementById('page-id-input')?.value.trim() || this.currentConfig.pageId || 'YOUR_PAGE_ID';
    const apiVer = document.getElementById('api-version-input')?.value.trim() || this.currentConfig.apiVersion || 'v19.0';

    return {
      workflow: {
        id: 'wf_fb_scheduled_upload_' + Date.now(),
        name: 'Facebook Fanpage Auto Video Scheduler',
        targetPageId: pageId,
        graphApiVersion: apiVer,
        trigger: {
          type: 'SCHEDULED_CRON',
          scheduledPublishTimeUnix: targetUnixTimestamp,
          scheduledPublishTimeISO: actualDate.toISOString(),
          timezone: 'Asia/Ho_Chi_Minh',
          antiSpamJitterMinutes: jitterVal
        },
        payload: {
          mediaType: PreviewManager.currentFormat === 'reels' ? 'REELS_VIDEO' : (PreviewManager.currentFormat === 'feed-video' ? 'FEED_VIDEO' : 'PHOTOS'),
          videoFilePath: './uploads/video_asset_hd.mp4',
          thumbnailPath: './uploads/thumbnail_custom.jpg',
          title: 'Siêu phẩm công nghệ 2026',
          caption: caption,
          firstComment: firstComment,
          pinToTop: isPin,
          pinDurationHours: 48
        },
        steps: [
          { name: 'validate_media_specs', description: 'Kiểm tra độ dài, codec H.264/AAC, bitrate và tỷ lệ khung hình video' },
          { name: 'verify_facebook_token', description: 'Kiểm tra tính hợp lệ của Page Access Token và quyền pages_manage_posts' },
          { name: 'chunk_upload_resumable_session', description: 'Khởi tạo session tải lên phân đoạn (Resumable Upload Chunk 4MB)' },
          { name: 'schedule_publish_timestamp', description: 'Gọi Graph API POST /{page-id}/video_reels với scheduled_publish_time' },
          { name: 'auto_post_first_comment', description: 'Đăng ký bình luận tự động ngay khi bài đăng được Facebook duyệt live' },
          { name: 'pin_post_to_feed', description: 'Ghim bài viết lên vị trí đầu trang Fanpage trong 48 giờ' }
        ]
      }
    };
  },

  updateJsonPreview() {
    const jsonArea = document.getElementById('workflow-json-preview');
    if (jsonArea) {
      const schema = this.buildWorkflowSchema();
      jsonArea.value = JSON.stringify(schema, null, 2);
    }
  },

  copyJsonToClipboard() {
    const jsonArea = document.getElementById('workflow-json-preview');
    if (jsonArea) {
      navigator.clipboard.writeText(jsonArea.value).then(() => {
        showToast('Đã sao chép Workflow JSON schema vào Clipboard!', 'success');
      }).catch(() => {
        showToast('Không thể sao chép tự động.', 'warning');
      });
    }
  },

  appendLog(step, message, type = 'info') {
    const term = document.getElementById('terminal-logs');
    if (!term) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `
      <span class="log-time">[${timeStr}]</span>
      <span class="log-step">[${step}]</span>
      <span class="log-${type}">${message}</span>
    `;

    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
  },

  // THỰC THI ĐĂNG THẬT LÊN FACEBOOK
  async runLivePublish() {
    const pageId = document.getElementById('page-id-input')?.value.trim() || this.currentConfig.pageId;
    const pageToken = document.getElementById('page-token-input')?.value.trim();
    const apiVersion = document.getElementById('api-version-input')?.value.trim() || this.currentConfig.apiVersion;

    if (!pageId) {
      showToast('Chưa có Page ID. Vui lòng nhập Page ID!', 'warning');
      this.appendLog('LIVE', 'Lỗi: Thiếu Page ID.', 'error');
      return;
    }

    const caption = document.getElementById('caption-input')?.value || 'Bài đăng tự động từ FB AutoPost Studio';
    const firstComment = document.getElementById('first-comment-input')?.value || '';
    const format = PreviewManager.currentFormat || 'status';

    const btn = document.getElementById('btn-run-live');
    if (btn) btn.disabled = true;

    showToast('Bắt đầu quy trình đăng bài thật qua Facebook Graph API...', 'info');
    this.appendLog('LIVE', `===> BẮT ĐẦU ĐĂNG BÀI THẬT LÊN PAGE ${pageId} (${format.toUpperCase()})...`, 'info');

    try {
      this.appendLog('STEP 1/3', 'Đang gửi yêu cầu đăng tải đến Facebook Graph API v19.0...', 'info');

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          pageToken,
          apiVersion,
          format,
          caption,
          title: 'FB AutoPost Live',
          firstComment,
          mediaBase64: PreviewManager.currentMediaData || null
        })
      });

      const data = await res.json();

      if (data.success) {
        const id = data.postId || data.videoId || data.photoId;
        this.appendLog('STEP 2/3', `✅ ĐĂNG THÀNH CÔNG! Facebook ID: ${id}`, 'success');
        if (firstComment) {
          this.appendLog('STEP 3/3', `✅ Đã tự động tạo First Comment: "${firstComment.substring(0, 30)}..."`, 'success');
        }
        this.appendLog('LIVE', `🎉 HOÀN TẤT! Link bài viết: ${data.url || 'https://facebook.com/' + id}`, 'success');
        showToast('Đăng bài lên Fanpage Facebook THÀNH CÔNG!', 'success');

        // Thêm vào hàng đợi & lịch ở trạng thái Published
        addScheduledPost({
          id: 'fb-' + id,
          title: caption.substring(0, 40) + '...',
          format: format,
          formatLabel: format === 'reels' ? 'Facebook Reels (9:16)' : 'Bài viết Fanpage',
          mediaUrl: PreviewManager.currentMediaSrc || 'assets/sample-reels.jpg',
          caption: caption,
          firstComment: firstComment,
          scheduledTime: new Date().toISOString(),
          jitterMinutes: 0,
          status: 'published',
          statusLabel: 'Đã đăng thành công (Live)',
          pinPost: false,
          engagementPrediction: 'Mới đăng trực tiếp'
        });
      } else {
        const err = data.error || 'Facebook từ chối yêu cầu.';
        this.appendLog('LIVE', `❌ THẤT BẠI: ${err}`, 'error');
        showToast(`Đăng bài thất bại: ${err}`, 'warning');
      }
    } catch (err) {
      this.appendLog('LIVE', `❌ Lỗi mạng: ${err.message}`, 'error');
      showToast(`Lỗi: ${err.message}`, 'warning');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  // CHẠY THỬ MÔ PHỎNG (SIMULATION)
  async runSimulation() {
    const btn = document.getElementById('btn-run-simulation');
    if (btn) btn.disabled = true;

    showToast('Bắt đầu chạy thử mô phỏng...', 'info');
    this.appendLog('ENGINE', '===> Khởi động WorkflowRunner.runWorkflow(scheduledUploadWorkflow)...', 'info');

    const steps = [
      { step: 'VALIDATE', msg: 'Kiểm tra tệp video: codec H.264, 1080x1920 (9:16), 60fps, 24.5MB... [OK]', delay: 500, type: 'success' },
      { step: 'AUTH', msg: `Mô phỏng xác thực Graph API với Page ID ${this.currentConfig.pageId || '109283746192841'}... [OK]`, delay: 600, type: 'success' },
      { step: 'UPLOAD', msg: 'Tải lên Facebook Chunk 1/6 (4MB) [25%]...', delay: 500, type: 'info' },
      { step: 'UPLOAD', msg: 'Tải lên Facebook Chunk 4/6 (16MB) [75%]...', delay: 500, type: 'info' },
      { step: 'UPLOAD', msg: 'Tải lên Facebook Chunk 6/6 (24.5MB) [100%]. Video ID: 981273918239... [OK]', delay: 500, type: 'success' },
      { step: 'SCHEDULE', msg: 'Đăng ký scheduled_publish_time (Đã áp dụng Jitter chống spam)... [OK]', delay: 600, type: 'success' },
      { step: 'FIRST_COMMENT', msg: 'Đặt hẹn giờ bình luận tự động sau khi post live... [OK]', delay: 500, type: 'success' },
      { step: 'ENGINE', msg: '🎉 WORKFLOW HOÀN TẤT THÀNH CÔNG (100% Steps Passed. Result: Success=true).', delay: 400, type: 'success' }
    ];

    for (const item of steps) {
      await new Promise(r => setTimeout(r, item.delay));
      this.appendLog(item.step, item.msg, item.type);
    }

    if (btn) btn.disabled = false;
    showToast('Mô phỏng Workflow hoàn tất thành công!', 'success');
  }
};
