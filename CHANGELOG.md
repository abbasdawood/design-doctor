
# Changelog

All notable changes to the Design Doctor widget will be documented in this file.

## [1.1.0] - 2023-11-10

### 🌈 Added
- Color-coded coverage indicators in the hero section
  - Green for coverage above 80%
  - Yellow for coverage between 30% and 80%
  - Red for coverage below 30%
- Background colors now adjust for better contrast with text
- Improved UI for the hero section with more intuitive colors

### 🔧 Fixed
- Fixed coverage calculation to correctly follow the formula: (External Components) / (External Components + Local Components + Detached Components)
- Reset procedure now properly clears all data between analysis runs
- "Run Again" button now properly resets data before running a new analysis

### ⚡ Performance
- Optimized traversal logic to reduce Figma UI freezing during analysis
- Reduced UI updates during loading to improve responsiveness
- Added more quirky loading messages to entertain you while waiting

## [1.0.0] - 2023-10-15

### 🚀 Initial Release
- Component coverage analysis
- Detection of external, local, and detached components
- Color style usage tracking
- Interactive component selection
- Coverage percentage calculation
