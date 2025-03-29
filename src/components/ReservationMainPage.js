
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShoppingCart, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion, 
  setDoc,
  getDoc
} from 'firebase/firestore';
import { 
  db, 
  auth 
} from '../firebase/firebaseConfig';
import { getImageURL } from '../firebase/firebaseConfig';
import { useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';



// 장바구니 관련 유틸리티 함수
const addToCart = async (camera, rentalDate, rentalTime, returnDate, returnTime) => {
  // 로그인 상태 확인
  const user = auth.currentUser;
  if (!user) {
    alert('장바구니에 추가하려면 로그인이 필요합니다.');
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
        alert('이미 장바구니에 추가된 항목입니다.');
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
    alert('장바구니에 추가할 수 없습니다.');
    return false;
  }
};

// 이미지 로딩 컴포넌트
const ImageWithPlaceholder = ({ camera }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const url = await getImageURL(camera.image);
        setImageSrc(url);
      } catch (error) {
        console.error(`Image load error for ${camera.name}:`, error);
      }
    };
    loadImage();
  }, [camera.image]);

  return (
    <div 
      style={{
        height: '250px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: camera.status === 'rented' ? '#f0f0f0' : '#F5F5F5',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {!imageLoaded && (
        <div 
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: '#E0E0E0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#888'
          }}
        >
          로딩 중...
        </div>
      )}
      {imageSrc && (
        <img 
          src={imageSrc} 
          alt={camera.name} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
        />
      )}
    </div>
  );
};

const ReservationMainPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [rentalDate, setRentalDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [rentalTime, setRentalTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [categories, setCategories] = useState([
    { name: 'All', count: 0 },
    { name: 'Filming', count: 0 },
    { name: 'Lighting', count: 0 },
    { name: 'Battery', count: 0 },
    { name: 'Sound', count: 0 },
    { name: 'VR device', count: 0 },
    { name: 'ETC', count: 0 }
  ]);

  const [minReturnDate, setMinReturnDate] = useState('');
  const [maxReturnDate, setMaxReturnDate] = useState('');
  const camerasPerPage = 12;

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
      alert('대여 및 반납 날짜와 시간을 먼저 선택해주세요.');
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
      
      alert(`${camera.name}이(가) 장바구니에 추가되었습니다.`);
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
        transition: 'transform 0.3s'
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
            fontSize: '10px'
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
    navigate('/cart');
  };

  // Firestore에서 카메라 데이터 fetching
  const fetchCameras = async () => {
    try {
      const cameraRef = collection(db, 'cameras');
      const snapshot = await getDocs(cameraRef);
      
      const cameraData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCameras(cameraData);
      
      const updatedCategories = [
        { name: 'All', count: cameraData.length },
        ...['Filming', 'Lighting', 'Battery', 'Sound', 'VR device', 'ETC'].map(catName => ({
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

  const timeOptions = generateTimeOptions();

  // 대여 날짜 변경 핸들러
  const handleRentalDateChange = (e) => {
    const selectedRentalDate = e.target.value;
    setRentalDate(selectedRentalDate);

    setMinReturnDate(selectedRentalDate);

    const maxDate = new Date(selectedRentalDate);
    maxDate.setDate(maxDate.getDate() + 8);
    
    const maxDateString = maxDate.toISOString().split('T')[0];
    setMaxReturnDate(maxDateString);

    if (returnDate && new Date(returnDate) > maxDate) {
      setReturnDate('');
    }
  };

  // 카테고리 토글
  const toggleCategory = (categoryName) => {
    setSelectedCategory(prev => prev === categoryName ? 'All' : categoryName);
  };

  // 필터링된 카메라
  const filteredCameras = cameras
  .filter(camera => 
    (!availableOnly || camera.status === 'available') &&
    (selectedCategory === 'All' || camera.category === selectedCategory) &&
    camera.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastCamera = currentPage * camerasPerPage;
  const indexOfFirstCamera = indexOfLastCamera - camerasPerPage;
  const currentCameras = filteredCameras.slice(indexOfFirstCamera, indexOfLastCamera);

  const totalPages = Math.ceil(filteredCameras.length / camerasPerPage);

  // 로그인되지 않은 경우 null 또는 로딩 상태 반환


  return (
    <div style={{
      position: 'relative',
      width: '1440px',
      height: '1700px',
      background: '#FFFFFF',
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
          <span style={{ color: '#888', cursor: 'default' }}>Reservation</span>
          <span onClick={handleNoteNavigation} style={{ cursor: 'pointer' }}>Note</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            position: 'absolute',
            fontSize: '36px', 
            fontWeight: 'bold', 
            letterSpacing: '0px',
            top: '0px',
            left: '70px'
          }}>DIRT</div>
          <div style={{ 
            fontSize: '12px', 
            color: '#000000',
            position: 'absolute',
            left: '110px',
            top: '40px',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontWeight: '100'
          }}>Digital content rental service</div>
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
            backgroundColor: '#f0f0f0'
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
              <input
                type="date"
                value={rentalDate}
                onChange={handleRentalDateChange}
                style={{
                  padding: '10px',
                  width: '150px',
                  height: '40px',
                  fontSize: '16px',
                  border: '1px solid #ccc',
                  borderRadius: '5px'
                }}
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
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={minReturnDate}
                max={maxReturnDate}
                style={{
                  padding: '10px',
                  width: '150px',
                  height: '40px',
                  fontSize: '16px',
                  border: '1px solid #ccc',
                  borderRadius: '5px'
                }}
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
                {timeOptions.map((t) => (
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
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              overflow: 'hidden',
              position: 'relative',
              transition: 'transform 0.3s, box-shadow 0.3s',
              transform: selectedCameraId === camera.id ? 'scale(1.05)' : 'scale(1)',
              boxShadow: selectedCameraId === camera.id ? '0 4px 10px rgba(0,0,0,0.1)' : 'none'
            }}
            onMouseEnter={() => setSelectedCameraId(camera.id)}
            onMouseLeave={() => setSelectedCameraId(null)}
          >
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
                    주의: {camera.issues}
                  </div>
                )}

                {/* Camera Image */}
                <ImageWithPlaceholder camera={camera} />

                {/* Camera Details */}
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: selectedCameraId === camera.id ? '#f9f9f9' : 'white' 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <span style={{ fontWeight: 'bold' }}>{camera.name}</span>
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
                              camera.condition === '주의' ? 'yellow' : '#666' }} />
                    <span>상태: {camera.condition}</span>
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
            {[...Array(Math.min(totalPages, 3)).keys()].map((index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '5px 10px',
                    border: '1px solid #ccc',
                    backgroundColor: currentPage === page ? 'black' : 'white',
                    color: currentPage === page ? 'white' : 'black'
                  }}
                >
                  {page}
                </button>
              );
            })}
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