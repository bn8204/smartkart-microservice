import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartkart_mobile/models/product_models.dart';
import 'package:smartkart_mobile/repositories/product_repository.dart';

final featuredProductsProvider = FutureProvider<List<ProductModel>>((ref) {
  return ref.read(productRepositoryProvider).featuredProducts();
});

final latestProductsProvider = FutureProvider<List<ProductModel>>((ref) {
  return ref.read(productRepositoryProvider).latestProducts();
});
