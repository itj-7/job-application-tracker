# Job Application Tracker

A Kanban-style web app for tracking your job search. Sign up, get a ready-made "Job Hunt" board, and drag applications between stages as they move from wish list to offer.

## Features

- **Email and password authentication** with [Better Auth](https://www.better-auth.com/), including sign-up, sign-in, and sign-out
- **Automatic board setup**: a "Job Hunt" board with five columns (Wish List, Applied, Interviewed, Offer, Rejected) is created for every new user
- **Drag and drop** applications between columns, powered by dnd-kit
- **Rich application cards** with company, position, location, salary, job URL, applied date, tags, description, and notes
- **Create, edit, and delete** applications, and delete whole columns
- **Route protection**: signed-in users are redirected away from the sign-in and sign-up pages, and the dashboard redirects visitors who are not signed in
- **Landing page** with a feature overview and screenshot tabs
- **Seed script** to fill a board with sample applications

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Database | MongoDB with Mongoose |
| Auth | Better Auth (MongoDB adapter) |
| Drag and drop | dnd-kit (`core`, `sortable`, `utilities`) |
| UI | Tailwind CSS 4, shadcn/ui, Lucide icons |

## Getting Started

### Prerequisites

- Node.js 20 or newer
- A MongoDB database (local, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

### Installation

```bash
npm install
```

### Environment variables

Create a `.env.local` file in the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-long-random-string
```

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string. Used by Mongoose and by Better Auth. |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Base URL of the app, used by the Better Auth client. |
| `BETTER_AUTH_SECRET` | Secret Better Auth uses to sign sessions. Required in production. Generate one with `openssl rand -base64 32`. |

### Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and your board will be waiting on the dashboard.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the code with ESLint |
| `npm run seed:jobs` | Fill a user's board with sample applications (see below) |

## Seeding Sample Data

`scripts/seed.ts` adds 15 sample applications spread across the five columns, which is handy for demos and screenshots.

1. Sign up in the app and copy your user ID from the `user` collection in MongoDB.
2. Open `scripts/seed.ts` and set the `USER_ID` constant at the top to that ID.
3. Run:

   ```bash
   npm run seed:jobs
   ```

The script reads `.env.local` for `MONGODB_URI`. It replaces any existing applications for that user, so don't run it on a board you want to keep.

## Project Structure

```
job-application-tracker/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts          # Better Auth route handler
│   ├── dashboard/
│   │   └── page.tsx                  # Protected Kanban board page
│   ├── sign-in/
│   │   └── page.tsx
│   ├── sign-up/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx                      # Landing page
│   └── globals.css
├── components/
│   ├── ui/                           # shadcn/ui primitives
│   ├── kanbanBoard.tsx               # Board, columns, drag and drop
│   ├── JobApplicationCard.tsx
│   ├── CreateJobApplicationDialogue.tsx
│   ├── ImageTabs.tsx
│   ├── Navbar.tsx
│   └── signOutButton.tsx
├── lib/
│   ├── actions/
│   │   └── job-applications.ts       # Server actions
│   ├── auth/
│   │   ├── auth.ts                   # Better Auth server setup
│   │   └── auth-client.ts            # Better Auth client
│   ├── hooks/
│   │   └── useBoard.ts               # Board state and move handling
│   ├── models/                       # Mongoose models
│   │   ├── board.ts
│   │   ├── column.ts
│   │   ├── jobApplication.ts
│   │   ├── models.types.ts
│   │   └── index.ts
│   ├── db.ts                         # Cached MongoDB connection
│   ├── init-user-board.ts            # Default board for new users
│   └── utils.ts
├── public/
│   └── hero-images/                  # Landing page screenshots
├── scripts/
│   └── seed.ts                       # Sample data seeder
├── proxy.ts                          # Redirects signed-in users from auth pages
├── next.config.ts
├── package.json
└── tsconfig.json
```

## How It Works

- Each user owns one **Board**, which has ordered **Columns**, which hold **JobApplications**. Every document stores the owner's `userId`.
- When a user signs up, a Better Auth database hook calls `initializeUserBoard` to create the board and its default columns.
- Dragging a card calls `useBoard.moveJob`, which updates the application's column and position through a server action.

## Deployment

The app deploys well on [Vercel](https://vercel.com). Add the environment variables above in the project settings, and set `NEXT_PUBLIC_BETTER_AUTH_URL` to your production URL. Make sure your MongoDB provider allows connections from your host (for Atlas, update the network access list).
