import React, { useState, useEffect } from 'react';
import { useNavigate,useSearchParams } from 'react-router-dom';
import { User, ShoppingCart, CheckCircle2, X, AlertCircle, Calendar } from 'lucide-react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion, 
  setDoc,
  getDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { 
  db, 
  auth 
} from '../firebase/firebaseConfig';

import { useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from "react-toastify"; // 한 번만 import 되어있으면 됨
import DatePickerInput from "./DatePickerInput";


const mountColors = {
  'EF': '#e74c3c',       // 빨강
  'FE': '#195c89',       // 파랑
  '니콘 F': '#7d4798', // 보라
  '': '#1abc9c', // 민트
  'EF-S': '#f39c12', // 주황
  '기타': '#299616'      // 회색 (기본)
};

// 장바구니 관련 유틸리티 함수
const addToCart = async (camera, rentalDate, rentalTime, returnDate, returnTime) => {
  // 로그인 상태 확인
  const user = auth.currentUser;
  if (!user) {
    toast.warn('장바구니에 추가하려면 로그인이 필요합니다.');
    return false;
  }
  try {
    // 사용자의 장바구니 문서 참조
    const userCartRef = doc(db, 'user_carts', user.uid);
    
    // 장바구니 아이템 생성
    const cartItem = {
      ...camera,
      rentalDate,
      rentalTime,
      returnDate,
      returnTime,
      addedAt: new Date().toISOString()
    };

    // 문서 존재 여부 확인
    const cartDoc = await getDoc(userCartRef);
    
    if (cartDoc.exists()) {
      // 중복 체크
      const currentItems = cartDoc.data().items || [];
      const isDuplicate = currentItems.some(
        item => item.id === camera.id && 
        item.rentalDate === rentalDate && 
        item.rentalTime === rentalTime
      );

      if (isDuplicate) {
        toast.warn('이미 장바구니에 추가된 항목입니다.');
        return false;
      }

      // 기존 문서에 아이템 추가
      await updateDoc(userCartRef, {
        items: arrayUnion(cartItem)
      });
    } else {
      // 새 문서 생성
      await setDoc(userCartRef, {
        items: [cartItem]
      });
    } 
    return true;
  } catch (error) {
    console.error("장바구니 추가 중 오류:", error);
    toast.warn('장바구니에 추가할 수 없습니다.');
    return false;
  }
};



// 특정 날짜에 장비의 대여 가능 여부를 확인하는 함수
const checkEquipmentAvailability = async (equipmentId, startDate, endDate) => {
  const currentUser = auth.currentUser;
  const currentUserId = currentUser ? currentUser.uid : null;
  
  try {
    // 시작 및 종료 날짜/시간을 Date 객체로 변환
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    
    // 대여 가능 여부 확인을 위한 변수들 초기화
    let isAvailable = true;
    let unavailablePeriods = [];
    let myCartItems = [];
    
    // 모든 active 상태 예약 조회
    const rentalsRef = collection(db, 'reservations');
    const q = query(
      rentalsRef, 
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach(doc => {
      const reservationData = doc.data();

      if (!reservationData.items || !Array.isArray(reservationData.items)) {
        return;
      }

      const matchingItem = reservationData.items.find(item => item.id === equipmentId);

      if (matchingItem) {
        const reservationStart = new Date(reservationData.startDateTime);
        const reservationEnd = new Date(reservationData.endDateTime);

        if (startDateTime < reservationEnd && endDateTime > reservationStart) {
          isAvailable = false;
          unavailablePeriods.push({
            start: reservationData.startDateTime,
            end: reservationData.endDateTime,
            isRental: true
          });
        }
      }
    });
    
    // 장바구니 확인 로직
    const cartRef = collection(db, 'user_carts');
    const cartSnapshot = await getDocs(cartRef);
    
    cartSnapshot.forEach(doc => {
      const cartData = doc.data();
      const items = cartData.items || [];
      const isMyCart = doc.id === currentUserId;
      
      items.forEach(item => {
        if (item.id === equipmentId) {
          const cartStart = new Date(item.rentalDate + 'T' + item.rentalTime);
          const cartEnd = new Date(item.returnDate + 'T' + item.returnTime);
          
          if (startDateTime < cartEnd && endDateTime > cartStart) {
            // 내 장바구니에 있는 항목만 기록
            if (isMyCart) {
              myCartItems.push({
                start: item.rentalDate,
                end: item.returnDate,
                inMyCart: true
              });
            } else {
              // 다른 사용자의 장바구니 항목은 대여 불가능으로 처리
              isAvailable = false;
              unavailablePeriods.push({
                start: item.rentalDate,
                end: item.returnDate,
                inCart: true
              });
            }
          }
        }
      });
    });
    
   
    
    return {
      available: isAvailable,
      unavailablePeriods,
      myCartItems
    };
  } catch (error) {
    console.error("대여 가능 여부 확인 중 오류:", error);
    return { available: false, error: true };
  }
};

// 날짜 선택 이벤트 리스너 추가하기
const setupDateListeners = (equipmentId) => {
  // 날짜 선택 입력 필드 가져오기
  const startDateInput = document.getElementById('startDateInput');
  const endDateInput = document.getElementById('endDateInput');
  const startTimeInput = document.getElementById('startTimeInput');
  const endTimeInput = document.getElementById('endTimeInput');
  
  // 결과 표시 요소
  const availabilityResultElement = document.getElementById('availabilityResult');
  
  // 모든 날짜/시간 입력 필드에 이벤트 리스너 추가
  [startDateInput, endDateInput, startTimeInput, endTimeInput].forEach(input => {
    if (input) {
      input.addEventListener('change', async () => {
        // 모든 필드가 채워졌는지 확인
        if (startDateInput.value && endDateInput.value && 
            (startTimeInput ? startTimeInput.value : true) && 
            (endTimeInput ? endTimeInput.value : true)) {
          
          // 시간 정보 포맷팅
          const startTime = startTimeInput ? startTimeInput.value : '00:00';
          const endTime = endTimeInput ? endTimeInput.value : '23:59';
          
          // 날짜 및 시간 문자열 생성
          const startDateTime = `${startDateInput.value}T${startTime}`;
          const endDateTime = `${endDateInput.value}T${endTime}`;
          
          // 로딩 상태 표시
          if (availabilityResultElement) {
            availabilityResultElement.innerHTML = '확인 중...';
            availabilityResultElement.className = 'checking';
          }
          
          // 대여 가능 여부 확인
          const result = await checkEquipmentAvailability(equipmentId, startDateTime, endDateTime);
          
          // 결과 표시
          if (availabilityResultElement) {
            if (result.available) {
              availabilityResultElement.innerHTML = '대여 가능합니다!';
              availabilityResultElement.className = 'available';
            } else {
              let message = '해당 기간에는 대여가 불가능합니다.';
              if (result.unavailablePeriods.length > 0) {
                message += '<br>이미 예약된 기간:';
                result.unavailablePeriods.forEach(period => {
                  const startDate = new Date(period.start).toLocaleDateString();
                  const endDate = new Date(period.end).toLocaleDateString();
                  message += `<br>- ${startDate} ~ ${endDate}`;
                });
              }
              availabilityResultElement.innerHTML = message;
              availabilityResultElement.className = 'unavailable';
            }
          }
        }
      });
    }
  });
};

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  // URL 파라미터에서 장비 ID 가져오기 (예시)
  const urlParams = new URLSearchParams(window.location.search);
  const equipmentId = urlParams.get('id');
  
  if (equipmentId) {
    setupDateListeners(equipmentId);
  }
});

