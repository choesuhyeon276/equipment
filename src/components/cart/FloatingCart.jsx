import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

const FloatingCart = ({ userId: propUserId }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [newItemId, setNewItemId] = useState(null);
  const [prevCount, setPrevCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const getUserId = () => {
    if (propUserId) return propUserId;
    try {
      const stored = localStorage.getItem('user');
      if (stored) return JSON.parse(stored).uid;
    } catch {}
    return null;
  };

  // resize 감지
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Firestore 카트 구독
  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    const userCartRef = doc(db, 'user_carts', userId);

    const unsubscribe = onSnapshot(userCartRef, (snapshot) => {
      if (snapshot.exists()) {
        const items = snapshot.data().items || [];

        if (items.length > prevCount) {
          const latest = items[items.length - 1];
          setNewItemId(latest.id);
          setIsMinimized(false);
          setTimeout(() => setNewItemId(null), 2000);
        }

        setPrevCount(items.length);
        setCartItems(items);
      } else {
        setCartItems([]);
      }
    });

    return () => unsubscribe();
  }, [propUserId]);

  const totalCount = cartItems.length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    return m === '00' ? `${parseInt(h)}시` : `${parseInt(h)}:${m}`;
  };

  if (isMobile) return null;
  if (!isOpen) return null;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header} onClick={() => setIsMinimized(!isMinimized)}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🛒</span>
          <span style={styles.headerTitle}>담은 장비</span>
          {totalCount > 0 && (
            <span style={styles.badge}>{totalCount}</span>
          )}
        </div>
        <div style={styles.headerActions}>
          <span style={styles.chevron}>
            {isMinimized ? '▲' : '▼'}
          </span>
          <span
            style={styles.closeBtn}
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            title="닫기"
          >
            ✕
          </span>
        </div>
      </div>

      {!isMinimized && (
        <div style={styles.body}>
          {cartItems.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>📦</span>
              <p style={styles.emptyText}>아직 담은 장비가 없어요</p>
            </div>
          ) : (
            <>
              <div style={styles.itemList}>
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      ...styles.itemCard,
                      ...(newItemId === item.id ? styles.itemCardNew : {})
                    }}
                  >
                    <div style={styles.itemImageWrap}>
                      {item.imageURL ? (
                        <img
                          src={item.imageURL}
                          alt={item.name}
                          style={styles.itemImage}
                        />
                      ) : (
                        <div style={styles.itemImagePlaceholder}>📷</div>
                      )}
                    </div>

                    <div style={styles.itemInfo}>
                      <p style={styles.itemName}>{item.name}</p>
                      <p style={styles.itemCategory}>{item.category}</p>
                      {item.rentalDate && (
                        <p style={styles.itemDate}>
                          {formatDate(item.rentalDate)} {formatTime(item.rentalTime)}
                          {' → '}
                          {formatDate(item.returnDate)} {formatTime(item.returnTime)}
                        </p>
                      )}
                    </div>

                    {newItemId === item.id && (
                      <span style={styles.newBadge}>NEW</span>
                    )}
                  </div>
                ))}
              </div>

              <button
                style={styles.goCartBtn}
                onClick={() => navigate('/cart')}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#000'}
              >
                예약 신청하기 →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    position: 'fixed',
    top: '120px',
    right: '20px',
    width: '260px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
    zIndex: 1000,
    fontFamily: 'Pretendard, sans-serif',
    border: '1px solid #E8E8E8',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    backgroundColor: '#000',
    cursor: 'pointer',
    userSelect: 'none',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerIcon: {
    fontSize: '16px',
  },
  headerTitle: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
  },
  badge: {
    backgroundColor: '#fff',
    color: '#000',
    borderRadius: '20px',
    padding: '1px 7px',
    fontSize: '11px',
    fontWeight: '800',
    minWidth: '20px',
    textAlign: 'center',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  chevron: {
    color: '#aaa',
    fontSize: '10px',
  },
  closeBtn: {
    color: '#aaa',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: '4px',
    transition: 'color 0.15s',
  },
  body: {
    maxHeight: '480px',
    overflowY: 'auto',
    padding: '12px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '30px 10px',
    gap: '8px',
  },
  emptyIcon: {
    fontSize: '32px',
    opacity: 0.4,
  },
  emptyText: {
    color: '#aaa',
    fontSize: '13px',
    margin: 0,
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },
  itemCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F7F7F7',
    borderRadius: '10px',
    padding: '10px',
    position: 'relative',
    transition: 'background-color 0.3s, transform 0.3s',
    border: '1.5px solid transparent',
  },
  itemCardNew: {
    backgroundColor: '#F0F7FF',
    border: '1.5px solid #4A90E2',
    transform: 'scale(1.02)',
  },
  itemImageWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#E0E0E0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  itemImagePlaceholder: {
    fontSize: '20px',
    opacity: 0.5,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#111',
    margin: '0 0 2px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemCategory: {
    fontSize: '11px',
    color: '#999',
    margin: '0 0 3px 0',
  },
  itemDate: {
    fontSize: '11px',
    color: '#666',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  newBadge: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    backgroundColor: '#4A90E2',
    color: '#fff',
    fontSize: '9px',
    fontWeight: '800',
    borderRadius: '4px',
    padding: '1px 5px',
    letterSpacing: '0.5px',
  },
  goCartBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '-0.3px',
    transition: 'background-color 0.15s',
  },
};

export default FloatingCart;