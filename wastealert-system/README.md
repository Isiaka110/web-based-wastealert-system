# WasteAlert System

WasteAlert is an Integrated Waste Information Portal designed to connect citizens, administrative teams, and cleanup drivers for efficient waste incident management.

## 🚀 Getting Started

Follow these steps to set up and run the WasteAlert system on your local machine.

### 1. Prerequisites
Ensure you have the following installed and set up:
- **Node.js**: [Download and Install Node.js](https://nodejs.org/) (LTS version recommended).
- **MongoDB**: A running MongoDB instance. You can use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for a free cloud database or install MongoDB locally.
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

### 4. Database Setup
- If using **MongoDB Atlas**, whitelist your IP address and copy the connection string into the `MONGO_URI` field in your `.env` file.
- If using **Local MongoDB**, your URI will typically be `mongodb://localhost:27017/wastealert`.

### 5. Running the Application
Start the backend server using the following command:
```bash
npm start
```
The server will initialize and connect to your database. You should see a message: `🚀 Server running on port 5000`.

### 6. Accessing the System
Once the server is running, you can access the different portals through your web browser:

- **Main Entry Portal**: [http://localhost:5000/public/index.html](http://localhost:5000/public/index.html)
- **Report an Incident**: [http://localhost:5000/public/report.html](http://localhost:5000/public/report.html)
- **Driver Portal**: [http://localhost:5000/public/driver-auth.html](http://localhost:5000/public/driver-auth.html)
- **Admin Panel**: [http://localhost:5000/public/admin-login.html](http://localhost:5000/public/admin-login.html)

---

## 📂 Project Structure
- **/public**: Contains the frontend HTML, CSS, and client-side JavaScript.
- **/routes**: API endpoints for authentication, reports, trucks, and user management.
- **/models**: Mongoose schemas for MongoDB (User, Report, Truck).
- **/middleware**: Security and authentication logic (JWT verification).
- **/config**: Configuration files for external services like Cloudinary.
- **server.js**: Entry point for the Node.js/Express application.

## 🛠️ Technology Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JSON Web Tokens (JWT), Bcrypt
- **File Storage**: Cloudinary (via Multer)
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
