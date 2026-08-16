import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smartkart_mobile/features/products/presentation/products_controller.dart';
import 'package:smartkart_mobile/utils/formatters.dart';
import 'package:smartkart_mobile/widgets/app_error_state.dart';
import 'package:smartkart_mobile/widgets/product_shimmer.dart';

class ProductsScreen extends ConsumerWidget {
  const ProductsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(productsControllerProvider);
    final filtered = ref.watch(filteredProductsProvider);
    final categories = ref.watch(categoriesProvider);
    final selectedCategory = ref.watch(selectedCategoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Products')),
      body: RefreshIndicator(
        onRefresh: () => ref.read(productsControllerProvider.notifier).load(),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: TextField(
                decoration: const InputDecoration(
                  hintText: 'Search by product name or category',
                  prefixIcon: Icon(Icons.search),
                ),
                onChanged: (value) {
                  ref.read(searchQueryProvider.notifier).state = value;
                  ref.read(productsControllerProvider.notifier).search(value);
                },
              ),
            ),
            SizedBox(
              height: 52,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                scrollDirection: Axis.horizontal,
                children: [
                  ChoiceChip(
                    label: const Text('All'),
                    selected: selectedCategory == null,
                    onSelected: (_) =>
                        ref.read(selectedCategoryProvider.notifier).state = null,
                  ),
                  const SizedBox(width: 8),
                  ...categories.map(
                    (c) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(c),
                        selected: selectedCategory == c,
                        onSelected: (_) =>
                            ref.read(selectedCategoryProvider.notifier).state = c,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: state.when(
                loading: () => const ProductShimmer(),
                error: (e, _) => AppErrorState(
                  message: e.toString(),
                  onRetry: () => ref.read(productsControllerProvider.notifier).load(),
                ),
                data: (_) {
                  if (filtered.isEmpty) {
                    return const Center(child: Text('No products found'));
                  }
                  return GridView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: filtered.length,
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.65,
                    ),
                    itemBuilder: (_, index) {
                      final p = filtered[index];
                      return InkWell(
                        borderRadius: BorderRadius.circular(14),
                        onTap: () => context.go('/products/${p.id}'),
                        child: Ink(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(14),
                            color: Theme.of(context).colorScheme.surfaceContainerHigh,
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(10),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(10),
                                      color: Theme.of(context).colorScheme.surface,
                                    ),
                                    child: const Center(
                                      child: Icon(Icons.inventory_2_outlined, size: 34),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis),
                                Text(
                                  formatCurrency(p.price.toString()),
                                  style: Theme.of(context).textTheme.titleMedium,
                                ),
                                Text(
                                  p.category ?? '-',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
