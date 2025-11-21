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

Try out the Android release on your mobile device or an emulator.

> **📱 Download the Beta**
> The latest `.apk` file is available on the **[Releases Page](https://github.com/dannyharani/PM-Calories-Tracker/releases)**.
>
> *Please check the release notes for installation instructions.*

## 🧪 Beta Testing (iOS)

**Note Regarding iOS Support**

Support for the iOS platform is a development priority. Future iOS beta versions will be distributed via Apple's TestFlight platform.

**Found a bug?**
Please submit a **[New Issue](https://github.com/dannyharani/PM-Calories-Tracker/issues)** in this repository. All feedback is invaluable!

---

## 🛠️ Development Setup

Ready to contribute? Follow the steps below to get the project running locally.

### Prerequisites
Before you begin, ensure you have the following installed and configured. Where useful, example commands are provided for macOS / Linux (bash) and Windows PowerShell.

* **Node.js (LTS recommended)**
	- Install: download the installer from the official website and follow the platform instructions:
		- https://nodejs.org/
	- Optional (macOS/Linux): use nvm to manage Node versions: https://github.com/nvm-sh/nvm
	- Optional (Windows): use nvm-windows: https://github.com/coreybutler/nvm-windows
	- Verify installation:
		```bash
		node -v
		npm -v
		```

* **Expo CLI** (for development and the Metro bundler)
	- Install globally via npm (or use `npx`/`corepack` if you prefer not to install globally):
		```bash
		npm install -g expo-cli
		```
	- Docs: https://docs.expo.dev/
	- Verify:
		```bash
		expo --version
		```

* **AWS Amplify CLI** (to pull the backend config and deploy when needed)
	- Install globally via npm:
		```bash
		npm install -g @aws-amplify/cli
		```
	- After installation, configure Amplify with your AWS account (this opens a browser to sign in and will guide you to create an IAM user):
		```bash
		amplify configure
		```
	- Docs & guide: https://docs.amplify.aws/cli
	- Verify:
		```bash
		amplify --version
		```

Notes (Only if you plan on contributing):
- You will need an AWS account to run `amplify pull` (the app uses Amplify-managed backend resources). If you don't have one, create one at https://aws.amazon.com/.
- On Windows, run the PowerShell prompt as Administrator for global npm installs if you run into permission issues, or use a Node version manager like nvm-windows.
- If you prefer not to install global CLIs, you can use `npx expo start` and `npx @aws-amplify/cli <command>` to run them via npx.

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

# Or try:
npx expo start --dev-client
```

This will launch the Expo Metro bundler. Simply scan the **QR code** using the **Expo Go** app on your physical device (or run on an emulator) to start the app.

*Note: for a quick check without the need of an emulator or external device, consider using the web option by pressing `w` on the expo terminal. Keep in mind not all options may be compatible for web. **Although photo upload will seem to work on web, it will not.***
