
# WiseOwl Installation Guide

Follow these steps to set up and run the WiseOwl program:

---

## Step 1: Install Required Libraries
Ensure you have Node.js installed. Run the following command to install necessary dependencies:

```bash
npm install
```

---

## Step 2: Create the Database
Create a database named **`wiseowl`** by importing the provided SQL file:

```bash
mysql -u [username] -p [database_name] < ./src/database/wiseowl.sql
```

**Recommendation:** Use the name `wiseowl` for consistency.

---

## Step 3: Set Up Language Execution Environments
Install and configure the necessary environments to execute code in the following languages:

- **C++**
- **Java**
- **Pascal**
- **Python**

Refer to official documentation for each language if additional setup is required.

---

## Step 4: Create a `.env` File
Create a `.env` file in the root directory with the following content:

```env
PORT=8080

# secret
SESSION_SECRET=your-session-secret

# jwt
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# email
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password

# google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# facebook
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# github
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

CALLBACK_URL=http://localhost:8080/auth/callback
```

**Note:** Replace `your-*` values with your actual credentials.

---

## Step 5: Run the Program
Start the application by running:

```bash
npm start
```

The program will be accessible at `http://localhost:8080`.

---

**Note:** For troubleshooting, ensure that your `.env` file and database setup are correctly configured.
