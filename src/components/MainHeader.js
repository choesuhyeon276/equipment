import React, { useState, useEffect } from 'react';
import { auth, signInWithPopup, provider } from "../firebase/firebase";

function MainHeader({ scrollToSection }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 로그인 상태 확인
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 로그인 처리 함수
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      alert("로그인되었습니다");
    } catch (error) {
      console.error("로그인 실패: ", error.message);
    }
  };

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      await auth.signOut();
      alert("로그아웃되었습니다.");
      setIsLoggedIn(false);
    } catch (error) {
      console.error("로그아웃 실패: ", error.message);
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'black',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      border: '3px solid black'
    }}>
      <div style={{
        minWidth: '1440px',
        height: '1080px',
        backgroundColor: '#F1F1F1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        margin: 'auto',
        overflow: 'hidden',
      }}>
        {/* KHDC 로고 및 텍스트 */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img src="/assets/KHDC.png" alt="KHDC Logo" style={{
            width: '96px',
            height: '54px',
            objectFit: 'contain',
            display: 'block',
            margin: '0',
            padding: '0',
          }} />
          <span style={{
            position: 'absolute',
            left: "81px",
            color: 'black',
            fontSize: '16px',
            fontWeight: '500',
            whiteSpace: 'nowrap'
          }}>
            Kyunghee Digital contents
          </span>
        </div>

        {/* 로그인/로그아웃 버튼 */}
        <div style={{
          position: 'absolute',
          top: '40px',
          right: '60px',
          color: 'black',
          fontSize: '18px',
          fontWeight: '400',
          cursor: 'pointer',
          zIndex: '1'
        }}>
          {isLoggedIn ? (
            <span onClick={handleLogout}>Log out</span>
          ) : (
            <span onClick={handleLogin}>Log in</span>
          )}
        </div>

        {/* 배경 텍스트 */}
        <div style={{
          position: 'absolute',
          top: '14%',
          left: '51%',
          transform: 'translate(-50%, -50%)',
          color: '#CCCCCC',
          fontSize: '190px',
          fontWeight: 'bold',
          opacity: '0.4',
          zIndex: '0',
          whiteSpace: 'nowrap'
        }}>
          Equipment Rental
        </div>

        {/* 메인 타이틀 */}
        <div style={{
          position: "absolute",
          top:"160px",
          textAlign: 'right',
          marginLeft: '670px',
          marginBottom: '15px',
          zIndex: '1'
        }}>
          <h1 style={{
            color: 'black',
            fontSize: '170px',
            fontWeight: '900',
            lineHeight: '115px',
            textAlign: 'right'
          }}>
            장비대여 
          </h1>
        </div>
        <div style={{
          position:"absolute",
          top:"288px",
          textAlign: 'right',
          marginLeft: '61px',
          zIndex: '1'
        }}>
          <h1 style={{
            color: 'black',
            fontSize: '170px',
            fontWeight: '900',
            lineHeight: '180px'
          }}>
            디지털 콘텐츠학과
          </h1>
        </div>

        {/* 부제목 */}
        <div style={{
          position: "absolute",
          marginLeft: '200px',
          marginTop: '80px'
        }}>
          <h2 style={{
            color: 'black',
            fontSize: '90px',
            fontWeight: '100',
            lineHeight: '110px'
          }}>
            Department of Digital <br /> Contents
          </h2>
        </div>

        {/* 구분선 */}
        <hr style={{
          position: 'absolute',
          width: '820px',
          height: '3px',
          backgroundColor: 'black',
          marginLeft: '380px',
          marginTop: '100px'
        }} />

        {/* 안내 문구 */}
        <div style={{
          marginLeft: '0px',
          marginTop: '100px'
        }}>
          <p style={{
            position: 'absolute',
            color: 'black',
            fontSize: '18px',
            textAlign: 'left',
            marginLeft: '-650px',
            marginTop: '200px',
            fontWeight: '200'
          }}>
            "프로젝터", "타블렛" 분류의 장비는 장비 대여신청을 받지 않습니다.<br />
            학과 사무실 방문을 통해 대여가 가능합니다.
          </p>
        </div>

        {/* 버튼 그룹 */}
        <div style={{
          marginTop: '40px',
          display: 'flex',
          gap: '20px',
          justifyContent: 'center'
        }}>
          <button style={{
            position: 'absolute',
            right: '370px',
            top: '765px',
            backgroundColor: '#D3D3D3',
            color: 'black',
            padding: '5px 13px',
            borderRadius: '8px',
            fontSize: '30px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <img src="/assets/check mark.png" alt="Reserve Icon" style={{
              width: '40px',
              height: '40px'
            }} />
            예약하기
          </button>
          <button onClick={() => scrollToSection('calendar-section')} style={{
            position: 'absolute',
            backgroundColor: '#D3D3D3',
            color: 'black',
            padding: '5px 13px',
            borderRadius: '8px',
            fontSize: '30px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: "-900px",
            top: "765px"
          }}>
            <img src="/assets/calendar.png" alt="Calendar Icon" style={{
              width: '35px',
              height: '35px'
            }} />
            캘린더
          </button>
        </div>
      </div>
    </div>
  );
}

export default MainHeader;
