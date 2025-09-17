import React, { useState } from 'react';
import { ShoppingCart, AlertCircle, PlusCircle, Info, X } from 'lucide-react';

// ImageWithPlaceholder 컴포넌트 (임시로 여기서 정의)
const ImageWithPlaceholder = ({ camera, equipmentAvailability }) => {
  const [imageError, setImageError] = useState(false);
  
  if (imageError || !camera.imageURL) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        color: '#666'
      }}>
        {camera.name}
      </div>
    );
  }
  
  return (
    <img 
      src={camera.imageURL}
      alt={camera.name}
      style={{ 
        width: '100%', 
        height: '100%', 
        objectFit: 'cover' 
      }}
      onError={() => setImageError(true)}
    />
  );
};

// mountColors 정의 (실제 환경에서는 import)
const mountColors = {
  // Canon 마운트
  'RF': '#FF6B35',
  'EF': '#F7931E',
  'EF-S': '#E65100',
  'EF-M': '#FF8A65',
  
  // Sony 마운트
  'E-mount': '#1976D2',
  'E': '#1976D2',
  'FE': '#1565C0',
  'A-mount': '#0D47A1',
  
  // Nikon 마운트
  'Z-mount': '#9C27B0',
  'Z': '#9C27B0',
  'F-mount': '#4CAF50',
  '니콘 F': '#9C27B0',
  'DX': '#388E3C',
  'FX': '#2E7D32',
  
  // 기타 주요 마운트
  'L-mount': '#795548',
  'L': '#795548',
  'MFT': '#607D8B',
  'M43': '#607D8B',
  'Micro Four Thirds': '#607D8B',
  
  // Fujifilm
  'X-mount': '#E91E63',
  'X': '#E91E63',
  'GFX': '#C2185B',
  
  // Panasonic
  'Lumix': '#FF5722',
  
  // 기타 브랜드
  'PL': '#00BCD4',
  'C-mount': '#009688',
  'CS-mount': '#00695C',
  'B4': '#3F51B5',
  'ENG': '#673AB7',
  
  // 필터/액세서리 마운트
  '67mm': '#FFC107',
  '77mm': '#FF9800',
  '82mm': '#FF5722',
  '95mm': '#9E9E9E',
  
  // 배터리 타입
  'LP-E6': '#8BC34A',
  'LP-E6N': '#689F38',
  'LP-E6NH': '#558B2F',
  'NP-FZ100': '#2196F3',
  'NP-W235': '#1976D2',
  'EN-EL15': '#4CAF50',
  
  // 일반적인 용어들
  '풀프레임': '#9C27B0',
  '크롭': '#FF9800',
  '시네마': '#424242',
  '스튜디오': '#795548',
  'DSLR': '#607D8B',
  '미러리스': '#3F51B5',
  
  '기타': '#757575'
};

// 내부사진 모달 컴포넌트
const InternalImageModal = ({ isOpen, onClose, equipment }) => {
  if (!isOpen || !equipment?.internalImageURL) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1001
          }}
        >
          <X size={16} />
        </button>
        
        <div style={{
          padding: '15px',
          borderBottom: '1px solid #eee',
          backgroundColor: '#f9f9f9'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>{equipment.name} - 내부사진</h3>
        </div>
        
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <img 
            src={equipment.internalImageURL}
            alt={`${equipment.name} 내부사진`}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
        </div>
      </div>
    </div>
  );
};

