# SmartKart Mobile - Deployment Requirements

## Overview

This document outlines the hardware, software, and infrastructure requirements for developing, building, and deploying the SmartKart Flutter mobile application.

---

## Development Environment Requirements

### Hardware Requirements

#### Minimum Specifications
- **Processor**: Intel Core i5 / AMD Ryzen 5 or equivalent (4 cores)
- **RAM**: 8 GB
- **Storage**: 10 GB free disk space (SSD recommended)
- **Display**: 1920x1080 resolution

#### Recommended Specifications
- **Processor**: Intel Core i7 / AMD Ryzen 7 or Apple M1/M2 (6+ cores)
- **RAM**: 16 GB or more
- **Storage**: 20 GB free disk space (NVMe SSD)
- **Display**: 2560x1440 or higher resolution

#### Platform-Specific
**Windows**:
- Windows 10 (64-bit) or later
- Virtualization support (Intel VT-x or AMD-V) for Android emulator

**macOS** (required for iOS development):
- macOS 12.0 (Monterey) or later
- Intel-based Mac or Apple Silicon (M1/M2/M3)

**Linux**:
- Ubuntu 20.04 LTS or later (64-bit)
- Other distributions: Debian, Fedora, Arch (check Flutter docs)

---

## Software Requirements

### Core Development Tools

#### 1. Flutter SDK
- **Version**: Flutter 3.x (3.44.6 or later)
- **Channel**: Stable
- **Installation**: https://docs.flutter.dev/get-started/install
- **Verification**: `flutter doctor`

#### 2. Dart SDK
- **Version**: Dart 3.x (bundled with Flutter)
- **Verification**: `dart --version`

#### 3. IDE / Editor (Choose One)

**Android Studio** (Recommended for Android development)
- Version: 2023.1 (Iguana) or later
- Plugins:
  - Flutter plugin
  - Dart plugin
- Download: https://developer.android.com/studio

**Visual Studio Code** (Lightweight alternative)
- Version: Latest stable
- Extensions:
  - Flutter (by Dart Code)
  - Dart (by Dart Code)
  - Awesome Flutter Snippets
  - Error Lens
- Download: https://code.visualstudio.com/

**IntelliJ IDEA** (Alternative)
- Version: 2023.x or later
- Plugins: Flutter, Dart
- Download: https://www.jetbrains.com/idea/

---

### Android Development Requirements

#### 1. Android SDK
- **Minimum SDK**: API 21 (Android 5.0 Lollipop)
- **Target SDK**: API 34 (Android 14) or latest stable
- **Build Tools**: Latest version
- **Platform Tools**: Latest version

#### 2. Android SDK Components (via Android Studio SDK Manager)
- Android SDK Platform (API 21+)
- Android SDK Build-Tools
- Android SDK Platform-Tools
- Android SDK Tools
- Android Emulator
- Intel x86 Emulator Accelerator (HAXM) - for Intel CPUs
- Google Play services

#### 3. Java Development Kit (JDK)
- **Version**: JDK 17 or later (bundled with Android Studio)
- **Alternative**: OpenJDK 17
- **Verification**: `java -version`

#### 4. Gradle
- **Version**: 8.x (managed by Android Studio)
- Configured in `android/gradle/wrapper/gradle-wrapper.properties`

#### 5. Android Emulator or Physical Device
**Emulator**:
- Recommended: Pixel 6 Pro with API 34
- RAM allocation: 2-4 GB
- Enable hardware acceleration

**Physical Device**:
- Android 5.0 or later
- USB debugging enabled
- Developer mode enabled

---

### iOS Development Requirements (macOS Only)

#### 1. Xcode
- **Version**: Xcode 15 or later
- **Download**: Mac App Store or https://developer.apple.com/xcode/
- **Size**: ~15 GB
- **Installation time**: 30-60 minutes

#### 2. Xcode Command Line Tools
```bash
xcode-select --install
```

#### 3. CocoaPods
- **Version**: 1.15.0 or later
- **Installation**:
  ```bash
  sudo gem install cocoapods
  pod setup
  ```
- **Purpose**: iOS dependency management

#### 4. iOS Simulator or Physical Device
**Simulator**:
- Included with Xcode
- Recommended: iPhone 15 Pro (iOS 17)

