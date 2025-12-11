// app/index.js
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
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
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";

// Haversine Distance Formula (in km)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Dashboard() {
  const { userDoc } = useAuth();
  const [location, setLocation] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 📍 STEP 1 — Get User Location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        return;
      }

      try {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      } catch (e) {
        console.log("Location error:", e);
      }
    })();
  }, []);

  // 🔥 STEP 2 — Real-Time Complaints + Safe Filtering
  useEffect(() => {
    if (!location) return;

    const q = query(collection(db, "complaints"), where("status", "==", "open"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let all = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Remove entries with invalid or missing coordinates
      const validOnly = all.filter((c) => {
        const lat = c?.location?.latitude;
        const lng = c?.location?.longitude;

        return (
          typeof lat === "number" &&
          typeof lng === "number" &&
          !isNaN(lat) &&
          !isNaN(lng)
        );
      });

      // If user is verified → show all complaints
      if (userDoc?.isVerified) {
        setComplaints(validOnly);
        setLoading(false);
        return;
      }

      // If user NOT verified → filter to 10km radius
      const filtered = validOnly.filter((c) => {
        const dist = getDistanceKm(
          location.latitude,
          location.longitude,
          c.location.latitude,
          c.location.longitude
        );
        return dist <= 10;
      });

      setComplaints(filtered);
      setLoading(false);
    });

    return unsubscribe;
  }, [location, userDoc]);

  if (loading || !location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text>Loading map...</Text>
      </View>
    );
  }

  const recentComplaints = complaints.slice(0, 2);

  return (
    <View style={styles.container}>
      {/* MAP VIEW */}
      <MapView
        style={styles.map}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* User Location */}
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title="You are here"
          pinColor="green"
        />

        {/* Complaint Markers (Crash-proof) */}
        {complaints.map((c) => {
          const lat = c?.location?.latitude;
          const lng = c?.location?.longitude;

          if (
            typeof lat !== "number" ||
            typeof lng !== "number" ||
            isNaN(lat) ||
            isNaN(lng)
          ) {
            return null; // Skip invalid documents
          }

          return (
            <Marker
              key={c.id}
              coordinate={{ latitude: lat, longitude: lng }}
              title={c.title || "Complaint"}
              description={c.contactNumber ? `📞 ${c.contactNumber}` : ""}
              pinColor="red"
              onPress={() => router.push(`/complaintDetails?id=${c.id}`)}
            />
          );
        })}
      </MapView>

      {/* LEGEND */}
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

      {/* LIST */}
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
                {item.contactNumber
                  ? `📞 ${item.contactNumber}`
                  : "No contact provided"}
              </Text>
            </TouchableOpacity>
          )}
        />

        {complaints.length > 2 && (
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => router.push("/showRequests")}
          >
            <Text style={styles.viewMoreText}>View More Complaints</Text>
          </TouchableOpacity>
        )}

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

/* STYLES */
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
