chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "download") {
    chrome.downloads.download({
      url: request.url,
      filename: request.filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error(`Download failed: ${chrome.runtime.lastError.message}`);
        sendResponse({success: false, error: chrome.runtime.lastError.message});
      } else {
        console.log(`Download started with id: ${downloadId}`);
        sendResponse({success: true, downloadId: downloadId});
      }
    });
    return true; // 保持消息通道开放以进行异步响应
  }
});
