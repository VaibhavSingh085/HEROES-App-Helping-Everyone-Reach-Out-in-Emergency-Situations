// app/complaintDetails.js
import * as Linking from "expo-linking";
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
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
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

  // Fetch complaint details
  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const docRef = doc(db, "complaints", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setComplaint({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("Error fetching complaint:", err);
      }
    };
    fetchComplaint();
  }, [id]);

  if (!complaint) {
    return <Text style={{ padding: 16 }}>Loading...</Text>;
  }

  const isCreator = complaint.userId === user.uid;

  // Open map
  const openMap = (lat, lng) => {
    if (!lat || !lng) return;
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${lat},${lng}`
        : `geo:${lat},${lng}?q=${lat},${lng}`;
    Linking.openURL(url).catch((err) =>
      console.error("Error opening map:", err)
    );
  };

  // Handle helping
  const handleHelp = async () => {
    try {
      const docRef = doc(db, "complaints", id);
      const alreadyHelper = complaint.helpers?.some(
        (h) => h.userId === user.uid
      );
      if (alreadyHelper) return;

      const newHelper = {
        userId: user.uid,
        name: user.displayName || "Anon",
        status: "pending",
      };

      await updateDoc(docRef, {
        helpers: arrayUnion(newHelper),
      });

      setComplaint({
        ...complaint,
        helpers: [...(complaint.helpers || []), newHelper],
      });
    } catch (err) {
      console.error("Error adding helper:", err);
    }
  };

  // ✅ Update helper status and award points / notifications
  const handleUpdateHelperStatus = async (helper, newStatus) => {
    try {
      const complaintRef = doc(db, "complaints", id);
      const userRef = doc(db, "users", helper.userId);

      // Remove old helper entry
      await updateDoc(complaintRef, { helpers: arrayRemove(helper) });

      // Add updated helper status
      await updateDoc(complaintRef, {
        helpers: arrayUnion({ ...helper, status: newStatus }),
      });

      // Prepare notification message
      let notificationMsg = "";
      let pointsChange = 0;

      if (newStatus === "accepted") {
        pointsChange = 20;
        notificationMsg = `${complaint.name} accepted your request "${complaint.title}". You earned 20 points.`;
      } else if (newStatus === "rejected") {
        pointsChange = -2;
        notificationMsg = `${complaint.name} rejected your request "${complaint.title}". You lost 2 points.`;
      }

      // Update points and add notification
      await updateDoc(userRef, {
        points: increment(pointsChange),
        notifications: arrayUnion({
          message: notificationMsg,
          timestamp: new Date().toISOString(),
        }),
      });

      // Update local state
      setComplaint({
        ...complaint,
        helpers: complaint.helpers.map((h) =>
          h.userId === helper.userId ? { ...h, status: newStatus } : h
        ),
      });

      Alert.alert("Success", `Helper ${newStatus} successfully!`);
    } catch (err) {
      console.error("Error updating helper status:", err);
    }
  };

  // Mark complaint resolved
  const handleMarkResolved = async () => {
    try {
      const docRef = doc(db, "complaints", id);
      await updateDoc(docRef, { status: "resolved" });
      router.push("/showRequests");
    } catch (err) {
      console.error("Error marking resolved:", err);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {/* Back Button */}
      <Pressable
        onPress={() => router.push("/showRequests")}
        style={{
          marginBottom: 12,
          padding: 10,
          backgroundColor: "#ddd",
          borderRadius: 6,
          alignSelf: "flex-start",
        }}
      >
        <Text>⬅ Back</Text>
      </Pressable>

      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
        {complaint.title || "Complaint"}
      </Text>

      <Text style={{ marginBottom: 8 }}>
        {complaint.description || "No detailed description provided."}
      </Text>

      <Text style={{ marginBottom: 8 }}>By: {complaint.name}</Text>

      {complaint.contactNumber && (
        <Text style={{ marginBottom: 12 }}>📞 {complaint.contactNumber}</Text>
      )}

      {/* Complaint Image */}
      {complaint.imageUrl && (
        <TouchableOpacity onPress={() => setImageModalVisible(true)}>
          <Image
            source={{ uri: complaint.imageUrl }}
            style={{
              width: "100%",
              height: 200,
              borderRadius: 10,
              marginBottom: 15,
            }}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      {/* Image Modal */}
      <Modal visible={imageModalVisible} transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "black",
            justifyContent: "center",
          }}
        >
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 40,
              right: 20,
              zIndex: 10,
            }}
            onPress={() => setImageModalVisible(false)}
          >
            <Text style={{ color: "white", fontSize: 18 }}>✖ Close</Text>
          </TouchableOpacity>

          <Image
            source={{ uri: complaint.imageUrl }}
            style={{
              width: "100%",
              height: "100%",
              resizeMode: "contain",
            }}
          />
        </View>
      </Modal>

      {/* Location Button */}
      {complaint.location && (
        <Pressable
          onPress={() =>
            openMap(complaint.location.latitude, complaint.location.longitude)
          }
          style={{
            marginBottom: 20,
            padding: 12,
            backgroundColor: "#1976d2",
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: "white",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            📍 See Location on Map
          </Text>
        </Pressable>
      )}

      {/* Creator view */}
      {isCreator ? (
        <>
          {complaint.helpers && complaint.helpers.length > 0 && (
            <>
              <Text style={{ fontSize: 18, marginBottom: 10 }}>Helpers:</Text>
              <FlatList
                data={complaint.helpers}
                keyExtractor={(item, idx) => idx.toString()}
                renderItem={({ item }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Text>
                      {item.name} – {item.status}
                    </Text>
                    {item.status === "pending" && (
                      <View style={{ flexDirection: "row" }}>
                        <Pressable
                          onPress={() =>
                            handleUpdateHelperStatus(item, "accepted")
                          }
                          style={{
                            marginRight: 8,
                            padding: 6,
                            backgroundColor: "green",
                            borderRadius: 5,
                          }}
                        >
                          <Text style={{ color: "white" }}>Accept</Text>
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            handleUpdateHelperStatus(item, "rejected")
                          }
                          style={{
                            padding: 6,
                            backgroundColor: "red",
                            borderRadius: 5,
                          }}
                        >
                          <Text style={{ color: "white" }}>Reject</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}
              />
            </>
          )}

          <Pressable
            onPress={handleMarkResolved}
            style={{
              marginTop: 30,
              padding: 12,
              backgroundColor: "tomato",
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              ✅ Mark Complaint as Resolved
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          {complaint.helpers?.some((h) => h.userId === user.uid) ? (
            <Text style={{ marginTop: 20 }}>
              Status:{" "}
              {
                complaint.helpers.find((h) => h.userId === user.uid).status
              }
            </Text>
          ) : (
            <Pressable
              onPress={handleHelp}
              style={{
                marginTop: 20,
                padding: 12,
                backgroundColor: "blue",
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                🤝 I Helped This Person
              </Text>
            </Pressable>
          )}
        </>
      )}
    </ScrollView>
  );
}
