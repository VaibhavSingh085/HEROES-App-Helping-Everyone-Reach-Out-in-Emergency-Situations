// app/login.js
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login(email, password);
      // ✅ Navigation handled by _layout.js
    } catch (err) {
      Alert.alert("Login Error", err.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20, color: "#000" }}>
        Login
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          marginBottom: 12,
          borderRadius: 8,
          backgroundColor: "#f9f9f9",
          color: "#000",
        }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          marginBottom: 20,
          borderRadius: 8,
          backgroundColor: "#f9f9f9",
          color: "#000",
        }}
      />

      <Pressable
        onPress={handleLogin}
        style={{
          backgroundColor: "green",
          padding: 14,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>Login</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/signup")} style={{ marginTop: 16 }}>
        <Text style={{ color: "#1976d2", textAlign: "center" }}>
          Don’t have an account? Sign up
        </Text>
      </Pressable>
    </View>
  );
}
