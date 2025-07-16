# 🗺️ Simple Map Test

A minimal test app for expo-osm-sdk with cloud builds (no local SDK required).

## 🚀 Quick Start

### Preview Build (Recommended - No Local SDK Required)

**Android:**
```bash
npx eas build --profile preview --platform android
```

**iOS:**
```bash  
npx eas build --profile preview --platform ios
```

**Both Platforms:**
```bash
npx eas build --profile preview --platform all
```

### Development Build (Local Testing)

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# For native testing (requires local SDK)
npx expo run:android    # Requires Android SDK
npx expo run:ios        # Requires Xcode
```

## 📱 What You'll Get

### ✅ **Preview/Development Builds:**
- ✅ **Interactive OpenStreetMap** with San Francisco view
- ✅ **Tap interactions** with coordinate alerts
- ✅ **Pan and zoom** gestures  
- ✅ **Real-time logging** of all interactions
- ✅ **Tap counter** showing interaction count
- ✅ **Cross-platform** (Android & iOS)

### ⚠️ **Expo Go (Limited):**
- ⚠️ Shows helpful fallback message
- ⚠️ Explains how to get full functionality
- ⚠️ No native map (expo-osm-sdk requires native compilation)

## 🏗️ Build Profiles

- **`preview`**: APK/IPA for testing on real devices
- **`development`**: Debug builds with development client
- **`production`**: Release builds for app stores

## 📊 Size Comparison

- **Simple Test App**: ~20MB APK
- **Full Demo Project**: ~100MB APK

## 🔧 Key Features Tested

1. **Map Initialization**: Verifies native module loading
2. **User Interactions**: Tap handling with coordinate extraction  
3. **Region Changes**: Pan/zoom gesture detection
4. **Platform Detection**: iOS vs Android behavior
5. **Native Module Support**: Proper fallbacks when unavailable

## 🐛 Troubleshooting

**Build Fails?**
- Ensure you have an Expo account: `npx eas login`
- Configure project: `npx eas build:configure`

**Map Not Showing?**
- Make sure you built with preview/development profile
- Check console logs for errors
- Verify platform is Android/iOS (not web)

**Asset Errors?**
- All required assets are included in this project
- Icons are copied from demo project

## 📈 Success Indicators

✅ App launches without crashes  
✅ Map renders in San Francisco  
✅ Tap interactions show alerts with coordinates  
✅ Console shows detailed event logs  
✅ No "native view manager" warnings  
✅ Smooth pan/zoom performance 