import React, { useState, useEffect } from 'react';
import { User, ShoppingCart, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { getImageURL } from '../firebase/firebaseConfig';

const ReservationMainPage = () => {
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
  const [imageUrls, setImageUrls] = useState({});
  const camerasPerPage = 12;


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
      
      // 카테고리 카운트 업데이트
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

  // Image Loading Effect
  useEffect(() => {
    const fetchImageUrls = async () => {
      const urls = {};
      for (const camera of cameras) {
        try {
          const url = await getImageURL(camera.image);
          urls[camera.id] = url;
        } catch (error) {
          console.error(`Error loading image for ${camera.name}:`, error);
          urls[camera.id] = null;
        }
      }
      setImageUrls(urls);
    };

    if (cameras.length > 0) {
      fetchImageUrls();
    }
  }, [cameras]);

  // 초기 데이터 로딩
  useEffect(() => {
    fetchCameras();
  }, []);

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

  const handleRentalDateChange = (e) => {
    const selectedRentalDate = e.target.value;
    setRentalDate(selectedRentalDate);

    // 최소 반납일자 설정 (대여일자와 같은 날)
    setMinReturnDate(selectedRentalDate);

    // 최대 반납일자 설정 (대여일자로부터 8일 후)
    const maxDate = new Date(selectedRentalDate);
    maxDate.setDate(maxDate.getDate() + 8);
    
    // 최대 반납일자를 YYYY-MM-DD 형식으로 변환
    const maxDateString = maxDate.toISOString().split('T')[0];
    setMaxReturnDate(maxDateString);

    // 현재 반납일자가 최대 반납일자를 초과하면 초기화
    if (returnDate && new Date(returnDate) > maxDate) {
      setReturnDate('');
    }
  };

  const toggleCategory = (categoryName) => {
    // 이미 선택된 카테고리를 다시 클릭하면 선택 해제
    setSelectedCategory(prev => prev === categoryName ? 'All' : categoryName);
  };

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
          <span>Home</span>
          <span>Calendar</span>
          <span>Reservation</span>
          <span>Note</span>
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
          }}>
            <User size={20} />
            <span>My page</span>
          </div>
          <div style={{ 
            position: 'absolute',
            right: '13px',
            display: 'flex', 
            top: '0px',
            alignItems: 'center', 
            gap: '5px', 
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '20px',
            backgroundColor: '#f0f0f0'
          }}>
            <ShoppingCart size={20} />
            <span>Cart</span>
          </div>
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
                {/* Camera Image */}
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
                  {camera.status === 'rented' && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(255,0,0,0.6)',
                      color: 'white',
                      padding: '5px',
                      textAlign: 'center',
                      zIndex: 10
                    }}>
                      대여 중
                    </div>
                  )}
                  {imageUrls[camera.id] ? (
                    <img 
                      src={imageUrls[camera.id]} 
                      alt={camera.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    camera.name
                  )}
                </div>

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
                    <AlertCircle size={14} style={{ marginRight: '5px' }} />
                    <span>상태: {camera.condition}</span>
                  </div>
                </div>

                {/* Cart Button on Hover */}
                {selectedCameraId === camera.id && camera.status === 'available' && (
                  <div style={{
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
                  }}>
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