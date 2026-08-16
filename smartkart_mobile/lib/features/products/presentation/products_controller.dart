import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartkart_mobile/models/product_models.dart';
import 'package:smartkart_mobile/repositories/product_repository.dart';

final productsControllerProvider =
    StateNotifierProvider<ProductsController, AsyncValue<List<ProductModel>>>((ref) {
  return ProductsController(ref.watch(productRepositoryProvider))..load();
});

final selectedCategoryProvider = StateProvider<String?>((ref) => null);
final searchQueryProvider = StateProvider<String>((ref) => '');

final categoriesProvider = Provider<List<String>>((ref) {
  final products = ref.watch(productsControllerProvider).value ?? const <ProductModel>[];
  final categories = products
      .map((e) => e.category)
  .nonNulls
      .where((e) => e.trim().isNotEmpty)
      .toSet()
      .toList()
    ..sort();
  return categories;
});

final filteredProductsProvider = Provider<List<ProductModel>>((ref) {
  final products = ref.watch(productsControllerProvider).value ?? const <ProductModel>[];
  final selectedCategory = ref.watch(selectedCategoryProvider);
  final query = ref.watch(searchQueryProvider).toLowerCase().trim();

  return products.where((p) {
    final categoryMatch = selectedCategory == null || p.category == selectedCategory;
    final queryMatch = query.isEmpty ||
        p.name.toLowerCase().contains(query) ||
        (p.category ?? '').toLowerCase().contains(query);
    return categoryMatch && queryMatch;
  }).toList();
});

class ProductsController extends StateNotifier<AsyncValue<List<ProductModel>>> {
  ProductsController(this._repo) : super(const AsyncValue.loading());

  final ProductRepository _repo;

  Future<void> load() async {
    try {
      state = const AsyncValue.loading();
      final products = await _repo.latestProducts();
      state = AsyncValue.data(products);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> search(String query) async {
    if (query.trim().isEmpty) {
      await load();
      return;
    }

    try {
      state = const AsyncValue.loading();
      final products = await _repo.searchProducts(query);
      state = AsyncValue.data(products);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
