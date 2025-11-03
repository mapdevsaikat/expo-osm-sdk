# 🚀 Build and Publish v1.0.96 - Quick Guide


## 🔧 **Steps to Build and Publish**

### **1. Build the SDK**
```bash
cd /Users/saikat.maiti/Documents/expo-osm-sdk/expo-osm-sdk
npm run build
```

### **2. Test Locally (Optional but Recommended)**
```bash
# In another terminal, test in the demo app
cd /Users/saikat.maiti/Documents/expo-osm-sdk/simple-map-test

# Temporarily use local version for testing
npm install ../expo-osm-sdk

# Test on Android
npm run android
```

### **3. Publish to npm**
```bash
cd /Users/saikat.maiti/Documents/expo-osm-sdk/expo-osm-sdk

# Login to npm (if not already logged in)
npm login

# Publish
npm publish
```

### **4. Update Demo App to Published Version**
```bash
cd /Users/saikat.maiti/Documents/expo-osm-sdk/simple-map-test

# Update package.json
# Change: "expo-osm-sdk": "^1.0.95"
# To:     "expo-osm-sdk": "^1.0.96"

# Clean install
rm -rf node_modules package-lock.json
npm install

# Test
npm run android
```

---

## ✅ **Verification Checklist**

After publishing v1.0.96, verify:

- [ ] npm shows `expo-osm-sdk@1.0.96` is published
- [ ] Android app starts without crashes
- [ ] Map view renders correctly
- [ ] All features work (location, routing, search, etc.)
- [ ] No LayoutParams errors in logs
- [ ] iOS still works (not affected by this fix)

---

## 📦 **What's Included in v1.0.96**

### **Files Modified:**
1. `android/src/main/java/expo/modules/osmsdk/OSMMapView.kt` (Android layout fix)
2. `package.json` (version bump to 1.0.96)
3. `CHANGELOG.md` (documented the fix)

### **Changes:**
- ✅ Added `import android.view.ViewGroup`
- ✅ Changed `FrameLayout.LayoutParams` → `ViewGroup.LayoutParams`
- ✅ Moved layout params setup before `addView()`
- ✅ Improved comments explaining the fix

---

## 🎯 **Impact**

| Platform | v1.0.95 | v1.0.96 |
|----------|---------|---------|
| Android | ❌ Crashes | ✅ Works |
| iOS | ✅ Works | ✅ Works |
| Web | ✅ Works | ✅ Works |

---

## 📄 **Documentation Created**

1. **ANDROID_LAYOUTPARAMS_FIX_v1.0.96.md** - Detailed technical explanation
2. **BUILD_AND_PUBLISH_v1.0.96.md** - This guide
3. **CHANGELOG.md** - Updated with v1.0.96 entry

---

## ⚡ **Quick Commands**

```bash
# Build SDK
cd /Users/saikat.maiti/Documents/expo-osm-sdk/expo-osm-sdk && npm run build

# Publish to npm
npm publish

# Update demo app
cd /Users/saikat.maiti/Documents/expo-osm-sdk/simple-map-test
rm -rf node_modules package-lock.json
npm install

# Test on Android
npm run android
```

---

## 🎉 **After Publishing**

Your users can update with:
```bash
npm install expo-osm-sdk@latest
# or
npm install expo-osm-sdk@1.0.96
```

And the Android crash will be fixed! 🚀

---

*Build Date: November 3, 2025*  
*Version: 1.0.96*  
*Fix: Critical Android Layout Crash*