const imageCache = {};

// 이미지 로딩 컴포넌트
const ImageWithPlaceholder = ({ camera, equipmentAvailability }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!camera.imageURL) {
      setHasError(true);
      return;
    }
    try {
      new URL(camera.imageURL);
      setImageSrc(camera.imageURL);
    } catch (e) {
      setHasError(true);
    }
  }, [camera.id, camera.imageURL]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setHasError(true);  
    setImageLoaded(true); // 오류가 발생해도 "로드됨" 상태로 처리
  };

  return (
    <div style={{
      height: '250px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: equipmentAvailability?.[camera.id]?.available === false ? '#f0f0f0' : '#F5F5F5',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {!imageLoaded && !hasError && (
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: '#E0E0E0',
          animation: 'pulse 1.5s infinite',
        }} />
      )}
      {hasError && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888'
        }}>
          <AlertCircle size={40} />
          <p style={{ marginTop: '10px' }}>이미지를 불러올 수 없습니다</p>
          <p style={{ fontSize: '12px', color: '#aaa', maxWidth: '90%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {camera.imageUrl?.substring(0, 50)}
            {camera.imageUrl?.length > 50 ? '...' : ''}
          </p>
        </div>
      )}
      {imageSrc && !hasError && (
        <img 
          src={imageSrc} 
          alt={camera.name || '장비 이미지'}
          loading="lazy"
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            opacity: imageLoaded ? (equipmentAvailability?.[camera.id]?.available === false ? 0.4 : 1) : 0,
            transition: 'opacity 0.3s ease-in-out',
            filter: camera.status === 'rented' ? 'grayscale(70%)' : 'none'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    {equipmentAvailability?.[camera.id]?.available === false && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 15px',
          borderRadius: '20px',
          fontWeight: 'bold',
          zIndex: 10,
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          fontSize: '16px'
        }}>
          대여 중
        </div>
      )}
    </div>
  );
};

const formatToKSTDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};





const ReservationMainPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadedFileURL = location.state?.uploadedFileName || localStorage.getItem('uploadedFileURL');
  const isLongTerm = Boolean(uploadedFileURL);
  const maxDay = isLongTerm ? 30 : 8;
  const dateOptions = Array.from({ length: maxDay }, (_, i) => i + 1);
  const [user, setUser] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [rentalDate, setRentalDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [rentalTime, setRentalTime] = useState('09:00');
  const [returnTime, setReturnTime] = useState('09:00');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  // 날짜 선택에 따른 장비 가용성 상태
  const [equipmentAvailability, setEquipmentAvailability] = useState({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
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

  const [minReturnDate, setMinReturnDate] = useState('');
  const [maxReturnDate, setMaxReturnDate] = useState('');
  const camerasPerPage = 12;
  


  const addToCart = async (camera, rentalDate, rentalTime, returnDate, returnTime) => {
    // 1. 로그인 상태 확인
    const user = auth.currentUser;
    if (!user) {
      toast.warn('장바구니에 추가하려면 로그인이 필요합니다.');
      return false;
    }
    try {
      // 2. 사용자의 장바구니 문서 참조
      const userCartRef = doc(db, 'user_carts', user.uid);
      
      // 3. 장바구니 아이템 생성
      const cartItem = {
        ...camera,
        rentalDate,
        rentalTime,
        returnDate,
        returnTime,
        addedAt: new Date().toISOString()
      };
  
      // 4. 사용자의 장바구니 문서 존재 여부 확인
      const cartDoc = await getDoc(userCartRef);
      
      if (cartDoc.exists()) {
        // 5. 이미 장바구니에 동일한 아이템이 있는지 중복 체크
        const currentItems = cartDoc.data().items || [];
        const isDuplicate = currentItems.some(
          item => item.id === camera.id && 
          item.rentalDate === rentalDate && 
          item.rentalTime === rentalTime
        );
  
        if (isDuplicate) {
          toast.warn('이미 장바구니에 추가된 항목입니다.');
          return false;
        }
  
        // 6. 기존 장바구니에 아이템 추가
        await updateDoc(userCartRef, {
          items: arrayUnion(cartItem)
        });
      } else {
        // 7. 장바구니가 없으면 새 문서 생성
        await setDoc(userCartRef, {
          items: [cartItem]
        });
      }
      return true;
    } catch (error) {
      console.error("장바구니 추가 중 오류:", error);
      toast.warn('장바구니에 추가할 수 없습니다.');
      return false;
    }
  };

  // 장바구니 아이템 수 및 애니메이션 상태
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cartAnimation, setCartAnimation] = useState(false);

  // 장바구니 아이템 수 가져오기
  const fetchCartItemCount = async () => {
    if (!user) return;
    try {
      const userCartRef = doc(db, 'user_carts', user.uid);
      const cartDoc = await getDoc(userCartRef);
      if (cartDoc.exists()) {
        const items = cartDoc.data().items || [];
        setCartItemCount(items.length);
      }
    } catch (error) {
      console.error("장바구니 아이템 수 가져오기 실패:", error);
    }
  };

  // 인증 상태 모니터링
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchCartItemCount();
      } else {
        
      }
    });
    return () => unsubscribe();
  }, [navigate, location]);

