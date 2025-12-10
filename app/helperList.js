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
import { FlatList, Pressable, Text, View } from "react-native";
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

        <Text>No helpers currently.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
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
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
            }}
          >
            <Text>{item.name}</Text>
            <Text>Status: {item.status}</Text>

            {item.status === "pending" && (
              <View style={{ flexDirection: "row", marginTop: 8 }}>
                <Pressable onPress={() => updateStatus(item, "accepted")}>
                  <Text style={{ color: "green" }}>Accept</Text>
                </Pressable>

                <Pressable
                  onPress={() => updateStatus(item, "rejected")}
                  style={{ marginLeft: 16 }}
                >
                  <Text style={{ color: "red" }}>Reject</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}
