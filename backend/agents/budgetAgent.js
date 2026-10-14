import { aiService } from '../services/aiService.js';

const budgetSchema = {
  type: 'object',
  properties: {
    transportation: {
      type: 'number',
      description: 'Estimated total local transportation for the entire group over all days in INR (cabs, rentals, autos)',
    },
    food: {
      type: 'number',
      description: 'Estimated total food cost for all travelers over all days in INR (breakfast, lunch, dinner, snacks)',
    },
    activities: {
      type: 'number',
      description: 'Estimated total entry tickets and guided activity fees for the group in INR',
    },
    other: {
      type: 'number',
      description: 'Estimated miscellaneous buffer (souvenirs, incidentals, tips) in INR',
    },
    notes: {
      type: 'string',
      description: 'Breakdown rationale explaining how figures were estimated',
    },
    suggestedAlternatives: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of money-saving alternatives and cost-cutting recommendations if the budget is tight or exceeded',
    },
  },
  required: ['transportation', 'food', 'activities', 'other'],
};

/**
 * Agent 4: Budget Agent
 * Estimates categorized expenses, validates budget feasibility, enforces deterministic totals,
 * and suggests cost-saving alternatives when over budget.
 */
export async function runBudgetAgent({ destination, budget, travelers, days, places, dayPlans, restaurants }) {
  // Compute baseline activity entry fees from actual places
  const placeEntryTotal = places.reduce((sum, p) => sum + (Number(p.estimatedEntryCostPerGroup) || 0), 0);

  // Compute average restaurant meal cost from Agent 3
  const avgMealCostPerPerson = restaurants.length > 0
    ? Math.round(restaurants.reduce((s, r) => s + (Number(r.estimatedCostPerPerson) || 400), 0) / restaurants.length)
    : 450;

  const systemInstruction = `You are the Budget Agent for TripMind AI.
Your responsibility:
- Provide an honest, accurate, and realistic expense breakdown for a trip to ${destination}.
- Duration: ${days} days, Travelers: ${travelers} people, Total available budget: ₹${budget} INR.
- Do NOT falsely shrink estimates to fit an unrealistic budget. If the trip requires more than ₹${budget}, report honest market estimates!
- Category definitions:
  1. transportation: Total local group travel across all ${days} days (autos, taxis, or scooter/car rentals).
  2. food: Total dining expense for ${travelers} travelers across ${days} days (~3 meals + water/snacks per person per day).
  3. activities: Group sightseeing fees (baseline entry fees sum is ₹${placeEntryTotal}).
  4. other: Miscellaneous contingency, water, local tips (~5-10% of total).
- Provide practical money-saving alternatives in suggestedAlternatives (e.g. public transport, street food, free beaches).
Return structured JSON only matching the schema.`;

  const prompt = `Analyze and estimate expenses for:
Destination: ${destination}
Total Budget: ₹${budget}
Duration: ${days} days
Travelers: ${travelers}
Curated Places Entry Total: ₹${placeEntryTotal}
Avg Restaurant Cost/Person/Meal: ₹${avgMealCostPerPerson}

Provide honest, realistic category estimates in INR.`;

  const result = await aiService.generateStructuredJSON({
    systemInstruction,
    prompt,
    schema: budgetSchema,
    agentName: 'Budget Agent',
  });

  // DETERMINISTIC CALCULATIONS (Enforcing mathematical consistency)
  const transportation = Math.max(0, Math.round(Number(result.transportation) || (days * 1200)));
  const food = Math.max(0, Math.round(Number(result.food) || (travelers * days * avgMealCostPerPerson * 2.5)));
  const activities = Math.max(0, Math.round(Number(result.activities) || Math.max(placeEntryTotal, 500)));
  const other = Math.max(0, Math.round(Number(result.other) || Math.round((transportation + food + activities) * 0.08)));

  const totalEstimatedCost = transportation + food + activities + other;
  const remainingBudget = budget - totalEstimatedCost;
  const isOverBudget = totalEstimatedCost > budget;
  const budgetStatus = isOverBudget ? 'over_budget' : 'within_budget';
  const perPersonCost = Math.round(totalEstimatedCost / Math.max(1, travelers));

  let budgetWarning = null;
  let suggestedAlternatives = Array.isArray(result.suggestedAlternatives) ? result.suggestedAlternatives : [];

  if (isOverBudget) {
    const deficit = Math.abs(remainingBudget);
    budgetWarning = `Budget Alert: The estimated trip cost of ₹${totalEstimatedCost.toLocaleString('en-IN')} exceeds your budget of ₹${budget.toLocaleString('en-IN')} by ₹${deficit.toLocaleString('en-IN')}.`;
    
    // Ensure solid actionable recommendations
    if (suggestedAlternatives.length === 0) {
      suggestedAlternatives = [
        `Opt for shared cabs, two-wheeler rentals, or public transit instead of private chauffeur taxis (saves up to ₹${Math.round(transportation * 0.4).toLocaleString('en-IN')}).`,
        `Enjoy authentic local eateries, thalis, and street food stalls for lunch to reduce food costs.`,
        `Prioritize free entry viewpoints, public beaches, and heritage strolls.`,
        `Consider adjusting the trip duration or traveling during the off-peak shoulder season.`,
      ];
    }
  }

  return {
    budgetBreakdown: {
      transportation,
      food,
      activities,
      other,
      totalEstimatedCost,
      remainingBudget,
      isOverBudget,
      perPersonCost,
      notes: result.notes || 'Estimates are based on average current rates for travelers in this destination.',
      budgetWarning,
      suggestedAlternatives,
    },
    budgetStatus,
  };
}
