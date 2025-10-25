const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const cors = require('cors')({ origin: true }); // ⭐ CORS 추가

admin.initializeApp();

// calendar.js에서 addEvent를 사용하는 경우만 import (없으면 제거 가능)
let addEvent;
try {
  const calendar = require('./calendar');
  addEvent = calendar.addEvent;
} catch (error) {
  console.log('⚠️ calendar.js 파일이 없습니다. 기존 캘린더 기능은 사용하지 않습니다.');
}

// 🔐 Gmail 환경변수
const gmailEmail = functions.config().gmail.user;
const gmailPassword = functions.config().gmail.pass;

// 📧 메일 전송 세팅
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// 🗄️ Firestore 인스턴스 (기존 방식으로 유지)
const db = admin.firestore();

// 🔐 Service Account 인증 설정
const getCalendarAuth = () => {
  const serviceAccount = functions.config().google?.serviceaccount;
  
  if (!serviceAccount) {
    throw new Error('Service Account 설정이 없습니다. firebase functions:config:set 명령어로 설정하세요.');
  }

  return new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/calendar']
  );
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

// 📧 메일 전송 함수 (개선된 오류 처리)
const sendMail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: `DKit 알림 <${gmailEmail}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
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

///////////////////////////////////////////////////////////////////////////////////////
// 📅 캘린더 이벤트 생성 API (프론트엔드에서 호출)
///////////////////////////////////////////////////////////////////////////////////////
exports.createCalendarEvent = functions.https.onRequest((req, res) => {
  // ⭐ CORS 미들웨어로 감싸기
  cors(req, res, async () => {
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
        colorId: '9', // 파란색
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
});

///////////////////////////////////////////////////////////////////////////////////////
// 🗑️ 캘린더 이벤트 삭제 API (프론트엔드에서 호출)
///////////////////////////////////////////////////////////////////////////////////////
exports.deleteCalendarEvent = functions.https.onRequest((req, res) => {
  // ⭐ CORS 미들웨어로 감싸기
  cors(req, res, async () => {
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

      await sendMail(
        adminEmails,
        '📥 새로운 장비 대여 신청이 접수되었습니다.',
        `신청 ID: ${rentalId}\n신청자: ${userName}\n학번: ${userStudentId}\n연락처: ${userPhone}\n이메일: ${userEmail}\n\n대여 시작: ${startDate} ${startTime}\n반납 예정: ${endDate} ${endTime}\n\n📦 장비 목록:\n${equipmentList}\n\nDKit 관리자 페이지\nhttps://equipment-rental-system.vercel.app/admins`
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

    // 🔄 user_profiles에서 정보 보강 (기존 방식 유지)
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
        const equipmentList = items.map(item => `- ${item.name || '이름 없음'}`).join('\n');
        const startDate = items[0]?.rentalDate || '날짜 없음';
        const startTime = items[0]?.rentalTime || '시간 없음';
        const endDate = items[0]?.returnDate || '날짜 없음';
        const endTime = items[0]?.returnTime || '시간 없음';

        await sendMail(
          userEmail,
          '✅ 장비 대여가 승인되었습니다.',
          `${userName}님, 신청하신 장비 대여가 승인되었습니다.\n\n예약 ID: ${rentalId}\n대여 시작: ${startDate} ${startTime}\n반납 예정: ${endDate} ${endTime}\n\n📦 장비 목록:\n${equipmentList}\n\nDKit 장비대여 시스템`
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

// 반납 완료 처리 함수
const handleReturnCompleted = async (reservationData, rentalId) => {
  try {
    const userEmail = reservationData.userEmail;
    const userName = reservationData.userName || reservationData.userId || '사용자';

    if (userEmail && userEmail !== '이메일 없음') {
      await sendMail(
        userEmail,
        '✅ 장비 반납이 완료되었습니다.',
        `${userName}님, 장비 반납이 완료되었습니다.\n\n예약 ID: ${rentalId}\n\n이용해주셔서 감사합니다.\n\nDKit 장비대여 시스템`
      );
      console.log('✅ 반납 완료 메일 전송 완료 - ID:', rentalId);
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

        // 🎯 다중 방법으로 관리자 이메일 가져오기
        const adminEmails = await getAdminEmails();

        await sendMail(
          adminEmails,
          '📤 반납 요청이 접수되었습니다.',
          `예약 ID: ${rentalId}\n신청자: ${userName}\n학번: ${userStudentId}\n연락처: ${userPhone}\n상태: ${after.status}\n\nDKit 관리자 시스템\nhttps://equipment-rental-system.vercel.app/admins`
        );
        console.log('✅ 반납 요청 관리자 메일 전송 완료 - ID:', rentalId);
      }
    } catch (error) {
      console.error('❌ 반납 요청 처리 실패:', {
        rentalId,
        error: error.message,
        stack: error.stack
      });
    }
  });