import 'package:dio/dio.dart';
import 'package:smartkart_mobile/models/auth_models.dart';

class AuthService {
  AuthService(this._dio);

  final Dio _dio;

  Future<AuthResponseModel> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await _dio.post(
      '/auth/register',
      data: {'name': name, 'email': email, 'password': password},
    );
    return AuthResponseModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<AuthResponseModel> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    return AuthResponseModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<UserModel> getUserById(int id) async {
    final response = await _dio.get('/auth/users/$id');
    return UserModel.fromJson(response.data as Map<String, dynamic>);
  }
}