**Physical Device**:
- iPhone running iOS 12.0 or later
- Apple Developer account (free tier sufficient for testing)
- Provisioning profile and signing certificate

#### 5. Apple Developer Account
- **Free Tier**: Sufficient for local testing (7-day certificate)
- **Paid Program** ($99/year): Required for App Store distribution
- **Website**: https://developer.apple.com/programs/

---

## Flutter Dependencies

### Package Management
All dependencies are defined in `pubspec.yaml` and installed via:
```bash
flutter pub get
```

### Key Dependencies
- **flutter_riverpod** ^2.5.1 - State management
- **dio** ^5.5.0 - HTTP client
- **go_router** ^14.2.1 - Navigation
- **flutter_secure_storage** ^9.2.2 - Secure JWT storage
- **freezed** ^2.5.7 - Code generation for models
- **json_serializable** ^6.8.0 - JSON serialization
- **shimmer** ^3.0.0 - Loading animations
- **connectivity_plus** ^6.0.5 - Network status

### Code Generation Tools
```bash
dart run build_runner build --delete-conflicting-outputs
```

---

## Backend Requirements

### API Gateway
- **URL**: Configurable via `--dart-define=GATEWAY_BASE_URL`
- **Default**: `http://10.0.2.2:8080/api/v1` (Android emulator localhost)
- **Protocol**: HTTP (dev) / HTTPS (production)

### Network Configuration
- Backend must be accessible from mobile device/emulator
- **Android Emulator**: Use `10.0.2.2` to access host machine localhost
- **iOS Simulator**: Use `localhost` or host machine IP
- **Physical Device**: Use host machine IP on same WiFi network

---

## Build Requirements

### Android APK Build

**Debug APK** (for testing):
```bash
flutter build apk --debug --dart-define=GATEWAY_BASE_URL=http://<gateway-ip>:8080/api/v1
```
- Output: `build/app/outputs/flutter-apk/app-debug.apk`
- Size: ~50 MB
- Build time: 2-5 minutes

**Release APK** (for distribution):
```bash
flutter build apk --release --dart-define=GATEWAY_BASE_URL=https://api.smartkart.com/api/v1
```
- Output: `build/app/outputs/flutter-apk/app-release.apk`
- Size: ~20 MB (optimized)
- Build time: 5-10 minutes
- Requires: Signing key (keystore)

**App Bundle** (for Google Play):
```bash
flutter build appbundle --release
```
- Output: `build/app/outputs/bundle/release/app-release.aab`
- Size: ~18 MB
- Google Play preferred format

### iOS Build

**Debug Build**:
```bash
flutter build ios --debug --dart-define=GATEWAY_BASE_URL=http://<gateway-ip>:8080/api/v1
```

**Release Build** (for App Store):
```bash
flutter build ios --release --dart-define=GATEWAY_BASE_URL=https://api.smartkart.com/api/v1
```
- Output: `build/ios/archive/Runner.xcarchive`
- Build time: 10-20 minutes
- Requires: Xcode, provisioning profile, signing certificate

**Archive for App Store**:
1. Open `ios/Runner.xcworkspace` in Xcode
2. Select "Any iOS Device (arm64)" as destination
3. Product → Archive
4. Organizer → Distribute App → App Store Connect

---

## Testing Device Requirements

### Android Testing

**Supported Devices**:
- Screen sizes: 4.7" to 6.7"
- Resolutions: 1080x1920 to 1440x3120
- Android versions: 5.0 (API 21) to 14 (API 34)

**Recommended Test Matrix**:
- Android 5.0 (Lollipop) - minimum version
- Android 9.0 (Pie) - common baseline
- Android 12 (S) - recent version
- Android 14 (U) - latest

**Performance Targets**:
- App launch: < 3 seconds
- Screen transitions: < 500ms
- API responses: < 2 seconds (on 4G)

### iOS Testing

**Supported Devices**:
- iPhone SE (1st gen) to iPhone 15 Pro Max
- iPad Mini to iPad Pro 12.9"
- iOS versions: 12.0 to 17.x

**Recommended Test Matrix**:
- iPhone SE (small screen, older device)
- iPhone 12 (mid-range)
- iPhone 15 Pro (latest flagship)
- iPad (tablet layout)

**Performance Targets**:
- App launch: < 2 seconds
- 60 FPS smooth scrolling
- Memory usage: < 200 MB

---

