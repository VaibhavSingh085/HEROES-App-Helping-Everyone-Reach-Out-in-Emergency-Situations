// app/profile.js
import * as ImagePicker from "expo-image-picker";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../lib/firebase";

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [points, setPoints] = useState(0);
  const [image, setImage] = useState(user?.photoURL || null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch Firestore user data (points + notifications)
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setPoints(data.points || 0);
          setNotifications(data.notifications || []);
          if (data.name && !name) setName(data.name);
          if (data.photoURL && !image) setImage(data.photoURL);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchUserData();
  }, [user]);

  // ✅ Pick image from gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      const selected = result.assets[0];
      setImage(selected.uri);
      await uploadImage(selected.base64);
    }
  };

  // ✅ Upload image to ImgBB
  const uploadImage = async (base64Data) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=a6079285c61ca7672e18094a9b84f30a`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `image=${encodeURIComponent(base64Data)}`,
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error("Image upload failed");

      const imageUrl = data.data.url;

      await updateProfile(auth.currentUser, {
        photoURL: imageUrl,
        displayName: name,
      });

      await updateDoc(doc(db, "users", user.uid), {
        name,
        photoURL: imageUrl,
      });

      setImage(imageUrl);
      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save updated name
  const handleSave = async () => {
    try {
      setLoading(true);
      await updateProfile(auth.currentUser, { displayName: name });
      await updateDoc(doc(db, "users", user.uid), { name });
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#f5f6fa",
      }}
    >
      <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20 }}>
        My Profile
      </Text>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={{
            uri:
              image ||
              "https://www.pngall.com/wp-content/uploads/5/Profile-PNG-File.png",
          }}
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            marginBottom: 15,
            borderWidth: 2,
            borderColor: "#1976d2",
          }}
        />
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" />
      ) : (
        <>
          <TouchableOpacity
            onPress={() => uploadImage(image)}
            style={{
              backgroundColor: "#1976d2",
              padding: 10,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Save New Picture
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TextInput
        placeholder="Your Name"
        value={name}
        onChangeText={setName}
        style={{
          width: "100%",
          padding: 12,
          backgroundColor: "white",
          borderRadius: 8,
          borderColor: "#ccc",
          borderWidth: 1,
          marginBottom: 15,
        }}
      />

      <TouchableOpacity
        onPress={handleSave}
        style={{
          backgroundColor: "#4CAF50",
          padding: 12,
          borderRadius: 8,
          width: "100%",
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Save Changes
        </Text>
      </TouchableOpacity>

      {/* Points Section */}
      <View
        style={{
          backgroundColor: "#fff",
          padding: 16,
          borderRadius: 10,
          width: "100%",
          alignItems: "center",
          marginBottom: 25,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 5 }}>
          🌟 Points: {points}
        </Text>
        <Text style={{ color: "#666" }}>Keep helping to earn more!</Text>
      </View>

      {/* ✅ Notifications Section */}
      <View
        style={{
          width: "100%",
          backgroundColor: "#fff",
          borderRadius: 10,
          padding: 16,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
          🔔 Notifications
        </Text>

        {notifications.length === 0 ? (
          <Text style={{ color: "#777" }}>
            No notifications yet. Start helping to earn rewards!
          </Text>
        ) : (
          <FlatList
            data={[...notifications].reverse()} // newest first
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: "#f0f4ff",
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 15, color: "#333" }}>
                  {item.message}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#777",
                    marginTop: 4,
                    textAlign: "right",
                  }}
                >
                  {new Date(item.timestamp).toLocaleString()}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}
