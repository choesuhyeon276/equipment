import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

const ImageWithPlaceholder = ({ camera, equipmentAvailability }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!camera.imageURL) {
      console.error(`카메라 ${camera.id}에 imageUrl이 없습니다`);
      setHasError(true);
      return;
    }

    // URL이 유효한지 기본 검사
    try {
      new URL(camera.imageURL); // URL이 유효한지 확인
      setImageSrc(camera.imageURL);
    } catch (e) {
      console.error(`유효하지 않은 URL: ${camera.imageURL}`, e);
      setHasError(true);
    }
  }, [camera.id, camera.imageURL]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setHasError(true);  
    setImageLoaded(true); // 오류가 발생해도 "로드됨" 상태로 처리
  };

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: equipmentAvailability?.[camera.id]?.available === false ? '#f0f0f0' : '#F5F5F5',
      position: 'relative',
      overflow: 'hidden' // 이미지가 넘치지 않도록 설정
    }}>
      {!imageLoaded && !hasError && (
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: '#E0E0E0',
          animation: 'pulse 1.5s infinite',
        }} />
      )}
      {hasError && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888'
        }}>
          <AlertCircle size={20} />
          <p style={{ 
            marginTop: '5px',
            fontSize: '10px'
          }}>이미지 없음</p>
        </div>
      )}
      {imageSrc && !hasError && (
        <img 
          src={imageSrc} 
          alt={camera.name || '장비 이미지'}
          loading="lazy"
          style={{ 
            maxWidth: '110%', // 이미지 크기 확대 (살짝 확대)
            maxHeight: '110%', // 이미지 크기 확대 (살짝 확대)
            objectFit: 'cover', // 이미지가 컨테이너를 꽉 채우도록 수정
            opacity: imageLoaded ? (equipmentAvailability?.[camera.id]?.available === false ? 0.4 : 1) : 0,
            transition: 'opacity 0.3s ease-in-out',
            filter: camera.status === 'rented' ? 'grayscale(70%)' : 'none'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      {equipmentAvailability?.[camera.id]?.available === false && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255, 0, 0, 0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '15px',
          fontWeight: 'bold',
          zIndex: 10,
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          fontSize: '10px'
        }}>
          대여 중
        </div>
      )}
    </div>
  );
};

export default ImageWithPlaceholder;