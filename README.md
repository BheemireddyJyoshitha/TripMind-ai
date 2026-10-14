# TripMind AI — Multi-Agent Travel Planner

**TripMind AI** is a full-stack, AI-driven travel planning web application. Given a user's destination, budget, duration, group size, and travel interests, a collaborative pipeline of five specialized AI agents plans a personalized trip complete with top attractions, restaurant guides, budget validation, and a realistic day-by-day itinerary.

---

## 🌟 Key Features & Multi-Agent Architecture

The core workflow executes sequentially across five modular AI agents:

1. **Destination Agent (`backend/agents/destinationAgent.js`)**
   - Researches and curates top attractions, landmarks, and sights matching traveler preferences and group size.
   - Provides visit duration estimates and group entry fees.
2. **Activity Agent (`backend/agents/activityAgent.js`)**
   - Organizes attractions geographically into zones to minimize transit time.
   - Schedules a realistic daily pace (2–3 main activities per day with rest periods).
3. **Restaurant Agent (`backend/agents/restaurantAgent.js`)**
   - Recommends authentic dining spots, cafes, and local eateries close to the planned daily zones.
   - Estimates meal prices per person in INR.
4. **Budget Agent (`backend/agents/budgetAgent.js`)**
   - Categorizes expenses into Transportation, Food, Activities, and Miscellaneous.
   - Enforces deterministic mathematical calculations for totals.
   - Detects over-budget trips honestly and recommends actionable cost-saving alternatives.
5. **Itinerary Agent (`backend/agents/itineraryAgent.js`)**
   - Synthesizes all findings into a coherent, time-stamped day-by-day itinerary with meals and tips.

---

## 🛠️ Technology Stack

- **Frontend:**
  - Semantic HTML5
  - Modern Vanilla CSS3 (Custom design system: warm off-white canvas, deep forest-green primary, golden accents)
  - Vanilla JavaScript (Safe DOM APIs, client-side validation, live agent pipeline animation)
- **Backend:**
  - Node.js (v20+ supported; tested on Node v25)
  - Express.js
  - CORS & Dotenv
- **AI Integration:**
  - Official `@google/genai` SDK
  - Model: Google Gemini (`gemini-3.8-flash`)
  - Structured JSON Output schemas

---

## 📁 Project Structure

```
tripmind-ai/
├── frontend/
│   ├── index.html         # Single-page responsive travel planner interface
│   ├── style.css          # Design system, cards, animations & typography
│   └── script.js          # Form handling, validation, pipeline UI & DOM rendering
├── backend/
│   ├── server.js          # Express server & static asset host
│   ├── routes/
│   │   └── tripRoutes.js  # Orchestration, validation & /api/trip endpoints
│   ├── agents/
│   │   ├── destinationAgent.js  # Agent 1: Tourist attractions & sights
│   │   ├── activityAgent.js     # Agent 2: Geographic zones & pacing
│   │   ├── restaurantAgent.js   # Agent 3: Dining & regional food options
│   │   ├── budgetAgent.js       # Agent 4: Categorized expenses & validation
│   │   └── itineraryAgent.js    # Agent 5: Synthesis of chronological itinerary
│   ├── services/
│   │   └── aiService.js   # Official Google Gen AI SDK wrapper & error handler
│   ├── package.json       # Backend dependencies & scripts
│   └── .env.example       # Template environment variables
├── .gitignore             # Git ignore rules for node_modules and .env
├── package.json           # Root convenience scripts
└── README.md              # Documentation & setup guide
```

---

## 📋 Prerequisites

