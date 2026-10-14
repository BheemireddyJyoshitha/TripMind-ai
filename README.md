# TripMind AI – Multi-Agent Travel Planner

An AI-powered travel planning web application that helps users create personalized travel itineraries based on their destination, budget, trip duration, number of travelers, and interests.

## 🌍 Live Demo

**Live Website:** https://tripmind-ai-rvnx.onrender.com/

**GitHub Repository:** https://github.com/BheemireddyJyoshitha/TripMind-ai

## ✨ Features

- Personalized travel itinerary generation
- Multi-agent AI workflow
- Destination recommendations
- Activity and sightseeing suggestions
- Restaurant recommendations
- Budget estimation and breakdown
- Day-wise itinerary planning
- Simple and user-friendly interface

## 🛠️ Tech Stack

**Frontend**
- HTML
- CSS
- JavaScript

**Backend**
- Node.js
- Express.js

**AI Integration**
- Google Gemini API

**Deployment and Version Control**
- Render
- Git and GitHub

## 🤖 Multi-Agent Architecture

TripMind AI uses five specialized agents to organize travel planning:

1. **Destination Agent** – Helps with destination-related recommendations.
2. **Activity Agent** – Suggests activities and attractions.
3. **Restaurant Agent** – Recommends dining options.
4. **Budget Agent** – Estimates trip expenses.
5. **Itinerary Agent** – Organizes the trip into a structured plan.

## ⚙️ Run Locally

### Prerequisites
- Node.js 18 or later
- npm
- Google Gemini API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/BheemireddyJyoshitha/TripMind-ai.git
   cd TripMind-ai
   ```

2. Install backend dependencies:

   ```bash
   npm install --prefix backend
   ```

3. Create a `backend/.env` file and add your API key:

   ```env
   GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=your_working_model_name
   ```

   Replace the placeholder with your own API key and the Gemini model configured for your application. Never commit your real API key to GitHub.

4. Start the backend:

   ```bash
   npm start --prefix backend
   ```

5. Open the application using the local URL configured by your backend.

## 🔐 Security

- Keep API keys in environment variables.
- Do not commit `.env` files or other secrets.
- Configure production environment variables through your hosting provider.

## 🎯 Project Objective

The goal of TripMind AI is to simplify travel planning by combining specialized AI tasks into a single workflow that produces a personalized itinerary and estimated travel budget.

## 👩‍💻 Author

**Your Name**

[GitHub Profile](https://github.com/BheemireddyJyoshitha)

## 📌 Future Enhancements

- Weather-based recommendations
- Interactive maps and route planning
- Hotel and transport recommendations
- Downloadable itineraries
- User accounts and saved trips
