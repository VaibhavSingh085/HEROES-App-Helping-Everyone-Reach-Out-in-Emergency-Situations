// app/complaintDetails.js
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  arrayUnion,
  arrayRemove,
  deleteDoc,
  doc,
  onSnapshot,
  getDoc,
  updateDoc,
  increment
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";

export default function ComplaintDetails() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  const [complaint, setComplaint] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Editing state
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContact, setEditContact] = useState("");

  // 🔥 REAL-TIME Firestore listener
  useEffect(() => {
    const ref = doc(db, "complaints", id);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        Alert.alert("Deleted", "This complaint no longer exists.");
        router.replace("/showRequests");
        return;
      }

      const data = { id: snap.id, ...snap.data() };
      setComplaint(data);

      setEditTitle(data.title || "");
      setEditDescription(data.description || "");
      setEditContact(data.contactNumber || "");
    });

    return () => unsub();
  }, [id]);

  if (!complaint) return <Text style={{ padding: 16 }}>Loading...</Text>;

  const isCreator = complaint.userId === user.uid;

  // Spam
  const spamVotes = complaint.spamVotes || [];
  const spamCount = spamVotes.length;
  const hasVotedSpam = spamVotes.includes(user.uid);
  const remainingSpamVotes = Math.max(0, 5 - spamCount);

  // Open map
  const openMap = (lat, lng) => {
    if (!lat || !lng) return Alert.alert("Location not available");

    const url = Platform.select({
      android: `geo:${lat},${lng}?q=${lat},${lng}`,
      ios: `http://maps.apple.com/?ll=${lat},${lng}`,
    });

    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open map")
    );
  };

  // Mark resolved
  const handleMarkResolved = async () => {
    try {
      await updateDoc(doc(db, "complaints", id), { status: "resolved" });
      router.replace("/showRequests");
    } catch (err) {
      Alert.alert("Error", "Failed to mark resolved.");
    }
  };

  // Volunteer help
  const handleHelp = async () => {
    if (complaint.helpers?.some((h) => h.userId === user.uid)) {
      return Alert.alert("Already Registered", "You already volunteered.");
    }

    const newHelper = {
      userId: user.uid,
      name: user.displayName || "Anonymous",
      status: "pending",
    };

    await updateDoc(doc(db, "complaints", id), {
      helpers: arrayUnion(newHelper),
    });
  };

  // Request edit (100+ points)
  const handleSendEditRequest = async () => {
    const snap = await getDoc(doc(db, "users", user.uid));
    const data = snap.data();

    if (!data || data.points < 100) {
      return Alert.alert("Not Eligible", "You need 100+ points.");
    }

    router.push(`/editComplaintRequest?id=${complaint.id}`);
  };

  // Save edits by creator
  const handleCreatorSaveEdit = async () => {
    try {
      await updateDoc(doc(db, "complaints", id), {
        title: editTitle,
        description: editDescription,
        contactNumber: editContact,
      });

      setEditMode(false);
      Alert.alert("Success", "Complaint updated.");
    } catch {
      Alert.alert("Error", "Update failed.");
    }
  };

  // Spam vote → delete at 5
  const handleMarkSpam = async () => {
    const snap = await getDoc(doc(db, "users", user.uid));
    const data = snap.data();

    if (!data || data.points < 200) {
      return Alert.alert("Not Eligible", "Need 200+ points.");
    }

    if (hasVotedSpam) {
      return Alert.alert("Already Done", "You already marked this spam.");
    }

    const updated = [...spamVotes, user.uid];
    const ref = doc(db, "complaints", id);

    if (updated.length >= 5) {
      await deleteDoc(ref);
      Alert.alert("Deleted", "Complaint removed after 5 spam votes.");
      return router.replace("/showRequests");
    }

    await updateDoc(ref, { spamVotes: updated });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Back */}
      <Pressable onPress={() => router.replace("/showRequests")} style={styles.backButton}>
        <Text style={styles.backText}>⬅ Back</Text>
      </Pressable>

      {/* Card */}
      <View style={styles.card}>
        {editMode ? (
          <>
            <TextInput value={editTitle} onChangeText={setEditTitle} placeholder="Title" style={styles.input} />
            <TextInput value={editContact} onChangeText={setEditContact} placeholder="Contact Number" style={styles.input} />
            <TextInput value={editDescription} onChangeText={setEditDescription} multiline placeholder="Description" style={[styles.input, { height: 120 }]} />

            <Pressable onPress={handleCreatorSaveEdit} style={[styles.buttonGreen, styles.fullButton]}>
              <Text style={styles.buttonText}>💾 Save Changes</Text>
            </Pressable>

            <Pressable onPress={() => setEditMode(false)} style={{ marginTop: 8 }}>
              <Text style={{ color: "red", textAlign: "center" }}>Cancel</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.title}>{complaint.title}</Text>
            <Text style={styles.description}>{complaint.description}</Text>
            <Text style={styles.meta}>By: {complaint.name}</Text>
            {complaint.contactNumber && <Text style={styles.meta}>📞 {complaint.contactNumber}</Text>}

            {isCreator && (
              <View style={styles.row}>
                <Pressable onPress={() => setEditMode(true)} style={[styles.buttonOrange, styles.halfButton]}>
                  <Text style={styles.buttonText}>✏️ Edit</Text>
                </Pressable>

                <Pressable onPress={() => router.push(`/helperList?id=${id}`)} style={[styles.buttonBlue, styles.halfButton]}>
                  <Text style={styles.buttonText}>👥 Helpers</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </View>

      {/* Image */}
      {complaint.imageUrl && (
        <TouchableOpacity onPress={() => setImageModalVisible(true)}>
          <Image source={{ uri: complaint.imageUrl }} style={styles.image} />
        </TouchableOpacity>
      )}

      <Modal visible={imageModalVisible} transparent>
        <TouchableOpacity style={styles.modalBackground} onPress={() => setImageModalVisible(false)}>
          <Image source={{ uri: complaint.imageUrl }} style={styles.modalImage} />
        </TouchableOpacity>
      </Modal>

      {/* Map */}
      {complaint.location && (
        <Pressable
          onPress={() => openMap(complaint.location.latitude, complaint.location.longitude)}
          style={[styles.buttonBlue, styles.fullButton]}
        >
          <Text style={styles.buttonText}>📍 Open in Maps</Text>
        </Pressable>
      )}

      {/* Creator Buttons */}
      {isCreator && (
        <>
          <Pressable onPress={() => router.push(`/editRequestList?id=${id}`)} style={[styles.buttonOrange, styles.fullButton]}>
            <Text style={styles.buttonText}>✏️ Edit Requests</Text>
          </Pressable>

          <Pressable onPress={handleMarkResolved} style={[styles.buttonRed, styles.fullButton]}>
            <Text style={styles.buttonText}>✅ Mark Resolved</Text>
          </Pressable>
        </>
      )}

      {/* Non creators */}
      {!isCreator && (
        <>
          {complaint.helpers?.some((h) => h.userId === user.uid) ? (
            <Text style={styles.greenText}>You already volunteered.</Text>
          ) : (
            <Pressable onPress={handleHelp} style={[styles.buttonGreen, styles.fullButton]}>
              <Text style={styles.buttonText}>🤝 I Helped This Person</Text>
            </Pressable>
          )}

          <Pressable onPress={handleSendEditRequest} style={[styles.buttonOrange, styles.fullButton]}>
            <Text style={styles.buttonText}>✏️ Request Edit</Text>
          </Pressable>

          {!hasVotedSpam && (
            <Pressable onPress={handleMarkSpam} style={[styles.buttonRed, styles.fullButton]}>
              <Text style={styles.buttonText}>🚫 Mark as Spam</Text>
            </Pressable>
          )}

          <Text style={styles.spamText}>
            Marked as Spam: {spamCount} / 5  
            {remainingSpamVotes > 0 ? ` (${remainingSpamVotes} more needed)` : ""}
          </Text>
        </>
      )}
    </ScrollView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa", padding: 16 },

  backButton: {
    backgroundColor: "#1976d2",
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  backText: { color: "white", fontWeight: "bold" },

  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: "800" },
  description: { marginVertical: 8, color: "#444" },
  meta: { fontSize: 14, color: "#555" },

  row: { flexDirection: "row", marginTop: 10, justifyContent: "space-between" },
  halfButton: { width: "48%" },
  fullButton: { width: "100%", marginTop: 10 },

  image: { width: "100%", height: 220, borderRadius: 12, marginVertical: 14 },

  modalBackground: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: { width: "100%", height: "100%", resizeMode: "contain" },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },

  buttonText: { color: "white", fontWeight: "bold", textAlign: "center" },

  buttonBlue: { backgroundColor: "#1976d2", padding: 12, borderRadius: 10 },
  buttonGreen: { backgroundColor: "#2e7d32", padding: 12, borderRadius: 10 },
  buttonOrange: { backgroundColor: "#ff9800", padding: 12, borderRadius: 10 },
  buttonRed: { backgroundColor: "#d32f2f", padding: 12, borderRadius: 10 },

  spamText: { textAlign: "center", marginTop: 6, color: "red" },
  greenText: { textAlign: "center", marginTop: 8, fontWeight: "bold", color: "#2e7d32" },
});
