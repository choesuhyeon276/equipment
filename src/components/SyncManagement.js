import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useGoogleLogin } from '@react-oauth/google';
import FirebaseSheetsSync from '../utils/FirebaseSheetsSync';
import { Download, Upload, RefreshCw, Database, FileText, CheckCircle, FileUp, LogIn, LogOut } from 'lucide-react';

const SyncManagement = () => {
  const [syncService] = useState(() => new FirebaseSheetsSync());
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const fileInputRef = useRef(null);

  // Google 로그인
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      syncService.setAccessToken(tokenResponse.access_token);
      setIsLoggedIn(true);
      
      // 사용자 정보 가져오기
      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoResponse.json();
        setUserEmail(userInfo.email);
        toast.success(`✅ ${userInfo.email}로 로그인되었습니다!`);
      } catch (error) {
        console.error('User info fetch error:', error);
        toast.success('✅ Google 로그인 성공!');
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      toast.error('❌ 로그인 실패');
    },
    scope: 'https://www.googleapis.com/auth/spreadsheets'
  });

  // 로그아웃
  const handleLogout = () => {
    syncService.setAccessToken(null);
    setIsLoggedIn(false);
    setUserEmail('');
    if (autoSyncEnabled) {
      handleToggleAutoSync();
    }
    toast.info('로그아웃되었습니다.');
  };

  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  // Firebase → Google Sheets 내보내기
  const handleExportToSheets = async () => {
    if (!isLoggedIn) {
      toast.error('❌ 먼저 Google 계정으로 로그인해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await syncService.exportToSheets();
      setLastSync(new Date());
      toast.success(`✅ ${result.count}개 장비를 Google Sheets로 내보냈습니다!`);
    } catch (error) {
      // SyncManagement.js:72에서 에러 처리
      toast.error('❌ Google Sheets 내보내기 실패: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sheets → Firebase 가져오기
  const handleImportFromSheets = async () => {
    if (!isLoggedIn) {
      toast.error('❌ 먼저 Google 계정으로 로그인해주세요.');
      return;
    }

    if (!window.confirm('Google Sheets의 데이터로 Firebase를 업데이트하시겠습니까?\n주의: 기존 데이터가 수정될 수 있습니다.')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await syncService.importFromSheets();
      setLastSync(new Date());
      toast.success(`✅ 동기화 완료!\n업데이트: ${result.updated}개\n생성: ${result.created}개`);
    } catch (error) {
      toast.error('❌ Google Sheets 가져오기 실패: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // JSON 백업 생성
  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const result = await syncService.createBackup();
      toast.success(`✅ 백업 완료! ${result.count}개 장비가 백업되었습니다.`);
    } catch (error) {
      toast.error('❌ 백업 실패: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // JSON 파일 불러오기
  const handleRestoreFromJSON = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`"${file.name}" 파일로 Firebase를 복원하시겠습니까?\n주의: 기존 데이터가 수정될 수 있습니다.`)) {
      event.target.value = '';
      return;
    }

    setIsLoading(true);
    try {
      const result = await syncService.restoreFromJSON(file);
      setLastSync(new Date());
      toast.success(`✅ JSON 복원 완료!\n업데이트: ${result.updated}개\n생성: ${result.created}개${result.errors > 0 ? `\n실패: ${result.errors}개` : ''}`);
    } catch (error) {
      toast.error('❌ JSON 복원 실패: ' + error.message);
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  // 실시간 동기화 토글
  const handleToggleAutoSync = () => {
    if (!isLoggedIn) {
      toast.error('❌ 먼저 Google 계정으로 로그인해주세요.');
      return;
    }

    if (!autoSyncEnabled) {
      const unsub = syncService.setupRealtimeSync((changes) => {
        if (changes.length > 0) {
          toast.info(`🔄 ${changes.length}개 변경사항이 Google Sheets에 자동 반영되었습니다.`);
          setLastSync(new Date());
        }
      });
      setUnsubscribe(() => unsub);
      setAutoSyncEnabled(true);
      toast.success('✅ 실시간 동기화가 활성화되었습니다!');
    } else {
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
      setAutoSyncEnabled(false);
      toast.info('⏸️ 실시간 동기화가 비활성화되었습니다.');
    }
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Pretendard, sans-serif'
    }}>
      <h1 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '10px',
        color: '#333'
      }}>
        🔄 데이터 동기화 & 백업
      </h1>
      <p style={{
        fontSize: '14px',
        color: '#666',
        marginBottom: '30px'
      }}>
        Firebase와 Google Sheets를 동기화하고 데이터를 백업/복원하세요.
      </p>

      {/* Google 로그인 섹션 */}
      <div style={{
        backgroundColor: isLoggedIn ? '#d4edda' : '#fff3cd',
        border: `1px solid ${isLoggedIn ? '#c3e6cb' : '#ffc107'}`,
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px', color: isLoggedIn ? '#155724' : '#856404' }}>
            {isLoggedIn ? '✅ Google 로그인됨' : '🔐 Google 로그인 필요'}
          </h3>
          <p style={{ fontSize: '14px', margin: 0, color: isLoggedIn ? '#155724' : '#856404' }}>
            {isLoggedIn ? `로그인된 계정: ${userEmail || '확인 중...'}` : 'Google Sheets 동기화를 위해 로그인이 필요합니다.'}
          </p>
        </div>
        <button
          onClick={isLoggedIn ? handleLogout : login}
          style={{
            backgroundColor: isLoggedIn ? '#dc3545' : '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          {isLoggedIn ? <><LogOut size={18} /> 로그아웃</> : <><LogIn size={18} /> Google 로그인</>}
        </button>
      </div>

      {/* 상태 카드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <CheckCircle size={20} color="#28a745" style={{ marginRight: '8px' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>마지막 동기화</h3>
          </div>
          <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#333' }}>
            {lastSync ? lastSync.toLocaleString('ko-KR') : '아직 동기화하지 않음'}
          </p>
        </div>

        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <RefreshCw size={20} color="#007bff" style={{ marginRight: '8px' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>실시간 동기화</h3>
          </div>
          <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: autoSyncEnabled ? '#28a745' : '#6c757d' }}>
            {autoSyncEnabled ? '✅ 활성화됨' : '⏸️ 비활성화됨'}
          </p>
        </div>
      </div>

      {/* 동기화 버튼들 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        {/* Firebase → Sheets */}
        <button
          onClick={handleExportToSheets}
          disabled={isLoading || !isLoggedIn}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '20px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: (isLoading || !isLoggedIn) ? 'not-allowed' : 'pointer',
            opacity: (isLoading || !isLoggedIn) ? 0.6 : 1,
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => !isLoading && isLoggedIn && (e.target.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Upload size={24} style={{ marginRight: '10px' }} />
            <span>Firebase → Sheets</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 'normal', opacity: 0.9 }}>
            Firebase 데이터를 Google Sheets로 내보내기
          </span>
        </button>

        {/* Sheets → Firebase */}
        <button
          onClick={handleImportFromSheets}
          disabled={isLoading || !isLoggedIn}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '20px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: (isLoading || !isLoggedIn) ? 'not-allowed' : 'pointer',
            opacity: (isLoading || !isLoggedIn) ? 0.6 : 1,
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => !isLoading && isLoggedIn && (e.target.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Download size={24} style={{ marginRight: '10px' }} />
            <span>Sheets → Firebase</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 'normal', opacity: 0.9 }}>
            Google Sheets 데이터를 Firebase로 가져오기
          </span>
        </button>

        {/* 실시간 동기화 토글 */}
        <button
          onClick={handleToggleAutoSync}
          disabled={isLoading || !isLoggedIn}
          style={{
            backgroundColor: autoSyncEnabled ? '#ffc107' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '20px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: (isLoading || !isLoggedIn) ? 'not-allowed' : 'pointer',
            opacity: (isLoading || !isLoggedIn) ? 0.6 : 1,
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => !isLoading && isLoggedIn && (e.target.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <RefreshCw size={24} style={{ marginRight: '10px' }} />
            <span>{autoSyncEnabled ? '실시간 동기화 끄기' : '실시간 동기화 켜기'}</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 'normal', opacity: 0.9 }}>
            Firebase 변경사항을 자동으로 Sheets에 반영
          </span>
        </button>
      </div>

      {/* 백업 & 복원 섹션 */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '25px',
        marginTop: '30px'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '15px',
          color: '#333',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Database size={24} style={{ marginRight: '10px' }} />
          로컬 백업 & 복원
        </h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          JSON 파일로 데이터를 백업하거나 복원할 수 있습니다. 인터넷 연결 없이도 사용 가능합니다.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px'
        }}>
          {/* JSON 백업 생성 */}
          <button
            onClick={handleCreateBackup}
            disabled={isLoading}
            style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '15px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
          >
            <FileText size={20} style={{ marginRight: '8px' }} />
            JSON 백업 다운로드
          </button>

          {/* JSON 복원 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '15px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
          >
            <FileUp size={20} style={{ marginRight: '8px' }} />
            JSON 파일로 복원
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleRestoreFromJSON}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px 50px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <RefreshCw size={48} color="#007bff" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '15px', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
              처리 중...
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SyncManagement;