# NUVOSID Walkthrough Portal

Admin portal and client portal for sharing interactive 3D property walkthroughs. Next.js 16, Prisma with MongoDB, Tailwind CSS 4.

- **Admin** (`/admin`): add builder companies, create user logins, enter property details, upload 3D models.
- **Client** (`/login`): sign in with the shared user ID and passcode, see the company's projects as cards, open a 3D model.

## Setup

```bash
npm install
cp .env.example .env     # set DATABASE_URL, AUTH_SECRET and ADMIN_PASSWORD
npm run setup            # creates the indexes, the admin and the demo client
npm run dev
```

Open http://localhost:3000/admin/login for admin, or http://localhost:3000/login for clients.

`npm run setup` also adds a demo client (`crystal.demo`) with the Crystal Heights walkthrough. Delete its company from the admin panel when it's no longer needed.

## Uploading a 3D model

On a project's page, under **3D model**:

| Walkthrough | How to upload |
|---|---|
| All code is in one HTML page | Paste the code, or upload the `.html` file |
| It loads other files (`three.module.js`, audio, textures) | Upload everything as a `.zip` with `index.html` inside |

Files must link to each other with relative paths (`./three.module.js`, not `/three.module.js`). If a pasted page needs files that weren't uploaded, the admin panel names them.

A model can be up to 200 MB. Models and cover images are stored in MongoDB, split into 3 MB chunks so each upload request stays under Vercel's 4.5 MB limit. Atlas's free cluster holds 512 MB in total, so watch its storage as models are added.

## Security model

- Client passcodes are checked against a bcrypt hash. An AES-256-GCM copy is also stored so admins can view them; its key comes from `AUTH_SECRET`, so anyone with both the database and `.env` can read them, and changing `AUTH_SECRET` makes the copies unreadable. Keep backups of the two apart. The admin password is stored only as a hash.
- Admin and client sessions use separate cookies, so both can stay signed in at once in one browser.
- Sessions and viewer links are re-checked against the database on each request. Deactivating a user, resetting a passcode or hiding a project takes effect at once.
- Uploaded HTML runs in a sandboxed iframe with an opaque origin, so it can't read portal cookies or call portal APIs. It can still load scripts from a CDN.
- Login attempts are rate limited in memory, which assumes one server process.

## Project layout

```
src/app/(portal)         client project cards
src/app/(viewer)         client 3D viewer
src/app/admin            admin login, panel and preview
src/app/walkthrough      serves 3D model files from MongoDB
src/actions              Server Actions (auth, companies, users, projects)
src/components           ui, brand, auth, admin, portal, viewer
src/lib                  session, model checks, viewer tokens
prisma                   schema, seed and demo walkthrough
```

To add the real logo, edit `src/components/brand/logo.tsx`. It's the only place the brand mark is drawn.

## Deployment

All data, including 3D models and cover images, lives in MongoDB, so the app runs on Vercel or any Node.js server.

1. In MongoDB Atlas, allow the server's IP address under Network Access. Vercel has no fixed IP, so it needs `0.0.0.0/0`.
2. Run `npm run setup` once from your machine, with `.env` pointing at the production database.
3. On the host, set `DATABASE_URL` and `AUTH_SECRET`. Use the same `AUTH_SECRET` as step 2, or saved passcodes can't be viewed.

```bash
npm run build
npm start
```

Back up the MongoDB database. Run behind HTTPS. If the site must run on plain HTTP for a while, set `COOKIE_SECURE="false"`, or login won't persist.
