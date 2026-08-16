import 'package:freezed_annotation/freezed_annotation.dart';

part 'order_models.freezed.dart';
part 'order_models.g.dart';

@freezed
class OrderItemModel with _$OrderItemModel {
  const factory OrderItemModel({
    required int id,
    @JsonKey(name: 'order_id') required int orderId,
    @JsonKey(name: 'product_id') required int productId,
    @JsonKey(name: 'product_name') String? productName,
    required int quantity,
    @JsonKey(name: 'unit_price') required String unitPrice,
  }) = _OrderItemModel;

  factory OrderItemModel.fromJson(Map<String, dynamic> json) =>
      _$OrderItemModelFromJson(json);
}

@freezed
class OrderModel with _$OrderModel {
  const factory OrderModel({
    required int id,
    @JsonKey(name: 'user_id') required int userId,
    @JsonKey(name: 'total_amount') required String totalAmount,
    required String status,
    @JsonKey(name: 'shipping_address') String? shippingAddress,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
    @Default(<OrderItemModel>[]) List<OrderItemModel> items,
  }) = _OrderModel;

  factory OrderModel.fromJson(Map<String, dynamic> json) =>
      _$OrderModelFromJson(json);
}

@freezed
class CheckoutResponseModel with _$CheckoutResponseModel {
  const factory CheckoutResponseModel({
    required OrderModel order,
    required String total,
  }) = _CheckoutResponseModel;

  factory CheckoutResponseModel.fromJson(Map<String, dynamic> json) =>
      _$CheckoutResponseModelFromJson(json);
}
