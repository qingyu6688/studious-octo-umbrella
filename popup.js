let contentScriptReady = false;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "contentScriptReady") {
    contentScriptReady = true;
  }
});

document.getElementById('crawl').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: crawlContent
    }, (injectionResults) => {
      for (const frameResult of injectionResults) {
        const result = frameResult.result;
        if (result && result.status === "success") {
          displayResults(result.data);
        }
      }
    });
  });
});

function crawlContent() {
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

  return { status: "success", data: result };
}

function displayResults(result) {
  // 显示图片
  const imagesDiv = document.getElementById('images');
  imagesDiv.innerHTML = '';
  result.images.forEach((src, index) => {
    const mediaItem = document.createElement('div');
    mediaItem.className = 'media-item';
    
    const img = document.createElement('img');
    img.src = src;
    mediaItem.appendChild(img);
    
    const downloadButton = document.createElement('button');
    downloadButton.className = 'download-button';
    downloadButton.textContent = '下载';
    downloadButton.addEventListener('click', () => {
      console.log(`Image download button clicked for: ${src}`);
      downloadMedia(src, index + 1, 'image');
    });
    mediaItem.appendChild(downloadButton);
    
    imagesDiv.appendChild(mediaItem);
  });
  document.getElementById('image-count').textContent = result.images.length;

  // 显示视频
  const videosDiv = document.getElementById('videos');
  videosDiv.innerHTML = '';
  result.videos.forEach((src, index) => {
    const mediaItem = document.createElement('div');
    mediaItem.className = 'media-item';
    
    const video = document.createElement('video');
    video.src = src;
    video.controls = true;
    mediaItem.appendChild(video);
    
    const downloadButton = document.createElement('button');
    downloadButton.className = 'download-button';
    downloadButton.textContent = '下载';
    downloadButton.addEventListener('click', () => {
      console.log(`Video download button clicked for: ${src}`);
      downloadMedia(src, index + 1, 'video');
    });
    mediaItem.appendChild(downloadButton);
    
    videosDiv.appendChild(mediaItem);
  });
  document.getElementById('video-count').textContent = result.videos.length;

  // 显示文字内容
  const titleContent = document.getElementById('title-content');
  const mainContent = document.getElementById('main-content');
  const otherContent = document.getElementById('other-content');
  
  // 使用正则表达式处理文本
  const processText = (text) => {
    return text
      .replace(/\s+/g, ' ')
      .replace(/([.!?])\s*/g, '$1\n\n')
      .replace(/([,;:])\s*/g, '$1 ')
      .replace(/\n\s+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/([^\n])\s*$/g, '$1\n')
      .trim();
  };

  // 提取标题（假设第一行是标题）
  const lines = result.text.split('\n');
  const title = lines.shift() || '';
  titleContent.innerHTML = `<h2>${processText(title)}</h2>`;

  // 处理主要内容（假设接下来的500个字符是主要内容）
  const mainText = lines.join('\n').substring(0, 500);
  mainContent.innerHTML = processText(mainText);

  // 处理其他内容
  const otherText = lines.join('\n').substring(500);
  otherContent.innerHTML = processText(otherText);

  // 如果内容太长，添加省略号
  if (result.text.length > 1000) {
    otherContent.innerHTML += '...';
  }

  // 添加批量下载按钮事件
  document.getElementById('download-all-images').addEventListener('click', () => {
    console.log('Download all images button clicked');
    downloadAllMedia(result.images, 'image');
  });
  document.getElementById('download-all-videos').addEventListener('click', () => {
    console.log('Download all videos button clicked');
    downloadAllMedia(result.videos, 'video');
  });
}

function getFileExtension(url) {
  // 从URL中提取文件扩展名
  const extension = url.split('.').pop().toLowerCase();
  // 如果扩展名是常见的图片或视频格式，则返回该扩展名，否则返回默认值
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'mp4', 'webm', 'ogg'];
  return validExtensions.includes(extension) ? extension : (url.includes('image') ? 'jpg' : 'mp4');
}

function downloadMedia(url, index, type) {
  const extension = getFileExtension(url);
  const filename = `${index}.${extension}`;
  console.log(`Attempting to download: ${url} as ${filename}`);
  chrome.runtime.sendMessage({
    action: "download",
    url: url,
    filename: filename
  }, (response) => {
    if (response.success) {
      console.log(`Download started with id: ${response.downloadId}`);
    } else {
      console.error(`Download failed: ${response.error}`);
    }
  });
}

function downloadAllMedia(urls, type) {
  console.log(`Attempting to download all ${type}s`);
  urls.forEach((url, index) => {
    downloadMedia(url, index + 1, type);
  });
}
