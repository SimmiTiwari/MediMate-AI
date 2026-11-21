# MediMate AI – Cloud-Based AI Health & Wellness Assistant

> **A B.Tech Computer Science Cloud Computing Capstone Project**  
> *Demonstrating Backend-as-a-Service (BaaS), Database-as-a-Service (DBaaS), Serverless Cloud AI, and Identity & Access Management (IAM).*

---

## 1. Project Overview & Problem Statement

### Problem Statement
In modern digital healthcare, individuals often struggle to manage their daily preventative wellness habits—such as consistent hydration, adequate restorative sleep, regular physical activity, and mental health reflections. While commercial healthcare apps exist, they frequently require paid subscriptions, introduce predatory paywalls, leak sensitive biometric data, or present medically unsafe AI diagnoses that risk patient well-being.

### Project Objective
**MediMate AI** is a zero-cost, cloud-integrated health and wellness assistant engineered to bridge this gap. Designed specifically to demonstrate real-world **Cloud Computing** concepts, the application empowers users to:
1. Converse with an AI Health Assistant powered by **Google Gemini** with strict medical safety guardrails.
2. Track daily water intake, sleep cycles, steps, and workout sessions.
3. Keep a private, encrypted personal health and mood journal.
4. Generate daily and 7-day AI wellness trend summaries.
5. Schedule habit reminders using native Web Notifications.
6. Isolate and synchronize user records in real time using **Google Cloud Firestore**.

> **CRITICAL MEDICAL DISCLAIMER**: MediMate AI provides educational and informational wellness suggestions only. It is **NOT** a certified medical diagnostic tool, does not prescribe medications, and does not replace professional medical advice.

---

## 2. Cloud Computing Architecture & Concepts Demonstrated

MediMate AI directly illustrates core cloud computing models and distributed systems design:

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  Vanilla JS (ES6+) • HTML5 • CSS3 Modern Healthcare SaaS UI • Chart.js Analytics  |
+-----------------------------------------------------------------------------------+
             |                                                  ^
             | (1) Direct BaaS Authentication & DB Sync         | (2) Secure REST API Proxy
             v                                                  v
+-------------------------------+              +-----------------------------------+
|  GOOGLE FIREBASE CLOUD        |              |  APPLICATION BACKEND GATEWAY      |
|  - Cloud Authentication (IAM) |              |  - Node.js & Express Service       |
|  - Cloud Firestore (DBaaS)    |              |  - CORS & Rate Limiting Guard     |
|  - Declarative Security Rules |              |  - Strict Medical Prompt Injection|
+-------------------------------+              +-----------------------------------+
                                                                |
                                                                | (3) Generative Language API
                                                                v
                                               +-----------------------------------+
                                               |  GOOGLE CLOUD AI STUDIO           |
                                               |  - Gemini 2.5 / 1.5 Flash Model   |
                                               |  - System Instruction Safety Cage |
                                               +-----------------------------------+
```

### Key Cloud Concepts Demonstrated:
1. **Backend-as-a-Service (BaaS) & Identity and Access Management (IAM)**:
   - Uses **Firebase Authentication** for token-based user management.
   - Enforces per-user UID data partitioning so users can never view or mutate another tenant's records.
2. **Database-as-a-Service (DBaaS)**:
   - Uses **Cloud Firestore**, a scalable NoSQL cloud document store.
   - Secured via declarative `firestore.rules` validating data schemas and authorization headers at the cloud boundary.
3. **API Gateway & Microservice Pattern**:
   - The Express backend acts as a stateless security proxy between the client and Google's AI endpoints.
   - Protects client environments by keeping API secrets strictly server-side in `.env`.
4. **Cloud AI Integration & Guardrails**:
   - Employs Google Gemini via Google AI Studio free tier.
   - Implements system-level prompt constraints to prevent unauthorized medical diagnosing or pharmaceutical prescribing.
5. **Zero-Cost Free-Tier Optimization**:
   - Engineered to function 100% within the **Firebase Spark (No-Cost) Plan** and **Google AI Studio Free Tier**, requiring ₹0 budget and zero credit card registration.

---

## 3. Technology Stack

- **Frontend**: HTML5, CSS3 (Modern custom design system with Inter/Plus Jakarta Sans font stack), Vanilla JavaScript (Modular ES6), Chart.js (Data Visualizations), SVG Icons.
- **Backend Service**: Node.js, Express.js (with automatic Native Node fallback), CORS, express-rate-limit, dotenv.
- **Cloud Database & Auth**: Google Firebase Authentication & Cloud Firestore (Spark Free Plan).
- **Artificial Intelligence**: Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`).

