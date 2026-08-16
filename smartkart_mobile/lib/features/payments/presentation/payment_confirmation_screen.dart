import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class PaymentConfirmationScreen extends StatelessWidget {
  const PaymentConfirmationScreen({super.key, required this.orderId});

  final int orderId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Theme.of(context).colorScheme.primaryContainer,
                ),
                child: const Icon(Icons.check_circle_outline, size: 56),
              ),
              const SizedBox(height: 16),
              Text('Order placed successfully!',
                  style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              const Text('Payment processing status can be tracked in order details.'),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: () => context.go('/orders/$orderId'),
                child: const Text('View Order Status'),
              ),
              TextButton(
                onPressed: () => context.go('/home'),
                child: const Text('Continue Shopping'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
