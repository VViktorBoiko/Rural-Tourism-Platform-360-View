# Rural Tourism Platform — 360° View

A full-stack web platform for rural tourism with online booking, role-based access control, Stripe Test Checkout integration, messaging, reviews, administrator moderation, and interactive 360° virtual tours with hotspot-based navigation.

**Built with:** React 19 · FastAPI · PostgreSQL · SQLAlchemy · Pannellum · Stripe

---

## Project Structure

```
rural-tourism/
├── backend/      # FastAPI backend
└── frontend/     # React frontend
```

---

## Prerequisites

Make sure you have the following installed:

- Python 3.10+
- Node.js 18+
- PostgreSQL

---

## Getting Started


### 1. Backend Setup

```bash
cd backend
```

Create a virtual environment and install dependencies:

```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/rural_tourism
SECRET_KEY=your_secret_key
STRIPE_SECRET_KEY=your_stripe_test_secret_key
STRIPE_SUCCESS_URL=http://localhost:5173/booking-success
STRIPE_CANCEL_URL=http://localhost:5173/my-bookings
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

Backend will be available at: `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `frontend/` folder:

```env
VITE_API_URL=http://localhost:8000
```

Run the frontend:

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## User Roles

| Role | Access |
|---|---|
| Guest | Browse properties and 360° tours |
| Registered User | Create bookings, messaging, reviews |
| Host | Manage listings, handle booking requests, create 360° tours |
| Administrator | User management, property moderation |

---

## Test Payment

The platform uses **Stripe Test Checkout**. Use the following test card:

- Card number: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any 3 digits

---

## Notes

- Make sure PostgreSQL is running before starting the backend
- The `uploads/` folder is created automatically by the backend for storing images and panoramic files
- Do not commit your `.env` files
