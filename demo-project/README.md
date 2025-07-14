# Expo OSM SDK - Demo Project

A comprehensive demo application showcasing the [expo-osm-sdk](https://github.com/mapdevsaikat/expo-osm-sdk) features and best practices.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Expo CLI
- iOS Simulator / Android Emulator (for native maps)

### Installation

```bash
# Clone the repository
git clone https://github.com/mapdevsaikat/expo-osm-sdk.git
cd expo-osm-sdk/demo-project

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Development

**⚠️ Important**: For full map functionality, you need development builds:

```bash
# iOS
npm run ios

# Android  
npm run android
```

## 🎯 What This Demo Shows

### ✨ Features Demonstrated
- ✅ **Basic Map Setup** - Simple OSMView implementation
- ✅ **Interactive Controls** - Zoom, pan, reset controls
- ✅ **Custom Markers** - Adding and managing map markers
- ✅ **Event Handling** - Map press, marker press events
- ✅ **Professional UI** - Modern design with Lucide icons
- ✅ **Platform Behavior** - Fallback handling for Expo Go/Web
- ✅ **Best Practices** - TypeScript, proper component structure

### 📱 Components Included
- **MapScreen** - Main map interface with controls
- **InfoPanel** - SDK information and documentation
- **MapControls** - Interactive zoom and navigation buttons
- **MapContainer** - Advanced map container (alternative implementation)

### 🎨 UI/UX Features
- Clean, modern interface
- Responsive design
- Professional fallback screens
- Clear developer messaging
- Smooth animations and interactions

## 📖 Platform Behavior

### Development Builds (Recommended)
- ✅ Full OpenStreetMap with native performance
- ✅ All interactive features working
- ✅ GPU-accelerated rendering

### Expo Go
- ⚠️ Shows informative fallback UI
- 💡 Clear instructions for development builds
- 📖 Professional branded placeholder

### Web
- ⚠️ Shows web-specific fallback
- 🔗 Suggests web-compatible alternatives
- 📝 Developer-friendly messaging

## 🛠️ Customization

### Adding Custom Markers
```tsx
const markers: MarkerConfig[] = [
  {
    id: 'custom-marker',
    coordinate: { latitude: 40.7128, longitude: -74.0060 },
    title: 'Custom Location',
    description: 'Your custom marker description'
  }
];
```

### Handling Map Events
```tsx
const handleMapPress = (coordinate: Coordinate) => {
  console.log('Map pressed at:', coordinate);
  // Add your custom logic
};

const handleMarkerPress = (markerId: string) => {
  console.log('Marker pressed:', markerId);
  // Handle marker interaction
};
```

## 📁 Project Structure

```
demo-project/
├── components/           # Reusable components
│   ├── MapScreen.tsx    # Main map interface
│   ├── InfoPanel.tsx    # Information panel
│   ├── MapControls.tsx  # Map control buttons
│   └── MapContainer.tsx # Advanced map container
├── hooks/               # Custom React hooks
├── assets/             # Images and static assets
├── App.tsx             # Main app component
└── app.json           # Expo configuration
```

## 🔗 Related Resources

- **Main SDK**: [expo-osm-sdk](https://www.npmjs.com/package/expo-osm-sdk)
- **Documentation**: [GitHub Repository](https://github.com/mapdevsaikat/expo-osm-sdk)
- **Issues**: [Report Problems](https://github.com/mapdevsaikat/expo-osm-sdk/issues)

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run ios          # Build and run on iOS
npm run android      # Build and run on Android
npm run build:web    # Build for web
npm run lint         # Run ESLint
```

## 🤝 Contributing

This demo is part of the expo-osm-sdk project. Contributions welcome!

1. Fork the main repository
2. Make changes to `/demo-project`
3. Test thoroughly on development builds
4. Submit a pull request

---

**Made with ❤️ for the expo-osm-sdk community**

*Experience native OpenStreetMap in your Expo app!* 