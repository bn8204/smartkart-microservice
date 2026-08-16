import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartkart_mobile/features/cart/presentation/cart_controller.dart';
import 'package:smartkart_mobile/repositories/product_repository.dart';
import 'package:smartkart_mobile/utils/formatters.dart';

final productByIdProvider = FutureProvider.family((ref, int id) {
  return ref.read(productRepositoryProvider).productById(id);
});

class ProductDetailsScreen extends ConsumerWidget {
  const ProductDetailsScreen({super.key, required this.productId});

  final int productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncProduct = ref.watch(productByIdProvider(productId));

    return Scaffold(
      appBar: AppBar(title: const Text('Product Details')),
      body: asyncProduct.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (product) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              height: 240,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                color: Theme.of(context).colorScheme.surfaceContainerHigh,
              ),
              child: const Center(child: Icon(Icons.image, size: 64)),
            ),
            const SizedBox(height: 16),
            Text(product.name, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              formatCurrency(product.price.toString()),
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(product.description ?? 'No description available'),
            const SizedBox(height: 12),
            Text('Category: ${product.category ?? '-'}'),
            Text('Stock: ${product.stock}'),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: () async {
                await ref.read(cartControllerProvider.notifier).addItem(productId: product.id);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Added to cart')),
                  );
                }
              },
              icon: const Icon(Icons.add_shopping_cart),
              label: const Text('Add to Cart'),
            ),
          ],
        ),
      ),
    );
  }
}
