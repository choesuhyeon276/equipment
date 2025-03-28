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

function App() {
  // 각 섹션에 대한 참조 생성
  const calendarRef = useRef(null);
  const rentalMethodRef = useRef(null);
  const thingsNoteRef = useRef(null);
  const longTermRentalRef = useRef(null);

  // 스크롤 이동 함수
  function scrollToSection(ref) {
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
              {/* scrollToSection 함수를 MainHeader에 전달 */}
              <MainHeader scrollToSection={scrollToSection} refs={{ calendarRef, rentalMethodRef, thingsNoteRef, longTermRentalRef }} />

              <div ref={calendarRef} id="calendar-section">
                <Calendar />
              </div>
              <div ref={rentalMethodRef} id="rental-method-section">
                <RentalMethodPage scrollToSection={() => scrollToSection(thingsNoteRef)} />
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
