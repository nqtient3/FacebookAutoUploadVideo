/**
 * FB AutoPost Studio - Scheduler Module
 * Quản lý dữ liệu lịch đăng, tính toán khung giờ, chống quét spam & hàng đợi Drip-feed
 */

const SchedulerState = {
  // Danh sách các bài đăng trong lịch & hàng đợi
  posts: [
    {
      id: 'post-101',
      title: '🔥 Review Siêu Phẩm Công Nghệ 2026',
      format: 'reels',
      formatLabel: 'Facebook Reels (9:16)',
      mediaUrl: 'assets/sample-reels.jpg',
      caption: '🔥 Trải nghiệm siêu phẩm công nghệ thế hệ mới! Với bộ vi xử lý lượng tử và màn hình tương lai, bạn nghĩ sản phẩm này có đáng giá? Bình luận ý kiến của bạn bên dưới nhé! 👇\n#congnghe #facebookreels #xuhuong2026',
      firstComment: '👉 Xem chi tiết thông số kỹ thuật và ưu đãi độc quyền tại: https://techreels.vn/review-sieu-pham',
      scheduledTime: new Date(Date.now() + 1000 * 60 * 120).toISOString(), // sau 2 tiếng
      jitterMinutes: 8,
      status: 'scheduled', // 'scheduled', 'published', 'queued', 'paused'
      statusLabel: 'Chờ đăng tự động',
      pinPost: true,
      engagementPrediction: '98% (Giờ vàng)'
    },
    {
      id: 'post-102',
      title: '📱 Mở Hộp Smartphone Màn Hình Trong Suốt',
      format: 'feed-video',
      formatLabel: 'Video Feed (16:9)',
      mediaUrl: 'assets/sample-feed.jpg',
      caption: 'Màn hình có thể nhìn xuyên thấu sẽ thay đổi cách chúng ta tương tác như thế nào? Cùng xem đánh giá chi tiết trên tay!\n#smartphone #futuretech #review',
      firstComment: 'Bạn thích màn hình cong hay trong suốt hơn? Để lại comment nhé!',
      scheduledTime: new Date(Date.now() + 1000 * 60 * 360).toISOString(), // sau 6 tiếng
      jitterMinutes: 10,
      status: 'scheduled',
      statusLabel: 'Chờ đăng tự động',
      pinPost: false,
      engagementPrediction: '94% (Giờ trưa)'
    },
    {
      id: 'post-103',
      title: '🎨 AI Robot sáng tạo nghệ thuật số 2077',
      format: 'reels',
      formatLabel: 'Facebook Reels (9:16)',
      mediaUrl: 'assets/sample-reels.jpg',
      caption: 'Khi trí tuệ nhân tạo trở thành nghệ sĩ đường phố Cyberpunk! Xem đến cuối để thấy kết quả đáng kinh ngạc ✨\n#cyberpunk #aiart #reelsfb',
      firstComment: '',
      scheduledTime: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // đã đăng 3 tiếng trước
      jitterMinutes: 5,
      status: 'published',
      statusLabel: 'Đã đăng thành công',
      pinPost: true,
      engagementPrediction: 'Đạt 42.8K lượt xem'
    }
  ],

  // Cấu hình các slot cố định trong ngày
  queueSlots: [
    { id: 1, name: 'Sáng', time: '08:30', active: true },
    { id: 2, name: 'Trưa', time: '12:15', active: true },
    { id: 3, name: 'Chiều', time: '17:45', active: true },
    { id: 4, name: 'Tối (Giờ Vàng)', time: '20:30', active: true }
  ],

  // Calendar State
  currentCalDate: new Date()
};

// Lưu & Đọc từ LocalStorage
function saveSchedulerToStorage() {
  try {
    localStorage.setItem('fb_autopost_posts', JSON.stringify(SchedulerState.posts));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

function loadSchedulerFromStorage() {
  try {
    const raw = localStorage.getItem('fb_autopost_posts');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        SchedulerState.posts = parsed;
      }
    }
  } catch (e) {
    console.warn('LocalStorage load failed:', e);
  }
}

// Tính toán thời gian thực tế với Jitter Chống Spam
function computeJitterTime(targetDate, targetTimeStr, jitterMinutes) {
  const [hours, minutes] = targetTimeStr.split(':').map(Number);
  const baseDate = new Date(targetDate);
  baseDate.setHours(hours, minutes, 0, 0);

  // Tạo jitter ngẫu nhiên trong khoảng [-jitterMinutes, +jitterMinutes]
  const jitterOffset = Math.floor(Math.random() * (jitterMinutes * 2 + 1)) - jitterMinutes;
  const actualDate = new Date(baseDate.getTime() + jitterOffset * 60 * 1000);

  return {
    baseDate,
    actualDate,
    jitterOffset
  };
}

// Định dạng thời gian thân thiện (Tiếng Việt)
function formatDateTimeVN(dateObj) {
  if (typeof dateObj === 'string') dateObj = new Date(dateObj);
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  const h = String(dateObj.getHours()).padStart(2, '0');
  const min = String(dateObj.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y} lúc ${h}:${min}`;
}

// Tính thời gian đếm ngược (Countdown)
function getCountdownString(targetTimeISO) {
  const diffMs = new Date(targetTimeISO).getTime() - Date.now();
  if (diffMs <= 0) return 'Đang đăng hoặc đã hoàn tất';

  const totalSecs = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  return `Còn ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Tìm khung giờ trống tiếp theo cho hàng đợi Drip Feed
function getNextAvailableQueueSlot() {
  const now = new Date();
  const curTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  for (const slot of SchedulerState.queueSlots) {
    if (slot.active && slot.time > curTimeStr) {
      return {
        day: 'Hôm nay',
        time: slot.time,
        label: `Hôm nay, ${slot.time} (${slot.name})`
      };
    }
  }

  // Nếu đã qua tất cả các slot trong ngày, chuyển sang slot 1 của ngày mai
  const firstSlot = SchedulerState.queueSlots[0];
  return {
    day: 'Ngày mai',
    time: firstSlot.time,
    label: `Ngày mai, ${firstSlot.time} (${firstSlot.name})`
  };
}

// Thêm bài đăng mới vào danh sách
function addScheduledPost(postData) {
  SchedulerState.posts.unshift(postData);
  saveSchedulerToStorage();
}

// Xóa bài đăng
function deleteScheduledPost(postId) {
  SchedulerState.posts = SchedulerState.posts.filter(p => p.id !== postId);
  saveSchedulerToStorage();
}

// Đăng ngay một bài trong hàng đợi
function triggerPublishPostNow(postId) {
  const post = SchedulerState.posts.find(p => p.id === postId);
  if (post) {
    post.status = 'published';
    post.statusLabel = 'Đã đăng thành công';
    post.scheduledTime = new Date().toISOString();
    saveSchedulerToStorage();
  }
  return post;
}

// Khởi tạo đọc từ storage
loadSchedulerFromStorage();
