# EventPulse API

This is a backend API for managing events - basically something you'd use
to list events like meetups or conferences, let people sign up for them,
and send live updates while the event is happening.

I built this for a course project. It's got user login with different
roles (admin vs regular user), an API for events that you can filter and
search, sign-ups with a max capacity, live announcements using
WebSockets, and the usual stuff you need to make an API actually work
properly - checking input is valid, handling errors, tests, and docs.

## Links

- **Repo:** https://github.com/omarramyy3/31007198800492-EventPulse
- **Live app:** https://31007198800492-event-pulse-hr4cl1qzm-omar-ramy.vercel.app
- **Health check:** https://31007198800492-event-pulse-hr4cl1qzm-omar-ramy.vercel.app/health
- **API docs:** https://31007198800492-event-pulse-hr4cl1qzm-omar-ramy.vercel.app/api-docs

(Vercel's free tier can generate a new URL per deployment, so if this
link ever looks dead, check the project's dashboard for whatever the
current one is.)

## What it's built with

- **Node.js / Express** - the actual API
- **MongoDB Atlas + Mongoose** - where the data is stored
- **JWT + bcrypt** - login system, passwords are hashed and roles are
  stored in the token
- **express-validator** - stops bad input before it breaks anything
- **Socket.io** - the real-time announcements part
- **Jest + Supertest** - for running tests
- **Swagger UI** - auto-generated docs at `/api-docs`

## How the folders are organized

```
config/       db connection + swagger setup
models/       the database schemas (User, Category, Event, Registration, Message)
controllers/  where the actual logic happens
routes/       just connects routes to controllers, nothing else
middleware/   auth checks, validation, error handling
utils/        small helper functions
sockets/      socket.io setup
seed/         fills the db with some sample data so it's not empty
test/         jest tests
postman/      postman collection + environment
```

## Running it on your machine

```bash
npm install
```

Copy `.env.example` to `.env` and put in your real values (your own
MongoDB link and a JWT secret). Then:

```bash
npm run seed   # adds some sample categories/events/an admin account
npm run dev    # starts the server, restarts automatically when you edit files
```

If it worked you'll see something like `[db] MongoDB connected` and
`[server] EventPulse API listening on port 5000` with no crash.

Quick way to check it's actually running:
- `http://localhost:5000/health`
- `http://localhost:5000/api-docs`

## Testing the API

There's a Postman collection in the `postman/` folder, import both files
into Postman and pick the EventPulse environment. Log in with the admin
account first (it saves the token automatically), then you can try
creating events, listing them, registering, etc.

## The live announcements part

You connect with your JWT token, join the room for whatever event you
want, and if you're an admin you can send messages to everyone in that
room:

```js
const socket = io('http://your-api-url', { auth: { token: yourJwt } });
socket.emit('join-event', { eventId });
socket.on('announcement', (msg) => console.log(msg));

// only works if you're an admin:
socket.emit('send-announcement', { eventId, content: 'Doors open in 10 minutes!' });
```

Every message also gets saved to the database, so if someone shows up
late they can still see `GET /api/events/:eventId/messages` and read
everything they missed.

## Tests

```bash
npm test
```

Tests cover the small utility functions and the whole Events API -
creating events, checking permissions work right, filtering, and error
cases. It uses a temporary in-memory database for this so it never
touches the real one.

Last time I ran it:
```
Test Suites: 3 passed, 3 total
Tests:       13 passed, 13 total
```

## Where it's deployed

Hosted on Vercel, database is on MongoDB Atlas. The environment
variables are set directly in Vercel's project settings, not in the
code.

A couple of honest notes on things that don't fully work the same way
they do locally, once deployed to a serverless platform like Vercel:

- **Socket.io** - Vercel doesn't keep a server running all the time the
  way Socket.io expects, so the live announcements feature might not
  behave consistently once deployed. The regular REST API works fine.

Being upfront about these instead of pretending they're not there.

## Git stuff

Commits use the Conventional Commits format (`feat:`, `fix:`, `test:`,
etc). Tagged this version as `v1.0.0`.

## Environment variables

Check `.env.example` for what you need. At minimum you need
`MONGODB_URI` and `JWT_SECRET` or it won't start.

## Quick list of endpoints

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Categories | `GET/POST /api/categories`, `PATCH/DELETE /api/categories/:id` (admin only) |
| Events | `GET/POST /api/events`, `GET/PATCH/DELETE /api/events/:id` (admin only for write) |
| Registrations | `POST /api/events/:eventId/register`, `GET /api/registrations/me`, `DELETE /api/registrations/:id` |
| Announcements | `GET /api/events/:eventId/messages`, plus the socket.io stuff |
| Other | `GET /health`, `GET /api-docs` |

Didn't want to copy every single request/response format in here since
it'd get outdated fast - all of that's in `/api-docs` and the Postman
collection instead.
