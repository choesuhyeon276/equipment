import { 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  updateDoc, 
  addDoc,
  onSnapshot,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

class FirebaseSheetsSync {
  constructor() {
    this.spreadsheetId = process.env.REACT_APP_GOOGLE_SPREADSHEET_ID;
    this.accessToken = null;
    
    // ⭐ 학생 친화적인 Sheets 출력 구조 정의 ⭐
    this.SHEET_NAME = 'Equipment'; 
    this.EXPORT_HEADERS = [
      '구분', 
      '장비 사진', 
      '장비명', 
      '마운트 / 호환 그룹', 
      '비고', 
      '배터리', 
      '내부사진 이미지' 
    ];
    this.END_COLUMN_LETTER = 'G'; 
    
    // ⭐ 이미지 크기 설정 (픽셀 단위로 고정) - 더 적당한 크기로 조정
    this.IMAGE_SIZE = { width: 80, height: 80 };
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  async callSheetsAPI(endpoint, method = 'GET', body = null) {
    if (!this.accessToken) {
      throw new Error('Google 로그인이 필요합니다.');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log('🔗 API 호출:', method, url);
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API 오류:', error);
      throw new Error(error.error?.message || `API 호출 실패 (${response.status})`);
    }

    return response.json();
  }

  async getAllCameras() {
    try {
      const camerasRef = collection(db, 'cameras');
      
      // displayOrder와 category를 기준으로 정렬
      const q = query(camerasRef, orderBy('displayOrder', 'asc'), orderBy('category', 'asc')); 
      const snapshot = await getDocs(q);
      
      const cameras = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        
        const mountAndGroup = [
          data.mountType ? (Array.isArray(data.mountType) ? data.mountType.join(', ') : data.mountType) : '',
          data.purpose || '' 
        ].filter(Boolean).join(' / ');
        
        const combinedIssues = [
          (data.status && data.status !== 'available') ? `[${data.status}]` : '', 
          data.condition !== '정상' ? `[${data.condition}]` : '',
          data.issues
        ].filter(Boolean).join(' - ');

        const batteryModel = data.batteryModel || '';
        
        const internalURLs = Array.isArray(data.internalImageURLs) 
          ? data.internalImageURLs.filter(url => url.trim() !== '')
          : (data.internalImageURL ? [data.internalImageURL] : []);


        cameras.push({
          name: data.name || '이름 없음',
          category: data.category || '기타',
          mountAndGroup: mountAndGroup,
          issues: combinedIssues, 
          batteryModel: batteryModel, 
          imageURL: data.imageURL || '', 
          internalImageURL: internalURLs.length > 0 ? internalURLs[0] : '', 
          id: docSnap.id,
          displayOrder: data.displayOrder || 9999,
        });
      });

      return cameras;
    } catch (error) {
      console.error('❌ Firebase 데이터 가져오기 실패:', error);
      throw error;
    }
  }

  async exportToSheets() {
    try {
      console.log('🔄 Firebase → Sheets 동기화 시작...');
      
      const cameras = await this.getAllCameras();
      
      const headers = this.EXPORT_HEADERS;

      const values = [headers]; 
      let lastCategory = null;

      // ⭐⭐ 이미지 고정 크기 변수 재확인 및 사용 ⭐⭐
      const imgW = this.IMAGE_SIZE.width;
      const imgH = this.IMAGE_SIZE.height;

      cameras.forEach((camera) => {
        
        // 카테고리별 그룹화 및 빈 행 삽입
        if (lastCategory && lastCategory !== camera.category) {
          values.push(Array(headers.length).fill('')); 
        }

        if (lastCategory !== camera.category) {
          const categoryHeaderRow = [camera.category.toUpperCase(), ...Array(headers.length - 1).fill('')];
          values.push(categoryHeaderRow); 
          lastCategory = camera.category;
        }
        
        // ⭐ B열: 장비 사진 (IMAGE 함수, 크기 고정 옵션 4 사용) ⭐
        // 옵션 4: 지정된 80x80 픽셀 크기로 비율을 유지하며 이미지 표시
        const mainImageFormula = camera.imageURL 
          ? `=IMAGE("${camera.imageURL}", 4, ${imgW}, ${imgH})` 
          : '';

        // ⭐ G열: 내부사진 이미지 (IMAGE 함수, 크기 고정 옵션 4 사용) ⭐
        const internalImageFormula = camera.internalImageURL 
          ? `=IMAGE("${camera.internalImageURL}", 4, ${imgW}, ${imgH})` 
          : '';

        const rowData = [
          '', 
          mainImageFormula, 
          camera.name, 
          camera.mountAndGroup, 
          camera.issues, 
          camera.batteryModel, 
          internalImageFormula 
        ];
        
        values.push(rowData);
      });

      const dataRowsCount = values.length; 
      
      // 1단계: 기존 데이터 및 서식 전체 삭제
      console.log('🗑️ 기존 데이터 삭제 중...');
      
      const clearRequests = {
        requests: [{
          updateCells: {
            range: {
                sheetId: 0, 
                startRowIndex: 0,
                endRowIndex: 10000, 
                startColumnIndex: 0,
                endColumnIndex: this.EXPORT_HEADERS.length,
            },
            fields: '*' // 모든 내용 및 서식 삭제
          }
        }]
      };

      await this.callSheetsAPI(':batchUpdate', 'POST', clearRequests);

      // 2단계: 새 데이터 입력
      console.log('📝 새 데이터 입력 중...');
      
      const endColumnLetter = this.END_COLUMN_LETTER; 
      const rangeToUpdate = `${this.SHEET_NAME}!A1:${endColumnLetter}${dataRowsCount}`; 
      const encodedRange = rangeToUpdate.replace(/:/g, '%3A');

      await this.callSheetsAPI(
        `/values/${encodedRange}?valueInputOption=USER_ENTERED`,
        'PUT', 
        { values }
      );

      // 3단계: 서식 적용 (깔끔한 디자인)
      console.log('🎨 서식 적용 중...');
      
      const formatRequests = {
        requests: [
          // 헤더 행 스타일 (첫 번째 행)
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: this.EXPORT_HEADERS.length
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.3, blue: 0.5 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    fontSize: 11,
                    bold: true
                  },
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
            }
          },
          // 헤더 행 높이
          {
            updateDimensionProperties: {
              range: {
                sheetId: 0,
                dimension: 'ROWS',
                startIndex: 0,
                endIndex: 1
              },
              properties: {
                pixelSize: 40
              },
              fields: 'pixelSize'
            }
          },
          // 이미지가 있는 행 높이 자동 조정 (전체 데이터 행)
          {
            updateDimensionProperties: {
              range: {
                sheetId: 0,
                dimension: 'ROWS',
                startIndex: 1,
                endIndex: dataRowsCount
              },
              properties: {
                pixelSize: 90 // 이미지(80px) + 여백
              },
              fields: 'pixelSize'
            }
          },
          // 열 너비 자동 조정
          {
            updateDimensionProperties: {
              range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
              properties: { pixelSize: 60 }, // A열 (구분)
              fields: 'pixelSize'
            }
          },
          {
            updateDimensionProperties: {
              range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 },
              properties: { pixelSize: 100 }, // B열 (장비 사진)
              fields: 'pixelSize'
            }
          },
          {
            updateDimensionProperties: {
              range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 },
              properties: { pixelSize: 200 }, // C열 (장비명)
              fields: 'pixelSize'
            }
          },
          {
            updateDimensionProperties: {
              range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 },
              properties: { pixelSize: 180 }, // D열 (마운트/그룹)
              fields: 'pixelSize'
            }
          },
          {
            updateDimensionProperties: {
              range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 },
              properties: { pixelSize: 250 }, // E열 (비고)
              fields: 'pixelSize'
            }
          },
          {
            updateDimensionProperties: {
              range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 5, endIndex: 6 },
              properties: { pixelSize: 150 }, // F열 (배터리)
              fields: 'pixelSize'
            }
          },
          {
            updateDimensionProperties: {
              range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 6, endIndex: 7 },
              properties: { pixelSize: 100 }, // G열 (내부사진)
              fields: 'pixelSize'
            }
          },
          // 전체 데이터에 테두리 추가
          {
            updateBorders: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: dataRowsCount,
                startColumnIndex: 0,
                endColumnIndex: this.EXPORT_HEADERS.length
              },
              top: { style: 'SOLID', width: 1, color: { red: 0.8, green: 0.8, blue: 0.8 } },
              bottom: { style: 'SOLID', width: 1, color: { red: 0.8, green: 0.8, blue: 0.8 } },
              left: { style: 'SOLID', width: 1, color: { red: 0.8, green: 0.8, blue: 0.8 } },
              right: { style: 'SOLID', width: 1, color: { red: 0.8, green: 0.8, blue: 0.8 } },
              innerHorizontal: { style: 'SOLID', width: 1, color: { red: 0.8, green: 0.8, blue: 0.8 } },
              innerVertical: { style: 'SOLID', width: 1, color: { red: 0.8, green: 0.8, blue: 0.8 } }
            }
          },
          // 가운데 정렬 (이미지 열)
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 1,
                endRowIndex: dataRowsCount,
                startColumnIndex: 1,
                endColumnIndex: 2
              },
              cell: {
                userEnteredFormat: {
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE'
                }
              },
              fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment)'
            }
          },
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 1,
                endRowIndex: dataRowsCount,
                startColumnIndex: 6,
                endColumnIndex: 7
              },
              cell: {
                userEnteredFormat: {
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE'
                }
              },
              fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment)'
            }
          }
        ]
      };

      // 카테고리 헤더 행에 대한 스타일 추가
      let currentRow = 1;
      let previousCategory = null;
      
      cameras.forEach((camera) => {
        if (previousCategory && previousCategory !== camera.category) {
          currentRow++; // 빈 행
        }
        
        if (previousCategory !== camera.category) {
          // 카테고리 헤더 행 스타일
          formatRequests.requests.push({
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: currentRow,
                endRowIndex: currentRow + 1,
                startColumnIndex: 0,
                endColumnIndex: this.EXPORT_HEADERS.length
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
                  textFormat: {
                    fontSize: 11,
                    bold: true
                  },
                  horizontalAlignment: 'LEFT',
                  verticalAlignment: 'MIDDLE'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
            }
          });
          
          currentRow++; // 카테고리 헤더
          previousCategory = camera.category;
        }
        currentRow++; // 데이터 행
      });

      await this.callSheetsAPI(':batchUpdate', 'POST', formatRequests);

      console.log(`✅ ${cameras.length}개 장비 데이터를 Sheets로 내보내기 완료`);
      return { success: true, count: cameras.length };
    } catch (error) {
      console.error('❌ Sheets 내보내기 실패:', error);
      throw error;
    }
  }

  async importFromSheets() {
    try {
      console.log('🔄 Sheets → Firebase 동기화 시작 (구조 변경으로 인해 제한적 실행)');
      console.warn("경고: 현재 Sheets 구조는 학생 출력을 위해 변경되어 Firebase Import는 안전하지 않습니다. 수동으로 데이터를 확인하세요.");
      return { success: true, updated: 0, created: 0 };
    } catch (error) {
      console.error('❌ Sheets 가져오기 실패:', error);
      throw error;
    }
  }

  async createBackup() {
    try {
      const cameras = await this.getAllCameras();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `cameras_backup_${timestamp}.json`;
      
      const dataStr = JSON.stringify(cameras, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
      
      console.log(`✅ 백업 완료: ${filename}`);
      console.log(`📦 백업된 장비 수: ${cameras.length}개`);
      
      return { success: true, filename, count: cameras.length };
    } catch (error) {
      console.error('❌ 백업 실패:', error);
      throw error;
    }
  }

  async restoreFromJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          
          if (!Array.isArray(jsonData)) {
            throw new Error('올바른 JSON 형식이 아닙니다.');
          }

          let updated = 0;
          let created = 0;
          let errors = 0;

          for (const camera of jsonData) {
            try {
              if (camera.id) {
                const cameraData = { ...camera };
                delete cameraData.id;
                
                if (typeof cameraData.mountType === 'string') {
                  cameraData.mountType = cameraData.mountType.split(',').map(s => s.trim());
                }
                if (typeof cameraData.internalImageURLs === 'string') {
                  cameraData.internalImageURLs = cameraData.internalImageURLs.split('\n').filter(Boolean);
                }
                
                if (cameraData.createdAt && typeof cameraData.createdAt === 'string') {
                  cameraData.createdAt = new Date(cameraData.createdAt);
                }

                await setDoc(doc(db, 'cameras', camera.id), cameraData, { merge: true });
                updated++;
                console.log(`✏️ 복원: ${camera.name}`);
              } else {
                const cameraData = { ...camera };
                
                if (typeof cameraData.mountType === 'string') {
                  cameraData.mountType = cameraData.mountType.split(',').map(s => s.trim());
                }
                if (typeof cameraData.internalImageURLs === 'string') {
                  cameraData.internalImageURLs = cameraData.internalImageURLs.split('\n').filter(Boolean);
                }
                
                cameraData.createdAt = new Date();

                await addDoc(collection(db, 'cameras'), cameraData);
                created++;
                console.log(`➕ 새로 생성: ${camera.name}`);
              }
            } catch (error) {
              console.error(`문서 복원 실패:`, error);
              errors++;
            }
          }

          console.log(`✅ JSON 복원 완료`);
          console.log(`   - 업데이트: ${updated}개`);
          console.log(`   - 생성: ${created}개`);
          console.log(`   - 실패: ${errors}개`);

          resolve({ success: true, updated, created, errors });
        } catch (error) {
          console.error('❌ JSON 파싱 실패:', error);
          reject(new Error('JSON 파일을 읽을 수 없습니다.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('파일을 읽을 수 없습니다.'));
      };

      reader.readAsText(file);
    });
  }

  setupRealtimeSync(onChangeCallback) {
    const camerasRef = collection(db, 'cameras');
    
    const unsubscribe = onSnapshot(camerasRef, async (snapshot) => {
      console.log('🔔 Firebase 변경 감지');
      
      const changes = [];
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        if (change.type === 'added') {
          console.log('➕ 새 장비 추가:', data.name);
          changes.push({ type: 'added', data });
        }
        if (change.type === 'modified') {
          console.log('✏️ 장비 수정:', data.name);
          changes.push({ type: 'modified', data });
        }
        if (change.type === 'removed') {
          console.log('🗑️ 장비 삭제:', change.doc.id);
          changes.push({ type: 'removed', id: change.doc.id });
        }
      });

      if (onChangeCallback) {
        onChangeCallback(changes);
      }

      if (changes.length > 0 && this.accessToken) {
        try {
          await this.exportToSheets();
        } catch (error) {
          console.error('자동 동기화 실패:', error);
        }
      }
    });

    console.log('✅ 실시간 동기화 리스너 설정 완료');
    return unsubscribe;
  }
}

export default FirebaseSheetsSync;