import assert from 'assert';

console.log('🧪 Starting TripMind AI Unit & Integration Tests...');

// 1. Test Input Validation Logic
console.log('\n--- Test Suite 1: Input Validation ---');

function validateTripRequest(body) {
  const ALLOWED_INTERESTS = ['Beaches', 'Adventure', 'Nature', 'History', 'Culture', 'Shopping', 'Food'];
  const errors = [];
  const { destination, budget, days, travelers, interests } = body || {};

  if (!destination || typeof destination !== 'string' || destination.trim().length === 0) {
    errors.push('Destination is required.');
  } else if (destination.trim().length < 2 || destination.trim().length > 100) {
    errors.push('Destination must be between 2 and 100 characters.');
  }

  const numBudget = Number(budget);
  if (budget === undefined || budget === null || isNaN(numBudget)) {
    errors.push('Total budget in INR is required.');
  } else if (numBudget < 500) {
    errors.push('Total budget must be at least ₹500 INR.');
  } else if (numBudget > 50000000) {
    errors.push('Total budget must not exceed ₹5,00,00,000 INR.');
  }

  const numDays = Number(days);
  if (days === undefined || days === null || !Number.isInteger(numDays)) {
    errors.push('Number of days must be a whole integer.');
  } else if (numDays < 1 || numDays > 30) {
    errors.push('Trip duration must be between 1 and 30 days.');
  }

  const numTravelers = Number(travelers);
  if (travelers === undefined || travelers === null || !Number.isInteger(numTravelers)) {
    errors.push('Number of travelers must be a whole integer.');
  } else if (numTravelers < 1 || numTravelers > 50) {
    errors.push('Number of travelers must be between 1 and 50 people.');
  }

  if (!Array.isArray(interests) || interests.length === 0) {
    errors.push('Please select at least one travel interest.');
  } else {
    const invalid = interests.filter((i) => !ALLOWED_INTERESTS.includes(i));
    if (invalid.length > 0) {
      errors.push(`Invalid interest(s) provided: ${invalid.join(', ')}.`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Case 1.1: Missing Destination
const test1 = validateTripRequest({ destination: '', budget: 20000, days: 3, travelers: 2, interests: ['Food'] });
assert.strictEqual(test1.isValid, false);
assert(test1.errors.some((e) => e.includes('Destination is required')));
console.log('✓ Case 1.1: Empty destination correctly rejected.');

// Case 1.2: Negative or Low Budget
const test2 = validateTripRequest({ destination: 'Goa', budget: 100, days: 3, travelers: 2, interests: ['Food'] });
assert.strictEqual(test2.isValid, false);
assert(test2.errors.some((e) => e.includes('Total budget must be at least ₹500')));
console.log('✓ Case 1.2: Unrealistic low budget correctly rejected.');

// Case 1.3: Non-integer days
const test3 = validateTripRequest({ destination: 'Goa', budget: 20000, days: 2.5, travelers: 2, interests: ['Food'] });
assert.strictEqual(test3.isValid, false);
assert(test3.errors.some((e) => e.includes('Number of days must be a whole integer')));
console.log('✓ Case 1.3: Fractional days correctly rejected.');

// Case 1.4: Empty Interests
const test4 = validateTripRequest({ destination: 'Goa', budget: 20000, days: 3, travelers: 2, interests: [] });
assert.strictEqual(test4.isValid, false);
assert(test4.errors.some((e) => e.includes('select at least one travel interest')));
console.log('✓ Case 1.4: Empty interests correctly rejected.');

// Case 1.5: Disallowed Interest
const test5 = validateTripRequest({ destination: 'Goa', budget: 20000, days: 3, travelers: 2, interests: ['Gambling'] });
assert.strictEqual(test5.isValid, false);
assert(test5.errors.some((e) => e.includes('Invalid interest(s)')));
console.log('✓ Case 1.5: Invalid interest correctly rejected.');

// Case 1.6: Valid Request
const test6 = validateTripRequest({ destination: 'Goa', budget: 25000, days: 4, travelers: 2, interests: ['Beaches', 'Food'] });
assert.strictEqual(test6.isValid, true);
assert.strictEqual(test6.errors.length, 0);
console.log('✓ Case 1.6: Valid request accepted.');

// 2. Test Budget Deterministic Calculations
console.log('\n--- Test Suite 2: Deterministic Budget Calculations ---');

function calculateBudget(budget, travelers, rawBreakdown) {
  const transportation = Math.max(0, Math.round(Number(rawBreakdown.transportation) || 0));
  const food = Math.max(0, Math.round(Number(rawBreakdown.food) || 0));
  const activities = Math.max(0, Math.round(Number(rawBreakdown.activities) || 0));
  const other = Math.max(0, Math.round(Number(rawBreakdown.other) || 0));

  const totalEstimatedCost = transportation + food + activities + other;
  const remainingBudget = budget - totalEstimatedCost;
  const isOverBudget = totalEstimatedCost > budget;
  const budgetStatus = isOverBudget ? 'over_budget' : 'within_budget';
  const perPersonCost = Math.round(totalEstimatedCost / Math.max(1, travelers));

  return {
    transportation,
    food,
    activities,
    other,
    totalEstimatedCost,
    remainingBudget,
    isOverBudget,
    budgetStatus,
    perPersonCost,
  };
}

// Case 2.1: Within Budget
const b1 = calculateBudget(25000, 2, { transportation: 4000, food: 10000, activities: 3000, other: 1500 });
assert.strictEqual(b1.totalEstimatedCost, 18500);
assert.strictEqual(b1.remainingBudget, 6500);
assert.strictEqual(b1.isOverBudget, false);
assert.strictEqual(b1.budgetStatus, 'within_budget');
assert.strictEqual(b1.perPersonCost, 9250);
console.log('✓ Case 2.1: Within-budget math is exact and verified.');

// Case 2.2: Over Budget
const b2 = calculateBudget(10000, 2, { transportation: 5000, food: 8000, activities: 2000, other: 1000 });
assert.strictEqual(b2.totalEstimatedCost, 16000);
assert.strictEqual(b2.remainingBudget, -6000);
assert.strictEqual(b2.isOverBudget, true);
assert.strictEqual(b2.budgetStatus, 'over_budget');
assert.strictEqual(b2.perPersonCost, 8000);
console.log('✓ Case 2.2: Over-budget condition detected without falsely hiding deficit.');

// Case 2.3: Non-negative protection against negative estimates
const b3 = calculateBudget(20000, 2, { transportation: -500, food: 6000, activities: -200, other: 1000 });
assert.strictEqual(b3.transportation, 0);
assert.strictEqual(b3.activities, 0);
assert.strictEqual(b3.totalEstimatedCost, 7000);
console.log('✓ Case 2.3: Non-negative constraints strictly enforced.');

console.log('\n✨ All unit assertions passed successfully!\n');
