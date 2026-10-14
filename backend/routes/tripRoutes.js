import express from 'express';
import { runDestinationAgent } from '../agents/destinationAgent.js';
import { runActivityAgent } from '../agents/activityAgent.js';
import { runRestaurantAgent } from '../agents/restaurantAgent.js';
import { runBudgetAgent } from '../agents/budgetAgent.js';
import { runItineraryAgent } from '../agents/itineraryAgent.js';

const router = express.Router();

const ALLOWED_INTERESTS = [
  'Beaches',
  'Adventure',
  'Nature',
  'History',
  'Culture',
  'Shopping',
  'Food',
];

/**
 * Health check endpoint
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'your_actual_api_key'),
  });
});

/**
 * Validate input payload for trip generation
 */
function validateTripRequest(body) {
  const errors = [];

  const { destination, budget, days, travelers, interests } = body || {};

  // Destination validation
  if (!destination || typeof destination !== 'string' || destination.trim().length === 0) {
    errors.push('Destination is required.');
  } else if (destination.trim().length < 2 || destination.trim().length > 100) {
    errors.push('Destination must be between 2 and 100 characters.');
  }

  // Budget validation
  const numBudget = Number(budget);
  if (budget === undefined || budget === null || isNaN(numBudget)) {
    errors.push('Total budget in INR is required.');
  } else if (numBudget < 500) {
    errors.push('Total budget must be at least ₹500 INR.');
  } else if (numBudget > 50000000) {
    errors.push('Total budget must not exceed ₹5,00,00,000 INR.');
  }

  // Days validation
  const numDays = Number(days);
  if (days === undefined || days === null || !Number.isInteger(numDays)) {
    errors.push('Number of days must be a whole integer.');
  } else if (numDays < 1 || numDays > 30) {
    errors.push('Trip duration must be between 1 and 30 days.');
  }

  // Travelers validation
  const numTravelers = Number(travelers);
  if (travelers === undefined || travelers === null || !Number.isInteger(numTravelers)) {
    errors.push('Number of travelers must be a whole integer.');
  } else if (numTravelers < 1 || numTravelers > 50) {
    errors.push('Number of travelers must be between 1 and 50 people.');
  }

  // Interests validation
  if (!Array.isArray(interests) || interests.length === 0) {
    errors.push('Please select at least one travel interest.');
  } else {
    const invalid = interests.filter((i) => !ALLOWED_INTERESTS.includes(i));
    if (invalid.length > 0) {
      errors.push(`Invalid interest(s) provided: ${invalid.join(', ')}. Allowed: ${ALLOWED_INTERESTS.join(', ')}.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      destination: destination ? destination.trim() : '',
      budget: Math.round(numBudget),
      days: numDays,
      travelers: numTravelers,
      interests: Array.isArray(interests) ? interests : [],
    },
  };
}

/**
 * Generate trip using sequential multi-agent workflow
 * POST /api/trip
 */
router.post('/trip', async (req, res) => {
  const startTime = Date.now();

  try {
    // 1. Validate the request
    const validation = validateTripRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(' '),
      });
    }

    const { destination, budget, days, travelers, interests } = validation.sanitized;
    console.log(`[TripMind] Starting Multi-Agent workflow for "${destination}" (${days} days, ${travelers} travelers, budget ₹${budget})`);

    // 2. Agent 1: Destination Agent
    console.log('[TripMind] 1/5 Executing Destination Agent...');
    const { places } = await runDestinationAgent({
      destination,
      days,
      travelers,
      interests,
    });

    // 3. Agent 2: Activity Agent
    console.log('[TripMind] 2/5 Executing Activity Agent...');
    const { dayPlans } = await runActivityAgent({
      destination,
      days,
      travelers,
      interests,
      places,
    });

    // 4. Agent 3: Restaurant Agent
    console.log('[TripMind] 3/5 Executing Restaurant Agent...');
    const { restaurants } = await runRestaurantAgent({
      destination,
      interests,
      budget,
      days,
      travelers,
      dayPlans,
    });

    // 5. Agent 4: Budget Agent
    console.log('[TripMind] 4/5 Executing Budget Agent...');
    const { budgetBreakdown, budgetStatus } = await runBudgetAgent({
      destination,
      budget,
      travelers,
      days,
      places,
      dayPlans,
      restaurants,
    });

    // 6. Agent 5: Itinerary Agent
    console.log('[TripMind] 5/5 Executing Itinerary Agent...');
    const itinerary = await runItineraryAgent({
      destination,
      days,
      travelers,
      budget,
      places,
      dayPlans,
      restaurants,
      budgetBreakdown,
    });

    // 7. Validate the final result and enforce mathematical precision
    const transportation = Math.max(0, Math.round(Number(budgetBreakdown.transportation) || 0));
    const food = Math.max(0, Math.round(Number(budgetBreakdown.food) || 0));
    const activitiesCost = Math.max(0, Math.round(Number(budgetBreakdown.activities) || 0));
    const other = Math.max(0, Math.round(Number(budgetBreakdown.other) || 0));
    const totalEstimatedCost = transportation + food + activitiesCost + other;
    const remainingBudget = budget - totalEstimatedCost;
    const isOverBudget = totalEstimatedCost > budget;
    const finalBudgetStatus = isOverBudget ? 'over_budget' : 'within_budget';

    const finalizedBudgetBreakdown = {
      ...budgetBreakdown,
      transportation,
      food,
      activities: activitiesCost,
      other,
      totalEstimatedCost,
      remainingBudget,
      isOverBudget,
      perPersonCost: Math.round(totalEstimatedCost / Math.max(1, travelers)),
    };

    console.log(`[TripMind] Multi-Agent plan synthesized successfully in ${((Date.now() - startTime) / 1000).toFixed(2)}s. Status: ${finalBudgetStatus}`);

    // 8. Return structured JSON to the frontend
    return res.status(200).json({
      success: true,
      destination,
      budget,
      days,
      travelers,
      places,
      restaurants,
      budgetBreakdown: finalizedBudgetBreakdown,
      itinerary,
      budgetStatus: finalBudgetStatus,
    });
  } catch (error) {
    console.error('[TripMind] Error during trip generation:', error);

    const statusCode = error.statusCode || 500;
    const errorMessage = error.isConfigError
      ? error.message
      : error.message || 'An unexpected error occurred while planning your trip. Please try again.';

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
});

export default router;
