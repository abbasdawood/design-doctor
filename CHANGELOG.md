
# Changelog

All notable changes to the Design Doctor widget will be documented in this file.

## [2.0.1] - 2023-03-21

### 🔧 Fixed
- Fixed asynchronous API calls for `getVariableById` to use `getVariableByIdAsync` instead
- Updated `getFillInfo` and `traverseAllNodes` to handle async operations properly
- Fixed widget compatibility with "documentAccess: dynamic-page" manifest setting

## [2.0.0] - 2025-03-02

### 🚀 Major Changes
- Fixed coverage calculation logic for more accurate results
- Improved UI/UX with color-coded coverage indicators
- Enhanced performance with optimized traversal algorithms
- Added better error handling and recovery for large Figma files

### 🌈 Added
- Improved loading animation with new quirky messages
- Better contrast and accessibility for UI elements
- More detailed component categorization

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

## [1.1.0] - 2024-01-23
- Adds support for colours
- Makes the widget more performant
- Adds support for selecting nodes, and colours

## [1.0.0] - 2023-12-26

### 🚀 Initial Release
- Component coverage analysis
- Detection of external, local, and detached components
- Color style usage tracking
- Interactive component selection
- Coverage percentage calculation
