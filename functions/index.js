const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const { addEvent } = require('./calendar');

// 🔐 환경변수 설정: Gmail 정보
const gmailEmail = functions.config().gmail.user;
const gmailPassword = functions.config().gmail.pass;

// 메일 전송 설정
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

const adminEmail = ["choesuhyeon276@gmail.com"]; // ✅ 관리자 이메일로 교체할 것

const sendMail = (to, subject, text) => {
  const mailOptions = {
    from: `DIRT 알림 <${gmailEmail}>`,
    to, 
    subject,
    text,
  };
  return transporter.sendMail(mailOptions);
};

// ✅ 대여 승인 → 사용자 메일 + 캘린더 등록
exports.onRentalApproved = functions.firestore
  .document('reservations/{rentalId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // 승인되었을 때
    if (before.status !== 'active' && after.status === 'active') {
      const items = after.items || [];
      const userName = after.userName || after.userId || '이름 없음';
      const userStudentId = after.userStudentId || '학번 없음';
      const userPhone = after.userPhone || '전화번호 없음';
      const userEmail = after.userEmail;

      if (items.length === 0) {
        console.error('❌ 장비 데이터 없음.');
        return;
      }

      const equipmentList = items.map(item => `- ${item.name || '이름 없음'}`).join('\n');
      const title = `${userName}`;
      const description = `📝 학번: ${userStudentId}\n☎️ 전화번호: ${userPhone}\n📦 장비 목록:\n${equipmentList}\n\n📌 사용 목적: ${items[0].purpose || 'N/A'}`;

      const startDate = items[0].rentalDate;
      const startTime = items[0].rentalTime;
      const endDate = items[0].returnDate;
      const endTime = items[0].returnTime;

      try {
        await addEvent({ title, description, startDate, startTime, endDate, endTime });
        console.log('✅ 캘린더 이벤트 추가 완료!');
      } catch (error) {
        console.error('❌ 이벤트 등록 실패:', error.response?.data || error);
      }

      if (userEmail) {
        try {
          await sendMail(
            userEmail,
            '장비 대여가 승인되었습니다.',
            `${userName}님, 신청하신 장비 대여가 승인되었습니다.\n\n대여 시작: ${startDate} ${startTime}\n반납 예정: ${endDate} ${endTime}\n\nDIRT 장비대여 시스템`
          );
          console.log('✅ 사용자 메일 전송 완료');
        } catch (mailError) {
          console.error('❌ 사용자 메일 전송 실패:', mailError);
        }
      }
    }

    // 반납 완료 → 사용자 메일
    if (before.status !== 'returned' && after.status === 'returned') {
      const userEmail = after.userEmail;
      const userName = after.userName || after.userId || '사용자';

      if (userEmail) {
        try {
          await sendMail(
            userEmail,
            '장비 반납이 완료되었습니다.',
            `${userName}님, 장비 반납이 완료되었습니다.\n\n이용해주셔서 감사합니다.`
          );
          console.log('✅ 반납 완료 사용자 메일 전송 완료');
        } catch (mailError) {
          console.error('❌ 반납 완료 사용자 메일 전송 실패:', mailError);
        }
      }
    }
  });

// ✅ 대여 신청 생성 시 → 관리자에게 메일
exports.onRentalCreated = functions.firestore
  .document('reservations/{rentalId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const userName = data.userName || data.userId || '이름 없음';
    const userStudentId = data.userStudentId || '학번 없음';
    const userPhone = data.userPhone || '전화번호 없음';

    try {
      await sendMail(
        adminEmail,
        '새로운 대여 신청이 들어왔습니다',
        `신청자: ${userName}\n학번: ${userStudentId}\n연락처: ${userPhone}\n상태: ${data.status}`
      );
      console.log('✅ 관리자 대여 신청 알림 메일 전송 완료');
    } catch (mailError) {
      console.error('❌ 관리자 대여 신청 메일 전송 실패:', mailError);
    }
  });

// ✅ 반납 요청 시 → 관리자에게 메일
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
          `신청자: ${userName}\n학번: ${userStudentId}\n연락처: ${userPhone}\n상태: ${after.status}`
        );
        console.log('✅ 관리자 반납 요청 메일 전송 완료');
      } catch (mailError) {
        console.error('❌ 반납 요청 메일 전송 실패:', mailError);
      }
    }
  });
