# TeachFlow v1.0.0 — Teachers' Day Edition

Personal teaching activity management workspace for Arabic and Iqra online lessons. Built on the validated v0.10.1 release. React + Vite, IndexedDB (Dexie), Wordwall oEmbed / iframe, local-first. No account or cloud database. All existing management, teaching, history, evaluation, bilingual themes, Teachers' Day greeting and 14-step tour remain.

## 1. Local update (Windows / VS Code)

1. Stop the old dev server (`Ctrl+C`), close other TeachFlow tabs. Do not clear site data. Keep the previous source folder.
2. Extract this ZIP to a separate folder and open the folder containing `package.json` in VS Code.
3. Use Node.js 22.12+ (22 LTS). Run:

```sh
npm install
npm test
npm run dev
```

Expected 80 passing unit tests. Open `http://localhost:5173/` in the same browser/profile as before. Strict port 5173; same origin, database TeachFlow, schema v3. No schema migration. A folder copy is not a data backup. Once ready, verify old records and download a JSON backup immediately. Keep the generated `package-lock.json` for deployment.

## 2. Data management

Settings → Backup & restore. Counts are real from the local workspace. JSON includes activities, collections, students, lessonPlans, teachingSessions (including evaluations and notes), and appearance preferences. Format `teachflow-backup`, version 1, schema 3. Tutorial seen state is per browser and is not imported, so a new recipient still sees the gift. A backup is an unencrypted private file, never commit or upload it to the website repository. Export records while running a session saves a paused snapshot at export time without pausing the live session. The timestamp refers to the start of a download, not proof it completed. Check your Downloads folder. The reminder appears on dashboard when workspace has records and there is no recorded download or the last was at least 7 days ago. It runs only while using the app. CSV includes activity metadata, not student records, and is not restorable. CSV uses UTF-8 BOM and quotes/formula-prefix protection.

Restore: close other TeachFlow tabs, end any open session in the destination, export its current data, choose a JSON file (max 25 MiB), inspect counts, optionally restore appearance, check confirmation, then Restore data. Restore replaces the whole workspace; no merge. Validation includes expected format/schema, IDs, live references, date/type checks, safe Wordwall embed URLs, and session state. Historical snapshots may refer to deleted source records. All five stores are cleared and repopulated in one IndexedDB transaction; on transaction failure, writes roll back. The workspace refreshes after commit; local preferences apply separately. Unknown fields are excluded and legacy optional fields get defaults. Only this backup format is supported, not arbitrary JSON or CSV. A running snapshot restores paused; Wordwall internal game progress is never backed up. A corrupt or incompatible file is rejected before writes.

Persistent storage is an optional browser request; the browser may deny it, and users can still clear storage. Clearing history removes all session records and their evaluations, but keeps library, students, collections and plans. Reset all learning data clears five stores, not app preferences or onboarding; both require confirmation and are blocked during open sessions. Independent profiles/devices/origins have independent data. No automatic sync or background backup.

## 3. Production build and verification

```sh
npm run build
npm run preview
```

Preview is `http://localhost:4173/`, a separate origin and database. Vite preview mounts the same local Wordwall API handler. Use an exported backup to test restore in a separate origin or browser profile; do not test destructive actions on irreplaceable data. Test full round trip, all counts, reference relationships, history notes, invalid files, replace confirmation and reset. Then return to localhost:5173 and retain the original backup.

## 4. Netlify (recommended Git deployment)

The source repository, not just `dist`, is required to deploy the oEmbed function. Netlify Drop of the static dist alone is insufficient for Smart Import. A private GitHub repository is recommended; this does NOT make the public website private. Do not commit any student backup, CSV, node_modules, .env, dist. `.gitignore` excludes standard generated filenames. Review staged files before committing. Use a private GitHub repository named `teachflow` (or your own name). In local terminal:

```sh
git init
git add .
git status
git commit -m "Release TeachFlow v1.0.0"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/teachflow.git
git push -u origin main
```

