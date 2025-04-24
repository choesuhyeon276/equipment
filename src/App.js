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

  useEffect(() => {
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    
    viewportMeta.content = 'width=1440, user-scalable=yes';
    
    return () => {
      viewportMeta.content = 'width=device-width, initial-scale=1.0';
    };
  }, []);

  if (loading) return null;

  return (
    <div style={{ 
      fontFamily: "Pretendard Variable, sans-serif",
      minWidth: "1440px"
    }}>
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
              id="main-scroll-container"
              style={{
                margin: "0",
                padding: "0",
                width: "100%",
                minWidth: "1440px",
                height: "100vh",
                overflowY: "auto",
                overflowX: "auto",
                backgroundColor: "#FFFFFF",
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
                <div ref={calendarRef} id="calendar-section" style={{ minWidth: "1440px" }}>
                  <Calendar />
                </div>
                <div ref={rentalMethodRef} id="rental-method-section" style={{ minWidth: "1440px" }}>
                  <RentalMethodPage scrollToSection={scrollToSection} />
                </div>
                <div ref={thingsNoteRef} id="things-note-section" style={{ minWidth: "1440px" }}>
                  <ThingsNotePage />
                </div>
                <div ref={longTermRentalRef} id="long-term-rental-section" style={{ minWidth: "1440px" }}>
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
                width: "100%",
                minWidth: "1440px",
                backgroundColor: "black",
                minHeight: "100vh",
                overflowX: "auto"
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











































/* 
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
import OrientationPrompt from "./components/OrientationPrompt"; // 추가된 컴포넌트
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

  // 모바일에서 PC와 동일한 화면 크기를 보여주기 위한 메타 태그 추가
  useEffect(() => {
    // 뷰포트 메타 태그 조작
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    
    // 너비를 1440px로 고정하고 사용자 확대/축소를 허용
    viewportMeta.content = 'width=1440, user-scalable=yes';
    
    // 페이지를 나갈 때 원래 설정으로 복원하기 위한 클린업 함수
    return () => {
      viewportMeta.content = 'width=device-width, initial-scale=1.0';
    };
  }, []);

  if (loading) return null;

  return (
    <div style={{ 
      fontFamily: "Pretendard Variable, sans-serif",
      minWidth: "1440px" // 전체 앱 최소 너비 설정
    }}>
      <GoogleOAuthProvider clientId={clientId}>
        <OrientationPrompt /> 
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
              id="main-scroll-container"
              style={{
                margin: "0",
                padding: "0",
                width: "100%",
                minWidth: "1440px", // 최소 너비 추가
                height: "100vh",
                overflowY: "auto",
                overflowX: "auto", // 가로 스크롤 허용
                backgroundColor: "#FFFFFF",
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
              
                <div ref={calendarRef} id="calendar-section" style={{ minWidth: "1440px" }}>
                  <Calendar />
                </div>
                <div ref={rentalMethodRef} id="rental-method-section" style={{ minWidth: "1440px" }}>
                  <RentalMethodPage scrollToSection={scrollToSection} />
                </div>
                <div ref={thingsNoteRef} id="things-note-section" style={{ minWidth: "1440px" }}>
                  <ThingsNotePage />
                </div>
                <div ref={longTermRentalRef} id="long-term-rental-section" style={{ minWidth: "1440px" }}>
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
                width: "100%",
                minWidth: "1440px", // 최소 너비 추가
                backgroundColor: "black",
                minHeight: "100vh",
                overflowX: "auto" // 가로 스크롤 허용
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

export default App;  */