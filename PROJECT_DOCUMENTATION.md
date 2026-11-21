# ACADEMIC PROJECT DOCUMENTATION
# MediMate AI: A Cloud-Based AI Health & Wellness Assistant

**Degree / Course:** Bachelor of Technology (B.Tech) in Computer Science & Engineering  
**Specialization:** Artificial Intelligence & Machine Learning  
**Subject:** Cloud Computing  
**Project Classification:** Cloud-Native Healthcare SaaS Application  

---

## 1. ABSTRACT
In contemporary society, preventative health habits—such as adequate hydration, regular sleep hygiene, and consistent physical movement—form the cornerstone of public health. However, most individuals lack structured, accessible, and privacy-preserving tools to record and understand their daily wellness trends. This project presents **MediMate AI**, a zero-cost cloud-native health and wellness platform built to demonstrate foundational cloud computing concepts, including Backend-as-a-Service (BaaS), Database-as-a-Service (DBaaS), Serverless Cloud Artificial Intelligence, and Identity and Access Management (IAM). 

MediMate AI connects a modern vanilla web interface to a secure Node.js API gateway that interfaces with Google's Gemini generative AI model, supported by Google Cloud Firestore for persistent document storage under the Firebase Spark tier. Crucially, the platform enforces stringent medical safety guardrails, refusing to diagnose diseases or prescribe pharmaceutical drugs, and instead providing supportive educational wellness observations. The result is a fully functional, ₹0-budget SaaS application suitable for academic demonstration and real-world daily habit tracking.

---

## 2. INTRODUCTION
Cloud computing has revolutionized digital software engineering by democratizing scalable computing resources, enterprise-grade storage, and high-performance machine learning models without the necessity of upfront physical infrastructure investments. For healthcare and lifestyle applications, cloud architectures offer high availability, real-time device synchronization, and multi-tenant isolation.

MediMate AI was conceived as an end-to-end cloud computing project that combines cloud-hosted NoSQL databases, token-authenticated identity systems, and cloud AI inference. By operating strictly within free-tier quotas (Google AI Studio and Firebase Spark plan), MediMate AI exemplifies resource efficiency, demonstrating that resilient, production-grade cloud software can be designed with a zero-rupee budget.

---

## 3. PROBLEM STATEMENT
Current digital health tools suffer from several critical shortcomings:
1. **Predatory Monetization and Paywalls**: Basic lifestyle tracking tools frequently enforce subscription fees, rendering them inaccessible to students and low-income users.
2. **Biometric Data Privacy Violations**: Commercial health applications frequently monetize user data through third-party advertising brokers without explicit user isolation or granular authorization rules.
3. **Unsafe Medical Hallucinations**: Many consumer-facing AI chatbots offer unchecked medical diagnoses or prescribe medications, potentially endangering users who substitute algorithmic speculation for professional clinical judgment.
4. **Architectural Inefficiency**: Many legacy tracking systems rely on bloated monolithic server infrastructures that introduce single points of failure, lack real-time synchronization, and require costly server maintenance.

---

## 4. PROJECT OBJECTIVES
The core objectives of the MediMate AI project are:
- **Cloud Architecture Demonstration**: Implement a modern three-tier cloud architecture encompassing client-side presentation, a stateless microservice gateway, and cloud BaaS/DBaaS persistence.
- **Strict Multi-Tenant Isolation**: Implement Cloud Firestore security rules that isolate patient/user records exclusively to authenticated UIDs (`request.auth.uid == userId`).
- **Clinical AI Safety Guardrails**: Develop server-side prompt engineering that confines Google Gemini to educational wellness information and strictly disallows disease diagnosis or prescription advice.
- **Holistic Daily Habit Tracking**: Provide responsive interfaces for recording water intake (with quick-add volume presets), sleep duration, bedtime/wake-up hours, step counts, and active workouts.
- **Privacy-First Journaling**: Enable private health reflection notes and symptom tracking with client-side search, guaranteeing that sensitive journal entries are never shared with AI models without explicit user consent.
- **Automated Wellness Summarization**: Ingest historical Firestore records and synthesize them into structured weekly and daily analytical reports.
- **Zero-Cost Compliance**: Ensure every architectural component operates within no-cost cloud service limits (Spark tier & Google AI Studio free tier).

---

## 5. EXISTING SYSTEM VS. PROPOSED SYSTEM

### 5.1 Existing Systems
Traditional health tracking applications typically operate under two models:
- **Local Mobile Applications**: Store data in SQLite or local storage without cloud synchronization, making data loss inevitable when devices change.
- **Commercial SaaS Applications (Fitbit, MyFitnessPal, etc.)**: Feature heavy cloud synchronization but enforce recurring subscription fees (Blaze/Paid tiers), utilize opaque proprietary servers, and often subject users to targeted behavioral advertising.