const EquipmentGrid = ({
  currentCameras = [],
  selectedCameraId,
  setSelectedCameraId,
  equipmentAvailability = {},
  rentalDate,
  returnDate,
  handleAddToCart,
  handleAddBattery,
  handleAddSDCard,
  isMobile = false
}) => {
  const [internalImageModal, setInternalImageModal] = useState({
    isOpen: false,
    equipment: null
  });

  // 내부사진 모달 열기
  const openInternalImageModal = (equipment) => {
    setInternalImageModal({
      isOpen: true,
      equipment
    });
  };

  // 내부사진 모달 닫기
  const closeInternalImageModal = () => {
    setInternalImageModal({
      isOpen: false,
      equipment: null
    });
  };

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
    
    return (
      <div 
        key={camera.id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '6px',
          position: 'relative',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'visible'
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
          
          {/* 내부사진 정보 아이콘 */}
          {camera.internalImageURL && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openInternalImageModal(camera);
              }}
              style={{
                position: 'absolute',
                top: '5px',
                right: camera.condition === '수리' || camera.status === 'rented' ? '50px' : '5px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '8px',
                zIndex: 7
              }}
            >
              <Info size={10} />
            </button>
          )}
          
          {/* 수리 중/대여 중 상태 */}
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
          
          {/* 마운트 태그 */}
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
              maxWidth: '75%',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}>
              {mountArray[0]}
            </div>
          )}
          
          {/* 선택했을 때 담기 버튼 표시 */}
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
              
              {/* 배터리 & SD카드 버튼 */}
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
        
        {/* 제품 정보 */}
        <div style={{ 
          padding: '5px 2px 3px',
          overflow: 'visible'
        }}>
          {/* 제품명 */}
          <div style={{
            fontSize: '10px',
            color: '#444',
            marginBottom: '2px',
            fontWeight: '600',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word'
          }}>
            {camera.name}
          </div>
          
          {/* 가격 */}
          <div style={{
            fontWeight: 'bold',
            fontSize: '11px',
            marginBottom: '2px',
            color: '#222',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word'
          }}>
            {camera.dailyRentalPrice}
          </div>
          
          {/* 상태 정보 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            fontSize: '9px',
            color: '#666',
            gap: '4px',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word'
          }}>
            <AlertCircle
              size={8} 
              style={{ 
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

  // 데스크탑 카메라 카드 렌더링
  const renderDesktopCamera = (camera) => {
    const isAvailable = camera.status !== 'rented' && 
      camera.condition !== '수리' && 
      !(equipmentAvailability[camera.id] && !equipmentAvailability[camera.id].available);

    return (
      <div 
        key={camera.id} 
        style={{
          border: camera.status === 'rented' ? '1px solid #e74c3c' : 
                (equipmentAvailability[camera.id] && !equipmentAvailability[camera.id].available) ? 
                '1px solid #f39c12' : '1px solid #E0E0E0',
          borderRadius: '8px',
          overflow: 'visible',
          position: 'relative',
          transition: 'transform 0.3s, box-shadow 0.3s',
          transform: selectedCameraId === camera.id ? 'scale(1.05)' : 'scale(1)',
          boxShadow: selectedCameraId === camera.id ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
          backgroundColor: equipmentAvailability?.[camera.id]?.available === false ? '#fef2f2' : 
                        (equipmentAvailability[camera.id] && !equipmentAvailability[camera.id].available) ? 
                        '#fff9e6' : 'white',
          zIndex: selectedCameraId === camera.id ? 10 : 1
        }}
        onMouseEnter={() => setSelectedCameraId(camera.id)}
        onMouseLeave={() => setSelectedCameraId(null)}
      >
        {/* 장비 가용성 표시 */}
        {rentalDate && returnDate && equipmentAvailability[camera.id] && !equipmentAvailability[camera.id]?.available && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: '#f39c12',
            color: 'white',
            padding: '5px 10px',
            fontSize: '12px',
            fontWeight: 'bold',
            textAlign: 'center',
            zIndex: 10,
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}>
            사용 불가
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
            fontSize: '14px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word'
          }}>
            특이사항: {camera.issues}
          </div>
        )}

        {/* 내부사진 정보 아이콘 - 데스크탑 */}
        {camera.internalImageURL && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openInternalImageModal(camera);
            }}
            style={{
              position: 'absolute',
              top: '10px',
              right: (camera.status === 'rented' || camera.condition === '수리') ? '110px' : 
                     (equipmentAvailability[camera.id] && !equipmentAvailability[camera.id].available) ? '110px' : '10px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 11,
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            <Info size={14} />
          </button>
        )}
        
        {(camera.status === 'rented' || camera.condition === '수리') && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: '#e74c3c',
            color: 'white',
            padding: '5px 10px',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 10,
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}>
            {camera.status === 'rented' ? '대여 중' : '수리 중'}
          </div>
        )}

        {/* Camera Image */}
        <div style={{
          height: '250px',
          overflow: 'hidden',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px'
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
              overflowWrap: 'anywhere',
              wordBreak: 'break-word'
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
            (selectedCameraId === camera.id ? '#f9f9f9' : 'white'),
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px'
        }}>
          {/* 이름/가격 영역: 이름 줄바꿈 허용 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ 
              fontWeight: 'bold',
              color: camera.status === 'rented' ? '#e74c3c' : 'black',
              fontSize: '14px',
              flex: 1,
              overflowWrap: 'anywhere',
              wordBreak: 'break-word'
            }}>
              {camera.name}
            </span>
            <span style={{ 
              color: '#666', 
              fontSize: '14px',
              flexShrink: 0
            }}>
              {camera.dailyRentalPrice}
            </span>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginTop: '5px',
            color: '#666',
            fontSize: '12px',
            gap: '6px',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word'
          }}>
            <AlertCircle
              size={14} 
              style={{ 
                color: camera.condition === '수리' ? 'red' : 
                    camera.condition === '정상' ? 'green' : 
                    camera.condition === '주의' ? 'orange' : '#666' }} />
            <span>상태: {camera.condition}</span>
          </div>
        </div>

        {/* Cart Button on Hover */}
        {selectedCameraId === camera.id && isAvailable && (
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
              fontSize: '14px',
              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px',
              zIndex: 15
            }}
            onClick={() => handleAddToCart(camera)}
          >
            <ShoppingCart size={20} style={{ marginRight: '10px' }} />
            장바구니 담기
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(3, minmax(0, 1fr))' : 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: isMobile ? '1px' : '20px',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'visible',
        padding: isMobile ? '0' : '0'
      }}>
        {currentCameras.map((camera, index) => (
          <div key={camera.id} style={{ 
            width: '100%', 
            boxSizing: 'border-box',
            overflow: 'visible',
            padding: isMobile ? '0' : '0'
          }}>
            {isMobile ? renderMobileCamera(camera, index) : renderDesktopCamera(camera)}
          </div>
        ))}
      </div>

      {/* 내부사진 모달 */}
      <InternalImageModal
        isOpen={internalImageModal.isOpen}
        onClose={closeInternalImageModal}
        equipment={internalImageModal.equipment}
      />
    </>
  );
};

export default EquipmentGrid;