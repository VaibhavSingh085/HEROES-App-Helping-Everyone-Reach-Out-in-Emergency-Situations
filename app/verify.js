import { useRouter } from "expo-router";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Verify() {
  const router = useRouter();
  const { user, resendVerificationEmail } = useAuth();

  const handleResend = async () => {
    try {
      await resendVerificationEmail(user);
      Alert.alert("Email Sent", "Verification email has been resent.");
    } catch (err) {
      Alert.alert("Error", err?.message || String(err));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require("./img.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appTitle}>HEROES App</Text>
        <Text style={styles.tagline}>Helping Everyone Reach Out in Emergency Situations</Text>
      </View>

      <View style={styles.cardCenter}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.copy}>
          A verification link has been sent to your email. Please verify before logging in.
        </Text>

        <Pressable onPress={handleResend} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Resend Verification Email</Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/login")} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back to Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7fb", padding: 20 },
  header: { alignItems: "center", marginTop: 8, marginBottom: 12 },
  appTitle: { fontSize: 20, fontWeight: "800", color: "#1b5e20" },
  tagline: { fontSize: 14, color: "#555", textAlign: "center", marginTop: 6, fontWeight: "600" },
  cardCenter: {
    marginTop: 18,
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8, color: "#0b3d00" },
  copy: { textAlign: "center", color: "#444", marginBottom: 16 },
  primaryButton: {
    backgroundColor: "#1b5e20",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  secondaryButtonText: { color: "#1976d2", fontWeight: "600" },
  logo: { width: 84, height: 84, marginBottom: 8 },
});
