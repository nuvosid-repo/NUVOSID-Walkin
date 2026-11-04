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
src/app/walkthrough      serves uploaded model files
src/actions              Server Actions (auth, companies, users, projects)
src/components           ui, brand, auth, admin, portal, viewer
src/lib                  session, storage, model packaging, viewer tokens
prisma                   schema, seed and demo walkthrough
```

To add the real logo, edit `src/components/brand/logo.tsx`. It's the only place the brand mark is drawn.

## Deployment

Data lives in MongoDB, but uploaded 3D models and cover images are still on local disk, so the app needs a server with a persistent disk (a VPS, for example). On Vercel or other serverless hosts, uploads would be lost until they move to object storage (Vercel Blob, S3 or R2).

In MongoDB Atlas, allow the server's IP address under Network Access.

```bash
npm run build
npm start
```

Back up the MongoDB database and the `storage/` folder. Run behind HTTPS. If the site must run on plain HTTP for a while, set `COOKIE_SECURE="false"`, or login won't persist.
