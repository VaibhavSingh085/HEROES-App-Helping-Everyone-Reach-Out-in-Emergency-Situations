import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";

export default function ComplaintDetails() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  const [complaint, setComplaint] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Creator edit mode
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContact, setEditContact] = useState("");

  useEffect(() => {
    const fetchComplaint = async () => {
      const snap = await getDoc(doc(db, "complaints", id));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setComplaint(data);
        setEditTitle(data.title || "");
        setEditDescription(data.description || "");
        setEditContact(data.contactNumber || "");
      }
    };
    fetchComplaint();
  }, [id]);

  if (!complaint) return <Text style={{ padding: 16 }}>Loading...</Text>;

  const isCreator = complaint.userId === user.uid;
  const spamVotes = complaint.spamVotes || [];
  const spamCount = spamVotes.length;
  const hasVotedSpam = spamVotes.includes(user.uid);
  const remainingSpamVotes = Math.max(0, 5 - spamCount);

  // Open map
  const openMap = (lat, lng) => {
    if (!lat || !lng) {
      Alert.alert("Location not available");
      return;
    }
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
      Alert.alert("Success", "Complaint marked as resolved.");
      router.replace("/showRequests");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to mark resolved.");
    }
  };

  // Help request (for non-creator)
  const handleHelp = async () => {
    try {
      const alreadyHelper = complaint.helpers?.some(
        (h) => h.userId === user.uid
      );
      if (alreadyHelper) {
        Alert.alert("Already Registered", "You already volunteered to help.");
        return;
      }

      const newHelper = {
        userId: user.uid,
        name: user.displayName || "Anon",
        status: "pending",
      };

      await updateDoc(doc(db, "complaints", id), {
        helpers: arrayUnion(newHelper),
      });

      setComplaint({
        ...complaint,
        helpers: [...(complaint.helpers || []), newHelper],
      });

      Alert.alert("Success", "You are now listed as a helper.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to submit help request.");
    }
  };

  // Non-creator: send edit request (100+ points)
  const handleSendEditRequest = async () => {
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      const userData = snap.data();

      if (!userData || userData.points < 10) {
        Alert.alert("Not Eligible", "You need 100+ points to request edits.");
        return;
      }

      router.push(`/editComplaintRequest?id=${complaint.id}`);
      // NOTE: this assumes you already have app/editComplaintRequests.js
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to verify points.");
    }
  };

  // Creator direct edit save
  const handleCreatorSaveEdit = async () => {
    try {
      await updateDoc(doc(db, "complaints", id), {
        title: editTitle,
        description: editDescription,
        contactNumber: editContact,
      });

      setComplaint({
        ...complaint,
        title: editTitle,
        description: editDescription,
        contactNumber: editContact,
      });

      setEditMode(false);
      Alert.alert("Success", "Complaint updated successfully!");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update complaint.");
    }
  };

  // Mark as spam (>200 points) – delete at 5 votes
  const handleMarkSpam = async () => {
    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const userData = userSnap.data();

      if (!userData || userData.points <= 20) {
        Alert.alert("Not Eligible", "You need more than 200 points to mark spam.");
        return;
      }

      if (hasVotedSpam) {
        Alert.alert("Already Marked", "You already marked this as spam.");
        return;
      }

      const updatedVotes = [...spamVotes, user.uid];
      const complaintRef = doc(db, "complaints", id);

      // If this is the 5th vote → delete complaint
      if (updatedVotes.length >= 2) {
        await deleteDoc(complaintRef);
        Alert.alert(
          "Deleted",
          "This complaint received 5 spam votes and has been removed."
        );
        router.replace("/showRequests");
        return;
      }

      // Otherwise just update spamVotes
      await updateDoc(complaintRef, {
        spamVotes: updatedVotes,
      });

      setComplaint({
        ...complaint,
        spamVotes: updatedVotes,
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to mark spam.");
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {/* Back button – small pill, not full width */}
      <Pressable
        onPress={() => router.push("/showRequests")}
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

      {/* Creator Edit / View */}
      {editMode ? (
        <>
          <TextInput
            value={editTitle}
            onChangeText={setEditTitle}
            style={input}
            placeholder="Title"
          />
          <TextInput
            value={editContact}
            onChangeText={setEditContact}
            style={input}
            placeholder="Contact Number"
          />
          <TextInput
            value={editDescription}
            onChangeText={setEditDescription}
            multiline
            style={[input, { height: 100 }]}
            placeholder="Description"
          />

          <Pressable onPress={handleCreatorSaveEdit} style={btnGreen}>
            <Text style={btnText}>✅ Save Changes</Text>
          </Pressable>

          <Pressable onPress={() => setEditMode(false)} style={{ marginTop: 8 }}>
            <Text style={{ textAlign: "center", color: "red" }}>Cancel</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 22, fontWeight: "bold" }}>
            {complaint.title}
          </Text>
          <Text>{complaint.description}</Text>
          <Text>By: {complaint.name}</Text>
          {complaint.contactNumber && (
            <Text>📞 {complaint.contactNumber}</Text>
          )}

          {isCreator && (
            <Pressable
              onPress={() => setEditMode(true)}
              style={btnOrange}
            >
              <Text style={btnText}>✏️ Edit My Complaint</Text>
            </Pressable>
          )}
        </>
      )}

      {/* Image */}
      {complaint.imageUrl && (
        <TouchableOpacity onPress={() => setImageModalVisible(true)}>
          <Image
            source={{ uri: complaint.imageUrl }}
            style={{ height: 200, borderRadius: 12, marginTop: 12 }}
          />
        </TouchableOpacity>
      )}

      <Modal visible={imageModalVisible} transparent>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "black" }}
          onPress={() => setImageModalVisible(false)}
        >
          <Image
            source={{ uri: complaint.imageUrl }}
            style={{
              width: "100%",
              height: "100%",
              resizeMode: "contain",
            }}
          />
        </TouchableOpacity>
      </Modal>

      {/* Map */}
      {complaint.location && (
        <Pressable
          onPress={() =>
            openMap(
              complaint.location.latitude,
              complaint.location.longitude
            )
          }
          style={btnBlue}
        >
          <Text style={btnText}>📍 Open in Maps</Text>
        </Pressable>
      )}

      {/* CREATOR-ONLY BUTTONS */}
      {isCreator && (
        <>
          <Pressable
            onPress={() => router.push(`/helperList?id=${id}`)}
            style={btnHelp}
          >
            <Text style={btnText}>👥 See Helpers</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push(`/editRequestList?id=${id}`)}
            style={btnOrange}
          >
            <Text style={btnText}>✏️ See Edit Requests</Text>
          </Pressable>

          <Pressable
            onPress={handleMarkResolved}
            style={btnTomato}
          >
            <Text style={btnText}>✅ Mark Resolved</Text>
          </Pressable>
        </>
      )}

      {/* NON-CREATOR VIEW */}
      {!isCreator && (
        <>
          {/* I Helped This Person */}
          {complaint.helpers?.some((h) => h.userId === user.uid) ? (
            <Text
              style={{
                marginTop: 20,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              ✅ You already volunteered to help
            </Text>
          ) : (
            <Pressable onPress={handleHelp} style={btnHelp}>
              <Text style={btnText}>🤝 I Helped This Person</Text>
            </Pressable>
          )}

          {/* Request Edit */}
          <Pressable
            onPress={handleSendEditRequest}
            style={btnOrange}
          >
            <Text style={btnText}>✏️ Request Edit (100+ Points)</Text>
          </Pressable>

          {/* Spam button + counter */}
          {!hasVotedSpam && (
            <Pressable
              onPress={handleMarkSpam}
              style={btnRed}
            >
              <Text style={btnText}>🚫 Mark as Spam</Text>
            </Pressable>
          )}

          <Text
            style={{
              textAlign: "center",
              marginTop: 6,
              color: "red",
            }}
          >
            Marked as Spam: {spamCount} / 5{" "}
            {remainingSpamVotes > 0
              ? `(${remainingSpamVotes} more for deletion)`
              : "(will be deleted on next vote)"}
          </Text>
        </>
      )}
    </ScrollView>
  );
}

/* Styles */
const input = {
  borderWidth: 1,
  borderColor: "#ccc",
  padding: 10,
  borderRadius: 8,
  marginBottom: 10,
};

const btnText = {
  color: "white",
  textAlign: "center",
  fontWeight: "bold",
};

const btnBlue = {
  backgroundColor: "#1976d2",
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 8,
  marginTop: 12,
  alignSelf: "flex-start",
};

const btnGreen = {
  backgroundColor: "green",
  padding: 12,
  borderRadius: 8,
  marginTop: 8,
};

const btnOrange = {
  backgroundColor: "#ff9800",
  padding: 12,
  borderRadius: 8,
  marginTop: 12,
};

const btnHelp = {
  backgroundColor: "blue",
  padding: 12,
  borderRadius: 8,
  marginTop: 20,
};

const btnRed = {
  backgroundColor: "tomato",
  padding: 12,
  borderRadius: 8,
  marginTop: 20,
};

const btnTomato = {
  backgroundColor: "red",
  padding: 12,
  borderRadius: 8,
  marginTop: 20,
};