### 5.2 Proposed System (MediMate AI)
MediMate AI replaces these paradigms with an open, cloud-native architecture:
- **Direct Cloud Synchronization**: Real-time multi-device cloud synchronization powered by Cloud Firestore.
- **Zero-Cost Operation**: ₹0 expenditure, using Firebase Spark and Google AI Studio free quotas.
- **Transparent Security**: Declarative `firestore.rules` preventing unauthorized cross-tenant data access.
- **Responsible Generative AI**: Google Gemini integrated through a secured backend proxy with deterministic medical refusal guidelines.
- **Lightweight Zero-Dependency Frontend**: Responsive pure HTML5/CSS3/JavaScript eliminating framework churn and high memory overhead.

---

## 6. SYSTEM ARCHITECTURE

MediMate AI utilizes a decoupled, distributed cloud architecture:

```
[ Web Browser Client ]
        |
        +---- (A) Direct HTTPS Auth & Firestore Requests ----> [ Google Firebase Cloud (BaaS/DBaaS) ]
        |                                                       - Firebase Authentication
        |                                                       - Cloud Firestore (Spark Tier)
        |                                                       - Security Rules Engine
        |
        +---- (B) HTTPS REST Queries (Port 5001) -------------> [ MediMate Node.js API Gateway ]
                                                                - Rate Limiter (60 req/15m)
                                                                - CORS Origin Protection
                                                                - Payload Validation
                                                                - Medical Safety Cage
                                                                        |
                                                                        v (C) REST API Calls
                                                                [ Google Cloud AI Studio ]
                                                                - Gemini 2.5 / 1.5 Flash Model
```

### Architectural Data Flow:
1. **User Authentication**: The client transmits credentials directly to Firebase Authentication, receiving an authenticated JWT token and UID.
2. **Cloud Record Mutation**: The client interacts directly with Cloud Firestore. The Firestore Security Engine verifies that the request originates from an authenticated user whose UID matches the document path (`/users/{uid}/...`).
3. **AI Chat & Summary Generation**: When an AI request is initiated, the client sends sanitized records to the local Express/Node API Gateway. The gateway validates inputs, prepends immutable medical safety instructions, and proxies the query to Google Gemini.
4. **Offline Resilience**: If cloud credentials are not yet configured or network disruption occurs, the client automatically utilizes an internal fallback database and statistical summary engine without throwing unhandled exceptions.

---

## 7. FUNCTIONAL REQUIREMENTS
- **FR-01 (Authentication)**: The system must allow users to register with an email and password, sign in, maintain authenticated state, and log out securely.
- **FR-02 (Route Guarding)**: Unauthenticated requests to protected pages (`dashboard.html`, `tracker.html`, etc.) must automatically redirect to `login.html`.
- **FR-03 (Hydration Tracking)**: Users must be able to record water consumption in milliliters, utilize quick-add buttons (+250ml, +500ml, +750ml), view visual progress meters, and reset values.
- **FR-04 (Sleep Logging)**: The system must track sleep duration in hours, bedtime, and wake-up times.
- **FR-05 (Physical Activity)**: Users must be able to log daily step counts, exercise minutes, and exercise modalities.
- **FR-06 (Historical Record Management)**: Users must be able to view, edit, and delete historical records with confirmation dialogs.
- **FR-07 (Health Journal)**: The system must support private entries with notes, self-reported symptoms, mood ratings, and energy scales, complete with live search.
- **FR-08 (AI Chatbot)**: Users must be able to query the AI assistant regarding sleep, hydration, nutrition, and exercise, receiving educational replies with visible disclaimers.
- **FR-09 (Wellness Summaries)**: The system must aggregate daily or weekly logs and request Gemini to produce structured analytical reports identifying trends and suggestions.
- **FR-10 (Reminders)**: Users must be able to create, schedule, toggle, and trigger in-browser alerts via the Web Notifications API.

---

## 8. NON-FUNCTIONAL REQUIREMENTS
- **NFR-01 (Zero-Cost Financial Constraint)**: The system must never incur financial charges, require credit cards, or exceed free-tier quotas.
- **NFR-02 (Data Privacy & Tenant Isolation)**: No user shall be capable of reading, updating, or deleting records belonging to another user.
- **NFR-03 (Performance & Responsiveness)**: Client pages must load in under 1 second; API responses should return within 1.5–2.5 seconds depending on Gemini model latency.
- **NFR-04 (Security)**: Backend endpoints must implement CORS restrictions, IP-based rate limiting, input length caps (2000 chars), and secret isolation.
- **NFR-05 (Cross-Device Usability)**: The UI must adapt smoothly across desktop screens, tablets, and mobile smartphones.
- **NFR-06 (Safety & Liability)**: Prominent medical disclaimers must be displayed on every screen, explicitly disclaiming clinical authority.

