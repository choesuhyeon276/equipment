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
import AdminSettingsPage from './components/AdminSettingsPage';


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
          {/* 기본 경로를 메인으로 변경 */}
          <Route path="/" element={<Navigate to="/main" replace />} />
          
          <Route path="/login" element={user ? <Navigate to="/main" /> : <Login isMobile={isMobile} />} />
          
          {/* 예약 페이지 - 로그인 필요한 기능 사용 시에만 로그인 요구 */}
          <Route
            path="/reservation"
            element={<div className="page-container"><ReservationMainPage user={user} /></div>}
          />
          
          {/* 장바구니 페이지 - 로그인 필요 */}
          <Route
            path="/cart"
            element={user ? <div className="page-container"><CartPage /></div> : <Navigate to="/login" state={{ from: "/cart" }} />}
          />
          
          {/* 관리자 설정 - 로그인 필요 */}
          <Route path="/admin-settings" element={user ? <AdminSettingsPage /> : <Navigate to="/login" state={{ from: "/admin-settings" }} />} />
          
          {/* 메인 페이지 - 로그인 없이도 접근 가능 */}
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
                  user={user}
                />
                <div ref={calendarRef} id="calendar-section" style={!isMobile ? sectionStyle : {}}>
                  {/* 여기서는 헤더가 없는 독립형 Calendar 사용 */}
                  <CalendarStandalone isMobile={isMobile} user={user} />
                </div>
                <div ref={rentalMethodRef} id="rental-method-section" style={!isMobile ? sectionStyle : {}}>
                  <RentalMethodPage scrollToSection={scrollToSection} isMobile={isMobile} user={user} />
                </div>
                <div ref={thingsNoteRef} id="things-note-section" style={!isMobile ? sectionStyle : {}}>
                  <ThingsNotePage isMobile={isMobile} user={user} />
                </div>
                <div ref={longTermRentalRef} id="long-term-rental-section" style={!isMobile ? sectionStyle : {}}>
                  <LongTermRentalPage isMobile={isMobile} user={user} />
                </div>
                {/* 모바일 버전에서는 위로가기 버튼 제거 */}
                {!isMobile && <ScrollToTopButton isMobile={false} />}
              </div>
            }
          />
          
          {/* 예약 메인 페이지 - 로그인 없이도 접근 가능 */}
          <Route 
            path="/reservationMainPage" 
            element={<div className="page-container"><ReservationMainPage user={user} /></div>} 
          />
          <Route 
            path="/reservation-main" 
            element={<div className="page-container"><ReservationMainPage user={user} /></div>} 
          />
          
          {/* 메인 헤더 - 로그인 없이도 접근 가능 */}
          <Route 
            path="/mainheader" 
            element={<MainHeader isMobile={isMobile} user={user} />} 
          />

          {/* 공지사항 페이지 - 로그인 없이도 접근 가능 */}
          <Route 
            path="/thingsnote-with-header" 
            element={<div className="page-container"><ThingsNotePageWithHeader isMobile={isMobile} user={user} /></div>} 
          />

          {/* 캘린더 페이지 - 로그인 없이도 접근 가능 */}
          <Route 
            path="/calendar-with-header" 
            element={<div className="page-container"><CalendarWithHeader isMobile={isMobile} user={user} /></div>} 
          />
          
          {/* 공지사항 페이지 - 로그인 없이도 접근 가능 */}
          <Route 
            path="/thingsnote" 
            element={<div className="page-container"><ThingsNotePage isMobile={isMobile} user={user} /></div>} 
          />
          
          {/* 마이페이지 - 로그인 필요 */}
          <Route 
            path="/mypage" 
            element={
              user ? (
                <div className="page-container">
                  <MyPage />
                </div>
              ) : (
                <Navigate to="/login" state={{ from: "/mypage" }} />
              )
            } 
          />
          
          {/* 관리자 페이지 - 로그인 필요 */}
          <Route 
            path="/admins" 
            element={user ? <div className="page-container"><AdminPage isMobile={isMobile} /></div> : <Navigate to="/login" state={{ from: "/admins" }} />} 
          />
          
          {/* 카메라 관리 페이지 - 로그인 필요 */}
          <Route
            path="/cameramanagement"
            element={
              user ? (
                <div className="admin-page-container">
                  <AdminCameraManagement isMobile={isMobile} />
                </div>
              ) : (
                <Navigate to="/login" state={{ from: "/cameramanagement" }} />
              )
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