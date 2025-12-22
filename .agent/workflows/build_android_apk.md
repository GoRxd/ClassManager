---
description: Build the Angular app and generate an Android APK using Gradle
---

This workflow guides you through building the Class Manager application from source and generating an Android APK file.

# 1. Clean and Install Dependencies (Optional but recommended for "from scratch")

If you want a completely fresh build, remove `node_modules` and install dependencies.

```powershell
# Optional: Remove existing modules
# Remove-Item -Recurse -Force node_modules
# Remove-Item -Force package-lock.json

npm install
```

# 2. Build the Web Application

This compiles the Angular/Ionic application into the `www` (or `dist`) folder.

```powershell
ionic build
```

# 3. Serialize to Android Platform

This copies the built web assets into the Android native project.

```powershell
npx cap sync android
```

# 4. Build APK with Gradle

Navigate to the android directory and run the Gradle wrapper to build the APK.

**Debug APK (for testing):**

```powershell
cd android
./gradlew assembleDebug
```

_The output APK will be located at: `android/app/build/outputs/apk/debug/app-debug.apk`_

**Release APK (signed, for store):**
_Requires signing configuration (keystore) set up in `build.gradle`._

```powershell
cd android
./gradlew assembleRelease
```

_The output APK will be located at: `android/app/build/outputs/apk/release/app-release-unsigned.apk` (or signed if configured)_
