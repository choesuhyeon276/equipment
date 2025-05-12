import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseConfig';
import { ChevronUp } from 'lucide-react';

// CSS 파일 임포트 추가
import './styles/musinsa-style.css';

// 컴포넌트 임포트
import Header from './components/Header';
import CategorySidebar from './components/CategorySidebar';
import DateTimeSelector from './components/DateTimeSelector';
import SearchInput from './components/SearchInput';
import EquipmentGrid from './components/EquipmentGrid';
import Pagination from './components/Pagination';
import SearchCategoryLayout from './components/SearchCategoryLayout';
import InfiniteScroll from './components/InfiniteScroll';

// 유틸리티 함수 임포트
import { checkEquipmentAvailability } from './utils/equipmentUtils';
import { addToCart, fetchCartItemCount } from './utils/cartUtils';
import { formatToKSTDateString, generateTimeOptions, generateReturnTimeOptions } from './utils/dateUtils.js';

// 색상 정의 (공통으로 사용되는 상수)
export const mountColors = {
  'EF': '#e74c3c',       // 빨강
  'FE': '#195c89',       // 파랑
  '니콘 F': '#7d4798',   // 보라
  '': '#1abc9c',         // 민트
  'EF-S': '#f39c12',     // 주황
  '기타': '#299616'      // 회색 (기본)
};

const ReservationMainPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadedFileURL = location.state?.uploadedFileName || localStorage.getItem('uploadedFileURL');
  const isLongTerm = Boolean(uploadedFileURL);
  const maxDay = isLongTerm ? 30 : 8;
  
  // 사용자 및 장비 상태
  const [user, setUser] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  
  // 날짜 및 시간 선택
  const [rentalDate, setRentalDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [rentalTime, setRentalTime] = useState('09:00');
  const [returnTime, setReturnTime] = useState('09:00');
  
  // 필터 및 페이지네이션
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  
  // 날짜 제약 조건
  const [minReturnDate, setMinReturnDate] = useState('');
  const [maxReturnDate, setMaxReturnDate] = useState('');
  
  // 가용성 및 장바구니
  const [equipmentAvailability, setEquipmentAvailability] = useState({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cartAnimation, setCartAnimation] = useState(false);
  
  // 무한 스크롤 용 상태
  const [displayedCameras, setDisplayedCameras] = useState([]);
  
  // 카테고리 데이터
  const [categories, setCategories] = useState([
    { name: 'All', count: 0 },
    { name: 'Camera', count: 0 },
    { name: 'Lens', count: 0 },
    { name: 'Lighting', count: 0 },
    { name: 'Battery', count: 0 },
    { name: 'Sound', count: 0 },
    { name: 'VR device', count: 0 },
    { name: 'ETC', count: 0 }
  ]);
  
  // 반응형 설정
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const camerasPerPage = isMobile ? 120 : 12;

  // 윈도우 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 인증 상태 모니터링
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const count = await fetchCartItemCount(currentUser.uid, db);
        setCartItemCount(count);
      } else {
        navigate('/login', { 
          state: { 
            from: location.pathname, 
            message: '장바구니 및 예약 기능을 사용하려면 로그인이 필요합니다.' 
          } 
        });
      }
    });
    return () => unsubscribe();
  }, [navigate, location]);

  // 대여 날짜 및 반납 날짜가 모두 선택되었을 때 장비 가용성 확인
  useEffect(() => {
    const checkAvailability = async () => {
      if (rentalDate && returnDate) {
        setCheckingAvailability(true);
        const startDate = `${rentalDate}T${rentalTime}`;
        const endDate = `${returnDate}T${returnTime}`;
    
        // 병렬로 호출하는 방식
        const results = await Promise.all(
          cameras.map(async (camera) => {
            const result = await checkEquipmentAvailability(camera.id, startDate, endDate, auth, db);
            return { id: camera.id, result };
          })
        );
    
        // 결과 재구성
        const availabilityData = {};
        results.forEach(({ id, result }) => {
          availabilityData[id] = result;
        });
    
        setEquipmentAvailability(availabilityData);
        setCheckingAvailability(false);
      }
    };
    
    checkAvailability();
  }, [rentalDate, returnDate, rentalTime, returnTime, cameras]);

  // 페이지 스크롤 이벤트
  useEffect(() => {
    if (location.state && location.state.scrollTo) {
      const element = document.getElementById(location.state.scrollTo);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.state]);
  
  // 장바구니 추가 핸들러
  const handleAddToCart = async (camera) => {
    if (!rentalDate || !rentalTime || !returnDate || !returnTime) {
      toast.warn(
        "날짜를 먼저 선택해주세요.",{
          className: "custom-toast"
        });
      return;
    }

    // 추천 액세서리 알림
    if (camera.category === 'Camera') {
      if (['고프로 히어로 5 세션 (a)', '고프로 히어로 5 세션 (b)', '삼성 gear 360 (a)', '삼성 gear 360 (b)'].includes(camera.name)) {
        toast.info("✨ MicroSD 카드가 필요합니다", {
          className: "custom-toast"
        });
      } else {
        toast.info("✨ 렌즈, 배터리, SD카드 대여도 잊지마세요!", {
          className: "custom-toast"
        });
      }
    }

    if (camera.category === 'Lighting') {
      if (['어퓨처 300X', 'LED 조명 (a)', 'LED 조명 (b)', 'LED 조명 (c)', 'LED 조명 (d)'].includes(camera.name)) {
        toast.info("✨ V마운트 배터리와 스탠드 대여도 잊지마세요!", {
          className: "custom-toast"
        });
      } 
    }

    if (camera.condition === '수리') {
      toast.warn('이 장비는 현재 수리 중이라 대여할 수 없습니다.');
      return;
    }
    
    // 해당 장비의 선택 날짜 가용성 확인
    const availability = equipmentAvailability[camera.id];
    if (availability && !availability.available) {
      toast.warn('선택하신 날짜에는 이 장비를 대여할 수 없습니다.');
      return;
    }

    // 장바구니 추가
    const added = await addToCart(camera, rentalDate, rentalTime, returnDate, returnTime, auth, db);
    if (added) {
      // 장바구니 애니메이션
      setCartAnimation(true);
      setTimeout(() => setCartAnimation(false), 500);
      
      // 장바구니 아이템 수 업데이트
      const count = await fetchCartItemCount(user.uid, db);
      setCartItemCount(count);
      
      // 새로 추가된 장비에 대한 가용성 정보를 즉시 다시 조회
      const startDate = `${rentalDate}T${rentalTime}`;
      const endDate = `${returnDate}T${returnTime}`;
      const updatedAvailability = await checkEquipmentAvailability(camera.id, startDate, endDate, auth, db);

      // 가용성 정보 업데이트
      setEquipmentAvailability(prev => ({
        ...prev,
        [camera.id]: updatedAvailability
      }));

      toast.success(`${camera.name}이(가) 장바구니에 추가되었습니다.`);
    }
  };

  // 내비게이션 핸들러
  const handleHomeNavigation = () => navigate('/main');
  const handleMyPageNavigation = () => navigate('/mypage');
  const handleCalendarNavigation = () => navigate('/calendar-with-header', { state: { scrollTo: 'calendar-section' } });
  const handleNoteNavigation = () => navigate('/thingsnote-with-header', { state: { scrollTo: 'notes-section' } });
  const handleCartNavigation = () => navigate('/cart', { state: { uploadedFileURL } });

  // Firestore에서 카메라 데이터 fetching
  const fetchCameras = async () => {
    try {
      const cameraRef = collection(db, 'cameras');
      const cameraQuery = query(cameraRef, orderBy("description", "asc"));
      const snapshot = await getDocs(cameraQuery);
      
      const cameraData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCameras(cameraData);
      
      const updatedCategories = [
        { name: 'All', count: cameraData.length },
        ...['Camera', 'Lens', 'Lighting', 'Battery', 'Sound', 'VR device', 'ETC'].map(catName => ({
          name: catName,
          count: cameraData.filter(c => c.category === catName).length
        }))
      ];

      setCategories(updatedCategories);
      setLoading(false);
    } catch (err) {
      console.error("카메라 데이터 로딩 중 오류:", err);
      setError(err);
      setLoading(false);
    }
  };

  // 초기 데이터 로딩
  useEffect(() => {
    fetchCameras();
  }, []);

  // 가용성 새로 고침
  useEffect(() => {
    if (cameras.length > 0 && rentalDate && returnDate) {
      const refreshAvailability = async () => {
        setCheckingAvailability(true);
        const startDate = `${rentalDate}T${rentalTime}`;
        const endDate = `${returnDate}T${returnTime}`;
        const newAvailability = {};
        for (const camera of cameras) {
          const result = await checkEquipmentAvailability(camera.id, startDate, endDate, auth, db);

          if (camera.condition === '수리') {
            result.available = false;
            result.reason = '수리 중';
          }

          newAvailability[camera.id] = result;
        }
        setEquipmentAvailability(newAvailability);
        setCheckingAvailability(false);
      };
      refreshAvailability();
    }
  }, [cameras]);
  
  // 대여 날짜 변경 핸들러
  const handleRentalDateChange = (date) => {
    console.log('받은 날짜 값:', date, typeof date);
  
    let fixedDate;
  
    if (typeof date === 'string') {
      const [year, month, day] = date.split('-').map(Number);
      fixedDate = new Date(year, month - 1, day, 9, 0, 0); // 👈 KST 기준 오전 9시
    } else if (date instanceof Date) {
      fixedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0);
    } else {
      console.warn('날짜 형식 오류:', date);
      return;
    }
  
    const formatted = formatToKSTDateString(fixedDate);
    setRentalDate(formatted);
    setMinReturnDate(formatted);
  
    const maxDay = isLongTerm ? 30 : 8;
    const maxDate = new Date(fixedDate);
    maxDate.setDate(maxDate.getDate() + maxDay);
    const formattedMax = formatToKSTDateString(maxDate);
    setMaxReturnDate(formattedMax);
  
    if (returnDate && new Date(returnDate) > maxDate) {
      setReturnDate('');
    }
  };
  
  // 카테고리 토글
  const toggleCategory = (categoryName) => {
    setSelectedCategory(prev => prev === categoryName ? 'All' : categoryName);
    setCurrentPage(1);
  };

  // 배터리 추가 핸들러
  const handleAddBattery = async (camera) => {
    if (!user) return toast.warn("로그인이 필요합니다!");
    if (!camera.batteryModel || !rentalDate || !returnDate) {
      return toast.warn("날짜를 먼저 선택해주세요.");
    }
  
    const batteryQuery = query(
      collection(db, 'cameras'),
      where('category', '==', 'Battery'),
      where('status', '==', 'available'),
      orderBy('name')
    );
    
    const snapshot = await getDocs(batteryQuery);
  
    const startDate = `${rentalDate}T${rentalTime}`;
    const endDate = `${returnDate}T${returnTime}`;
  
    // 현재 내 장바구니에 있는 ID 확인
    const userCartRef = doc(db, 'user_carts', user.uid);
    const cartDoc = await getDoc(userCartRef);
    const cartItems = cartDoc.exists() ? cartDoc.data().items : [];
  
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
  
      // 이름이 모델로 시작하지 않으면 건너뜀
      if (!data.name.startsWith(camera.batteryModel)) continue;
  
      // 장바구니 중복 체크
      const isAlreadyInCart = cartItems.some(item => 
        item.id === docSnap.id &&
        item.rentalDate === rentalDate &&
        item.rentalTime === rentalTime
      );
      if (isAlreadyInCart) continue;
  
      // 가용성 확인
      const result = await checkEquipmentAvailability(docSnap.id, startDate, endDate, auth, db);
      if (result.available) {
        const battery = { id: docSnap.id, ...data };
        const added = await addToCart(battery, rentalDate, rentalTime, returnDate, returnTime, auth, db);
        if (added) {
          toast.success(`${battery.name} 추가 완료`);
          
          // 장바구니 아이템 수 업데이트
          const count = await fetchCartItemCount(user.uid, db);
          setCartItemCount(count);
          
          return;
        }
      }
    }
  
    toast.warn("사용 가능한 배터리가 더 이상 없습니다.");
  };

  // SD카드 추가 핸들러
  const handleAddSDCard = async (camera) => {
    if (!user) return toast.warn("로그인이 필요합니다!");
  
    if (!camera.recommendSDCard || !rentalDate || !returnDate) {
      return toast.warn("날짜를 먼저 선택해주세요.");
    }
  
    try {
      const sdQuery = query(
        collection(db, 'cameras'),
        where('category', '==', 'ETC'),
        where('status', '==', 'available')
      );
      const snapshot = await getDocs(sdQuery);
  
      // 현재 내 장바구니 아이템 ID 확인 (중복 방지)
      const userCartRef = doc(db, 'user_carts', user.uid);
      const cartDoc = await getDoc(userCartRef);
      const currentItems = cartDoc.exists() ? cartDoc.data().items : [];
  
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
  
        // 이름이 추천 SD카드로 시작하지 않으면 무시
        if (!data.name.startsWith(camera.recommendSDCard)) continue;
  
        // 이미 장바구니에 있으면 건너뜀
        const isAlreadyAdded = currentItems.some(
          item => item.id === docSnap.id && 
                  item.rentalDate === rentalDate && 
                  item.rentalTime === rentalTime
        );
        if (isAlreadyAdded) continue;
  
        // 대여 가능 여부 확인
        const result = await checkEquipmentAvailability(docSnap.id, `${rentalDate}T${rentalTime}`, `${returnDate}T${returnTime}`, auth, db);
  
        if (result.available) {
          const sd = { id: docSnap.id, ...data };
          const added = await addToCart(sd, rentalDate, rentalTime, returnDate, returnTime, auth, db);
          if (added) {
            toast.success(`${sd.name} 추가 완료`);
            
            // 장바구니 아이템 수 업데이트
            const count = await fetchCartItemCount(user.uid, db);
            setCartItemCount(count);
            
            return;
          }
        }
      }
  
      // 끝까지 조건 맞는 SD카드 없으면
      toast.warn("사용 가능한 SD카드가 없습니다.");
    } catch (error) {
      console.error("SD카드 추가 중 오류:", error);
      toast.error("SD카드 추가에 실패했습니다.");
    }
  };

  // 필터링된 카메라
  const filteredCameras = cameras
    .filter(camera => {
      // 기본 필터
      const categoryMatch = selectedCategory === 'All' || camera.category === selectedCategory;
      const nameMatch = camera.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 가용성 필터
      let availabilityMatch = true;
      if (availableOnly && rentalDate && returnDate) {
        const availability = equipmentAvailability[camera.id];
        availabilityMatch = (
          (!availability || availability.available) &&
          camera.condition !== '수리' &&
          camera.status !== '수리 중'
        );
      }
      
      return categoryMatch && nameMatch && availabilityMatch;
    });

  const indexOfLastCamera = currentPage * camerasPerPage;
  const indexOfFirstCamera = indexOfLastCamera - camerasPerPage;
  const currentCameras = filteredCameras.slice(indexOfFirstCamera, indexOfLastCamera);
  const totalPages = Math.ceil(filteredCameras.length / camerasPerPage);

  // CSS 애니메이션 스타일 추가
  const additionalStyles = `
    @keyframes cartBounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    .cart-bounce {
      animation: cartBounce 0.5s ease-in-out;
    }
  `;

  return (
    <div className={isMobile ? 'mobile-container' : 'desktop-container'} style={{ 
      position: 'relative',
      width: '100%',
      maxWidth: '1440px',
      minHeight: '100vh',
      background: '#FFFFFF',
      margin: '0 auto',
      fontFamily: 'Pretendard, sans-serif',
      color: '#000000',
      overflowX: 'hidden'
    }}>
      <style>{additionalStyles}</style>
      
      {/* Header Component */}
      <Header 
        isMobile={isMobile}
        handleHomeNavigation={handleHomeNavigation}
        handleMyPageNavigation={handleMyPageNavigation}
        handleCalendarNavigation={handleCalendarNavigation}
        handleNoteNavigation={handleNoteNavigation}
        handleCartNavigation={handleCartNavigation}
        cartItemCount={cartItemCount}
        cartAnimation={cartAnimation}
      />

      {/* Main Content Area - 순서 변경 */}
      <div style={{
        padding: isMobile ? '10px 6px' : '20px', // 모바일에서 좌우 여백 줄이기
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '8px' : '20px'
        
      }}>
        {/* 데스크톱은 원래 구조대로, 모바일은 순서 변경 */}
        {isMobile ? (
          // 모바일 레이아웃 - 변경된 순서
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* 1. 날짜 및 시간 선택 */}
            <DateTimeSelector 
              isMobile={isMobile}
              rentalDate={rentalDate}
              rentalTime={rentalTime}
              returnDate={returnDate}
              returnTime={returnTime}
              minReturnDate={minReturnDate}
              maxReturnDate={maxReturnDate}
              timeOptions={generateTimeOptions()}
              returnTimeOptions={generateReturnTimeOptions()}
              handleRentalDateChange={handleRentalDateChange}
              setRentalTime={setRentalTime}
              setReturnDate={setReturnDate}
              setReturnTime={setReturnTime}
              availableOnly={availableOnly}
              setAvailableOnly={setAvailableOnly}
            />
            
            {/* 2. 검색창과 카테고리 통합 컴포넌트 */}
            <SearchCategoryLayout 
              isMobile={isMobile}
              categories={categories}
              selectedCategory={selectedCategory}
              toggleCategory={toggleCategory}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              availableOnly={availableOnly}
              setAvailableOnly={setAvailableOnly}
            />

            {/* 3. 장비 그리드 - 무한 스크롤 적용 */}
            <InfiniteScroll 
              filteredItems={filteredCameras}
              setDisplayedItems={setDisplayedCameras}
              itemsPerPage={camerasPerPage}
              isMobile={isMobile}
            >
              <EquipmentGrid 
                currentCameras={displayedCameras}
                selectedCameraId={selectedCameraId}
                setSelectedCameraId={setSelectedCameraId}
                equipmentAvailability={equipmentAvailability}
                rentalDate={rentalDate}
                returnDate={returnDate}
                handleAddToCart={handleAddToCart}
                handleAddBattery={handleAddBattery}
                handleAddSDCard={handleAddSDCard}
                isMobile={isMobile}
              />
            </InfiniteScroll>
          </div>
        ) : (
          // 데스크탑 레이아웃 - 원래 순서
          <>
            {/* Categories Sidebar Component */}
            <CategorySidebar 
              categories={categories}
              selectedCategory={selectedCategory}
              toggleCategory={toggleCategory}
              isMobile={isMobile}
            />
            
            {/* Reservation Section */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Date and Search Section */}
              <DateTimeSelector 
                isMobile={isMobile}
                rentalDate={rentalDate}
                rentalTime={rentalTime}
                returnDate={returnDate}
                returnTime={returnTime}
                minReturnDate={minReturnDate}
                maxReturnDate={maxReturnDate}
                timeOptions={generateTimeOptions()}
                returnTimeOptions={generateReturnTimeOptions()}
                handleRentalDateChange={handleRentalDateChange}
                setRentalTime={setRentalTime}
                setReturnDate={setReturnDate}
                setReturnTime={setReturnTime}
              />

              {/* Search Input Component */}
              <SearchInput 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isMobile={isMobile}
              />

              {/* Equipment Grid Component */}
              <EquipmentGrid 
                currentCameras={currentCameras}
                selectedCameraId={selectedCameraId}
                setSelectedCameraId={setSelectedCameraId}
                equipmentAvailability={equipmentAvailability}
                rentalDate={rentalDate}
                returnDate={returnDate}
                handleAddToCart={handleAddToCart}
                handleAddBattery={handleAddBattery}
                handleAddSDCard={handleAddSDCard}
                isMobile={isMobile}
              />

              {/* Pagination Component */}
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                isMobile={isMobile}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReservationMainPage;