const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

const calendarId = process.env.REACT_APP_GOOGLE_CALENDAR_ID;

const addEventToCalendar = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      startTime,
      endDate,
      endTime
    } = req.body;

    const auth = new JWT({
      email: process.env.CLIENT_EMAIL,
      key: process.env.REACT_APP_GOOGLE_API_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    const calendar = google.calendar({ version: 'v3', auth });

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

    await calendar.events.insert({
      calendarId,
      resource: event
    });

    res.status(200).send({ message: 'Event added to calendar.' });
  } catch (error) {
    console.error('Google Calendar Error:', error);
    res.status(500).send({ error: 'Failed to add event to calendar' });
  }
};

module.exports = addEventToCalendar;
