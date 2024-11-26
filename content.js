// 通知扩展程序content script已经准备好
chrome.runtime.sendMessage({action: "contentScriptReady"});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "crawl") {
    let result = {
      images: [],
      videos: [],
      text: document.body.innerText
    };

    // 爬取图片
    let images = document.getElementsByTagName('img');
    for (let img of images) {
      result.images.push(img.src);
    }

    // 爬取视频
    let videos = document.getElementsByTagName('video');
    for (let video of videos) {
      result.videos.push(video.src);
    }

    // 将结果保存到chrome.storage
    chrome.storage.local.set({crawlResult: result}, function() {
      console.log('爬取结果已保存');
    });

    sendResponse({status: "success"});
  }
});