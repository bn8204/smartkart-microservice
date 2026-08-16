import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smartkart_mobile/features/admin/presentation/admin_dashboard_screen.dart';
import 'package:smartkart_mobile/features/authentication/presentation/auth_controller.dart';
import 'package:smartkart_mobile/features/authentication/presentation/login_screen.dart';
import 'package:smartkart_mobile/features/authentication/presentation/register_screen.dart';
import 'package:smartkart_mobile/features/authentication/presentation/splash_screen.dart';
import 'package:smartkart_mobile/features/cart/presentation/cart_screen.dart';
import 'package:smartkart_mobile/features/home/presentation/home_screen.dart';
import 'package:smartkart_mobile/features/orders/presentation/checkout_screen.dart';
import 'package:smartkart_mobile/features/orders/presentation/order_details_screen.dart';
import 'package:smartkart_mobile/features/orders/presentation/orders_screen.dart';
import 'package:smartkart_mobile/features/payments/presentation/payment_confirmation_screen.dart';
import 'package:smartkart_mobile/features/payments/presentation/payment_status_screen.dart';
import 'package:smartkart_mobile/features/products/presentation/product_details_screen.dart';
import 'package:smartkart_mobile/features/products/presentation/products_screen.dart';
import 'package:smartkart_mobile/features/shared/presentation/app_shell.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final path = state.uri.path;
      final isAuthRoute = path == '/login' || path == '/register';
      final initialized = authState.initialized;
      final authenticated = authState.user != null;

      if (!initialized && path != '/splash') return '/splash';
      if (initialized && !authenticated && !isAuthRoute) return '/login';
      if (initialized && authenticated && (isAuthRoute || path == '/splash')) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      ShellRoute(
        builder: (_, __, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/products', builder: (_, __) => const ProductsScreen()),
          GoRoute(
            path: '/products/:id',
            builder: (_, state) => ProductDetailsScreen(
              productId: int.parse(state.pathParameters['id']!),
            ),
          ),
          GoRoute(path: '/cart', builder: (_, __) => const CartScreen()),
          GoRoute(path: '/orders', builder: (_, __) => const OrdersScreen()),
          GoRoute(path: '/checkout', builder: (_, __) => const CheckoutScreen()),
          GoRoute(
            path: '/orders/:id',
            builder: (_, state) => OrderDetailsScreen(
              orderId: int.parse(state.pathParameters['id']!),
            ),
          ),
          GoRoute(
            path: '/orders/:id/confirmation',
            builder: (_, state) => PaymentConfirmationScreen(
              orderId: int.parse(state.pathParameters['id']!),
            ),
          ),
          GoRoute(
            path: '/orders/:id/payments',
            builder: (_, state) => PaymentStatusScreen(
              orderId: int.parse(state.pathParameters['id']!),
            ),
          ),
          GoRoute(path: '/admin', builder: (_, __) => const AdminDashboardScreen()),
        ],
      ),
    ],
  );
});