// 대여 날짜 및 반납 날짜가 모두 선택되었을 때 장비 가용성 확인
useEffect(() => {
  // 날짜가 없으면 초기화 후 종료
  if (!rentalDate || !returnDate) {
    setEquipmentAvailability({});
    return;
  }

  // 비로그인: 가용성 계산 스킵 (권한 에러/전부 불가 방지)
  if (!user) {
    setEquipmentAvailability({});
    setCheckingAvailability(false);
    return;
  }

  let cancelled = false;

  (async () => {
    try {
      setCheckingAvailability(true);
      const startDate = `${rentalDate}T${rentalTime}`;
      const endDate = `${returnDate}T${returnTime}`;

      const results = await Promise.all(
        cameras.map(async (camera) => {
          const result = await checkEquipmentAvailability(
            camera.id,
            startDate,
            endDate,
            auth,
            db
          );
          return [camera.id, result]; // [id, result]
        })
      );

      if (cancelled) return;
      setEquipmentAvailability(Object.fromEntries(results));
    } catch (e) {
      console.error('availability check error:', e);
    } finally {
      if (!cancelled) setCheckingAvailability(false);
    }
  })();

  return () => {
    cancelled = true;
  };
}, [rentalDate, rentalTime, returnDate, returnTime, cameras, user]);




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
     if (!user) {
   toast.info("로그인 후 대여할 수 있어요.");
   navigate('/login', { state: { from: '/reservation' } });
   return;
 }
    if (!rentalDate || !rentalTime || !returnDate || !returnTime) {
      toast.warn(
        "대여 및 반납 날짜와 시간을 먼저 선택해주세요!",{
          className: "custom-toast"
        });
      return;
    }

    if (camera.category === 'Camera') {
    if (camera.name === "고프로 히어로 5 세션 (a)" || camera.name === "고프로 히어로 5 세션 (b)" || camera.name === "삼성 gear 360 (a)" || camera.name === "삼성 gear 360 (b)") {
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
    if (camera.name === "어퓨처 300X" || camera.name === "LED 조명 (a)" || camera.name === "LED 조명 (a)" || camera.name === "LED 조명 (b)" || camera.name === "LED 조명 (c)" || camera.name === "LED 조명 (d)") {
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

    // 기존 addToCart 함수 사용
    const added = await addToCart(camera, rentalDate, rentalTime, returnDate, returnTime);
    if (added) {
      // 장바구니 애니메이션
      setCartAnimation(true);
      setTimeout(() => setCartAnimation(false), 500);
      
      // 장바구니 아이템 수 업데이트
      fetchCartItemCount(); // 이 함수를 사용해 Firebase에서 직접 카운트
      
      
    // ✅ 새로 추가된 장비에 대한 가용성 정보를 즉시 다시 조회
    const startDate = `${rentalDate}T${rentalTime}`;
    const endDate = `${returnDate}T${returnTime}`;
    const updatedAvailability = await checkEquipmentAvailability(camera.id, startDate, endDate);


      // 가용성 정보 업데이트
      setEquipmentAvailability(prev => ({
        ...prev,
        [camera.id]: updatedAvailability
      }));

      toast.success(`${camera.name}이(가) 장바구니에 추가되었습니다.`);
    }
  };

  // 장바구니 아이콘 렌더링
  const renderCartIcon = () => (
    <div 
      style={{ 
        position: 'absolute',
        right: '13px',
        display: 'flex', 
        top: '0px',
        alignItems: 'center', 
        gap: '5px', 
        cursor: 'pointer',
        padding: '5px 10px',
        borderRadius: '20px',
        backgroundColor: '#f0f0f0',
        transition: 'transform 0.3s',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
        fontWeight: '500'
      }}
      onClick={handleCartNavigation}
      className={cartAnimation ? 'cart-bounce' : ''}
    >
      <div style={{ position: 'relative' }}>
        <ShoppingCart size={20}/>
        {cartItemCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            backgroundColor: 'red',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '12px',
            
          }}>
            {cartItemCount}
          </span>
        )}
      </div>
      <span>Cart</span>
    </div>
  );

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

  // 내비게이션 핸들러
  const handleHomeNavigation = () => {
    navigate('/main');
  };

  const handleMyPageNavigation = () => {
    navigate('/mypage'); // Or whatever route you want for the My page
  };

  const handleCalendarNavigation = () => {
    navigate('/calendar', { state: { scrollTo: 'calendar-section' } });
  };

  const handleNoteNavigation = () => {
    navigate('/thingsnote', { state: { scrollTo: 'notes-section' } });
  };
  
  

  const handleCartNavigation = () => {
    navigate('/cart', {
      state: {
        uploadedFileURL  // ← 이 줄 추가!
      }
    });
  };

  // Firestore에서 카메라 데이터 fetching
  const fetchCameras = async () => {
    try {
      const cameraRef = collection(db, 'cameras');
      const cameraQuery = query(cameraRef, orderBy("displayOrder", "asc"));
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

  // 시간 옵션 생성
  const generateTimeOptions = () => {
    const options = [];
    let hour = 9;
    let minute = 0;
    while (hour < 17 || (hour === 17 && minute === 0)) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      options.push(time);
      minute += 30;
      if (minute === 60) {
        minute = 0;
        hour++;
      }
    }
    return options;
  };

// ⭐ 추가 함수 (반납 시간용 - 1시간 단위, 24시간)
const generateReturnTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    const time = `${String(hour).padStart(2, '0')}:00`;
    options.push(time);
  }

  options.push('23:59');

  return options;
};