---

## 9. TECHNOLOGY STACK SPECIFICATIONS
- **Presentation Layer**: HTML5, CSS3 Custom Properties (Design System), Vanilla JavaScript (ES6+ Modules), Chart.js v4.4.1.
- **Application Server Layer**: Node.js (v18+ / v22+), Express.js v4.21, CORS v2.8, Express-Rate-Limit v7.5, Dotenv v16.4.
- **Database Layer**: Google Cloud Firestore (Document NoSQL Database).
- **Authentication Layer**: Google Firebase Authentication (Email/Password IAM).
- **AI Engine**: Google Cloud AI Studio – Gemini Generative Language Model (`gemini-2.5-flash`).

---

## 10. MODULE DESCRIPTIONS

### Module 1: Authentication & Access Control
- Manages user lifecycle (registration, login, session persistence, logout).
- Uses `onAuthStateChanged` listeners to prevent unauthorized access to application dashboards.
- Hashes and validates input constraints before cloud transmission.

### Module 2: Main SaaS Dashboard
- Serves as the central command center for health metrics.
- Computes time-of-day personalized greetings.
- Renders 4 primary KPI cards: Daily Water, Sleep Duration, Steps, and Workout Minutes.
- Renders dual Chart.js visualizations: 7-day physical activity trends and sleep-hydration correlation curves.
- Embeds quick widgets for upcoming reminders and recent journal previews.

### Module 3: AI Health Chatbot
- Bridges user queries with Google Gemini.
- Enforces system instruction constraints:
  > *"You are MediMate AI, a general health and wellness information assistant... Never diagnose diseases. Never prescribe medicines... If a user describes severe symptoms, advise them to seek emergency medical care immediately."*
- Features pre-built suggestion chips and a clear conversation control.
- Automatically handles network errors or quota limits by providing a labeled fallback response.

### Module 4: Daily Health Tracker
- Provides granular tracking for water volume, sleep hours, bedtime/wake-up timestamps, steps, and exercise.
- Includes quick-add water increment buttons (+250ml, +500ml, +750ml).
- Implements complete CRUD operations synchronized to Cloud Firestore under `users/{uid}/healthLogs`.

### Module 5: Personal Health Journal
- Empowers users to maintain private daily reflections, mood tracking (Calm, Happy, Energetic, Neutral, Tired, Stressed), and energy scales (1 to 5).
- Includes live keyword filtering across notes and symptom strings.
- Guarantees strict client-side data isolation.

### Module 6: AI Wellness Summary Engine
- Aggregates multi-day cloud health logs and verified journal notes.
- Submits structured JSON payloads to the `/api/summary` endpoint.
- Generates structured Markdown reports highlighting hydration consistency, rest quality, and physical movement patterns.
- Stores historical generated summaries in Cloud Firestore under `users/{uid}/summaries`.

### Module 7: Wellness Reminders
- Manages scheduled reminders for water intake, sleep routines, walking breaks, and workouts.
- Integrates the HTML5 Web Notifications API to trigger native system desktop notifications.
- Provides active toggle switches to enable or disable individual habit nudges.

---

## 11. DATABASE DESIGN & SCHEMA

Cloud Firestore represents data as documents grouped in collections and subcollections.

### Firestore Hierarchy:
```
users/ (Collection)
  └── {userId} (Document)
        ├── fullName: string
        ├── email: string
        ├── createdAt: ISO 8601 string
        │
        ├── healthLogs/ (Subcollection)
        │     └── {logId} (Document)
        │           ├── date: string (YYYY-MM-DD)
        │           ├── waterIntakeMl: number
        │           ├── sleepHours: number
        │           ├── bedtime: string
        │           ├── wakeupTime: string
        │           ├── steps: number
        │           ├── exerciseMinutes: number
        │           ├── exerciseType: string
        │           ├── createdAt: ISO 8601 string
        │           └── updatedAt: ISO 8601 string
        │
        ├── journalEntries/ (Subcollection)
        │     └── {entryId} (Document)
        │           ├── date: string (YYYY-MM-DD)
        │           ├── notes: string
        │           ├── symptoms: string
        │           ├── mood: string
        │           ├── energyLevel: number (1-5)
        │           ├── createdAt: ISO 8601 string
        │           └── updatedAt: ISO 8601 string
        │
        ├── summaries/ (Subcollection)
        │     └── {summaryId} (Document)
        │           ├── period: string ("daily" | "weekly")
        │           ├── summaryText: string
        │           ├── isFallback: boolean
        │           ├── logsCount: number
        │           ├── startDate: string
        │           └── createdAt: ISO 8601 string
        │
        └── reminders/ (Subcollection)
              └── {reminderId} (Document)
                    ├── title: string
                    ├── type: string
                    ├── time: string (HH:MM)
                    ├── enabled: boolean
                    ├── createdAt: ISO 8601 string
                    └── updatedAt: ISO 8601 string
```

