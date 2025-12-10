import { useLocalSearchParams, useRouter } from "expo-router";
import {
    arrayUnion,
    doc,
    getDoc,
    increment,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
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
        <Text>No edit requests currently.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ padding: 16 }}>
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
        <View
          key={index}
          style={{
            marginBottom: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
          }}
        >
          <Text>Editor: {req.editorName}</Text>
          <Text>New Title: {req.proposedChanges.title}</Text>
          <Text>New Contact: {req.proposedChanges.contactNumber}</Text>
          <Text>New Description: {req.proposedChanges.description}</Text>

          <View style={{ flexDirection: "row", marginTop: 8 }}>
            <Pressable onPress={() => handleDecision(req, "accepted")}>
              <Text style={{ color: "green" }}>Accept</Text>
            </Pressable>
            <Pressable
              onPress={() => handleDecision(req, "rejected")}
              style={{ marginLeft: 16 }}
            >
              <Text style={{ color: "red" }}>Reject</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
