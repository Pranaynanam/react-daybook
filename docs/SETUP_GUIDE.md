# Daybook — setup guide (VS Code → GitHub → Netlify)

You will do this in four parts. Part 1 takes about 15 minutes. Parts 2–3 about 20 minutes.

1. Run the app on your computer (VS Code)
2. Put the code on GitHub
3. Publish it on Netlify (so everyone can use it)
4. Finish in Supabase (one-time settings)

Everything you type into a terminal is shown in `grey code blocks`. You never need to understand them — just copy, paste, press Enter.

---

## Part 1 — Run it on your computer

### 1.1 Install three free programs
| Program | Where | Notes |
|---|---|---|
| **Node.js 22 (LTS)** | https://nodejs.org | Download the "LTS" installer, click Next through everything |
| **Git** | https://git-scm.com/downloads | Click Next through everything (default choices are fine) |
| **VS Code** | https://code.visualstudio.com | You probably have this already |

Restart your computer afterwards (it makes the new programs available to VS Code).

Check it worked: open VS Code → menu **Terminal → New Terminal** and type:
```
node -v
git --version
```
Both should print a version number (Node must be **20.19 or higher**; 22 is best).

### 1.2 Open the project
1. Extract the zip file anywhere easy, e.g. `Documents\daybook`.
   Make sure you open the folder that **directly contains** `package.json` and `src` (not a folder inside a folder).
2. In VS Code: **File → Open Folder…** → choose that `daybook` folder → **Yes, I trust the authors**.
3. VS Code may suggest recommended extensions — click **Install** (optional but helpful).

### 1.3 See it working with sample data (no database needed)
In the VS Code terminal (**Terminal → New Terminal**):
```
npm install
npm run demo
```
Wait for `Local: http://localhost:5173/`, then hold **Ctrl** and click that link. You will see Daybook with sample people and data.
Stop it any time with **Ctrl + C** in the terminal.

