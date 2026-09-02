import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";

const API_BASE_URL = "https://server.digitalness.co.in/api";

const AttachmentsScreen = () => {
  const [client, setClient] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    const clientData = await AsyncStorage.getItem("clientData");
    const customerData = await AsyncStorage.getItem("customerData");

    if (clientData) setClient(JSON.parse(clientData));
    if (customerData && customerData !== "null") {
      setCustomer(JSON.parse(customerData));
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    setSelectedFile(result.assets[0]);
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      Alert.alert("No File", "Please select a file first.");
      return;
    }

    const token = await AsyncStorage.getItem("clientToken");

    const customerId =
      customer?._id ||
      customer?.id ||
      client?.customerId?._id ||
      client?.customerId;

    if (!customerId) {
      Alert.alert("Error", "Customer ID not found.");
      return;
    }

    const formData = new FormData();

    formData.append("customerId", customerId);
    formData.append("uploadedBy", client?._id || "");
    formData.append("title", selectedFile.name);
    formData.append("category", "Project Requirement");
    formData.append("file", {
      uri: selectedFile.uri,
      name: selectedFile.name,
      type: selectedFile.mimeType || "application/octet-stream",
    });

    try {
      setUploading(true);

      const response = await fetch(`${API_BASE_URL}/client-attachments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      Alert.alert("Success", "Attachment uploaded successfully.");
      setSelectedFile(null);
    } catch (error) {
      Alert.alert("Upload Failed", error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Project Attachments</Text>
        <Text style={styles.heroText}>
          Upload logos, brand assets, product images, reference documents,
          brochures, content files, and project requirements for the Digitalness
          team.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>What can you upload?</Text>
        <Text style={styles.infoText}>• Company logo and brand guidelines</Text>
        <Text style={styles.infoText}>• Product images and service photos</Text>
        <Text style={styles.infoText}>• Brochures, PDFs, Word files</Text>
        <Text style={styles.infoText}>• Website content and references</Text>
        <Text style={styles.infoText}>• Social media creative references</Text>
      </View>

      <View style={styles.uploadCard}>
        <Text style={styles.cardTitle}>Upload New File</Text>

        <TouchableOpacity style={styles.pickButton} onPress={pickFile}>
          <Text style={styles.pickButtonText}>Choose File</Text>
        </TouchableOpacity>

        {selectedFile && (
          <View style={styles.fileBox}>
            <Text style={styles.fileName}>{selectedFile.name}</Text>
            <Text style={styles.fileSize}>
              Size: {formatSize(selectedFile.size)}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.disabledButton]}
          onPress={uploadFile}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload Attachment</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Note</Text>
        <Text style={styles.noteText}>
          Please upload clear and original files. These attachments will help
          the Digitalness team complete your project faster and more accurately.
        </Text>
      </View>
    </ScrollView>
  );
};

const formatSize = (size) => {
  if (!size) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

export default AttachmentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 18,
    paddingBottom: 120,
  },

  heroCard: {
    backgroundColor: "#111827",
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },

  heroText: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 22,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  uploadCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 12,
  },

  infoText: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 8,
    fontWeight: "700",
  },

  pickButton: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 14,
  },

  pickButtonText: {
    color: "#92400E",
    fontSize: 15,
    fontWeight: "900",
  },

  fileBox: {
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
  },

  fileName: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "900",
  },

  fileSize: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "700",
  },

  uploadButton: {
    backgroundColor: "#111827",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  noteCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 22,
    padding: 18,
  },

  noteTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },

  noteText: {
    color: "#444",
    fontSize: 13,
    lineHeight: 21,
    fontWeight: "600",
  },
});