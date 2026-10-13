# Thinking Together

A real-time, classroom-first collaborative brainstorming platform.

## Important: no demo/seed data

This project intentionally starts with an **empty MongoDB Atlas database**. There is no seed script, no demo account, and no pre-populated classroom/activity data. Everything visible in the application is created by real users through the UI and stored in MongoDB Atlas.

## Stack

- React + Vite
- Node.js + Express
- MongoDB Atlas + Mongoose
- Socket.IO for authenticated real-time collaboration
- JWT + bcrypt authentication

## Setup

### 1. Requirements

- Node.js 20+
- MongoDB Atlas cluster

### 2. Server environment

Copy `server/.env.example` to `server/.env` and set:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/thinking_together
JWT_SECRET=replace_with_a_long_random_secret
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 3. Client environment (optional)

Copy `client/.env.example` to `client/.env`. The defaults point to the local API:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Install

```bash
npm install
npm run install:all
```

### 5. Run

```bash
npm run dev
```

Open `http://localhost:5173`.

## Real classroom workflow

1. Register as an instructor.
2. Create a classroom.
3. Share the generated classroom code with students.
4. Students register as students and join using that code.
5. Instructor creates an activity.
6. Instructor creates/assigns groups.
7. Students open the activity and collaborate.
8. Ideas, comments, votes, phase changes, submissions, and feedback are persisted in MongoDB Atlas and broadcast through authenticated Socket.IO rooms.

## Real-time behavior

Socket.IO connections are authenticated using the same JWT as the REST API. The server verifies classroom membership before allowing a client to join an activity room. Live events include activity updates, group updates, idea creation/update, comments, votes, submissions, and instructor feedback.

## No fake data

Do not run any seed command. If you want a clean project, use a new/empty MongoDB Atlas database. The application itself creates records only from actual user actions.
