import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartkart_mobile/repositories/payment_repository.dart';
import 'package:smartkart_mobile/utils/formatters.dart';

final paymentsByOrderProvider = FutureProvider.family((ref, int orderId) {
  return ref.read(paymentRepositoryProvider).byOrder(orderId);
});

class PaymentStatusScreen extends ConsumerWidget {
  const PaymentStatusScreen({super.key, required this.orderId});

  final int orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final payments = ref.watch(paymentsByOrderProvider(orderId));

    return Scaffold(
      appBar: AppBar(title: const Text('Payment Status')),
      body: payments.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (list) {
          if (list.isEmpty) {
            return const Center(child: Text('No payment records yet'));
          }

          return ListView.builder(
            itemCount: list.length,
            itemBuilder: (context, index) {
              final payment = list[index];
              return ListTile(
                title: Text('Status: ${payment.status}'),
                subtitle: Text(payment.paymentMethod ?? '-'),
                trailing: Text(formatCurrency(payment.amount)),
              );
            },
          );
        },
      ),
    );
  }
}
