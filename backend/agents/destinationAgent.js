import { aiService } from '../services/aiService.js';

const destinationSchema = {
  type: 'object',
  properties: {
    places: {
      type: 'array',
      description: 'List of recommended places to visit',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the place or attraction' },
          description: { type: 'string', description: 'Short compelling description' },
          category: { type: 'string', description: 'e.g. Historical, Beach, Nature, Culture, Adventure' },
          estimatedDuration: { type: 'string', description: 'e.g. 2 hours, Half day' },
          estimatedEntryCostPerGroup: {
            type: 'number',
            description: 'Estimated total entry cost for the entire group in INR (0 if free)',
          },
        },
        required: ['name', 'description', 'category', 'estimatedDuration', 'estimatedEntryCostPerGroup'],
      },
    },
    destinationSummary: {
      type: 'string',
      description: 'Brief overview of why this destination fits the traveler preferences',
    },
  },
  required: ['places'],
};

/**
 * Agent 1: Destination Agent
 * Identifies suitable tourist attractions and recommendations for the destination.
 */
export async function runDestinationAgent({ destination, days, travelers, interests }) {
  const systemInstruction = `You are the Destination Agent for TripMind AI.
Your responsibility:
- Identify suitable tourist attractions and landmarks for the destination.
- Tailor recommendations to trip duration (${days} days), traveler group size (${travelers} travelers), and interests (${interests.join(', ')}).
- Provide short, informative descriptions and realistic visit durations.
- Estimate total entry fees for the group in INR (0 if free public attraction).
- Ensure places are real, well-known, and avoid duplicates.
Return structured JSON only matching the schema.`;

  const prompt = `Plan recommendations for:
Destination: ${destination}
Duration: ${days} days
Travelers: ${travelers} people
Interests: ${interests.join(', ')}

Please recommend 4 to 8 top distinct places that suit this trip.`;

  const result = await aiService.generateStructuredJSON({
    systemInstruction,
    prompt,
    schema: destinationSchema,
    agentName: 'Destination Agent',
  });

  // Sanitize and validate places
  const rawPlaces = Array.isArray(result.places) ? result.places : [];
  const places = rawPlaces.map((p, idx) => ({
    id: `place-${idx + 1}`,
    name: String(p.name || `Attraction ${idx + 1}`).trim(),
    description: String(p.description || 'Popular local attraction.').trim(),
    category: String(p.category || 'Sightseeing').trim(),
    estimatedDuration: String(p.estimatedDuration || '2 hours').trim(),
    estimatedEntryCostPerGroup: Math.max(0, Math.round(Number(p.estimatedEntryCostPerGroup) || 0)),
  }));

  if (places.length === 0) {
    throw new Error('Destination Agent was unable to find places matching the criteria.');
  }

  return {
    places,
    destinationSummary: result.destinationSummary || `Curated places for your trip to ${destination}.`,
  };
}
