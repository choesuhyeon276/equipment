// src/pages/MyPage/utils/imageUtils.js

/**
 * 이미지 파일을 압축하는 함수
 * @param {File} file - 압축할 이미지 파일
 * @param {number} maxWidth - 최대 너비 (기본값: 800px)
 * @param {number} quality - 품질 (0~1, 기본값: 0.7)
 * @returns {Promise<Blob>} - 압축된 이미지 Blob
 */
export const compressImage = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scaleFactor = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scaleFactor;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Blob 생성 실패'));
      }, 'image/jpeg', quality);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 이미지 URL을 가져오는 함수
 * @param {Array} items - 아이템 배열
 * @returns {Object} - 아이템 ID를 키로, 이미지 URL을 값으로 갖는 객체
 */
export const getItemImagesUrls = (items) => {
  const urls = {};
  
  for (const item of items) {
    if (item.items && item.items.length > 0) {
      const firstItem = item.items[0];
      if (firstItem.imageURL) {
        urls[item.id] = firstItem.imageURL;
      } else {
        urls[item.id] = null;
      }
    }
  }
  
  return urls;
};