// RentalMethodPage.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function RentalMethodPage({ scrollToSection, isMobile }) {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, []);

  const navigateToReservation = () => {
    window.location.href = "/ReservationMainPage"
  };

  // 모바일 버전 렌더링
  if (isMobile) {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        flexDirection: 'column',
        padding: '20px 0',
      }}>
        {/* 제목 */}
        <div style={{
          textAlign: 'center',
          color: 'black',
          fontSize: '20px',
          fontWeight: '700',
          fontFamily: 'Pretendard',
          marginBottom: '24px',
          padding: '0 10px',
        }}>
          원하시는 대여 방법을 선택하세요
        </div>

        {/* 대여 방법 카드 컨테이너 - 수직 방향으로 변경 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          gap: '20px',
          padding: '0 15px',
        }}>
          {/* 단기 대여 */}
          <div onClick={navigateToReservation} style={{
            width: '100%',
            maxWidth: '350px',
            backgroundColor: '#24272C',
            textAlign: 'center',
            color: 'white',
            fontFamily: 'Pretendard',
            position: 'relative',
            padding: '20px 10px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
          }}>
            <div style={{
              marginLeft: '10px',
              width: '10px',
              height: '10px',
              backgroundColor: '#C70E0E',
              borderRadius: '50%',
              margin: '0 auto 5px auto',
            }}></div>
            <img src="/assets/short.png" alt="단기 대여" style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 10px auto',
            }} />
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '10px',
            }}>
              단기 대여
            </div>
            <p style={{
              fontSize: '16px',
              fontWeight: '100',
              lineHeight: '1.4',
              marginBottom: '15px',
            }}>
              If you would like a short term <br />
              rental, simply select the date <br />
              on the next screen.
            </p>
            <p style={{
              fontSize: '16px',
              fontWeight: '200',
            }}>1~8 days</p>
            <hr style={{
              width: '100%',
              height: '1px',
              backgroundColor: 'white',
              margin: '15px 0 0 0',
              border: 'none',
            }} />
          </div>

          {/* 장기 대여 */}
          <div onClick={() => scrollToSection('long-term-rental-section')} style={{
            width: '100%',
            maxWidth: '350px',
            backgroundColor: '#24272C',
            textAlign: 'center',
            color: 'white',
            fontFamily: 'Pretendard',
            position: 'relative',
            padding: '20px 10px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
          }}>
            <div style={{
              marginLeft: '10px',
              width: '10px',
              height: '10px',
              backgroundColor: '#C70E0E',
              borderRadius: '50%',
              margin: '0 auto 5px auto',
            }}></div>
            <img src="/assets/long.png" alt="장기 대여" style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 10px auto',
            }} />
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '10px',
            }}>
              장기 대여
            </div>
            <p style={{
              fontSize: '16px',
              fontWeight: '100',
              lineHeight: '1.4',
              marginBottom: '15px',
            }}>
              You must tell the professor <br />
              directly and attach the <br />
              relevant information.
            </p>
            <p style={{
              fontSize: '16px',
              fontWeight: '200',
            }}>9 days~</p>
            <hr style={{
              width: '100%',
              height: '1px',
              backgroundColor: 'white',
              margin: '15px 0 0 0',
              border: 'none',
            }} />
          </div>

          {/* 강의실 대여 */}
          <div style={{
            width: '100%',
            maxWidth: '350px',
            backgroundColor: '#24272C',
            textAlign: 'center',
            color: 'white',
            fontFamily: 'Pretendard',
            position: 'relative',
            padding: '20px 10px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
            <img src="/assets/Classroom.png" alt="강의실 대여" style={{
              width: '70px',
              height: '70px',
              margin: '0 auto 10px auto',
            }} />
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '10px',
            }}>
              강의실 대여
            </div>
            <p style={{
              fontSize: '16px',
              fontWeight: '100',
              lineHeight: '1.4',
              marginBottom: '15px',
            }}>
              If you would like to rent a <br />
              classroom, please go to the <br />
              office and fill out a list.
            </p>
            <p style={{
              fontSize: '16px',
              fontWeight: '200',
            }}>1 day</p>
            <hr style={{
              width: '100%',
              height: '1px',
              backgroundColor: 'white',
              margin: '15px 0 0 0',
              border: 'none',
            }} />
          </div>
        </div>
      </div>
    );
  }

  // 데스크탑 버전 렌더링 (원본 디자인 유지)
  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '528px',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      flexDirection: 'column',
      margin: '0',
      padding: '0'
    }}>
      {/* 제목 */}
      <div style={{
        position: 'absolute',
        top: '22px',
        textAlign: 'center',
        color: 'black',
        fontSize: '24px',
        fontWeight: '700',
        fontFamily: 'Pretendard'
      }}>
        원하시는 대여 방법을 선택하세요
      </div>

      {/* 대여 방법 카드 컨테이너 */}
      <div style={{
        position: 'absolute',
        top: '72px',
        display: 'flex',
        justifyContent: 'center',
        gap: '73px'
      }}>
        {/* 단기 대여 */}
        <div onClick={navigateToReservation} style={{
          width: '383px',
          height: '383px',
          backgroundColor: '#24272C',
          textAlign: 'center',
          color: 'white',
          fontFamily: 'Pretendard',
          position: 'relative',
          margin: '10px',
          cursor: 'pointer'  // 클릭 가능한 커서 모양
        }}>
          <div style={{
            position: 'absolute',
            top:'187px',
            left: '106px',
            width: '10px',
            height: '10px',
            backgroundColor: '#C70E0E',
            borderRadius: '50%'
          }}></div>
          <img src="/assets/short.png" alt="단기 대여" style={{
            position: 'absolute',
            width: '80px',
            height: '80px',
            top: '62px',
            left: '152px',
          }} />
          <div style={{
            position: 'absolute',
            fontSize: '36px',
            fontWeight: '700',
            left: '125px',
            top: '165px'
          }}>
            단기 대여
          </div>
          <p style={{
            position: 'absolute',
            marginTop: '4px',
            fontSize: '24px',
            fontWeight: '100',
            lineHeight: '26px',
            left: '43px',
            top: "217px"
          }}>
            If you would like a short term <br />
            rental, simply select the date <br />
            on the next screen.
          </p>
          <p style={{
            position: 'absolute',
            fontSize: '24px',
            fontWeight: '200',
            left: '142px',
            top: "340px"
          }}>1~8 days</p>
          <hr style={{
            width: '100%',
            height: '1px',
            backgroundColor: 'white',
            position: 'absolute',
            bottom: "45px"
          }} />
        </div>

        {/* 장기 대여 */}
        <div onClick={() => scrollToSection('long-term-rental-section')} style={{
          width: '383px',
          height: '383px',
          backgroundColor: '#24272C',
          textAlign: 'center',
          color: 'white',
          fontFamily: 'Pretendard',
          position: 'relative',
          margin: '10px',
          cursor: 'pointer'
        }}>
          <div style={{
            position: 'absolute',
            top: '187px',
            left: '106px',
            width: '10px',
            height: '10px',
            backgroundColor: '#C70E0E',
            borderRadius: '50%'
          }}></div>
          <img src="/assets/long.png" alt="장기 대여" style={{
            width: '80px',
            height: '80px',
            position: 'absolute',
            top: '62px',
            left: '152px',
          }} />
          <div style={{
            position: 'absolute',
            top: '165px',
            left: '125px',
            fontSize: '36px',
            fontWeight: '700'
          }}>
            장기 대여
          </div>
          <p style={{
            position: 'absolute',
            top: '217px',
            left: '55px',
            fontSize: '24px',
            fontWeight: '100',
            lineHeight: "29px"
          }}>
            You must tell the professor <br />
            directly and attach the <br />
            relevant information.
          </p>
          <p style={{
            position: 'absolute',
            fontSize: '24px',
            fontWeight: '200',
            left: '158px',
            top: "340px"
          }}>9 days~</p>
          <hr style={{
            width: '100%',
            height: '1px',
            backgroundColor: 'white',
            position: 'absolute',
            bottom: "45px"
          }} />
        </div>

        {/* 강의실 대여 */}
        <div style={{
          width: '383px',
          height: '383px',
          backgroundColor: '#24272C',
          textAlign: 'center',
          color: 'white',
          fontFamily: 'Pretendard',
          position: 'relative',
          margin: '10px',
        }}>
          <img src="/assets/Classroom.png" alt="강의실 대여" style={{
            width: '96px',
            height: '96px',
            position: 'absolute',
            top: '62px',
            left: '144px',
          }} />
          <div style={{
            position: 'absolute',
            top: '167px',
            left: '110px',
            fontSize: '36px',
            fontWeight: '700'
          }}>
            강의실 대여
          </div>
          <p style={{
            position: 'absolute',
            top: '217px',
            left: '53px',
            fontSize: '24px',
            fontWeight: '100',
            lineHeight: "29px"
          }}>
            If you would like to rent a <br />
            classroom, please go to the <br />
            office and fill out a list.
          </p>
          <p style={{
            position: 'absolute',
            fontSize: '24px',
            fontWeight: '200',
            left: '170px',
            top: "340px"
          }}>1 day</p>
          <hr style={{
            width: '100%',
            height: '1px',
            backgroundColor: 'white',
            position: 'absolute',
            bottom: "45px"
          }} />
        </div>
      </div>
    </div>
  );
}

export default RentalMethodPage;