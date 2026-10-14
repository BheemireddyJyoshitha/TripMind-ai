import { aiService } from '../services/aiService.js';

const itinerarySchema = {
  type: 'object',
  properties: {
    itinerary: {
      type: 'array',
      description: 'Day-by-day sequential itinerary',
      items: {
        type: 'object',
        properties: {
          day: { type: 'integer', description: 'Day number (1, 2, ...)' },
          title: { type: 'string', description: 'Catchy day title or focus' },
          schedule: {
            type: 'array',
            description: 'Chronological timeline of activities and meals',
            items: {
              type: 'object',
              properties: {
                time: { type: 'string', description: 'Approximate time slot, e.g. 09:30 AM - 12:00 PM' },
                activity: { type: 'string', description: 'Activity or attraction details' },
                location: { type: 'string', description: 'Name of place and specific neighborhood' },
                cost: { type: 'number', description: 'Estimated group cost in INR (0 if free)' },
                suggestedMeal: {
                  type: 'string',
                  description: 'Suggested restaurant or meal option for this period (e.g. Lunch at Infantaria, or Breakfast at hotel)',
                },
              },
              required: ['time', 'activity', 'location', 'cost', 'suggestedMeal'],
            },
          },
          dailyTips: { type: 'string', description: 'Helpful advice for this specific day' },
        },
        required: ['day', 'title', 'schedule'],
      },
    },
  },
  required: ['itinerary'],
};

/**
 * Agent 5: Itinerary Agent
 * Synthesizes places, activity schedules, restaurants, and budget into a cohesive day-by-day plan.
 */
export async function runItineraryAgent({
  destination,
  days,
  travelers,
  budget,
  places,
  dayPlans,
  restaurants,
  budgetBreakdown,
}) {
  const placesSummary = places.map((p) => `- ${p.name} (${p.category}): ₹${p.estimatedEntryCostPerGroup}`).join('\n');
  const restaurantSummary = restaurants.map((r) => `- ${r.name} (${r.cuisine}, ${r.mealType}): ~₹${r.estimatedCostPerPerson}/person`).join('\n');
  const dayPlanSummary = dayPlans
    .map(
      (d) =>
        `Day ${d.day} [Zone: ${d.zone}]: Theme: ${d.theme}\nActivities: ${d.activities.map((a) => a.name).join(', ')}`
    )
    .join('\n');

  const systemInstruction = `You are the Itinerary Agent for TripMind AI.
Your responsibility:
- Synthesize all previous agent findings into a master day-by-day itinerary for ${destination}.
- Duration: ${days} days, Travelers: ${travelers} people.
- Each day MUST include a realistic chronological timeline: Morning activity, Lunch break, Afternoon/Sunset activity, and Dinner.
- Pair the activities with the recommended restaurants that are in the same vicinity.
- Do NOT schedule unrealistic jumps across distant zones in the same afternoon.
- Ensure all costs are numbers in INR (group cost).
- Ensure Day 1 to Day ${days} are fully represented.
Return structured JSON only matching the schema.`;

  const prompt = `Synthesize the complete itinerary for:
Destination: ${destination}
Days: ${days}
Travelers: ${travelers}
Budget status: ${budgetBreakdown.isOverBudget ? 'Over Budget' : 'Within Budget'}

Recommended Places:
${placesSummary}

Proposed Daily Activities & Zones:
${dayPlanSummary}

Recommended Dining:
${restaurantSummary}

Create a seamless, realistic day-by-day schedule for Day 1 through Day ${days}.`;

  const result = await aiService.generateStructuredJSON({
    systemInstruction,
    prompt,
    schema: itinerarySchema,
    agentName: 'Itinerary Agent',
  });

  const rawItinerary = Array.isArray(result.itinerary) ? result.itinerary : [];

  // Guarantee every day from 1..days is cleanly structured
  const itinerary = [];
  for (let d = 1; d <= days; d++) {
    const dayItem = rawItinerary.find((item) => Number(item.day) === d);
    const dayPlanRef = dayPlans.find((dp) => dp.day === d) || dayPlans[(d - 1) % dayPlans.length];
    const lunchRest = restaurants[(d - 1) % restaurants.length];
    const dinnerRest = restaurants[d % restaurants.length];

    if (dayItem && Array.isArray(dayItem.schedule) && dayItem.schedule.length > 0) {
      itinerary.push({
        day: d,
        title: String(dayItem.title || `Day ${d}: Discovering ${destination}`).trim(),
        schedule: dayItem.schedule.map((s, idx) => ({
          time: String(s.time || (idx === 0 ? '09:30 AM - 12:30 PM' : idx === 1 ? '01:00 PM - 02:30 PM' : '04:00 PM - 07:00 PM')).trim(),
          activity: String(s.activity || 'Sightseeing').trim(),
          location: String(s.location || destination).trim(),
          cost: Math.max(0, Math.round(Number(s.cost) || 0)),
          suggestedMeal: String(s.suggestedMeal || (idx === 1 ? `Lunch at ${lunchRest.name}` : `Dinner at ${dinnerRest.name}`)).trim(),
        })),
        dailyTips: String(dayItem.dailyTips || 'Start early to beat the afternoon heat. Carry water and comfortable shoes.').trim(),
      });
    } else {
      // Fallback synthesis
      const act1 = dayPlanRef.activities[0] || { name: 'Morning Exploration', placeName: destination, estimatedCost: 0 };
      const act2 = dayPlanRef.activities[1] || { name: 'Evening Walk & Sunset', placeName: destination, estimatedCost: 0 };

      itinerary.push({
        day: d,
        title: `Day ${d}: ${dayPlanRef.theme || 'Highlights of ' + destination}`,
        schedule: [
          {
            time: '09:30 AM - 12:30 PM',
            activity: act1.name,
            location: act1.placeName,
            cost: act1.estimatedCost || 0,
            suggestedMeal: 'Light local breakfast nearby',
          },
          {
            time: '01:00 PM - 02:30 PM',
            activity: `Lunch break & relaxation`,
            location: lunchRest.areaOrZone || destination,
            cost: Math.round(lunchRest.estimatedCostPerPerson * travelers),
            suggestedMeal: `Lunch at ${lunchRest.name} (${lunchRest.cuisine})`,
          },
          {
            time: '03:30 PM - 06:30 PM',
            activity: act2.name,
            location: act2.placeName,
            cost: act2.estimatedCost || 0,
            suggestedMeal: 'Sunset chai & refreshments',
          },
          {
            time: '07:30 PM - 09:30 PM',
            activity: `Evening dinner & casual stroll`,
            location: dinnerRest.areaOrZone || destination,
            cost: Math.round(dinnerRest.estimatedCostPerPerson * travelers),
            suggestedMeal: `Dinner at ${dinnerRest.name} (${dinnerRest.cuisine})`,
          },
        ],
        dailyTips: 'Keep a digital copy of your IDs and wear comfortable walking footwear.',
      });
    }
  }

  return itinerary;
}
