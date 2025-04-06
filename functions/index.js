const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const { addEvent } = require('./calendar');
const admin = require('firebase-admin');
admin.initializeApp();

const { getFirestore, doc, getDoc } = require('firebase-admin/firestore');

// 🔐 Gmail 환경변수
const gmailEmail = functions.config().gmail.user;
const gmailPassword = functions.config().gmail.pass;

// ✅ 관리자 이메일 (수정 가능)
const adminEmail = ["choesuhyeon276@gmail.com", "Gkrry24@khu.ac.kr"];

// 📧 메일 전송 세팅
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// 📧 메일 전송 함수
const sendMail = (to, subject, text) => {
  const mailOptions = {
    from: `DIRT 알림 <${gmailEmail}>`,
    to,
    subject,
    text,
  };
  return transporter.sendMail(mailOptions);
};
const db = admin.firestore(); // 이렇게 해도 됨

///////////////////////////////////////////////////////////////////////////////////////
// ✅ 1. 대여 신청 생성 시 → 관리자에게 메일만 발송
///////////////////////////////////////////////////////////////////////////////////////
exports.onRentalCreatedAdminNotify = functions.firestore
  .document('reservations/{rentalId}')
  .onCreate(async (snap, context) => {
    const after = snap.data();
    const items = after.items || [];

    const userName = after.userName || after.userId || '이름 없음';
    const userStudentId = after.userStudentId || '학번 없음';
    const userPhone = after.userPhone || '전화번호 없음';
    const userEmail = after.userEmail;

    const startDate = items[0]?.rentalDate;
    const startTime = items[0]?.rentalTime;
    const endDate = items[0]?.returnDate;
    const endTime = items[0]?.returnTime;
    const equipmentList = items.map(item => `- ${item.name || '이름 없음'}`).join('\n');

    try {
      await sendMail(
        adminEmail,
        '📥 새로운 장비 대여 신청이 접수되었습니다.',
        `신청자: ${userName}\n학번: ${userStudentId}\n연락처: ${userPhone}\n이메일: ${userEmail}\n\n대여 시작: ${startDate} ${startTime}\n반납 예정: ${endDate} ${endTime}\n\n📦 장비 목록:\n${equipmentList}\n\nDIRT 관리자 페이지\nhttps://equipment-rental-system.vercel.app/admins`
      );
      console.log('✅ 관리자 대여 신청 메일 전송 완료');
    } catch (err) {
      console.error('❌ 관리자 메일 전송 실패:', err.message || err);
    }
  });

///////////////////////////////////////////////////////////////////////////////////////
// ✅ 2. 대여 승인 시 (status가 active로 변경될 때)
//    → Google Calendar에 등록
//    → 사용자에게 승인 메일 발송
///////////////////////////////////////////////////////////////////////////////////////
exports.onRentalApprovedUserNotify = functions.firestore
  .document('reservations/{rentalId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // ✅ 대여 승인 감지 (status: active)
    if (before.status !== 'active' && after.status === 'active') {
      console.log('🔥 대여 승인 감지됨');

      const db = getFirestore();
      const userId = after.userId;
      const items = after.items || [];

      // 기본 유저 정보
      let userName = after.userName || userId || '이름 없음';
      let userStudentId = after.userStudentId || '학번 없음';
      let userPhone = after.userPhone || '전화번호 없음';
      let userEmail = after.userEmail;

      // 🔄 user_profiles에서 보강
      try {
        const userProfileSnap = await getDoc(doc(db, 'user_profiles', userId));
        if (userProfileSnap.exists()) {
          const profile = userProfileSnap.data();
          userName = profile.name || userName;
          userStudentId = profile.studentId || userStudentId;
          userPhone = profile.phoneNumber || userPhone;
          userEmail = profile.email || userEmail;
        }
      } catch (err) {
        console.error('❌ user_profiles 불러오기 실패:', err);
      }

      // 📆 Google Calendar 등록
      const startDate = items[0]?.rentalDate;
      const startTime = items[0]?.rentalTime;
      const endDate = items[0]?.returnDate;
      const endTime = items[0]?.returnTime;
      const equipmentList = items.map(item => `- ${item.name || '이름 없음'}`).join('\n');
      const purpose = items[0]?.purpose || 'N/A';

      const title = `${userName}`;
      const description = `📝 학번: ${userStudentId}\n☎️ 전화번호: ${userPhone}\n📦 장비 목록:\n${equipmentList}\n📌 사용 목적: ${purpose}`;

      try {
        await addEvent({ title, description, startDate, startTime, endDate, endTime });
        console.log('✅ Google 캘린더 등록 완료');
      } catch (calendarError) {
        console.error('❌ Google 캘린더 등록 실패:', calendarError.response?.data || calendarError);
      }

      // 📧 사용자 승인 메일 발송
      if (userEmail) {
        try {
          await sendMail(
            userEmail,
            '장비 대여가 승인되었습니다.',
            `${userName}님, 신청하신 장비 대여가 승인되었습니다.\n\n대여 시작: ${startDate} ${startTime}\n반납 예정: ${endDate} ${endTime}\n\n📦 장비 목록:\n${equipmentList}\n\nDIRT 장비대여 시스템`
          );
          console.log('✅ 사용자 승인 메일 전송 완료');
        } catch (mailErr) {
          console.error('❌ 사용자 승인 메일 전송 실패:', mailErr);
        }
      } else {
        console.warn('⚠️ 사용자 이메일 없음: 메일 생략됨');
      }
    }

    // ✅ 3. 반납 완료 시 사용자에게 메일
    if (before.status !== 'returned' && after.status === 'returned') {
      const userEmail = after.userEmail;
      const userName = after.userName || after.userId || '사용자';

      if (userEmail) {
        try {
          await sendMail(
            userEmail,
            '장비 반납이 완료되었습니다.',
            `${userName}님, 장비 반납이 완료되었습니다.\n\n이용해주셔서 감사합니다.\n\nDIRT 장비대여 시스템`
          );
          console.log('✅ 반납 완료 메일 전송 완료');
        } catch (mailError) {
          console.error('❌ 반납 메일 전송 실패:', mailError);
        }
      }
    }
  });

///////////////////////////////////////////////////////////////////////////////////////
// ✅ 4. 반납 요청 시 → 관리자에게 메일
///////////////////////////////////////////////////////////////////////////////////////
exports.onReturnRequested = functions.firestore
  .document('reservations/{rentalId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== 'return_requested' && after.status === 'return_requested') {
      const userName = after.userName || after.userId || '이름 없음';
      const userStudentId = after.userStudentId || '학번 없음';
      const userPhone = after.userPhone || '전화번호 없음';

      try {
        await sendMail(
          adminEmail,
          '반납 요청이 접수되었습니다.',
          `신청자: ${userName}\n학번: ${userStudentId}\n연락처: ${userPhone}\n상태: ${after.status}\n\nDIRT 관리자 시스템\nhttps://equipment-rental-system.vercel.app/admins`
        );
        console.log('✅ 반납 요청 관리자 메일 전송 완료');
      } catch (mailError) {
        console.error('❌ 반납 요청 메일 전송 실패:', mailError);
      }
    }
  });
