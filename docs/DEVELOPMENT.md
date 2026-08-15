# ROKDA DEVELOPMENT GUIDE

## Setup & Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and configure Supabase credentials (optional for offline testing):
   ```bash
   cp .env.example .env
   ```

3. **Start Expo Development Server**:
   ```bash
   npx expo start
   ```

4. **Run Unit & Concurrency Tests**:
   ```bash
   npm test
   ```

5. **Load Sample Dataset**:
   In app, navigate to **More > Load Demo Sample Data** to automatically populate demo accounts, salary, rent, groceries, and savings goals.
