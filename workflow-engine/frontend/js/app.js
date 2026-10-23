/**
 * FB AutoPost Studio - Main Application Orchestrator
 * Điều phối toàn bộ các tab, tương tác người dùng, lịch và hàng đợi
 */

// Toast notification helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div style="font-size:1.1rem;">
      ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}
    </div>
    <div style="flex:1;">${message}</div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Subsystems
  PreviewManager.init();
  WorkflowBridge.init();
  if (window.ReelsCrawler) {
    ReelsCrawler.init();
  }

  // Set default date in date-picker to today
  const dateInput = document.getElementById('schedule-date');
  const todayStr = new Date().toISOString().split('T')[0];
  if (dateInput) {
    dateInput.value = todayStr;
    dateInput.min = todayStr;
  }

  // Set default recurring dates
  const recStart = document.getElementById('recurring-start-date');
  const recEnd = document.getElementById('recurring-end-date');
  if (recStart) recStart.value = todayStr;
  if (recEnd) {
    const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
    recEnd.value = nextWeek;
  }

  // 2. Live Vietnam Clock (GMT+7)
  function updateLiveClock() {
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      clockEl.textContent = `${h}:${m}:${s}`;
    }
  }
  setInterval(updateLiveClock, 1000);
  updateLiveClock();

  // 3. Navigation Tabs
  const navTabs = document.querySelectorAll('.nav-tab-btn');
  const viewSections = document.querySelectorAll('.view-section');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetViewId = tab.dataset.tab;

      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      viewSections.forEach(sec => {
        if (sec.id === targetViewId) {
          sec.classList.add('active');
        } else {
          sec.classList.remove('active');
        }
      });

      // Render calendar if switched to calendar view
      if (targetViewId === 'calendar-view') {
        renderCalendar();
      }

      // Render queue if switched to queue view
      if (targetViewId === 'queue-view') {
        renderQueueList();
      }

      // Update Workflow JSON when switching to engine view
      if (targetViewId === 'engine-view') {
        WorkflowBridge.updateJsonPreview();
      }

      // Handle reels view switch
      if (targetViewId === 'reels-view') {
        if (window.ReelsCrawler && ReelsCrawler.checkExistingDownload) {
          ReelsCrawler.checkExistingDownload({ reelId: '609854861764157' });
        }
      }
    });
  });

  // 4. Format Switcher (Reels vs Video Feed vs Photos vs Status)
  const formatButtons = document.querySelectorAll('.format-btn');
  formatButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      formatButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const format = btn.dataset.format;
      PreviewManager.currentFormat = format;

      const formatHint = document.getElementById('format-hint');
      const mediaBadge = document.getElementById('media-type-badge');

      if (format === 'reels') {
        if (formatHint) formatHint.textContent = 'Tối ưu Reels di động 9:16 (Thu hút reach tự nhiên)';
        if (mediaBadge) mediaBadge.innerHTML = '▶ Reel • 00:45s';
        PreviewManager.updateMedia('assets/sample-reels.jpg', 'reels');
      } else if (format === 'feed-video') {
        if (formatHint) formatHint.textContent = 'Video chuẩn bản tin ngang 16:9 (Độ phân giải 1080p)';
        if (mediaBadge) mediaBadge.innerHTML = '▶ Video • 02:15m';
        PreviewManager.updateMedia('assets/sample-feed.jpg', 'feed');
      } else if (format === 'photos') {
        if (formatHint) formatHint.textContent = 'Album ảnh sắc nét chuẩn Facebook Post';
        if (mediaBadge) mediaBadge.innerHTML = '📷 4 Hình ảnh HD';
        PreviewManager.updateMedia('assets/sample-feed.jpg', 'feed');
      } else {
        if (formatHint) formatHint.textContent = 'Trạng thái văn bản với liên kết hoặc thăm dò';
        if (mediaBadge) mediaBadge.innerHTML = '📝 Bài viết liên kết';
        PreviewManager.updateMedia('assets/sample-feed.jpg', 'feed');
      }

      updateScheduleSummary();
      WorkflowBridge.updateJsonPreview();
    });
  });

  // 5. Schedule Mode Switching (One-time vs Recurring vs Smart Queue)
  const modeTabBtns = document.querySelectorAll('.mode-tab-btn');
  const modePanels = document.querySelectorAll('.mode-panel');

  modeTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;

      modePanels.forEach(panel => {
        if (panel.id === `panel-${mode}`) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });

      updateScheduleSummary();
      WorkflowBridge.updateJsonPreview();
    });
  });

  // 6. Golden Peak Hours Click
  const peakSlotCards = document.querySelectorAll('.peak-slot-card');
  peakSlotCards.forEach(card => {
    card.addEventListener('click', () => {
      peakSlotCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      const timeVal = card.dataset.time;
      const timeInput = document.getElementById('schedule-time');
      if (timeInput) timeInput.value = timeVal;

      updateScheduleSummary();
      WorkflowBridge.updateJsonPreview();
      showToast(`Đã chọn khung giờ vàng: ${timeVal} (${card.querySelector('.slot-score').textContent})`, 'info');
    });
  });

  // 7. Anti-Spam Jitter Range Slider
  const jitterSlider = document.getElementById('anti-spam-jitter');
  const jitterDisplay = document.getElementById('jitter-display');
  if (jitterSlider && jitterDisplay) {
    jitterSlider.addEventListener('input', () => {
      const val = jitterSlider.value;
      jitterDisplay.textContent = `± ${val} Phút`;
      updateScheduleSummary();
      WorkflowBridge.updateJsonPreview();
    });
  }

  // 8. Recurring Days Selector
  const dayButtons = document.querySelectorAll('.day-btn');
  dayButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      WorkflowBridge.updateJsonPreview();
    });
  });

  // 9. AI Hook Generator
  const aiHookBtn = document.getElementById('btn-ai-hook');
  if (aiHookBtn) {
    aiHookBtn.addEventListener('click', () => {
      const hooks = [
        '🔥 KHÔNG THỂ TIN ĐƯỢC! Đây là công nghệ sẽ định hình tương lai trong 5 năm tới. Cùng khám phá ngay bên dưới 👇',
        '⚡ 3 Lý do bạn KHÔNG NÊN bỏ qua thiết bị này nếu đang làm sáng tạo nội dung! Xem hết để bất ngờ 🚀',
        '😱 TẬN MẮT CHỨNG KIẾN: Siêu phẩm công nghệ này đã phá vỡ mọi quy chuẩn trước đây như thế nào? Thảo luận ngay!',
        '💡 Bạn có biết: Công nghệ lượng tử này giúp tăng 300% hiệu suất làm việc mỗi ngày? Hãy cho chúng tôi biết ý kiến của bạn!'
      ];
      const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
      const captionInput = document.getElementById('caption-input');
      if (captionInput) {
        captionInput.value = randomHook + '\n\n#congnghe #review #trending #viral';
        PreviewManager.updateCaption(captionInput.value);
        WorkflowBridge.updateJsonPreview();
        showToast('AI đã tạo tiêu đề giật tít thu hút tương tác!', 'success');
      }
    });
  }

  // 10. Emoji Adder
  const emojiBtn = document.getElementById('btn-add-emoji');
  if (emojiBtn) {
    emojiBtn.addEventListener('click', () => {
      const emojis = ['🔥', '⚡', '🚀', '⭐', '👇', '🎯', '💡', '✅'];
      const pick = emojis[Math.floor(Math.random() * emojis.length)];
      const captionInput = document.getElementById('caption-input');
      if (captionInput) {
        captionInput.value += ` ${pick} `;
        PreviewManager.updateCaption(captionInput.value);
        WorkflowBridge.updateJsonPreview();
      }
    });
  }

  // 11. CTA Adder
  const ctaBtn = document.getElementById('btn-add-cta');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      const captionInput = document.getElementById('caption-input');
      if (captionInput) {
        captionInput.value += '\n\n👉 Nhấn Theo Dõi trang để không bỏ lỡ video công nghệ hot nhất mỗi ngày!';
        PreviewManager.updateCaption(captionInput.value);
        WorkflowBridge.updateJsonPreview();
      }
    });
  }

  // 12. Dropzone & File Upload Handling
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('media-file-input');
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleUploadedFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        handleUploadedFile(fileInput.files[0]);
      }
    });
  }

  function handleUploadedFile(file) {
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();

    reader.onload = (e) => {
      const src = e.target.result;
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      
      const sizeBadge = document.getElementById('media-size-badge');
      if (sizeBadge) sizeBadge.textContent = `${sizeMB} MB`;

      PreviewManager.currentMediaData = src;
      PreviewManager.currentMediaSrc = src;
      PreviewManager.currentMediaType = file.type;

      PreviewManager.updateMedia(src, isVideo ? 'reels' : 'feed');
      showToast(`Đã tải lên tệp: ${file.name} (${sizeMB} MB)`, 'success');
      WorkflowBridge.updateJsonPreview();
    };

    reader.readAsDataURL(file);
  }

  // Remove media button
  const btnRemoveMedia = document.getElementById('btn-remove-media');
  if (btnRemoveMedia) {
    btnRemoveMedia.addEventListener('click', () => {
      PreviewManager.updateMedia('assets/sample-reels.jpg', 'reels');
      showToast('Đã đặt lại tệp mẫu mặc định', 'info');
    });
  }

  // 13. Update Summary Function
  function updateScheduleSummary() {
    const dateVal = document.getElementById('schedule-date')?.value || todayStr;
    const timeVal = document.getElementById('schedule-time')?.value || '19:30';
    const jitterVal = parseInt(document.getElementById('anti-spam-jitter')?.value || '8');

    const { actualDate, jitterOffset } = computeJitterTime(dateVal, timeVal, jitterVal);
    const summaryRealTime = document.getElementById('summary-real-time');

    const offsetSign = jitterOffset >= 0 ? `+${jitterOffset}` : `${jitterOffset}`;
    if (summaryRealTime) {
      summaryRealTime.textContent = `${formatDateTimeVN(actualDate)} (${offsetSign}p ngẫu nhiên)`;
    }

    PreviewManager.updatePublishTimePreview(`${timeVal} (±${jitterVal}p)`);
  }

  // Watch date & time inputs
  const timeInput = document.getElementById('schedule-time');
  if (dateInput) dateInput.addEventListener('change', () => { updateScheduleSummary(); WorkflowBridge.updateJsonPreview(); });
  if (timeInput) timeInput.addEventListener('change', () => { updateScheduleSummary(); WorkflowBridge.updateJsonPreview(); });
  updateScheduleSummary();

  // 14. SUBMIT SCHEDULE BUTTON
  const btnSubmitSchedule = document.getElementById('btn-submit-schedule');
  if (btnSubmitSchedule) {
    btnSubmitSchedule.addEventListener('click', () => {
      const caption = document.getElementById('caption-input')?.value || '';
      const dateVal = document.getElementById('schedule-date')?.value || todayStr;
      const timeVal = document.getElementById('schedule-time')?.value || '19:30';
      const jitterVal = parseInt(document.getElementById('anti-spam-jitter')?.value || '8');
      const firstComment = document.getElementById('first-comment-input')?.value || '';
      const isPin = document.getElementById('check-pin-post')?.checked || false;

      const { actualDate } = computeJitterTime(dateVal, timeVal, jitterVal);

      const newPost = {
        id: 'post-' + Date.now(),
        title: caption.substring(0, 40) + '...',
        format: PreviewManager.currentFormat,
        formatLabel: PreviewManager.currentFormat === 'reels' ? 'Facebook Reels (9:16)' : 'Video Feed (16:9)',
        mediaUrl: PreviewManager.currentFormat === 'reels' ? 'assets/sample-reels.jpg' : 'assets/sample-feed.jpg',
        caption: caption,
        firstComment: firstComment,
        scheduledTime: actualDate.toISOString(),
        jitterMinutes: jitterVal,
        status: 'scheduled',
        statusLabel: 'Chờ đăng tự động',
        pinPost: isPin,
        engagementPrediction: 'Khung giờ vàng tối ưu reach'
      };

      addScheduledPost(newPost);
      updateQueueBadge();
      showToast(`Đã lên lịch đăng bài thành công vào lúc: ${formatDateTimeVN(actualDate)}!`, 'success');

      // Switch to Queue View to show the scheduled post
      const queueTab = document.querySelector('.nav-tab-btn[data-tab="queue-view"]');
      if (queueTab) queueTab.click();
    });
  }

  // 15. PUBLISH NOW BUTTON
  const btnPublishNow = document.getElementById('btn-publish-now');
  if (btnPublishNow) {
    btnPublishNow.addEventListener('click', async () => {
      const caption = document.getElementById('caption-input')?.value || '';
      const firstComment = document.getElementById('first-comment-input')?.value || '';

      // Kiểm tra xem đã cấu hình Token chưa
      if (WorkflowBridge.currentConfig.pageId && WorkflowBridge.currentConfig.hasToken) {
        showToast('Đang gọi Facebook Graph API để đăng bài trực tiếp lên Fanpage...', 'info');
        btnPublishNow.disabled = true;

        try {
          const res = await fetch('/api/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pageId: WorkflowBridge.currentConfig.pageId,
              format: PreviewManager.currentFormat,
              caption: caption,
              firstComment: firstComment,
              mediaBase64: PreviewManager.currentMediaData || null,
              mediaType: PreviewManager.currentMediaType || null
            })
          });

          const data = await res.json();
          if (data.success) {
            const id = data.postId || data.videoId || data.photoId;
            showToast('🎉 Đã đăng bài thành công lên Fanpage Facebook thật!', 'success');
            
            addScheduledPost({
              id: 'fb-' + id,
              title: caption.substring(0, 40) + '...',
              format: PreviewManager.currentFormat,
              formatLabel: PreviewManager.currentFormat === 'reels' ? 'Facebook Reels (9:16)' : 'Video Feed (16:9)',
              mediaUrl: PreviewManager.currentMediaSrc || 'assets/sample-reels.jpg',
              caption: caption,
              firstComment: firstComment,
              scheduledTime: new Date().toISOString(),
              jitterMinutes: 0,
              status: 'published',
              statusLabel: 'Đã đăng trực tiếp (Live)',
              pinPost: false,
              engagementPrediction: 'Mới đăng'
            });
            updateQueueBadge();

            const queueTab = document.querySelector('.nav-tab-btn[data-tab="queue-view"]');
            if (queueTab) queueTab.click();
            return;
          } else {
            showToast(`Facebook API báo lỗi: ${data.error}`, 'warning');
          }
        } catch (err) {
          showToast(`Lỗi gửi yêu cầu đăng bài: ${err.message}`, 'warning');
        } finally {
          btnPublishNow.disabled = false;
        }
      }

      // Nếu chưa có token thì thông báo và lưu mô phỏng
      showToast('Chưa cấu hình Page Access Token: Đã lưu vào hàng đợi mô phỏng. Hãy cấu hình Token trong tab Workflow Engine để đăng thật!', 'warning');
      const newPost = {
        id: 'post-' + Date.now(),
        title: caption.substring(0, 40) + '...',
        format: PreviewManager.currentFormat,
        formatLabel: PreviewManager.currentFormat === 'reels' ? 'Facebook Reels (9:16)' : 'Video Feed (16:9)',
        mediaUrl: PreviewManager.currentMediaSrc || (PreviewManager.currentFormat === 'reels' ? 'assets/sample-reels.jpg' : 'assets/sample-feed.jpg'),
        caption: caption,
        firstComment: firstComment,
        scheduledTime: new Date().toISOString(),
        jitterMinutes: 0,
        status: 'published',
        statusLabel: 'Đã đăng thành công (Mô phỏng)',
        pinPost: false,
        engagementPrediction: 'Mô phỏng'
      };

      addScheduledPost(newPost);
      updateQueueBadge();
      
      const queueTab = document.querySelector('.nav-tab-btn[data-tab="queue-view"]');
      if (queueTab) queueTab.click();
    });
  }

  // Header Page Switch Click -> Navigate to settings
  const pageSwitchBtn = document.getElementById('btn-page-switch');
  if (pageSwitchBtn) {
    pageSwitchBtn.addEventListener('click', () => {
      const engineTab = document.querySelector('.nav-tab-btn[data-tab="engine-view"]');
      if (engineTab) engineTab.click();
    });
  }

  // 16. Queue Count Badge in Nav
  function updateQueueBadge() {
    const badge = document.getElementById('queue-count-badge');
    if (badge) {
      const count = SchedulerState.posts.filter(p => p.status === 'scheduled').length;
      badge.textContent = count;
    }
  }
  updateQueueBadge();

  // 17. Render Queue List View
  function renderQueueList() {
    const container = document.getElementById('queue-items-container');
    if (!container) return;

    container.innerHTML = '';
    if (SchedulerState.posts.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">📭</div>
          <div style="font-size:1.1rem; font-weight:700; color:#fff;">Hàng đợi hiện đang trống</div>
          <p style="font-size:0.85rem; margin-top:0.3rem;">Hãy quay lại tab "Đăng bài & Hẹn giờ" để thiết lập bài đăng mới.</p>
        </div>
      `;
      return;
    }

    SchedulerState.posts.forEach(post => {
      const isPending = post.status === 'scheduled';
      const itemEl = document.createElement('div');
      itemEl.className = 'queue-item-card';

      itemEl.innerHTML = `
        <img src="${post.mediaUrl}" alt="Thumb" class="queue-thumb">
        <div class="queue-details">
          <div class="queue-title">${post.title || 'Bài viết không có tiêu đề'}</div>
          <div class="queue-meta-row">
            <span style="color:${isPending ? '#60a5fa' : '#34d399'}; font-weight:700;">
              ${post.statusLabel}
            </span>
            <span>•</span>
            <span>${formatDateTimeVN(post.scheduledTime)}</span>
            ${isPending ? `<span class="countdown-badge" data-time="${post.scheduledTime}">${getCountdownString(post.scheduledTime)}</span>` : ''}
            <span>•</span>
            <span class="badge-tag">${post.formatLabel}</span>
          </div>
        </div>
        <div class="queue-actions-group">
          ${isPending ? `
            <button type="button" class="btn-queue-action publish-now" onclick="handleQueuePublishNow('${post.id}')">Đăng ngay</button>
          ` : ''}
          <button type="button" class="btn-queue-action danger" onclick="handleQueueDelete('${post.id}')">Xóa</button>
        </div>
      `;

      container.appendChild(itemEl);
    });
  }

  // Global window functions for queue actions
  window.handleQueuePublishNow = function(id) {
    triggerPublishPostNow(id);
    renderQueueList();
    updateQueueBadge();
    showToast('Đã phát bài viết lên Fanpage ngay lập tức!', 'success');
  };

  window.handleQueueDelete = function(id) {
    deleteScheduledPost(id);
    renderQueueList();
    updateQueueBadge();
    showToast('Đã xóa bài viết khỏi hàng đợi!', 'info');
  };

  // Interval for live countdowns in queue
  setInterval(() => {
    const badges = document.querySelectorAll('.countdown-badge');
    badges.forEach(b => {
      const t = b.dataset.time;
      if (t) b.textContent = getCountdownString(t);
    });
  }, 1000);

  // 18. Calendar Navigation & Render
  let calDate = new Date();

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  function renderCalendar() {
    const grid = document.getElementById('calendar-cells-grid');
    const monthTitle = document.getElementById('cal-month-name');
    if (!grid || !monthTitle) return;

    const year = calDate.getFullYear();
    const month = calDate.getMonth();

    monthTitle.textContent = `${monthNames[month]}, ${year}`;
    grid.innerHTML = '';

    // First day of month
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Convert to Mon = 0, Sun = 6
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    // Total days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Total days in previous month
    const prevMonthDays = new Date(year, month, 0).getDate();

    const today = new Date();

    // Previous month filler days
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell other-month';
      cell.innerHTML = `
        <div class="day-number-row">
          <span class="day-num">${prevMonthDays - i}</span>
        </div>
      `;
      grid.appendChild(cell);
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';

      const isCurrentDay = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      if (isCurrentDay) cell.classList.add('today');

      // Check posts on this day
      const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayPosts = SchedulerState.posts.filter(p => {
        const postDate = new Date(p.scheduledTime);
        const pStr = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}-${String(postDate.getDate()).padStart(2, '0')}`;
        return pStr === dayDateStr;
      });

      let eventsHtml = '';
      if (dayPosts.length > 0) {
        eventsHtml = `<div class="cal-events-list">`;
        dayPosts.forEach(dp => {
          const pTime = new Date(dp.scheduledTime);
          const timeH = `${String(pTime.getHours()).padStart(2, '0')}:${String(pTime.getMinutes()).padStart(2, '0')}`;
          const isPublished = dp.status === 'published';
          const pillClass = isPublished ? 'event-published' : 'event-scheduled';
          eventsHtml += `
            <div class="cal-event-pill ${pillClass}" title="${dp.title}">
              <span>${timeH}</span>
              <span style="max-width:70px;overflow:hidden;text-overflow:ellipsis;">${dp.title}</span>
            </div>
          `;
        });
        eventsHtml += `</div>`;
      }

      cell.innerHTML = `
        <div class="day-number-row">
          <span class="day-num">${day}</span>
          ${dayPosts.length > 0 ? `<span style="font-size:0.65rem; color:#60a5fa; font-weight:700;">${dayPosts.length} bài</span>` : ''}
        </div>
        ${eventsHtml}
      `;

      grid.appendChild(cell);
    }
  }

  // Month navigation handlers
  const btnCalPrev = document.getElementById('btn-cal-prev');
  const btnCalNext = document.getElementById('btn-cal-next');
  const btnCalToday = document.getElementById('btn-cal-today');

  if (btnCalPrev) {
    btnCalPrev.addEventListener('click', () => {
      calDate.setMonth(calDate.getMonth() - 1);
      renderCalendar();
    });
  }
  if (btnCalNext) {
    btnCalNext.addEventListener('click', () => {
      calDate.setMonth(calDate.getMonth() + 1);
      renderCalendar();
    });
  }
  if (btnCalToday) {
    btnCalToday.addEventListener('click', () => {
      calDate = new Date();
      renderCalendar();
    });
  }

  const btnQuickNew = document.getElementById('btn-quick-new-schedule');
  if (btnQuickNew) {
    btnQuickNew.addEventListener('click', () => {
      const composerTab = document.querySelector('.nav-tab-btn[data-tab="composer-view"]');
      if (composerTab) composerTab.click();
    });
  }
});
