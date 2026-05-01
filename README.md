# SymptoNarrator - AI-Driven Healthcare Workflow Platform

SymptoNarrator is a full-stack healthcare platform that connects patients, doctors, and admins through AI-assisted reports, smart appointment booking, role-based dashboards, real-time chat, and consultation workflows.

## Highlights

- AI symptom analysis with specialist recommendation
- Specialist-prioritized doctor search by selected date and time slot
- Appointment lifecycle management: pending, accepted, rejected, completed
- Appointment-scoped chat and consultation support
- Role-based dashboards for patient, doctor, and admin
- PostgreSQL persistence through Prisma ORM

## System Architecture

```text
Major-Project/
├── README.md
└── major-project/
    ├── frontend/      React + Vite + Redux + Tailwind
    ├── backend/       Node + Express + Prisma + Socket.IO
    └── ai-service/    Flask + scikit-learn + pandas
```

## Tech Stack

### Frontend

- React 19
- Vite
- Redux Toolkit
- React Router
- Tailwind CSS
- Axios
- React Toastify
- Socket.IO Client

### Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- Joi validation
- JWT authentication
- Socket.IO

### AI Service

- Python
- Flask
- Flask-CORS
- scikit-learn
- pandas
- numpy
- python-dotenv

## Role-Based Workflow

### Patient Workflow

1. Register/login and complete patient profile.
2. Submit symptoms and duration.
3. Receive AI report with diagnosis summary and recommended specialist.
4. Book appointment by choosing date and time slot.
5. See specialist-prioritized available doctors first, then alternative doctors.
6. Book physical or online appointment.
7. Track appointment status in patient dashboard.
8. Use chat and consultation features based on appointment state.

### Doctor Workflow

1. Login and manage profile and timetable availability.
2. View incoming appointments.
3. Accept or reject pending requests.
4. Mark accepted appointments as completed when consultation ends.
5. Handle chat requests for online appointments.
6. Use appointment chat and consultation views for communication.

### Admin Workflow

1. Login via admin role.
2. Review doctor and patient records.
3. Verify doctor profiles and monitor system data.
4. Access management-level dashboard insights.

## End-to-End Clinical Flow

1. Patient provides symptom input.
2. Backend calls AI service for analysis.
3. AI service returns prediction, severity, recovery range, specialist recommendation.
4. Backend persists report to PostgreSQL.
5. During booking, backend checks patient latest report and prioritizes specialist-matching doctors.
6. Patient books appointment.
7. Doctor handles request and consultation lifecycle.

## AI Service Design

The AI service uses a hybrid approach:

- NLP symptom normalization
- TF-IDF vectorization + similarity matching
- Dataset-driven disease mapping
- Rule-based severity and recommendation layer

### AI Endpoints

- GET /health
- POST /api/predict
- POST /api/analyze
- POST /api/report
- GET /api/specialist/:diseaseName

## API Domains (Backend)

- /api/auth
- /api/patient
- /api/doctor
- /api/admin
- /api/appointments
- /api/messages
- /api/reports
- /api/ai

## Project Structure

```text
major-project/
├── frontend/
│   ├── src/components/
│   ├── src/pages/
│   ├── src/services/
│   └── src/redux/
├── backend/
│   ├── src/
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── middlewares/
│   └── prisma/
└── ai-service/
    ├── app.py
    ├── predictor.py
    ├── model.py
    ├── rules.py
    └── data/
```

## Environment Setup

Create local env files from templates:

- major-project/backend/.env.example -> major-project/backend/.env
- major-project/frontend/.env.example -> major-project/frontend/.env
- major-project/ai-service/.env.example -> major-project/ai-service/.env

## Local Development Setup

### 1) Clone Repository

```bash
git clone <your-repo-url>
cd Major-Project
```

### 2) Backend Setup

```bash
cd major-project/backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Backend default: http://localhost:5000

### 3) Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend default: http://localhost:5173

### 4) AI Service Setup

```bash
cd ../ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

AI service default: http://localhost:8000

## Database and Persistence

Prisma models include:

- User
- PatientProfile
- DoctorProfile
- Timetable
- Appointment
- Message
- Report

Persistence guarantees include:

- appointment slot uniqueness
- role-based data access
- report persistence for AI analysis
- appointment-scoped chat history

## Deployment and Production Notes

- Set strong JWT secrets and secure DATABASE_URL.
- Restrict CORS to trusted frontend domains.
- Use managed PostgreSQL in production.
- Use `npx prisma migrate deploy` for production releases instead of `npx prisma db push`.
- Keep Prisma schema/migration strategy consistent across environments.
- Add logging, monitoring, and backups before production rollout.

## Repository Status

This repository is now documentation-clean with a single consolidated README for GitHub onboarding, architecture understanding, and role-based workflow reference.
