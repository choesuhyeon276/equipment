const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const cors = require('cors')({ origin: true }); // ✅ CORS 패키지 추가

admin.initializeApp();

// 🔐 Gmail 환경변수
const gmailEmail = process.env.GMAIL_USER;
const gmailPassword = process.env.GMAIL_PASS;

// 📧 메일 전송 세팅
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// 🗄️ Firestore 인스턴스
const db = admin.firestore();

// 🔐 Service Account 인증 설정
const getCalendarAuth = () => {
  if (!process.env.CLIENT_EMAIL || !process.env.PRIVATE_KEY) {
    throw new Error('CLIENT_EMAIL 또는 PRIVATE_KEY 환경변수가 없습니다.');
  }

  return new google.auth.JWT(
    process.env.CLIENT_EMAIL,
    null,
    process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/calendar']
  );
};

// ✅ addEvent 함수 (calendar.js 삭제 후 여기로 이동)
const addEvent = async ({ title, description, startDate, startTime, endDate, endTime }) => {
  try {
    const auth = getCalendarAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    // 🔍 Firebase Functions 환경변수에서 Calendar ID 가져오기
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const event = {
      summary: title,
      description: description || '',
      start: {
        dateTime: `${startDate}T${startTime}:00`,
        timeZone: 'Asia/Seoul',
      },
      end: {
        dateTime: `${endDate}T${endTime}:00`,
        timeZone: 'Asia/Seoul',
      },
      colorId: '9',
    };

    console.log('📅 등록할 이벤트 데이터:', { title, startDate, startTime, endDate, endTime, calendarId });

    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
    });

    console.log('✅ 캘린더 이벤트 생성 완료 - Event ID:', response.data.id);
    
    return response.data.id;
  } catch (error) {
    console.error('❌ addEvent 실패:', error);
    throw error;
  }
};

// 📧 관리자 이메일 목록 가져오기 - 방법 1 (기존 admin.firestore 사용)
const getAdminEmails_Method1 = async () => {
  try {
    console.log('🔍 Method1: admin.firestore() 방식으로 관리자 이메일 로딩...');
    
    const adminDoc = await db.collection('admin_settings').doc('main').get();
    
    console.log('📄 Method1: 문서 존재 여부:', adminDoc.exists);
    
    if (adminDoc.exists) {
      const data = adminDoc.data();
      console.log('📊 Method1: 전체 문서 데이터:', JSON.stringify(data, null, 2));
      
      let adminEmails = data.adminEmails || [];
      
      // 객체 형태인 경우 배열로 변환
      if (typeof adminEmails === 'object' && !Array.isArray(adminEmails)) {
        console.log('🔄 Method1: 객체를 배열로 변환');
        adminEmails = Object.values(adminEmails).filter(email => typeof email === 'string' && email.includes('@'));
      }
      
      console.log('📧 Method1: 최종 adminEmails:', adminEmails);
      
      if (adminEmails.length === 0) {
        console.warn('⚠️ Method1: adminEmails가 비어있음 - 기본값 사용');
        return ["choesuhyeon276@gmail.com"];
      }
      
      return adminEmails;
    } else {
      console.warn('⚠️ Method1: admin_settings/main 문서 없음');
      return ["choesuhyeon276@gmail.com"];
    }
  } catch (error) {
    console.error('❌ Method1 실패:', error.message);
    return ["choesuhyeon276@gmail.com"];
  }
};

// 📧 관리자 이메일 목록 가져오기 - 방법 2 (환경변수 사용)
const getAdminEmails_Method2 = () => {
  try {
    console.log('🔍 Method2: 환경변수에서 관리자 이메일 로딩...');
    
    // Firebase Functions 환경변수에서 가져오기
    const configEmails = functions.config().admin?.emails;
    console.log('📧 Method2: 환경변수 이메일:', configEmails);
    
    if (configEmails) {
      // 쉼표로 구분된 문자열인 경우
      const emailList = typeof configEmails === 'string' 
        ? configEmails.split(',').map(email => email.trim())
        : [configEmails];
      
      console.log('📧 Method2: 파싱된 이메일 목록:', emailList);
      return emailList;
    }
    
    console.warn('⚠️ Method2: 환경변수 없음');
    return null;
  } catch (error) {
    console.error('❌ Method2 실패:', error.message);
    return null;
  }
};

// 📧 관리자 이메일 목록 가져오기 - 방법 3 (하드코딩된 설정)
const getAdminEmails_Method3 = () => {
  console.log('🔍 Method3: 하드코딩된 관리자 이메일 사용');
  // 여기서 직접 이메일 목록을 관리 (임시방편)
  const hardcodedEmails = [
    "choesuhyeon276@gmail.com",
    "choesuhyeon276@khu.ac.kr"
  ];
  console.log('📧 Method3: 하드코딩 이메일:', hardcodedEmails);
  return hardcodedEmails;
};

