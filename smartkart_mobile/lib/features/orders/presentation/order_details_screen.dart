import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smartkart_mobile/features/orders/presentation/orders_controller.dart';
import 'package:smartkart_mobile/models/order_models.dart';
import 'package:smartkart_mobile/utils/formatters.dart';

class OrderDetailsScreen extends ConsumerWidget {
  const OrderDetailsScreen({super.key, required this.orderId});

  final int orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailsState = ref.watch(orderDetailsProvider);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(orderDetailsProvider.notifier).load(orderId);
    });

    return Scaffold(
      appBar: AppBar(title: Text('Order #$orderId')),
      body: detailsState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (details) {
          if (details == null) return const SizedBox.shrink();

          final order = OrderModel.fromJson(details.order);
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _Timeline(status: order.status),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Status: ${order.status}'),
                      Text('Created: ${formatDate(order.createdAt)}'),
                      Text('Total: ${formatCurrency(order.totalAmount)}'),
                      Text('Shipping: ${order.shippingAddress ?? '-'}'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text('Items', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              ...order.items.map(
                (item) => ListTile(
                  dense: true,
                  title: Text(item.productName ?? 'Product #${item.productId}'),
                  subtitle: Text('Qty: ${item.quantity}'),
                  trailing: Text(formatCurrency(item.unitPrice)),
                ),
              ),
              const SizedBox(height: 16),
              Text('Payments', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              ...details.payments.map(
                (p) => ListTile(
                  dense: true,
                  title: Text('Payment #${p.id} • ${p.status}'),
                  subtitle: Text(p.paymentMethod ?? '-'),
                  trailing: Text(formatCurrency(p.amount)),
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => context.go('/orders/$orderId/payments'),
                icon: const Icon(Icons.payments_outlined),
                label: const Text('View Payment Status'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Timeline extends StatelessWidget {
  const _Timeline({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    const flow = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
    final idx = flow.indexOf(status);

    return Row(
      children: flow.asMap().entries.map((entry) {
        final active = idx >= entry.key || status == 'FAILED';
        return Expanded(
          child: Row(
            children: [
              CircleAvatar(
                radius: 10,
                backgroundColor: active
                    ? Theme.of(context).colorScheme.primary
                    : Theme.of(context).colorScheme.outline,
                child: Text('${entry.key + 1}', style: const TextStyle(fontSize: 10)),
              ),
              if (entry.key != flow.length - 1)
                Expanded(
                  child: Container(
                    height: 2,
                    color: active
                        ? Theme.of(context).colorScheme.primary
                        : Theme.of(context).colorScheme.outline,
                  ),
                ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
