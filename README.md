# Retail POS System

This is a simple guide on how to get the Retail Point of Sale (POS) system running on your computer.

## Getting Started

Follow these steps:

### 1. Install Required Software (if you haven't already)

*   **Node.js:** This program needs Node.js to run. If you don't have it, download and install it from [nodejs.org](https://nodejs.org/). It comes with `npm` (Node Package Manager), which we'll use next.

### 2. Install Project Dependencies

*   Open your computer's terminal or command prompt.
*   Navigate to the project's main folder (the one containing the `package.json` file). You can usually do this using the `cd` command (e.g., `cd C:\Users\YourName\Desktop\POS-SystemTeamCursor`).
*   Once you are in the correct folder, type the following command and press Enter:
    ```bash
    npm install
    ```
*   This command reads the `package.json` file and downloads all the necessary bits of code (called dependencies) the project needs to work. Wait for it to finish.

### 3. Start the Program (Development Mode)

*   After `npm install` is complete, stay in the same terminal/command prompt window and the same project folder.
*   Type the following command and press Enter:
    ```bash
    npm run dev
    ```
*   This command starts a local web server. You'll see some messages in the terminal, and one of them will likely tell you where the application is running, usually something like `http://localhost:5173/`.
*   Open your web browser (like Chrome, Firefox, or Edge) and go to that address.

You should now see the POS system running in your browser!

### Stopping the Program

*   To stop the program, go back to the terminal/command prompt window where you ran `npm run dev` and press `Ctrl + C`. 