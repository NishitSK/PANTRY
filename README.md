# Pantry Guardian 🥑

**Pantry Guardian** is a smart pantry inventory system designed to help you track expiration dates, reduce food waste, and manage your kitchen effortlessly. 

Built with **Next.js**, **MongoDB**, and **Tailwind CSS**, it keeps your inventory organized and ensures you never let good food go to bad use.

![Pantry Guardian Landing Page](/landing-bg-sketch.png)

### 🔗 [Live Demo](https://pantry123.vercel.app)

## 🚀 Key Features

- **Expiry Tracking**: Get notified before your ingredients expire. The dashboard highlights items nearing their use-by date.
- **Easy Scanning**: Quickly add items to your inventory. (Upcoming: Barcode and Receipt scanning).
- **Usage Insights**: Visualize your consumption habits to shop smarter and save money.
- **Smart Recipes**: Get recipe suggestions based on the ingredients you already have (Coming Soon).
- **Secure Authentication**: Sign in securely using Google or Email credentials via NextAuth without hassle.
- **Responsive Design**: precise and beautiful interface optimized for all devices, from desktop to mobile.

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **Database**: [MongoDB](https://www.mongodb.com/) (using [Mongoose](https://mongoosejs.com/))
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/pantry-guardian.git
    cd pantry-guardian
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add the following variables. You can use `.env.example` as a reference.

    ```env
    # Database (MongoDB connection string)
    DATABASE_URL="mongodb+srv://<username>:<password>@cluster.mongodb.net/pantry-guardian"

    # NextAuth Configuration
    # Generate a secret with `openssl rand -base64 32`
    NEXTAUTH_SECRET="your-super-secret-key"
    NEXTAUTH_URL="http://localhost:3000"

    # Google OAuth (For Google Sign-In)
    GOOGLE_CLIENT_ID="your-google-client-id"
    GOOGLE_CLIENT_SECRET="your-google-client-secret"
    
    # Weather API (Optional, for future features)
    WEATHER_API_KEY="your-openweathermap-api-key"
    
    # Google Gemini AI (Optional, for image analysis)
    GEMINI_API_KEY="your-gemini-api-key"
    ```

4.  **Seed the Database (Optional)**
    To populate the database with initial data:
    ```bash
    npm run seed
    ```

5.  **Run the Development Server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```
├── app/                  # Next.js App Router pages and layouts
│   ├── api/              # API Routes
│   ├── auth/             # Authentication pages (Login/Signup)
│   ├── dashboard/        # Main application dashboard
│   ├── settings/         # User settings
│   └── page.tsx          # Landing page
├── components/           # Reusable UI components
│   └── ui/               # Shadcn/UI compatible components
├── lib/                  # Utility functions and configurations
│   ├── auth.ts           # NextAuth configuration
│   └── db.ts             # Database connection logic
├── models/               # Mongoose models (User, InventoryItem, etc.)
├── public/               # Static assets (images, fonts)
└── scripts/              # Utility scripts (seeding, maintenance)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
