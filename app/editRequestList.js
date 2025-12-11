import { useLocalSearchParams, useRouter } from "expo-router";
import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { db } from "../lib/firebase";

export default function EditRequestList() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const snap = await getDoc(doc(db, "complaints", id));
      const data = snap.data();
      setRequests(data.editRequests || []);
    };
    fetchRequests();
  }, [id]);

  const handleDecision = async (req, decision) => {
    const complaintRef = doc(db, "complaints", id);
    const userRef = doc(db, "users", req.editorId);

    // Apply changes if accepted
    if (decision === "accepted") {
      await updateDoc(complaintRef, {
        title: req.proposedChanges.title,
        description: req.proposedChanges.description,
        contactNumber: req.proposedChanges.contactNumber,
      });

      await updateDoc(userRef, {
        points: increment(5),
        notifications: arrayUnion({
          message: "✅ Your edit request was accepted (+5 pts)",
          timestamp: new Date().toISOString(),
        }),
      });
    } else {
      await updateDoc(userRef, {
        points: increment(-2),
        notifications: arrayUnion({
          message: "❌ Your edit request was rejected (-2 pts)",
          timestamp: new Date().toISOString(),
        }),
      });
    }

    // Mark this request as handled in Firestore (optional) or remove it
    await updateDoc(complaintRef, {
      editRequests: requests.filter((r) => r.timestamp !== req.timestamp),
    });

    // Update local state
    setRequests((prev) =>
      prev.filter((r) => r.timestamp !== req.timestamp)
    );
  };

  if (!requests.length) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <Pressable
          onPress={() => router.back()}
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
          <Text style={styles.emptyTitle}>No edit requests</Text>
          <Text style={styles.emptySubtitle}>No one has suggested edits for this complaint yet.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <Pressable
        onPress={() => router.back()}
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

      {requests.map((req, index) => (
        <View key={index} style={styles.card}>
          <Image source={{ uri: req.editorPhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }} style={styles.avatar} />

          <View style={styles.info}>
            <Text style={styles.editorName}>{req.editorName}</Text>
            <Text style={styles.editLabel}>Title</Text>
            <Text style={styles.editValue}>{req.proposedChanges.title || "—"}</Text>
            <Text style={styles.editLabel}>Contact</Text>
            <Text style={styles.editValue}>{req.proposedChanges.contactNumber || "—"}</Text>
            <Text style={styles.editLabel}>Description</Text>
            <Text style={styles.editValue}>{req.proposedChanges.description || "—"}</Text>
          </View>

          <View style={styles.actionsColumn}>
            <Pressable onPress={() => handleDecision(req, "accepted")} style={[styles.actionBtn, styles.acceptBtn]}>
              <Text style={styles.actionText}>Accept</Text>
            </Pressable>
            <Pressable onPress={() => handleDecision(req, "rejected")} style={[styles.actionBtn, styles.rejectBtn]}>
              <Text style={styles.actionText}>Reject</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: "#f4f7fb" },
  emptyCard: { alignItems: "center", padding: 28, backgroundColor: "#fff", borderRadius: 12, elevation: 3 },
  emptyIcon: { width: 64, height: 64, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { color: "#666", textAlign: "center" },
  card: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#fff", padding: 12, borderRadius: 10, marginBottom: 12, elevation: 2 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12, backgroundColor: "#eee" },
  info: { flex: 1 },
  editorName: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  editLabel: { fontSize: 12, color: "#777", marginTop: 6 },
  editValue: { fontSize: 14, color: "#333", marginTop: 2 },
  actionsColumn: { marginLeft: 12, justifyContent: "space-between" },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8 },
  acceptBtn: { backgroundColor: "#2e7d32" },
  rejectBtn: { backgroundColor: "#c62828" },
  actionText: { color: "white", fontWeight: "700" },
});
