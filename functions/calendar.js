require('dotenv').config();

const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

const calendarId = process.env.GOOGLE_CALENDAR_ID;

const auth = new JWT({
  email: process.env.CLIENT_EMAIL,
  key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

const addEvent = async ({ title, description, startDate, startTime, endDate, endTime }) => {
  const event = {
    summary: title,
    description,
    start: {
      dateTime: `${startDate}T${startTime}:00`,
      timeZone: 'Asia/Seoul',
    },
    end: {
      dateTime: `${endDate}T${endTime}:00`,
      timeZone: 'Asia/Seoul',
    },
  };

  console.log('📅 등록할 이벤트 데이터:', { title, description, startDate, startTime, endDate, endTime });

  // ⭐ response를 받아서 eventId 반환
  const response = await calendar.events.insert({
    calendarId,
    resource: event,
  });

  console.log('✅ 캘린더 이벤트 생성 완료 - Event ID:', response.data.id);

  // ⭐ eventId 반환 (핵심!)
  return response.data.id;
};

module.exports = { addEvent };