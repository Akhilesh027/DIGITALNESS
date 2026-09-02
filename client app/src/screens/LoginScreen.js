import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://localhost:5000/api";

const loginClient = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/clients/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Login failed");
  }

  return data;
};

const saveClientAuthData = async ({ client, customer, token }) => {
  await AsyncStorage.setItem("clientToken", token);
  await AsyncStorage.setItem("clientData", JSON.stringify(client));
  await AsyncStorage.setItem("customerData", JSON.stringify(customer || null));
};

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securePassword, setSecurePassword] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert("Email Required", "Please enter your registered email.");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Password Required", "Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const data = await loginClient(cleanEmail, password);

      await saveClientAuthData({
        client: data.client,
        customer: data.customer,
        token: data.token,
      });

      navigation.replace("Main", {
        client: data.client,
        customer: data.customer,
      });
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error.message || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.authContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topGlow} />

        <View style={styles.logoBox}>
          <Text style={styles.logoText}>D</Text>
        </View>

        <Text style={styles.appTitle}>Digitalness</Text>
        <Text style={styles.appSubtitle}>Client Portal</Text>

        <Text style={styles.description}>
          Securely access your projects, proposals, deliverables, reports,
          invoices, and support updates from your Digitalness CRM account.
        </Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📁</Text>
            <Text style={styles.infoTitle}>Projects</Text>
            <Text style={styles.infoText}>Track active work</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📄</Text>
            <Text style={styles.infoTitle}>Reports</Text>
            <Text style={styles.infoText}>View updates</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>💬</Text>
            <Text style={styles.infoTitle}>Support</Text>
            <Text style={styles.infoText}>Stay connected</Text>
          </View>
        </View>

        <View style={styles.authForm}>
          <Text style={styles.formTitle}>Login to your account</Text>
          <Text style={styles.formSubtitle}>
            Use the email and password shared by Digitalness.
          </Text>

          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="client@example.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={securePassword}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />

            <TouchableOpacity
              onPress={() => setSecurePassword(!securePassword)}
              disabled={loading}
            >
              <Text style={styles.showText}>
                {securePassword ? "Show" : "Hide"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Login to Portal</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Having trouble logging in? Please contact the Digitalness team.
          </Text>
        </View>

        <Text style={styles.footerText}>
          Designed & Developed by Digitalness CRM
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  authContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 40,
    backgroundColor: "#F8FAFC",
  },

  topGlow: {
    position: "absolute",
    top: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#FEF3C7",
    opacity: 0.8,
  },

  logoBox: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },

  logoText: {
    color: "#FBBF24",
    fontSize: 42,
    fontWeight: "900",
  },

  appTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: 0.4,
  },

  appSubtitle: {
    fontSize: 16,
    color: "#D97706",
    fontWeight: "800",
    marginTop: 4,
    marginBottom: 14,
  },

  description: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 410,
    marginBottom: 20,
  },

  infoGrid: {
    width: "100%",
    maxWidth: 430,
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },

  infoItem: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },

  infoIcon: {
    fontSize: 20,
    marginBottom: 6,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },

  infoText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
    textAlign: "center",
  },

  authForm: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },

  formTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 6,
  },

  formSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F8FAFC",
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    marginBottom: 20,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
  },

  showText: {
    color: "#D97706",
    fontWeight: "900",
    fontSize: 13,
  },

  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },

  disabledButton: {
    opacity: 0.65,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  helpText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },

  footerText: {
    marginTop: 24,
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
});