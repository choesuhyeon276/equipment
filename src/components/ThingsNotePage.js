import React from 'react';

const ThingsNotePage = () => {
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
            <div style={{ fontWeight: '200', marginBottom: '5px', position:'absolute', left: '2px'

             }}>장비장 연락처</div>
            <div style={{ lineHeight: '1.2', position:'absolute', left: '2px', top: '30px',fontWeight: '200',}}>
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
            <div style={{ fontWeight: '200', position:'absolute', left: '300px'}}>대여일</div>

            <div style={{ lineHeight: '1.2', position:'absolute', left: '300px', top: '30px',fontWeight: '200',  }}>
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
            <div style={{ fontWeight: 'bold', marginBottom: '5px',fontWeight: '200', position:'absolute', left: '650px' }}>반납시</div>
            <div style={{ lineHeight: '1.2',fontWeight: '200', position:'absolute', left: '650px', top: '30px' }}>
              오픈 카카오로 장비장에게<br />
              모든 장비가 나온 반납사진 보내기<br />
              <a href="https://open.kakao.com/o/sqlOcF6g" style={{ color: '#fff' }}>https://open.kakao.com/o/sqlOcF6g</a>
            </div>
          </div>
          <div style={{
            width: '0px',
            height: '60px',
            backgroundColor: 'white',
          }} />
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', fontWeight: '200'}}>방학중 장비 대여 안내</div>
            <div style={{ lineHeight: '1.2',fontWeight: '200', }}>
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

        {/* 배경 이미지 디자인 */}
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
