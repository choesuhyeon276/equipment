// src/pages/MyPage/components/RentalTabs.jsx
import React from 'react';
import RentalItem from './RentalItem';

const RentalTabs = ({
  activeTab,
  setActiveTab,
  currentRentals,
  pendingRentals,
  returnRequestedRentals,
  rentalHistory,
  expandedItems,
  toggleExpand,
  imageUrls,
  handleReturnRequest,
  handleReturnImageUpload,
  uploadedReturnImages,
  cancelReservation,
  isMobile
}) => {
  return (
    <div style={{ flex: 1 }}>
      {/* 탭 네비게이션 */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #e0e0e0',
        marginBottom: '20px',
        overflowX: isMobile ? 'auto' : 'visible',
        WebkitOverflowScrolling: 'touch'
      }}>
        <TabButton 
          label="현재 대여 장비" 
          isActive={activeTab === 'current'} 
          onClick={() => setActiveTab('current')}
          isMobile={isMobile}
        />
        <TabButton 
          label="대여 신청 중" 
          isActive={activeTab === 'pending'} 
          onClick={() => setActiveTab('pending')}
          isMobile={isMobile}
        />
        <TabButton 
          label="반납 요청 중" 
          isActive={activeTab === 'returning'} 
          onClick={() => setActiveTab('returning')}
          isMobile={isMobile}
        />
        <TabButton 
          label="대여 이력" 
          isActive={activeTab === 'history'} 
          onClick={() => setActiveTab('history')}
          isMobile={isMobile}
        />
      </div>

      {/* 현재 대여 탭 */}
      {activeTab === 'current' && (
        <div>
          {currentRentals.length === 0 ? (
            <EmptyState message="현재 대여 중인 장비가 없습니다." isMobile={isMobile} />
          ) : (
            <div>
              {currentRentals.map(item => (
                <RentalItem
                  key={item.id}
                  item={item}
                  expandedItems={expandedItems}
                  toggleExpand={toggleExpand}
                  imageUrls={imageUrls}
                  handleReturnRequest={handleReturnRequest}
                  handleReturnImageUpload={handleReturnImageUpload}
                  uploadedReturnImages={uploadedReturnImages}
                  isMobile={isMobile}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 대여 신청 중 탭 */}
      {activeTab === 'pending' && (
        <div>
          {pendingRentals.length === 0 ? (
            <EmptyState message="대여 신청 중인 장비가 없습니다." isMobile={isMobile} />
          ) : (
            pendingRentals.map(item => (
              <RentalItem
                key={item.id}
                item={item}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
                imageUrls={imageUrls}
                cancelReservation={cancelReservation}
                isMobile={isMobile}
              />
            ))
          )}
        </div>
      )}

      {/* 반납 요청 중 탭 */}
      {activeTab === 'returning' && (
        <div>
          {returnRequestedRentals.length === 0 ? (
            <EmptyState message="반납 요청 중인 장비가 없습니다." isMobile={isMobile} />
          ) : (
            returnRequestedRentals.map(item => (
              <RentalItem
                key={item.id}
                item={item}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
                imageUrls={imageUrls}
                isMobile={isMobile}
              />
            ))
          )}
        </div>
      )}

      {/* 대여 이력 탭 */}
      {activeTab === 'history' && (
        <div>
          {rentalHistory.length === 0 ? (
            <EmptyState message="대여 이력이 없습니다." isMobile={isMobile} />
          ) : (
            <div>
              {rentalHistory.map(item => (
                <RentalItem
                  key={item.id}
                  item={item}
                  isHistory={true}
                  expandedItems={expandedItems}
                  toggleExpand={toggleExpand}
                  imageUrls={imageUrls}
                  isMobile={isMobile}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 탭 버튼 컴포넌트
const TabButton = ({ label, isActive, onClick, isMobile }) => (
  <div 
    style={{ 
      padding: isMobile ? '10px 12px' : '10px 20px',
      fontWeight: isActive ? 'bold' : 'normal',
      borderBottom: isActive ? '2px solid #000' : 'none',
      cursor: 'pointer',
      fontSize: isMobile ? '14px' : '16px',
      whiteSpace: 'nowrap',
      color: isActive ? '#000000' : '#666666'
    }}
    onClick={onClick}
  >
    {label}
  </div>
);

// 비어있을 때 표시할 컴포넌트
const EmptyState = ({ message, isMobile }) => (
  <div style={{ 
    padding: '30px', 
    textAlign: 'center',
    color: '#666',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontSize: isMobile ? '14px' : '16px'
  }}>
    {message}
  </div>
);

export default RentalTabs;