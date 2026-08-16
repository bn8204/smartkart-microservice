import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartkart_mobile/models/order_models.dart';
import 'package:smartkart_mobile/repositories/order_repository.dart';

final adminOrdersProvider =
    StateNotifierProvider<AdminController, AsyncValue<List<OrderModel>>>((ref) {
  return AdminController(ref.watch(orderRepositoryProvider))..loadOrders();
});

class AdminController extends StateNotifier<AsyncValue<List<OrderModel>>> {
  AdminController(this._repo) : super(const AsyncValue.loading());

  final OrderRepository _repo;

  Future<void> loadOrders() async {
    try {
      state = const AsyncValue.loading();
      final orders = await _repo.allOrders();
      state = AsyncValue.data(orders);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> updateOrderStatus(int id, String status) async {
    await _repo.updateStatus(id, status);
    await loadOrders();
  }
}
