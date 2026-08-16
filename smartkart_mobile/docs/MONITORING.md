# SmartKart Mobile - Monitoring & Observability

## Overview

This document outlines the monitoring, logging, crash reporting, and performance tracking strategy for the SmartKart Flutter mobile application.

---

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUTTER MOBILE APP                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Error Handler│  │ Logger       │  │ Analytics    │          │
│  │ (Zones)      │  │ (Console)    │  │ (Events)     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Firebase        │ │ Logger Service  │ │ Firebase        │
│ Crashlytics     │ │ (Remote)        │ │ Analytics       │
│ (Crash Reports) │ │ (Logs)          │ │ (User Behavior) │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MONITORING DASHBOARD                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Crash Trends │  │ Error Logs   │  │ User Funnels │          │
│  │ Device Types │  │ API Failures │  │ Screen Views │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Crash Reporting

### Firebase Crashlytics Integration

#### Setup

1. **Add Firebase to Flutter Project**

Create `firebase_options.dart`:
```dart
// lib/firebase_options.dart
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError('Web platform not supported');
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError('Unsupported platform');
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'YOUR_ANDROID_API_KEY',
    appId: 'YOUR_ANDROID_APP_ID',
    messagingSenderId: 'YOUR_SENDER_ID',
    projectId: 'smartkart-mobile',
    storageBucket: 'smartkart-mobile.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'YOUR_IOS_API_KEY',
    appId: 'YOUR_IOS_APP_ID',
    messagingSenderId: 'YOUR_SENDER_ID',
    projectId: 'smartkart-mobile',
    storageBucket: 'smartkart-mobile.appspot.com',
    iosBundleId: 'com.smartkart.mobile',
  );
}
```

2. **Update `pubspec.yaml`**
```yaml
dependencies:
  firebase_core: ^2.24.0
  firebase_crashlytics: ^3.4.8
  firebase_analytics: ^10.8.0
```

3. **Initialize in `main.dart`**
```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Pass all uncaught errors to Crashlytics
  FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;

  // Pass all uncaught asynchronous errors to Crashlytics
  PlatformDispatcher.instance.onError = (error, stack) {
    FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    return true;
  };

  runApp(const ProviderScope(child: SmartKartApp()));
}
```

#### Manual Error Reporting

```dart
// In controllers or services
try {
  await riskyOperation();
} catch (e, stack) {
  FirebaseCrashlytics.instance.recordError(
    e,
    stack,
    reason: 'Failed to load products',
    fatal: false,
  );
  rethrow;
}
```

#### Custom Keys and Logs

```dart
// Set user identifier
FirebaseCrashlytics.instance.setUserIdentifier(user.id.toString());

// Add custom keys
FirebaseCrashlytics.instance.setCustomKey('current_screen', 'checkout');
FirebaseCrashlytics.instance.setCustomKey('cart_items', cartItemCount);

// Add breadcrumb logs
FirebaseCrashlytics.instance.log('User tapped checkout button');
```

---

## 2. Application Logging

### Structured Logging Service

Create `lib/core/logging/app_logger.dart`:
```dart
import 'package:flutter/foundation.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

enum LogLevel { debug, info, warning, error, fatal }

class AppLogger {
  static void log(
    String message, {
    LogLevel level = LogLevel.info,
    Map<String, dynamic>? data,
    StackTrace? stackTrace,
  }) {
    final timestamp = DateTime.now().toIso8601String();
    final logEntry = '[$timestamp] [${level.name.toUpperCase()}] $message';

    // Console output (development)
    if (kDebugMode) {
      debugPrint(logEntry);
      if (data != null) debugPrint('  Data: $data');
      if (stackTrace != null) debugPrint('  Stack: $stackTrace');
    }

    // Crashlytics breadcrumb (all environments)
    FirebaseCrashlytics.instance.log(logEntry);

    // Report errors to Crashlytics
    if (level == LogLevel.error || level == LogLevel.fatal) {
      FirebaseCrashlytics.instance.recordError(
        Exception(message),
        stackTrace,
        fatal: level == LogLevel.fatal,
      );
    }

    // TODO: Send to remote logging service (e.g., Datadog, LogRocket)
    if (kReleaseMode && (level == LogLevel.error || level == LogLevel.fatal)) {
      _sendToRemoteLogger(logEntry, data, stackTrace);
    }
  }

  static void debug(String message, {Map<String, dynamic>? data}) =>
      log(message, level: LogLevel.debug, data: data);

  static void info(String message, {Map<String, dynamic>? data}) =>
      log(message, level: LogLevel.info, data: data);

  static void warning(String message, {Map<String, dynamic>? data}) =>
      log(message, level: LogLevel.warning, data: data);

  static void error(String message,
      {Map<String, dynamic>? data, StackTrace? stackTrace}) =>
      log(message, level: LogLevel.error, data: data, stackTrace: stackTrace);

  static void fatal(String message,
      {Map<String, dynamic>? data, StackTrace? stackTrace}) =>
      log(message, level: LogLevel.fatal, data: data, stackTrace: stackTrace);

  static Future<void> _sendToRemoteLogger(
    String message,
    Map<String, dynamic>? data,
    StackTrace? stackTrace,
  ) async {
    // Implement remote logging (HTTP POST to logging service)
    // Example: Datadog, LogRocket, Sentry
  }
}
```

#### Usage in Application

```dart
// In services
class ProductService {
  Future<List<ProductModel>> listProducts() async {
    AppLogger.info('Fetching product list', data: {'page': 1});
    
    try {
      final response = await _dio.get('/products');
      AppLogger.debug('Products fetched', data: {'count': response.data.length});
      return parseProducts(response.data);
    } catch (e, stack) {
      AppLogger.error('Failed to fetch products', 
        data: {'error': e.toString()},
        stackTrace: stack
      );
      rethrow;
    }
  }
}
```

---

## 3. Analytics & User Behavior Tracking

### Firebase Analytics Integration

#### Track Screen Views

```dart
// lib/core/analytics/analytics_service.dart
import 'package:firebase_analytics/firebase_analytics.dart';

class AnalyticsService {
  static final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;
  static final FirebaseAnalyticsObserver observer =
      FirebaseAnalyticsObserver(analytics: _analytics);

  static Future<void> logScreenView(String screenName) async {
    await _analytics.logScreenView(screenName: screenName);
    AppLogger.debug('Screen view tracked: $screenName');
  }

  static Future<void> logEvent(String name, Map<String, dynamic>? parameters) async {
    await _analytics.logEvent(name: name, parameters: parameters);
    AppLogger.debug('Event tracked: $name', data: parameters);
  }

  static Future<void> setUserId(int userId) async {
    await _analytics.setUserId(id: userId.toString());
  }

  static Future<void> setUserProperty(String name, String value) async {
    await _analytics.setUserProperty(name: name, value: value);
  }
}
```

#### Track Key Events

```dart
// In cart controller
Future<void> addItem({required int productId, int quantity = 1}) async {
  final userId = _ref.read(authControllerProvider).user?.id;
  if (userId == null) return;

  await _repo.addToCart(userId, productId, quantity);
  
  // Track event
  AnalyticsService.logEvent('add_to_cart', {
    'product_id': productId,
    'quantity': quantity,
    'user_id': userId,
  });
  
  await loadForCurrentUser();
}

// In checkout screen
await checkout(...);

AnalyticsService.logEvent('purchase', {
  'transaction_id': checkout.order.id,
  'value': double.parse(checkout.total),
  'currency': 'USD',
  'items': cart.items.length,
});
```

#### Predefined Events

Track standard e-commerce events:
- `login` - User authentication
- `sign_up` - New registration
- `view_item` - Product detail page
- `add_to_cart` - Add product to cart
- `begin_checkout` - Start checkout flow
- `purchase` - Order completed
- `search` - Product search
- `view_item_list` - Product catalog view