// 📧 통합 관리자 이메일 가져오기 함수
const getAdminEmails = async () => {
  console.log('🎯 관리자 이메일 로딩 시작 - 여러 방법 시도...');
  
  // 방법 1: Firestore에서 동적 로드
  try {
    const emails1 = await getAdminEmails_Method1();
    if (emails1 && emails1.length > 0 && emails1[0] !== "choesuhyeon276@gmail.com") {
      console.log('✅ Method1 성공:', emails1);
      return emails1;
    }
  } catch (error) {
    console.log('⚠️ Method1 실패, Method2 시도...');
  }
  
  // 방법 2: 환경변수
  try {
    const emails2 = getAdminEmails_Method2();
    if (emails2 && emails2.length > 0) {
      console.log('✅ Method2 성공:', emails2);
      return emails2;
    }
  } catch (error) {
    console.log('⚠️ Method2 실패, Method3 시도...');
  }
  
  // 방법 3: 하드코딩 (최후의 수단)
  const emails3 = getAdminEmails_Method3();
  console.log('✅ Method3 사용 (하드코딩):', emails3);
  return emails3;
};

// 📧 메일 전송 함수 (HTML 지원)
const sendMail = async (to, subject, text, html = null) => {
  try {
    const mailOptions = {
      from: `DKit 장비대여 <${gmailEmail}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      ...(html && { html }),
    };
    
    console.log('📧 메일 전송 시도:', { to: mailOptions.to, subject });
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ 메일 전송 성공:', { to, subject, messageId: result.messageId });
    return result;
  } catch (error) {
    console.error('❌ 메일 전송 실패:', { 
      to, 
      subject, 
      error: error.message,
      code: error.code 
    });
    throw error;
  }
};

// 📧 HTML 이메일 템플릿 생성 함수
const createEmailTemplate = (title, content, footerText = 'DKit 장비대여 시스템') => {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">DKit</h1>
        <p style="margin: 8px 0 0 0; color: #a0a0a0; font-size: 14px;">장비대여 시스템</p>
      </td>
    </tr>
    <!-- Title -->
    <tr>
      <td style="padding: 32px 24px 16px 24px;">
        <h2 style="margin: 0; color: #1a1a2e; font-size: 20px; font-weight: 600; border-left: 4px solid #4f46e5; padding-left: 12px;">${title}</h2>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 0 24px 32px 24px;">
        ${content}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="margin: 0; color: #6c757d; font-size: 12px;">${footerText}</p>
        <p style="margin: 8px 0 0 0; color: #adb5bd; font-size: 11px;">본 메일은 발신 전용입니다.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

// 📦 정보 박스 HTML 생성
const createInfoBox = (items) => {
  const rows = items.map(item => `
    <tr>
      <td style="padding: 8px 12px; color: #6c757d; font-size: 14px; white-space: nowrap;">${item.label}</td>
      <td style="padding: 8px 12px; color: #1a1a2e; font-size: 14px; font-weight: 500;">${item.value}</td>
    </tr>
  `).join('');
  
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 16px 0;">
      ${rows}
    </table>
  `;
};

// 📋 장비 목록 HTML 생성
const createEquipmentList = (items) => {
  const listItems = items.map(item => `
    <li style="padding: 8px 0; border-bottom: 1px solid #e9ecef; color: #1a1a2e; font-size: 14px;">
      ${item.name || '이름 없음'}
    </li>
  `).join('');
  
  return `
    <div style="margin: 16px 0;">
      <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 13px; font-weight: 600;">장비 목록</p>
      <ul style="margin: 0; padding: 0 0 0 20px; list-style: none;">
        ${listItems}
      </ul>
    </div>
  `;
};

// ⚠️ 경고 박스 HTML 생성
const createWarningBox = (message) => {
  return `
    <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; color: #856404; font-size: 14px; font-weight: 500;">${message}</p>
    </div>
  `;
};

// ❌ 에러/벌점 박스 HTML 생성
const createPenaltyBox = (points, reason) => {
  return `
    <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; color: #721c24; font-size: 16px; font-weight: 700;">벌점 ${points}점 부과</p>
      <p style="margin: 0; color: #721c24; font-size: 14px;">사유: ${reason}</p>
    </div>
  `;
};

// ✅ 성공 박스 HTML 생성
const createSuccessBox = (message) => {
  return `
    <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; color: #155724; font-size: 14px; font-weight: 500;">${message}</p>
    </div>
  `;
};

// 🔗 버튼 HTML 생성
const createButton = (text, url) => {
  return `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${url}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 14px; font-weight: 600;">${text}</a>
    </div>
  `;
};

///////////////////////////////////////////////////////////////////////////////////////
// 📅 캘린더 이벤트 생성 API (프론트엔드에서 호출)
///////////////////////////////////////////////////////////////////////////////////////
exports.createCalendarEvent = functions.https.onRequest(async (req, res) => {
  // CORS 설정
  const allowedOrigins = [
    'http://localhost:3000',
    'https://equipment-rental-system.vercel.app',
    'https://equipment-rental-system-838f0.web.app',
    'https://equipment-rental-system-838f0.firebaseapp.com'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', '*');
  }
  
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { summary, description, startDateTime, endDateTime, calendarId, timeZone } = req.body;

    console.log('📅 캘린더 이벤트 생성 요청:', {
      summary,
      startDateTime,
      endDateTime,
      calendarId
    });

    // 필수 파라미터 체크
    if (!summary || !startDateTime || !endDateTime || !calendarId) {
      res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['summary', 'startDateTime', 'endDateTime', 'calendarId']
      });
      return;
    }

    const auth = getCalendarAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary,
      description: description || '',
      start: {
        dateTime: startDateTime,
        timeZone: timeZone || 'Asia/Seoul',
      },
      end: {
        dateTime: endDateTime,
        timeZone: timeZone || 'Asia/Seoul',
      },
      colorId: '9',
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
    });

    console.log('✅ 캘린더 이벤트 생성 성공:', response.data.id);

    res.status(200).json({
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
    });

  } catch (error) {
    console.error('❌ 캘린더 이벤트 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || error.stack
    });
  }
});

