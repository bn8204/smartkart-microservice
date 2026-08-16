import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartkart_mobile/core/network/api_client.dart';
import 'package:smartkart_mobile/models/product_models.dart';
import 'package:smartkart_mobile/services/product_service.dart';

final productServiceProvider = Provider<ProductService>(
  (ref) => ProductService(ref.watch(dioProvider)),
);

final productRepositoryProvider = Provider<ProductRepository>(
  (ref) => ProductRepository(ref.watch(productServiceProvider)),
);

class ProductRepository {
  ProductRepository(this._service);

  final ProductService _service;

  Future<List<ProductModel>> latestProducts() => _service.listProducts();

  Future<List<ProductModel>> featuredProducts() =>
      _service.listProducts(sort: 'created_at', order: 'desc', limit: 8);

  Future<List<ProductModel>> searchProducts(String query) =>
      _service.searchProducts(query);

  Future<ProductModel> productById(int id) => _service.getProductById(id);
}