const returnTimeOptions = generateReturnTimeOptions();
  const timeOptions = generateTimeOptions();

  
  // 대여 날짜 변경 핸들러
  const handleRentalDateChange = (date) => {
    let fixedDate;
  
    if (typeof date === 'string') {
      const [year, month, day] = date.split('-').map(Number);
      fixedDate = new Date(year, month - 1, day, 9, 0, 0); // 👈 KST 기준 오전 9시
    } else if (date instanceof Date) {
      fixedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0);
    } else {
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

    const handleAddBattery = async (camera) => {
      const user = auth.currentUser;
      if (!user) return toast.warn("로그인이 필요합니다!");
      if (!camera.batteryModel || !rentalDate || !returnDate) {
        return toast.warn("날짜를 먼저 선택해주세요.");
      }
    
      const batteryQuery = query(
        collection(db, 'cameras'),
        where('category', '==', 'Battery'),
        where('status', '==', 'available'),
        orderBy('name') // 예시: 이름 순으로 정렬
      );
      


      const snapshot = await getDocs(batteryQuery);
    
      const startDate = `${rentalDate}T${rentalTime}`;
      const endDate = `${returnDate}T${returnTime}`;
    
      // 🔍 현재 내 장바구니에 있는 ID 확인
      const userCartRef = doc(db, 'user_carts', user.uid);
      const cartDoc = await getDoc(userCartRef);
      const cartItems = cartDoc.exists() ? cartDoc.data().items : [];
    
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
    
        // 🔍 이름이 모델로 시작하지 않으면 건너뜀
        if (!data.name.startsWith(camera.batteryModel)) continue;
    
        // 🧠 장바구니 중복 체크
        const isAlreadyInCart = cartItems.some(item => 
          item.id === docSnap.id &&
          item.rentalDate === rentalDate &&
          item.rentalTime === rentalTime
        );
        if (isAlreadyInCart) continue;
    
        // 🟢 가용성 확인
        const result = await checkEquipmentAvailability(docSnap.id, startDate, endDate);
        if (result.available) {
          const battery = { id: docSnap.id, ...data };
          const added = await addToCart(battery, rentalDate, rentalTime, returnDate, returnTime);
          if (added) {
            toast.success(`${battery.name} 추가 완료`);
            return;
          }
        }
      }
    
      toast.warn("사용 가능한 배터리가 더 이상 없습니다.");
    };
    

    const handleAddSDCard = async (camera) => {
      const user = auth.currentUser;
      if (!user) return toast.warn("로그인이 필요합니다!");
    
      if (!camera.recommendSDCard || !rentalDate || !returnDate) {
        return toast.warn("날짜를 먼저 선택해주세요.");
      }
    
      try {
        const sdQuery = query(
          collection(db, 'cameras'),
          where('category', '==', 'ETC'), // 필요 시 'SDCARD'로 변경 가능
          where('status', '==', 'available')
        );
        const snapshot = await getDocs(sdQuery);
    
        // ✅ 현재 내 장바구니 아이템 ID 확인 (중복 방지)
        const userCartRef = doc(db, 'user_carts', user.uid);
        const cartDoc = await getDoc(userCartRef);
        const currentItems = cartDoc.exists() ? cartDoc.data().items : [];
        const existingIds = currentItems.map(item => item.id);
    
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
    
          // 🔍 이름이 추천 SD카드로 시작하지 않으면 무시
          if (!data.name.startsWith(camera.recommendSDCard)) continue;
    
          // ❌ 이미 장바구니에 있으면 건너뜀
          const isAlreadyAdded = currentItems.some(
            item => item.id === docSnap.id && 
                    item.rentalDate === rentalDate && 
                    item.rentalTime === rentalTime
          );
          if (isAlreadyAdded) continue;
    
          // ⏱️ 대여 가능 여부 확인
          const result = await checkEquipmentAvailability(
            docSnap.id,
            `${rentalDate}T${rentalTime}`,
            `${returnDate}T${returnTime}`
          );
    
          if (result.available) {
            const sd = { id: docSnap.id, ...data };
            const added = await addToCart(sd, rentalDate, rentalTime, returnDate, returnTime);
            if (added) {
              toast.success(`${sd.name} 추가 완료`);
              return;
            }
          }
        }
    
        // ✅ 끝까지 조건 맞는 SD카드 없으면
        toast.warn("사용 가능한 SD카드가 없습니다.");
      } catch (error) {
        console.error("SD카드 추가 중 오류:", error);
        toast.error("SD카드 추가에 실패했습니다.");
      }
    };
    
    

    useEffect(() => {
      if (cameras.length > 0 && rentalDate && returnDate) {
        const refreshAvailability = async () => {
          setCheckingAvailability(true);
          const startDate = `${rentalDate}T${rentalTime}`;
          const endDate = `${returnDate}T${returnTime}`;
          const newAvailability = {};
          for (const camera of cameras) {
            const result = await checkEquipmentAvailability(camera.id, startDate, endDate);

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
    }, [cameras]); // ✅ 카메라 데이터가 로드된 직후에 실행
    
  
    {/* 로딩 상태 확인
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '20px'
        }}>
          데이터를 불러오는 중...
        </div>
      );
    }
      */}

  return (
    <div style={{
      position: 'relative',
      width: '1440px',
      height: '1700px',
      background: '#000000',
      margin: '0 auto',
      fontFamily: 'Pretendard, sans-serif',
      color: '#000000'
    }}>
      <style>{additionalStyles}</style>
  
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '0px solid #5F5F5F',
        paddingBottom: '45px'
      }}>
        <div style={{ 
          display: 'flex',
          position: 'absolute',
          gap: '20px',
          fontSize: '18px',
          fontWeight: '400',
          right: "16px",
          top: '45px'
        }}>
          <span onClick={handleHomeNavigation} style={{ cursor: 'pointer' }}>Home</span>
          <span onClick={handleCalendarNavigation} style={{ cursor: 'pointer' }}>Calendar</span>
          <span onClick={handleNoteNavigation} style={{ cursor: 'pointer' }}>Note</span>
          <span style={{ color: 'black', cursor: 'default', fontWeight: '900' }}>Reservation</span>
          
        </div>
        <div style={{ textAlign: 'center' }}>
          <div onClick={handleHomeNavigation}  style={{ 
            position: 'absolute',
            fontSize: '36px', 
            fontWeight: 'bold', 
            letterSpacing: '0px',
            top: '0px',
            left: '70px',
            cursor : 'pointer'

          }}>DKit</div>
          <div style={{ 
            fontSize: '12px', 
            color: '#000000',
            position: 'absolute',
            left: '110px',
            top: '40px',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontWeight: '100'
          }}>Digital Contents rental service</div>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* My page button */}
          <div style={{ 
            display: 'flex',
            position: 'absolute',
            right: '110px',
            top: '0px',
            alignItems: 'center', 
            gap: '5px', 
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '20px',
            backgroundColor: '#f0f0f0',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
            fontWeight: '500'
          }}
          onClick={handleMyPageNavigation}
          >
            <User size={20} />
            <span>My page</span>
          </div>
          
          {renderCartIcon()}
        </div>

        
      </div>

      {/* Main Content Area */}
      <div style={{
        position: 'absolute',
        top: '150px',
        left: '50px',
        right: '50px',
        display: 'flex',
        gap: '20px'
      }}>


        
        {/* Categories Cart */}
        <div style={{
          width: '300px',
          border: '1px solid #E0E0E0',
          borderRadius: '10px',
          padding: '20px',
          height: 'fit-content'
        }}>

      
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Categories</h3>
            {selectedCategory !== 'All' && (
              <div 
                style={{ 
                  cursor: 'pointer', 
                  color: '#888',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                onClick={() => setSelectedCategory('All')}
              >
                Clear
                <X size={16} />
              </div>
            )}
            
          </div>
          {categories.map((category) => (
            <div 
              key={category.name} 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                cursor: 'pointer',
                backgroundColor: selectedCategory === category.name ? '#f0f0f0' : 'transparent'
              }}
              onClick={() => toggleCategory(category.name)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{category.name}</span>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#888', 
                  marginLeft: '5px' 
                }}>({category.count})</span>
              </div>
            </div>
          ))}
        </div>
        



        {/* Reservation Section */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Date and Search Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '20px',
            alignItems: 'center'
          }}>
            {/* Rental and Return Date */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold',
                minWidth: '100px'
              }}>대여일자</div>
              <DatePickerInput
  selected={rentalDate}
  onChange={handleRentalDateChange} // ✅ 이제 이 함수가 쓰이게 됨!
  placeholder="대여일 선택"
