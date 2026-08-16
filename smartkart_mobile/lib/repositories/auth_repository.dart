import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartkart_mobile/core/network/api_client.dart';
import 'package:smartkart_mobile/core/storage/secure_storage_service.dart';
import 'package:smartkart_mobile/models/auth_models.dart';
import 'package:smartkart_mobile/services/auth_service.dart';

final authServiceProvider = Provider<AuthService>(
  (ref) => AuthService(ref.watch(dioProvider)),
);

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(
    ref.watch(authServiceProvider),
    ref.watch(secureStorageServiceProvider),
  ),
);

class AuthRepository {
  AuthRepository(this._service, this._storage);

  final AuthService _service;
  final SecureStorageService _storage;

  Future<UserModel?> restoreSession() async {
    final token = await _storage.getToken();
    final userId = await _storage.getUserId();
    if (token == null || userId == null) return null;
    return _service.getUserById(userId);
  }

  Future<UserModel> login(String email, String password) async {
    final auth = await _service.login(email: email, password: password);
    await _storage.saveAuthSession(
      token: auth.token,
      userId: auth.user.id,
      role: auth.user.role,
    );
    return auth.user;
  }

  Future<UserModel> register(String name, String email, String password) async {
    final auth = await _service.register(name: name, email: email, password: password);
    await _storage.saveAuthSession(
      token: auth.token,
      userId: auth.user.id,
      role: auth.user.role,
    );
    return auth.user;
  }

  Future<void> logout() => _storage.clearSession();
}
