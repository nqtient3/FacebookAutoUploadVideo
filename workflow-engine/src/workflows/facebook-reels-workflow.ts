import { Workflow } from '../engine/workflow-types';
declare const require: any;
const fs = require('fs');
// Note: We use require for local js services
const scraper = require('../../services/facebook-scraper');
const fbService = require('../../services/facebook-service');

export interface FacebookReelsWorkflowInput {
    pageUrl: string;
    maxScrolls?: number;
    pageId?: string;
    pageToken?: string;
    apiVersion?: string;
    captionTemplate?: string;
    scheduledPublishTime?: number | null;
    firstComment?: string;
    deleteAfterUpload?: boolean; // Tự động xoá video sau khi upload thành công (mặc định: true)
}

export const facebookReelsAutoWorkflow: Workflow = {
    id: 'facebook-reels-auto-repost',
    name: 'Facebook Reels Auto-Scan, Top View Download & Fanpage Repost',
    steps: [
        {
            name: '1_scan_reels',
            type: 'scraper',
            action: async (input: FacebookReelsWorkflowInput) => {
                const targetUrl = input.pageUrl || 'https://www.facebook.com/ThoBayMau/reels/';
                console.log(`[Workflow Step 1] Quét Reels từ: ${targetUrl}`);
                const scanResult = await scraper.scanPageReels({
                    pageUrl: targetUrl,
                    maxScrolls: input.maxScrolls || 4
                });

                if (!scanResult.reels || scanResult.reels.length === 0) {
                    throw new Error('Không tìm thấy video Reel nào trên trang nguồn.');
                }

                return {
                    ...input,
                    scanResult
                };
            }
        },
        {
            name: '2_filter_highest_view',
            type: 'analyzer',
            action: async (data: any) => {
                const topReel = data.scanResult.topReel;
                if (!topReel) {
                    throw new Error('Không xác định được video có lượt xem cao nhất.');
                }
                console.log(`[Workflow Step 2] Video Top 1: #${topReel.reelId} với ${topReel.formattedViews} lượt xem (${topReel.viewCount} views)`);
                return {
                    ...data,
                    topReel
                };
            }
        },
        {
            name: '3_download_top_reel',
            type: 'downloader',
            action: async (data: any) => {
                const topReel = data.topReel;
                console.log(`[Workflow Step 3] Đang tải video ${topReel.url} về máy...`);
                const downloadResult = await scraper.downloadReel({ reelUrl: topReel.url });
                console.log(`[Workflow Step 3] Tải thành công: ${downloadResult.fileName} (${downloadResult.fileSizeFormatted})`);
                return {
                    ...data,
                    downloadResult
                };
            }
        },
        {
            name: '4_upload_to_fanpage',
            type: 'publisher',
            action: async (data: any) => {
                const { topReel, downloadResult, pageId, pageToken, apiVersion, captionTemplate, scheduledPublishTime, firstComment, deleteAfterUpload } = data;

                if (!pageId || !pageToken) {
                    console.log('[Workflow Step 4] Chưa cung cấp Page ID hoặc Page Token. Bỏ qua bước đăng thật (Simulation mode).');
                    return {
                        ...data,
                        published: false,
                        simulation: true,
                        message: 'Mô phỏng thành công: Video đã tải về sẵn sàng đăng.'
                    };
                }

                let finalCaption = captionTemplate || `[Thỏ Bảy Màu - ${topReel.formattedViews} views] ${topReel.title}\n\nNguồn: ${topReel.url}\n#ThoBayMau #Reels #TopViews #Viral`;
                finalCaption = finalCaption
                    .replace(/\{views\}/g, topReel.formattedViews)
                    .replace(/\{title\}/g, topReel.title)
                    .replace(/\{url\}/g, topReel.url)
                    .replace(/\{reelId\}/g, topReel.reelId);

                const shouldDelete = deleteAfterUpload !== false;

                const publishResult = await fbService.publishToFacebookPage({
                    pageId,
                    pageToken,
                    apiVersion: apiVersion || 'v19.0',
                    format: 'reels',
                    caption: finalCaption,
                    title: `Reel Thỏ Bảy Màu - ${topReel.formattedViews} Views`,
                    firstComment: firstComment || '',
                    scheduledPublishTime: scheduledPublishTime || null,
                    mediaFilePath: downloadResult.filePath,
                    mediaType: 'video/mp4',
                    deleteAfterUpload: shouldDelete
                });

                if (!publishResult.success) {
                    throw new Error(`Đăng video lên Facebook thất bại: ${publishResult.error}`);
                }

                console.log(`[Workflow Step 4] Đã đăng thành công lên Fanpage! Post/Video ID: ${publishResult.videoId || publishResult.postId}`);

                // Xoá video sau khi upload thành công (không lưu trữ)
                let fileDeleted = publishResult.fileDeleted;
                if (shouldDelete && !fileDeleted && downloadResult?.filePath && fs.existsSync(downloadResult.filePath)) {
                    try {
                        fs.unlinkSync(downloadResult.filePath);
                        fileDeleted = true;
                        console.log(`[Workflow Step 4] 🗑️ Đã xoá file video sau khi upload thành công: ${downloadResult.filePath}`);
                    } catch (cleanupErr: any) {
                        console.warn(`[Workflow Step 4] ⚠️ Không thể xoá video: ${cleanupErr?.message}`);
                    }
                } else if (fileDeleted) {
                    console.log(`[Workflow Step 4] 🗑️ Đã dọn dẹp file video cục bộ thành công sau khi upload.`);
                }

                return {
                    ...data,
                    published: true,
                    publishResult,
                    fileDeleted: !!fileDeleted
                };
            }
        }
    ],
    onComplete: (results) => {
        console.log('[Workflow] Hoàn tất toàn bộ quy trình Auto-Scan, Top View Download & Repost!');
    }
};
