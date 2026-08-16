import 'package:dio/dio.dart';
import 'package:smartkart_mobile/models/product_models.dart';

class ProductService {
  ProductService(this._dio);

  final Dio _dio;

  Future<List<ProductModel>> listProducts({
    int page = 1,
    int limit = 20,
    String? sort,
    String? order,
  }) async {
    final response = await _dio.get(
      '/products',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (sort != null) 'sort': sort,
        if (order != null) 'order': order,
      },
    );

    final list = (response.data as List<dynamic>)
        .cast<Map<String, dynamic>>()
        .map(ProductModel.fromJson)
        .toList();
    return list;
  }

  Future<ProductModel> getProductById(int id) async {
    final response = await _dio.get('/products/$id');
    return ProductModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<ProductModel>> searchProducts(String query) async {
    final response = await _dio.get('/products/search', queryParameters: {'q': query});
    final list = (response.data as List<dynamic>)
        .cast<Map<String, dynamic>>()
        .map(ProductModel.fromJson)
        .toList();
    return list;
  }
}
