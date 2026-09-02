import React from "react";
import { View, Text, StyleSheet } from "react-native";

const PaymentsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invoices & Payments</Text>
      <Text style={styles.text}>
        Payment details, invoices, paid amount, pending amount, and receipts
        will appear here.
      </Text>
    </View>
  );
};

export default PaymentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 22,
  },
});