/>


              <select
                value={rentalTime}
                onChange={(e) => setRentalTime(e.target.value)}
                style={{
                  padding: '10px',
                  width: '100px',
                  height: '40px',
                  fontSize: '16px',
                  border: '1px solid #ccc',
                  borderRadius: '5px'
                }}
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold',
                minWidth: '100px',
                marginLeft: '20px'
              }}>반납일자</div>
              <DatePickerInput
  selected={returnDate}
  onChange={(value) => setReturnDate(value)}
  placeholder="반납일 선택"
  minDate={minReturnDate}
  maxDate={maxReturnDate}
/>

              <select
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                style={{
                  padding: '10px',
                  width: '100px',
                  height: '40px',
                  fontSize: '16px',
                  border: '1px solid #ccc',
                  borderRadius: '5px'
                }}
              >
                {returnTimeOptions.map((t) => (
    <option key={t} value={t}>{t}</option>
  ))}
              </select>
            </div>

            {/* Available Checkbox */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px', 
                cursor: 'pointer',
                padding: '5px 10px',
                borderRadius: '20px',
                backgroundColor: availableOnly ? '#f0f0f0' : 'white',
                border: '1px solid #ccc'
              }}
              onClick={() => setAvailableOnly(!availableOnly)}
            >
              <CheckCircle2 size={20} color={availableOnly ? 'green' : 'gray'} />
              <span>대여 가능</span>
            </div>
          </div>

          {/* Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '30%',
            height: '35px',
            borderBottom: '2px solid #000000',
            borderRadius: '0px',
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
            <input
              type="text"
              placeholder="이름, 브랜드, 용도 등"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '18px', 
                lineHeight: '5px',
                border: 'none',
                outline: 'none'
              }}
            />
          </div>

          {/* Camera Grid */}
          <div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '20px',
  width: '100%'
}}>
  
  {currentCameras.map((camera) => (
  <div 
    key={camera.id} 
    style={{
      border: camera.status === 'rented' ? '1px solid #e74c3c' : 
             (equipmentAvailability[camera.id] && !equipmentAvailability[camera.id].available) ? 
             '1px solid #f39c12' : '1px solid #E0E0E0',
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative',
      transition: 'transform 0.3s, box-shadow 0.3s',
      transform: selectedCameraId === camera.id ? 'scale(1.05)' : 'scale(1)',
      boxShadow: selectedCameraId === camera.id ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
      backgroundColor: equipmentAvailability?.[camera.id]?.available === false ? '#fef2f2' : 
                      (equipmentAvailability[camera.id] && !equipmentAvailability[camera.id].available) ? 
                      '#fff9e6' : 'white'
    }}
    onMouseEnter={() => setSelectedCameraId(camera.id)}
    onMouseLeave={() => setSelectedCameraId(null)}
  >

 {/* 장비 가용성 표시 */}
 {rentalDate && returnDate && equipmentAvailability[camera.id] && !equipmentAvailability[camera.id].available && (
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '-30px',
        backgroundColor: '#f39c12',
        color: 'white',
        transform: 'rotate(45deg)',
       
        fontSize: '12px',
        fontWeight: 'bold',
        textAlign: 'center',
        zIndex: 10,
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }}>
         
      </div> 
    )}

    {/* 내 장바구니에 있는 항목 표시 */}
    {equipmentAvailability[camera.id] && 
     equipmentAvailability[camera.id].myCartItems && 
     equipmentAvailability[String(camera.id)].myCartItems.length > 0 && ( 
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: '#3498db',
        color: 'white',
        padding: '5px 10px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 10,
        borderRadius: '5px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }}>
        장바구니에 있음
      </div>
    )}



                {/* Issues Overlay */}
                {selectedCameraId === camera.id && camera.issues && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          zIndex: 20,
          textAlign: 'center',
          fontSize: '14px'
        }}>
          특이사항: {camera.issues}
        </div>
      )}
      
      {(camera.status === 'rented' || camera.condition === '수리') && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '-30px',
          backgroundColor: '#e74c3c',
          color: 'white',
          transform: 'rotate(45deg)',
          padding: '5px 35px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 10,
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
          {camera.status === 'rented' ? '수리 중' : '수리 중'}
        </div>
      )}

                {/* Camera Image */}
                <ImageWithPlaceholder camera={camera} 
                equipmentAvailability={equipmentAvailability}/>
                
                

                {(() => {
  const mountArray = Array.isArray(camera.mountType)
    ? camera.mountType
    : typeof camera.mountType === 'string'
      ? camera.mountType
          .split(',')
          .map(s => s.trim().replace(/^"|"$/g, ''))
          .filter(Boolean)
      : [];

  if (mountArray.length === 0) return null;

  // 📌 카테고리에 따라 태그 라벨 변경
  const labelType = camera.category === 'Battery' ? '배터리' : '마운트';

  return mountArray.map((type, idx) => (
    <div key={idx} style={{
      position: 'absolute',
      top: `${10 + idx * 26}px`,
      left: '10px',
      backgroundColor: mountColors[type] || mountColors['기타'],
      color: 'white',
      borderRadius: '10px',
      padding: '4px 8px',
      fontSize: '10px',
      fontWeight: '500',
      zIndex: 5,
      whiteSpace: 'nowrap'
    }}>
      {type} {labelType}
    </div>
  ));
})()}







