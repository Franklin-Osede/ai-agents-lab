import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export const confirmBookingTool = new DynamicStructuredTool({
  name: 'confirm_booking',
  description:
    'Confirms a booking for a specific date and time. Use this when the user explicitly agrees to a slot.',
  schema: z.object({
    date: z.string().describe('Date in YYYY-MM-DD format'),
    time: z.string().describe('Time in HH:MM format'),
    name: z.string().describe('Name of the person booking'),
    email: z.string().optional().describe('Email for confirmation'),
  }),
  func: async ({ date, time, name, email }) => {
    console.log(`[Tool] Confirming booking for ${name} on ${date} at ${time}`);

    // Mock "Saving" to DB
    const bookingId = 'BK-' + Math.floor(Math.random() * 10000);

    // Generate Google Calendar Link
    // Format: https://calendar.google.com/calendar/render?action=TEMPLATE&text=TEXT&dates=DATES&details=DETAILS&location=LOCATION
    const startTimeParts = time.split(':');
    const startHour = parseInt(startTimeParts[0]);
    const startMin = parseInt(startTimeParts[1]);

    const startDate = new Date(date);
    startDate.setHours(startHour, startMin);
    const endDate = new Date(startDate);
    endDate.setHours(startHour + 1, startMin); // 1 hour duration

    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const gCalDates = `${fmt(startDate)}/${fmt(endDate)}`;

    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Consultation+with+AI+Agents+Lab&dates=${gCalDates}&details=Confirmed+booking+for+${name}&location=Online+Meeting`;

    return JSON.stringify({
      success: true,
      bookingId,
      status: 'confirmed',
      googleCalendarLink: gCalUrl,
      message: `Booking confirmed for ${date} at ${time}. ID: ${bookingId}.`,
    });
  },
});
