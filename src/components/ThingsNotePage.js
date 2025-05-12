import React from 'react';

const ThingsNotePage = ({ isMobile }) => {
  // 모바일 버전 렌더링 - 향상된 디자인
  if (isMobile) {
    return (
      <div style={{
        width: '100%',
        backgroundColor: '#000',
        overflow: 'hidden',
        minHeight: '100vh',
      }}>
        <div style={{
          width: '100%',
          position: 'relative',
          color: '#ffffff',
          fontFamily: 'Pretendard, sans-serif',
          padding: '20px 15px 60px 15px',
        }}>
          {/* 중앙 "Things Note:" 제목 - 모바일 */}
          <div style={{
            marginTop: '20px',
            marginBottom: '10px',
            fontSize: '48px',
            fontWeight: 'bold',
            lineHeight: '1',
            background: 'linear-gradient(to right, #ffffff, #aaaaaa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 10px rgba(255,255,255,0.2)',
            textAlign: 'center',
          }}>
            Things Note:
          </div>

          {/* 카드형 정보 영역 - 모바일 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            marginTop: '20px',
          }}>
            {/* 카드 1 */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
              borderLeft: '3px solid #ff9500',
            }}>
              <div style={{ 
                fontWeight: '600', 
                marginBottom: '8px', 
                color: '#ff9500',
                fontSize: '16px',
              }}>장비장 연락처</div>
              <div style={{ 
                lineHeight: '1.5', 
                fontWeight: '300',
                fontSize: '14px',
              }}>
                김나영<br />
                010-7667-9373
              </div>
            </div>

            {/* 카드 2 */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
              borderLeft: '3px solid #00bcd4',
            }}>
              <div style={{ 
                fontWeight: '600', 
                marginBottom: '8px', 
                color: '#00bcd4',
                fontSize: '16px',
              }}>대여일</div>
              <div style={{ 
                lineHeight: '1.5', 
                fontWeight: '300',
                fontSize: '14px',
              }}>
                • 대여일 1일 전에는 신청하기<br />
                • 당일 대여 불가<br />
                • 평일 9:00 - 17:00 동안 장비 수령 가능
              </div>
            </div>

            {/* 카드 3 */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
              borderLeft: '3px solid #f44336',
            }}>
              <div style={{ 
                fontWeight: '600', 
                marginBottom: '8px', 
                color: '#f44336',
                fontSize: '16px',
              }}>반납시</div>
              <div style={{ 
                lineHeight: '1.5', 
                fontWeight: '300',
                fontSize: '14px',
              }}>
                마이페이지에 현재 대여 장비란에<br />
                장비가 나온 반납사진 첨부하여 반납신청하기
              </div>
            </div>

            {/* 카드 4 */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
              borderLeft: '3px solid #4caf50',
            }}>
              <div style={{ 
                fontWeight: '600', 
                marginBottom: '8px', 
                color: '#4caf50',
                fontSize: '16px',
              }}>방학중 장비 대여 안내</div>
              <div style={{ 
                lineHeight: '1.5', 
                fontWeight: '300',
                fontSize: '14px',
              }}>
                • 장비 교육 수료 여부와 없이<br />
                • 디지털콘텐츠학과 학생이면 대여가 가능합니다.<br />
                • 사무실은 9:00 - 15:00시까지 운영됩니다.
              </div>
            </div>
          </div>

          {/* 배경 이미지 제거됨 */}
        </div>
      </div>
    );
  }

  // 데스크탑 버전 렌더링 (원본 디자인 유지)
  return (
    <div style={{
      width: '100vw',
      height: '910px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      overflow: 'hidden', // 잘리게 처리
    }}>
      <div style={{
        width: '1440px',
        height: '1080px',
        position: 'relative',
        backgroundColor: '#000',
        color: '#ffffff',
        fontFamily: 'Pretendard, sans-serif',
      }}>
        {/* 상단 정보영역 */}
        <div style={{
          position: 'absolute',
          top: '100px',
          left: '60px',
          right: '60px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '16px',
          paddingBottom: '20px',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}>
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '1px',
            backgroundColor: 'white',
            top: '25px'
          }}></div>

          <div>
            <div style={{ fontWeight: '200', marginBottom: '5px', position: 'absolute', left: '2px' }}>장비장 연락처</div>
            <div style={{ lineHeight: '1.2', position: 'absolute', left: '2px', top: '30px', fontWeight: '200', }}>
              김나영<br />
              010-7667-9373
            </div>
          </div>
          <div style={{
            fontWeight: '200',
            width: '0px',
            height: '4px',
            backgroundColor: 'white',
            margin: '0 0px'
          }} />
          <div>
            <div style={{ fontWeight: '200', position: 'absolute', left: '300px' }}>대여일</div>
            <div style={{ lineHeight: '1.2', position: 'absolute', left: '300px', top: '30px', fontWeight: '200', }}>
              대여일 1일 전에는 신청하기<br />
              당일 대여 불가<br />
              평일 9:00 - 17:00 동안 장비 수령 가능
            </div>
          </div>
          <div style={{
            width: '0px',
            height: '60px',
            backgroundColor: 'white',
            margin: '0 20px'
          }} />
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', fontWeight: '200', position: 'absolute', left: '650px' }}>반납시</div>
            <div style={{ lineHeight: '1.2', fontWeight: '200', position: 'absolute', left: '650px', top: '30px' }}>
              마이페이지에 현재 대여 장비란에<br />
              장비가 나온 반납사진 첨부하여 반납신청하기<br />
            </div>
          </div>
          <div style={{
            width: '0px',
            height: '60px',
            backgroundColor: 'white',
          }} />
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', fontWeight: '200' }}>방학중 장비 대여 안내</div>
            <div style={{ lineHeight: '1.2', fontWeight: '200', }}>
              장비 교육 수료 여부와 없이<br />
              디지털콘텐츠학과 학생이면 대여가 가능합니다.<br />
              사무실은 9:00 - 15:00시까지 운영됩니다.
            </div>
          </div>
        </div>

        {/* 중앙 "Things Note:" 제목 */}
        <div style={{
          position: 'absolute',
          left: '60px',
          bottom: '250px',
          fontSize: '320px',
          fontWeight: 'bold',
          lineHeight: '77%'
        }}>
          Things<br />
          Note:
        </div>

        {/* 배경 이미지 디자인 - PC 버전은 유지 */}
        <div style={{
          position: 'absolute',
          right: '-50px',
          bottom: '-50px',
          width: '900px',
          height: '900px',
          opacity: '1',
          backgroundImage: `url(${process.env.PUBLIC_URL}/assets/warning.png)`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          userSelect: 'none',
          pointerEvents: 'none'
        }} />
      </div>
    </div>
  );
};

export default ThingsNotePage;  