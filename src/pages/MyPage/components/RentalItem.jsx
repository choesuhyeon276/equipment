// src/pages/MyPage/components/RentalItem.jsx
import React from 'react';
import { ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { formatKoreanDateTime, formatFullKoreanDateTime } from '../utils/formatters';

const RentalItem = ({
  item,
  isHistory = false,
  expandedItems,
  toggleExpand,
  imageUrls,
  handleReturnRequest,
  handleReturnImageUpload,
  uploadedReturnImages,
  cancelReservation,
  isMobile
}) => {
  // renderRentalItem 함수 수정 - 제목 없이 카테고리와 화살표를 같은 줄에 배치
 const isExpanded = expandedItems[item.id] || false;
  
  return (
    <div 
      key={item.id} 
      style={{
        border: '1px solid #E0E0E0',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px',
        backgroundColor: isHistory ? '#f9f9f9' : '#fff'
      }}
    >
      {/* 첫 번째 줄: 상품명/카테고리 정보 */}
      <div style={{
        marginBottom: '8px',
        cursor: 'pointer'
      }}>
        <p style={{ 
          color: '#666', 
          margin: '0',
          fontSize: '13px',
          fontWeight: 'bold'
        }}>
          {item.name}
          {item.brand && ` | ${item.brand}`}
          {item.category && ` | ${item.category}`}
          {item.condition && ` | ${item.condition}`}
        </p>
      </div>
      
      {/* 두 번째 줄: 썸네일과 화살표 아이콘을 같은 줄에 배치 */}
      <div 
        style={{ 
          display: 'flex',
          alignItems: 'flex-start',
          cursor: 'pointer'
        }}
        onClick={() => toggleExpand(item.id)}
      >
        {/* 썸네일 */}
        <div style={{ 
          width: '70px', 
          height: '70px', 
          marginRight: '15px',
          backgroundColor: '#F5F5F5',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 0,
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          {imageUrls[item.id] ? (
            <img 
              src={imageUrls[item.id]} 
              alt={item.name} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }} 
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#999', fontSize: '11px' }}>
              No Image
            </div>
          )}
        </div>

        {/* 대여 정보 */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* "n번째 대여입니다"를 첫 줄로 이동 */}
          <p style={{ 
            fontSize: '12px', 
            margin: '0 0 5px 0',
            color: '#555'
          }}>
            📦 이 사용자의 {item.rentalCount}번째 대여입니다
          </p>
          
          {/* 대여 시작/반납 예정 정보 */}
          <div style={{ 
            fontSize: '12px',
            margin: '0'
          }}>
            <div style={{ marginBottom: '3px' }}>
              <span style={{ fontWeight: 'bold', marginRight: '5px' }}>대여 시작:</span>
              {formatKoreanDateTime(item.startDateTime)}
            </div>
            <div>
              <span style={{ fontWeight: 'bold', marginRight: '5px' }}>반납 예정:</span>
              {formatKoreanDateTime(item.endDateTime)}
            </div>
          </div>
        </div>
        
        {/* 화살표 아이콘 - 썸네일과 같은 줄에 위치 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start',
          padding: '5px'
        }}>
          {isExpanded ? 
            <ChevronUp size={18} color="#666" /> : 
            <ChevronDown size={18} color="#666" />
          }
        </div>
      </div>
      
      {/* 확장된 정보 영역 */}
      {isExpanded && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #e0e0e0',
          fontSize: '13px'
        }}>
          <p style={{ margin: '0 0 5px 0' }}><strong>예약 일시:</strong> {formatFullKoreanDateTime(item.approvedAt)}</p>
          {item.purpose && <p style={{ margin: '0 0 5px 0' }}><strong>대여 목적:</strong> {item.purpose}</p>}
          {item.description && <p style={{ margin: '0 0 5px 0' }}><strong>설명:</strong> {item.description}</p>}
          {item.notes && <p style={{ margin: '0 0 5px 0' }}><strong>비고:</strong> {item.notes}</p>}

          {/* 장비 리스트 */}
          {item.items && item.items.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ 
                marginBottom: '8px', 
                fontSize: '14px',
                fontWeight: 'bold',
                margin: '5px 0 8px 0'
              }}>
                장비 리스트
              </h4>
              
              {item.items.map((equip, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  marginBottom: '10px',
                  background: '#f9f9f9',
                  padding: '8px',
                  borderRadius: '6px'
                }}>
                  <div style={{ marginRight: '12px' }}>
                    {equip.imageURL ? (
                      <img 
                        src={equip.imageURL}
                        alt={equip.name}
                        style={{ 
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover', 
                          borderRadius: '4px' 
                        }}
                      />
                    ) : (
                      <div style={{ 
                        width: '60px', 
                        height: '60px',
                        backgroundColor: '#E0E0E0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        borderRadius: '4px',
                        fontSize: '10px'
                      }}>
                        <span>이미지 없음</span>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '12px' }}>
                    <p style={{ margin: '0 0 3px 0' }}><strong>장비 이름:</strong> {equip.name}</p>
                    {equip.condition && <p style={{ margin: '0 0 3px 0' }}><strong>상태:</strong> {equip.condition}</p>}
                    {equip.category && <p style={{ margin: '0 0 3px 0' }}><strong>분류:</strong> {equip.category}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 버튼 및 상태 표시 부분 */}
          {item.status === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // 이벤트 버블링 방지
                cancelReservation(item.id);
              }}
              style={{
                padding: '6px 10px',
                backgroundColor: '#ff5252',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                marginTop: '8px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              대여 신청 취소
            </button>
          )}

          {item.status === 'returned' && item.returnStatus && (
            <div style={{ 
              padding: '6px 10px', 
              backgroundColor: item.returnStatus === 'late' ? '#ffebee' : '#e8f5e9',
              color: item.returnStatus === 'late' ? '#d32f2f' : '#2e7d32',
              borderRadius: '5px',
              fontSize: '12px',
              display: 'inline-block',
              marginTop: '8px'
            }}>
              <strong>반납 상태:</strong> {item.returnStatus === 'late' ? '연체' : '정상 반납'}
            </div>
          )}

          {item.status === 'active' && (
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginTop: '8px',
              flexWrap: 'wrap'
            }}>
              <label style={{
                padding: '6px 10px',
                backgroundColor: '#000',
                color: '#fff',
                borderRadius: '5px',
                cursor: 'pointer',
                display: 'inline-block',
                fontSize: '12px',
                fontWeight: '500'
              
              }}
              onClick={(e) => e.stopPropagation()} // 이벤트 버블링 방지
              >
                반납 사진 업로드
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    e.stopPropagation(); // 이벤트 버블링 방지
                    handleReturnImageUpload(e, item.id);
                  }} 
                  style={{ display: 'none' }}
                />
              </label>

              <button
                onClick={(e) => {
                  e.stopPropagation(); // 이벤트 버블링 방지
                  handleReturnRequest(item.id);
                }}
                disabled={!uploadedReturnImages[item.id]}
                style={{
                  padding: '6px 10px',
                  backgroundColor: uploadedReturnImages[item.id] ? '#4285f4' : '#cccccc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: uploadedReturnImages[item.id] ? 'pointer' : 'not-allowed',
                  fontSize: '12px'
                }}
              >
                반납 요청
              </button>
            </div>
          )}

          {isHistory && item.returnStatus === 'late' && (
            <div style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: '#ffebee',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <p style={{ 
                color: '#c62828', 
                fontWeight: 'bold',
                margin: '0 0 3px 0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <AlertTriangle size={14} style={{ marginRight: '5px' }} />
                연체 정보: {item.lateDays || 0}일 연체
              </p>
              
              {Number(item.penaltyPoints) > 0 && (
                <p style={{ 
                  color: '#c62828',
                  margin: '0'
                }}>
                  부과된 벌점: {item.penaltyPoints}점
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RentalItem;