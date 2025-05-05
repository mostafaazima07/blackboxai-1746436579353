const { google } = require('googleapis');
const { Client } = require('@microsoft/microsoft-graph-client');
const logger = require('../utils/logger');

// Google Calendar Setup
const googleAuth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const calendar = google.calendar({ version: 'v3', auth: googleAuth });

// Microsoft Graph Setup
const getGraphClient = (accessToken) => {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
};

// Helper function to format event time
const formatEventTime = (date) => {
  return new Date(date).toISOString();
};

// Schedule event in Google Calendar
const scheduleGoogleEvent = async (eventDetails, userEmail) => {
  try {
    const { title, description, startTime, endTime = startTime, attendees } = eventDetails;

    const event = {
      summary: title,
      description,
      start: {
        dateTime: formatEventTime(startTime),
        timeZone: 'UTC'
      },
      end: {
        dateTime: formatEventTime(endTime),
        timeZone: 'UTC'
      },
      attendees: attendees.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 } // 30 minutes before
        ]
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all'
    });

    logger.info(`Google Calendar event created: ${response.data.id}`);
    return { google: response.data.id };
  } catch (error) {
    logger.error('Google Calendar event creation failed:', error);
    return null;
  }
};

// Schedule event in Microsoft Calendar
const scheduleMicrosoftEvent = async (eventDetails, accessToken) => {
  try {
    const { title, description, startTime, endTime = startTime, attendees } = eventDetails;
    const client = getGraphClient(accessToken);

    const event = {
      subject: title,
      body: {
        contentType: 'HTML',
        content: description
      },
      start: {
        dateTime: formatEventTime(startTime),
        timeZone: 'UTC'
      },
      end: {
        dateTime: formatEventTime(endTime),
        timeZone: 'UTC'
      },
      attendees: attendees.map(email => ({
        emailAddress: {
          address: email
        },
        type: 'required'
      })),
      isReminderOn: true,
      reminderMinutesBeforeStart: 30
    };

    const response = await client
      .api('/me/events')
      .post(event);

    logger.info(`Microsoft Calendar event created: ${response.id}`);
    return { microsoft: response.id };
  } catch (error) {
    logger.error('Microsoft Calendar event creation failed:', error);
    return null;
  }
};

// Main function to schedule events in both calendars
exports.scheduleCalendarEvent = async (eventDetails) => {
  try {
    const results = {
      google: null,
      microsoft: null
    };

    // Try Google Calendar
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      const googleResult = await scheduleGoogleEvent(eventDetails);
      if (googleResult) {
        results.google = googleResult.google;
      }
    }

    // Try Microsoft Calendar
    if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
      // Note: You'll need to implement token management for Microsoft Graph
      const microsoftResult = await scheduleMicrosoftEvent(eventDetails, process.env.MICROSOFT_ACCESS_TOKEN);
      if (microsoftResult) {
        results.microsoft = microsoftResult.microsoft;
      }
    }

    return results;
  } catch (error) {
    logger.error('Calendar event scheduling failed:', error);
    throw error;
  }
};

// Update calendar event
exports.updateCalendarEvent = async (eventId, eventDetails) => {
  try {
    const results = {
      google: false,
      microsoft: false
    };

    if (eventId.google) {
      try {
        await calendar.events.update({
          calendarId: 'primary',
          eventId: eventId.google,
          resource: {
            summary: eventDetails.title,
            description: eventDetails.description,
            start: {
              dateTime: formatEventTime(eventDetails.startTime),
              timeZone: 'UTC'
            },
            end: {
              dateTime: formatEventTime(eventDetails.endTime || eventDetails.startTime),
              timeZone: 'UTC'
            }
          }
        });
        results.google = true;
      } catch (error) {
        logger.error('Google Calendar event update failed:', error);
      }
    }

    if (eventId.microsoft) {
      try {
        const client = getGraphClient(process.env.MICROSOFT_ACCESS_TOKEN);
        await client
          .api(`/me/events/${eventId.microsoft}`)
          .update({
            subject: eventDetails.title,
            body: {
              contentType: 'HTML',
              content: eventDetails.description
            },
            start: {
              dateTime: formatEventTime(eventDetails.startTime),
              timeZone: 'UTC'
            },
            end: {
              dateTime: formatEventTime(eventDetails.endTime || eventDetails.startTime),
              timeZone: 'UTC'
            }
          });
        results.microsoft = true;
      } catch (error) {
        logger.error('Microsoft Calendar event update failed:', error);
      }
    }

    return results;
  } catch (error) {
    logger.error('Calendar event update failed:', error);
    throw error;
  }
};

// Delete calendar event
exports.deleteCalendarEvent = async (eventId) => {
  try {
    const results = {
      google: false,
      microsoft: false
    };

    if (eventId.google) {
      try {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: eventId.google
        });
        results.google = true;
      } catch (error) {
        logger.error('Google Calendar event deletion failed:', error);
      }
    }

    if (eventId.microsoft) {
      try {
        const client = getGraphClient(process.env.MICROSOFT_ACCESS_TOKEN);
        await client
          .api(`/me/events/${eventId.microsoft}`)
          .delete();
        results.microsoft = true;
      } catch (error) {
        logger.error('Microsoft Calendar event deletion failed:', error);
      }
    }

    return results;
  } catch (error) {
    logger.error('Calendar event deletion failed:', error);
    throw error;
  }
};

// Get calendar event details
exports.getCalendarEvent = async (eventId) => {
  try {
    const results = {
      google: null,
      microsoft: null
    };

    if (eventId.google) {
      try {
        const response = await calendar.events.get({
          calendarId: 'primary',
          eventId: eventId.google
        });
        results.google = response.data;
      } catch (error) {
        logger.error('Google Calendar event fetch failed:', error);
      }
    }

    if (eventId.microsoft) {
      try {
        const client = getGraphClient(process.env.MICROSOFT_ACCESS_TOKEN);
        const response = await client
          .api(`/me/events/${eventId.microsoft}`)
          .get();
        results.microsoft = response;
      } catch (error) {
        logger.error('Microsoft Calendar event fetch failed:', error);
      }
    }

    return results;
  } catch (error) {
    logger.error('Calendar event fetch failed:', error);
    throw error;
  }
};