Replace YOUR-USERNAME and use the URL shown in your GitHub repository. If repository already exists, use its existing remote rather than reinitializing. Git authentication is handled by GitHub, not TeachFlow. You can also upload project source through GitHub's UI (include hidden config files and package-lock.json).

On Netlify dashboard → Add new project / Import from Git → GitHub → select repo → deploy main. Root/base directory blank (project root). `netlify.toml` contains build command `npm test && npm run build`, publish directory `dist`, functions directory `netlify/functions`, Node 22. No environment secrets are required. The native function config routes `/api/wordwall` and sets 30 requests per 60 seconds per IP/domain; verify the deploy log post-processing rate limit rule is accepted. Platform limits/credits depend on account. Endpoint remains publicly accessible, no authentication; rate limit reduces abuse, does not guarantee cost control. If rejected by platform, review rate-limit docs before public sharing. Native route is defined in function config rather than the old redirect. The function only requests the fixed official oEmbed endpoint, with URL validation and timeout.

Check deployed site on HTTPS. In a new browser profile, confirm first-time greeting and tour. Import a known public Wordwall URL, play a game, test fullscreen and audio in Zoom, check console for CSP violations. The API should return JSON rather than a static page. Test actual site in the browser; static preview does not validate Netlify function configuration. Verify Netlify deploy log for function bundling and the rate limit configuration. Then set desired site name before importing data. Changing the domain later changes the storage origin. Keep a fixed production domain and do not use deploy-preview links as the permanent teaching workspace.

## 5. Transfer to the production domain

On localhost:5173, Settings → Download JSON backup. Save file privately. On stable Netlify domain, use same or teacher's own browser, open gift and guide, Settings → choose JSON → preview → confirm restore. Check all counts, student associations, playlist order, history and evaluation. Recipient can start with an empty library instead if desired. No need to commit or upload the backup to hosting. If transferring personal data to another teacher, only transfer data they are authorized to use. The app is accessible via public URL; actual local data is accessible to anyone using the same browser profile. `noindex` discourages indexing, does not make the site private.

## 6. Final acceptance checklist

- [ ] 80 unit tests pass; local dev and production build work.
- [ ] Old activity, collections, students, plans, and history remain at localhost:5173.
- [ ] JSON export downloads; inspect counts and timestamps.
- [ ] CSV opens in spreadsheet and displays Arabic correctly.
- [ ] Round-trip restore in separate profile/origin preserves references, preferences, evaluations, archived records.
- [ ] Invalid file/unknown schema/invalid embed fails without altering existing data.
- [ ] Cancel restore has no effect; confirmation required to replace.
- [ ] Restore/reset/clear history blocked when a session is open; running backup resumes from paused snapshot.
- [ ] Clear history only removes history; reset clears all five tables; test with disposable data.
- [ ] Backup reminder and persistent storage request show meaningful feedback.
- [ ] ID/EN, light/dark/system, mobile, first-time gift, tutorial replay, player alignment remain correct.
- [ ] All existing CRUD, search, playlists, teaching controls, history/evaluation work.
- [ ] Production Netlify build succeeds; rate-limit config accepted in log.
- [ ] Live Smart Import, manual iframe, fullscreen, Zoom and audio work on HTTPS domain.
- [ ] Production backup restore succeeds; data stays on refresh; fixed final URL is ready to share.

## 7. Verification in authoring environment

80/80 Node unit tests (63 existing + 17 backup tests) passed. JavaScript/JSX syntax and relative imports checked with TypeScript parser. Netlify TOML parsed. npm dependencies could not be installed from offline cache (`ENOTCACHED`); build failed because vite was unavailable. Browser rendering, real Dexie transactions and recovery, deployment, rate limit enforcement and external integration require user-side verification. No Netlify account/project was created or deployed. No package lock generated here; generate with npm install, commit it. This is a release candidate until acceptance testing succeeds.

Netlify documentation: https://docs.netlify.com/start/quickstarts/deploy-from-repository/ ; https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/ ; https://docs.netlify.com/build/functions/api/
