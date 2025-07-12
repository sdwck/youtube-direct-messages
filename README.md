![YouTube DM Icon](./icons/icon128.png)

A browser extension that seamlessly integrates a private messaging system directly into the YouTube interface. Chat with other users without leaving the site.

## Features

- **Direct Messaging:** Chat one-on-one with any other user of the extension.
- **Real-time & Secure:** Built on Firebase Firestore for fast, reliable, and secure message delivery.
- **YouTube Integration:** The chat panel is designed to feel like a native part of the YouTube UI.
- **Rich Media Sharing:** Share links to YouTube videos, which are automatically converted into beautiful, clickable previews.
- **Shareable Profile Links:** Easily invite others to chat by sharing a unique link.
- **Unread Message Notifications:** A subtle dot on the DM icon lets you know when you have new messages.
- **Lazy Loading:** Message history is loaded in batches for optimal performance, even in long conversations.

## Installation

1.  Clone this repository or download it as a ZIP file.
2.  Run `npm install` to install the required development dependencies.
3.  Run `npm run build` to compile the source code and create the `dist` folder.
4.  Open Google Chrome and navigate to `chrome://extensions`.
5.  Enable "Developer mode" using the toggle in the top right corner.
6.  Click "Load unpacked" and select the `dist` folder from this project.
7.  The YouTube DM icon will appear in the top right corner of the YouTube header.

## Tech Stack

- **TypeScript:** For robust, type-safe code.
- **Firebase:**
    - **Firestore:** Real-time NoSQL database for storing chats and messages.
    - **Authentication:** Secure Google Sign-In for user management.
- **Webpack:** To bundle and optimize the extension's source code.

## How to Use

- **Login:** Click the DM icon and sign in with your Google account.
- **Start a Chat:** Get a user's unique ID (UID) and start a new conversation. You can get your own UID by clicking "Copy My Link" and examining the URL.
- **Share:** Use the "DM" option in YouTube's native "Share" menu to send videos directly to your contacts.

---