---

## 4. Repository & Project Directory Structure

```
MediMate-AI/
├── frontend/
│   ├── index.html              # Public landing page with features, workflow & medical disclaimer
│   ├── login.html              # Authentication portal (Sign In / Register with validation)
│   ├── dashboard.html          # Main SaaS dashboard with live metrics & Chart.js trends
│   ├── chatbot.html            # AI Health Assistant chat interface
│   ├── tracker.html            # Daily Health Tracker (water, sleep, steps, exercise)
│   ├── journal.html            # Personal Health Journal (mood, symptoms, notes, search)
│   ├── summary.html            # AI Wellness Summary generator (daily / weekly reports)
│   ├── reminders.html          # Wellness Reminders with Web Notification triggers
│   ├── css/
│   │   ├── style.css           # Global design system (teal palette, layout, variables)
│   │   └── components.css      # Reusable widgets (cards, chats, modals, toasts, skeletons)
│   └── js/
│       ├── config.js           # Cloud & backend environment configurations
│       ├── firebase-db.js      # Unified Firebase Auth & Firestore client layer
│       ├── auth.js             # Auth state listener, session management & route guard
│       ├── dashboard.js        # Dashboard aggregation & Chart.js rendering
│       ├── chatbot.js          # Chatbot UI controller & backend communication
│       ├── tracker.js          # Daily tracker CRUD & quick-add water handler
│       ├── journal.js          # Personal journal CRUD & search filter
│       ├── summary.js          # AI summary orchestrator
│       └── reminders.js        # Reminders CRUD & notification manager
├── backend/
│   ├── server.js               # Hybrid Express / Native Node.js HTTP server & API gateway
│   ├── gemini.js               # Google Gemini AI service with clinical safety rules
│   ├── package.json            # Node.js dependencies
│   ├── .env                    # Active local environment variables
│   └── .env.example            # Environment configuration template
├── firestore.rules             # Production security rules enforcing UID isolation
├── .gitignore                  # Git ignore rules protecting keys and dependencies
├── README.md                   # Full repository documentation
└── PROJECT_DOCUMENTATION.md    # 17-section formal academic project documentation
```

---

## 5. Quickstart & Installation Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18.x or 20.x+)
- A modern web browser (Chrome, Edge, Safari, Firefox)

### Step 1: Clone or Navigate to the Workspace
```bash
cd /Users/mac/Downloads/MediMate-AI
```

### Step 2: Configure Environment Variables
Inside `backend/.env`, you can customize the configuration:
```env
PORT=5001
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

> **Note**: To obtain a free Google Gemini API key:
> 1. Visit [Google AI Studio](https://aistudio.google.com/).
> 2. Click **Get API key** and create a key in a free Google Cloud project.
> 3. Paste the key into `backend/.env`.
> *(If you run without an API key, MediMate AI automatically runs in its clearly labeled **Offline Fallback Mode** with zero crashes!)*

### Step 3: Run the Application
You can run the backend server with standard Node:
```bash
cd backend
node server.js
```

Or install express dependencies:
```bash
npm install
npm start
```

### Step 4: Open in Your Browser
Open your browser and navigate to:
```
http://localhost:5001
```

---

## 6. Cloud Firestore Setup (Optional / Production)

By default, MediMate AI functions instantly out-of-the-box with a built-in local client database. When you are ready to link your free Firebase Spark project:

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project** (Spark Free Plan - ₹0).
2. Under **Build**, enable **Authentication** -> **Email/Password**.
3. Under **Build**, enable **Cloud Firestore** in production mode.
4. Copy the contents of `firestore.rules` from this project into the Firestore Rules tab and click **Publish**.
5. Register a Web App in your Firebase project and copy the `firebaseConfig` object.
6. In MediMate AI, click the **☁️ Cloud Settings** button in the sidebar and paste your keys, or update `frontend/js/config.js`.

---

## 7. Security & Privacy Implementations

1. **No Hardcoded Secrets**: All API keys and secrets are loaded from server environment variables.
2. **CORS Isolation**: Restricts API calls to authorized local frontend origins.
3. **Rate Limiting**: Mitigates Denial-of-Service (DoS) attacks by restricting rapid requests.
4. **Owner-Only Firestore Rules**: Prevents unauthorized reads and cross-tenant data access.
5. **Medical Safeguard Constraints**: Enforces refusal to diagnose, prescribe, or provide emergency care.

---

## 8. License & Academic Attribution
Developed as an academic capstone project for B.Tech Computer Science (Cloud Computing). Free for educational and research usage.