### 1.4 Connect it to your real database
1. In the file list on the left, find `.env.example`. Right-click → **Copy**, then right-click in the empty space → **Paste**, and rename the copy to exactly **`.env`**.
2. Open `.env` and replace the two values:
   - `VITE_SUPABASE_URL` → Supabase → **Project Settings → API → Project URL** (ends in `.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` → the **anon public** key on the same page (a very long text starting with `eyJ`)
   - No quotes, no spaces, nothing after the value. Save the file (Ctrl+S).
3. Run:
   ```
   npm run dev
   ```
4. Open the link. You should now see the real sign-in screen.

> The `.env` file holds your keys. It is **not** uploaded to GitHub (it is ignored on purpose). Never paste its contents into chats or emails you don't trust.

---

## Part 2 — Put the code on GitHub

GitHub is where the code is stored safely, with a history of every change. Netlify will publish from it.

### 2.1 One-time Git introduction (tells Git who you are)
In the VS Code terminal, using your own name and email:
```
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### 2.2 Create an empty repository on GitHub
1. Sign in (or sign up) at https://github.com.
2. Click **+** (top right) → **New repository**.
3. Name it `daybook`. Choose **Private** (recommended — only people you invite can see the code).
4. **Do not** tick "Add a README", ".gitignore" or a licence — leave them empty.
5. Click **Create repository**. Keep the page open — you need the address it shows, like
   `https://github.com/YOUR-NAME/daybook.git`.

### 2.3 Upload your project
In the VS Code terminal (replace the address with yours):
```
git init
git add .
git commit -m "First version of Daybook"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/daybook.git
git push -u origin main
```
- The first `git push` opens a browser window asking you to sign in to GitHub — approve it.
- Refresh the GitHub page. You should see your files (`src`, `database`, `docs`, …).
- **Check:** you must **not** see a file called `.env` on GitHub. (You should see `.env.example` — that one is safe.)

### 2.4 Your everyday routine after changing something
**Using the buttons** (easiest): click the **Source Control** icon (branch symbol) on the left bar → type a short message like "Fix holiday label" → click **Commit** → click **Sync Changes**.

**Or in the terminal:**
```
git add .
git commit -m "Describe what you changed"
git push
```

---

## Part 3 — Publish on Netlify

### 3.1 Connect the repository
1. Sign in at https://app.netlify.com (use "Sign in with GitHub" — simplest).
2. **Add new site → Import an existing project → GitHub**. Allow Netlify to access your `daybook` repository when asked.
3. Pick the `daybook` repository. The build settings fill in by themselves (they come from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Before clicking Deploy**, open **Add environment variables** (or after: **Site configuration → Environment variables**) and add two:

   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | your Project URL |
   | `VITE_SUPABASE_ANON_KEY` | your anon public key |

   Type the keys exactly as written, in capitals.
5. Click **Deploy**. After about a minute you get a link like `https://something.netlify.app`.

> If you added the variables **after** the first deploy: go to **Deploys → Trigger deploy → Clear cache and deploy site**. The keys are only picked up when the site is rebuilt.

### 3.2 Already have a Netlify site (e.g. `daybooksysintelli31`)?
You can keep the same link. Open the site → **Site configuration → Build & deploy → Continuous deployment → Link repository** → choose GitHub → `daybook` → branch `main`. Then add the two environment variables (3.1 step 4) and trigger a deploy.

### 3.3 From now on, publishing is automatic
Every time you push to GitHub (2.4), Netlify rebuilds and publishes the new version in about a minute. No more drag-and-drop.
Open **Deploys** in Netlify to watch progress. If a build fails, click it to see the red error — send it to whoever helps you with the code.

---

## Part 4 — Finish in Supabase (one time)

1. **Database tables.** Supabase → **SQL Editor → New query**:
   - Brand-new project → paste all of `database/01_fresh_install.sql` → **Run**.
   - Existing Daybook project → paste all of `database/02_upgrade_existing_database.sql` → **Run**.
   You should see "Success".
2. **Managers.** Table Editor → `manager_emails` → **Insert row**: add each manager's email and their display name (e.g. `Bhagyaraj`).
   Add your HR person here too — only people listed can upload holidays.
3. **Allow your site address for sign-in links.** Supabase → **Authentication → URL Configuration**:
   - **Site URL** = your Netlify link (e.g. `https://daybooksysintelli31.netlify.app`)
   - **Redirect URLs** → add the same link, and also `http://localhost:5173` if you want sign-in to work while testing on your computer.
4. Open your Netlify link, sign in with your email, and set up your profile.

---

## Troubleshooting

| What you see | What to do |
|---|---|
| `'npm' is not recognized` | Node.js isn't installed (or you haven't restarted). Install it, restart the computer, open a new terminal. |
| `npm install` shows red text about the Node version | Install Node 22 LTS from nodejs.org. |
| Page is blank after deploy | Open the browser console (F12 → Console) and read the red message. Most often the two environment variables are missing or have a typo — fix them in Netlify and trigger a new deploy. |
| Yellow notice "Database not connected yet" | The two `VITE_…` values are missing. Locally: check `.env`. Live: check Netlify environment variables, then redeploy. |
| "That sign-in link expired or was already used" | Links work once and expire quickly. Request a fresh one and open it right away, in the same browser. |
| Sign-in link opens `localhost` or the wrong address | Fix **Site URL** and **Redirect URLs** (Part 4, step 3). |
| "Could not save … permission denied" | The SQL in Part 4 step 1 wasn't run, or your email isn't in `manager_emails` (for managers/holidays). |
| Git asks for a password and fails | Use the browser sign-in that VS Code offers; GitHub no longer accepts account passwords in the terminal. |
| `git push` says "rejected" | Someone changed the repository first. Run `git pull`, then `git push` again. |

## Good habits
- Work on the code in VS Code, test with `npm run dev`, **then** push. Netlify only ever publishes what's on GitHub.
- Make small commits with clear messages — it makes it easy to undo a mistake.
- Every month, download the timesheet CSVs (Supabase's free plan has no automatic backups).