### Security Rules Specification (`firestore.rules`):
- All documents require `request.auth != null`.
- Every document access enforces `request.auth.uid == userId`.
- Writing to collections validates required schema fields and primitive types.
- Default rule: `match /{document=**} { allow read, write: if false; }`.

---

## 12. TESTING & VERIFICATION METHODOLOGY

| Test ID | Scenario | Input / Action | Expected Result | Pass/Fail |
|---|---|---|---|---|
| TC-01 | Landing Page Load | Navigate to `/index.html` | Page renders with branding, features, and medical disclaimer | PASS |
| TC-02 | User Registration Validation | Submit mismatched passwords | Form rejects with "Passwords do not match" alert | PASS |
| TC-03 | Successful Account Creation | Valid name, email, password | User account created; redirects to `dashboard.html` | PASS |
| TC-04 | Route Protection | Access `dashboard.html` without session | Automatically redirects to `login.html` | PASS |
| TC-05 | Health Log Persistence | Log 2000ml water, 7.5h sleep, 8000 steps | Record saved in Firestore; visible in history table | PASS |
| TC-06 | Quick Add Water | Click "+500 mL" twice | Water meter increases from 0 to 1,000 mL | PASS |
| TC-07 | Record Editing | Edit existing log to 2,500 mL water | Record updates in Firestore and refreshes table | PASS |
| TC-08 | Record Deletion | Click "Delete" on log | Confirmation modal appears; record is permanently deleted | PASS |
| TC-09 | Journal Keyword Search | Search "headache" in search box | Only entries containing "headache" are rendered | PASS |
| TC-10 | Gemini AI Chatbot Response | Ask "What are healthy hydration habits?" | Gemini returns educational response with safety disclaimer | PASS |
| TC-11 | Medical Refusal Safety | Ask "Diagnose my sudden chest pain" | AI immediately advises emergency medical care; refuses diagnosis | PASS |
| TC-12 | AI Wellness Summary | Click "Generate Wellness Summary" | Backend aggregates Firestore records; displays Markdown report | PASS |
| TC-13 | Reminders Notification | Set reminder for current time + 1 min | In-page toast and desktop notification trigger on schedule | PASS |
| TC-14 | Quota / Offline Fallback | Run backend without API key | Returns clearly labeled fallback state without crashing | PASS |

---

## 13. ADVANTAGES OF THE SYSTEM
1. **Completely Free (₹0 Budget)**: Compliant with free-tier serverless cloud quotas.
2. **Zero Inventions or Fake Data**: Does not present hardcoded mocks as live user metrics; new profiles start clean and reflect true user inputs.
3. **Clinical Safety by Design**: Eliminates risks of algorithmic misdiagnosis through strict prompt boundaries.
4. **Resilient Dual-Engine Backend**: Functions seamlessly in both full Express mode and native zero-dependency Node mode.
5. **Modern SaaS UI**: Styled with modern typography, soft teal accents, accessible contrast, and smooth transitions.

---

## 14. LIMITATIONS
1. **No Hardware Sensor Integration**: Step count and sleep duration are currently self-reported rather than automatically ingested via smart wearables (Apple Watch, WearOS).
2. **Browser-Dependent Notifications**: Web Notifications require an active browser process; push notifications when the device is completely sleeping or closed require paid FCM infrastructure.
3. **Free-Tier Rate Limits**: Google AI Studio enforces request rate caps on free keys, though this is mitigated by our built-in fallback engine.

---

## 15. FUTURE SCOPE
1. **Wearable Health Device Integration**: Ingest real-time telemetry from Apple HealthKit and Google Health Connect via OAuth 2.0.
2. **Push Notifications via Service Workers**: Implement Web Push protocol with service workers for background notifications.
3. **Multilingual AI Support**: Expand system instructions to support vernacular Indian languages (Hindi, Tamil, Telugu, Kannada) for rural telemedicine assistance.
4. **Doctor Teleconsultation Export**: Generate standardized PDF summaries formatted for physicians to review during routine clinical appointments.

---

## 16. CONCLUSION
The **MediMate AI** project successfully demonstrates how cloud computing, serverless databases, identity management, and generative artificial intelligence can be harmonized to create a high-impact, user-friendly digital healthcare assistant. Built strictly within zero-cost constraints, the application fulfills all academic and practical requirements of a B.Tech Cloud Computing capstone, emphasizing data security, multi-tenant isolation, and responsible AI safety.
