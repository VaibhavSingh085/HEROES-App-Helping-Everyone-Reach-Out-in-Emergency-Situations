// app/showRequests.js
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { db } from "../lib/firebase";

export default function ShowRequests() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const q = query(
          collection(db, "complaints"),
          where("status", "==", "open")
        );
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setComplaints(data);
      } catch (err) {
        console.error("Error fetching complaints:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  if (complaints.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, color: "#666" }}>
          No active requests right now 🚫
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}>
      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              backgroundColor: "#f9f9f9",
              marginBottom: 12,
            }}
          >
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.title}</Text>
          {item.contactNumber ? (
          <Text style={{ color: "#333" }}>📞 {item.contactNumber}</Text>
          ) : (
          <Text style={{ color: "#999" }}>No contact provided</Text>
          )}
          <Text style={{ color: "#555", marginTop: 4 }}>👤 {item.name}</Text>

            {/* View Details button */}
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/complaintDetails",
                  params: { id: item.id },
                })
              }
              style={{
                marginTop: 10,
                padding: 10,
                backgroundColor: "#1976d2",
                borderRadius: 6,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                👀 View Details
              </Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
