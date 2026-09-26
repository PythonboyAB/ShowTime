# 🎬 ShowTime – Smart Online Cinema Reservation System

ShowTime is a **full-stack MERN cinema reservation platform** where users can browse movies, view show details, select seats, and book tickets online with integrated payment processing.

The project includes separate **user and admin applications**, a Node.js/Express backend, MongoDB database, Stripe payments, and AWS S3-based media storage.

## 🚀 Features

### 👤 User Functionality

- Browse available and upcoming movies
- View movie details and show information
- Select seats with **Standard and Recliner** options
- Check seat availability before booking
- Book cinema tickets online
- Secure user authentication
- Online payment using **Stripe**
- View booking information and generated ticket details
- QR-code based ticket support

### 🛠️ Admin Functionality

- Add, update, and delete movies
- Manage movie information and bookings
- Upload and manage movie posters/media
- Separate admin dashboard/application

## 🧠 Tech Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- Axios
- React Toastify
- Lucide React
- QRCode

### Backend

- Node.js
- Express.js
- REST APIs
- JWT authentication
- bcrypt / bcryptjs for password hashing
- Multer for file handling
- CORS
- dotenv

### Database

- MongoDB
- Mongoose

### Payments

- Stripe API

### Cloud & Deployment

- AWS S3 for media storage
- AWS EC2 for deployment
- Nginx as a reverse proxy
- PM2 for Node.js process management

## 🏗️ Project Structure

```text
ShowTime/
├── frontend/     # User-facing React application
├── admin/        # Admin React application
└── backend/      # Node.js + Express API server
```

## ⚙️ Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/PythonboyAB/ShowTime.git
cd ShowTime
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection
STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm start
```

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

### 4. Admin Setup

Open another terminal:

```bash
cd admin
npm install
npm run dev
```

> **Note:** If additional AWS S3 credentials or environment variables are required by the current backend configuration, add them to the backend `.env` file before running the application.

## 🔐 Security

- Sensitive configuration is stored using environment variables
- Passwords are protected using bcrypt-based hashing
- JWT is used for authentication
- Stripe secret keys are kept on the backend
- CORS is configured for frontend-backend communication
- Secrets are not committed directly into the source code

## ☁️ Deployment

The application is structured for production deployment with:

- **AWS EC2** – application hosting
- **Nginx** – reverse proxy and request routing
- **PM2** – backend process management
- **AWS S3** – movie posters and media storage

## 🔄 Application Flow

```text
User
  ↓
React Frontend
  ↓
Express REST API
  ↓
MongoDB
  ↓
Stripe Payment
  ↓
Booking Confirmation
```

Media uploads are handled through the backend and stored using AWS S3.

## 📌 Project Highlights

- Full-stack MERN architecture with separate frontend, backend, and admin applications
- RESTful API-based communication between client and server
- Seat-selection and booking workflow
- Integrated online payment processing
- JWT-based authentication
- Cloud-based media storage with AWS S3
- Production deployment using EC2, Nginx, and PM2

## 👨‍💻 Author

**PythonboyAB**

GitHub: https://github.com/PythonboyAB
