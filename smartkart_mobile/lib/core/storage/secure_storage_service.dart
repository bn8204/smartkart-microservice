import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  SecureStorageService(this._storage);

  final FlutterSecureStorage _storage;

  static const _jwtKey = 'smartkart.jwt';
  static const _userIdKey = 'smartkart.user_id';
  static const _roleKey = 'smartkart.user_role';

  Future<void> saveAuthSession({
    required String token,
    required int userId,
    required String role,
  }) async {
    await _storage.write(key: _jwtKey, value: token);
    await _storage.write(key: _userIdKey, value: userId.toString());
    await _storage.write(key: _roleKey, value: role);
  }

  Future<String?> getToken() => _storage.read(key: _jwtKey);

  Future<int?> getUserId() async {
    final value = await _storage.read(key: _userIdKey);
    if (value == null) return null;
    return int.tryParse(value);
  }

  Future<String?> getRole() => _storage.read(key: _roleKey);

  Future<void> clearSession() => _storage.deleteAll();
}
