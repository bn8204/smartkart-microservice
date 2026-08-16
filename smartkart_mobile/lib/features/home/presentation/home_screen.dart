import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smartkart_mobile/features/authentication/presentation/auth_controller.dart';
import 'package:smartkart_mobile/features/home/presentation/home_controller.dart';
import 'package:smartkart_mobile/models/product_models.dart';
import 'package:smartkart_mobile/utils/formatters.dart';
import 'package:smartkart_mobile/widgets/offline_banner.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final featured = ref.watch(featuredProductsProvider);
    final latest = ref.watch(latestProductsProvider);
    final user = ref.watch(authControllerProvider).user;

    return OfflineBanner(
      child: Scaffold(
        appBar: AppBar(
          title: Text('Welcome, ${user?.name ?? 'Shopper'}'),
          actions: [
            IconButton(
              onPressed: () async {
                await ref.read(authControllerProvider.notifier).logout();
                if (context.mounted) context.go('/login');
              },
              icon: const Icon(Icons.logout),
            ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(featuredProductsProvider);
            ref.invalidate(latestProductsProvider);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              TextField(
                readOnly: true,
                onTap: () => context.go('/products'),
                decoration: const InputDecoration(
                  hintText: 'Search products',
                  prefixIcon: Icon(Icons.search),
                ),
              ),
              const SizedBox(height: 16),
              Text('Featured Products', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              _HorizontalProducts(asyncProducts: featured),
              const SizedBox(height: 24),
              Text('Latest Products', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              _HorizontalProducts(asyncProducts: latest),
            ],
          ),
        ),
      ),
    );
  }
}

class _HorizontalProducts extends StatelessWidget {
  const _HorizontalProducts({required this.asyncProducts});

  final AsyncValue<List<ProductModel>> asyncProducts;

  @override
  Widget build(BuildContext context) {
    return asyncProducts.when(
      loading: () => const SizedBox(
        height: 180,
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => SizedBox(height: 80, child: Center(child: Text(e.toString()))),
      data: (items) => SizedBox(
        height: 220,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: items.length,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (context, index) {
            final p = items[index];
            return InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => context.go('/products/${p.id}'),
              child: Ink(
                width: 180,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: Theme.of(context).colorScheme.surfaceContainerHigh,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          color: Theme.of(context).colorScheme.surface,
                        ),
                        child: const Center(child: Icon(Icons.image, size: 36)),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis),
                    Text(
                      formatCurrency(p.price.toString()),
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
