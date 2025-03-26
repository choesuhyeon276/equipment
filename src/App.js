import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
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

function scrollToSection(id) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function App() {
  return (
    <Router>
      <Routes>
        {/* 로그인 페이지 */}
        <Route path="/login" element={<Login />} />

        {/* 메인 페이지를 root 경로로 */}
        <Route
          path="/"
          element={
            <div style={{
              margin: '0',
              padding: '0',
              width: '100vw',
              backgroundColor: 'black',
              overflowX: 'hidden',
              scrollBehavior: 'smooth'
            }}>
              <MainHeader scrollToSection={scrollToSection} />
              <div id="calendar-section">
                <Calendar />
              </div>
              <div id="rental-method-section">
                <RentalMethodPage scrollToSection={scrollToSection} />
              </div>
              <div id="things-note-section">
                <ThingsNotePage />
              </div>
              <div id="long-term-rental-section">
                <LongTermRentalPage />
              </div>
            </div>
          }
        />

        {/* 기존 라우트들 */}
        <Route path="/reservationMainPage" element={<ReservationMainPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/success" element={<Success />} />
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