# 🎨 Professional Vector Icons Guide

This guide shows how to enhance expo-osm-sdk with professional vector icons using `react-native-vector-icons`.

## ✅ **What You Get**

**Without react-native-vector-icons:**
- ➕ Text-based zoom controls (+ / −)
- 🎯 Basic functionality with emoji fallbacks
- 📱 Works immediately, no setup required

**With react-native-vector-icons:**
- 🎨 Professional Material Design icons
- ⚡ Better accessibility and touch targets
- 🏢 Production-ready appearance
- 📐 Consistent sizing and styling

## 🚀 **Quick Setup**

### 1. Install the Package
```bash
npm install react-native-vector-icons
# or
yarn add react-native-vector-icons
```

### 2. Platform Configuration

#### **Expo Managed Workflow**
Add to your `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-font",
        {
          "fonts": ["./node_modules/react-native-vector-icons/Fonts/MaterialIcons.ttf"]
        }
      ]
    ]
  }
}
```

#### **React Native CLI (Android)**
Add to `android/app/build.gradle`:
```gradle
apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")
```

#### **React Native CLI (iOS)**
Add fonts to `ios/YourApp/Info.plist`:
```xml
<key>UIAppFonts</key>
<array>
  <string>MaterialIcons.ttf</string>
</array>
```

### 3. Rebuild Your App
```bash
npx expo run:ios
# or
npx expo run:android
```

## 🎯 **Usage Examples**

### Basic Map with Professional Icons
```tsx
import { OSMView, ZoomControl } from 'expo-osm-sdk';

export default function ProfessionalMap() {
  return (
    <OSMView
      initialCenter={{ latitude: 40.7128, longitude: -74.0060 }}
      initialZoom={12}
      showAttribution={true} // 🚨 Required for legal compliance
    >
      {/* ZoomControl automatically uses vector icons if available */}
      <ZoomControl 
        position="top-right"
        iconColor="#2563eb"
        iconSize={20}
      />
    </OSMView>
  );
}
```

### Graceful Fallback Behavior
```tsx
// ✅ Your app works with or without react-native-vector-icons!

// With icons installed:     Shows material design + and − icons
// Without icons installed:  Shows text + and − with warning in console
```

## 🔧 **Icon Customization**

### Available Props
```tsx
<ZoomControl 
  iconColor="#1a73e8"     // Icon color
  iconSize={24}           // Icon size in pixels
  disabled={false}        // Disable state (grays out icons)
  showLabels={true}       // Show "Zoom In" / "Zoom Out" labels
/>
```

### Custom Styling
```tsx
<ZoomControl 
  position="bottom-left"
  iconColor="#ffffff"
  iconSize={20}
  buttonStyle={{
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
  }}
/>
```

## ⚖️ **Legal Compliance**

### Mandatory Attribution
```tsx
<OSMView
  showAttribution={true}              // ✅ Required by law
  attributionPosition="bottom-right"  // Customizable position
  customAttribution={[                // Add your own credits
    "© My Company 2024"
  ]}
/>
```

### Attribution Features
- 📋 **Collapsible but not hideable** - Legal compliance ensured
- 🔗 **Clickable links** - Direct to OpenStreetMap copyright page
- 📱 **Mobile optimized** - Touch-friendly design
- 🎨 **Professional styling** - Matches your app design

## 🐛 **Troubleshooting**

### Icons Not Showing?
1. **Check console warnings** - Look for "react-native-vector-icons not found"
2. **Verify installation** - Run `npm list react-native-vector-icons`
3. **Rebuild app** - Icons require native rebuild, not just refresh
4. **Check platform config** - Ensure fonts are properly linked

### Common Issues
```tsx
// ❌ Wrong import
import Icon from 'react-native-vector-icons/MaterialIcons';

// ✅ No import needed! 
// ZoomControl handles everything automatically
```

### Debug Mode
```tsx
// Enable debug logging
console.log('Vector icons available:', !!require('react-native-vector-icons/MaterialIcons'));
```

## 🚀 **Advanced Usage**

### Multiple Controls
```tsx
<OSMView>
  <ZoomControl position="top-right" />
  <UserLocationButton position="top-left" />
  <SearchBox position="top-center" />
  {/* Attribution automatically added */}
</OSMView>
```

### Custom Icon Pack
```tsx
// Currently supports MaterialIcons
// Future versions may support other icon packs
```

## 📱 **Platform Support**

| Platform | Vector Icons | Fallback |
|----------|:---:|:---:|
| **iOS** | ✅ Full | ✅ Text |
| **Android** | ✅ Full | ✅ Text |
| **Web** | ✅ Full | ✅ Text |
| **Expo Go** | ❌ Mock | ✅ Text |

## 🎯 **Best Practices**

1. **Always test without icons** - Ensure fallbacks work
2. **Use consistent sizing** - `iconSize={20}` recommended
3. **Match your app theme** - Customize `iconColor`
4. **Enable attribution** - Required for OpenStreetMap compliance
5. **Test on real devices** - Icons need native rebuilds

---

**Ready to enhance your maps?** Install `react-native-vector-icons` and enjoy professional-grade map controls! 🎨 