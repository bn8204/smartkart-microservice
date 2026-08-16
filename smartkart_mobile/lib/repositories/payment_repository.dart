import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartkart_mobile/core/network/api_client.dart';
import 'package:smartkart_mobile/models/payment_models.dart';
import 'package:smartkart_mobile/services/payment_service.dart';

final paymentServiceProvider = Provider<PaymentService>(
  (ref) => PaymentService(ref.watch(dioProvider)),
);

final paymentRepositoryProvider = Provider<PaymentRepository>(
  (ref) => PaymentRepository(ref.watch(paymentServiceProvider)),
);

class PaymentRepository {
  PaymentRepository(this._service);

  final PaymentService _service;

  Future<List<PaymentModel>> byOrder(int orderId) => _service.byOrder(orderId);

  Future<List<PaymentModel>> allPayments() => _service.allPayments();
}
