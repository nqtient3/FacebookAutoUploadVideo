/**
 * Token & Page ID Assistant (Bộ Trợ Lý Lấy Page ID & Token Tự Động)
 * Hỗ trợ quét tự động tất cả Fanpage quản lý, trích xuất Page Token vĩnh viễn và tra cứu Page ID
 */

const TokenAssistant = {
  activeTab: 'tab-auto-scan',
  cachedPages: [],

  init() {
    // Gắn sự kiện click mở modal từ nút trên navbar
    const navBtn = document.getElementById('btn-page-switch');
    if (navBtn) {
      navBtn.addEventListener('click', () => this.open());
    }

    // Gắn sự kiện Enter trong ô nhập Token
    const tokenInput = document.getElementById('assistant-token-input');
    if (tokenInput) {
      tokenInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.scanPages();
        }
      });
    }

    // Gắn sự kiện Enter trong ô nhập Link
    const linkInput = document.getElementById('assistant-link-input');
    if (linkInput) {
      linkInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.resolvePageId();
        }
      });
    }
  },

  open() {
    const modal = document.getElementById('modal-token-assistant');
    if (modal) {
      modal.classList.add('open');
      // Nếu đã có token trong ô cấu hình hiện tại mà ô trợ lý còn trống thì tự điền
      const currentToken = document.getElementById('reels-cfg-page-token')?.value || document.getElementById('page-token-input')?.value || '';
      const input = document.getElementById('assistant-token-input');
      if (input && !input.value && currentToken) {
        input.value = currentToken;
      }
    }
  },

  close() {
    const modal = document.getElementById('modal-token-assistant');
    if (modal) {
      modal.classList.remove('open');
    }
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    
    // Toggle buttons
    document.querySelectorAll('.assistant-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Toggle panels
    document.querySelectorAll('.assistant-tab-panel').forEach(panel => {
      panel.style.display = panel.id === tabId ? 'block' : 'none';
    });
  },

  async scanPages() {
    const input = document.getElementById('assistant-token-input');
    const token = input ? input.value.trim() : '';

    if (!token) {
      if (typeof showToast === 'function') {
        showToast('Vui lòng dán mã Access Token (User Token hoặc Page Token) vào ô.', 'warning');
      } else {
        alert('Vui lòng dán mã Access Token vào ô.');
      }
      return;
    }

    const btn = document.getElementById('btn-assistant-scan');
    const statusBox = document.getElementById('assistant-scan-status');
    const resultsContainer = document.getElementById('assistant-pages-list');

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="status-dot-pulse" style="display:inline-block;width:12px;height:12px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></span> Đang quét Fanpage...';
    }

    if (statusBox) {
      statusBox.style.display = 'block';
      statusBox.innerHTML = '<div style="color: #60a5fa; font-size: 0.82rem;">⏳ Đang kết nối với Meta Graph API để phân tích Token và trích xuất danh sách Fanpage...</div>';
    }

    if (resultsContainer) {
      resultsContainer.innerHTML = '';
    }

    try {
      const res = await fetch('/api/facebook/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, apiVersion: 'v19.0' })
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Không thể lấy thông tin Fanpage từ Token này.');
      }

      this.cachedPages = data.pages || [];

      // Hiển thị thông tin tài khoản người dùng
      if (statusBox) {
        const acc = data.account || {};
        const isUserToken = data.tokenType === 'USER_TOKEN';
        statusBox.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.6rem; background:rgba(16, 185, 129, 0.15); border:1px solid rgba(16, 185, 129, 0.35); border-radius:10px; padding:0.75rem 1rem;">
            <div style="display:flex; align-items:center; gap:0.65rem;">
              <img src="${acc.pictureUrl || 'assets/page-avatar.jpg'}" alt="Avatar" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid #10b981;">
              <div>
                <div style="font-size:0.88rem; font-weight:700; color:#fff;">${acc.name || 'Facebook User'}</div>
                <div style="font-size:0.75rem; color:#94a3b8;">Loại Token: <strong style="color:${isUserToken ? '#60a5fa' : '#a78bfa'}">${isUserToken ? 'User Token (Quản trị viên)' : 'Page Token'}</strong> • ID: ${acc.id}</div>
              </div>
            </div>
            <span class="badge-tag" style="background:rgba(16, 185, 129, 0.25); color:#6ee7b7; border-color:rgba(16, 185, 129, 0.4); font-size:0.78rem;">
              Tìm thấy: ${this.cachedPages.length} Fanpage
            </span>
          </div>
        `;
      }

      // Render danh sách các Fanpage
      if (resultsContainer) {
        if (this.cachedPages.length === 0) {
          resultsContainer.innerHTML = `
            <div style="text-align:center; padding:1.5rem; color:#94a3b8; font-size:0.85rem;">
              Không tìm thấy Fanpage nào thuộc quyền quản lý của Token này.
            </div>
          `;
        } else {
          resultsContainer.innerHTML = this.cachedPages.map((page, idx) => `
            <div class="assistant-page-card" style="background:rgba(15, 23, 42, 0.85); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:0.75rem; transition:all 0.2s ease;">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:0.75rem;">
                <div style="display:flex; align-items:center; gap:0.75rem; min-width:0;">
                  <img src="${page.pictureUrl || 'assets/page-avatar.jpg'}" alt="${page.name}" style="width:44px; height:44px; border-radius:10px; object-fit:cover; border:1px solid rgba(255,255,255,0.15); flex-shrink:0;">
                  <div style="min-width:0;">
                    <div style="font-size:0.95rem; font-weight:700; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                      ${page.name}
                    </div>
                    <div style="font-size:0.74rem; color:#94a3b8; display:flex; gap:0.5rem; align-items:center;">
                      <span>${page.category}</span>
                      <span>•</span>
                      <span style="color:#60a5fa;">${(page.followersCount || 0).toLocaleString()} followers</span>
                    </div>
                  </div>
                </div>
                <button type="button" class="btn-queue-action" onclick="TokenAssistant.applySelectedPage(${idx})" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%); color:#fff; font-weight:700; border:none; padding:0.55rem 0.95rem; font-size:0.78rem; border-radius:8px; box-shadow:0 3px 12px rgba(16, 185, 129, 0.35); white-space:nowrap;">
                  ⚡ Chọn & Áp Dụng Ngay
                </button>
              </div>

              <!-- Page ID & Token Fields -->
              <div style="background:rgba(0,0,0,0.3); border-radius:8px; padding:0.6rem 0.8rem; display:flex; flex-direction:column; gap:0.4rem; font-size:0.78rem;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
                  <span style="color:#94a3b8;">Page ID: <strong style="color:#fde047; font-family:'JetBrains Mono',monospace;">${page.id}</strong></span>
                  <button type="button" onclick="TokenAssistant.copyText('${page.id}', 'Đã sao chép Page ID!')" style="background:none; border:none; color:#60a5fa; cursor:pointer; font-size:0.75rem; display:flex; align-items:center; gap:0.25rem;">
                    📋 Copy ID
                  </button>
                </div>
                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
                  <span style="color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80%;">
                    Page Token: <span style="color:#a78bfa; font-family:'JetBrains Mono',monospace;">${page.pageToken ? page.pageToken.substring(0, 18) + '...' + page.pageToken.substring(page.pageToken.length - 8) : '(Trống)'}</span>
                  </span>
                  <button type="button" onclick="TokenAssistant.copyText('${page.pageToken}', 'Đã sao chép Page Access Token!')" style="background:none; border:none; color:#a78bfa; cursor:pointer; font-size:0.75rem; display:flex; align-items:center; gap:0.25rem;">
                    📋 Copy Token
                  </button>
                </div>
              </div>
            </div>
          `).join('');
        }
      }

      if (typeof showToast === 'function') {
        showToast(`Quét thành công! Tìm thấy ${this.cachedPages.length} Fanpage.`, 'success');
      }
    } catch (err) {
      if (statusBox) {
        statusBox.innerHTML = `
          <div style="background:rgba(239, 68, 68, 0.15); border:1px solid rgba(239, 68, 68, 0.35); border-radius:8px; padding:0.75rem; color:#fca5a5; font-size:0.8rem; line-height:1.45;">
            ⚠️ <strong>Lỗi:</strong> ${err.message}
            <div style="margin-top:0.35rem; font-size:0.74rem; color:#f87171;">
              💡 Mẹo: Hãy chắc chắn bạn đã cấp đủ quyền <code>pages_show_list</code>, <code>pages_read_engagement</code>, <code>pages_manage_posts</code> cho Token tại Graph API Explorer.
            </div>
          </div>
        `;
      }
      if (typeof showToast === 'function') {
        showToast(err.message, 'error');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🔍 Quét Danh Sách Fanpage Của Tôi';
      }
    }
  },

  async applySelectedPage(index) {
    const page = this.cachedPages[index];
    if (!page) return;

    const pageId = page.id;
    const pageToken = page.pageToken;

    // 1. Cập nhật các ô input trên màn hình Reels
    const reelsPageId = document.getElementById('reels-cfg-page-id');
    const reelsPageToken = document.getElementById('reels-cfg-page-token');
    if (reelsPageId) reelsPageId.value = pageId;
    if (reelsPageToken) reelsPageToken.value = pageToken;

    // 2. Cập nhật các ô input trên màn hình Composer / Publish
    const composerPageId = document.getElementById('page-id-input');
    const composerPageToken = document.getElementById('page-token-input');
    if (composerPageId) composerPageId.value = pageId;
    if (composerPageToken) composerPageToken.value = pageToken;

    // 3. Cập nhật thông tin Navbar
    const navName = document.getElementById('nav-page-name');
    const navAvatar = document.getElementById('nav-page-avatar');
    const navStatusText = document.getElementById('nav-status-text');
    const navStatusDot = document.getElementById('nav-status-dot');
    const navVerifiedIcon = document.getElementById('nav-verified-icon');

    if (navName) navName.textContent = page.name;
    if (navAvatar && page.pictureUrl) navAvatar.src = page.pictureUrl;
    if (navStatusText) navStatusText.textContent = `🟢 Sẵn sàng (ID: ${pageId})`;
    if (navStatusDot) navStatusDot.style.background = '#10b981';
    if (navVerifiedIcon) navVerifiedIcon.style.display = 'inline-block';

    // 4. Tự động lưu vào .env qua API /api/config
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, pageToken, apiVersion: 'v19.0' })
      });
    } catch (e) {
      console.warn('Lỗi lưu .env ngầm:', e);
    }

    // 5. Cập nhật Badge trên Reels view
    const pill = document.getElementById('reels-fb-status-pill');
    if (pill) {
      const followers = (page.followersCount || 0).toLocaleString();
      pill.textContent = `🟢 ${page.name} (${followers} fans)`;
      pill.style.background = 'rgba(16, 185, 129, 0.2)';
      pill.style.color = '#6ee7b7';
      pill.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    }

    // 6. Đóng modal và báo thành công
    this.close();

    if (typeof showToast === 'function') {
      showToast(`🎉 Đã thiết lập Fanpage "${page.name}" thành công! Page ID & Token đã được áp dụng.`, 'success');
    }
  },

  async resolvePageId() {
    const inputEl = document.getElementById('assistant-link-input');
    const inputVal = inputEl ? inputEl.value.trim() : '';

    if (!inputVal) {
      if (typeof showToast === 'function') {
        showToast('Vui lòng nhập đường dẫn URL Fanpage hoặc Username.', 'warning');
      }
      return;
    }

    const btn = document.getElementById('btn-assistant-resolve');
    const resultBox = document.getElementById('assistant-resolve-result');

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Đang tra cứu...';
    }

    if (resultBox) {
      resultBox.style.display = 'none';
    }

    try {
      const currentToken = document.getElementById('reels-cfg-page-token')?.value || document.getElementById('page-token-input')?.value || '';
      
      const res = await fetch('/api/facebook/resolve-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputVal, token: currentToken, apiVersion: 'v19.0' })
      });

      const data = await res.json();

      if (!data.success || !data.pageId) {
        throw new Error(data.error || 'Không thể tìm thấy Page ID từ đường dẫn này.');
      }

      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = `
          <div style="background:rgba(16, 185, 129, 0.15); border:1px solid rgba(16, 185, 129, 0.4); border-radius:10px; padding:1rem; display:flex; align-items:center; justify-content:space-between; gap:0.75rem;">
            <div>
              <div style="font-size:0.78rem; color:#94a3b8;">Kết quả tìm thấy:</div>
              <div style="font-size:1.1rem; font-weight:800; color:#fde047; font-family:'JetBrains Mono',monospace;">
                ${data.pageId}
              </div>
              ${data.pageName ? `<div style="font-size:0.8rem; color:#cbd5e1; margin-top:0.2rem;">Tên: <strong>${data.pageName}</strong></div>` : ''}
            </div>
            <button type="button" class="btn-queue-action" onclick="TokenAssistant.applyResolvedPageId('${data.pageId}')" style="background:#10b981; color:#fff; font-weight:700; border:none; padding:0.55rem 1rem; border-radius:8px;">
              ⚡ Điền Page ID Này
            </button>
          </div>
        `;
      }

      if (typeof showToast === 'function') {
        showToast(`Tìm thấy Page ID: ${data.pageId}`, 'success');
      }
    } catch (err) {
      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = `
          <div style="background:rgba(239, 68, 68, 0.15); border:1px solid rgba(239, 68, 68, 0.35); border-radius:8px; padding:0.75rem; color:#fca5a5; font-size:0.8rem;">
            ⚠️ ${err.message}
          </div>
        `;
      }
      if (typeof showToast === 'function') {
        showToast(err.message, 'error');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🔎 Tìm Page ID';
      }
    }
  },

  applyResolvedPageId(pageId) {
    const reelsPageId = document.getElementById('reels-cfg-page-id');
    const composerPageId = document.getElementById('page-id-input');
    if (reelsPageId) reelsPageId.value = pageId;
    if (composerPageId) composerPageId.value = pageId;

    this.close();
    if (typeof showToast === 'function') {
      showToast(`Đã điền Page ID: ${pageId} vào cấu hình!`, 'success');
    }
  },

  copyText(text, successMsg = 'Đã sao chép vào bộ nhớ tạm!') {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (typeof showToast === 'function') {
        showToast(successMsg, 'info');
      }
    }).catch(() => {
      prompt('Nhấn Ctrl+C để sao chép:', text);
    });
  }
};

// Tự động khởi tạo khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  TokenAssistant.init();
});