{/* 📌 배터리 & SD카드 버튼은 hover 시에만 opacity로 표시 */}
<div style={{
  position: 'absolute',
  top: '210px',
  right: '10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '5px',
  zIndex: 5,
  opacity: selectedCameraId === camera.id ? 1 : 0,
  transform: selectedCameraId === camera.id ? 'translateY(0)' : 'translateY(5px)',
  transition: 'opacity 0.3s ease, transform 0.3s ease'
}}>
  {camera.batteryModel && (
    <button 
      onClick={() => handleAddBattery(camera)}
      style={{
        padding: '4px 10px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '15px',
        fontSize: '10px',
        cursor: 'pointer'
      }}

      
    >
      + 배터리
    </button>
  )}
  {camera.recommendSDCard && (
    <button 
      onClick={() => handleAddSDCard(camera)}
      style={{
        padding: '4px 10px',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '15px',
        fontSize: '10px',
        cursor: 'pointer'
      }}
      
    >
      + SD카드
    </button>
  )}
</div>



                {/* Camera Details */}
                <div style={{ 
        padding: '10px', 
        backgroundColor: camera.status === 'rented' ? '#fef2f2' : 
          (selectedCameraId === camera.id ? '#f9f9f9' : 'white')
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <span style={{ 
            fontWeight: 'bold',
            color: camera.status === 'rented' ? '#e74c3c' : 'black'
          }}>
            {camera.name}
          </span>
          <span style={{ color: '#666', fontSize: '14px' }}>{camera.dailyRentalPrice}</span>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginTop: '5px',
          color: '#666',
          fontSize: '12px' 
        }}>
          <AlertCircle
            size={14} 
            style={{ 
              marginRight: '5px',
              color: camera.condition === '수리' ? 'red' : 
                    camera.condition === '정상' ? 'green' : 
                    camera.condition === '주의' ? 'orange' : '#666' }} />
          <span>상태: {camera.condition}</span>
          
          {/* 대여 상태 표시 추가 */}
          {(camera.status === 'rented' || camera.condition === '수리') && (
            <span style={{
              marginLeft: '10px',
              color: '#e74c3c',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center'
            }}>
              {/*<X size={14} style={{ marginRight: '3px' }} />
              대여 불가
              */}
            </span>
          )}
        </div>
      </div>

 {/* Cart Button on Hover */}
                {selectedCameraId === camera.id && camera.status === 'available' && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '10px',
                  cursor: 'pointer'
                }}
                
                onClick={() => handleAddToCart(camera)}
              >
            
                <ShoppingCart size={20} style={{ marginRight: '10px' }} />
                장바구니 담기
                  </div>
                )}
              </div>
            ))}
          </div>












          {/* Pagination */}
