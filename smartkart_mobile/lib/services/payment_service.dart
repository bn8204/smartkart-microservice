import 'package:dio/dio.dart';
import 'package:smartkart_mobile/models/payment_models.dart';

class PaymentService {
  PaymentService(this._dio);

  final Dio _dio;

  Future<List<PaymentModel>> byOrder(int orderId) async {
    final response = await _dio.get('/payments/order/$orderId');
    return (response.data as List<dynamic>)
        .cast<Map<String, dynamic>>()
        .map(PaymentModel.fromJson)
        .toList();
  }

  Future<List<PaymentModel>> allPayments({int page = 1, int limit = 20}) async {
    final response = await _dio.get(
      '/payments',
      queryParameters: {'page': page, 'limit': limit},
    );
    return (response.data as List<dynamic>)
        .cast<Map<String, dynamic>>()
        .map(PaymentModel.fromJson)
        .toList();
  }
}