## CI/CD Requirements

### Continuous Integration

**GitHub Actions / GitLab CI** (Recommended):
```yaml
# Example workflow
- Install Flutter SDK
- Run flutter pub get
- Run dart run build_runner build
- Run flutter analyze
- Run flutter test
- Build APK/IPA artifacts
```

**Required Runners**:
- Linux runner for Android builds
- macOS runner for iOS builds

**Secrets Management**:
- GATEWAY_BASE_URL
- Android keystore credentials
- iOS signing certificates (base64 encoded)

### Continuous Deployment

**Android**:
- Google Play Console access
- Service account JSON key for automated uploads
- Internal testing track for QA

**iOS**:
- App Store Connect access
- App-specific password for Xcode upload
- TestFlight for beta testing

---

## Production Deployment Requirements

### App Store Submission

**Google Play Store**:
- Developer account ($25 one-time fee)
- App assets:
  - App icon (512x512 PNG)
  - Feature graphic (1024x500)
  - Screenshots (min 2, multiple device sizes)
  - Privacy policy URL
- Content rating questionnaire
- Target age group
- In-app purchases declaration (if applicable)

**Apple App Store**:
- Apple Developer Program membership ($99/year)
- App assets:
  - App icon (1024x1024 PNG, no transparency)
  - Screenshots (iPhone, iPad, Apple Watch if supported)
  - App preview videos (optional)
  - Privacy policy URL
- App Review Guidelines compliance
- Age rating
- Export compliance documentation

---

## Security Requirements

### SSL/TLS
- **Production**: Backend must use HTTPS with valid SSL certificate
- **Certificate Pinning**: Recommended for production (http package)

### Data Protection
- **Android**: No additional config needed
- **iOS**: App Transport Security (ATS) enforced by default

### Secrets Management
- Never commit API keys, certificates, or keystores to Git
- Use environment variables or CI/CD secret stores
- Rotate credentials regularly

---

## Monitoring Requirements

### Crash Reporting
- **Firebase Crashlytics** (recommended)
  - Flutter plugin: `firebase_crashlytics`
  - Free tier: Unlimited reports
- **Sentry** (alternative)
  - Flutter plugin: `sentry_flutter`

### Analytics
- **Firebase Analytics** (recommended)
  - Track user flows, screen views, events
  - Free tier: Unlimited events
- **Google Analytics 4** (alternative)
- **Mixpanel** (advanced)

### Performance Monitoring
- **Firebase Performance Monitoring**
  - Track API latency, screen rendering
- **New Relic Mobile**
- **AppDynamics**

### Log Management
- **LogRocket** (session replay)
- **Datadog** (logs + APM)

---

## Hosting Requirements (Backend)

The mobile app connects to the backend API Gateway. Backend requirements:

- **API Gateway**: Node.js server accessible via public IP or domain
- **Load Balancer**: NGINX or AWS ELB
- **SSL Certificate**: Let's Encrypt or commercial CA
- **Firewall**: Allow ports 80 (HTTP) and 443 (HTTPS)
- **Monitoring**: Prometheus + Grafana or cloud-native solution

---

## Network Requirements

### Bandwidth
- **Minimum**: 3G connection (512 Kbps)
- **Recommended**: 4G LTE (10 Mbps)
- **Optimal**: WiFi (25+ Mbps)

### Latency
- **Acceptable**: < 500ms API response time
- **Good**: < 200ms API response time
- **Excellent**: < 100ms API response time

### Data Usage
- Typical session: 1-5 MB
- Image-heavy browsing: 10-20 MB
- Daily active user: 20-50 MB

---

## Version Control Requirements

### Git
- **Version**: 2.x or later
- **Repository**: GitHub, GitLab, Bitbucket, or self-hosted
- **Branching Strategy**: GitFlow or Trunk-Based Development

### .gitignore (Flutter)
Automatically configured by Flutter to exclude:
- `build/` directory
- `.dart_tool/` directory
- `.flutter-plugins` and `.flutter-plugins-dependencies`
- `*.iml`, `.idea/` (Android Studio)
- `ios/Pods/`, `ios/.symlinks/` (iOS build artifacts)
- `*.keystore` (Android signing keys)
- `.env` files

---

## Documentation Requirements

