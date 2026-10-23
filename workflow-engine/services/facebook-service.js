/**
 * Facebook Graph API Service
 * Xử lý tương tác trực tiếp với Meta Graph API cho Fanpage
 */

const fs = require('fs');
const path = require('path');

const FB_DEFAULT_API_VERSION = 'v19.0';

/**
 * Kiểm tra tính hợp lệ của Page ID và Page Access Token
 */
async function verifyPageCredentials({ pageId, pageToken, apiVersion = FB_DEFAULT_API_VERSION }) {
  if (!pageToken) {
    return {
      success: false,
      error: 'Thiếu thông tin Page Access Token.'
    };
  }

  let cleanPageId = (pageId || '').trim();
  const cleanToken = pageToken.trim();
  const version = (apiVersion || FB_DEFAULT_API_VERSION).trim();

  // Helper thực hiện truy vấn Graph API an toàn
  const queryGraphApi = async (node, fields) => {
    try {
      const res = await fetch(`https://graph.facebook.com/${version}/${node}?fields=${fields}&access_token=${encodeURIComponent(cleanToken)}`);
      return await res.json();
    } catch (e) {
      return { error: { message: e.message } };
    }
  };

  // 1. Kiểm tra /me trước với các trường an toàn nhất (id, name, picture)
  let meData = await queryGraphApi('me', 'id,name,picture.type(large),link');
  if (meData.error && meData.error.code === 100) {
    meData = await queryGraphApi('me', 'id,name');
  }

  // Tự động chuẩn hoá Page ID nếu cleanPageId rỗng hoặc là Global ID 615...
  if (meData && !meData.error && meData.id) {
    if (!cleanPageId || cleanPageId.startsWith('615')) {
      cleanPageId = meData.id;
    }
  }

  // 2. Truy vấn thông tin của Trang mục tiêu
  const targetNode = cleanPageId || 'me';
  let data = await queryGraphApi(targetNode, 'id,name,picture.type(large),link,followers_count');
  
  // Nếu gặp lỗi #100 (nonexisting field), fallback về trường tối giản
  if (data.error && data.error.code === 100) {
    data = await queryGraphApi(targetNode, 'id,name,picture.type(large)');
  }
  if (data.error && data.error.code === 100) {
    data = await queryGraphApi(targetNode, 'id,name');
  }

  // Nếu targetNode lỗi nhưng meData hợp lệ, sử dụng meData
  if (data.error && meData && !meData.error && meData.id) {
    data = meData;
  }

  // 3. Nếu vẫn lỗi, thử kiểm tra xem có phải token người dùng không qua /me/accounts
  if (data.error) {
    try {
      const accounts = await queryGraphApi('me/accounts', 'id,name,access_token,picture.type(large)');
      if (accounts && Array.isArray(accounts.data) && accounts.data.length > 0) {
        const found = cleanPageId ? accounts.data.find(p => p.id === cleanPageId) : null;
        const selected = found || accounts.data[0];
        return {
          success: true,
          page: {
            id: selected.id,
            name: selected.name,
            category: 'Fanpage',
            followersCount: 0,
            pictureUrl: selected.picture?.data?.url || null,
            link: `https://facebook.com/${selected.id}`,
            isPublished: true
          },
          autoResolved: true,
          suggestedPageId: selected.id,
          suggestedPageToken: selected.access_token,
          note: 'Đã tự động lấy Page Access Token từ User Token.'
        };
      }
    } catch (e) {}

    return {
      success: false,
      error: data.error.message || 'Lỗi xác thực Graph API từ Facebook.',
      code: data.error.code,
      errorType: data.error.type
    };
  }

  return {
    success: true,
    page: {
      id: data.id,
      name: data.name,
      category: 'Fanpage',
      followersCount: data.followers_count || 0,
      pictureUrl: data.picture?.data?.url || null,
      link: data.link || `https://facebook.com/${data.id}`,
      isPublished: true
    },
    autoResolved: cleanPageId !== (pageId || '').trim(),
    suggestedPageId: data.id
  };
}

/**
 * Trích xuất danh sách tất cả các Fanpage mà Token này quản lý
 * Tự động trả về Page ID và Page Access Token cho từng trang
 */
