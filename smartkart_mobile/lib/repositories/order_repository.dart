import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartkart_mobile/core/network/api_client.dart';
import 'package:smartkart_mobile/models/cart_models.dart';
import 'package:smartkart_mobile/models/order_models.dart';
import 'package:smartkart_mobile/models/payment_models.dart';
import 'package:smartkart_mobile/services/order_service.dart';

final orderServiceProvider = Provider<OrderService>(
  (ref) => OrderService(ref.watch(dioProvider)),
);

final orderRepositoryProvider = Provider<OrderRepository>(
  (ref) => OrderRepository(ref.watch(orderServiceProvider)),
);

class OrderRepository {
  OrderRepository(this._service);

  final OrderService _service;

  Future<CartModel> getCart(int userId) => _service.getCart(userId);

  Future<CartItemModel> addToCart(int userId, int productId, int quantity) =>
      _service.addToCart(userId: userId, productId: productId, quantity: quantity);

  Future<void> removeCartItem(int itemId) => _service.removeCartItem(itemId);

  Future<CheckoutResponseModel> checkout(
    int userId,
    List<Map<String, dynamic>> items,
    String shippingAddress,
  ) => _service.checkout(userId: userId, items: items, shippingAddress: shippingAddress);

  Future<List<OrderModel>> myOrders(int userId) => _service.myOrders(userId);

  Future<OrderModel> orderById(int id) => _service.orderById(id);

  Future<OrderDetailsResponseModel> orderDetails(int id) => _service.orderDetails(id);

  Future<List<OrderModel>> allOrders() => _service.allOrders();

  Future<OrderModel> updateStatus(int id, String status) =>
      _service.updateOrderStatus(id: id, status: status);
}
