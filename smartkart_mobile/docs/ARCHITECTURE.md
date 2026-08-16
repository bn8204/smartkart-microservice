# SmartKart Mobile - Architecture Documentation

## Overview

SmartKart Mobile is a cross-platform Flutter application that integrates with the SmartKart microservices backend. It follows clean architecture principles with clear separation between UI, business logic, and data layers.

---

## Logical Architecture

### Layer Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Screens      │  │ Widgets      │  │ Controllers  │          │
│  │ (UI Views)   │  │ (Reusable)   │  │ (Riverpod)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                  │                   │
└─────────┼─────────────────┼──────────────────┼───────────────────┘
          │                 │                  │
          └─────────────────┴──────────────────┘
                            │
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ State Mgmt   │  │ Use Cases    │  │ Validators   │          │
│  │ (Riverpod)   │  │ (Business)   │  │ (Rules)      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                  │                   │
└─────────┼─────────────────┼──────────────────┼───────────────────┘
          │                 │                  │
          └─────────────────┴──────────────────┘
                            │
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Repositories │  │ Services     │  │ Models       │          │
│  │ (Aggregate)  │  │ (API Calls)  │  │ (DTOs)       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                  │                   │
└─────────┼─────────────────┼──────────────────┼───────────────────┘
          │                 │                  │
          └─────────────────┴──────────────────┘
                            │