---

## 4. Performance Monitoring

### Firebase Performance Monitoring

#### Setup

Add to `pubspec.yaml`:
```yaml
dependencies:
  firebase_performance: ^0.9.3
```

#### Custom Traces

```dart
// lib/core/performance/performance_service.dart
import 'package:firebase_performance/firebase_performance.dart';

class PerformanceService {
  static Future<T> traceOperation<T>(
    String name,
    Future<T> Function() operation,
  ) async {
    final trace = FirebasePerformance.instance.newTrace(name);
    await trace.start();
    
    try {
      final result = await operation();
      trace.putAttribute('status', 'success');
      return result;
    } catch (e) {
      trace.putAttribute('status', 'error');
      trace.putAttribute('error', e.toString());
      rethrow;
    } finally {
      await trace.stop();
    }
  }
}

// Usage
final products = await PerformanceService.traceOperation(
  'fetch_products',
  () => productService.listProducts(),
);
```

#### HTTP Request Monitoring

Automatically tracked by Firebase Performance for Dio:
```dart
final dio = Dio();
dio.interceptors.add(DioFirebasePerformanceInterceptor());
```

#### Screen Rendering Metrics

```dart
// Automatically tracked by Firebase Performance plugin
// Monitor in Firebase Console:
// - Frame rendering times
// - Frozen frames
// - Slow frames
```

---

## 5. API Monitoring

### Network Request Logging

Update Dio client in `lib/core/network/api_client.dart`:
```dart
dio.interceptors.add(
  InterceptorsWrapper(
    onRequest: (options, handler) async {
      AppLogger.info('API Request', data: {
        'method': options.method,
        'url': options.uri.toString(),
      });
      
      final token = await storage.getToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      handler.next(options);
    },
    onResponse: (response, handler) {
      AppLogger.info('API Response', data: {
        'url': response.requestOptions.uri.toString(),
        'status': response.statusCode,
        'duration': '${response.requestOptions.extra['duration']}ms',
      });
      handler.next(response);
    },
    onError: (error, handler) {
      final statusCode = error.response?.statusCode;
      final message = _mapError(error);
      
      AppLogger.error('API Error', data: {
        'url': error.requestOptions.uri.toString(),
        'status': statusCode,
        'message': message,
      });
      
      // Track API failures in analytics
      AnalyticsService.logEvent('api_error', {
        'endpoint': error.requestOptions.path,
        'status_code': statusCode,
        'error_type': error.type.name,
      });
      
      handler.reject(
        DioException(
          requestOptions: error.requestOptions,
          response: error.response,
          type: error.type,
          error: ApiException(message, statusCode: statusCode),
        ),
      );
    },
  ),
);
```

---

## 6. User Session Recording

### LogRocket Integration (Optional)

Add to `pubspec.yaml`:
```yaml
dependencies:
  logrocket: ^1.0.0
```

Setup:
```dart
import 'package:logrocket/logrocket.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize LogRocket (production only)
  if (kReleaseMode) {
    LogRocket.init('your-app-id');
  }
  
  runApp(const ProviderScope(child: SmartKartApp()));
}

// Identify user after login
LogRocket.identify(user.id.toString(), {
  'name': user.name,
  'email': user.email,
  'role': user.role,
});
```

**Features**:
- Session replay
- Network request logs
- Console logs
- User actions timeline

---

## 7. Real-time Monitoring Dashboard

### Metrics to Track

#### Application Health
- **Crash-free rate**: % of sessions without crashes
- **ANR rate**: Application Not Responding events (Android)
- **App launch time**: Time to interactive
- **Memory usage**: Average and peak memory consumption

#### User Engagement
- **Daily Active Users (DAU)**
- **Monthly Active Users (MAU)**
- **Session duration**: Average time per session
- **Retention rate**: D1, D7, D30 retention

