import { LinearGradient } from "expo-linear-gradient";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from "react-native";
import { db } from "../lib/firebase";

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, "users"), orderBy("points", "desc"));
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers(data);
      } catch (err) {
        console.error("Leaderboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading leaderboard...</Text>
      </View>
    );
  }

  const medal = ["🥇", "🥈", "🥉"];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Leaderboard</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const isTop1 = index === 0;

          return (
            <View style={styles.wrapper}>
              {isTop1 ? (
                <LinearGradient
                  colors={["#ffcc00", "#ffdd44", "#ffee88"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.card, styles.topCard]}
                >
                  <Text style={styles.rank}>🥇</Text>
                  <Image
                    source={{
                      uri:
                        item.photoURL ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                    }}
                    style={styles.avatarLarge}
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={styles.nameTop}>{item.name}</Text>
                    <Text style={styles.pointsTop}>{item.points} points</Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.rank}>
                    {medal[index] ? medal[index] : `#${index + 1}`}
                  </Text>

                  <Image
                    source={{
                      uri:
                        item.photoURL ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                    }}
                    style={styles.avatar}
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.points}>{item.points} points</Text>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#FAFAFA" },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },

  wrapper: {
    marginBottom: 15,
  },

  card: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },

  topCard: {
    elevation: 7,
    shadowOpacity: 0.25,
  },

  rank: {
    fontSize: 24,
    width: 45,
    textAlign: "center",
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
    marginRight: 12,
  },

  avatarLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 12,
  },

  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  points: {
    fontSize: 15,
    color: "#555",
  },

  nameTop: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4A3500",
  },
  pointsTop: {
    fontSize: 16,
    color: "#6A5200",
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
