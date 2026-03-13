import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import FirebaseSheetsSync from '../utils/FirebaseSheetsSync';
import { Upload, RefreshCw, Database, FileText, CheckCircle, FileUp } from 'lucide-react';

const API_BASE = process.env.REACT_APP_FUNCTIONS_URL || 'https://us-central1-equipment-rental-system-838f0.cloudfunctions.net';

const SyncManagement = () => {
  const [syncService] = useState(() => new FirebaseSheetsSync());
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const fileInputRef = useRef(null);

  // Firebase → Google Sheets 내보내기 (Service Account 방식 - 로그인 불필요)
  const handleExportToSheets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/exportToSheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setLastSync(new Date());
      toast.success(`✅ ${result.count}개 장비를 Google Sheets로 내보냈습니다!`);
    } catch (error) {
      toast.error('❌ Google Sheets 내보내기 실패: ' + error.message);
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

  // JSON 파일 복원
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
        Firebase 데이터를 Google Sheets로 내보내거나 로컬에 백업/복원하세요.
      </p>

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
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <CheckCircle size={20} color="#28a745" style={{ marginRight: '8px' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#155724' }}>연결 상태</h3>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#155724' }}>
            ✅ 서비스 계정으로 자동 연결됨
          </p>
          <p style={{ fontSize: '12px', margin: '5px 0 0 0', color: '#155724', opacity: 0.8 }}>
            관리자 변경 시에도 별도 로그인 불필요
          </p>
        </div>
      </div>

      {/* Google Sheets 내보내기 */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '25px',
        marginBottom: '20px'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '10px',
          color: '#333',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Upload size={22} style={{ marginRight: '10px' }} />
          Google Sheets 동기화
        </h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          Firebase의 장비 데이터를 Google Sheets로 내보냅니다.
        </p>

        <button
          onClick={handleExportToSheets}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? '#adb5bd' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '15px 30px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Upload size={20} />
          Firebase → Google Sheets 내보내기
        </button>
      </div>

      {/* 백업 & 복원 섹션 */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '25px',
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
              backgroundColor: isLoading ? '#adb5bd' : '#17a2b8',
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
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <FileText size={20} />
            JSON 백업 다운로드
          </button>

          {/* JSON 복원 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? '#adb5bd' : '#6c757d',
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
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <FileUp size={20} />
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