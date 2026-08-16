import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartkart_mobile/features/admin/presentation/admin_controller.dart';
import 'package:smartkart_mobile/features/authentication/presentation/auth_controller.dart';
import 'package:smartkart_mobile/utils/formatters.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final orders = ref.watch(adminOrdersProvider);

    if (auth.user?.role != 'admin') {
      return const Scaffold(
        body: Center(child: Text('Admin access required.')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Admin Dashboard')),
      body: orders.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (list) => RefreshIndicator(
          onRefresh: () => ref.read(adminOrdersProvider.notifier).loadOrders(),
          child: ListView.separated(
            itemCount: list.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final order = list[index];
              return ListTile(
                title: Text('Order #${order.id}'),
                subtitle: Text('${order.status} • ${formatDate(order.createdAt)}'),
                trailing: DropdownButton<String>(
                  value: order.status,
                  items: const [
                    DropdownMenuItem(value: 'PENDING', child: Text('PENDING')),
                    DropdownMenuItem(value: 'CONFIRMED', child: Text('CONFIRMED')),
                    DropdownMenuItem(value: 'FAILED', child: Text('FAILED')),
                    DropdownMenuItem(value: 'SHIPPED', child: Text('SHIPPED')),
                    DropdownMenuItem(value: 'DELIVERED', child: Text('DELIVERED')),
                    DropdownMenuItem(value: 'CANCELLED', child: Text('CANCELLED')),
                  ],
                  onChanged: (value) async {
                    if (value == null) return;
                    await ref
                        .read(adminOrdersProvider.notifier)
                        .updateOrderStatus(order.id, value);
                  },
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
