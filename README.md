# 🎬 KinoSpot – Smart Online Cinema Reservation System

KinoSpot is a **full-stack MERN web application** that allows users to browse movies, select seats, and book tickets online with secure payment integration.

## 🚀 Features

### User Functionality

* Browse available and upcoming movies
* View detailed movie information
* Select seats (Standard & Recliner)
* Check real-time seat availability
* Book tickets online
* Secure payment integration using Stripe

### Admin Functionality

* Add, update, and delete movies
* Manage bookings
* Upload movie posters

## 🧠 Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Payment

* Stripe API

## ⚙️ Installation & Setup

### Clone Repository

```
git clone https://github.com/Harshvardhan-87/KinoSpot-.git
cd KinoSpot-
```

### Backend Setup

```
cd backend
npm install
```

Create `.env` file in backend:

```
PORT=5000
MONGO_URI=your_mongodb_connection
STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=http://localhost:5173
```

Run backend:

```
npm run server
```

### Frontend Setup

```
cd frontend
npm install
npm run dev
```

### Admin Setup

```
cd admin
npm install
npm run dev
```

## 🔐 Security

* Uses environment variables (.env)
* Secrets are not stored in code
* Secure authentication and booking flow
