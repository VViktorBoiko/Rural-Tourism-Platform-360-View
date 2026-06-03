## Installation and Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <project-folder>
```

---

## Backend Setup

### 2. Open the Backend Folder

```bash
cd backend
```

### 3. Create a Virtual Environment

```bash
python -m venv venv
```

### 4. Activate the Virtual Environment

For Windows:

```bash
venv\Scripts\activate
```

For macOS / Linux:

```bash
source venv/bin/activate
```

### 5. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 6. Create the Backend Environment File

Create a `.env` file inside the `backend` folder.

Example:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/rural_tourism_db
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

STRIPE_SECRET_KEY=your_stripe_test_secret_key
STRIPE_SUCCESS_URL=http://localhost:5173/payment-success
STRIPE_CANCEL_URL=http://localhost:5173/payment-cancel
```

Change the values according to your local database and Stripe test account.

### 7. Start the Backend Server

```bash
uvicorn app.main:app --reload
```

The backend should run at:

```text
http://127.0.0.1:8000
```

FastAPI Swagger documentation is available at:

```text
http://127.0.0.1:8000/docs
```

---

## Frontend Setup

### 8. Open a New Terminal and Go to the Frontend Folder

```bash
cd frontend
```

### 9. Install Frontend Dependencies

```bash
npm install
```

### 10. Create the Frontend Environment File

Create a `.env` file inside the `frontend` folder.

Example:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 11. Start the Frontend Server

```bash
npm run dev
```

The frontend should run at:

```text
http://localhost:5173
```

---

## Database Setup

The project uses PostgreSQL.

Basic setup steps:

1. Create a PostgreSQL database.
2. Update the `DATABASE_URL` value in the backend `.env` file.
3. Run the backend server.
4. Run the SQL table creation scripts, depending on the project setup.

Example database name:

```text
rural_tourism_db
```

---

## Stripe Test Checkout Setup

The project uses Stripe in test mode.

1. Create or open a Stripe account.
2. Get the test secret key from the Stripe dashboard.
3. Add the key to the backend `.env` file as `STRIPE_SECRET_KEY`.
4. Start both backend and frontend.
5. Create a booking as a registered user.
6. Approve the booking as a host.
7. Start payment from the user bookings page.

Example Stripe test card:

```text
4242 4242 4242 4242
```

Use any future expiry date and any CVC.

---

## Running the Full Project

Start the backend:

```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```
