import React, { useRef, useState, useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Login from "./components/Login";
import MainHeader from "./components/MainHeader";
import Calendar from "./components/Calendar";
import RentalMethodPage from "./components/RentalMethodPage";
import ThingsNotePage from "./components/ThingsNotePage";
import LongTermRentalPage from "./components/LongTermRentalPage";
import ReservationMainPage from "./components/ReservationMainPage";
import AdminCameraManagement from "./components/AdminCameraManagement";
import CartPage from "./components/CartPage";
import MyPage from "./components/MyPage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebaseConfig";
import AdminPage from "./components/AdminPage";


// ✅ GIS용 Provider import
import { GoogleOAuthProvider } from "@react-oauth/google";

// ✅ 환경 변수에서 client ID 불러오기
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function App() {
  const calendarRef = useRef(null);
  const rentalMethodRef = useRef(null);
  const thingsNoteRef = useRef(null);
  const longTermRentalRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  function scrollToRef(ref) {
    if (ref && ref.current) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  function scrollToSection(sectionId) {
    const refMap = {
      "calendar-section": calendarRef,
      "rental-method-section": rentalMethodRef,
      "things-note-section": thingsNoteRef,
      "long-term-rental-section": longTermRentalRef,
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
    <GoogleOAuthProvider clientId={clientId}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={user ? <Navigate to="/main" /> : <Login />} />

        <Route 
          path="/reservation" 
          element={user ? <ReservationMainPage /> : <Navigate to="/login" state={{ from: '/reservation' }} />} 
        />
        <Route 
          path="/cart" 
          element={user ? <CartPage /> : <Navigate to="/login" state={{ from: '/cart' }} />} 
        />

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
        <Route path="/reservation-main" element={<ReservationMainPage />} />
        <Route path="/mainheader" element={<MainHeader />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/thingsnote" element={<ThingsNotePage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/admins" element={<AdminPage />} />
       

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
    </GoogleOAuthProvider>
  );
}

export default App;
