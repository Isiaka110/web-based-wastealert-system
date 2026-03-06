# WasteAlert System

WasteAlert is an Integrated Waste Information Portal designed to connect citizens, administrative teams, and cleanup drivers for efficient waste incident management.

## 🚀 Getting Started

Follow these steps to set up and run the WasteAlert system on your local machine.

### 1. Prerequisites
Ensure you have the following installed and set up:
- **Node.js**: [Download and Install Node.js](https://nodejs.org/) (LTS version recommended).
- **MongoDB**: A running MongoDB instance. You can use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for a free cloud database.
- **Cloudinary**: A free account at [Cloudinary](https://cloudinary.com/) for image storage (used for waste incident reports).

### 2. Installation
1. Navigate to the project root directory:
   ```bash
   cd wastealert-system
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```

### 3. Environment Configuration
Create a `.env` file in the root of the `wastealert-system` folder and add the following configuration keys:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_random_secret_string
MONGO_URI=your_mongodb_connection_uri
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

> **Note:** Replace the placeholders with your actual MongoDB URI and Cloudinary credentials.

### 4. Running the Application Locally (Development)
This project is powered by **Vite** for blazing fast frontend bundling and **Express.js** for the backend API.

To start the Vite frontend development server:
```bash
npm run dev
```

In a separate terminal, to start the Express backend server:
```bash
npm start
```

### 5. First-Time Admin Setup
Before you can access the Management Console, you will need a central administrator account to authorize drivers and deploy cleanup units. We've included a script to securely create your first SuperAdmin on the database.

Run the following command in your terminal while your `.env` file is properly configured:
```bash
node createAdmin.js
```

This will automatically inject the following initial credentials:
- **Email:** `admin@wastealert.com`
- **Password:** `admin123`

*(Note: Ensure you change this password once logged in, or disable this script in production!)*

### 6. Accessing the System
Once your local servers are running, access the portals through your browser (usually via Vite's port, e.g., `http://localhost:5173` or similar displayed in your terminal).

- **Main Entry Portal**: `index.html`
- **Report an Incident**: `report.html`
- **Driver Portal**: `driver-auth.html`
- **Admin Panel**: `admin-login.html`

---

## 🌍 Vercel Deployment Workflow (Production)

This repository has been fully modularized and rigorously optimized to deploy automatically on **Vercel** with zero-configuration needed! It utilizes robust Serverless Functions for the Backend and Vite for constructing static distributions.

### **Deployment Steps:**
1. **Push your code to Git**: Commit and push your codebase to an online repository such as GitHub, GitLab, or Bitbucket.
2. **Import to Vercel**: 
   - Sign up or log into [Vercel](https://vercel.com).
   - Click **Add New...** > **Project** and import your freshly pushed repository.
3. **Configure Settings**: 
   - Vercel will automatically detect `Vite` for the frontend build structure (`npm run build`).
   - Open the **Environment Variables** section and meticulously paste all properties from your local `.env` file (`MONGO_URI`, `JWT_SECRET`, Cloudinary configurations, etc.).
4. **Deploy**:
   - Click the **Deploy** button.
   - Vercel will trigger the Vite bundler to securely compile your `public/` directory into a `dist/` folder via the `vercel.json` instructions.
   - Simultaneously, Vercel will seamlessly convert `api/index.js` into scalable, Serverless Lambda Functions for your backend API endpoints.

**Congratulations!** 🚀 Within a minute or two, your full-stack application will be live on a distinct Vercel domain ready for prime-time.

---

## 📂 Project Structure
- **/public**: Contains the frontend HTML, CSS, and client-side JavaScript.
- **/api**: Serverless entry point strictly configured for Vercel lambdas.
- **/dist**: Generated production build folder compiled securely by Vite.
- **/routes**: API endpoints for authentication, reports, trucks, and user management.
- **/models**: Mongoose schemas for MongoDB (User, Report, Truck).
- **/middleware**: Security and authentication logic (JWT verification).
- **/config**: Configuration files for Database pooling schemas and Cloudinary.
- **server.js**: Base Express server initialization structure.
- **vercel.json**: Configuration matrix defining serverless rewrites and dist outputs.
- **vite.config.js**: Vite ecosystem bundler properties explicitly targeting multiple HTML entry points.

## 🛠️ Technology Stack
- **Backend Architecture**: Node.js, Express.js (Serverless Ready)
- **Database**: MongoDB (Mongoose Pooling Enabled)
- **Authentication Framework**: JSON Web Tokens (JWT), Bcrypt Auth Hashing
- **File Storage Management**: Cloudinary (via Multer Buffer Arrays)
- **Frontend Architecture**: HTML5, Tailwind CSS, Vanilla JavaScript Module Federation
- **Bundler Compiler**: Vite Build Automation