- **Node.js** (v18.0.0 or higher, v20+ recommended)
- **npm** (v9.0.0 or higher)
- A **Google Gemini API Key** (obtainable from [Google AI Studio](https://aistudio.google.com/))

---

## 🚀 Installation & Setup

### 1. Clone or Open Workspace
Navigate to the project root directory:
```bash
cd TravelMind
```

### 2. Install Dependencies
You can install dependencies from the root directory or inside `backend/`:

**From workspace root:**
```bash
npm run install:backend
```
*Or directly inside `backend/`:*
```bash
cd backend
npm install
cd ..
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` inside the `backend/` directory:

```bash
# On Windows PowerShell:
Copy-Item backend/.env.example backend/.env

# On Linux / macOS / Bash:
cp backend/.env.example backend/.env
```

Open `backend/.env` in any text editor and add your Google Gemini API key:
```env
PORT=5000
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```

> ⚠️ **Security Note:** Never commit your `.env` file or API key to version control. The `.gitignore` file is configured to exclude all `.env` files.

---

## 🖥️ Running the Application

### Option A: From Workspace Root
```bash
npm start
```

### Option B: From `backend/` Directory
```bash
cd backend
npm start
```

### Option C: Development Mode (Auto-reload on file changes)
```bash
npm run dev
```

The Express server will boot up and serve both the API and the frontend:
- **Web Application:** [http://localhost:5000](http://localhost:5000)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

Open [http://localhost:5000](http://localhost:5000) in your web browser.

---

## 🔌 API Reference

### 1. Health Check
- **Endpoint:** `GET /api/health`
- **Response:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-14T14:50:00.000Z",
    "apiKeyConfigured": true
  }
  ```

### 2. Generate Trip Plan
- **Endpoint:** `POST /api/trip`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "destination": "Goa",
    "budget": 25000,
    "days": 4,
    "travelers": 2,
    "interests": ["Beaches", "Food", "Nature"]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "destination": "Goa",
    "budget": 25000,
    "days": 4,
    "travelers": 2,
    "places": [
      {
        "id": "place-1",
        "name": "Fort Aguada",
        "description": "17th-century Portuguese lighthouse and fort overlooking the Arabian Sea.",
        "category": "Historical",
        "estimatedDuration": "2 hours",
        "estimatedEntryCostPerGroup": 200
      }
    ],
    "restaurants": [
      {
        "id": "restaurant-1",
        "name": "Vinayak Family Restaurant",
        "cuisine": "Goan Seafood & Thali",
        "description": "Renowned for authentic Goan fish curry thali.",
        "mealType": "Lunch",
        "estimatedCostPerPerson": 350,
        "areaOrZone": "Assagao"
      }
    ],
    "budgetBreakdown": {
      "transportation": 4000,
      "food": 10500,
      "activities": 1800,
      "other": 1500,
      "totalEstimatedCost": 17800,
      "remainingBudget": 7200,
      "isOverBudget": false,
      "perPersonCost": 8900,
      "notes": "Estimates based on current regional rates."
    },
    "itinerary": [
      {
        "day": 1,
        "title": "Day 1: North Goa Coast & Sunset Fort",
        "schedule": [
          {
            "time": "09:30 AM - 12:00 PM",
            "activity": "Explore Fort Aguada ramparts",
            "location": "Sinquerim",
            "cost": 200,
            "suggestedMeal": "Breakfast at local bakery"
          }
        ],
        "dailyTips": "Carry sunscreen and bottled water."
      }
    ],
    "budgetStatus": "within_budget"
  }
  ```

---

## 🧪 Testing the Application

### 1. Test Server Startup & Health
In your terminal:
```bash
curl http://localhost:5000/api/health
```

### 2. Test Input Validation
Send an invalid payload (missing destination or negative budget):
```bash
curl -X POST http://localhost:5000/api/trip \
  -H "Content-Type: application/json" \
  -d '{"destination":"","budget":-100,"days":0,"travelers":0,"interests":[]}'
```
Response will be HTTP 400 with detailed validation messages.

### 3. Test Full Multi-Agent Workflow
Once `GEMINI_API_KEY` is provided in `backend/.env`:
```bash
curl -X POST http://localhost:5000/api/trip \
  -H "Content-Type: application/json" \
  -d '{"destination":"Jaipur","budget":20000,"days":3,"travelers":2,"interests":["History","Culture","Food"]}'
```

---

## 🛠️ Common Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `GEMINI_API_KEY is not configured...` | Missing `.env` file or empty key | Copy `backend/.env.example` to `backend/.env` and paste your key. Restart the server. |
| `API key not valid` (HTTP 401) | The Gemini key in `backend/.env` is misspelled or deactivated | Verify your key in [Google AI Studio](https://aistudio.google.com/) and update `backend/.env`. |
| `Port 5000 is already in use` | Another process is using port 5000 | Change `PORT=5001` in `backend/.env`. |
| `Rate limit / quota exceeded` (HTTP 429) | Too many requests in a short duration | Free-tier Gemini keys have per-minute limits; wait 30 seconds and retry. |

---

## 🌐 Deploying on Render

TripMind AI is ready for deployment on [Render](https://render.com) as a Node Web Service.

### Step-by-Step Render Deployment:

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: complete TripMind AI with Render deployment config"
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```
   *(Note: Your `.env` file is gitignored and will never be pushed).*

2. **Create a New Web Service on Render:**
   - Log in to [dashboard.render.com](https://dashboard.render.com/).
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository.

3. **Configure the Service Settings:**
   - **Name:** `tripmind-ai` (or your chosen name)
   - **Region:** Choose the region closest to you (e.g., Singapore, Frankfurt, Oregon)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank for repository root)*
   - **Runtime:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

4. **Add Environment Variables (in Render Dashboard):**
   Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: `<Your real Google Gemini API key>`
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite`
   - `NODE_VERSION`: `20` *(recommended)*

   *(Note: Render automatically sets `PORT`, and Express dynamically listens on it and binds to `0.0.0.0`).*

5. **Optional Health Check Path:**
   - In **Advanced Settings**, set **Health Check Path** to: `/api/health`

6. **Deploy:**
   - Click **Create Web Service**.
   - Once deployed, Render will provide a public URL like `https://tripmind-ai.onrender.com`.

---

## 📄 License
MIT License. Built for travel enthusiasts and AI developers.

