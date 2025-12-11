import { useLocalSearchParams, useRouter } from "expo-router";
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  increment,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { db } from "../lib/firebase";

export default function HelperList() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [helpers, setHelpers] = useState([]);

  useEffect(() => {
    const fetchHelpers = async () => {
      const snap = await getDoc(doc(db, "complaints", id));
      const data = snap.data();
      setHelpers(data?.helpers || []);
    };
    fetchHelpers();
  }, [id]);

  const updateStatus = async (helper, status) => {
    try {
      const complaintRef = doc(db, "complaints", id);
      const userRef = doc(db, "users", helper.userId);

      // ✅ Update complaint helpers array
      await updateDoc(complaintRef, { helpers: arrayRemove(helper) });
      await updateDoc(complaintRef, {
        helpers: arrayUnion({ ...helper, status }),
      });

      // ✅ Update helper user: points + notification
      await updateDoc(userRef, {
        points: increment(status === "accepted" ? 20 : -2),
        notifications: arrayUnion({
          message:
            status === "accepted"
              ? "✅ You were accepted as a helper (+20 pts)"
              : "❌ Your help request was rejected (-2 pts)",
          timestamp: new Date().toISOString(),
        }),
      });

      // ✅ Update local state
      setHelpers((prev) =>
        prev.map((h) =>
          h.userId === helper.userId ? { ...h, status } : h
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ ✅ UNIVERSAL BACK → ALWAYS GO TO COMPLAINT DETAILS
  const goBackToComplaint = () => {
    router.replace(`/complaintDetails?id=${id}`);
  };

  if (!helpers.length) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <Pressable
          onPress={goBackToComplaint}
          style={{
            marginBottom: 15,
            paddingVertical: 8,
            paddingHorizontal: 14,
            backgroundColor: "#1976d2",
            borderRadius: 20,
            alignSelf: "flex-start",
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>⬅ Back</Text>
        </Pressable>

        <View style={styles.emptyCard}>
          <Image source={require("./img.png")} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No helpers yet</Text>
          <Text style={styles.emptySubtitle}>No one has volunteered for this complaint yet.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Pressable
        onPress={goBackToComplaint}
        style={{
          marginBottom: 15,
          paddingVertical: 8,
          paddingHorizontal: 14,
          backgroundColor: "#1976d2",
          borderRadius: 20,
          alignSelf: "flex-start",
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>⬅ Back</Text>
      </Pressable>

      <FlatList
        data={helpers}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={{ uri: item.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
              style={styles.avatar}
            />

            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.statusText}>{item.status?.toUpperCase() || "PENDING"}</Text>
            </View>

            {item.status === "pending" ? (
              <View style={styles.actionsRow}>
                <Pressable onPress={() => updateStatus(item, "accepted")} style={[styles.actionBtn, styles.acceptBtn]}>
                  <Text style={styles.actionText}>Accept</Text>
                </Pressable>
                <Pressable onPress={() => updateStatus(item, "rejected")} style={[styles.actionBtn, styles.rejectBtn]}>
                  <Text style={styles.actionText}>Reject</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={[styles.statusBadge, item.status === "accepted" ? styles.acceptBadge : styles.rejectBadge]}>
                {item.status === "accepted" ? "Accepted" : "Rejected"}
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: "#f4f7fb" },
  emptyCard: { alignItems: "center", padding: 28, backgroundColor: "#fff", borderRadius: 12, elevation: 3 },
  emptyIcon: { width: 64, height: 64, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { color: "#666", textAlign: "center" },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 12, borderRadius: 10, marginBottom: 12, elevation: 2 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12, backgroundColor: "#eee" },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700" },
  statusText: { fontSize: 12, color: "#777", marginTop: 4 },
  actionsRow: { flexDirection: "row" },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8 },
  acceptBtn: { backgroundColor: "#2e7d32" },
  rejectBtn: { backgroundColor: "#c62828" },
  actionText: { color: "white", fontWeight: "700" },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, fontWeight: "700" },
  acceptBadge: { backgroundColor: "#e8f5e9", color: "#2e7d32" },
  rejectBadge: { backgroundColor: "#ffebee", color: "#c62828" },
});
