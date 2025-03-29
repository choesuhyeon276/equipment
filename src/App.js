import React, { useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./components/Login";
import MainHeader from "./components/MainHeader";
import Calendar from "./components/Calendar";
import RentalMethodPage from "./components/RentalMethodPage";
import ThingsNotePage from "./components/ThingsNotePage";
import LongTermRentalPage from "./components/LongTermRentalPage";
import ReservationMainPage from "./components/ReservationMainPage";
import AdminCameraManagement from "./components/AdminCameraManagement";
import CartPage from "./components/CartPage";
import Success from "./components/Success";
import MyPage from "./components/MyPage";

function App() {
  // 각 섹션에 대한 참조 생성
  const calendarRef = useRef(null);
  const rentalMethodRef = useRef(null);
  const thingsNoteRef = useRef(null);
  const longTermRentalRef = useRef(null);

  // 두 스크롤 함수를 하나로 통합
  // 1. ref 객체를 직접 받아서 처리하는 함수
  function scrollToRef(ref) {
    if (ref && ref.current) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }
  
  // 2. 섹션 ID를 문자열로 받아서 처리하는 함수
  function scrollToSection(sectionId) {
    const refMap = {
      'calendar-section': calendarRef,
      'rental-method-section': rentalMethodRef,
      'things-note-section': thingsNoteRef,
      'long-term-rental-section': longTermRentalRef
    };
    
    const ref = refMap[sectionId];
    if (ref && ref.current) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/main"
          element={
            <div style={{
              margin: '0',
              padding: '0',
              width: '100vw',
              backgroundColor: 'black',
              overflowX: 'hidden',
              scrollBehavior: 'smooth'
            }}>
              {/* MainHeader에는 ref 객체를 직접 사용하는 함수 전달 */}
              <MainHeader 
                scrollToSection={scrollToRef} 
                refs={{ 
                  calendar: calendarRef, 
                  rentalMethod: rentalMethodRef, 
                  thingsNote: thingsNoteRef, 
                  longTermRental: longTermRentalRef 
                }} 
              />

              <div ref={calendarRef} id="calendar-section">
                <Calendar />
              </div>
              <div ref={rentalMethodRef} id="rental-method-section">
                {/* RentalMethodPage에는 섹션 ID를 사용하는 함수 전달 */}
                <RentalMethodPage scrollToSection={scrollToSection} />
              </div>
              <div ref={thingsNoteRef} id="things-note-section">
                <ThingsNotePage />
              </div>
              <div ref={longTermRentalRef} id="long-term-rental-section">
                <LongTermRentalPage />
              </div>
            </div>
          }
        />
        <Route path="/reservationMainPage" element={<ReservationMainPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/success" element={<Success />} />
        <Route path="/reservation-main" element={<ReservationMainPage />} />
        <Route path="/mainheader" element={<MainHeader />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/thingsnote" element={<ThingsNotePage/>} />
        <Route path="/mypage" element={<MyPage/>} />


        <Route
          path="/cameramanagement"
          element={
            <div style={{
              margin: '0',
              padding: '0',
              width: '100vw',
              backgroundColor: 'black',
              minHeight: '100vh',
              overflowX: 'hidden'
            }}>
              <AdminCameraManagement />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;