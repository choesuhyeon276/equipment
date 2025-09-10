import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || '사용자'
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.log('Firebase 인증된 유저 없음');
        setUser(null);
        localStorage.removeItem('user');
        
        // 로그인이 필요한 페이지들만 리다이렉트
        const loginRequiredPages = [
          '/cart',
          '/mypage', 
          '/admins',
          '/cameramanagement',
          '/admin-settings'
        ];
        
        // 현재 페이지가 로그인이 필요한 페이지인 경우에만 리다이렉트
        if (loginRequiredPages.includes(location.pathname)) {
          navigate('/login', { state: { from: location.pathname } });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);