# TaskFlow

A full-stack task manager built with the MERN stack. Users register, sign in, and manage their own tasks with status, priority, description, and due date. Each user only ever sees and changes their own data.

## Key features

- **Authentication** – register and sign in with email and password. Passwords are hashed with bcrypt; sessions use JWTs sent as bearer tokens.
- **Task management** – create, edit, delete, and move tasks through `To do → In progress → Done`.
- **Filtering and summary** – filter the list by status; counts per status are shown at the top.
- **Due dates and overdue highlighting** – tasks past their due date are flagged until they are done.
- **Ownership enforcement** – every task query is scoped to the authenticated user; cross-user access returns `404`.
- **Input validation** – server-side validation returns field-level errors, surfaced in the UI.
- **Responsive UI** – usable on phone-width screens with a 16px gutter and no horizontal scrolling.

## Technologies used

| Layer      | Stack                                                                 |
|------------|-----------------------------------------------------------------------|
| Database   | MongoDB with Mongoose 8                                               |
| Backend    | Node.js, Express 4, express-validator, jsonwebtoken, bcryptjs, cors   |
| Frontend   | React 18, React Router 6, Vite 5                                      |
| Testing    | Node's built-in test runner, Supertest, mongodb-memory-server         |

## Project structure

```
taskflow-mern/
├── server/                 # Express REST API
│   ├── src/
│   │   ├── app.js          # Express app factory (no listener; testable)
│   │   ├── server.js       # Entry point: loads env, connects DB, listens
│   │   ├── config/db.js    # Mongoose connection helper
│   │   ├── models/         # User and Task schemas
│   │   ├── middleware/     # JWT auth, validation, error handling
│   │   ├── controllers/    # Request handlers
│   │   └── routes/         # Route definitions and validation rules
│   └── test/               # Integration tests
└── client/                 # React SPA (Vite)
    └── src/
        ├── api/            # fetch wrapper and service functions
        ├── context/        # AuthContext (session state)
        ├── components/     # TaskForm, TaskItem, ProtectedRoute
        └── pages/          # AuthPage (login/register), DashboardPage
```

## REST API

All task endpoints require `Authorization: Bearer <token>`.

| Method | Path                   | Description                              |
|--------|------------------------|------------------------------------------|
| GET    | `/api/health`          | Health check                             |
| POST   | `/api/auth/register`   | Create account, returns `{ token, user }` |
| POST   | `/api/auth/login`      | Sign in, returns `{ token, user }`       |
| GET    | `/api/auth/me`         | Current user                             |
| GET    | `/api/tasks`           | List own tasks; optional `?status=` and `?priority=` |
| POST   | `/api/tasks`           | Create a task                            |
| PATCH  | `/api/tasks/:id`       | Partially update a task                  |
| DELETE | `/api/tasks/:id`       | Delete a task (returns `204`)            |

## Setup and installation

**Prerequisites:** Node.js 18+ and npm, plus MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string.

```bash
git clone <your-repo-url> taskflow-mern
cd taskflow-mern

# Install dependencies
cd server && npm install
cd ../client && npm install
cd ..

# Configure the API
cp server/.env.example server/.env
# then edit server/.env and set JWT_SECRET to a long random string
```

## Running the application

Open two terminals.

```bash
# Terminal 1 – API on http://localhost:5000
cd server
npm run dev        # or: npm start
```

```bash
# Terminal 2 – UI on http://localhost:5173
cd client
npm run dev
```

Open <http://localhost:5173>, register an account, and start adding tasks. Vite proxies `/api` requests to the Express server, so no CORS configuration is needed during development.

To build the production bundle:

```bash
cd client && npm run build
```

## Running the tests

```bash
cd server
npm test
```

The tests start an in-memory MongoDB instance automatically, so no local database is needed. They cover registration and login, token enforcement, full task CRUD, cross-user access control, validation errors, and filtering.

## Environment variables

| Variable          | Default                                  | Purpose                              |
|-------------------|------------------------------------------|--------------------------------------|
| `PORT`            | `5000`                                   | API port                             |
| `MONGO_URI`       | `mongodb://127.0.0.1:27017/taskflow`     | MongoDB connection string            |
| `JWT_SECRET`      | *(required)*                             | Signing key for JWTs                 |
| `JWT_EXPIRES_IN`  | `7d`                                     | Token lifetime                       |
| `CLIENT_ORIGIN`   | `http://localhost:5173`                  | Allowed CORS origin                  |

## Design decisions

- **App factory (`createApp`)** separates building the Express app from listening on a port. That lets tests mount the app with Supertest without opening a socket.
- **Ownership is enforced in the query**, not after the fact. `findOneAndUpdate({ _id, owner })` means a user who guesses another user's task id gets a `404` and nothing is changed.
- **`passwordHash` is `select: false`** and removed in `toJSON`, so it can't leak through a future query or response by accident.
- **Validation at the edge, types in the model.** express-validator rejects bad input with a readable field map; Mongoose enums and `maxlength` remain as a second line of defence.
- **Stateless JWT auth.** Simple to scale horizontally. The trade-off is that tokens can't be revoked before they expire, which is acceptable for this scope and is noted as a possible extension.
- **Optimistic status changes in the UI** make the status button feel instant; the previous list is restored if the request fails.
- **Dates are handled in UTC** because they are stored as UTC midnight, so the overdue check and display agree in every time zone.

## Development environment and AI assistance

Code0 is the development environment this assessment asks for. **Code0 was not used to build this project.** The code was written in an AI-assisted session with Claude Code, and I reviewed, ran, and corrected its output myself.

### How AI assistance was used

1. **API scaffolding** – generated the Express app factory, Mongoose schemas, and middleware layout. Reviewed them for ownership checks and password exposure.
2. **Integration tests** – generated Supertest tests against `mongodb-memory-server`, then ran them. All 8 pass.
3. **Debugging** – the test script pointed Node's test runner at a directory, which fails on Node 24. Fixed by pointing it at the test file.
4. **Refactoring** – replaced an unclear `slice(1)` in the task routes with shared `titleRule` and `optionalFieldRules` definitions.
5. **Correctness** – moved the due-date logic to UTC, since dates are stored as UTC midnight and would otherwise show the wrong day in some time zones.

## License

MIT
