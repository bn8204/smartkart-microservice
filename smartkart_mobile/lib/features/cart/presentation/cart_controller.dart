import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartkart_mobile/features/authentication/presentation/auth_controller.dart';
import 'package:smartkart_mobile/models/cart_models.dart';
import 'package:smartkart_mobile/repositories/order_repository.dart';

final cartControllerProvider =
    StateNotifierProvider<CartController, AsyncValue<CartModel>>((ref) {
  return CartController(ref.watch(orderRepositoryProvider), ref)
    ..loadForCurrentUser();
});

class CartController extends StateNotifier<AsyncValue<CartModel>> {
  CartController(this._repo, this._ref) : super(const AsyncValue.loading());

  final OrderRepository _repo;
  final Ref _ref;

  Future<void> loadForCurrentUser() async {
    final userId = _ref.read(authControllerProvider).user?.id;
    if (userId == null) {
      state = const AsyncValue.data(CartModel());
      return;
    }

    try {
      state = const AsyncValue.loading();
      final cart = await _repo.getCart(userId);
      state = AsyncValue.data(cart);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> addItem({required int productId, int quantity = 1}) async {
    final userId = _ref.read(authControllerProvider).user?.id;
    if (userId == null) return;

    await _repo.addToCart(userId, productId, quantity);
    await loadForCurrentUser();
  }

  Future<void> removeItem(int itemId) async {
    await _repo.removeCartItem(itemId);
    await loadForCurrentUser();
  }

  Future<void> updateQuantity(CartItemModel item, int nextQty) async {
    if (nextQty <= 0) {
      await removeItem(item.id);
      return;
    }

    await removeItem(item.id);
    await addItem(productId: item.productId, quantity: nextQty);
  }
}