┌─────────────────────────────────────────────────────────────────┐
│                      NETWORK LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Dio Client   │  │ Interceptors │  │ Error Handler│          │
│  │ (HTTP)       │  │ (JWT Auth)   │  │ (Exceptions) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                  │                   │
└─────────┼─────────────────┼──────────────────┼───────────────────┘
          │                 │                  │
          └─────────────────┴──────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │   API Gateway :8080         │
              │   /api/v1/*                 │
              └─────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
    ┌──────────────────┐      ┌──────────────────┐
    │ User Service     │      │ Product Service  │
    │ :3001            │      │ :3002            │
    └──────────────────┘      └──────────────────┘
              ▼                           ▼
    ┌──────────────────┐      ┌──────────────────┐
    │ Order Service    │      │ Payment Service  │
    │ :3003            │      │ :3004            │
    └──────────────────┘      └──────────────────┘
```

---

## Component Responsibilities

### 1. Presentation Layer

#### Screens
- **Purpose**: UI views for each feature
- **Technology**: Flutter widgets (StatelessWidget/StatefulWidget/ConsumerWidget)
- **Location**: `lib/features/*/presentation/*_screen.dart`
- **Examples**:
  - `login_screen.dart` - User authentication
  - `products_screen.dart` - Product catalog browsing
  - `cart_screen.dart` - Shopping cart management
  - `orders_screen.dart` - Order history and tracking
  - `admin_dashboard_screen.dart` - Admin order management

#### Widgets
- **Purpose**: Reusable UI components
- **Location**: `lib/widgets/`
- **Examples**:
  - `app_loading.dart` - Loading indicators
  - `app_error_state.dart` - Error display with retry
  - `product_shimmer.dart` - Skeleton loading animation
  - `offline_banner.dart` - Network status indicator

#### Controllers (State Notifiers)
- **Purpose**: Manage feature-specific state using Riverpod
- **Pattern**: StateNotifier with AsyncValue for async operations
- **Location**: `lib/features/*/presentation/*_controller.dart`
- **Responsibilities**:
  - React to user actions
  - Coordinate repository calls
  - Emit new states
  - Handle loading/error states

---

### 2. Business Logic Layer

#### State Management (Riverpod)
- **Pattern**: Provider-based dependency injection and state management
- **Benefits**:
  - Compile-time safety
  - No BuildContext needed
  - Automatic disposal
  - Testing friendly
- **Key Providers**:
  - `authControllerProvider` - Authentication state
  - `productsControllerProvider` - Product catalog state
  - `cartControllerProvider` - Shopping cart state
  - `myOrdersProvider` - User orders state

#### Validators
- **Purpose**: Input validation rules
- **Location**: Inline in screens or separate validator files
- **Examples**:
  - Email format validation
  - Password strength (min 8 chars)
  - Required field checks

---

### 3. Data Layer

#### Repositories
- **Purpose**: Aggregate data sources and provide business-focused APIs
- **Pattern**: Repository pattern
- **Location**: `lib/repositories/`
- **Responsibilities**:
  - Abstract away service implementation details
  - Combine multiple service calls if needed
  - Transform data for business logic layer
  - Handle local storage coordination

**Examples**:
```dart
class AuthRepository {
  - login(email, password) → UserModel
  - register(name, email, password) → UserModel
  - restoreSession() → UserModel?
  - logout() → void
}

class ProductRepository {
  - latestProducts() → List<ProductModel>
  - featuredProducts() → List<ProductModel>
  - searchProducts(query) → List<ProductModel>
  - productById(id) → ProductModel
}

class OrderRepository {
  - getCart(userId) → CartModel
  - addToCart(userId, productId, quantity) → CartItemModel
  - checkout(userId, items, address) → CheckoutResponseModel
  - myOrders(userId) → List<OrderModel>
  - orderById(id) → OrderModel
}
```

#### Services
- **Purpose**: Direct API communication with backend
- **Pattern**: Service classes with Dio HTTP client
- **Location**: `lib/services/`
- **Responsibilities**:
  - Execute HTTP requests
  - Parse JSON responses
  - Throw exceptions on errors

**API Endpoints**:
```
AuthService:
  POST /api/v1/auth/register
  POST /api/v1/auth/login
  GET  /api/v1/auth/users/:id

ProductService:
  GET  /api/v1/products?page=1&limit=20
  GET  /api/v1/products/:id
  GET  /api/v1/products/search?q=query

OrderService:
  GET  /api/v1/orders/cart/:userId
  POST /api/v1/orders/cart/items
  DELETE /api/v1/orders/cart/items/:itemId
  POST /api/v1/orders/checkout
  GET  /api/v1/orders/my/:userId
  GET  /api/v1/orders/:id
  GET  /api/v1/orders/:id/details (composition)
  PATCH /api/v1/orders/:id/status

PaymentService:
  GET  /api/v1/payments/order/:orderId
  GET  /api/v1/payments
```

#### Models
- **Purpose**: Data transfer objects (DTOs)
- **Technology**: Freezed + json_serializable for immutability and serialization
- **Location**: `lib/models/`
- **Field Mapping**: Maps backend snake_case to Dart camelCase using @JsonKey

**Core Models**:
```dart
UserModel {
  int id
  String name
  String email
  String role (user|admin)
  String? createdAt
}

ProductModel {
  int id
  String name
  String? description
  double price
  int stock
  String? category
  String? imageUrl
  String? createdAt
}

OrderModel {
  int id
  int userId
  String totalAmount
  String status (PENDING|CONFIRMED|SHIPPED|DELIVERED|FAILED|CANCELLED)
  String? shippingAddress
  List<OrderItemModel> items
  String? createdAt
}

CartModel {
  int? cartId
  List<CartItemModel> items
  String total
}

PaymentModel {
  int id
  int orderId
  int userId
  String amount
  String status (PENDING|SUCCESS|FAILED)
  String? paymentMethod
  String? createdAt
}
```

---

### 4. Network Layer

#### Dio Client
- **Purpose**: Centralized HTTP client configuration
- **Location**: `lib/core/network/api_client.dart`
- **Configuration**:
  - Base URL: Environment variable `GATEWAY_BASE_URL`
  - Connect timeout: 20 seconds
  - Receive timeout: 25 seconds
  - Content-Type: application/json

#### JWT Interceptor
- **Purpose**: Automatically attach Bearer token to requests
- **Implementation**: Dio interceptor reads JWT from secure storage
- **Flow**:
  1. Read token from flutter_secure_storage
  2. Add `Authorization: Bearer {token}` header
  3. Forward request

#### Error Handler
- **Purpose**: Centralized error mapping
- **HTTP Status Codes**:
  - 401 → "Unauthorized. Please login again."
  - 403 → "Forbidden. You do not have access."
  - 404 → "Resource not found."
  - 500 → "Server error. Please try later."
  - Timeout → "Request timeout. Please try again."
  - Connection error → "No internet connection."
- **Custom**: ApiException with message and statusCode

---

### 5. Core Infrastructure

#### Secure Storage
- **Purpose**: Persistent JWT token storage
- **Technology**: flutter_secure_storage (platform keychain)
- **Data Stored**:
  - JWT token
  - User ID
  - User role

#### Router (GoRouter)
- **Purpose**: Declarative navigation with deep linking support
- **Features**:
  - Route protection (authentication guard)
  - Nested navigation with ShellRoute
  - Bottom navigation bar integration
- **Routes**:
  - `/splash` - Initial bootstrap
  - `/login` - Authentication
  - `/register` - User registration
  - `/home` - Dashboard (protected)
  - `/products` - Product catalog (protected)
  - `/products/:id` - Product details (protected)
  - `/cart` - Shopping cart (protected)
  - `/checkout` - Order checkout (protected)
  - `/orders` - Order history (protected)
  - `/orders/:id` - Order details (protected)
  - `/orders/:id/confirmation` - Success screen (protected)
  - `/admin` - Admin dashboard (protected, admin-only)

#### Theme System
- **Technology**: Material Design 3
- **Modes**: Light and dark theme support
- **Location**: `lib/core/theme/app_theme.dart`

---

## Data Flow Example: Add to Cart

```
User taps "Add to Cart" button
          │
          ▼
┌─────────────────────────┐
│  ProductDetailsScreen   │
│  (Presentation)         │
└───────────┬─────────────┘
            │ cartController.addItem(productId)
            ▼
┌─────────────────────────┐
│  CartController         │
│  (Business Logic)       │
└───────────┬─────────────┘
            │ orderRepository.addToCart(...)
            ▼
┌─────────────────────────┐
│  OrderRepository        │
│  (Data Aggregation)     │
└───────────┬─────────────┘
            │ orderService.addToCart(...)
            ▼
┌─────────────────────────┐
│  OrderService           │
│  (API Client)           │
└───────────┬─────────────┘
            │ POST /api/v1/orders/cart/items
            │ { user_id, product_id, quantity }
            ▼
┌─────────────────────────┐
│  Dio HTTP Client        │
│  + JWT Interceptor      │
└───────────┬─────────────┘
            │ HTTP Request
            ▼
┌─────────────────────────┐
│  API Gateway :8080      │
└───────────┬─────────────┘
            │ Proxy to order-service
            ▼
┌─────────────────────────┐
│  Order Service :3003    │
│  (Backend)              │
└───────────┬─────────────┘
            │ Response: CartItemModel JSON
            ▼
┌─────────────────────────┐
│  OrderService           │
│  Parse JSON → CartItem  │
└───────────┬─────────────┘
            │ Return CartItemModel
            ▼
┌─────────────────────────┐
│  OrderRepository        │
└───────────┬─────────────┘
            │ Return CartItemModel
            ▼
┌─────────────────────────┐
│  CartController         │
│  Update AsyncValue<Cart>│
└───────────┬─────────────┘
            │ State change notifies listeners
            ▼
┌─────────────────────────┐
│  ProductDetailsScreen   │
│  Shows SnackBar success │
└─────────────────────────┘
```

---

## Security Architecture

### Authentication Flow

```
User enters credentials
          │
          ▼
┌─────────────────────────┐
│  LoginScreen            │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  AuthController         │
│  .login(email, password)│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  AuthRepository         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  AuthService            │
│  POST /auth/login       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Backend validates      │
│  Returns: { user, token}│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  AuthRepository         │
│  .saveAuthSession(...)  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  SecureStorageService   │
│  Store JWT in keychain  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  AuthController         │
│  Update state with user │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  GoRouter redirect      │
│  Navigate to /home      │
└─────────────────────────┘
```

### Token Management
- **Storage**: Platform-specific secure storage (Keychain on iOS, Keystore on Android)
- **Lifecycle**: Token stored on login, attached to every API call, cleared on logout
- **Refresh**: Not implemented (assumes 7-day expiry from backend)

---

## Offline Handling

### Connectivity Detection
- **Package**: connectivity_plus
- **UI**: OfflineBanner widget displays warning when offline
- **Behavior**:
  - Network requests fail with "No internet connection" error
  - User sees error state with retry button
  - Banner automatically hides when connection restored

### Future Enhancement: Local Caching
- Could implement SQLite for offline product browsing
- Cart persistence for offline add-to-cart
- Queue failed orders for retry when online

---

## Testing Strategy

### Unit Tests
- Test state controllers in isolation
- Mock repositories using Mockito/Mocktail
- Verify state transitions

### Widget Tests
- Test UI components render correctly
- Verify user interactions trigger expected callbacks
- Use ProviderScope.overrideWith for mocking providers

### Integration Tests
- Test full user flows (login → browse → add to cart → checkout)
- Use real backend or mock server (http package)

---

## Performance Optimization

### Image Loading
- Currently using placeholder icons
- Production: Implement cached_network_image for product images
- Image CDN integration recommended

### List Rendering
- Products grid uses Flutter's built-in virtualization
- Orders list is paginated (20 items per page)
- Pull-to-refresh implemented

### State Management
- Riverpod providers automatically dispose when no longer watched
- AsyncValue prevents unnecessary rebuilds
- Selective listening with ref.watch minimizes widget rebuilds

---

## Platform-Specific Considerations

### Android
- Minimum SDK: 21 (Android 5.0 Lollipop)
- Target SDK: Latest stable
- Permissions: Internet access (automatic)
- Build: Gradle-based (Kotlin DSL)

### iOS
- Minimum version: iOS 12.0
- Swift-based native code (MainActivity)
- Permissions: NSAppTransportSecurity configured for HTTP (dev only)
- Build: Xcode project with CocoaPods

---

## Scalability Considerations

### Current Architecture Supports:
- Adding new features as isolated modules under `lib/features/`
- New API services without changing existing code
- Multiple themes/brands through theme configuration
- Multi-language support (add intl package and ARB files)

### Future Enhancements:
- Push notifications (Firebase Cloud Messaging)
- Real-time order tracking (WebSockets)
- Biometric authentication (local_auth package)
- Payment gateway integration (Stripe, Razorpay)
- Analytics (Firebase Analytics, Mixpanel)
- A/B testing framework

---

## Monitoring & Observability

See `MONITORING.md` for detailed setup instructions.
