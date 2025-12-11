// app/login.js
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login(email, password);
      // navigation handled elsewhere
    } catch (err) {
      Alert.alert("Login Error", err?.message || String(err));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
           <Image source={require("./img.png")} style={styles.logo} resizeMode="contain" />
           <Text style={styles.appTitle}>HEROES App</Text>
           <Text style={styles.tagline}>Helping Everyone Reach Out in Emergency Situations</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#7a7a7a"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#7a7a7a"
            style={styles.input}
          />

          <Pressable onPress={handleLogin} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/signup")}>
            <Text style={styles.secondaryText}>Don’t have an account? Sign up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7fb" },
  scroll: { padding: 20, alignItems: "center" },
  header: { alignItems: "center", marginBottom: 18 },
  appTitle: { fontSize: 20, fontWeight: "800", color: "#1b5e20" },
    tagline: { fontSize: 14, color: "#555", textAlign: "center", marginTop: 6, fontWeight: "600" },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
    logo: { width: 84, height: 84, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "#0b3d00" },
  input: {
    borderWidth: 1,
    borderColor: "#e6e9ef",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#fbfdff",
    color: "#111",
  },
  primaryButton: {
    backgroundColor: "#1b5e20",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 8,
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryText: { color: "#1976d2", textAlign: "center", marginTop: 6 },
});
