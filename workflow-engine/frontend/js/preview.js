/**
 * FB AutoPost Studio - Live Facebook Preview Module
 * Cập nhật thời gian thực giao diện mô phỏng Facebook Feed & Reels 9:16
 */

const PreviewManager = {
  currentFormat: 'reels',
  isPlaying: false,

  init() {
    this.bindEvents();
    this.updatePreviewContent();
  },

  bindEvents() {
    // Mode Switcher (Feed vs Reels)
    const previewTabs = document.querySelectorAll('.preview-tab');
    previewTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        previewTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.dataset.previewMode;
        this.switchPreviewMode(mode);
      });
    });

    // Caption input live syncing
    const captionInput = document.getElementById('caption-input');
    if (captionInput) {
      captionInput.addEventListener('input', () => {
        this.updateCaption(captionInput.value);
      });
    }

    // First comment input live syncing
    const firstCommentInput = document.getElementById('first-comment-input');
    if (firstCommentInput) {
      firstCommentInput.addEventListener('input', () => {
        this.updateFirstComment(firstCommentInput.value);
      });
    }

    // First comment toggle visibility
    const checkFirstComment = document.getElementById('check-first-comment');
    const previewCommentWrap = document.getElementById('preview-first-comment-wrap');
    if (checkFirstComment && previewCommentWrap) {
      checkFirstComment.addEventListener('change', () => {
        previewCommentWrap.style.display = checkFirstComment.checked ? 'block' : 'none';
      });
    }

    // Video play/pause simulation
    const playBtn = document.getElementById('preview-video-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.toggleVideoPlayback();
      });
    }
  },

  switchPreviewMode(mode) {
    const feedPreview = document.getElementById('fb-feed-preview');
    const reelsPreview = document.getElementById('fb-reels-preview');

    if (mode === 'reels') {
      if (feedPreview) feedPreview.style.display = 'none';
      if (reelsPreview) {
        reelsPreview.style.display = 'block';
        reelsPreview.classList.add('active');
      }
    } else {
      if (reelsPreview) {
        reelsPreview.style.display = 'none';
        reelsPreview.classList.remove('active');
      }
      if (feedPreview) feedPreview.style.display = 'block';
    }
  },

  updateCaption(text) {
    const feedCaption = document.getElementById('preview-caption-text');
    const reelsCaption = document.getElementById('reels-preview-caption');
    const counter = document.getElementById('caption-counter');

    if (counter) counter.textContent = `${text.length} ký tự`;

    // Định dạng hashtag thành màu xanh Facebook
    const formattedHtml = text.replace(/#([\p{L}\p{N}_]+)/gu, '<span style="color:#4599ff;font-weight:600;">#$1</span>');

    if (feedCaption) feedCaption.innerHTML = formattedHtml || '<span style="color:#888;">(Chưa có nội dung bài viết...)</span>';
    if (reelsCaption) reelsCaption.textContent = text || 'Chưa có mô tả Reels...';
  },

  updateFirstComment(text) {
    const previewText = document.getElementById('preview-first-comment-text');
    if (previewText) {
      previewText.textContent = text || 'Chưa có nội dung bình luận...';
    }
  },

  updateMedia(src, type) {
    const feedMedia = document.getElementById('preview-media-img');
    const reelsMedia = document.getElementById('preview-reels-img');
    const cardMedia = document.getElementById('card-preview-img');
    const cardPreviewBox = document.getElementById('card-media-preview');

    if (feedMedia) feedMedia.src = src;
    if (reelsMedia) reelsMedia.src = src;
    if (cardMedia) cardMedia.src = src;
    if (cardPreviewBox) cardPreviewBox.classList.add('active');

    // Cập nhật tỷ lệ
    if (type === 'reels') {
      this.switchPreviewMode('reels');
      const reelsTab = document.querySelector('.preview-tab[data-preview-mode="reels"]');
      if (reelsTab) reelsTab.click();
    } else {
      this.switchPreviewMode('feed');
      const feedTab = document.querySelector('.preview-tab[data-preview-mode="feed"]');
      if (feedTab) feedTab.click();
    }
  },

  toggleVideoPlayback() {
    this.isPlaying = !this.isPlaying;
    const playBtn = document.querySelector('#preview-video-play-btn .fb-play-btn');
    if (playBtn) {
      if (this.isPlaying) {
        playBtn.innerHTML = '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        playBtn.style.background = 'rgba(24, 119, 242, 0.85)';
      } else {
        playBtn.innerHTML = '<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
        playBtn.style.background = 'rgba(0, 0, 0, 0.65)';
      }
    }
  },

  updatePublishTimePreview(timeString) {
    const timeEl = document.getElementById('preview-publish-time');
    if (timeEl) {
      timeEl.textContent = `Lên lịch • ${timeString}`;
    }
  },

  updatePreviewContent() {
    const captionInput = document.getElementById('caption-input');
    if (captionInput) this.updateCaption(captionInput.value);

    const firstCommentInput = document.getElementById('first-comment-input');
    if (firstCommentInput) this.updateFirstComment(firstCommentInput.value);
  }
};