///////////////////////////////////////////////////////////////////////////////////////
// 🗑️ 캘린더 이벤트 삭제 API (프론트엔드에서 호출)
///////////////////////////////////////////////////////////////////////////////////////
exports.deleteCalendarEvent = functions.https.onRequest(async (req, res) => {
  // CORS 설정
  const allowedOrigins = [
    'http://localhost:3000',
    'https://equipment-rental-system.vercel.app',
    'https://equipment-rental-system-838f0.web.app',
    'https://equipment-rental-system-838f0.firebaseapp.com'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', '*');
  }
  
  res.set('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { eventId, calendarId } = req.body;

    console.log('🗑️ 캘린더 이벤트 삭제 요청:', { eventId, calendarId });

    if (!eventId || !calendarId) {
      res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['eventId', 'calendarId']
      });
      return;
    }

    const auth = getCalendarAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });

    console.log('✅ 캘린더 이벤트 삭제 성공');

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });

  } catch (error) {
    console.error('❌ 캘린더 이벤트 삭제 실패:', error);
    
    // 이미 삭제된 이벤트인 경우 (410 Gone)
    if (error.code === 410 || error.message.includes('deleted')) {
      res.status(200).json({
        success: true,
        message: 'Event already deleted',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || error.stack
    });
  }
});

