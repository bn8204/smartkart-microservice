# SmartKart Mobile

A cross-platform Flutter mobile application for the SmartKart e-commerce platform, built with clean architecture and production-ready features.

[![Flutter](https://img.shields.io/badge/Flutter-3.44.6-02569B?logo=flutter)](https://flutter.dev)
[![Dart](https://img.shields.io/badge/Dart-3.12.2-0175C2?logo=dart)](https://dart.dev)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📱 Overview

SmartKart Mobile is a feature-rich e-commerce client app that connects to the SmartKart microservices backend. Built with Flutter, it provides a seamless shopping experience on both Android and iOS platforms.

### Key Features

- 🔐 **Authentication**: Secure JWT-based login and registration
- 🛍️ **Product Catalog**: Browse, search, and filter products with categories
- 🛒 **Shopping Cart**: Real-time cart management with quantity updates
- 📦 **Order Management**: Place orders, track status, view history
- 💳 **Payment Integration**: Payment status tracking and confirmation
- 👨‍💼 **Admin Dashboard**: Order management for administrators
- 🌙 **Theming**: Material Design 3 with light/dark mode support
- 📱 **Responsive UI**: Optimized for phones and tablets
- 🔄 **Offline Handling**: Graceful network error recovery with retry
- 🎨 **Smooth Animations**: Shimmer loading, transitions, and interactions

---

## 🏗️ Architecture

SmartKart Mobile follows **Clean Architecture** principles with clear separation of concerns:

![Architecture Diagram](docs/diagrams/logical_architecture.mmd)

### Layer Structure

```
┌─────────────────────────────────────────┐
│      PRESENTATION LAYER                 │  ← Screens, Widgets, Controllers
├─────────────────────────────────────────┤
│      BUSINESS LOGIC LAYER               │  ← State Management, Validators
├─────────────────────────────────────────┤
│      DATA LAYER                         │  ← Repositories, Services, Models
├─────────────────────────────────────────┤
│      NETWORK LAYER                      │  ← Dio Client, Interceptors
├─────────────────────────────────────────┤
│      BACKEND MICROSERVICES              │  ← API Gateway → Services
└─────────────────────────────────────────┘
```

### Documentation

- 📖 [Architecture Documentation](docs/ARCHITECTURE.md) - Detailed component responsibilities and data flows
- 🗃️ [ER Diagram](docs/ER_DIAGRAM.md) - Database schema and entity relationships
- 🚀 [Deployment Requirements](docs/DEPLOYMENT_REQUIREMENTS.md) - Hardware, software, and build setup
- 📊 [Monitoring & Observability](docs/MONITORING.md) - Crash reporting, analytics, logging

### Visual Diagrams

- [Logical Architecture](docs/diagrams/logical_architecture.mmd)
- [ER Diagram](docs/diagrams/er_diagram.mmd)
- [Authentication Flow](docs/diagrams/authentication_flow.mmd)
- [Add to Cart Flow](docs/diagrams/add_to_cart_flow.mmd)
- [Database Architecture](docs/diagrams/database_architecture.mmd)

---

## 🛠️ Technology Stack

### Core Framework
- **Flutter** 3.44.6 - Cross-platform UI framework
- **Dart** 3.12.2 - Programming language

### State Management
- **Riverpod** 2.5.1 - Compile-safe dependency injection and state management
- **Riverpod Generator** 2.4.3 - Code generation for providers

### Navigation
- **GoRouter** 14.2.1 - Declarative routing with deep linking

### Networking
- **Dio** 5.5.0 - HTTP client with interceptors
- **Pretty Dio Logger** 1.4.0 - Request/response logging

### Data Persistence
- **flutter_secure_storage** 9.2.2 - Secure JWT storage (Keychain/Keystore)

### Code Generation
- **freezed** 2.5.7 - Immutable data classes
- **json_serializable** 6.8.0 - JSON serialization
- **build_runner** 2.4.11 - Code generation orchestrator

### UI/UX
- **shimmer** 3.0.0 - Loading skeleton animations
- **connectivity_plus** 6.0.5 - Network status detection
- **intl** 0.19.0 - Internationalization and formatting

---

## 📂 Project Structure

```
smartkart_mobile/
├── lib/
│   ├── core/                        # Core infrastructure
│   │   ├── config/
│   │   │   └── app_config.dart      # Environment configuration
│   │   ├── network/
│   │   │   ├── api_client.dart      # Dio HTTP client + interceptors
│   │   │   └── network_exceptions.dart
│   │   ├── router/
│   │   │   └── app_router.dart      # GoRouter configuration
│   │   ├── storage/
│   │   │   └── secure_storage_service.dart  # JWT storage
│   │   └── theme/
│   │       └── app_theme.dart       # Material Design 3 theme
│   │
│   ├── features/                    # Feature modules (clean architecture)
│   │   ├── authentication/
│   │   │   └── presentation/
│   │   │       ├── auth_controller.dart     # State + logic
│   │   │       ├── login_screen.dart
│   │   │       ├── register_screen.dart
│   │   │       └── splash_screen.dart
│   │   ├── home/
│   │   │   └── presentation/
│   │   │       ├── home_controller.dart
│   │   │       └── home_screen.dart
│   │   ├── products/
│   │   │   └── presentation/
│   │   │       ├── products_controller.dart
│   │   │       ├── products_screen.dart
│   │   │       └── product_details_screen.dart
│   │   ├── cart/
│   │   │   └── presentation/
│   │   │       ├── cart_controller.dart
│   │   │       └── cart_screen.dart
│   │   ├── orders/
│   │   │   └── presentation/
│   │   │       ├── orders_controller.dart
│   │   │       ├── orders_screen.dart
│   │   │       ├── order_details_screen.dart
│   │   │       └── checkout_screen.dart
│   │   ├── payments/
│   │   │   └── presentation/
│   │   │       ├── payment_confirmation_screen.dart
│   │   │       └── payment_status_screen.dart
│   │   ├── admin/
│   │   │   └── presentation/
│   │   │       ├── admin_controller.dart
│   │   │       └── admin_dashboard_screen.dart
│   │   └── shared/
│   │       └── presentation/
│   │           └── app_shell.dart   # Bottom nav shell
│   │
│   ├── models/                      # Freezed data models
│   │   ├── auth_models.dart         # User, LoginRequest, RegisterRequest
│   │   ├── product_models.dart      # Product
│   │   ├── cart_models.dart         # Cart, CartItem
│   │   ├── order_models.dart        # Order, OrderItem, CheckoutResponse
│   │   └── payment_models.dart      # Payment
│   │
│   ├── repositories/                # Data aggregation layer
│   │   ├── auth_repository.dart
│   │   ├── product_repository.dart
│   │   ├── order_repository.dart
│   │   └── payment_repository.dart
│   │
│   ├── services/                    # API client layer
│   │   ├── auth_service.dart
│   │   ├── product_service.dart
│   │   ├── order_service.dart
│   │   └── payment_service.dart
│   │
│   ├── widgets/                     # Reusable UI components
│   │   ├── app_loading.dart
│   │   ├── app_error_state.dart
│   │   ├── product_shimmer.dart
│   │   └── offline_banner.dart
│   │
│   └── main.dart                    # App entry point
│
├── test/
│   └── widget_test.dart             # Unit and widget tests
│
├── android/                         # Android native project
├── ios/                            # iOS native project
├── docs/                           # Comprehensive documentation
├── pubspec.yaml                    # Dependencies
├── analysis_options.yaml           # Lint rules
└── README.md                       # This file
```

---

## 🚀 Getting Started

### Prerequisites

**Required Software**:
- Flutter SDK 3.x ([Install Guide](https://docs.flutter.dev/get-started/install))
- Dart SDK 3.x (bundled with Flutter)
- Git

**Platform-Specific**:
- **Android**: Android Studio + Android SDK (API 21+)
- **iOS** (macOS only): Xcode 15+ + CocoaPods

**Backend**:
- SmartKart API Gateway running and accessible

### Installation

1. **Clone the repository**
```bash
cd smartcart-microservices
# The smartkart_mobile folder already exists in your workspace
```

2. **Install dependencies**
```bash
cd smartkart_mobile
flutter pub get
```

3. **Generate code** (Freezed + json_serializable)
```bash
dart run build_runner build --delete-conflicting-outputs
```

4. **Verify setup**
```bash
flutter doctor -v
flutter analyze
flutter test
```

### Running the App

#### Development Mode

**Android Emulator**:
```bash
flutter run --dart-define=GATEWAY_BASE_URL=http://10.0.2.2:8080/api/v1
```
> Use `10.0.2.2` to access host machine's localhost from Android emulator

**iOS Simulator**:
```bash
flutter run --dart-define=GATEWAY_BASE_URL=http://localhost:8080/api/v1
```

**Physical Device** (on same WiFi):
```bash
flutter run --dart-define=GATEWAY_BASE_URL=http://192.168.1.10:8080/api/v1
```
> Replace `192.168.1.10` with your host machine's IP address

#### Hot Reload
While app is running, press:
- `r` - Hot reload (preserves state)
- `R` - Hot restart (resets state)
- `q` - Quit

---

## 📦 Building for Release

### Android

**APK** (for direct installation):
```bash
flutter build apk --release --dart-define=GATEWAY_BASE_URL=https://api.smartkart.com/api/v1
```
Output: `build/app/outputs/flutter-apk/app-release.apk`

**App Bundle** (for Google Play):
```bash
flutter build appbundle --release --dart-define=GATEWAY_BASE_URL=https://api.smartkart.com/api/v1
```
Output: `build/app/outputs/bundle/release/app-release.aab`

### iOS

```bash
flutter build ios --release --dart-define=GATEWAY_BASE_URL=https://api.smartkart.com/api/v1
```

Then open `ios/Runner.xcworkspace` in Xcode and archive for App Store distribution.

---

## 🧪 Testing

### Run All Tests
```bash
flutter test
```

### Run with Coverage
```bash
flutter test --coverage
lcov --list coverage/lcov.info
```

### Analyzer
```bash
flutter analyze
```

### Format Code
```bash
dart format lib/ test/
```

---

## 🔌 API Integration

The app communicates exclusively through the **API Gateway** at `/api/v1/*`:

### Authentication Endpoints
- `POST /api/v1/auth/register` - Create new user account
- `POST /api/v1/auth/login` - Authenticate and receive JWT token
- `GET /api/v1/auth/users/:id` - Fetch user profile

### Product Endpoints
- `GET /api/v1/products?page=1&limit=20` - List products (paginated)
- `GET /api/v1/products/:id` - Get product details
- `GET /api/v1/products/search?q=query` - Search products by name

### Cart & Order Endpoints
- `GET /api/v1/orders/cart/:userId` - Get user's active cart
- `POST /api/v1/orders/cart/items` - Add product to cart
- `DELETE /api/v1/orders/cart/items/:itemId` - Remove cart item
- `POST /api/v1/orders/checkout` - Create order from cart
- `GET /api/v1/orders/my/:userId` - List user's orders
- `GET /api/v1/orders/:id` - Get order with details
- `PATCH /api/v1/orders/:id/status` - Update order status (admin only)

### Payment Endpoints
- `GET /api/v1/payments/order/:orderId` - Get payment for order
- `GET /api/v1/payments` - List all payments (admin only)

**Authentication**: All endpoints (except login/register) require `Authorization: Bearer <JWT>` header.

---

## 🔒 Security

### Authentication Flow
1. User logs in → Receives JWT token
2. Token stored securely using platform keychain (iOS) / Keystore (Android)
3. JWT automatically attached to every API request via Dio interceptor
4. Token cleared on logout

### Best Practices
- ✅ JWT tokens never stored in plain text
- ✅ HTTPS enforced in production (App Transport Security on iOS)
- ✅ No sensitive data in logs (release mode)
- ✅ Backend validates all JWT tokens
- ✅ Passwords bcrypt-hashed on backend

---

## 📊 Monitoring & Analytics

### Recommended Setup

1. **Crash Reporting**: Firebase Crashlytics
   - Automatic crash detection
   - Breadcrumb logging
   - User identification

2. **Analytics**: Firebase Analytics
   - Screen views
   - User events (login, add_to_cart, purchase)
   - Conversion funnels

3. **Performance Monitoring**: Firebase Performance
   - HTTP request latency
   - Screen rendering times
   - Custom traces

4. **Logging**: Custom logger service
   - Debug/Info/Warning/Error/Fatal levels
   - Remote log aggregation

See [MONITORING.md](docs/MONITORING.md) for detailed implementation guide.

---

## 🌍 Deployment Requirements

### Hardware
- **Minimum**: Intel i5 / Ryzen 5, 8GB RAM, 10GB storage
- **Recommended**: Intel i7 / Ryzen 7 / Apple M1+, 16GB RAM, 20GB SSD

### Software
- Flutter 3.x, Android Studio / Xcode, Git
- For iOS: macOS + Apple Developer account ($99/year for App Store)
- For Android: Google Play Console account ($25 one-time)

### Build Times
- Debug build: 2-5 minutes
- Release APK: 5-10 minutes
- Release iOS: 10-20 minutes

See [DEPLOYMENT_REQUIREMENTS.md](docs/DEPLOYMENT_REQUIREMENTS.md) for complete setup guide.

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test: `flutter analyze && flutter test`
3. Commit: `git commit -m "feat: add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

### Code Style
- Follow [Effective Dart](https://dart.dev/guides/language/effective-dart)
- Use `dart format` before committing
- Write widget tests for UI components
- Document public APIs with `///` doc comments

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- 📖 [Flutter Documentation](https://docs.flutter.dev/)
- 💬 [Flutter Discord](https://discord.gg/flutter)
- 🐛 [Issue Tracker](https://github.com/your-org/smartkart/issues)
- 📧 Email: support@smartkart.com

---

## 🎯 Roadmap

- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Biometric authentication (fingerprint/Face ID)
- [ ] Real-time order tracking (WebSockets)
- [ ] Multi-language support (i18n)
- [ ] Payment gateway integration (Stripe/Razorpay)
- [ ] Product reviews and ratings
- [ ] Wishlist feature
- [ ] Social login (Google/Apple/Facebook)

---

**Built with ❤️ using Flutter**

## Architecture

Feature-based clean architecture under `lib/features` and shared core under `lib/core`.
