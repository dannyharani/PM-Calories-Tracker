# 📸 Calorie Tracking App: AI-Powered Nutrition Tracker

**Snap a picture. Track your macros. Hit your goals.**

This is a cross-platform mobile application (iOS & Android) designed to simplify nutrition tracking. By leveraging a multimodal AI model, the app analyzes photos of your meals to provide instant nutritional estimates, including calories, protein, carbohydrates, and fat.

---

## 🚀 How It Works & Tech Stack

The frontend is built for speed and portability using **React Native (Expo)**, while the robust backend is powered by **AWS Amplify**.

### Architecture Highlights
* **Frontend:** React Native (Expo)
* **Backend Orchestration:** AWS Amplify
* **Authentication:** Amazon Cognito
* **Storage & Database:** Amazon S3 (Images) & DynamoDB (User Data)
* **AI & Compute:** AWS Lambda triggers **Anthropic Claude 3 Haiku** (Multimodal AI) for image analysis upon S3 upload.

---

## 🧪 Beta Testing (Android)

We are currently in the Beta phase for Android! Your feedback is crucial to making this app better.

> **📱 Download the Beta**
> The latest `.apk` file is available on the **[Releases Page](https://github.com/dannyharani/PM-Calories-Tracker/releases)**.
>
> *Please check the release notes for installation instructions and specific features we need you to test.*

## 🧪 Beta Testing (iOS)

**Note Regarding iOS Support**

Support for the iOS platform is a development priority. Future iOS beta versions will be distributed via Apple's TestFlight platform.

**Found a bug?**
Please submit a **[New Issue](https://github.com/dannyharani/PM-Calories-Tracker/issues)** in this repository. All feedback is invaluable!

---

## 🛠️ Development Setup

Ready to contribute? Follow the steps below to get the project running locally.

### Prerequisites
Before you begin, ensure you have the following installed:
* **Node.js** (LTS version recommended)
* **Expo CLI**
* **AWS Amplify CLI**

### 1. Clone the Repository
Get the code to your local machine:

```bash
git clone https://github.com/dannyharani/PM-Calories-Tracker.git
cd PM-Calories-Tracker
```

### 2. Install Dependencies
Install the necessary frontend packages:

```bash
npm install
```

### 3. Connect to AWS Amplify
To sync your local environment with the deployed AWS resources (API keys, Auth settings, etc.), you need to pull the backend configuration.

*Note: This requires an AWS account with the appropriate permissions.*

```bash
amplify pull
```
*This command will open your browser, prompt you to log in to the AWS Amplify Console, and automatically configure your local project.*

### 4. Run the Application
Once the dependencies are installed and the backend is connected, start the Expo development server:

```bash
npm start
```

This will launch the Expo Metro bundler. Simply scan the **QR code** using the **Expo Go** app on your physical device (or run on an emulator) to start the app.