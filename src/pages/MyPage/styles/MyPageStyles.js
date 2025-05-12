// src/pages/MyPage/styles/MyPageStyles.js

/**
 * MyPage의 반응형 스타일링
 * @param {boolean} isMobile - 모바일 여부
 * @returns {Object} - 스타일 객체
 */
export const useMyPageStyles = (isMobile) => {
  return {
    // 메인 컨테이너
    container: {
      position: 'relative',
      width: isMobile ? '100%' : '1440px',
      height: '100%',
      minHeight: '1000px',
      background: '#FFFFFF',
      margin: '0 auto',
      fontFamily: 'Pretendard, sans-serif',
      color: '#000000',
      paddingBottom: isMobile ? '80px' : '180px',
      overflow: 'auto',
      padding: isMobile ? '0 10px' : '0'
    },
    
    // 헤더 영역
    header: {
      position: 'sticky',
      top: '20px',
      left: '20px',
      right: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: '45px',
      zIndex: 10
    },
    
    // 컨텐츠 레이아웃 (사이드바 + 메인 컨텐츠)
    contentLayout: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '20px' : '30px',
      paddingTop: isMobile ? '80px' : '130px',
      paddingLeft: isMobile ? '10px' : '50px',
      paddingRight: isMobile ? '10px' : '50px',
    },
    
    // 탭 네비게이션
    tabNavigation: {
      display: 'flex',
      borderBottom: '1px solid #e0e0e0',
      marginBottom: '20px',
      overflowX: isMobile ? 'auto' : 'visible',
      whiteSpace: isMobile ? 'nowrap' : 'normal',
      WebkitOverflowScrolling: 'touch',
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
      '&::-webkit-scrollbar': {
        display: 'none'
      }
    },
    
    // 탭 버튼
    tabButton: (isActive) => ({
      padding: isMobile ? '10px 15px' : '10px 20px',
      fontWeight: isActive ? 'bold' : 'normal',
      borderBottom: isActive ? '2px solid #000' : 'none',
      cursor: 'pointer',
      fontSize: isMobile ? '14px' : '16px'
    }),
    
    // 알림 모달
    noticeModal: {
      position: 'fixed',
      top: isMobile ? '10px' : '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: isMobile ? 'calc(100% - 20px)' : 'auto',
      minWidth: isMobile ? 'auto' : '500px',
      maxWidth: isMobile ? 'auto' : '700px',
      zIndex: 1000,
      backgroundColor: '#fff8e1',
      border: '1px solid #ffecb3',
      padding: isMobile ? '15px' : '24px',
      borderRadius: '8px',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
      color: '#5d4037',
      animation: 'fadeInDown 0.5s ease forwards'
    },
    
    // 사이드바
    sidebar: {
      width: isMobile ? '100%' : '300px',
      flexShrink: 0
    },
    
    // 메인 컨텐츠
    mainContent: {
      flex: 1
    },
    
    // 프로필 카드
    profileCard: {
      border: '1px solid #E0E0E0',
      borderRadius: '10px',
      padding: '20px',
      marginBottom: '20px'
    },
    
    // 대여 아이템 카드
    rentalItemCard: {
      border: '1px solid #E0E0E0',
      borderRadius: '8px',
      padding: isMobile ? '12px' : '15px',
      marginBottom: '15px',
      backgroundColor: (isHistory) => isHistory ? '#f9f9f9' : '#fff'
    },
    
    // 버튼 스타일
    primaryButton: {
      padding: '8px 12px',
      backgroundColor: '#4285f4',
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: isMobile ? '13px' : '14px'
    },
    
    dangerButton: {
      padding: '8px 12px',
      backgroundColor: '#ff5252',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      marginTop: '10px',
      cursor: 'pointer',
      fontSize: isMobile ? '13px' : '14px'
    },
    
    secondaryButton: {
      padding: '8px 12px',
      backgroundColor: '#e0e0e0',
      color: '#333',
      borderRadius: '5px',
      cursor: 'pointer',
      display: 'inline-block',
      fontSize: isMobile ? '13px' : '14px'
    },
    
    // 파일 업로드 영역
    fileUploadArea: {
      width: '100%',
      padding: '10px 0',
      marginBottom: '10px'
    },
    
    // 에니메이션 스타일
    animations: `
      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translate(-50%, -20px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `
  };
};