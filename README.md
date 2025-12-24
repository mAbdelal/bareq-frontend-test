## Bareq – Academic Services Marketplace Frontend

A modern frontend for the Bareq platform built with Next.js (App Router). It provides the user interfaces for browsing and creating requests, offering services, managing purchases, handling disputes, and chatting in real-time.

## 🚀 Features

- **Authentication & Profiles**: Login/Register pages, session handling via cookies, profile views
- **Requests Module**: Create, browse, filter, and manage custom academic requests
- **Offers & Purchases**: Submit offers, accept/decline, track order lifecycle and delivery
- **Services Catalog**: Browse and purchase services from providers
- **Disputes**: Open, view, and collaborate on dispute resolution flows
- **Real-time Chat**: Socket.IO-based live messaging with credentialed connections
- **Ratings & Reviews**: Display and submit ratings for completed work
- **Status Translations**: Arabic labels for roles, actions, and statuses
- **Responsive UI**: Radix UI, MUI, Tailwind CSS v4 components

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Styling**: Tailwind CSS v4, Radix UI primitives, MUI components
- **Forms & Validation**: React Hook Form + Yup
- **Realtime**: socket.io-client
- **Theme**: next-themes (light/dark)
- **Utilities**: clsx, tailwind-merge, js-cookie, embla-carousel, lucide-react


## ⚙️ Environment Variables

Set these in `.env.local` (not committed):

| Variable               | Description                                        | Example                         |
| ---------------------- | -------------------------------------------------- | -----------------------         |
| `NEXT_PUBLIC_BASE_URL` | Base URL for REST API calls and refresh-token flow | `http://localhost:4000/api/vi`  |
| `NEXT_PUBLIC_API_URL`  | Base URL used by Socket.IO client                  | `http://localhost:4000`         |

Referenced in:

- `lib/api.js` uses `NEXT_PUBLIC_BASE_URL` for `${BASE_URL}/auth/refresh-token`
- `lib/socket.js` uses `NEXT_PUBLIC_API_URL` to initialize Socket.IO

Example `.env.local`:

NEXT_PUBLIC_BASE_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000


## 🧪 Installation & Running

### Option 1: Local Development

1. Install dependencies

```bash
npm install
```

2. Create `.env.local` as shown above

3. Start the dev server

```bash
npm run dev
```

Visit `http://localhost:3000`.

### Option 2: Production Build

1. Build the app

```bash
npm run build
```

2. Start the production server

```bash
npm run start
```

Ensure the same environment variables are configured on your hosting provider (e.g., Vercel project settings).


## 💡 Usage Notes

- The frontend expects HTTP-only auth cookies set by the backend. All fetches include credentials via `credentials: "include"`.
- On a 401 response, the client calls `${NEXT_PUBLIC_BASE_URL}/auth/refresh-token` to renew the session.
- Socket connections use `NEXT_PUBLIC_API_URL` and also include credentials. Ensure CORS allows them.

## 🧯 Troubleshooting

- **401 loops**: Confirm backend `/auth/refresh-token` exists, is reachable, and sets cookies for the correct domain.
- **Socket connection fails**: Verify `NEXT_PUBLIC_API_URL` is correct and Socket.IO CORS allows credentials.
- **Styles not applying**: Ensure Tailwind v4 is installed, and classes are present in `app/**/*.jsx/js` files.

## 🔐 Security Considerations (Frontend)

- Uses cookie-based auth; tokens should be HTTP-only and managed by the backend.
- All requests use `credentials: include` to avoid leaking cookies to wrong origins.
- Avoid logging sensitive data in the browser console.

## 📝 License

Proprietary – All rights reserved.
