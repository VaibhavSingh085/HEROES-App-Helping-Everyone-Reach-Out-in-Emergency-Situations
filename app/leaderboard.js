import { LinearGradient } from "expo-linear-gradient";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { db } from "../lib/firebase";

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔥 LIVE Leaderboard
    const q = query(collection(db, "users"), orderBy("points", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(data);
        setLoading(false);
      },
      (err) => {
        console.error("Leaderboard error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1b5e20" />
        <Text style={{ marginTop: 10 }}>Loading leaderboard...</Text>
      </View>
    );
  }

  const top3 = users.slice(0, 3);
  const restUsers = users.slice(3);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require("./img.png")} style={styles.logo} />
        <Text style={styles.appTitle}>HEROES App</Text>
        <Text style={styles.tagline}>
          Helping Everyone Reach Out in Emergency Situations
        </Text>
      </View>

      <Text style={styles.title}>🏆 Top Leaders</Text>

      {/* Podium */}
      {top3.length > 0 && (
        <View style={styles.podiumContainer}>
          {/* 2nd */}
          {top3[1] && (
            <View style={styles.podiumSecond}>
              <LinearGradient
                colors={["#c0c0c0", "#e8e8e8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.podiumCard}
              >
                <Image
                  source={{
                    uri:
                      top3[1].photoURL ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                  }}
                  style={styles.podiumAvatar}
                />
                <Text style={styles.podiumRank}>🥈</Text>
                <Text style={styles.podiumName}>{top3[1].name}</Text>
                <Text style={styles.podiumPoints}>{top3[1].points}</Text>
                <Text style={styles.podiumLabel}>2nd</Text>
              </LinearGradient>
            </View>
          )}

          {/* 1st */}
          {top3[0] && (
            <View style={styles.podiumFirst}>
              <LinearGradient
                colors={["#ffd700", "#ffed4e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.podiumCardFirst}
              >
                <Image
                  source={{
                    uri:
                      top3[0].photoURL ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                  }}
                  style={styles.podiumAvatarLarge}
                />
                <Text style={styles.podiumRankFirst}>🥇</Text>
                <Text style={styles.podiumNameFirst}>{top3[0].name}</Text>
                <Text style={styles.podiumPointsFirst}>{top3[0].points}</Text>
                <Text style={styles.podiumLabelFirst}>1st</Text>
              </LinearGradient>
            </View>
          )}

          {/* 3rd */}
          {top3[2] && (
            <View style={styles.podiumThird}>
              <LinearGradient
                colors={["#cd7f32", "#e6b8a2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.podiumCard}
              >
                <Image
                  source={{
                    uri:
                      top3[2].photoURL ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                  }}
                  style={styles.podiumAvatar}
                />
                <Text style={styles.podiumRank}>🥉</Text>
                <Text style={styles.podiumName}>{top3[2].name}</Text>
                <Text style={styles.podiumPoints}>{top3[2].points}</Text>
                <Text style={styles.podiumLabel}>3rd</Text>
              </LinearGradient>
            </View>
          )}
        </View>
      )}

      {/* Other rankings */}
      {restUsers.length > 0 && (
        <View style={styles.restContainer}>
          <Text style={styles.restTitle}>Other Rankings</Text>
          <FlatList
            data={restUsers}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <View style={styles.rankCard}>
                <Text style={styles.rankNumber}>#{index + 4}</Text>

                <Image
                  source={{
                    uri:
                      item.photoURL ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                  }}
                  style={styles.rankAvatar}
                />

                <View style={styles.rankInfo}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.rankName}>{item.name}</Text>
                    {item.isVerified && (
                      <Text style={{ marginLeft: 6, fontSize: 14 }}>🎖️</Text>
                    )}
                  </View>
                  <Text style={styles.rankPoints}>{item.points} points</Text>
                </View>
              </View>
            )}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7fb", paddingBottom: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { alignItems: "center", paddingVertical: 12, paddingHorizontal: 20 },
  logo: { width: 72, height: 72, marginBottom: 6 },
  appTitle: { fontSize: 18, fontWeight: "800", color: "#1b5e20" },
  tagline: { fontSize: 13, color: "#555", textAlign: "center", marginBottom: 4 },

  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
    color: "#1b5e20",
    paddingHorizontal: 20,
  },

  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },

  podiumSecond: { flex: 1, justifyContent: "flex-end" },
  podiumFirst: { flex: 1.2, justifyContent: "flex-end" },
  podiumThird: { flex: 1, justifyContent: "flex-end" },

  podiumCard: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 12,
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    minHeight: 180,
  },
  podiumCardFirst: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 14,
    borderRadius: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    minHeight: 220,
  },

  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: "#fff",
  },
  podiumAvatarLarge: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    marginBottom: 10,
    borderWidth: 4,
    borderColor: "#fff",
  },

  podiumRank: { fontSize: 28, marginBottom: 4 },
  podiumRankFirst: { fontSize: 32, marginBottom: 6 },

  podiumName: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  podiumNameFirst: { fontSize: 17, fontWeight: "800", marginBottom: 4 },

  podiumPoints: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  podiumPointsFirst: { fontSize: 15, fontWeight: "700", marginBottom: 8 },

  podiumLabel: { fontSize: 12, fontWeight: "700", opacity: 0.8 },
  podiumLabelFirst: { fontSize: 14, fontWeight: "800", opacity: 0.85 },

  restContainer: { paddingHorizontal: 20 },
  restTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1b5e20",
  },

  rankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  rankNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1b5e20",
    marginRight: 10,
    minWidth: 28,
  },

  rankAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },

  rankInfo: { flex: 1 },

  rankName: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  rankPoints: { fontSize: 14, color: "#666", marginTop: 2 },
});