### Developer Documentation
- API integration guide (already exists in this docs/ folder)
- Architecture diagram (ARCHITECTURE.md)
- ER diagram (ER_DIAGRAM.md)
- Setup instructions (README.md)

### User Documentation
- In-app help screens
- FAQ section
- Customer support contact

### Legal Documentation
- Privacy Policy
- Terms of Service
- Cookie Policy (if applicable)
- GDPR/CCPA compliance statements

---

## Timeline Estimates

### Setup Time
- Install Flutter + dependencies: 2-4 hours
- Configure Android Studio/Xcode: 1-2 hours
- Clone project + build: 30 minutes
- Total: ~1 day for fresh setup

### Build Time
- First clean build: 10-15 minutes
- Incremental hot reload: < 5 seconds
- Release APK build: 5-10 minutes
- Release iOS build: 10-20 minutes

### Testing Time
- Unit tests: 1-2 minutes
- Widget tests: 2-5 minutes
- Integration tests: 10-20 minutes
- Manual smoke test: 15-30 minutes

---

## Troubleshooting Common Issues

### Flutter Doctor Issues
```bash
flutter doctor -v
```
Fix each issue flagged by the doctor command.

### Android License Issues
```bash
flutter doctor --android-licenses
```
Accept all SDK licenses.

### iOS CocoaPods Issues
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
```

### Build Cache Issues
```bash
flutter clean
flutter pub get
dart run build_runner build --delete-conflicting-outputs
```

### Emulator/Simulator Issues
- Android: Restart Android Studio, cold boot emulator
- iOS: Quit Simulator, `xcrun simctl erase all`

---

## Support Resources

### Official Documentation
- Flutter Docs: https://docs.flutter.dev/
- Dart Docs: https://dart.dev/guides
- Android Docs: https://developer.android.com/docs
- iOS Docs: https://developer.apple.com/documentation/

### Community
- Flutter Discord: https://discord.gg/flutter
- Stack Overflow: Tag `flutter`, `dart`
- GitHub Issues: https://github.com/flutter/flutter/issues

### Training
- Flutter Codelabs: https://docs.flutter.dev/codelabs
- Udemy: Flutter & Dart courses
- YouTube: Flutter channel

---

## Cost Estimates

### Development
- **Developer Hardware**: $1,000 - $3,000 (Mac for iOS dev)
- **Developer Tools**: Free (Flutter, Android Studio, Xcode)
- **IDE Licenses**: Free (VS Code) or $149/year (IntelliJ IDEA Ultimate)

### Deployment
- **Apple Developer Program**: $99/year
- **Google Play Console**: $25 one-time
- **Code Signing Certificates**: Included in developer programs
- **CI/CD**: GitHub Actions free tier or $4/month per user

### Hosting & Services
- **Backend Hosting**: $20-200/month (varies by traffic)
- **Firebase Free Tier**: Generous limits (Crashlytics, Analytics)
- **Paid Monitoring**: $50-500/month (Sentry, Datadog, New Relic)

### Total First Year
- **Minimum**: ~$1,300 (Mac required, free tools, basic hosting)
- **Recommended**: ~$3,500 (good hardware, paid monitoring, CI/CD)

---

## Summary Checklist

### Before Starting Development
- [ ] Install Flutter SDK (3.x stable)
- [ ] Install Android Studio + Android SDK
- [ ] Install Xcode + Command Line Tools (macOS only)
- [ ] Run `flutter doctor` and fix all issues
- [ ] Clone project repository
- [ ] Run `flutter pub get`
- [ ] Run code generation: `dart run build_runner build`
- [ ] Configure backend API URL
- [ ] Test app on emulator/simulator

### Before Production Release
- [ ] Complete testing on physical devices
- [ ] Configure analytics and crash reporting
- [ ] Set up CI/CD pipeline
- [ ] Create signing keys (Android keystore, iOS certificates)
- [ ] Prepare app store assets (icons, screenshots, descriptions)
- [ ] Write privacy policy and terms of service
- [ ] Submit for app store review
- [ ] Monitor post-launch metrics

---

## Conclusion

This deployment requirements document provides a comprehensive guide for setting up, building, testing, and deploying the SmartKart Flutter mobile application. Follow the checklist and verify each component before proceeding to ensure a smooth development and deployment experience.

For specific setup questions or troubleshooting, refer to the official Flutter documentation or the resources listed in the Support Resources section.
