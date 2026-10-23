declare const require: any;

jest.mock('../services/facebook-scraper', () => ({
    scanPageReels: jest.fn(),
    downloadReel: jest.fn(),
    parseViewCount: jest.fn((str) => 29000000),
    formatViewNumber: jest.fn((num) => '29M')
}), { virtual: true });

jest.mock('../services/facebook-service', () => ({
    publishToFacebookPage: jest.fn(),
    verifyPageCredentials: jest.fn()
}), { virtual: true });

import { WorkflowRunner } from '../src/engine/workflow-runner';
import { facebookReelsAutoWorkflow } from '../src/workflows/facebook-reels-workflow';
import { Result } from '../src/engine/workflow-types';

describe('FacebookReelsAutoWorkflow', () => {
    let workflowRunner: WorkflowRunner;

    beforeEach(() => {
        workflowRunner = new WorkflowRunner();
    });

    test('should define the 4 required steps', () => {
        expect(facebookReelsAutoWorkflow).toBeDefined();
        expect(facebookReelsAutoWorkflow.steps.length).toBe(4);
        expect(facebookReelsAutoWorkflow.steps[0].name).toBe('1_scan_reels');
        expect(facebookReelsAutoWorkflow.steps[1].name).toBe('2_filter_highest_view');
        expect(facebookReelsAutoWorkflow.steps[2].name).toBe('3_download_top_reel');
        expect(facebookReelsAutoWorkflow.steps[3].name).toBe('4_upload_to_fanpage');
    });

    test('should execute filter_highest_view and select top 1 video', async () => {
        const mockStep = facebookReelsAutoWorkflow.steps.find(s => s.name === '2_filter_highest_view');
        expect(mockStep).toBeDefined();
        if (mockStep && mockStep.action) {
            const input = {
                scanResult: {
                    topReel: {
                        reelId: '609854861764157',
                        viewCount: 29000000,
                        formattedViews: '29M',
                        url: 'https://www.facebook.com/reel/609854861764157/'
                    }
                }
            };
            const result = await mockStep.action(input);
            expect(result.topReel.reelId).toBe('609854861764157');
            expect(result.topReel.viewCount).toBe(29000000);
        }
    });

    test('should execute 4_upload_to_fanpage and handle delete video after successful upload', async () => {
        const mockStep = facebookReelsAutoWorkflow.steps.find(s => s.name === '4_upload_to_fanpage');
        expect(mockStep).toBeDefined();

        const fbService = require('../services/facebook-service');
        fbService.publishToFacebookPage.mockResolvedValueOnce({
            success: true,
            videoId: 'fb-vid-123',
            url: 'https://facebook.com/fb-vid-123',
            fileDeleted: true
        });

        if (mockStep && mockStep.action) {
            const input = {
                topReel: {
                    reelId: '123456',
                    formattedViews: '10M',
                    title: 'Test Reel Video',
                    url: 'https://facebook.com/reel/123456'
                },
                downloadResult: {
                    filePath: 'test/dummy.mp4',
                    fileName: 'dummy.mp4'
                },
                pageId: 'page_123',
                pageToken: 'EAAG_dummy_token',
                deleteAfterUpload: true
            };
            const result = await mockStep.action(input);
            expect(result.published).toBe(true);
            expect(result.publishResult.videoId).toBe('fb-vid-123');
            expect(result.fileDeleted).toBe(true);
            expect(fbService.publishToFacebookPage).toHaveBeenCalledWith(
                expect.objectContaining({
                    deleteAfterUpload: true,
                    pageId: 'page_123',
                    mediaFilePath: 'test/dummy.mp4'
                })
            );
        }
    });
});
