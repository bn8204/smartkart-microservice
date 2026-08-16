import 'package:dio/dio.dart';
import 'package:smartkart_mobile/models/cart_models.dart';
import 'package:smartkart_mobile/models/order_models.dart';
import 'package:smartkart_mobile/models/payment_models.dart';

class OrderService {
  OrderService(this._dio);

  final Dio _dio;

  Future<CartModel> getCart(int userId) async {
    final response = await _dio.get('/orders/cart/$userId');
    return CartModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<CartItemModel> addToCart({
    required int userId,
    required int productId,
    required int quantity,
  }) async {
    final response = await _dio.post(
      '/orders/cart/items',
      data: {'user_id': userId, 'product_id': productId, 'quantity': quantity},
    );
    return CartItemModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> removeCartItem(int itemId) async {
    await _dio.delete('/orders/cart/items/$itemId');
  }

  Future<CheckoutResponseModel> checkout({
    required int userId,
    required List<Map<String, dynamic>> items,
    required String shippingAddress,
  }) async {
    final response = await _dio.post(
      '/orders/checkout',
      data: {
        'user_id': userId,
        'shipping_address': shippingAddress,
        'items': items,
      },
    );
    return CheckoutResponseModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<OrderModel>> myOrders(int userId, {int page = 1, int limit = 20}) async {
    final response = await _dio.get(
      '/orders/my/$userId',
      queryParameters: {'page': page, 'limit': limit},
    );

    final list = (response.data as List<dynamic>)
        .cast<Map<String, dynamic>>()
        .map(OrderModel.fromJson)
        .toList();
    return list;
  }

  Future<OrderModel> orderById(int id) async {
    final response = await _dio.get('/orders/$id');
    return OrderModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<OrderDetailsResponseModel> orderDetails(int id) async {
    final response = await _dio.get('/orders/$id/details');
    return OrderDetailsResponseModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<OrderModel> updateOrderStatus({required int id, required String status}) async {
    final response = await _dio.patch('/orders/$id/status', data: {'status': status});
    return OrderModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<OrderModel>> allOrders({int page = 1, int limit = 20}) async {
    final response = await _dio.get(
      '/orders',
      queryParameters: {'page': page, 'limit': limit},
    );
    return (response.data as List<dynamic>)
        .cast<Map<String, dynamic>>()
        .map(OrderModel.fromJson)
        .toList();
  }
}
