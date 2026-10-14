import { aiService } from '../services/aiService.js';

const activitySchema = {
  type: 'object',
  properties: {
    dayPlans: {
      type: 'array',
      description: 'Activity plan broken down for each day',
      items: {
        type: 'object',
        properties: {
          day: { type: 'integer', description: 'Day number (1, 2, ...)' },
          theme: { type: 'string', description: 'Focus theme of the day' },
          zone: { type: 'string', description: 'Geographic zone/neighborhood to minimize travel' },
          activities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Activity title' },
                placeName: { type: 'string', description: 'Matching place or landmark name' },
                description: { type: 'string', description: 'What to do during this activity' },
                suggestedTimeSlot: { type: 'string', description: 'e.g. Morning, Afternoon, Evening, Sunset' },
                duration: { type: 'string', description: 'e.g. 2 hours' },
                order: { type: 'integer', description: 'Sequential visit order within the day (1, 2, ...)' },
                estimatedCost: { type: 'number', description: 'Estimated group activity fee in INR (0 if free)' },
              },
              required: ['name', 'placeName', 'description', 'suggestedTimeSlot', 'duration', 'order', 'estimatedCost'],
            },
          },
        },
        required: ['day', 'theme', 'zone', 'activities'],
      },
    },
    pacingNotes: { type: 'string', description: 'Notes on pacing, travel times, and sensible scheduling' },
  },
  required: ['dayPlans'],
};

/**
 * Agent 2: Activity Agent
 * Selects suitable activities, groups attractions geographically, and schedules realistic daily pacing.
 */
export async function runActivityAgent({ destination, days, travelers, interests, places }) {
  const placesList = places
    .map((p, i) => `${i + 1}. ${p.name} (${p.category}) - ${p.estimatedDuration}, Entry fee: ₹${p.estimatedEntryCostPerGroup}`)
    .join('\n');

  const systemInstruction = `You are the Activity Agent for TripMind AI.
Your responsibility:
- Take the recommended places from the Destination Agent and organize them into a realistic schedule across all ${days} days.
- Group attractions geographically by zone/area for each day so travelers don't waste time backtracking.
- Suggest a sensible sequence of visits (e.g. Morning -> Afternoon -> Evening/Sunset).
- Avoid overloaded schedules! Keep 2 to 3 main activities per day to allow for meals, travel, and rest.
- Distribute the activities evenly across the ${days} days (Day 1 through Day ${days}).
Return structured JSON only matching the schema.`;

  const prompt = `Destination: ${destination}
Duration: ${days} days
Travelers: ${travelers}
Interests: ${interests.join(', ')}

Available curated places:
${placesList}

Create a well-paced daily activity plan for Day 1 to Day ${days}, grouping nearby sights geographically into zones.`;

  const result = await aiService.generateStructuredJSON({
    systemInstruction,
    prompt,
    schema: activitySchema,
    agentName: 'Activity Agent',
  });

  const rawPlans = Array.isArray(result.dayPlans) ? result.dayPlans : [];

  // Normalize day plans ensuring days 1..days exist
  const dayPlans = [];
  for (let d = 1; d <= days; d++) {
    const found = rawPlans.find((p) => Number(p.day) === d);
    if (found) {
      dayPlans.push({
        day: d,
        theme: String(found.theme || `Day ${d} Exploration`).trim(),
        zone: String(found.zone || 'Central Area').trim(),
        activities: (Array.isArray(found.activities) ? found.activities : []).map((a, idx) => ({
          name: String(a.name || `Activity ${idx + 1}`).trim(),
          placeName: String(a.placeName || destination).trim(),
          description: String(a.description || 'Sightseeing activity').trim(),
          suggestedTimeSlot: String(a.suggestedTimeSlot || (idx === 0 ? 'Morning' : idx === 1 ? 'Afternoon' : 'Evening')).trim(),
          duration: String(a.duration || '2 hours').trim(),
          order: Number(a.order) || idx + 1,
          estimatedCost: Math.max(0, Math.round(Number(a.estimatedCost) || 0)),
        })),
      });
    } else {
      // Fallback if model missed a day
      const placeForDay = places[(d - 1) % places.length];
      dayPlans.push({
        day: d,
        theme: `Day ${d}: Discovering ${placeForDay.name}`,
        zone: placeForDay.category,
        activities: [
          {
            name: `Visit ${placeForDay.name}`,
            placeName: placeForDay.name,
            description: placeForDay.description,
            suggestedTimeSlot: 'Morning',
            duration: placeForDay.estimatedDuration,
            order: 1,
            estimatedCost: placeForDay.estimatedEntryCostPerGroup,
          },
          {
            name: 'Local Neighborhood Stroll & Free Leisure',
            placeName: placeForDay.name + ' Vicinity',
            description: 'Relaxed walk exploring local markets and artisan shops.',
            suggestedTimeSlot: 'Afternoon',
            duration: '2 hours',
            order: 2,
            estimatedCost: 0,
          },
        ],
      });
    }
  }

  return {
    dayPlans,
    pacingNotes: result.pacingNotes || 'Well-paced schedule allowing ample transit and relaxation.',
  };
}
