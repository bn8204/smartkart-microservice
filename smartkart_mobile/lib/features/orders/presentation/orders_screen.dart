import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smartkart_mobile/features/orders/presentation/orders_controller.dart';
import 'package:smartkart_mobile/utils/formatters.dart';

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(myOrdersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Orders')),
      body: RefreshIndicator(
        onRefresh: () => ref.read(myOrdersProvider.notifier).loadMyOrders(),
        child: orders.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [Center(child: Text(e.toString()))]),
          data: (list) {
            if (list.isEmpty) {
              return ListView(children: const [SizedBox(height: 220), Center(child: Text('No orders yet'))]);
            }
            return ListView.separated(
              itemCount: list.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final order = list[index];
                return ListTile(
                  title: Text('Order #${order.id}'),
                  subtitle: Text(
                    '${order.status} • ${formatDate(order.createdAt)}',
                  ),
                  trailing: Text(formatCurrency(order.totalAmount)),
                  onTap: () => context.go('/orders/${order.id}'),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