///////////////////////////////////////////////////////////////////////////////////////
// 📊 Google Sheets 내보내기 API (Service Account 방식)
///////////////////////////////////////////////////////////////////////////////////////
const getSheetsAuth = () => {
  if (!process.env.CLIENT_EMAIL || !process.env.PRIVATE_KEY) {
    throw new Error('CLIENT_EMAIL 또는 PRIVATE_KEY 환경변수가 없습니다.');
  }

  return new google.auth.JWT(
    process.env.CLIENT_EMAIL,
    null,
    process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
};

exports.exportToSheets = functions.https.onRequest(async (req, res) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://equipment-rental-system.vercel.app',
    'https://equipment-rental-system-838f0.web.app',
    'https://equipment-rental-system-838f0.firebaseapp.com'
  ];
  
  const origin = req.headers.origin;
  res.set('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

  try {
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
if (!SPREADSHEET_ID) throw new Error('SPREADSHEET_ID 환경변수가 없습니다.');

    const auth = getSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });

// Firebase에서 데이터 가져오기
const snapshot = await db.collection('cameras').get();

// 카테고리 순서 정의
const categoryOrder = ['Camera', 'Lens', 'Lighting', 'Battery', 'Sound', 'VR device', 'ETC'];

// 데이터 정렬 (카테고리 순서 → displayOrder 순)
const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
items.sort((a, b) => {
  const ai = categoryOrder.indexOf(a.category) === -1 ? 99 : categoryOrder.indexOf(a.category);
  const bi = categoryOrder.indexOf(b.category) === -1 ? 99 : categoryOrder.indexOf(b.category);
  if (ai !== bi) return ai - bi;
  return (a.displayOrder || 0) - (b.displayOrder || 0);
});

const rows = [
  ['카테고리', '이미지', '이름', '마운트', '특이사항'],
  ...items.map(item => [
    item.category || '',
    item.imageURL ? `=IMAGE("${item.imageURL}")` : '',
    item.name || '',
    item.mountType || '',
    item.issues || '',
  ])
];

// 기존 데이터 초기화
await sheets.spreadsheets.values.clear({
  spreadsheetId: SPREADSHEET_ID,
  range: 'Equipment',
});

// 새로 작성
await sheets.spreadsheets.values.update({
  spreadsheetId: SPREADSHEET_ID,
  range: 'Equipment!A1',
  valueInputOption: 'USER_ENTERED',
  requestBody: { values: rows },
});

await sheets.spreadsheets.batchUpdate({
  spreadsheetId: SPREADSHEET_ID,
  requestBody: {
    requests: [
      {
        updateDimensionProperties: {
          range: {
            sheetId: 0,
            dimension: 'ROWS',
            startIndex: 1,
            endIndex: rows.length,
          },
          properties: { pixelSize: 80 },
          fields: 'pixelSize',
        },
      },
      {
        updateDimensionProperties: {
          range: {
            sheetId: 0,
            dimension: 'COLUMNS',
            startIndex: 1,
            endIndex: 2,
          },
          properties: { pixelSize: 100 },
          fields: 'pixelSize',
        },
      },
    ],
  },
});

console.log(`✅ Sheets 내보내기 완료 - ${rows.length - 1}개`);
res.status(200).json({ success: true, count: rows.length - 1 });

  } catch (error) {
    console.error('❌ Sheets 내보내기 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.importFromSheets = functions.https.onRequest(async (req, res) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://equipment-rental-system.vercel.app',
    'https://equipment-rental-system-838f0.web.app',
    'https://equipment-rental-system-838f0.firebaseapp.com'
  ];
  
  const origin = req.headers.origin;
  res.set('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

  try {
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
if (!SPREADSHEET_ID) throw new Error('SPREADSHEET_ID 환경변수가 없습니다.');

    const auth = getSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Equipment',
    });

    const rows = response.data.values || [];
    if (rows.length < 2) {
      res.status(200).json({ success: true, updated: 0, created: 0 });
      return;
    }

    const headers = rows[0]; // 첫 번째 행 = 헤더
    const dataRows = rows.slice(1);

    let updated = 0, created = 0;
    const batch = db.batch();

    for (const row of dataRows) {
      const id = row[0];
      if (!id) continue;

      const data = {
        name: row[1] || '',
        category: row[2] || '',
        status: row[3] || '',
      };

      const ref = db.collection('cameras').doc(id);
      const existing = await ref.get();

      if (existing.exists) {
        batch.update(ref, data);
        updated++;
      } else {
        batch.set(ref, data);
        created++;
      }
    }

    await batch.commit();
    console.log(`✅ Sheets 가져오기 완료 - 업데이트: ${updated}, 생성: ${created}`);
    res.status(200).json({ success: true, updated, created });

  } catch (error) {
    console.error('❌ Sheets 가져오기 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

///////////////////////////////////////////////////////////////////////////////////////
// ✅ 1. 대여 신청 생성 시 → 관리자에게 메일만 발송
///////////////////////////////////////////////////////////////////////////////////////
exports.onRentalCreatedAdminNotify = functions.firestore
  .document('reservations/{rentalId}')
  .onCreate(async (snap, context) => {
    const rentalId = context.params.rentalId;
    
    try {
      const after = snap.data();
      
      if (!after) {
        throw new Error('예약 데이터가 없습니다');
      }
      
      const items = after.items || [];
      if (items.length === 0) {
        throw new Error('대여 항목이 없습니다');
      }

      const userName = after.userName || after.userId || '이름 없음';
      const userStudentId = after.userStudentId || '학번 없음';
      const userPhone = after.userPhone || '전화번호 없음';
      const userEmail = after.userEmail || '이메일 없음';

      const startDate = items[0]?.rentalDate || '날짜 없음';
      const startTime = items[0]?.rentalTime || '시간 없음';
      const endDate = items[0]?.returnDate || '날짜 없음';
      const endTime = items[0]?.returnTime || '시간 없음';
      const equipmentList = items.map(item => `- ${item.name || '이름 없음'}`).join('\n');

      // 🎯 다중 방법으로 관리자 이메일 가져오기
      const adminEmails = await getAdminEmails();

      // HTML 이메일 내용 생성
      const htmlContent = `
        <p style="margin: 0 0 16px 0; color: #495057; font-size: 15px; line-height: 1.6;">
          새로운 장비 대여 신청이 접수되었습니다. 확인 후 승인 처리해 주세요.
        </p>
        ${createInfoBox([
          { label: '신청 ID', value: rentalId },
          { label: '신청자', value: userName },
          { label: '학번', value: userStudentId },
          { label: '연락처', value: userPhone },
          { label: '이메일', value: userEmail },
          { label: '대여 시작', value: `${startDate} ${startTime}` },
          { label: '반납 예정', value: `${endDate} ${endTime}` },
        ])}
        ${createEquipmentList(items)}
        ${createButton('관리자 페이지에서 확인하기', 'https://equipment-rental-system.vercel.app/admins')}
      `;

      const htmlEmail = createEmailTemplate('새로운 대여 신청', htmlContent);

      await sendMail(
        adminEmails,
        '새로운 장비 대여 신청이 접수되었습니다',
        `신청 ID: ${rentalId}\n신청자: ${userName}\n학번: ${userStudentId}\n연락처: ${userPhone}\n이메일: ${userEmail}\n\n대여 시작: ${startDate} ${startTime}\n반납 예정: ${endDate} ${endTime}\n\n장비 목록:\n${equipmentList}\n\nDKit 관리자 페이지\nhttps://equipment-rental-system.vercel.app/admins`,
        htmlEmail
      );
      
      console.log('✅ 관리자 대여 신청 메일 전송 완료 - ID:', rentalId);
    } catch (error) {
      console.error('❌ 대여 신청 알림 처리 실패:', {
        rentalId,
        error: error.message,
        stack: error.stack
      });
    }
  });

///////////////////////////////////////////////////////////////////////////////////////
// ✅ 2. 대여 승인 시 → 사용자 메일 + 캘린더 등록
///////////////////////////////////////////////////////////////////////////////////////
exports.onRentalApprovedUserNotify = functions.firestore
  .document('reservations/{rentalId}')
  .onUpdate(async (change, context) => {
    const rentalId = context.params.rentalId;
    
    try {
      const before = change.before.data();
      const after = change.after.data();

      // ✅ 대여 승인 감지 (status: active)
      if (before.status !== 'active' && after.status === 'active') {
        console.log('🔥 대여 승인 감지됨 - ID:', rentalId);
        await handleRentalApproval(after, rentalId);
      }

      // ✅ 반납 완료 시 사용자에게 메일
      if (before.status !== 'returned' && after.status === 'returned') {
        console.log('🔥 반납 완료 감지됨 - ID:', rentalId);
        await handleReturnCompleted(after, rentalId);
      }
    } catch (error) {
      console.error('❌ 대여 상태 변경 처리 실패:', {
        rentalId,
        error: error.message,
        stack: error.stack
      });
    }
  });

// 대여 승인 처리 함수
const handleRentalApproval = async (reservationData, rentalId) => {
  try {
    const userId = reservationData.userId;
    const items = reservationData.items || [];

    if (!userId) {
      throw new Error('사용자 ID가 없습니다');
    }

    // 기본 유저 정보
    let userName = reservationData.userName || userId || '이름 없음';
    let userStudentId = reservationData.userStudentId || '학번 없음';
    let userPhone = reservationData.userPhone || '전화번호 없음';
    let userEmail = reservationData.userEmail;

    // 🔄 user_profiles에서 정보 보강
    try {
      const userProfileSnap = await db.collection('user_profiles').doc(userId).get();
      if (userProfileSnap.exists) {
        const profile = userProfileSnap.data();
        userName = profile.name || userName;
        userStudentId = profile.studentId || userStudentId;
        userPhone = profile.phoneNumber || userPhone;
        userEmail = profile.email || userEmail;
      }
    } catch (profileError) {
      console.warn('⚠️ user_profiles 불러오기 실패 (계속 진행):', profileError.message);
    }

    // 📆 Google Calendar 등록
    if (items.length > 0) {
      const startDate = items[0]?.rentalDate;
      const startTime = items[0]?.rentalTime;
      const endDate = items[0]?.returnDate;
      const endTime = items[0]?.returnTime;
      const equipmentList = items.map(item => `- ${item.name || '이름 없음'}`).join('\n');
      const purpose = items[0]?.purpose || 'N/A';

      const title = `${userName}`;
      const description = `📝 학번: ${userStudentId}\n☎️ 전화번호: ${userPhone}\n📦 장비 목록:\n${equipmentList}\n📌 사용 목적: ${purpose}`;

      console.log('📅 등록할 이벤트 데이터:', {
        title,
        description,
        startDate,
        startTime,
        endDate,
        endTime
      });

      try {
        // ⭐ addEvent의 반환값 받기
        const calendarEventId = await addEvent({ 
          title, 
          description, 
          startDate, 
          startTime, 
          endDate, 
          endTime 
        });
        
        console.log('✅ Google 캘린더 등록 완료 - ID:', calendarEventId);
        
        // ⭐ Firestore에 calendarEventId 저장
        if (calendarEventId) {
          await db.collection('reservations').doc(rentalId).update({
            calendarEventId: calendarEventId
          });
          console.log('✅ Firestore에 calendarEventId 저장 완료:', calendarEventId);
        } else {
          console.warn('⚠️ calendarEventId가 없어서 Firestore 저장 스킵됨');
        }
        
      } catch (calendarError) {
        console.error('❌ Google 캘린더 등록 실패 (계속 진행):', {
          rentalId,
          error: calendarError.response?.data || calendarError.message
        });
      }
    }

  // 📧 사용자 승인 메일 발송
  if (userEmail && userEmail !== '이메일 없음') {
  try {
  const equipmentListText = items.map(item => `- ${item.name || '이름 없음'}`).join('\n');
  const startDate = items[0]?.rentalDate || '날짜 없음';
  const startTime = items[0]?.rentalTime || '시간 없음';
  const endDate = items[0]?.returnDate || '날짜 없음';
  const endTime = items[0]?.returnTime || '시간 없음';
  
  // HTML 이메일 내용 생성
  const htmlContent = `
    <p style="margin: 0 0 16px 0; color: #495057; font-size: 15px; line-height: 1.6;">
      안녕하세요, <strong>${userName}</strong>님!<br>
      신청하신 장비 대여가 승인되었습니다.
    </p>
    ${createSuccessBox('대여가 승인되었습니다. 아래 일정에 맞춰 장비를 수령해 주세요.')}
    ${createInfoBox([
      { label: '예약 ID', value: rentalId },
      { label: '대여 시작', value: `${startDate} ${startTime}` },
      { label: '반납 예정', value: `${endDate} ${endTime}` },
    ])}
    ${createEquipmentList(items)}
    ${createWarningBox('반납 기한을 준수해 주세요. 연체 시 벌점이 부과될 수 있습니다.')}
  `;

  const htmlEmail = createEmailTemplate('대여 승인 완료', htmlContent);
  
  await sendMail(
  userEmail,
  '장비 대여가 승인되었습니다',
  `${userName}님, 신청하신 장비 대여가 승인되었습니다.\n\n예약 ID: ${rentalId}\n대여 시작: ${startDate} ${startTime}\n반납 예정: ${endDate} ${endTime}\n\n장비 목록:\n${equipmentListText}\n\nDKit 장비대여 시스템`,
  htmlEmail
  );
  console.log('✅ 사용자 승인 메일 전송 완료 - ID:', rentalId);
  } catch (mailError) {
  console.error('❌ 사용자 승인 메일 전송 실패:', {
  rentalId,
  userEmail,
  error: mailError.message
  });
  }
  } else {
  console.warn('⚠️ 사용자 이메일 없음: 메일 생략됨 - ID:', rentalId);
  }
  } catch (error) {
    console.error('❌ 대여 승인 처리 실패:', {
      rentalId,
      error: error.message
    });
    throw error;
  }
};

// 반납 완료 처리 함수 (벌점 정보 포함)
const handleReturnCompleted = async (reservationData, rentalId) => {
  try {
    const userEmail = reservationData.userEmail;
    const userName = reservationData.userName || reservationData.userId || '사용자';
    const items = reservationData.items || [];
    
    // 벌점 정보 확인
    const penaltyPoints = reservationData.penaltyPoints || 0;
    const penaltyReason = reservationData.penaltyReason || '';
    const hasPenalty = penaltyPoints > 0;
    
    if (userEmail && userEmail !== '이메일 없음') {
      const equipmentListText = items.map(item => `- ${item.name || '이름 없음'}`).join('\n');
      
      // HTML 이메일 내용 생성
      let htmlContent = `
        <p style="margin: 0 0 16px 0; color: #495057; font-size: 15px; line-height: 1.6;">
          안녕하세요, <strong>${userName}</strong>님!<br>
          장비 반납이 완료 처리되었습니다.
        </p>
        ${createSuccessBox('반납이 정상적으로 완료되었습니다. 이용해 주셔서 감사합니다.')}
        ${createInfoBox([
          { label: '예약 ID', value: rentalId },
          { label: '반납 처리일', value: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) },
        ])}
        ${createEquipmentList(items)}
      `;
      
      // 벌점이 부과된 경우 벌점 정보 추가
      if (hasPenalty) {
        htmlContent += createPenaltyBox(penaltyPoints, penaltyReason || '반납 지연 또는 장비 파손');
      }
      
      htmlContent += `
        <p style="margin: 16px 0 0 0; color: #6c757d; font-size: 13px; line-height: 1.6;">
          DKit 장비대여 시스템을 이용해 주셔서 감사합니다.<br>
          문의사항이 있으시면 관리자에게 연락해 주세요.
        </p>
      `;

      const emailTitle = hasPenalty ? '반납 완료 (벌점 부과)' : '반납 완료';
      const htmlEmail = createEmailTemplate(emailTitle, htmlContent);
      
      // 플레인 텍스트 버전
      let plainText = `${userName}님, 장비 반납이 완료되었습니다.\n\n예약 ID: ${rentalId}\n\n장비 목록:\n${equipmentListText}`;
      if (hasPenalty) {
        plainText += `\n\n⚠️ 벌점 ${penaltyPoints}점이 부과되었습니다.\n사유: ${penaltyReason || '반납 지연 또는 장비 파손'}`;
      }
      plainText += '\n\n이용해주셔서 감사합니다.\n\nDKit 장비대여 시스템';
      
      await sendMail(
        userEmail,
        hasPenalty ? '장비 반납 완료 (벌점 부과 안내)' : '장비 반납이 완료되었습니다',
        plainText,
        htmlEmail
      );
      console.log('✅ 반납 완료 메일 전송 완료 - ID:', rentalId, hasPenalty ? `(벌점 ${penaltyPoints}점)` : '');
    } else {
      console.warn('⚠️ 사용자 이메일 없음: 반납 메일 생략됨 - ID:', rentalId);
    }
  } catch (error) {
    console.error('❌ 반납 완료 메일 전송 실패:', {
      rentalId,
      error: error.message
    });
  }
};

///////////////////////////////////////////////////////////////////////////////////////
// ✅ 4. 반납 요청 시 → 관리자에게 메일
///////////////////////////////////////////////////////////////////////////////////////
exports.onReturnRequested = functions.firestore
  .document('reservations/{rentalId}')
  .onUpdate(async (change, context) => {
    const rentalId = context.params.rentalId;
    
    try {
      const before = change.before.data();
      const after = change.after.data();

  if (before.status !== 'return_requested' && after.status === 'return_requested') {
  console.log('🔥 반납 요청 감지됨 - ID:', rentalId);
  
  const userName = after.userName || after.userId || '이름 없음';
  const userStudentId = after.userStudentId || '학번 없음';
  const userPhone = after.userPhone || '전화번호 없음';
  const items = after.items || [];
  
  // 🎯 다중 방법으로 관리자 이메일 가져오기
  const adminEmails = await getAdminEmails();
  
  // HTML 이메일 내용 생성
  const htmlContent = `
    <p style="margin: 0 0 16px 0; color: #495057; font-size: 15px; line-height: 1.6;">
      반납 요청이 접수되었습니다. 확인 후 반납 처리해 주세요.
    </p>
    ${createInfoBox([
      { label: '예약 ID', value: rentalId },
      { label: '신청자', value: userName },
      { label: '학번', value: userStudentId },
      { label: '연락처', value: userPhone },
    ])}
    ${createEquipmentList(items)}
    ${createButton('관리자 페이지에서 확인하기', 'https://equipment-rental-system.vercel.app/admins')}
  `;

  const htmlEmail = createEmailTemplate('반납 요청 접수', htmlContent);
  
  await sendMail(
  adminEmails,
  '반납 요청이 접수되었습니다',
  `예약 ID: ${rentalId}\n신청자: ${userName}\n학번: ${userStudentId}\n연락처: ${userPhone}\n상태: ${after.status}\n\nDKit 관리자 시스템\nhttps://equipment-rental-system.vercel.app/admins`,
  htmlEmail
  );
  console.log('✅ 반납 요청 ��리자 메일 전송 완료 - ID:', rentalId);
  }
    } catch (error) {
      console.error('❌ 반납 요청 처리 실패:', {
        rentalId,
        error: error.message,
        stack: error.stack
      });
    }
  });

///////////////////////////////////////////////////////////////////////////////////////
// ✅ 5. 연체 독촉 메일 자동 발송 (매일 오전 9시 실행)
///////////////////////////////////////////////////////////////////////////////////////
exports.sendOverdueReminders = functions.pubsub
  .schedule('0 9 * * *') // 매일 오전 9시 (한국 시간 기준)
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    console.log('🔔 연체 독촉 메일 발송 작업 시작...');
    
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      
      // 대여 중(active)인 예약 중 반납 예정일이 지난 것 조회
      const overdueSnapshot = await db.collection('reservations')
        .where('status', '==', 'active')
        .get();
      
      if (overdueSnapshot.empty) {
        console.log('✅ 연체된 대여가 없습니다.');
        return null;
      }
      
      let overdueCount = 0;
      const processedUsers = new Set(); // 같은 사용자에게 중복 발송 방지
      
      for (const doc of overdueSnapshot.docs) {
        const reservation = doc.data();
        const rentalId = doc.id;
        const items = reservation.items || [];
        
        if (items.length === 0) continue;
        
        // 반납 예정일 확인
        const returnDate = items[0]?.returnDate;
        const returnTime = items[0]?.returnTime || '23:59';
        
        if (!returnDate) continue;
        
        // 반납 예정 날짜+시간을 Date 객체로 변환
        const returnDateTime = new Date(`${returnDate}T${returnTime}:00`);
        
        // 연체 여부 확인 (현재 시간이 반납 예정 시간을 지났는지)
        if (now <= returnDateTime) continue;
        
        // 연체일 계산
        const overdueDays = Math.ceil((now - returnDateTime) / (1000 * 60 * 60 * 24));
        
        // 이미 연체 메일 발송 여부 확인 (하루에 한 번만 발송)
        const reminderCount = reservation.overdueReminderCount || 0;
if (reminderCount >= 1) {
  console.log(`⏭️ 이미 연체 메일 발송됨 (총 ${reminderCount}회) - ID: ${rentalId}`);
  continue;
}
        
        const userEmail = reservation.userEmail;
        const userName = reservation.userName || reservation.userId || '사용자';
        const userStudentId = reservation.userStudentId || '학번 없음';
        
        if (!userEmail || userEmail === '이메일 없음') {
          console.warn(`⚠️ 사용자 이메일 없음 - ID: ${rentalId}`);
          continue;
        }
        
        // 연체 독촉 메일 발송
        try {
          const equipmentListText = items.map(item => `- ${item.name || '이름 없음'}`).join('\n');
          
          // HTML 이메일 내용 생성
          const htmlContent = `
            <p style="margin: 0 0 16px 0; color: #495057; font-size: 15px; line-height: 1.6;">
              안녕하세요, <strong>${userName}</strong>님!<br>
              대여하신 장비의 반납 기한이 <strong style="color: #dc3545;">${overdueDays}일</strong> 경과되었습니다.
            </p>
            ${createWarningBox(`반납 예정일(${returnDate} ${returnTime})이 지났습니다. 즉시 반납해 주세요.`)}
            ${createInfoBox([
              { label: '예약 ID', value: rentalId },
              { label: '반납 예정일', value: `${returnDate} ${returnTime}` },
              { label: '연체 일수', value: `${overdueDays}일` },
            ])}
            ${createEquipmentList(items)}
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; color: #721c24; font-size: 14px; font-weight: 500;">
                연체가 지속될 경우 벌점이 부과될 수 있습니다.<br>
                빠른 시일 내에 반납 처리해 주시기 바랍니다.
              </p>
            </div>
            <p style="margin: 16px 0 0 0; color: #6c757d; font-size: 13px; line-height: 1.6;">
              문의사항이 있으시면 관리자에게 연락해 주세요.
            </p>
          `;

          const htmlEmail = createEmailTemplate('반납 기한 초과 안내', htmlContent);
          
          await sendMail(
            userEmail,
            `[긴급] 장비 반납 기한이 ${overdueDays}일 초과되었습니다`,
            `${userName}님, 대여하신 장비의 반납 기한이 ${overdueDays}일 경과되었습니다.\n\n예약 ID: ${rentalId}\n반납 예정일: ${returnDate} ${returnTime}\n\n장비 목록:\n${equipmentListText}\n\n연체가 지속될 경우 벌점이 부과될 수 있습니다.\n빠른 시일 내에 반납 처리해 주시기 바랍니다.\n\nDKit 장비대여 시스템`,
            htmlEmail
          );
          
          // 마지막 연체 메일 발송 날짜 업데이트
          await db.collection('reservations').doc(rentalId).update({
            lastOverdueReminderDate: today,
            overdueReminderCount: (reservation.overdueReminderCount || 0) + 1
          });
          
          overdueCount++;
          console.log(`✅ 연체 독촉 메일 발송 완료 - ID: ${rentalId}, 연체 ${overdueDays}일`);
          
        } catch (mailError) {
          console.error(`❌ 연체 메일 발송 실패 - ID: ${rentalId}:`, mailError.message);
        }
      }
      
      // 관리자에게 연체 현황 요약 메일 발송
      if (overdueCount > 0) {
        try {
          const adminEmails = await getAdminEmails();
          
          const htmlContent = `
            <p style="margin: 0 0 16px 0; color: #495057; font-size: 15px; line-height: 1.6;">
              금일 연체 독촉 메일 발송이 완료되었습니다.
            </p>
            ${createWarningBox(`총 ${overdueCount}건의 연체 대여에 독촉 메일이 발송되었습니다.`)}
            ${createButton('관리자 페이지에서 확인하기', 'https://equipment-rental-system.vercel.app/admins')}
          `;

          const htmlEmail = createEmailTemplate('연체 현황 알림', htmlContent);
          
          await sendMail(
            adminEmails,
            `[일일 보고] 연체 대여 ${overdueCount}건 독촉 메일 발송 완료`,
            `금일 연체 독촉 메일 발송이 완료되었습니다.\n\n총 ${overdueCount}건의 연체 대여에 독촉 메일이 발송되었습니다.\n\nDKit 관리자 시스템\nhttps://equipment-rental-system.vercel.app/admins`,
            htmlEmail
          );
          
          console.log(`✅ 관리자 연체 현황 알림 발송 완료 - 총 ${overdueCount}건`);
        } catch (adminMailError) {
          console.error('❌ 관리자 연체 현황 알림 발송 실패:', adminMailError.message);
        }
      }
      
      console.log(`🔔 연체 독촉 메일 발송 작업 완료 - 총 ${overdueCount}건 발송`);
      return null;
      
    } catch (error) {
      console.error('❌ 연체 독촉 메일 발송 작업 실패:', {
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  });

///////////////////////////////////////////////////////////////////////////////////////
// ✅ 6. 수동 연체 독촉 메일 발송 API (관리자용)
///////////////////////////////////////////////////////////////////////////////////////
exports.sendManualOverdueReminder = functions.https.onRequest(async (req, res) => {
  // CORS 설정
  const allowedOrigins = [
    'http://localhost:3000',
    'https://equipment-rental-system.vercel.app',
    'https://equipment-rental-system-838f0.web.app',
    'https://equipment-rental-system-838f0.firebaseapp.com'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', '*');
  }
  
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { rentalId } = req.body;

    if (!rentalId) {
      res.status(400).json({ 
        error: 'Missing required parameter: rentalId'
      });
      return;
    }

    // 예약 정보 조회
    const reservationDoc = await db.collection('reservations').doc(rentalId).get();
    
    if (!reservationDoc.exists) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }

    const reservation = reservationDoc.data();
    const items = reservation.items || [];
    
    if (reservation.status !== 'active') {
      res.status(400).json({ error: 'Reservation is not active' });
      return;
    }

    const userEmail = reservation.userEmail;
    const userName = reservation.userName || reservation.userId || '사용자';
    
    if (!userEmail || userEmail === '이메일 없음') {
      res.status(400).json({ error: 'User email not available' });
      return;
    }

    // 연체일 계산
    const now = new Date();
    const returnDate = items[0]?.returnDate;
    const returnTime = items[0]?.returnTime || '23:59';
    const returnDateTime = new Date(`${returnDate}T${returnTime}:00`);
    const overdueDays = Math.max(0, Math.ceil((now - returnDateTime) / (1000 * 60 * 60 * 24)));
    
    const equipmentListText = items.map(item => `- ${item.name || '이름 없음'}`).join('\n');
    
    // HTML 이메일 내용 생성
    const htmlContent = `
      <p style="margin: 0 0 16px 0; color: #495057; font-size: 15px; line-height: 1.6;">
        안녕하세요, <strong>${userName}</strong>님!<br>
        대여하신 장비의 반납을 요청드립니다.
      </p>
      ${overdueDays > 0 
        ? createWarningBox(`반납 예정일(${returnDate} ${returnTime})이 ${overdueDays}일 지났습니다. 즉시 반납해 주세요.`)
        : createWarningBox(`반납 예정일(${returnDate} ${returnTime})이 다가왔습니다. 기한 내 반납해 주세요.`)
      }
      ${createInfoBox([
        { label: '예약 ID', value: rentalId },
        { label: '반납 예정일', value: `${returnDate} ${returnTime}` },
        ...(overdueDays > 0 ? [{ label: '연체 일수', value: `${overdueDays}일` }] : []),
      ])}
      ${createEquipmentList(items)}
      <p style="margin: 16px 0 0 0; color: #6c757d; font-size: 13px; line-height: 1.6;">
        문의사항이 있으시면 관리자에게 연락해 주세요.
      </p>
    `;

    const htmlEmail = createEmailTemplate('반납 요청 안내', htmlContent);
    
    await sendMail(
      userEmail,
      overdueDays > 0 
        ? `[긴급] 장비 반납 기한이 ${overdueDays}일 초과되었습니다`
        : '장비 반납 기한 안내',
      `${userName}님, 대여하신 장비의 반납을 요청드립니다.\n\n예약 ID: ${rentalId}\n반납 예정일: ${returnDate} ${returnTime}\n${overdueDays > 0 ? `연체 일수: ${overdueDays}일\n` : ''}\n장비 목록:\n${equipmentListText}\n\nDKit 장비대여 시스템`,
      htmlEmail
    );
    
    // 발송 기록 업데이트
    const today = now.toISOString().split('T')[0];
    await db.collection('reservations').doc(rentalId).update({
      lastOverdueReminderDate: today,
      overdueReminderCount: (reservation.overdueReminderCount || 0) + 1
    });

    console.log(`✅ 수동 연체 독촉 메일 발송 완료 - ID: ${rentalId}`);

    res.status(200).json({
      success: true,
      message: 'Overdue reminder sent successfully',
      overdueDays: overdueDays
    });

  } catch (error) {
    console.error('❌ 수동 연체 독촉 메일 발송 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
