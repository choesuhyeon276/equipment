import React, { useEffect } from "react";

function Calendar() {
  useEffect(() => {
    const calendarId = "837ac43ba185f6e8b56e97f1f7e15ecbb103bc44c111e6b8c81fe28ec713b8e9@group.calendar.google.com";
    const embedUrl = `https://calendar.google.com/calendar/embed?src=${calendarId}&ctz=Asia/Seoul&mode=MONTH&showTitle=0&showPrint=0&showCalendars=0&showTabs=0&showDate=1&showNav=1&showTz=0&color=%23444444&bgcolor=%23FFFFFF`;

    const calendarIframe = document.getElementById("google-calendar");
    if (calendarIframe) {
      calendarIframe.src = embedUrl;
    }
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minheight: '100vh',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      
     
    }}>
      <div style={{
        minWidth: '1440px',  // 화면 고정 너비
        height: '940px',    // 화면 고정 높이
        backgroundColor: '#0F1316',  // 흰색 상자 배경
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        margin: 'auto',
        overflow: 'hidden'
      }}>
        {/* KHDC 로고 배경 */}
        <div style={{
          position: 'absolute',
          width: '110%',
          height: '100%',
          scale: "200%",
          left: '320px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: '0.5',
          zIndex: '2',
          overflow: 'hidden',
        }}>
          <img
            src="/assets/KHDC2.png"
            alt="KHDC Logo"
            style={{
              width: '2000px',
              height: 'auto',
              objectFit: 'contain',
              /* filter: "grayscale(100%)", */
            }}
          />
        </div>

        {/* 타이틀 영역 */}
        <div style={{
          textAlign: 'center',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          zIndex: '2'
        }}>
          <h2 style={{
            position: 'absolute',
            top: '10px',
            left: '710px',
            transform: 'translateX(-50%)',
            fontSize: '90px',
            fontWeight: '100',
            color: 'white',
            whiteSpace: 'nowrap',
          }}>Equipment Rental Status Calendar</h2>


          <h3 style={{
            position: 'absolute',
            top: '120px',
            left: '200px',
            transform: 'translateX(-50%)',
            fontSize: '90px',
            fontWeight: '100',
            color: 'white',
          }}></h3>
        </div>

        {/* 구글 캘린더 */}
        <div style={{
          marginTop: '30px',
          backgroundColor: 'transparent',
          borderRadius: '20px',
          padding: '20px',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          zIndex: '3'
        }}>
          <iframe
            id="google-calendar"
            title="Google Calendar"
            style={{
              width: '100%',
              height: '750px',
              border: '0',
              borderRadius: '20px',
              filter: "grayscale(50%)",
              margin: "-1px",
              padding: "1px",
              backgroundColor: "transparent",
            }}
          ></iframe>
        </div>
      </div>
    </div>
  );
}

export default Calendar;