import { useLocalSearchParams, useRouter } from "expo-router";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";

export default function EditComplaintRequest() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  const [complaint, setComplaint] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  useEffect(() => {
    const fetchComplaint = async () => {
      const snap = await getDoc(doc(db, "complaints", id));
      if (snap.exists()) {
        const data = snap.data();
        setComplaint(data);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setContactNumber(data.contactNumber || "");
      }
    };
    fetchComplaint();
  }, [id]);

  // ✅ SUBMIT EDIT REQUEST
  const handleSubmit = async () => {
    try {
      const request = {
        editorId: user.uid,
        editorName: user.displayName || "Anonymous",
        proposedChanges: { title, description, contactNumber },
        status: "pending",
        timestamp: new Date().toISOString(),
      };

      // ✅ Save edit request to complaint
      await updateDoc(doc(db, "complaints", id), {
        editRequests: arrayUnion(request),
      });

      // ✅ Notify creator
      await updateDoc(doc(db, "users", complaint.userId), {
        notifications: arrayUnion({
          message: `${user.displayName} requested to edit your complaint "${complaint.title}"`,
          timestamp: new Date().toISOString(),
        }),
      });

      Alert.alert("Request Sent", "Edit request sent for approval.");

      // ✅ ✅ GO BACK TO COMPLAINT DETAILS (NOT router.back)
      router.replace(`/complaintDetails?id=${id}`);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to send edit request.");
    }
  };

  if (!complaint) return null;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* ✅ BACK BUTTON → ALWAYS TO COMPLAINT DETAILS */}
      <Pressable
        onPress={() => router.replace(`/complaintDetails?id=${id}`)}
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

      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
        Request Edit
      </Text>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        style={input}
      />

      <TextInput
        value={contactNumber}
        onChangeText={setContactNumber}
        placeholder="Contact"
        style={input}
      />

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        style={[input, { height: 100 }]}
        multiline
      />

      <Pressable onPress={handleSubmit} style={btn}>
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Submit Edit Request
        </Text>
      </Pressable>
    </View>
  );
}

const input = {
  borderWidth: 1,
  borderColor: "#ccc",
  padding: 12,
  borderRadius: 8,
  marginBottom: 12,
};

const btn = {
  backgroundColor: "green",
  padding: 14,
  borderRadius: 8,
  alignItems: "center",
};
