import 'package:intl/intl.dart';

String formatCurrency(String value) {
  final amount = double.tryParse(value) ?? 0;
  return NumberFormat.currency(symbol: '\$', decimalDigits: 2).format(amount);
}

String formatDate(String? value) {
  if (value == null) return '-';
  final dt = DateTime.tryParse(value);
  if (dt == null) return value;
  return DateFormat('dd MMM yyyy, hh:mm a').format(dt.toLocal());
}
