const functions = require('firebase-functions');
const { addEvent } = require('./calendar');

exports.onRentalApproved = functions.firestore
  .document('reservations/{rentalId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== 'active' && after.status === 'active') {
      const items = after.items || [];
      const userName = after.userName || after.userId || '이름 없음';
      const userStudentId = after.userStudentId || '학번 없음';
      const userPhone = after.userPhone || '전화번호 없음';

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

      console.log('📅 등록할 이벤트 데이터:', { title, description, startDate, startTime, endDate, endTime });

      try {
        await addEvent({ title, description, startDate, startTime, endDate, endTime });
        console.log('✅ 캘린더 이벤트 추가 완료!');
      } catch (error) {
        console.error('❌ 이벤트 등록 실패:', error.response?.data || error);
      }
    }
  });
