import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smartkart_mobile/features/authentication/presentation/auth_controller.dart';
import 'package:smartkart_mobile/features/cart/presentation/cart_controller.dart';
import 'package:smartkart_mobile/repositories/order_repository.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _addressCtrl = TextEditingController();
  bool _processing = false;

  @override
  void dispose() {
    _addressCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartControllerProvider).value;

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: cart == null || cart.items.isEmpty
          ? const Center(child: Text('Cart is empty'))
          : Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: _addressCtrl,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Shipping Address',
                      hintText: 'Enter complete shipping address',
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text('Items: ${cart.items.length}'),
                  const Spacer(),
                  FilledButton(
                    onPressed: _processing
                        ? null
                        : () async {
                            final userId = ref.read(authControllerProvider).user?.id;
                            if (userId == null) return;
                            if (_addressCtrl.text.trim().isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Address is required')),
                              );
                              return;
                            }

                            setState(() => _processing = true);
                            try {
                              final checkout = await ref.read(orderRepositoryProvider).checkout(
                                    userId,
                                    cart.items
                                        .map((e) => {
                                              'product_id': e.productId,
                                              'quantity': e.quantity,
                                            })
                                        .toList(),
                                    _addressCtrl.text.trim(),
                                  );

                              await ref.read(cartControllerProvider.notifier).loadForCurrentUser();
                              if (!context.mounted) return;
                              context.go('/orders/${checkout.order.id}/confirmation');
                            } catch (e) {
                              if (!context.mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(e.toString())),
                              );
                            } finally {
                              if (mounted) setState(() => _processing = false);
                            }
                          },
                    child: _processing
                        ? const CircularProgressIndicator()
                        : const Text('Place Order'),
                  ),
                ],
              ),
            ),
    );
  }
}
