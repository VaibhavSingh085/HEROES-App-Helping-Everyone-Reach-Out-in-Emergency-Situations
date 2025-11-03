// app/index.js
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { db } from "../lib/firebase.ts";

export default function Dashboard() {
  const [location, setLocation] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 📍 Get user's current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is needed to show nearby complaints.");
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  // 🔥 Fetch only open complaints from Firestore (same as showRequests)
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const q = query(collection(db, "complaints"), where("status", "==", "open"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComplaints(data);
      } catch (err) {
        console.error("Error fetching complaints:", err);
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text>Loading map...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <Text>Fetching your location...</Text>
      </View>
    );
  }

  const recentComplaints = complaints.slice(0, 2);

  return (
    <View style={styles.container}>
      {/* 🗺️ Map */}
      <MapView
        style={styles.map}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* 🟢 Your location */}
        <Marker
          coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          title="You are here"
          pinColor="green"
        />

        {/* 🔴 Complaint markers */}
        {complaints.map(
          (c) =>
            c.location && (
              <Marker
                  key={c.id}
                  coordinate={{
                    latitude: c.location.latitude,
                    longitude: c.location.longitude,
              }}
                  title={c.title || "Complaint"}
                  description={c.contactNumber ? `📞 ${c.contactNumber}` : ""}
                  pinColor="red"
                  onPress={() => router.push(`/complaintDetails?id=${c.id}`)}
              />
            )
        )}
      </MapView>

      {/* 🧭 Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "green" }]} />
          <Text>Your Location</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "red" }]} />
          <Text>Complaint</Text>
        </View>
      </View>

      {/* 📋 Recent Complaints */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Recent Complaints</Text>
        <FlatList
          data={recentComplaints}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/complaintDetails?id=${item.id}`)}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardInfo}>
                      {item.contactNumber ? `📞 ${item.contactNumber}` : "No contact provided"}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text>No open complaints yet.</Text>}
        />

        {/* View More Button */}
        {complaints.length > 2 && (
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => router.push("/showRequests")}
          >
            <Text style={styles.viewMoreText}>View More Complaints</Text>
          </TouchableOpacity>
        )}

        {/* I Need Help Button */}
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => router.push("/needHelp")}
        >
          <Text style={styles.helpText}>🆘 I Need Help</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  legend: {
    position: "absolute",
    top: 50,
    left: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    padding: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  listContainer: {
    padding: 15,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -10,
  },
  listTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold" },
  cardInfo: { color: "#555", marginTop: 4 },
  viewMoreButton: {
    backgroundColor: "#1976D2",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginTop: 8,
  },
  viewMoreText: { color: "white", fontWeight: "bold" },
  helpButton: {
    backgroundColor: "#d32f2f",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },
  helpText: { color: "white", fontWeight: "bold" },
});
