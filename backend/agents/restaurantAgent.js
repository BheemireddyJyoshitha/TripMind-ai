import { aiService } from '../services/aiService.js';

const restaurantSchema = {
  type: 'object',
  properties: {
    restaurants: {
      type: 'array',
      description: 'Curated list of restaurants and dining options',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the restaurant or eatery' },
          cuisine: { type: 'string', description: 'Type of cuisine (e.g. Goan Seafood, North Indian, Cafe, Street Food)' },
          description: { type: 'string', description: 'Short description highlighting dishes and ambiance' },
          mealType: { type: 'string', description: 'Breakfast, Lunch, Dinner, or Snack/Cafe' },
          estimatedCostPerPerson: {
            type: 'number',
            description: 'Estimated average cost per person in INR (e.g. 300, 600, 1200)',
          },
          areaOrZone: { type: 'string', description: 'Area or landmark nearby' },
        },
        required: ['name', 'cuisine', 'description', 'mealType', 'estimatedCostPerPerson'],
      },
    },
    foodNotes: {
      type: 'string',
      description: 'Advice on local specialties, dining hours, and typical tipping/ordering tips',
    },
  },
  required: ['restaurants'],
};

/**
 * Agent 3: Restaurant Agent
 * Recommends appropriate restaurants, cafes, and regional food options aligned with activities and budget.
 */
export async function runRestaurantAgent({ destination, interests, budget, days, travelers, dayPlans }) {
  const zonesList = dayPlans.map((d) => `Day ${d.day} (${d.theme}) in zone: ${d.zone}`).join('\n');
  const approxBudgetPerPersonPerDay = Math.round(budget / (travelers * days));

  const systemInstruction = `You are the Restaurant Agent for TripMind AI.
Your responsibility:
- Recommend appropriate restaurants, authentic cafes, and local food spots in ${destination}.
- Match recommendations to the traveler preferences (${interests.join(', ')}).
- Select dining spots convenient to the daily activity zones:\n${zonesList}
- Suggest realistic estimated costs per person in INR that fit the overall budget (approx total budget per person-day is ₹${approxBudgetPerPersonPerDay}).
- Clearly treat all meal costs as realistic estimates. Do NOT claim live table availability or real-time rates.
- Include a good balance of lunch, dinner, breakfast, and iconic local delicacies.
- Provide 4 to 8 top distinct dining recommendations.
Return structured JSON only matching the schema.`;

  const prompt = `Recommend 4 to 8 authentic, well-reviewed food and restaurant options for:
Destination: ${destination}
Group Size: ${travelers} travelers
Duration: ${days} days
Total Budget: ₹${budget}
Interests: ${interests.join(', ')}

Provide realistic estimated prices per person in INR.`;

  const result = await aiService.generateStructuredJSON({
    systemInstruction,
    prompt,
    schema: restaurantSchema,
    agentName: 'Restaurant Agent',
  });

  const rawRestaurants = Array.isArray(result.restaurants) ? result.restaurants : [];
  const restaurants = rawRestaurants.map((r, idx) => ({
    id: `restaurant-${idx + 1}`,
    name: String(r.name || `Local Eatery ${idx + 1}`).trim(),
    cuisine: String(r.cuisine || 'Regional Cuisine').trim(),
    description: String(r.description || 'Authentic dining option.').trim(),
    mealType: String(r.mealType || (idx % 2 === 0 ? 'Lunch' : 'Dinner')).trim(),
    estimatedCostPerPerson: Math.max(50, Math.round(Number(r.estimatedCostPerPerson) || 400)),
    areaOrZone: String(r.areaOrZone || destination).trim(),
  }));

  if (restaurants.length === 0) {
    throw new Error('Restaurant Agent was unable to produce dining recommendations.');
  }

  return {
    restaurants,
    foodNotes: result.foodNotes || 'Estimated costs are based on average meal prices in the area.',
  };
}
