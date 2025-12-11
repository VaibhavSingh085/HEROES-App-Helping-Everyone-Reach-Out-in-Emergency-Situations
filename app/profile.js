// app/profile.js
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../lib/firebase";

export default function Profile() {
  const { user, userDoc } = useAuth(); // <-- now we get userDoc from AuthContext
  const router = useRouter();

  const [name, setName] = useState(user?.displayName || "");
  const [image, setImage] = useState(user?.photoURL || null);
  const [loading, setLoading] = useState(false);

  const points = userDoc?.points || 0;
  const notifications = userDoc?.notifications || [];
  const isVerified = userDoc?.isVerified === true;

  // Pick image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      const selected = result.assets[0];
      setImage(selected.uri);
      await uploadImage(selected.base64);
    }
  };

  // Upload to ImgBB
  const uploadImage = async (base64Data) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=a6079285c61ca7672e18094a9b84f30a`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `image=${encodeURIComponent(base64Data)}`,
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error("Image upload failed");

      const imageUrl = data.data.url;

      await updateProfile(auth.currentUser, {
        photoURL: imageUrl,
        displayName: name,
      });

      await updateDoc(doc(db, "users", user.uid), {
        name,
        photoURL: imageUrl,
      });

      setImage(imageUrl);
      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not upload image.");
    } finally {
      setLoading(false);
    }
  };

  // Save name
  const handleSave = async () => {
    try {
      setLoading(true);
      await updateProfile(auth.currentUser, { displayName: name });
      await updateDoc(doc(db, "users", user.uid), { name });
      Alert.alert("Success", "Profile updated!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not update name.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      

      <Text style={styles.pageTitle}>My Profile</Text>

      {/* PROFILE ROW */}
      <View style={styles.profileRow}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
          <Image
            source={{ uri: image || "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-File.png" }}
            style={styles.avatar}
          />
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>🎖️ Verified</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.nameText}>{name}</Text>
          {isVerified ? (
            <Text style={styles.verifiedText}>Verified Professional</Text>
          ) : (
            <Text style={styles.subtitle}>Not verified yet</Text>
          )}
        </View>
      </View>

      {/* Save Picture Button */}
      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" style={{ marginVertical: 12 }} />
      ) : (
        <TouchableOpacity onPress={() => uploadImage(image)} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Save New Picture</Text>
        </TouchableOpacity>
      )}

      {/* NAME INPUT */}
      <TextInput placeholder="Your Name" value={name} onChangeText={setName} style={styles.input} />

      {/* SAVE NAME BUTTON */}
      <TouchableOpacity onPress={handleSave} style={styles.positiveButton}>
        <Text style={styles.positiveButtonText}>Save Changes</Text>
      </TouchableOpacity>

      {/* VERIFIED BUTTON */}
      {!isVerified && (
        <Pressable onPress={() => router.push("/verifyUser")} style={styles.primaryButtonOutline}>
          <Text style={styles.primaryButtonText}>Become Verified</Text>
        </Pressable>
      )}

      {/* POINTS */}
      <View style={styles.pointsCard}>
        <Text style={styles.pointsTitle}>🌟 Points: {points}</Text>
        <Text style={styles.pointsSubtitle}>Keep helping to earn more!</Text>
      </View>

      {/* NOTIFICATIONS */}
      <View style={styles.notificationsCard}>
        <Text style={styles.notificationsTitle}>🔔 Notifications</Text>

        {notifications.length === 0 ? (
          <Text style={styles.noNotifications}>No notifications yet.</Text>
        ) : (
          <FlatList
            data={[...notifications].reverse()}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.notificationItem}>
                <Text style={styles.notificationText}>{item.message}</Text>
                <Text style={styles.notificationTime}>{new Date(item.timestamp).toLocaleString()}</Text>
              </View>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", padding: 20, backgroundColor: "#f5f6fa" },
  header: { alignItems: "center", marginBottom: 12 },
  logo: { width: 72, height: 72, marginBottom: 6 },
  appTitle: { fontSize: 18, fontWeight: "800", color: "#1b5e20" },
  tagline: { fontSize: 13, color: "#555", textAlign: "center", marginBottom: 6 },
  pageTitle: { fontSize: 26, fontWeight: "bold", marginBottom: 10 },
  profileRow: { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 18 },
  avatarWrapper: { width: 120, height: 120, borderRadius: 60, overflow: "visible" },
  avatar: { width: 120, height: 120 },
  verifiedBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    backgroundColor: "#1b5e20",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 16,
    elevation: 4,
  },
  verifiedBadgeText: { color: "white", fontWeight: "700", fontSize: 12 },
  nameText: { fontSize: 22, fontWeight: "800", color: "#111" },
  verifiedText: { color: "#2b8a3e", fontWeight: "700", marginTop: 6 },
  subtitle: { color: "#777", marginTop: 6 },
  primaryButton: { backgroundColor: "#1976d2", padding: 10, borderRadius: 8, width: "100%", marginBottom: 12 },
  primaryButtonText: { color: "black", fontWeight: "bold", textAlign: "center" },
  primaryButtonOutline: { borderWidth: 1, borderColor: "#1976d2", padding: 10, borderRadius: 8, width: "100%", marginBottom: 20 },
  positiveButton: { backgroundColor: "#4CAF50", padding: 12, borderRadius: 8, width: "100%", marginBottom: 12 },
  positiveButtonText: { color: "white", fontWeight: "bold", textAlign: "center" },
  input: { width: "100%", padding: 12, backgroundColor: "white", borderRadius: 8, borderColor: "#ccc", borderWidth: 1, marginBottom: 15 },
  pointsCard: { backgroundColor: "#fff", padding: 16, borderRadius: 10, width: "100%", alignItems: "center", marginBottom: 20 },
  pointsTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  pointsSubtitle: { color: "#666" },
  notificationsCard: { width: "100%", backgroundColor: "#fff", borderRadius: 10, padding: 16, elevation: 2 },
  notificationsTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  noNotifications: { color: "#777" },
  notificationItem: { backgroundColor: "#f0f4ff", padding: 10, borderRadius: 8, marginBottom: 10 },
  notificationText: { fontSize: 15 },
  notificationTime: { fontSize: 12, color: "#777", marginTop: 4, textAlign: "right" },
});
