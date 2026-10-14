/**
 * TripMind AI — Multi-Agent Travel Planner Frontend Logic
 * Strictly handles safe DOM manipulation, client validation, and async multi-agent UI updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = document.getElementById('tripPlannerForm');
  const destinationInput = document.getElementById('destinationInput');
  const budgetInput = document.getElementById('budgetInput');
  const daysInput = document.getElementById('daysInput');
  const travelersInput = document.getElementById('travelersInput');
  const generateBtn = document.getElementById('generateTripBtn');

  // Error spans
  const destinationError = document.getElementById('destinationError');
  const budgetError = document.getElementById('budgetError');
  const daysError = document.getElementById('daysError');
  const travelersError = document.getElementById('travelersError');
  const interestsError = document.getElementById('interestsError');

  // Error Alert Box
  const errorAlertBox = document.getElementById('errorAlertBox');
  const errorTitle = document.getElementById('errorTitle');
  const errorMessage = document.getElementById('errorMessage');
  const errorActionHint = document.getElementById('errorActionHint');
  const dismissErrorBtn = document.getElementById('dismissErrorBtn');

  // Progress Section
  const agentProgressSection = document.getElementById('agentProgressSection');
  const agentLiveStatusText = document.getElementById('agentLiveStatusText');
  const pipelineSteps = {
    dest: document.getElementById('step-dest'),
    act: document.getElementById('step-act'),
    rest: document.getElementById('step-rest'),
    budg: document.getElementById('step-budg'),
    itin: document.getElementById('step-itin'),
  };

  // Results Section
  const tripResultsSection = document.getElementById('tripResultsSection');
  const overviewDestination = document.getElementById('overviewDestination');
  const overviewDays = document.getElementById('overviewDays');
  const overviewTravelers = document.getElementById('overviewTravelers');
  const overviewBudget = document.getElementById('overviewBudget');
  const overviewEstimatedTotal = document.getElementById('overviewEstimatedTotal');
  const budgetStatusBadge = document.getElementById('budgetStatusBadge');

  // Budget Breakdown elements
  const budgetTransportAmount = document.getElementById('budgetTransportAmount');
  const budgetFoodAmount = document.getElementById('budgetFoodAmount');
  const budgetActivitiesAmount = document.getElementById('budgetActivitiesAmount');
  const budgetOtherAmount = document.getElementById('budgetOtherAmount');
  const summaryTotalCost = document.getElementById('summaryTotalCost');
  const summaryRemainingBudget = document.getElementById('summaryRemainingBudget');
  const summaryPerPerson = document.getElementById('summaryPerPerson');

  // Over budget alert elements
  const overBudgetAlertBanner = document.getElementById('overBudgetAlertBanner');
  const budgetAlertTitle = document.getElementById('budgetAlertTitle');
  const budgetAlertText = document.getElementById('budgetAlertText');
  const budgetAlternativesList = document.getElementById('budgetAlternativesList');

  // Containers
  const placesGridContainer = document.getElementById('placesGridContainer');
  const restaurantsGridContainer = document.getElementById('restaurantsGridContainer');
  const itineraryDaysContainer = document.getElementById('itineraryDaysContainer');

  // Interest Chips selection
  const interestChips = document.querySelectorAll('.interest-chip');
  interestChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const isCurrentlyActive = chip.classList.contains('active');
      chip.classList.toggle('active', !isCurrentlyActive);
      chip.setAttribute('aria-pressed', (!isCurrentlyActive).toString());
      validateInterests();
    });
  });

  // Dismiss Error Alert
  dismissErrorBtn.addEventListener('click', () => {
    errorAlertBox.classList.add('hidden');
  });

  // Real-time input validation listeners
  destinationInput.addEventListener('input', () => validateDestination());
  budgetInput.addEventListener('input', () => validateBudget());
  daysInput.addEventListener('input', () => validateDays());
  travelersInput.addEventListener('input', () => validateTravelers());

  function getSelectedInterests() {
    const selected = [];
    document.querySelectorAll('.interest-chip.active').forEach((chip) => {
      const val = chip.getAttribute('data-interest');
      if (val) selected.push(val);
    });
    return selected;
  }

  function validateDestination() {
    const val = destinationInput.value.trim();
    if (!val) {
      destinationError.textContent = 'Please enter a destination.';
      return false;
    }
    if (val.length < 2) {
      destinationError.textContent = 'Destination name is too short (min 2 characters).';
      return false;
    }
    destinationError.textContent = '';
    return true;
  }

  function validateBudget() {
    const val = Number(budgetInput.value);
    if (!budgetInput.value || isNaN(val) || val <= 0) {
      budgetError.textContent = 'Please enter a positive budget in INR.';
      return false;
    }
    if (val < 500) {
      budgetError.textContent = 'Minimum budget should be at least ₹500.';
      return false;
    }
    if (val > 50000000) {
      budgetError.textContent = 'Budget exceeds maximum limit of ₹5,00,00,000.';
      return false;
    }
    budgetError.textContent = '';
    return true;
  }

  function validateDays() {
    const val = Number(daysInput.value);
    if (!daysInput.value || !Number.isInteger(val) || val <= 0) {
      daysError.textContent = 'Please enter a valid whole number of days.';
      return false;
    }
    if (val < 1 || val > 30) {
      daysError.textContent = 'Trip duration must be between 1 and 30 days.';
      return false;
    }
    daysError.textContent = '';
    return true;
  }

  function validateTravelers() {
    const val = Number(travelersInput.value);
    if (!travelersInput.value || !Number.isInteger(val) || val <= 0) {
      travelersError.textContent = 'Please enter the number of travelers.';
      return false;
    }
    if (val < 1 || val > 50) {
      travelersError.textContent = 'Travelers count must be between 1 and 50.';
      return false;
    }
    travelersError.textContent = '';
    return true;
  }

  function validateInterests() {
    const selected = getSelectedInterests();
    if (selected.length === 0) {
      interestsError.textContent = 'Please select at least one travel interest.';
      return false;
    }
    interestsError.textContent = '';
    return true;
  }

  function validateForm() {
    const isDestValid = validateDestination();
    const isBudgetValid = validateBudget();
    const isDaysValid = validateDays();
    const isTravelersValid = validateTravelers();
    const isInterestsValid = validateInterests();
    return isDestValid && isBudgetValid && isDaysValid && isTravelersValid && isInterestsValid;
  }

  function showError(title, message, actionHint = '') {
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    errorActionHint.textContent = actionHint;
    errorAlertBox.classList.remove('hidden');
    errorAlertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideError() {
    errorAlertBox.classList.add('hidden');
  }

  let progressInterval = null;

  function startProgressAnimation() {
    agentProgressSection.classList.remove('hidden');
    tripResultsSection.classList.add('hidden');
    hideError();

    // Reset steps
    Object.values(pipelineSteps).forEach((el) => {
      el.className = 'pipeline-step';
      el.querySelector('.step-status').textContent = 'Pending';
    });

    const steps = [
      { key: 'dest', label: 'Destination Agent', status: 'Curating attractions...', text: '1/5 Destination Agent researching top sights...' },
      { key: 'act', label: 'Activity Agent', status: 'Scheduling zones...', text: '2/5 Activity Agent grouping areas & pacing schedule...' },
      { key: 'rest', label: 'Restaurant Agent', status: 'Finding authentic eateries...', text: '3/5 Restaurant Agent selecting regional dining...' },
      { key: 'budg', label: 'Budget Agent', status: 'Calculating costs...', text: '4/5 Budget Agent validating expenses & feasibility...' },
      { key: 'itin', label: 'Itinerary Agent', status: 'Synthesizing itinerary...', text: '5/5 Itinerary Agent assembling final plan...' },
    ];

    let currentStepIndex = 0;
    function updateStep() {
      if (currentStepIndex < steps.length) {
        const s = steps[currentStepIndex];
        agentLiveStatusText.textContent = s.text;
        const stepEl = pipelineSteps[s.key];
        if (stepEl) {
          stepEl.className = 'pipeline-step active';
          stepEl.querySelector('.step-status').textContent = s.status;
        }

        // Mark previous step completed
        if (currentStepIndex > 0) {
          const prevKey = steps[currentStepIndex - 1].key;
          const prevEl = pipelineSteps[prevKey];
          if (prevEl) {
            prevEl.className = 'pipeline-step completed';
            prevEl.querySelector('.step-status').textContent = 'Completed';
          }
        }
        currentStepIndex++;
      }
    }

    updateStep();
    progressInterval = setInterval(updateStep, 2400);
  }

  function stopProgressAnimation(isSuccess = true) {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }

    if (isSuccess) {
      Object.values(pipelineSteps).forEach((el) => {
        el.className = 'pipeline-step completed';
        el.querySelector('.step-status').textContent = 'Completed';
      });
      setTimeout(() => {
        agentProgressSection.classList.add('hidden');
      }, 500);
    } else {
      agentProgressSection.classList.add('hidden');
    }
  }

  // Currency Formatter Helper
  function formatINR(amount) {
    const num = Number(amount) || 0;
    return '₹' + num.toLocaleString('en-IN');
  }

  // Safe Rendering of Results
  function renderTripResults(data) {
    const { destination, budget, days, travelers, places, restaurants, budgetBreakdown, itinerary, budgetStatus } = data;

    // A. Overview
    overviewDestination.textContent = destination;
    overviewDays.textContent = `${days} Day${days > 1 ? 's' : ''}`;
    overviewTravelers.textContent = `${travelers} Traveler${travelers > 1 ? 's' : ''}`;
    overviewBudget.textContent = formatINR(budget);
    overviewEstimatedTotal.textContent = formatINR(budgetBreakdown.totalEstimatedCost);

    if (budgetStatus === 'over_budget' || budgetBreakdown.isOverBudget) {
      budgetStatusBadge.className = 'status-badge badge-alert';
      budgetStatusBadge.textContent = '⚠️ Budget Alert';
    } else {
      budgetStatusBadge.className = 'status-badge badge-green';
      budgetStatusBadge.textContent = '✓ Within Budget';
    }

    // D. Budget Breakdown
    budgetTransportAmount.textContent = formatINR(budgetBreakdown.transportation);
    budgetFoodAmount.textContent = formatINR(budgetBreakdown.food);
    budgetActivitiesAmount.textContent = formatINR(budgetBreakdown.activities);
    budgetOtherAmount.textContent = formatINR(budgetBreakdown.other);

    summaryTotalCost.textContent = formatINR(budgetBreakdown.totalEstimatedCost);
    summaryRemainingBudget.textContent = formatINR(budgetBreakdown.remainingBudget);
    summaryPerPerson.textContent = formatINR(budgetBreakdown.perPersonCost);

    // Over-budget banner handling
    if (budgetBreakdown.isOverBudget) {
      overBudgetAlertBanner.classList.remove('hidden');
      budgetAlertText.textContent = budgetBreakdown.budgetWarning || 'The estimated cost exceeds the allocated budget.';

      // Clear & populate alternatives
      budgetAlternativesList.innerHTML = '';
      const alts = Array.isArray(budgetBreakdown.suggestedAlternatives) ? budgetBreakdown.suggestedAlternatives : [];
      alts.forEach((alt) => {
        const li = document.createElement('li');
        li.textContent = alt;
        budgetAlternativesList.appendChild(li);
      });
    } else {
      overBudgetAlertBanner.classList.add('hidden');
    }

    // B. Recommended Places
    placesGridContainer.innerHTML = '';
    (places || []).forEach((p) => {
      const card = document.createElement('div');
      card.className = 'place-card';

      const top = document.createElement('div');
      top.className = 'place-top';

      const catBadge = document.createElement('span');
      catBadge.className = 'place-cat-badge';
      catBadge.textContent = p.category || 'Attraction';

      const nameEl = document.createElement('h4');
      nameEl.className = 'place-name';
      nameEl.textContent = p.name;

      const descEl = document.createElement('p');
      descEl.className = 'place-desc';
      descEl.textContent = p.description;

      top.appendChild(catBadge);
      top.appendChild(nameEl);
      top.appendChild(descEl);

      const bottom = document.createElement('div');
      bottom.className = 'place-bottom';

      const durEl = document.createElement('span');
      durEl.className = 'place-duration';
      durEl.textContent = `⏱️ ${p.estimatedDuration}`;

      const costEl = document.createElement('span');
      costEl.className = 'place-cost';
      costEl.textContent = p.estimatedEntryCostPerGroup > 0 ? `Est. Entry: ${formatINR(p.estimatedEntryCostPerGroup)}` : 'Free Entry';

      bottom.appendChild(durEl);
      bottom.appendChild(costEl);

      card.appendChild(top);
      card.appendChild(bottom);
      placesGridContainer.appendChild(card);
    });

    // C. Restaurants
    restaurantsGridContainer.innerHTML = '';
    (restaurants || []).forEach((r) => {
      const card = document.createElement('div');
      card.className = 'restaurant-card';

      const top = document.createElement('div');
      top.className = 'restaurant-top';

      const meta = document.createElement('div');
      meta.className = 'restaurant-meta';

      const cuisineBadge = document.createElement('span');
      cuisineBadge.className = 'restaurant-cuisine';
      cuisineBadge.textContent = r.cuisine || 'Local';

      const mealBadge = document.createElement('span');
      mealBadge.className = 'restaurant-mealtype';
      mealBadge.textContent = r.mealType || 'Dining';

      meta.appendChild(cuisineBadge);
      meta.appendChild(mealBadge);

      const nameEl = document.createElement('h4');
      nameEl.className = 'restaurant-name';
      nameEl.textContent = r.name;

      const descEl = document.createElement('p');
      descEl.className = 'restaurant-desc';
      descEl.textContent = r.description;

      top.appendChild(meta);
      top.appendChild(nameEl);
      top.appendChild(descEl);

      const bottom = document.createElement('div');
      bottom.className = 'restaurant-bottom';

      const zoneEl = document.createElement('span');
      zoneEl.className = 'restaurant-zone';
      zoneEl.textContent = `📍 ${r.areaOrZone || destination}`;

      const costEl = document.createElement('span');
      costEl.className = 'restaurant-cost';
      costEl.textContent = `Est. ${formatINR(r.estimatedCostPerPerson)} / person`;

      bottom.appendChild(zoneEl);
      bottom.appendChild(costEl);

      card.appendChild(top);
      card.appendChild(bottom);
      restaurantsGridContainer.appendChild(card);
    });

    // E. Day-by-Day Itinerary
    itineraryDaysContainer.innerHTML = '';
    (itinerary || []).forEach((dayItem) => {
      const dayCard = document.createElement('div');
      dayCard.className = 'day-card';

      // Header
      const header = document.createElement('div');
      header.className = 'day-header';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'day-title-wrap';

      const badge = document.createElement('span');
      badge.className = 'day-badge';
      badge.textContent = `Day ${dayItem.day}`;

      const title = document.createElement('h4');
      title.className = 'day-title';
      title.textContent = dayItem.title;

      titleWrap.appendChild(badge);
      titleWrap.appendChild(title);
      header.appendChild(titleWrap);
      dayCard.appendChild(header);

      // Daily Tip
      if (dayItem.dailyTips) {
        const tipBanner = document.createElement('div');
        tipBanner.className = 'day-tip-banner';
        tipBanner.textContent = `💡 Tip: ${dayItem.dailyTips}`;
        dayCard.appendChild(tipBanner);
      }

      // Schedule Timeline
      const timeline = document.createElement('div');
      timeline.className = 'schedule-timeline';

      (dayItem.schedule || []).forEach((event) => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const timeEl = document.createElement('span');
        timeEl.className = 'timeline-time';
        timeEl.textContent = event.time;

        const content = document.createElement('div');
        content.className = 'timeline-content';

        const actEl = document.createElement('div');
        actEl.className = 'timeline-activity';
        actEl.textContent = event.activity;

        const locEl = document.createElement('div');
        locEl.className = 'timeline-location';
        locEl.textContent = `📍 ${event.location}`;

        content.appendChild(actEl);
        content.appendChild(locEl);

        if (event.suggestedMeal) {
          const mealEl = document.createElement('div');
          mealEl.className = 'timeline-meal';
          mealEl.textContent = `🍴 ${event.suggestedMeal}`;
          content.appendChild(mealEl);
        }

        const costEl = document.createElement('span');
        costEl.className = 'timeline-cost';
        costEl.textContent = event.cost > 0 ? `Est. ${formatINR(event.cost)}` : 'Free';

        item.appendChild(timeEl);
        item.appendChild(content);
        item.appendChild(costEl);

        timeline.appendChild(item);
      });

      dayCard.appendChild(timeline);
      itineraryDaysContainer.appendChild(dayCard);
    });

    // Reveal results and scroll smoothly
    tripResultsSection.classList.remove('hidden');
    tripResultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      destination: destinationInput.value.trim(),
      budget: Number(budgetInput.value),
      days: Number(daysInput.value),
      travelers: Number(travelersInput.value),
      interests: getSelectedInterests(),
    };

    // UI state: loading
    generateBtn.disabled = true;
    generateBtn.querySelector('.btn-text').textContent = 'Generating Plan...';
    startProgressAnimation();

    try {
      const response = await fetch('/api/trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Server responded with status ${response.status}`);
      }

      stopProgressAnimation(true);
      renderTripResults(result);
    } catch (err) {
      stopProgressAnimation(false);
      console.error('[TripMind] Generation failed:', err);

      let hint = 'Please check your inputs and try again.';
      if (err.message.includes('GEMINI_API_KEY')) {
        hint = 'Setup Note: Add your GEMINI_API_KEY in the backend/.env file and restart the server.';
      } else if (err.message.includes('quota') || err.message.includes('rate limit')) {
        hint = 'Please wait 30 seconds before submitting another request.';
      }

      showError('Trip Generation Failed', err.message, hint);
    } finally {
      generateBtn.disabled = false;
      generateBtn.querySelector('.btn-text').textContent = 'Generate My Trip';
    }
  });
});
