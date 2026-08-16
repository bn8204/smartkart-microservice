import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartkart_mobile/features/authentication/presentation/auth_controller.dart';
import 'package:smartkart_mobile/models/order_models.dart';
import 'package:smartkart_mobile/models/payment_models.dart';
import 'package:smartkart_mobile/repositories/order_repository.dart';

final myOrdersProvider =
    StateNotifierProvider<OrdersController, AsyncValue<List<OrderModel>>>((ref) {
  return OrdersController(ref.watch(orderRepositoryProvider), ref)..loadMyOrders();
});

final selectedOrderProvider =
    StateNotifierProvider<SelectedOrderController, AsyncValue<OrderModel?>>((ref) {
  return SelectedOrderController(ref.watch(orderRepositoryProvider));
});

final orderDetailsProvider = StateNotifierProvider<OrderDetailsController,
    AsyncValue<OrderDetailsResponseModel?>>((ref) {
  return OrderDetailsController(ref.watch(orderRepositoryProvider));
});

class OrdersController extends StateNotifier<AsyncValue<List<OrderModel>>> {
  OrdersController(this._repo, this._ref) : super(const AsyncValue.loading());

  final OrderRepository _repo;
  final Ref _ref;

  Future<void> loadMyOrders() async {
    final userId = _ref.read(authControllerProvider).user?.id;
    if (userId == null) {
      state = const AsyncValue.data(<OrderModel>[]);
      return;
    }

    try {
      state = const AsyncValue.loading();
      final orders = await _repo.myOrders(userId);
      state = AsyncValue.data(orders);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

class SelectedOrderController extends StateNotifier<AsyncValue<OrderModel?>> {
  SelectedOrderController(this._repo) : super(const AsyncValue.data(null));

  final OrderRepository _repo;

  Future<void> loadById(int id) async {
    try {
      state = const AsyncValue.loading();
      final order = await _repo.orderById(id);
      state = AsyncValue.data(order);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

class OrderDetailsController
    extends StateNotifier<AsyncValue<OrderDetailsResponseModel?>> {
  OrderDetailsController(this._repo) : super(const AsyncValue.data(null));

  final OrderRepository _repo;

  Future<void> load(int id) async {
    try {
      state = const AsyncValue.loading();
      final details = await _repo.orderDetails(id);
      state = AsyncValue.data(details);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
