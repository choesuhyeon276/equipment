import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MainHeader from "./components/MainHeader";
import Calendar from "./components/Calendar";
import RentalMethodPage from "./components/RentalMethodPage";
import ThingsNotePage from "./components/ThingsNotePage";
import LongTermRentalPage from "./components/LongTermRentalPage";
import ReservationMainPage from "./components/ReservationMainPage";

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
        {/* 기본 페이지 라우트 */}
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
        
        {/* ReservationMainPage는 완전히 별도로 렌더링 */}
        <Route path="/reservationMainPage" element={<ReservationMainPage />} />
      </Routes>
    </Router>
  );
}

export default App;
