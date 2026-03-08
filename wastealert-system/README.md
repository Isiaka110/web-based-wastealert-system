# 🗑️ WasteAlert: Integrated Waste Management Portal

WasteAlert is a premium, full-stack environmental management system designed to streamline the reporting, tracking, and clearance of waste incidents. It connects citizens (Reporters), Administrative Managers, and Field Operators (Drivers) into one synchronized ecosystem.

---

## 🛠️ Technology Stack

### **Backend (The Engine)**
*   **Node.js & Express.js**: High-performance server architecture optimized for serverless deployment.
*   **MongoDB & Mongoose**: Scalable NoSQL database with strict schema validation and relationship modeling.
*   **JWT (JSON Web Tokens)**: Secure, stateless authentication for cross-dashboard session management.
*   **Bcrypt.js**: Industry-standard salted hashing for password security.
*   **Cloudinary SDK**: Cloud-native image processing and storage for incident proof.
*   **Multer-Storage-Cloudinary**: Direct stream-to-cloud file handling (buffer-free).

### **Frontend (The Experience)**
*   **Vite 7.0**: Modern, lightning-fast build tool for bundling modules.
*   **Tailwind CSS**: Utility-first CSS framework for responsive, high-performance UI components.
*   **jQuery 3.6**: Efficient DOM manipulation and AJAX handling for real-time dashboard updates.
*   **FontAwesome 6.0**: Premium iconography for intuitive navigation.
*   **Google Fonts (Plus Jakarta Sans)**: Modern typography for a premium layout.

---

## 📂 Navigation & User Guide

The platform is divided into three distinct zones based on your role:

### 1. **Public Reporter (No Login Required)**
**URL**: `/report.html`
*   **The Goal**: Allow any citizen to report a waste incident.
*   **Navigation**:
    1.  Select **State** and **LGA** using the dynamic dropdowns.
    2.  Write a specific **Landmark Description** (e.g., "Opposite the main market gate").
    3.  Upload **Photo Proof** (Required).
    4.  Submit to alert the management team.

### 2. **Administrative Console (Management)**
**URL**: `/admin-login.html` -> `/admin-dashboard.html`
*   **The Goal**: Monitor the city, manage the fleet, and deploy resources.
*   **Navigation**:
    *   **Overview Tab**: See real-time stats (Pending vs. Active cases).
    *   **Pending Tasks**: Click "Deploy Unit" to assign a verified truck to a report.
    *   **Fleet & Drivers Section**: Verify new driver signups and inspect truck specifications.
*   **Privileges**: Full CRUD on reports, authorization of operators, and system-wide tracking.

### 3. **Fleet Operator Portal (Drivers)**
**URL**: `/driver-auth.html` -> `/driver-dashboard.html`
*   **The Goal**: Receive tasks, navigate to locations, and confirm cleanup.
*   **Navigation**:
    *   **Operations Tab**: View tasks assigned to you by the Admin.
    *   **Task Card**: Click "Confirm Pickup" when starting.
    *   **Clearance**: Click "Report Disposal" once the waste is cleared to reset your truck to "Available."
*   **Privileges**: Personal profile management, truck registration, and task lifecycle updates.

---

## 🔐 Logins & Privileges

| Role | Access URL | Default Login ID | Default Password | Key Privileges |
| :--- | :--- | :--- | :--- | :--- |
| **SuperAdmin** | `/admin-login.html` | `SuperAdmin` | `admin123` | Verify Drivers, Deploy Trucks, View All Reports |
| **Driver** | `/driver-auth.html` | *(User Registered Email)* | *(User Password)* | View Assigned Tasks, Update Status, Log Clearances |
| **Reporter** | `/report.html` | Public | N/A | Submit New Reports with Photos |

---

## 🚀 Getting Started

### 1. Installation
```bash
git clone <repo-url>
cd wastealert-system
npm install
```

### 2. Setup Environment Variables
Create a `.env` file in the root:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=any_strong_secret_key
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### 3. Initialize the Admin
Run this once to create your management account:
```bash
node createAdmin.js
```

### 4. Direct Entry (Development)
To start the full system (Server + Frontend):
```bash
npm start
```
Go to: **`http://localhost:5000`**

---

## 🌍 Deployment (Vercel)

This project is **Vercel-Optimized**. Simply push to GitHub and import the project. Vercel will:
1.  Run `npm run build` using the `vite.config.js`.
2.  Serve the `dist` folder as the frontend.
3.  Execute `api/index.js` as the backend entry point.

---
*Created by Google Deepmind Advanced Agentic Coding Team* 🚀
