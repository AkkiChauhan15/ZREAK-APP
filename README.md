# 🔥 Zreak: Social Habit Tracker

> **Build Habits. Wreck Your Friends.**

Zreak is a social accountability and habit-tracking platform designed to make self-improvement competitive. Track your daily goals, automate your developer streaks, and watch your friends succeed—or publicly shame them when they fail.

![Zreak Dashboard Preview](https://via.placeholder.com/800x400?text=Zreak+Dashboard+Preview) ## ✨ Core Features

### 🛡️ The Dashboard
* **Multi-Streak System:** Track fitness, reading, coding, and lifestyle habits in one place.
* **28-Day Heatmaps:** Visualize your intensity and consistency over the last month.
* **Ruthless Accountability:** Miss a day? Your streak resets to zero, and the squad is notified. Give up on a habit entirely? It gets broadcasted to the feed.

### 🤖 Auto-Sync Integrations
No manual check-ins required. Zreak connects to external APIs to verify your work automatically every midnight:
* **🐙 GitHub Auto-Sync:** Verifies daily `PushEvents` (code commits).
* **💻 LeetCode Auto-Sync:** Verifies daily accepted problem submissions via GraphQL.

### ⚔️ The Social Battlefield
* **Squad Building:** Search warriors by `@username` and send challenge requests.
* **Public Profiles:** Inspect your friends' active and broken streaks before accepting their challenges.
* **Live Motivation & Shame Feed:** A unified timeline showing real-time wins, broken streaks, and abandoned goals from everyone in your squad.

## 🛠️ Tech Stack

* **Frontend:** [Next.js 16](https://nextjs.org/) (App Router, React)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Backend/Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security)
* **Hosting & Automation:** [Vercel](https://vercel.com/) (Serverless Functions, Cron Jobs)

## 🚀 Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone [https://github.com/yourusername/zreak-app.git](https://github.com/yourusername/zreak-app.git)
cd zreak-app

2. Install dependencies
npm install

3. Set up Environment Variables

Create a .env.local file in the root directory and add the following keys:

Code snippet
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key # Required for Cron Jobs
CRON_SECRET=your_custom_secret_password # Protects the API route

4. Database Setup (Supabase)
You will need to run the master SQL script in your Supabase SQL Editor to generate the necessary tables (profiles, streaks, check_ins, friendships) and the automated trigger for user creation. (See supabase_schema.sql if included in the repo).

5. Run the development server

npm run dev
Open http://localhost:3000 with your browser to see the result.

⏰ How the Automated Engine Works
Zreak uses a Vercel Cron Job configured in vercel.json to trigger the /api/cron route every day at 11:50 PM UTC.

The server securely fetches all streaks marked with auto_sync_provider.

It hits the GitHub REST API and LeetCode GraphQL API to verify the user's activity for the day.

If successful, it securely updates the Supabase database using the Service Role Key, logging the check-in and bumping the streak count.

If the user failed to do the work, the Next.js frontend logic automatically marks the streak as "Reset" upon their next login.

📜 License
Distributed under the MIT License.

