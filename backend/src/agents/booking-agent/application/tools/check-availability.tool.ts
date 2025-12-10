import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export const checkAvailabilityTool = new DynamicStructuredTool({
  name: 'check_availability',
  description:
    'Checks availability for a given date. ALWAYS use this tool before suggesting times.',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.object({
    date: z.string().describe('The date to check availability for, in YYYY-MM-DD format.'),
  }) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  func: async (input: any) => {
    const { date } = input as { date: string };
    console.log(`[Tool] Checking availability for ${date}`);

    // MOCK LOGIC: Dynamic availability based on date hash
    // This ensures same date returns same slots, but different dates differ
    const dayHash = date.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const slots = [];

    // Simulate working hours 9-17
    for (let hour = 9; hour < 17; hour++) {
      // Randomly skip slots based on date hash + hour
      if ((dayHash + hour) % 3 !== 0) {
        slots.push(`${hour}:00`);
      }
      if ((dayHash + hour) % 5 === 0) {
        slots.push(`${hour}:30`);
      }
    }

    // If empty (rare), add a backup slot
    if (slots.length === 0) slots.push('10:00', '14:00');

    return JSON.stringify({
      available: true,
      date,
      slots: slots.sort(),
      message: `I have found these free slots for ${date}: ${slots.join(', ')}`,
    });
  },
});
