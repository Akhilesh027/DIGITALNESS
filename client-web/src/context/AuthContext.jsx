import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_BASE_URL, getAuthHeaders, safeJsonParse } from "../config/api";
import { MOCK_CLIENT, MOCK_CUSTOMER } from "../data/mockData";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("clientToken") || null);
  const [client, setClient] = useState(() => safeJsonParse(localStorage.getItem("clientData"), null));
  const [customer, setCustomer] = useState(() => safeJsonParse(localStorage.getItem("customerData"), null));
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const saveAuthData = (newToken, clientData, customerData) => {
    localStorage.setItem("clientToken", newToken);
    if (clientData) {
      localStorage.setItem("clientData", JSON.stringify(clientData));
      setClient(clientData);
    }
    if (customerData) {
      localStorage.setItem("customerData", JSON.stringify(customerData));
      setCustomer(customerData);
    }
    setToken(newToken);
  };

  // Fetch live client & customer details from backend
  const refreshProfile = useCallback(async () => {
    const currentToken = localStorage.getItem("clientToken");
    if (!currentToken || currentToken.startsWith("demo-")) return null;

    try {
      setProfileLoading(true);
      const res = await fetch(`${API_BASE_URL}/clients/me`, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.client) {
          localStorage.setItem("clientData", JSON.stringify(data.client));
          setClient(data.client);
        }
        if (data.customer) {
          localStorage.setItem("customerData", JSON.stringify(data.customer));
          setCustomer(data.customer);
        }
        return data;
      }
    } catch (err) {
      console.warn("Error refreshing client profile:", err.message);
    } finally {
      setProfileLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    if (token) {
      const storedClient = safeJsonParse(localStorage.getItem("clientData"), null);
      const storedCustomer = safeJsonParse(localStorage.getItem("customerData"), null);
      setClient(storedClient);
      setCustomer(storedCustomer);

      if (!token.startsWith("demo-")) {
        refreshProfile();
      }
    }
  }, [token, refreshProfile]);

  const login = async (email, password) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await fetch(`${API_BASE_URL}/clients/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Invalid credentials. Please verify your email and password.");
      }

      saveAuthData(data.token, data.client, data.customer);
      return { success: true, client: data.client, customer: data.customer };
    } catch (err) {
      console.warn("Direct API login error:", err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    const currentToken = localStorage.getItem("clientToken");
    if (currentToken && currentToken.startsWith("demo-")) {
      // Demo mode fallback
      setClient((prev) => ({ ...prev, ...profileData }));
      setCustomer((prev) => ({ ...prev, ...profileData }));
      return { success: true, message: "Profile updated (Demo Mode)" };
    }

    const res = await fetch(`${API_BASE_URL}/clients/profile`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to update profile");
    }

    if (data.client) {
      localStorage.setItem("clientData", JSON.stringify(data.client));
      setClient(data.client);
    }
    if (data.customer) {
      localStorage.setItem("customerData", JSON.stringify(data.customer));
      setCustomer(data.customer);
    }

    return data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const currentToken = localStorage.getItem("clientToken");
    if (currentToken && currentToken.startsWith("demo-")) {
      return { success: true, message: "Password updated successfully (Demo Mode)" };
    }

    const res = await fetch(`${API_BASE_URL}/clients/change-password`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to change password");
    }

    return data;
  };

  const loginAsDemo = () => {
    const demoToken = "demo-client-jwt-token-2026";
    saveAuthData(demoToken, MOCK_CLIENT, MOCK_CUSTOMER);
  };

  const logout = () => {
    localStorage.removeItem("clientToken");
    localStorage.removeItem("clientData");
    localStorage.removeItem("customerData");
    setToken(null);
    setClient(null);
    setCustomer(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        token,
        client,
        customer,
        isAuthenticated,
        loading,
        profileLoading,
        login,
        loginAsDemo,
        logout,
        refreshProfile,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
