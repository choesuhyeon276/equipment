import React, { useState, useEffect } from 'react';
import {
  Settings, Save, Mail, Phone, User, Plus, X,
  ArrowLeft, AlertTriangle, Check, MessageCircle, FileText, Palette
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 🔹 firebaseConfig에서 필요한 것들 모두 import
import { db, getAuth, doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from '../firebase/firebaseConfig';

// 🔹 공용 유틸
import { fetchAdminSettings, saveAdminSettings } from '../utils/adminSettings';

const AdminSettingsPage = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 설정 상태
  const [settings, setSettings] = useState({
    adminEmails: [],
    adminName: '',
    adminPhone: '',
    kakaoOpenChatUrl: '',
    notesCards: [],
  });

  const [newEmail, setNewEmail] = useState('');

  // ──────────────────────────────────────────────
  // 로그인/권한 체크 + 설정 로드
  // ──────────────────────────────────────────────
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        navigate('/login');
        return;
      }

      // 권한 체크
      const isAdmin = await checkAdminRole(
        firebaseUser.uid,
        firebaseUser.email || '',
        firebaseUser.displayName || '관리자'
      );

      if (!isAdmin) {
        alert('관리자 권한이 없습니다.');
        navigate('/main');
        return;
      }

      setAdmin({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || '관리자',
      });

      await loadAdminSettings();
    });

    return () => unsubscribe();
  }, [navigate]);

  // ──────────────────────────────────────────────
  // 관리자 권한 체크
  // ──────────────────────────────────────────────
  const checkAdminRole = async (userId, email, displayName) => {
    try {
      const userRef = doc(db, 'user_profiles', userId);
      
      // 1) admin_settings에서 최신 adminEmails 확인
      const s = await fetchAdminSettings();
      const isInAdminList = 
        Array.isArray(s.adminEmails) && email
          ? s.adminEmails.includes(email)
          : false;

      // 2) admin_settings에 있으면 user_profiles 업데이트
      if (isInAdminList) {
        await setDoc(
          userRef,
          {
            uid: userId,
            email,
            name: displayName || '관리자',
            role: 'admin',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        console.log('✅ admin_settings에서 관리자 확인:', email);
        return true;
      }

      // 3) user_profiles의 role 확인
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data()?.role === 'admin') {
        console.log('✅ user_profiles에서 관리자 확인:', email);
        return true;
      }

      console.log('❌ 관리자 권한 없음:', email);
      return false;
    } catch (err) {
      console.error('Error checking admin role:', err);
      return false;
    }
  };

  // ──────────────────────────────────────────────
  // 🔹 새로운 함수: 이메일로 사용자 찾아서 관리자 역할 부여
  // ──────────────────────────────────────────────
  const grantAdminRoleToEmail = async (email) => {
    try {
      // user_profiles 컬렉션에서 해당 이메일을 가진 사용자 찾기
      const usersRef = collection(db, 'user_profiles');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log(`ℹ️ 이메일 ${email}에 해당하는 사용자가 아직 가입하지 않았습니다.`);
        return { success: false, reason: 'not_found' };
      }

      // 찾은 사용자에게 관리자 역할 부여
      const promises = [];
      querySnapshot.forEach((docSnap) => {
        const userRef = doc(db, 'user_profiles', docSnap.id);
        promises.push(
          setDoc(
            userRef,
            {
              role: 'admin',
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          )
        );
      });

      await Promise.all(promises);
      console.log(`✅ 이메일 ${email}의 사용자에게 관리자 역할 부여 완료`);
      return { success: true, count: querySnapshot.size };
    } catch (error) {
      console.error(`❌ 이메일 ${email}에 관리자 역할 부여 실패:`, error);
      return { success: false, reason: 'error', error };
    }
  };

  // ──────────────────────────────────────────────
  // 🔹 모든 관리자 이메일에 역할 부여 (일괄 처리)
  // ──────────────────────────────────────────────
  const grantAdminRoleToAllEmails = async (emailList) => {
    const results = {
      granted: [],
      notFound: [],
      errors: [],
    };

    for (const email of emailList) {
      const result = await grantAdminRoleToEmail(email);
      if (result.success) {
        results.granted.push(email);
      } else if (result.reason === 'not_found') {
        results.notFound.push(email);
      } else {
        results.errors.push(email);
      }
    }

    return results;
  };

  // ──────────────────────────────────────────────
  // 설정 불러오기
  // ──────────────────────────────────────────────
  const loadAdminSettings = async () => {
    try {
      const loaded = await fetchAdminSettings();
      setSettings(loaded);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading admin settings:', error);
      setMessage({ type: 'error', text: '설정을 불러오는 중 오류가 발생했습니다.' });
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  // 설정 저장 (관리자 역할 자동 부여 포함)
  // ──────────────────────────────────────────────
  const onSaveSettings = async () => {
    if (
      !settings.adminName.trim() ||
      !settings.adminPhone.trim() ||
      !Array.isArray(settings.adminEmails) ||
      settings.adminEmails.length === 0
    ) {
      setMessage({ type: 'error', text: '모든 필드를 올바르게 입력해주세요.' });
      return;
    }

   

    setSaving(true);
    try {
      // 1) admin_settings 저장
      await saveAdminSettings({
        adminEmails: settings.adminEmails,
        adminName: settings.adminName.trim(),
        adminPhone: settings.adminPhone.trim(),
        kakaoOpenChatUrl: settings.kakaoOpenChatUrl.trim(),
        notesCards: settings.notesCards,
        updatedBy: admin?.uid || 'unknown',
      });

      // 2) 🔹 모든 관리자 이메일에 자동으로 역할 부여
      const roleResults = await grantAdminRoleToAllEmails(settings.adminEmails);

      // 결과 메시지 생성
      let resultMessage = '설정이 성공적으로 저장되었습니다.';
      
      if (roleResults.granted.length > 0) {
        resultMessage += ` ${roleResults.granted.length}명의 사용자에게 관리자 권한이 부여되었습니다.`;
      }
      
      if (roleResults.notFound.length > 0) {
        resultMessage += ` ${roleResults.notFound.length}개의 이메일은 아직 가입하지 않았습니다. (가입 시 자동으로 관리자 권한 부여)`;
      }
      
      if (roleResults.errors.length > 0) {
        resultMessage += ` ⚠️ ${roleResults.errors.length}개의 이메일 처리 중 오류가 발생했습니다.`;
      }

      setMessage({ type: 'success', text: resultMessage });
      setTimeout(() => setMessage({ type: '', text: '' }), 6000);
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      setMessage({ type: 'error', text: '설정 저장 중 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────────
  // 이메일 추가 (즉시 역할 부여 시도)
  // ──────────────────────────────────────────────
  const addEmail = async () => {
    const v = newEmail.trim();
    if (!v) return setMessage({ type: 'error', text: '이메일을 입력해주세요.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(v))
      return setMessage({ type: 'error', text: '올바른 이메일 형식을 입력해주세요.' });

    if (settings.adminEmails.includes(v))
      return setMessage({ type: 'error', text: '이미 존재하는 이메일입니다.' });

    // 이메일 목록에 추가
    setSettings((prev) => ({ ...prev, adminEmails: [...prev.adminEmails, v] }));
    setNewEmail('');

    // 🔹 즉시 해당 이메일에 관리자 역할 부여 시도
    const result = await grantAdminRoleToEmail(v);
    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: `이메일이 추가되었고, ${result.count}명의 사용자에게 즉시 관리자 권한이 부여되었습니다. '설정 저장'을 눌러 완료하세요.` 
      });
    } else if (result.reason === 'not_found') {
      setMessage({ 
        type: 'success', 
        text: `이메일이 추가되었습니다. 해당 이메일로 가입 시 자동으로 관리자 권한이 부여됩니다. '설정 저장'을 눌러 완료하세요.` 
      });
    } else {
      setMessage({ 
        type: 'error', 
        text: '이메일은 추가되었지만 역할 부여 중 오류가 발생했습니다. 설정 저장 후 다시 시도됩니다.' 
      });
    }

    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // ──────────────────────────────────────────────
  // 이메일 삭제
  // ──────────────────────────────────────────────
  const removeEmail = (emailToRemove) => {
    if (settings.adminEmails.length <= 1)
      return setMessage({ type: 'error', text: '최소 하나의 관리자 이메일이 필요합니다.' });

    setSettings((prev) => ({
      ...prev,
      adminEmails: prev.adminEmails.filter((e) => e !== emailToRemove),
    }));
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setMessage({ type: '', text: '' });
  };

  const updateNotesCard = (idx, field, value) => {
    setSettings(prev => ({
      ...prev,
      notesCards: prev.notesCards.map((card, i) =>
        i === idx ? { ...card, [field]: value } : card
      )
    }));
  };

  const removeNotesCard = (idx) => {
    setSettings(prev => ({
      ...prev,
      notesCards: prev.notesCards.filter((_, i) => i !== idx)
    }));
  };

  const addNotesCard = () => {
    setSettings(prev => ({
      ...prev,
      notesCards: [...prev.notesCards, { title: '새 카드', color: '#607D8B', content: '' }]
    }));
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'newEmail') addEmail();
    }
  };

  // ──────────────────────────────────────────────
  // 로딩
  // ──────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // UI
  // ──────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#1976d2',
          color: 'white',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/admins')}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '15px',
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <Settings size={24} style={{ marginRight: '10px' }} />
          <h1 style={{ margin: 0 }}>관리자 설정</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <User size={18} style={{ marginRight: '5px' }} />
          <span>{admin?.name || '관리자'}</span>
        </div>
      </div>

      {/* 메시지 표시 */}
      {message.text && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {message.type === 'success' ? (
            <Check size={20} style={{ marginRight: '8px' }} />
          ) : (
            <AlertTriangle size={20} style={{ marginRight: '8px' }} />
          )}
          {message.text}
        </div>
      )}

      {/* 설정 폼 */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {/* 관리자 이름 */}
        <div style={{ marginBottom: '25px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            <User size={18} style={{ marginRight: '8px' }} />
            관리자/조직 이름
          </label>
          <input
            type="text"
            value={settings.adminName || ''}
            onChange={(e) => handleInputChange('adminName', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'adminName')}
            placeholder="예: DKit 관리자"
            autoComplete="off"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box',
              backgroundColor: '#fff',
              color: '#000',
            }}
          />
          <small style={{ color: '#666', fontSize: '12px' }}>이메일 발송 시 발신자 이름으로 사용됩니다.</small>
        </div>

        {/* 연락처 */}
        <div style={{ marginBottom: '25px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            <Phone size={18} style={{ marginRight: '8px' }} />
            관리자 연락처
          </label>
          <input
            type="text"
            value={settings.adminPhone || ''}
            onChange={(e) => handleInputChange('adminPhone', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'adminPhone')}
            placeholder="예: 010-1234-5678"
            autoComplete="off"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd', 
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box',
              backgroundColor: '#fff',
              color: '#000',
            }}
          />
          <small style={{ color: '#666', fontSize: '12px' }}>이메일 내용에 문의 연락처로 포함됩니다.</small>
        </div>

        {/* 카카오톡 오픈채팅 링크 */}
        <div style={{ marginBottom: '25px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            <MessageCircle size={18} style={{ marginRight: '8px' }} />
            카카오톡 오픈채팅 링크
          </label>
          <input
            type="text"
            value={settings.kakaoOpenChatUrl || ''}
            onChange={(e) => handleInputChange('kakaoOpenChatUrl', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'kakaoOpenChatUrl')}
            autoComplete="off"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box',
              backgroundColor: '#fff',
              color: '#000',
            }}
          />
          <small style={{ color: '#666', fontSize: '12px' }}>카카오톡 오픈채팅방 링크를 입력하면 Things Note 페이지에서 바로 접속할 수 있습니다. (선택사항)</small>
        </div>

        {/* 관리자 이메일 목록 */}
        <div style={{ marginBottom: '25px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            <Mail size={18} style={{ marginRight: '8px' }} />
            관리자 이메일 목록
          </label>

          {/* 현재 이메일 목록 */}
          <div style={{ marginBottom: '15px' }}>
            {Array.isArray(settings.adminEmails) &&
              settings.adminEmails.map((email, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    marginBottom: '5px',
                  }}
                >
                  <span style={{ color: '#333' }}>{email}</span>
                  <button
                    onClick={() => removeEmail(email)}
                    disabled={settings.adminEmails.length <= 1}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                      backgroundColor: settings.adminEmails.length <= 1 ? '#ccc' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: settings.adminEmails.length <= 1 ? 'not-allowed' : 'pointer',
                      opacity: settings.adminEmails.length <= 1 ? 0.6 : 1,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
          </div>

          {/* 새 이메일 추가 */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'newEmail')}
              placeholder="새 관리자 이메일 추가"
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#000',
              }}
            />
            <button
              onClick={addEmail}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '10px 15px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              <Plus size={16} />
              추가
            </button>
          </div>
          <small style={{ color: '#666', fontSize: '12px' }}>
            알림 메일을 받을 관리자 이메일을 추가하세요. 이메일 추가 시 해당 사용자에게 즉시 관리자 권한이 부여됩니다.
          </small>
        </div>

        {/* 주의사항 카드 편집 */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', fontWeight: 'bold', color: '#333' }}>
            <FileText size={18} style={{ marginRight: '8px' }} />
            주의사항 카드 편집 (Things Note 페이지에 표시)
          </label>
          <small style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '12px' }}>
            장비장 연락망 카드는 위의 관리자 정보에서 자동으로 반영됩니다. 아래에서 나머지 카드를 자유롭게 편집하세요.
          </small>

          {Array.isArray(settings.notesCards) && settings.notesCards.map((card, idx) => (
            <div key={idx} style={{
              marginBottom: '12px',
              padding: '16px',
              border: `2px solid ${card.color}22`,
              borderLeft: `4px solid ${card.color}`,
              borderRadius: '8px',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={card.title}
                  onChange={(e) => updateNotesCard(idx, 'title', e.target.value)}
                  placeholder="카드 제목"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#333'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Palette size={16} color="#666" />
                  <input
                    type="color"
                    value={card.color}
                    onChange={(e) => updateNotesCard(idx, 'color', e.target.value)}
                    title="카드 색상 선택"
                    style={{
                      width: '40px',
                      height: '36px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '2px',
                      cursor: 'pointer',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
                <button
                  onClick={() => removeNotesCard(idx)}
                  title="카드 삭제"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <X size={14} />
                </button>
              </div>
              <textarea
                value={card.content}
                onChange={(e) => updateNotesCard(idx, 'content', e.target.value)}
                placeholder="카드 내용을 입력하세요. 줄바꿈은 Enter로 구분됩니다."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: '1.6',
                  color: '#333',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          ))}

          <button
            onClick={addNotesCard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              marginTop: '4px'
            }}
          >
            <Plus size={16} />
            카드 추가
          </button>
        </div>

        {/* 저장 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
          <button
            onClick={onSaveSettings}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: saving ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            <Save size={18} />
            {saving ? '저장 중...' : '설정 저장'}
          </button>
        </div>

        {/* 안내 메시지 */}
        <div
          style={{
            marginTop: '30px',
            padding: '15px',
            backgroundColor: '#e7f3ff',
            border: '1px solid #b3d7ff',
            borderRadius: '6px',
            color: '#004085',
          }}
        >
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>📌 설정 안내</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.5' }}>
            <li>관리자 이름: 시스템에서 발송하는 모든 이메일의 발신자 이름으로 사용됩니다.</li>
            <li>연락처: 이메일 내용에 문의 연락처로 포함되어 사용자들이 연락할 수 있습니다.</li>
            <li>카카오톡 오픈채팅: Things Note 페이지에서 카카오톡 아이콘 클릭 시 이동할 오픈채팅방 링크입니다.</li>
            <li>이메일 목록: 대여 신청, 반납 요청 등의 알림을 받을 관리자들의 이메일입니다.</li>
            <li><strong>⚡ 자동 권한 부여:</strong> 이메일 추가 시 Firebase에서 해당 이메일의 사용자를 찾아 즉시 관리자 권한을 부여합니다.</li>
            <li><strong>💡 미가입 사용자:</strong> 아직 가입하지 않은 이메일도 추가할 수 있으며, 해당 이메일로 로그인 시 자동으로 관리자 권한이 부여됩니다.</li>
            <li>설정 변경 후 반드시 '설정 저장' 버튼을 클릭해야 변경사항이 적용됩니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
//
export default AdminSettingsPage;