async function fetchUserPages({ token, apiVersion = FB_DEFAULT_API_VERSION }) {
  if (!token) {
    return { success: false, error: 'Vui lòng cung cấp mã Token (User Token hoặc Page Token).' };
  }

  const cleanToken = token.trim();
  const version = (apiVersion || FB_DEFAULT_API_VERSION).trim();

  const queryGraphApi = async (node, fields) => {
    try {
      const res = await fetch(`https://graph.facebook.com/${version}/${node}?fields=${fields}&access_token=${encodeURIComponent(cleanToken)}`);
      return await res.json();
    } catch (e) {
      return { error: { message: e.message } };
    }
  };

  // 1. Kiểm tra danh tính của Token
  let me = await queryGraphApi('me', 'id,name,picture.type(large)');
  if (me.error && me.error.code === 100) {
    me = await queryGraphApi('me', 'id,name');
  }

  if (me.error && !me.id) {
    return {
      success: false,
      error: me.error.message || 'Mã Token không hợp lệ hoặc đã hết hạn.',
      code: me.error.code
    };
  }

  // 2. Lấy danh sách các trang Fanpage quản lý qua /me/accounts
  const accountsRes = await queryGraphApi('me/accounts', 'id,name,category,access_token,picture.type(large),link,tasks,followers_count');

  const pages = [];

  if (accountsRes && Array.isArray(accountsRes.data) && accountsRes.data.length > 0) {
    for (const item of accountsRes.data) {
      pages.push({
        id: item.id,
        name: item.name,
        category: item.category || 'Fanpage',
        followersCount: item.followers_count || 0,
        pictureUrl: item.picture?.data?.url || null,
        link: item.link || `https://facebook.com/${item.id}`,
        pageToken: item.access_token, // Mã Page Access Token chuẩn của trang này
        tasks: item.tasks || []
      });
    }

    return {
      success: true,
      tokenType: 'USER_TOKEN',
      account: {
        id: me.id,
        name: me.name,
        pictureUrl: me.picture?.data?.url || null
      },
      totalPages: pages.length,
      pages
    };
  }

  // 3. Nếu /me/accounts rỗng, kiểm tra xem Token có phải chính là Page Access Token của 1 Fanpage không
  const pageCheck = await queryGraphApi(me.id, 'id,name,category,picture.type(large),link,followers_count');
  if (pageCheck && pageCheck.id && (pageCheck.category || pageCheck.followers_count !== undefined)) {
    pages.push({
      id: pageCheck.id,
      name: pageCheck.name,
      category: pageCheck.category || 'Fanpage',
      followersCount: pageCheck.followers_count || 0,
      pictureUrl: pageCheck.picture?.data?.url || me.picture?.data?.url || null,
      link: pageCheck.link || `https://facebook.com/${pageCheck.id}`,
      pageToken: cleanToken,
      tasks: ['ADMIN']
    });

    return {
      success: true,
      tokenType: 'PAGE_TOKEN',
      account: {
        id: pageCheck.id,
        name: pageCheck.name,
        pictureUrl: pageCheck.picture?.data?.url || null
      },
      totalPages: 1,
      pages
    };
  }

  return {
    success: false,
    error: 'Tài khoản này chưa tạo Fanpage nào hoặc Token thiếu quyền "pages_show_list" / "pages_read_engagement". Vui lòng chọn thêm các quyền này trong Graph API Explorer.',
    tokenType: 'USER_TOKEN_NO_PAGES',
    account: {
      id: me.id,
      name: me.name
    }
  };
}

/**
 * Tra cứu Page ID từ đường dẫn URL hoặc Username của Fanpage
 */
async function resolvePageIdFromInput({ input, token, apiVersion = FB_DEFAULT_API_VERSION }) {
  if (!input) return { success: false, error: 'Vui lòng nhập link Fanpage hoặc ID/Username.' };

  const raw = String(input).trim();

  // Pattern 1: URL chứa profile.php?id=123456789
  const profileIdMatch = raw.match(/profile\.php\?id=(\d+)/i);
  if (profileIdMatch) {
    return { success: true, pageId: profileIdMatch[1], method: 'URL_REGEX' };
  }

  // Pattern 2: URL chứa số ID trực tiếp dạng facebook.com/123456789
  const directNumberMatch = raw.match(/facebook\.com\/(\d{10,})/i);
  if (directNumberMatch) {
    return { success: true, pageId: directNumberMatch[1], method: 'URL_REGEX' };
  }

  // Pattern 3: Dãy số ID thuần
  if (/^\d{10,25}$/.test(raw)) {
    return { success: true, pageId: raw, method: 'DIRECT_ID' };
  }

  // Pattern 4: Username hoặc URL trang -> Nếu có token, truy vấn Graph API /{username}
  let username = raw;
  if (raw.includes('facebook.com/')) {
    const parts = raw.split('facebook.com/')[1].split('/')[0].split('?')[0];
    if (parts) username = parts;
  }

  if (token && username) {
    try {
      const version = (apiVersion || FB_DEFAULT_API_VERSION).trim();
      const res = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(username)}?fields=id,name,picture.type(large),link&access_token=${encodeURIComponent(token.trim())}`);
      const data = await res.json();
      if (data && data.id) {
        return {
          success: true,
          pageId: data.id,
          pageName: data.name,
          pictureUrl: data.picture?.data?.url || null,
          method: 'GRAPH_API'
        };
      }
    } catch (e) {}
  }

  return {
    success: false,
    error: `Không thể tự động trích xuất Page ID từ: "${raw}". Vui lòng sử dụng tính năng "Trợ Lý Token" hoặc nhập trực tiếp dãy số ID.`
  };
}


/**
 * Đăng bình luận đầu tiên (First Comment)
 */
async function postFirstComment({ postId, comment, pageToken, apiVersion = FB_DEFAULT_API_VERSION }) {
  if (!postId || !comment || !pageToken) return null;

  try {
    const url = `https://graph.facebook.com/${apiVersion}/${postId}/comments`;
    const formData = new URLSearchParams();
    formData.append('message', comment);
    formData.append('access_token', pageToken);

    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Lỗi khi đăng First Comment:', e);
    return null;
  }
}

