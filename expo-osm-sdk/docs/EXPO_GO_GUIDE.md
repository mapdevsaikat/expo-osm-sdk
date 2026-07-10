# 📱 Expo Go vs Development Builds Guide

## 🤔 **Why doesn't expo-osm-sdk work in Expo Go?**

Unlike `react-native-maps` which is **pre-built** into Expo Go, `expo-osm-sdk` is a **custom native module** that requires compilation. Here's the difference:

### **react-native-maps (Works in Expo Go)**
- ✅ **Pre-compiled** into Expo Go app
- ✅ **Officially supported** by Expo
- ✅ **Zero setup** required

### **expo-osm-sdk (Requires Development Build)**
- ❌ **Not pre-built** into Expo Go
- ✅ **Custom native code** (Android/iOS)
- ⚠️ **Requires compilation**

## 🛠️ **How to Use expo-osm-sdk**

### **Option 1: Development Build (Recommended)**

```bash
# Install the SDK
npm install expo-osm-sdk

# Create development build
npx expo run:android
npx expo run:ios
```

### **Option 2: With Config Plugin (Easier Setup)**

1. **Install the SDK with plugin:**
```bash
npm install expo-osm-sdk
```

2. **Add plugin to app.json:**
```json
{
  "expo": {
    "plugins": [
      "expo-osm-sdk/plugin"
    ]
  }
}
```

3. **Build and run:**
```bash
npx expo prebuild
npx expo run:android
```

### **Option 3: EAS Build (Production)**

```bash
# Configure EAS
npx eas build:configure

# Build for testing
npx eas build --profile development

# Build for production
npx eas build --profile production
```

## 📋 **Feature Comparison**

| Feature | Expo Go | Development Build | EAS Build |
|---------|---------|-------------------|-----------|
| expo-osm-sdk | ❌ No | ✅ Yes | ✅ Yes |
| react-native-maps | ✅ Yes | ✅ Yes | ✅ Yes |
| Hot Reload | ✅ Fast | ⚠️ Slower | ❌ No |
| Setup Time | ✅ Instant | ⚠️ 5-10 mins | ⚠️ 10-20 mins |
| Custom Native Code | ❌ No | ✅ Yes | ✅ Yes |

## 🎯 **Which Option Should You Choose?**

### **For Development:**
- **Quick Testing**: Use our online demo or web version
- **Full Development**: Use development builds

### **For Production:**
- **App Store/Play Store**: Use EAS Build
- **Internal Testing**: Use development builds

## 🔮 **Future: Getting into Expo Go**

To make `expo-osm-sdk` work in Expo Go like `react-native-maps`, it would need to:

1. **Gain Popular Adoption** 📈
2. **Maintain High Quality** ✅ (Already achieved!)
3. **Get Expo Team Approval** 🤝
4. **Be Officially Adopted** 🎯

## 💡 **Pro Tips**

### **For Plugin Users:**
```json
{
  "expo": {
    "plugins": [
      "expo-osm-sdk/plugin",
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "Show current position on map."
        }
      ]
    ]
  }
}
```

### **For Web Development:**
```tsx
import { OSMView } from 'expo-osm-sdk';

{% raw %}
// Works in Expo Go web version!
export default function App() {
  return (
    <OSMView
      style={{ flex: 1 }}
      initialCenter={{ latitude: 22.5726, longitude: 88.3639 }}
      initialZoom={10}
    />
  );
}
{% endraw %}
```

## 🚀 **Get Started**

1. **Try the Web Demo**: [GitHub Pages Demo](https://your-demo-url.github.io)
2. **Development Build**: Follow Option 1 above
3. **Easy Setup**: Use the config plugin (Option 2)

---

**Question? Issues?** 
- 📖 [Documentation](../README.md)
- 🐛 [Report Issues](https://github.com/mapdevsaikat/expo-osm-sdk/issues)
- 💬 [Discussions](https://github.com/mapdevsaikat/expo-osm-sdk/discussions) 