# LeetCode AI Mentor (LeetMentor)

An extension that acts as a Socratic AI mentor for LeetCode problems. It guides users step-by-step through brute force, better, and optimal approaches, using the Gemini API for non-solution guidance. The extension includes visualization, adjustable guidance levels, and a settings page for API key management.

## Features
- Injects a chatbot UI into LeetCode problem pages
- Guides users through Brute Force, Better, and Optimal approaches
- Socratic, step-by-step, non-solution guidance (no direct answers)
- Evaluate and visualize each approach with a dedicated button
- Prompts user to write code on LeetCode after all stages
- Adjustable guidance levels: Beginner, Intermediate, Advanced
- Settings page for Gemini API key and preferences

## Project Structure
```
Leetcode AI/
├── src/
│   ├── content.js         # Content script (main logic)
│   ├── background.js      # Background script
│   ├── popup.js           # Popup script
│   └── options.js         # Options/settings script
├── public/
│   ├── popup.html         # Popup HTML
│   └── options.html       # Options/settings HTML
├── assets/
│   ├── chatbot.css        # Chatbot UI styles
│   ├── popup.css          # Popup styles
│   └── options.css        # Options styles
├── icons/                 # Extension icons (add your icons here)
├── .env                   # Environment variables (not committed)
├── .gitignore             # Ignore .env, node_modules, build, etc.
├── manifest.json          # Extension manifest
├── README.md              # This documentation
└── ...
```

## Setup & Installation
1. Clone or download this repository.
2. Add your Gemini API key to the extension settings after installation, or set it in `.env` (for development only).
3. Add your extension icons to the `icons/` folder.
4. Load the extension in your browser:
   - Go to your browser's extensions page (e.g., `chrome://extensions/`)
   - Enable Developer mode
   - Click "Load unpacked" and select this project folder
5. Open any LeetCode problem page to use the AI mentor.

## Development
- Main logic is in `src/content.js`.
- UI assets are in `assets/`.
- HTML for popup and options/settings is in `public/`.
- Update `manifest.json` to reference correct paths if you move files.

## Environment Variables
- `.env` is used for local development only. The extension stores the Gemini API key in browser storage for runtime use.
- Example:
  ```
  GEMINI_API_KEY=your-key-here
  ```

## Guidance Levels

The extension offers three guidance levels to match your experience and needs:

- **Beginner:** The AI provides detailed, step-by-step hints, asks simpler questions, and offers more scaffolding to help you understand the problem-solving process.
- **Intermediate:** The AI offers moderate guidance—less hand-holding than Beginner, but still provides helpful hints and questions to nudge you toward the solution.
- **Advanced:** The AI gives minimal guidance, focusing on high-level questions and encouraging independent problem-solving. Hints are less explicit, and you are expected to do more reasoning on your own.

You can adjust the guidance level in the extension's settings page at any time.

## License
MIT