/**
 * Xoá file video/media cục bộ an toàn (có retry phòng ngừa file lock trên Windows)
 */
async function deleteLocalFile(filePath, maxRetries = 3, retryDelayMs = 400) {
  if (!filePath) return false;
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
  } catch (e) {
    return false;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await fs.promises.unlink(filePath);
      console.log(`[Storage Cleanup] 🗑️ Đã xoá file media thành công: ${filePath}`);
      return true;
    } catch (err) {
      if (attempt === maxRetries) {
        console.warn(`[Storage Cleanup] ⚠️ Không thể xoá file ${filePath} sau ${maxRetries} lần thử: ${err.message}`);
        return false;
      }
      await new Promise(r => setTimeout(r, retryDelayMs));
    }
  }
  return false;
}

/**
 * Đăng bài viết (Feed Post / Photo / Video) lên Fanpage
 */
async function publishToFacebookPage({
  pageId,
  pageToken,
  apiVersion = FB_DEFAULT_API_VERSION,
  format = 'status',
  caption = '',
  title = '',
  firstComment = '',
  scheduledPublishTime = null, // Unix timestamp (seconds)
  mediaBase64 = null,
  mediaFilePath = null,
  mediaType = null,
  deleteAfterUpload = false // Tuỳ chọn xoá file media cục bộ ngay sau khi upload thành công
}) {
  let cleanPageId = (pageId || '').trim();
  const cleanToken = pageToken.trim();
  const version = (apiVersion || FB_DEFAULT_API_VERSION).trim();

  // Tự động kiểm tra và chuẩn hoá nếu cleanPageId là Global ID (bắt đầu bằng 615...) hoặc rỗng
  if (!cleanPageId || cleanPageId.startsWith('615')) {
    try {
      const meRes = await fetch(`https://graph.facebook.com/${version}/me?fields=id,name&access_token=${encodeURIComponent(cleanToken)}`);
      const meData = await meRes.json();
      if (meData && meData.id) {
        cleanPageId = meData.id;
      }
    } catch (e) {}
  }

  // Xác định thời gian lên lịch
  const isScheduled = !!scheduledPublishTime;

  // 1. Trường hợp: Bài viết Trạng thái / Bài viết thường (Feed Post)
  if (format === 'status' || (!mediaBase64 && format !== 'photos' && format !== 'reels' && format !== 'feed-video')) {
    let url = `https://graph.facebook.com/${version}/${cleanPageId || 'me'}/feed`;
    const formData = new URLSearchParams();
    formData.append('message', caption);
    formData.append('access_token', cleanToken);

    if (isScheduled) {
      formData.append('published', 'false');
      formData.append('scheduled_publish_time', String(scheduledPublishTime));
    } else {
      formData.append('published', 'true');
    }

    let res = await fetch(url, { method: 'POST', body: formData });
    let data = await res.json();

    if (data.error && data.error.code === 100 && data.error.message && data.error.message.includes('global id')) {
      url = `https://graph.facebook.com/${version}/me/feed`;
      res = await fetch(url, { method: 'POST', body: formData });
      data = await res.json();
    }

    if (data.error) {
      return { success: false, error: data.error.message, raw: data.error };
    }

    const postId = data.id;

    // Đăng First Comment nếu đăng ngay
    if (!isScheduled && firstComment && postId) {
      await postFirstComment({ postId, comment: firstComment, pageToken: cleanToken, apiVersion: version });
    }

    return {
      success: true,
      postId: data.id,
      isScheduled,
      scheduledPublishTime,
      url: `https://facebook.com/${data.id}`
    };
  }

  // 2. Trường hợp: Đăng Ảnh (Photos)
  if (format === 'photos') {
    let url = `https://graph.facebook.com/${version}/${cleanPageId || 'me'}/photos`;
    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('access_token', cleanToken);

    if (isScheduled) {
      formData.append('published', 'false');
      formData.append('scheduled_publish_time', String(scheduledPublishTime));
    } else {
      formData.append('published', 'true');
    }

    if (mediaBase64) {
      const base64Data = mediaBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([buffer], { type: mediaType || 'image/jpeg' });
      formData.append('source', blob, 'photo.jpg');
    }

    let res = await fetch(url, { method: 'POST', body: formData });
    let data = await res.json();

    if (data.error && data.error.code === 100 && data.error.message && data.error.message.includes('global id')) {
      url = `https://graph.facebook.com/${version}/me/photos`;
      res = await fetch(url, { method: 'POST', body: formData });
      data = await res.json();
    }

    if (data.error) {
      return { success: false, error: data.error.message, raw: data.error };
    }

    const postId = data.post_id || data.id;
    if (!isScheduled && firstComment && postId) {
      await postFirstComment({ postId, comment: firstComment, pageToken: cleanToken, apiVersion: version });
    }

    let fileDeleted = false;
    if (deleteAfterUpload && mediaFilePath) {
      fileDeleted = await deleteLocalFile(mediaFilePath);
    }

    return {
      success: true,
      postId: data.post_id || data.id,
      photoId: data.id,
      isScheduled,
      scheduledPublishTime,
      url: `https://facebook.com/${data.post_id || data.id}`,
      fileDeleted
    };
  }

  // 3. Trường hợp: Video Feed hoặc Reels
  if (format === 'feed-video' || format === 'reels') {
    let targetPageId = cleanPageId || 'me';
    let url = `https://graph.facebook.com/${version}/${targetPageId}/videos`;
    const formData = new FormData();
    formData.append('description', caption);
    if (title) formData.append('title', title);
    formData.append('access_token', cleanToken);

    if (isScheduled) {
      formData.append('published', 'false');
      formData.append('scheduled_publish_time', String(scheduledPublishTime));
    } else {
      formData.append('published', 'true');
    }

    if (mediaFilePath && fs.existsSync(mediaFilePath)) {
      const fileBuffer = fs.readFileSync(mediaFilePath);
      const blob = new Blob([fileBuffer], { type: mediaType || 'video/mp4' });
      formData.append('source', blob, path.basename(mediaFilePath));
    } else if (mediaBase64) {
      const base64Data = mediaBase64.replace(/^data:video\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([buffer], { type: mediaType || 'video/mp4' });
      formData.append('source', blob, 'upload_video.mp4');
    }

    let res = await fetch(url, { method: 'POST', body: formData });
    let data = await res.json();

    // Tự động retry với ID từ /me nếu gặp lỗi Global ID
    if (data.error && (data.error.code === 100 || (data.error.message && data.error.message.includes('global id')))) {
      try {
        const meRes = await fetch(`https://graph.facebook.com/${version}/me?fields=id&access_token=${encodeURIComponent(cleanToken)}`);
        const meData = await meRes.json();
        const fallbackId = (meData && meData.id) ? meData.id : 'me';
        if (fallbackId !== targetPageId) {
          console.log(`[Auto-Resolve] Đang chuyển targetPageId từ ${targetPageId} sang ID chuẩn: ${fallbackId}`);
          url = `https://graph.facebook.com/${version}/${fallbackId}/videos`;
          res = await fetch(url, { method: 'POST', body: formData });
          data = await res.json();
        }
      } catch (retryErr) {
        console.error('Lỗi khi retry với Page ID /me:', retryErr);
      }
    }

    if (data.error) {
      return { success: false, error: data.error.message, raw: data.error };
    }

    const videoId = data.id;

    // Đăng First Comment nếu đăng ngay
    if (!isScheduled && firstComment && videoId) {
      await postFirstComment({ postId: videoId, comment: firstComment, pageToken: cleanToken, apiVersion: version });
    }

    // Xử lý xoá video sau khi upload thành công (không lưu trữ trên máy chủ)
    let fileDeleted = false;
    if (deleteAfterUpload && mediaFilePath) {
      fileDeleted = await deleteLocalFile(mediaFilePath);
    }

    return {
      success: true,
      videoId: data.id,
      isScheduled,
      scheduledPublishTime,
      url: `https://facebook.com/${data.id}`,
      fileDeleted
    };
  }

  return { success: false, error: 'Định dạng đăng bài không được hỗ trợ.' };
}

module.exports = {
  verifyPageCredentials,
  fetchUserPages,
  resolvePageIdFromInput,
  publishToFacebookPage,
  postFirstComment,
  deleteLocalFile,
  FB_DEFAULT_API_VERSION
};

