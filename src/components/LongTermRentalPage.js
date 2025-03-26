import React from 'react';
import FileUpload from './FileUpload';

const LongTermRentalPage = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'black',
      overflow: 'hidden'
    }}>
      <div style={{
        width: '1440px',
        height: '1080px',
        position: 'relative',
        backgroundColor: '#fff',
        color: '#000',
        fontFamily: 'Pretendard, sans-serif',
        border: '2px solid #fff',
        overflow: 'hidden'
      }}>
        {/* 카메라 이미지 */}
        <img src={`${process.env.PUBLIC_URL}/assets/Camera.png`} alt="Camera" style={{
          position: 'absolute',
          top: '30px',
          left: '-10px',
          width: '800px',
        }} />

        {/* 제목 및 설명 */}
        <div style={{
          position: 'absolute',
          top: '260px',
          right: '110px',
          textAlign: 'right'
        }}>
          <div style={{ fontSize: '66px', fontWeight: '900', lineHeight: '66px', textAlign: 'left' }}>Long-term<br />equipment rental.</div>
          <div style={{ fontSize: '60px', fontWeight: '200', marginTop: '10px',textAlign: 'left', lineHeight: '60px' }}>김숭현 교수님의 승인이<br />필요합니다</div>
        </div>

       {/* 버튼 영역 */}
<div style={{
  position: 'absolute',
  bottom: '400px',
  right: '215px',
  display: 'flex',
  gap: '20px'
}}>
  <button style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px', // 아이콘과 텍스트 간격
    width: '219px',
    height: '73px',
    backgroundColor: '#DFDFDF',
    borderRadius: '8px',
    fontSize: '36px', // 글자 크기
    fontWeight: 'bold', // 볼드체
    fontFamily: 'Pretendard, sans-serif', // 프리텐다드 폰트
  }}>
    <FileUpload />
  </button>
  <button style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px', // 아이콘과 텍스트 간격
    width: '219px',
    height: '73px',
    backgroundColor: '#DFDFDF',
    borderRadius: '8px',
    fontSize: '36px', // 글자 크기
    fontWeight: 'bold', // 볼드체
    fontFamily: 'Pretendard, sans-serif', // 프리텐다드 폰트
  }}>
    <img src={`${process.env.PUBLIC_URL}/assets/Check Mark.png`} alt="예약하기" style={{
      width: '36px', // 아이콘 크기도 맞춰줌
      height: '36px'
    }} />
    예약하기
  </button>
</div>



        {/* 하단 안내사항 */}
        <div style={{
          position: 'absolute',
          bottom: '200px',
          left: '70px',
          fontSize: '24px',
          lineHeight: '26px',
          fontWeight: '200'
        }}>
          ※ 촬영 관련 장비 / 카메라, 렌즈, 조명, 스탠드, 삼각대, 배터리는 대여가 불가능합니다<br />
          ※ 김숭현 교수님 연락처로 직접 연락하셔야 하며, 대화 내용을 첨부하셔야 합니다<br />
          ※ 필수 요소: 대여 품목, 대여 일시, 대여 목적
        </div>

        {/* 하단 연락처 */}
        <div style={{
          position: 'absolute',
          bottom: '200px',
          right: '293px',
          fontSize: '24px',
          lineHeight: '1',
          fontWeight:"400",
          textAlign:"right"
        }}>
          TEL<br />
          E-MAIL
        </div>

        <div style={{
          position: 'absolute',
          bottom: '223px',
          right: '118px',
          fontSize: '24px',
          lineHeight: '1',
          fontWeight:"200",
          letterSpacing: "-1.5px"
        }}>
          010 - 3034 - 3317<br />
        </div>

        <div style={{
          position: 'absolute',
          bottom: '202px',
          right: '115px',
          fontSize: '24px',
          lineHeight: '1',
          fontWeight:"200",
          letterSpacing: "-1px"
        }}>

          soong@khu.ac.kr
        </div>



        {/* 흰색 가로선 */}
        <div style={{
          position: 'absolute',
          bottom: '195px',
          left: '985px',
          width: '340px',
          height: '2px',
          backgroundColor: 'black'
        }}></div>
      </div>
    </div>
  );
};

export default LongTermRentalPage;
