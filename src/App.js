import React, { useRef, useState, useEffect } from "react";
import { Route, Routes, Navigate, useLocation, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import MainHeader from "./components/MainHeader";
import CalendarWithHeader from "./components/CalendarWithHeader";
// 독립형 캘린더 컴포넌트 (헤더 없는 버전)
import CalendarStandalone from "./components/CalendarStandalone"; 
import RentalMethodPage from "./components/RentalMethodPage";
import ThingsNotePage from "./components/ThingsNotePage";
import LongTermRentalPage from "./components/LongTermRentalPage";
import ReservationMainPage from "./components/reservation/ReservationMainPage";
import AdminCameraManagement from "./components/AdminCameraManagement";
import CartPage from "./components/cart";
import MyPage from "./pages/MyPage";
import AdminPage from "./components/AdminPage";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/responsive.css';
import ThingsNotePageWithHeader from "./components/ThingsNotePageWithHeader";

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function App() {
  const calendarRef = useRef(null);
  const rentalMethodRef = useRef(null);
  const thingsNoteRef = useRef(null);
  const longTermRentalRef = useRef(null);

  const [user, setUser] = useState(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const location = useLocation();
  const navigate = useNavigate();

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 사용자 인증 상태 확인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        localStorage.setItem('user', JSON.stringify({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        }));
        
        const userRef = doc(db, "user_profiles", currentUser.uid);
        try {
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
        } catch (error) {
          console.error("사용자 프로필 조회 중 오류:", error);
        }
      } else {
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [location.pathname, navigate]);

  function scrollToRef(ref) {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ 
        behavior: isMobile ? "auto" : "smooth", 
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
        behavior: isMobile ? "auto" : "smooth",
        block: "start" 
      });
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  // PC 버전에서 정렬을 맞추기 위한 스타일
  const sectionStyle = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto',
  };

  return (
    <div className="app-container">
      <GoogleOAuthProvider clientId={clientId}>
        
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={user ? <Navigate to="/main" /> : <Login isMobile={isMobile} />} />
          <Route
            path="/reservation"
            element={user ? <div className="page-container"><ReservationMainPage /></div> : <Navigate to="/login" state={{ from: "/reservation" }} />}
          />
          <Route
            path="/cart"
            element={user ? <div className="page-container"><CartPage /></div> : <Navigate to="/login" state={{ from: "/cart" }} />}
          />
          <Route
            path="/main"
            element={
              <div id="main-scroll-container" className="main-container">
                <MainHeader
                  scrollToSection={scrollToRef}
                  refs={{
                    calendar: calendarRef,
                    rentalMethod: rentalMethodRef,
                    thingsNote: thingsNoteRef,
                    longTermRental: longTermRentalRef
                  }}
                  isMobile={isMobile}
                />
                <div ref={calendarRef} id="calendar-section" style={!isMobile ? sectionStyle : {}}>
                  {/* 여기서는 헤더가 없는 독립형 Calendar 사용 */}
                  <CalendarStandalone isMobile={isMobile} />
                </div>
                <div ref={rentalMethodRef} id="rental-method-section" style={!isMobile ? sectionStyle : {}}>
                  <RentalMethodPage scrollToSection={scrollToSection} isMobile={isMobile} />
                </div>
                <div ref={thingsNoteRef} id="things-note-section" style={!isMobile ? sectionStyle : {}}>
                  <ThingsNotePage isMobile={isMobile} />
                </div>
                <div ref={longTermRentalRef} id="long-term-rental-section" style={!isMobile ? sectionStyle : {}}>
                  <LongTermRentalPage isMobile={isMobile} />
                  
                </div>
                {/* 모바일 버전에서는 위로가기 버튼 제거 */}
                {!isMobile && <ScrollToTopButton isMobile={false} />}
              </div>
            }
          />
          <Route 
            path="/reservationMainPage" 
            element={<div className="page-container"><ReservationMainPage /></div>} 
          />
          <Route 
            path="/reservation-main" 
            element={<div className="page-container"><ReservationMainPage /></div>} 
          />
          <Route 
            path="/mainheader" 
            element={<MainHeader isMobile={isMobile} />} 
          />

<Route 
  path="/thingsnote-with-header" 
  element={<div className="page-container"><ThingsNotePageWithHeader isMobile={isMobile} /></div>} 
/>

          <Route 
  path="/calendar-with-header" 
  element={<div className="page-container"><CalendarWithHeader isMobile={isMobile} /></div>} 
/>
          <Route 
            path="/thingsnote" 
            element={<div className="page-container"><ThingsNotePage isMobile={isMobile} /></div>} 
          />
          <Route 
            path="/mypage" 
            element={
              <div className="page-container">
                <MyPage />
              </div>
            } 
          />
          <Route 
            path="/admins" 
            element={<div className="page-container"><AdminPage isMobile={isMobile} /></div>} 
          />
          <Route
            path="/cameramanagement"
            element={
              <div className="admin-page-container">
                <AdminCameraManagement isMobile={isMobile} />
              </div>
            }
          />
        </Routes>

        <ToastContainer 
          position={isMobile ? "bottom-center" : "top-center"}
          autoClose={2500}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          pauseOnHover
          theme="dark"
          toastClassName="custom-toast"
          bodyClassName="custom-toast-body"
        />
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;