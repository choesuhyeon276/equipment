import React, { useState, useEffect } from 'react';
import { User, ShoppingCart, Trash2, CheckCircle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { getImageURL } from '../firebase/firebaseConfig';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageUrls, setImageUrls] = useState({});

  // Fetch cart items (simulated with Firestore for now)
  const fetchCartItems = async () => {
    try {
      const cartRef = collection(db, 'cart');
      const snapshot = await getDocs(cartRef);
      
      const cartData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCartItems(cartData);
      setLoading(false);
    } catch (err) {
      console.error("장바구니 데이터 로딩 중 오류:", err);
      setError(err);
      setLoading(false);
    }
  };

  // Image Loading Effect
  useEffect(() => {
    const fetchImageUrls = async () => {
      const urls = {};
      for (const item of cartItems) {
        try {
          const url = await getImageURL(item.image);
          urls[item.id] = url;
        } catch (error) {
          console.error(`Error loading image for ${item.name}:`, error);
          urls[item.id] = null;
        }
      }
      setImageUrls(urls);
    };

    if (cartItems.length > 0) {
      fetchImageUrls();
    }
  }, [cartItems]);

  // Initial data loading
  useEffect(() => {
    fetchCartItems();
  }, []);

  // Calculate total price
  const calculateTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.dailyRentalPrice * item.rentalDays);
    }, 0);
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Update rental days
  const updateRentalDays = (itemId, days) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, rentalDays: Math.max(1, days) } : item
      )
    );
  };

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
      {/* Header - Same as Reservation Page */}
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

      {/* Cart Content Area */}
      <div style={{
        position: 'absolute',
        top: '150px',
        left: '50px',
        right: '50px'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '20px' 
        }}>
          장바구니
        </h2>

        {loading ? (
          <div>로딩 중...</div>
        ) : error ? (
          <div>오류 발생: {error.message}</div>
        ) : cartItems.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#888',
            padding: '50px' 
          }}>
            장바구니가 비어있습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Cart Items */}
            <div style={{ 
              flex: 2, 
              border: '1px solid #E0E0E0', 
              borderRadius: '10px',
              padding: '20px'
            }}>
              {cartItems.map((item) => (
                <div 
                  key={item.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1px solid #E0E0E0',
                    paddingBottom: '15px',
                    marginBottom: '15px'
                  }}
                >
                  {/* Item Image */}
                  <div style={{ 
                    width: '150px', 
                    height: '150px', 
                    marginRight: '20px',
                    backgroundColor: '#F5F5F5',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {imageUrls[item.id] ? (
                      <img 
                        src={imageUrls[item.id]} 
                        alt={item.name} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }} 
                      />
                    ) : (
                      item.name
                    )}
                  </div>

                  {/* Item Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center' 
                    }}>
                      <h3 style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold' 
                      }}>
                        {item.name}
                      </h3>
                      <div 
                        style={{ 
                          cursor: 'pointer',
                          color: '#888'
                        }}
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={20} />
                      </div>
                    </div>
                    <p style={{ color: '#666', marginTop: '5px' }}>
                      {item.category} | {item.condition}
                    </p>

                    {/* Rental Duration */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginTop: '15px' 
                    }}>
                      <span style={{ marginRight: '10px' }}>대여 기간:</span>
                      <input 
                        type="number" 
                        min="1" 
                        value={item.rentalDays} 
                        onChange={(e) => updateRentalDays(item.id, parseInt(e.target.value))}
                        style={{
                          width: '60px',
                          padding: '5px',
                          textAlign: 'center',
                          border: '1px solid #ccc',
                          borderRadius: '5px'
                        }}
                      />
                      <span style={{ marginLeft: '10px' }}>일</span>
                    </div>

                    {/* Price */}
                    <div style={{ 
                      marginTop: '10px', 
                      fontWeight: 'bold',
                      fontSize: '16px' 
                    }}>
                      {(item.dailyRentalPrice * item.rentalDays).toLocaleString()}원
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div style={{ 
              flex: 1, 
              border: '1px solid #E0E0E0', 
              borderRadius: '10px',
              padding: '20px',
              height: 'fit-content'
            }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                marginBottom: '20px' 
              }}>
                주문 요약
              </h3>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '10px' 
              }}>
                <span>총 대여 금액</span>
                <span style={{ fontWeight: 'bold' }}>
                  {calculateTotalPrice().toLocaleString()}원
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '20px',
                paddingBottom: '10px',
                borderBottom: '1px solid #E0E0E0'
              }}>
                <span>할인 금액</span>
                <span style={{ color: 'red' }}>0원</span>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '20px',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                <span>총 결제 금액</span>
                <span>{calculateTotalPrice().toLocaleString()}원</span>
              </div>

              <button style={{
                width: '100%',
                padding: '15px',
                backgroundColor: 'black',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <CheckCircle size={20} />
                결제하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;