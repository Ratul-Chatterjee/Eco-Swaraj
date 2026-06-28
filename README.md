# Eco-Swaraj

Eco-Swaraj is a web application designed to help people in India understand their carbon footprint and take practical steps toward a more sustainable lifestyle. The platform combines carbon tracking, local environmental insights, and a gamified eco-city experience to make sustainability engaging and easy to follow.

---

## What is this web app about?

Eco-Swaraj is built to turn climate awareness into a simple, interactive experience. Users can:

- calculate their estimated carbon footprint based on lifestyle choices,
- explore how their habits affect emissions,
- track daily sustainability actions,
- build and upgrade a virtual eco-city using rewards earned from real-world green actions,
- participate in a community space for sharing progress and learning.

---

## Problem Statement

Many people want to reduce their environmental impact, but they often struggle with:

- limited awareness of how everyday actions contribute to carbon emissions,
- lack of personalized tools tailored to Indian households and cities,
- difficulty staying motivated without clear feedback or rewards,
- limited access to local, easy-to-understand environmental insights.

Eco-Swaraj addresses these challenges by combining data, education, and motivation in one platform.

---

## Goal of the Project

The main goal of Eco-Swaraj is to encourage sustainable behavior by helping users:

- understand their carbon footprint in a simple and relatable way,
- make informed choices about energy, travel, food, and waste,
- stay engaged through daily tasks, progress tracking, and rewards,
- build awareness around environmental responsibility in a fun and interactive format.

---

## Key Features

- **Onboarding Carbon Calculator** for estimating annual footprint
- **Location-based environmental insights** for Indian cities and states
- **Daily eco-actions tracker** with points and streaks
- **Gamified eco-city builder** to reward sustainable behavior
- **Community activity section** for posts, comments, and engagement
- **Keyword Reward System** — posts containing eco-relevant keywords in a meaningful context earn 10 EP + 10 XP per keyword

---

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Styling:** Custom CSS with a modern glassmorphism-inspired UI
- **Authentication:** Firebase Authentication
- **Database:** Firebase Firestore
- **APIs/Insights:** Open-Meteo air quality data and live carbon analytics integration

---

## How the App Works

1. **User signs up and completes the onboarding calculator**
2. **The app estimates the user’s carbon footprint** based on their inputs
3. **Users log sustainable actions** to earn rewards and improve their progress
4. **The dashboard shows insights, rankings, and community activity**
5. **Users continue building their eco-city** as they reduce their impact over time

---

## Keyword Reward System

The platform incentivises meaningful community participation through a keyword-based reward system in the Live Community Feed.

### How It Works

1. **User writes a post** in the Community section
2. The **Meaningfulness Model** checks whether the post is a genuine, non-spammy sentence
3. If valid, the system scans the post against a curated library of **80+ eco-keywords** (e.g., *sustainable*, *compost*, *biodiversity*, *carbon*, *renewable*)
4. For each unique keyword found, the author earns **10 Eco-Points (EP)** and **10 Experience Points (XP)**
5. A green confirmation banner shows the total reward earned

### Meaningfulness Model

To prevent spam and keyword stuffing (e.g., *"eco eco eco"*), every post passes through a heuristic validation model before rewards are issued:

| Check | Rule | Purpose |
|---|---|---|
| Minimum length | At least 5 words | Filters empty/trivial posts |
| Lexical diversity | Unique words ≥ 40% of total | Detects repeated spam |
| Word frequency cap | No word appears more than 3 times | Prevents excessive repetition |
| Consecutive duplicate check | No adjacent identical words | Catches "eco eco eco" patterns |
| Keyword density | Keywords ≤ 70% of total words | Ensures meaningful context |
| Non-keyword floor | At least 2 non-keyword words present | Requires filler/connector words |

All checks must pass for rewards to be issued.

### Keyword Matching

The keyword matcher uses two strategies for maximum coverage:

1. **Exact match** — the word appears verbatim in the keyword list
2. **Substring match** — the word contains a keyword as a substring (e.g., *"eco-friendly"* contains *"eco"*, *"energy-inefficient"* contains *"energy"*)

The text is tokenized by splitting on whitespace **and** punctuation/hyphens, so compound terms like *"plant-based"* or *"energy-efficient"* are broken into their component words for matching.

### Keyword Library

The keyword library (`src/data/ecoKeywords.ts`) contains **180+ curated terms** across categories, including common grammatical variants (e.g., *reduce*, *reducing*, *reduced*; *compost*, *composting*, *composted*):

- **Energy & Conservation** — sustainable, solar, renewable, efficiency, insulation, thermostat, standby
- **Transport & Mobility** — bicycle, transit, carpool, ev, carbon, offset, driving, commute
- **Waste & Recycling** — compost, biodegradable, upcycle, circular, repair, thrift
- **Food & Agriculture** — vegan, organic, regenerative, diet, seasonal, legumes
- **Nature & Environment** — biodiversity, reforestation, ecosystem, climate, habitat
- **Lifestyle & General** — mindful, ethical, activist, systemic, impact, awareness

### File Reference

| File | Role |
|---|---|
| `src/data/ecoKeywords.ts` | Keyword library, meaningfulness model, keyword matcher |
| `src/components/Dashboard/EcoActivityPanel.tsx` | Reward integration — called during post creation |
