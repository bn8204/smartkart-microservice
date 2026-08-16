import 'package:freezed_annotation/freezed_annotation.dart';

part 'payment_models.freezed.dart';
part 'payment_models.g.dart';

@freezed
class PaymentModel with _$PaymentModel {
  const factory PaymentModel({
    required int id,
    @JsonKey(name: 'order_id') required int orderId,
    @JsonKey(name: 'user_id') required int userId,
    required String amount,
    required String status,
    @JsonKey(name: 'payment_method') String? paymentMethod,
    @JsonKey(name: 'created_at') String? createdAt,
  }) = _PaymentModel;

  factory PaymentModel.fromJson(Map<String, dynamic> json) =>
      _$PaymentModelFromJson(json);
}

@freezed
class OrderDetailsResponseModel with _$OrderDetailsResponseModel {
  const factory OrderDetailsResponseModel({
    required Map<String, dynamic> order,
    @Default(<PaymentModel>[]) List<PaymentModel> payments,
  }) = _OrderDetailsResponseModel;

  factory OrderDetailsResponseModel.fromJson(Map<String, dynamic> json) =>
      _$OrderDetailsResponseModelFromJson(json);
}