#### Feature Adoption
- **Feature usage**: % users using each feature
- **Conversion funnel**: Browse → Cart → Checkout → Purchase
- **Abandonment rate**: Cart and checkout abandonment

#### API Performance
- **Request count**: Total API calls per endpoint
- **Success rate**: % of 2xx responses
- **Error rate**: % of 4xx/5xx responses
- **P50, P95, P99 latency**: API response time percentiles

#### Business Metrics
- **Gross Merchandise Value (GMV)**: Total order value
- **Average Order Value (AOV)**: GMV / orders
- **Orders per user**: Average orders per customer
- **Top products**: Best-selling items

---

## 8. Alert Configuration

### Critical Alerts

Set up alerts in Firebase Console or monitoring platform:

1. **Crash Rate > 1%**
   - Trigger: Crash-free users < 99%
   - Action: Immediate investigation

2. **API Error Rate > 5%**
   - Trigger: 5xx responses > 5% of total
   - Action: Check backend health

3. **App Launch Time > 5s**
   - Trigger: P95 cold start > 5000ms
   - Action: Profile and optimize

4. **Memory Leak**
   - Trigger: Memory usage grows continuously
   - Action: Heap dump analysis

5. **Authentication Failures > 10%**
   - Trigger: Login success rate < 90%
   - Action: Check auth service

---

## 9. Debugging Tools

### Flutter DevTools

Launch during development:
```bash
flutter pub global activate devtools
flutter pub global run devtools
```

**Features**:
- Widget inspector
- Timeline view (performance profiling)
- Memory profiler
- Network profiler
- Logging view

### Platform-Specific

**Android**:
- Logcat: `adb logcat`
- Android Profiler (CPU, Memory, Network)
- Layout Inspector

**iOS**:
- Instruments (Time Profiler, Allocations, Network)
- Xcode debugger
- Console.app logs

---

## 10. Testing Monitoring Setup

### Verify Crash Reporting

```dart
// Add test crash button in debug mode
if (kDebugMode) {
  ElevatedButton(
    onPressed: () {
      FirebaseCrashlytics.instance.crash();
    },
    child: Text('Test Crash'),
  );
}
```

### Verify Analytics

```dart
// Check Firebase Console → Analytics → DebugView
// Enable debug mode:
// Android: adb shell setprop debug.firebase.analytics.app com.smartkart.mobile
// iOS: Edit scheme → Arguments → -FIRAnalyticsDebugEnabled
```

---

## 11. Privacy & Compliance

### Data Collection Disclosure

**App Store Privacy Labels**:
- Analytics data collected (screen views, events)
- Crash reports include device info
- User identifiers (user ID, email) tracked

**GDPR Compliance**:
- Allow users to opt out of analytics
- Provide data deletion mechanism
- Update privacy policy

### Opt-out Implementation

```dart
// In settings screen
Switch(
  value: analyticsEnabled,
  onChanged: (enabled) {
    FirebaseAnalytics.instance.setAnalyticsCollectionEnabled(enabled);
    FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(enabled);
  },
);
```

---

## 12. Monitoring Checklist

### Pre-Launch
- [ ] Firebase project created
- [ ] Crashlytics integrated and tested
- [ ] Analytics tracking key events
- [ ] Performance monitoring enabled
- [ ] Custom logging implemented
- [ ] Alert rules configured
- [ ] Privacy policy updated

### Post-Launch
- [ ] Monitor crash-free rate daily
- [ ] Review top errors weekly
- [ ] Analyze user funnels monthly
- [ ] Optimize slow API endpoints
- [ ] Update dashboards as needed
- [ ] Respond to alerts within SLA

---

## Conclusion

Comprehensive monitoring ensures the SmartKart mobile app delivers a reliable, performant experience. This setup provides visibility into crashes, errors, user behavior, and performance metrics, enabling data-driven decisions and rapid issue resolution.

For implementation assistance, refer to the official Firebase documentation and Flutter DevTools guides.
