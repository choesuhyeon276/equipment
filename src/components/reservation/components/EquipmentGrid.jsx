import React from 'react';
import { ShoppingCart, AlertCircle, PlusCircle } from 'lucide-react';
import ImageWithPlaceholder from './ImageWithPlaceholder';
import { mountColors } from '../ReservationMainPage';

const EquipmentGrid = ({
  currentCameras,
  selectedCameraId,
  setSelectedCameraId,
  equipmentAvailability,
  rentalDate,
  returnDate,
  handleAddToCart,
  handleAddBattery,
  handleAddSDCard,
  isMobile
}) => {
  // 모바일 카메라 카드 렌더링
  const renderMobileCamera = (camera, index) => {
    const isAvailable = camera.status !== 'rented' && 
      camera.condition !== '수리' && 
      !(equipmentAvailability[camera.id] && !equipmentAvailability[camera.id].available);
    
    // 마운트 정보 가져오기
    const mountArray = Array.isArray(camera.mountType)
      ? camera.mountType
      : typeof camera.mountType === 'string'
        ? camera.mountType.split(',')
            .map(s => s.trim().replace(/^"|"$/g, ''))
            .filter(Boolean)
        : [];
    
    // 무신사 스타일의 컴팩트한 제품 카드 - 개선된 클릭 UI
    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '6px',
          position: 'relative',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
        onClick={() => setSelectedCameraId(camera.id === selectedCameraId ? null : camera.id)}
      >
        {/* 이미지 섹션 */}
        <div style={{ 
          position: 'relative', 
          height: '95px', 
          width: '100%',
          overflow: 'hidden'
        }}>
          <ImageWithPlaceholder 
            camera={camera} 
            equipmentAvailability={equipmentAvailability}
          />
          
          {/* 수리 중/대여 중 상태를 오른쪽 상단으로 이동 */}
          {!isAvailable && (
            <div style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              backgroundColor: 'rgba(255, 0, 0, 0.8)',
              color: 'white',
              padding: '2px 5px',
              borderRadius: '4px',
              fontSize: '9px',
              fontWeight: 'bold',
              zIndex: 6
            }}>
              {camera.condition === '수리' ? '수리 중' : '대여 중'}
            </div>
          )}
          
          {/* 마운트 태그를 왼쪽 상단으로 이동 */}
          {mountArray.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '5px',
              left: '5px',
              backgroundColor: mountColors[mountArray[0]] || mountColors['기타'],
              color: 'white',
              borderRadius: '4px',
              padding: '2px 4px',
              fontSize: '8px',
              fontWeight: '500',
              zIndex: 5,
              maxWidth: '70%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {mountArray[0]}
            </div>
          )}
          
          {/* 선택했을 때 담기 버튼 표시 - 디자인 개선 */}
          {selectedCameraId === camera.id && isAvailable && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              padding: '6px'
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(camera);
                }}
                style={{
                  width: '100%',
                  height: '26px',
                  backgroundColor: '#1a6cff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  marginBottom: camera.batteryModel || camera.recommendSDCard ? '4px' : '0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
              >
                <ShoppingCart size={11} />
                장바구니 담기
              </button>
              
              {/* 배터리 & SD카드 버튼 - 디자인 개선 */}
              {(camera.batteryModel || camera.recommendSDCard) && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '4px'
                }}>
                  {camera.batteryModel && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddBattery(camera);
                      }}
                      style={{
                        flex: 1,
                        height: '24px',
                        backgroundColor: '#f8f8f8',
                        color: '#333',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      <PlusCircle size={10} color="#3498db" />
                      배터리
                    </button>
                  )}
                  
                  {camera.recommendSDCard && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddSDCard(camera);
                      }}
                      style={{
                        flex: 1,
                        height: '24px',
                        backgroundColor: '#f8f8f8',
                        color: '#333',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      <PlusCircle size={10} color="#27ae60" />
                      SD카드
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 제품 정보 - 폰트 굵기 강화 */}
        <div style={{ 
          padding: '5px 2px 3px',
          overflow: 'hidden'
        }}>
          {/* 제품명 - 글자 굵기 강화 */}
          <div style={{
            fontSize: '10px',
            color: '#444',
            marginBottom: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontWeight: '600' // 글자 굵기 강화
          }}>
            {camera.name}
          </div>
          
          {/* 가격 - 글자 굵기 강화 */}
          <div style={{
            fontWeight: 'bold',
            fontSize: '11px',
            marginBottom: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#222' // 색상 더 진하게
          }}>
            {camera.dailyRentalPrice}
          </div>
          
          {/* 상태 정보 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            fontSize: '9px',
            color: '#666',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            <AlertCircle
              size={8} 
              style={{ 
                marginRight: '3px',
                color: camera.condition === '수리' ? 'red' : 
                      camera.condition === '정상' ? 'green' : 
                      camera.condition === '주의' ? 'orange' : '#666' 
              }} 
            />
            <span>상태: {camera.condition}</span>
          </div>
        </div>
      </div>
    );
  };

  // 데스크탑 카메라 카드 렌더링 - 기존 디자인 유지
  const renderDesktopCamera = (camera) => (
    <div 
      key={camera.id} 
      style={{
        border: camera.status === 'rented' ? '1px solid #e74c3c' : 
              (equipmentAvailability[camera.id] && !equipmentAvailability[camera.id].available) ? 
              '1px solid #f39c12' : '1px solid #E0E0E0',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        transition: 'transform 0.3s, box-shadow 0.3s',
        transform: selectedCameraId === camera.id ? 'scale(1.05)' : 'scale(1)',
        boxShadow: selectedCameraId === camera.id ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
        backgroundColor: equipmentAvailability?.[camera.id]?.available === false ? '#fef2f2' : 
                      (equipmentAvailability[camera.id] && !equipmentAvailability[camera.id].available) ? 
                      '#fff9e6' : 'white'
      }}
      onMouseEnter={() => setSelectedCameraId(camera.id)}
      onMouseLeave={() => setSelectedCameraId(null)}
    >
      {/* 장비 가용성 표시 */}
      {rentalDate && returnDate && equipmentAvailability[camera.id] && !equipmentAvailability[camera.id].available && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '-30px',
          backgroundColor: '#f39c12',
          color: 'white',
          transform: 'rotate(45deg)',
          padding: '5px 35px',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          zIndex: 10,
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
        </div> 
      )}

      {/* 내 장바구니에 있는 항목 표시 */}
      {equipmentAvailability[camera.id] && 
      equipmentAvailability[camera.id].myCartItems && 
      equipmentAvailability[String(camera.id)].myCartItems.length > 0 && ( 
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: '#3498db',
          color: 'white',
          padding: '5px 10px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 10,
          borderRadius: '5px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
          장바구니에 있음
        </div>
      )}

      {/* Issues Overlay */}
      {selectedCameraId === camera.id && camera.issues && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          zIndex: 20,
          textAlign: 'center',
          fontSize: '14px'
        }}>
          특이사항: {camera.issues}
        </div>
      )}
      
      {(camera.status === 'rented' || camera.condition === '수리') && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '-30px',
          backgroundColor: '#e74c3c',
          color: 'white',
          transform: 'rotate(45deg)',
          padding: '5px 35px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 10,
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
          {camera.status === 'rented' ? '수리 중' : '수리 중'}
        </div>
      )}

      {/* Camera Image */}
      <div style={{
        height: '250px'
      }}>
        <ImageWithPlaceholder 
          camera={camera} 
          equipmentAvailability={equipmentAvailability}
        />
      </div>
      
      {(() => {
        const mountArray = Array.isArray(camera.mountType)
          ? camera.mountType
          : typeof camera.mountType === 'string'
            ? camera.mountType
                .split(',')
                .map(s => s.trim().replace(/^"|"$/g, ''))
                .filter(Boolean)
            : [];

        // 카테고리에 따라 태그 라벨 변경
        const labelType = camera.category === 'Battery' ? '배터리' : '마운트';

        return mountArray.map((type, idx) => (
          <div key={idx} style={{
            position: 'absolute',
            top: `${10 + idx * 26}px`,
            left: '10px',
            backgroundColor: mountColors[type] || mountColors['기타'],
            color: 'white',
            borderRadius: '10px',
            padding: '4px 8px',
            fontSize: '10px',
            fontWeight: '500',
            zIndex: 5,
            whiteSpace: 'nowrap'
          }}>
            {type} {labelType}
          </div>
        ));
      })()}

      {/* 배터리 & SD카드 버튼은 hover 시에만 표시 */}
      <div style={{
        position: 'absolute',
        top: '210px',
        right: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '5px',
        zIndex: 5,
        visibility: selectedCameraId === camera.id ? 'visible' : 'hidden',
        opacity: selectedCameraId === camera.id ? 1 : 0,
        transform: selectedCameraId === camera.id ? 'translateY(0)' : 'translateY(5px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease'
      }}>
        {camera.batteryModel && (
          <button 
            onClick={() => handleAddBattery(camera)}
            style={{
              padding: '4px 10px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            + 배터리
          </button>
        )}
        {camera.recommendSDCard && (
          <button 
            onClick={() => handleAddSDCard(camera)}
            style={{
              padding: '4px 10px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            + SD카드
          </button>
        )}
      </div>

      {/* Camera Details */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: camera.status === 'rented' ? '#fef2f2' : 
          (selectedCameraId === camera.id ? '#f9f9f9' : 'white')
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <span style={{ 
            fontWeight: 'bold',
            color: camera.status === 'rented' ? '#e74c3c' : 'black',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '150px'
          }}>
            {camera.name}
          </span>
          <span style={{ 
            color: '#666', 
            fontSize: '14px'
          }}>
            {camera.dailyRentalPrice}
          </span>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginTop: '5px',
          color: '#666',
          fontSize: '12px'
        }}>
          <AlertCircle
            size={14} 
            style={{ 
              marginRight: '5px',
              color: camera.condition === '수리' ? 'red' : 
                  camera.condition === '정상' ? 'green' : 
                  camera.condition === '주의' ? 'orange' : '#666' }} />
          <span>상태: {camera.condition}</span>
        </div>
      </div>

      {/* Cart Button on Hover */}
      {selectedCameraId === camera.id && camera.status === 'available' && (
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '10px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onClick={() => handleAddToCart(camera)}
        >
          <ShoppingCart size={20} style={{ marginRight: '10px' }} />
          장바구니 담기
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(3, minmax(0, 1fr))' : 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: isMobile ? '1px' : '20px', // 여백 더 줄이기
      width: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden',
      padding: isMobile ? '0' : '0' // 여백 제거
    }}>
      {currentCameras.map((camera, index) => (
        <div key={camera.id} style={{ 
          width: '100%', 
          boxSizing: 'border-box',
          overflow: 'hidden',
          padding: isMobile ? '0' : '0' // 여백 제거
        }}>
          {isMobile ? renderMobileCamera(camera, index) : renderDesktopCamera(camera)}
        </div>
      ))}
    </div>
  );
};

export default EquipmentGrid;


