// app/_layout.js
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Slot, useRouter } from "expo-router";
import Drawer from "expo-router/drawer";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase.ts";

function CustomDrawerContent(props) {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState(null);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (e) {
      console.warn("Logout failed", e);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setProfileData(snap.data());
      }
    };
    fetchProfile();
  }, [user]);

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, justifyContent: "space-between" }}
      style={{ backgroundColor: "#fff" }}
    >
      <View>
        {/* Profile Section */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 15,
            borderBottomColor: "#ccc",
            borderBottomWidth: 1,
          }}
          onPress={() => router.push("/profile")}
        >
          <Image
            source={{
              uri:
                profileData?.photoURL ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            }}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              marginRight: 10,
              backgroundColor: "#eee",
            }}
          />
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            {profileData?.name || "Your Profile"}
          </Text>
        </TouchableOpacity>

        {/* Drawer Options */}
        <DrawerItem label="Dashboard" onPress={() => router.push("/")} />
        <DrawerItem label="I Need Help" onPress={() => router.push("/needHelp")} />
        <DrawerItem label="Show Requests" onPress={() => router.push("/showRequests")} />
      </View>

      <View style={{ marginBottom: 20 }}>
        <DrawerItem
          label="Logout"
          labelStyle={{ color: "white", fontWeight: "600" }}
          style={{
            backgroundColor: "tomato",
            borderRadius: 8,
            marginHorizontal: 10,
          }}
          onPress={handleLogout}
        />
      </View>
    </DrawerContentScrollView>
  );
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/login");
      else if (!user.emailVerified) router.replace("/verify");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  if (user && user.emailVerified) {
    return (
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: "#1976d2" },
          headerTintColor: "#fff",
          drawerActiveTintColor: "#1976d2",
          drawerLabelStyle: { fontSize: 16 },
        }}
      >
        <Drawer.Screen name="index" options={{ title: "Dashboard" }} />
        <Drawer.Screen name="needHelp" options={{ title: "I Need Help" }} />
        <Drawer.Screen name="showRequests" options={{ title: "Show Requests" }} />
        <Drawer.Screen name="profile" options={{ title: "Profile" }} />
      </Drawer>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProtectedLayout />
    </AuthProvider>
  );
}