<div style={{
  marginTop: '20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '10px'
}}>
  {/* 처음 페이지로 */}
  <button 
    onClick={() => setCurrentPage(1)}
    style={{
      padding: '5px 10px',
      border: '1px solid #ccc',
      backgroundColor: 'white',
      cursor: 'pointer'
    }}
  >
    {'<<'}
  </button>

  {/* 이전 페이지로 */}
  <button 
    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
    disabled={currentPage === 1}
    style={{
      padding: '5px 10px',
      border: '1px solid #ccc',
      backgroundColor: currentPage === 1 ? '#f0f0f0' : 'white',
      cursor: currentPage === 1 ? 'default' : 'pointer'
    }}
  >
    {'<'}
  </button>

  {/* 동적 페이지 번호 */}
  {[...Array(3)].map((_, index) => {
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);
    if (endPage - startPage < 2) {
      startPage = Math.max(1, endPage - 2);
    }
    const page = startPage + index;
    if (page > totalPages) return null;

    return (
      <button
        key={page}
        onClick={() => setCurrentPage(page)}
        style={{
          padding: '5px 10px',
          border: '1px solid #ccc',
          backgroundColor: currentPage === page ? 'black' : 'white',
          color: currentPage === page ? 'white' : 'black',
          cursor: 'pointer'
        }}
      >
        {page}
      </button>
    );
  })}

  {/* 다음 페이지로 */}
  <button 
    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
    disabled={currentPage === totalPages}
    style={{
      padding: '5px 10px',
      border: '1px solid #ccc',
      backgroundColor: currentPage === totalPages ? '#f0f0f0' : 'white',
      cursor: currentPage === totalPages ? 'default' : 'pointer'
    }}
  >
    {'>'}
  </button>

  {/* 마지막 페이지로 */}
  <button 
    onClick={() => setCurrentPage(totalPages)}
    style={{
      padding: '5px 10px',
      border: '1px solid #ccc',
      backgroundColor: 'white',
      cursor: 'pointer'
    }}
  >
    {'>>'}
  </button>
</div>

        </div>
      </div>
    </div>
  );
};

export default ReservationMainPage;