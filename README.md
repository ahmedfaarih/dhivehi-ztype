# ދިވެހި ޓައިޕް | Dhivehi Type

A fast-paced typing game for practicing Dhivehi (Thaana) script, inspired by classic typing games like ZType. Test your Dhivehi typing skills by destroying enemy ships before they reach the bottom!

![Dhivehi Type Game](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🎮 About

Dhivehi Type is an educational typing game designed to help users improve their Dhivehi/Thaana typing speed and accuracy. Enemy ships fall from the top of the screen with Dhivehi words - type the words to destroy them before they reach the bottom!

## ✨ Features

- **📝 Phonetic Input**: Type English letters and they automatically convert to Thaana using [JTK (Javascript Thaana Keyboard)](https://github.com/jawish/jtk)
- **🎯 Progressive Difficulty**: 3 difficulty levels (Easy, Medium, Hard) with words getting longer as you progress
- **🌊 Wave System**: Enemies spawn faster and move quicker with each wave
- **⭐ Score Tracking**: Earn points based on word length
- **❤️ Lives System**: 3 lives - don't let enemies reach the bottom!
- **🎨 Visual Effects**:
  - Animated starfield background
  - Explosion effects when destroying enemies
  - Targeting indicators and glow effects
  - Smooth animations
- **🔊 Sound Effects**: Audio feedback using Web Audio API
- **📱 Responsive Design**: Plays well on different screen sizes
- **🎨 Custom Thaana Font**: Uses Waheed font for authentic Dhivehi text rendering

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dhivehi-type
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

### Building for Production

```bash
npm run build
```
### Controls

- **Type Letters**: English keyboard (converts to Thaana automatically)
- **Backspace**: Delete last character
- **Escape**: Clear current input
- **R**: Restart game (when game is over)

### Core Technologies
- **Vanilla JavaScript** - Pure JS, no frameworks
- **HTML5 Canvas** - For game rendering
- **CSS3** - Styling and animations
- **Vite** - Build tool and dev server

### Libraries & APIs
- **[JTK (Javascript Thaana Keyboard)](https://github.com/jawish/jtk)** by Jawish Hameed - Phonetic Thaana input
- **Web Audio API** - Sound effects and audio playback
- **HTML5 Canvas API** - 2D graphics rendering

### Assets
- **MV Waheed Font** - Thaana/Dhivehi font for authentic text rendering
- **Sound Effects** from [Freesound.org](https://freesound.org) - Audio feedback for gameplay
- **Ship Graphics** by [ArtDisruptor](https://www.facebook.com/ArtDisruptor/) - Player and enemy ship sprites

## 📁 Project Structure

```
dhivehi-type/
├── public/
│   ├── jtk.min.js          # JTK library
│   └── vite.svg
├── src/
│   ├── fonts/
│   │   └── A_Waheed/       # Waheed Thaana font
│   ├── game/
│   │   ├── Game.js         # Main game loop and logic
│   │   ├── Enemy.js        # Enemy ships with words
│   │   ├── Player.js       # Player ship
│   │   ├── InputHandler.js # Thaana keyboard input handling
│   │   └── ParticleSystem.js # Visual effects
│   ├── data/
│   │   └── words.js        # Dhivehi word lists (73 words)
│   ├── utils/
│   │   └── thaana.js       # Thaana text utilities
│   ├── main.js             # Entry point
│   └── style.css           # Game styling
├── index.html
├── package.json
└── README.md
```

## 📚 Word Lists

The game includes 73 carefully selected Dhivehi words across 3 difficulty levels:

- **Easy** (30 words): 3-5 letters - Common everyday words
- **Medium** (25 words): 6-8 letters - Intermediate vocabulary
- **Hard** (18 words): 9+ letters - Complex/compound words

## 🎨 Game Mechanics

### Difficulty Progression
- **Wave 1-4**: Easy words, slow speed (4 second spawn interval)
- **Wave 5-9**: Medium words, moderate speed
- **Wave 10+**: Hard words, fast speed (minimum 2 second spawn interval)

### Scoring
- Points = Word length × 10
- Longer words = more points!

### Lives
- Start with 3 lives
- Lose a life when an enemy reaches the bottom
- Game over when all lives are lost

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Adding New Words

Edit `src/data/words.js` and add words to the appropriate difficulty level:

```javascript
export const words = {
  easy: [
    'ދިވެހި',    // Add new easy words here
    // ...
  ],
  medium: [
    'މަގުބޫލް',  // Add new medium words here
    // ...
  ],
  hard: [
    'ބައިނަލްއަގުވާމީ', // Add new hard words here
    // ...
  ],
};
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Areas for improvement:

- [ ] Implement high score leaderboard
- [ ] Add different game modes (time attack, survival, etc.)
- [ ] Power-ups and special abilities
- [ ] Better explosion effects and animations
- [ ] Background music
- [ ] Achievement system
- [ ] Multiplayer mode

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Credits

### Libraries & Tools
- **JTK (Javascript Thaana Keyboard)** by [Jawish Hameed](https://github.com/jawish) - Phonetic Thaana input system
- Inspired by **ZType** by Dominic Szablewski - Original typing game concept

### Fonts
- **MV Waheed (A_Waheed)** - Authentic Thaana/Dhivehi font for text rendering
  - Part of the Dhivehi font collection
  - Provides clear and readable Thaana characters

### Sound Effects
- Sound effects sourced from **[Freesound.org](https://freesound.org)**
  - `shotgun.wav` - Correct typing feedback
  - `empty.wav` - Incorrect typing feedback
  - Licensed under Creative Commons

### Graphics & Sprites
- **Ship Artwork** by **[ArtDisruptor](https://www.facebook.com/ArtDisruptor/)**
  - `goodship.png` - Player ship sprite
  - `badship.png` - Enemy ship sprite
  - Custom artwork for game visuals

## 📧 Contact

For questions, suggestions, or feedback, please open an issue on GitHub.

---

**Made for just killing time**
