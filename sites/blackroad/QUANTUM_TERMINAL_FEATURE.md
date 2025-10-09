# Quantum Math Terminal Feature

## Overview

The Terminal component now includes an animated quantum math visualization feature that displays fundamental quantum mechanics equations with dynamic phase calculations and wave animations.

## Usage

1. Navigate to the Terminal page in the BlackRoad portal
2. Type `quantum` and press Enter
3. Watch the animated quantum equations display with:
   - 8 fundamental quantum mechanics equations
   - Animated phase indicators showing cosine wave calculations
   - Rotating animation markers (`.`, `o`, `O`, `@`, `*`, `◉`)
   - A wave visualization at the bottom

## Commands

- `quantum` - Start the quantum math visualization
- `clear` - Stop the animation and clear the terminal
- `help` - Show all available commands

## Technical Details

### Equations Displayed

1. **Time-dependent Schrödinger**: `iħ ∂ψ/∂t = Ĥ ψ`
2. **Time-independent Schrödinger**: `Ĥ ψ = E ψ`
3. **Hamiltonian**: `H = p²/2m + V(x)`
4. **Position-momentum representation**: `⟨x|p⟩ = (1/√(2πħ)) e^(i p x / ħ)`
5. **Canonical commutation relation**: `[x,p] = iħ`
6. **Quantum state superposition**: `|ψ⟩ = Σₙ cₙ |φₙ⟩`
7. **Path integral formulation**: `∫ D[x(t)] e^(i S[x]/ħ)`
8. **Dirac equation**: `(iγᵘ ∂ᵤ - m)ψ = 0`

### Animation Details

- **Frame rate**: 60ms per frame (~16.7 fps)
- **Phase calculation**: `phase = cos(t + j * 0.5)` where `t = frame * 0.06`
- **Wave visualization**: Uses cosine function `cos(k * x - t)` with `k = 0.25`
- **Character set for waves**: `◼` (block) for positive values, `·` (dot) for negative

### Implementation

The feature uses:
- React `useState` for managing animation state
- React `useEffect` for the animation loop
- `setInterval` with 60ms delay for frame updates
- Dynamic rendering of visualization lines on each frame

## Code Location

- **Component**: `sites/blackroad/src/pages/Terminal.jsx`
- **Lines added**: ~80 lines of code
- **Dependencies**: React hooks (`useState`, `useEffect`, `useRef`)

## Future Enhancements

Potential improvements could include:
- Color coding for different equation types
- Interactive parameters (adjust wave speed, frequency)
- Additional quantum visualizations (Bloch sphere, probability distributions)
- Sound/audio representation of quantum states
- Export functionality for screenshots or recordings
