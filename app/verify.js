import { useRouter } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Verify() {
  const router = useRouter();
  const { user, resendVerificationEmail } = useAuth();

  const handleResend = async () => {
    try {
      await resendVerificationEmail(user);
      Alert.alert("Email Sent", "Verification email has been resent.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>Verify Your Email</Text>
      <Text style={{ textAlign: "center", marginBottom: 20 }}>
        A verification link has been sent to your email. Please verify before logging in.
      </Text>

      <Pressable
        onPress={handleResend}
        style={{ backgroundColor: "green", padding: 12, borderRadius: 6, marginBottom: 12 }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Resend Verification Email</Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace("/login")}
        style={{ backgroundColor: "blue", padding: 12, borderRadius: 6 }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Back to Login</Text>
      </Pressable>
    </View>
  );
}
