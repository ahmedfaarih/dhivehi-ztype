# ދިވެހި ޒީ ޓައިޕް | Dhivehi Z-Type

A fast-paced typing game for practicing Dhivehi (Thaana) script, inspired by classic typing games like ZType. Test your Dhivehi typing skills by destroying enemy ships before they reach the bottom!

![Dhivehi Type Game](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🎮 About

Dhivehi zType is an educational typing game designed to help users improve their Dhivehi/Thaana typing speed and accuracy. Enemy ships fall from the top of the screen with Dhivehi words - type the words to destroy them before they reach the bottom!

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
## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Areas for improvement:

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


**Made for just killing time during my winter break**
