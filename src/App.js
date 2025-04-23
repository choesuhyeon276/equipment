import React, { useRef, useState, useEffect } from "react";
import { Route, Routes, Navigate, useLocation, useNavigate } from "react-router-dom";
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
import AdminPage from "./components/AdminPage";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { GoogleOAuthProvider } from "@react-oauth/google";
import BackButton from "./components/BackButton";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function App() {
  const calendarRef = useRef(null);
  const rentalMethodRef = useRef(null);
  const thingsNoteRef = useRef(null);
  const longTermRentalRef = useRef(null);

  const [user, setUser] = useState(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userRef = doc(db, "user_profiles", currentUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          const isIncomplete =
            !data.phoneNumber ||
            !data.studentId ||
            !data.agreementURL;

          setProfileIncomplete(isIncomplete);

          if (isIncomplete && location.pathname !== "/mypage") {
            navigate("/mypage", { state: { showAgreementReminder: true } });
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [location.pathname, navigate]);

  function scrollToRef(ref) {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
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
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (loading) return null;

  return (
    <div style={{ fontFamily: "Pretendard Variable, sans-serif" }}>
      <GoogleOAuthProvider clientId={clientId}>
        <BackButton />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={user ? <Navigate to="/main" /> : <Login />} />

          <Route
            path="/reservation"
            element={user ? <ReservationMainPage /> : <Navigate to="/login" state={{ from: "/reservation" }} />}
          />
          <Route
            path="/cart"
            element={user ? <CartPage /> : <Navigate to="/login" state={{ from: "/cart" }} />}
          />

          <Route
            path="/main"
            element={
              <div 
              id="main-scroll-container" // ✅ 이거!
              style={{
                margin: "0",
                padding: "0",
                width: "100vw",
                height: "100vh",
                overflowY: "auto",   // ✅ 이거도 꼭 있어야 돼
                backgroundColor: "#FFFFFF",
                overflowX: "hidden",
                scrollBehavior: "smooth"
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
                  <div style={{
                    width: "100%",
                    height: "30px",
                    backgroundColor: "black",
                    color: "white",
                    textAlign: "center",
                    lineHeight: "100px",
                    fontSize: "16px"
                  }}></div>
                </div>
                <ScrollToTopButton />
                
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
                margin: "0",
                padding: "0",
                width: "100vw",
                backgroundColor: "black",
                minHeight: "100vh",
                overflowX: "hidden"
              }}>
                <AdminCameraManagement />
              </div>
            }
          />
        </Routes>

        <ToastContainer 
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        theme="dark"
      />
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;
