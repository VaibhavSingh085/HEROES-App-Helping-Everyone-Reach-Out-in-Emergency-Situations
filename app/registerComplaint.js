// app/registerComplaint.js
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";

const uploadToImgBB = async (base64) => {
  const apiKey = "a6079285c61ca7672e18094a9b84f30a"; // replace with your real ImgBB API key
  try {
    const formData = new FormData();
    formData.append("image", base64);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });

    const json = await response.json();
    if (json.success && json.data && json.data.url) {
      return json.data.url;
    } else {
      console.warn("ImgBB upload failed:", json);
      return null;
    }
  } catch (err) {
    console.error("Error uploading to ImgBB:", err);
    return null;
  }
};

export default function RegisterComplaint() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Title is required.");
      return;
    }

    if (title.length > 120) {
      Alert.alert("Error", "Title must be less than 120 characters.");
      return;
    }

    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required.");
        setLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});

      let imageUrl = null;
      if (image && image.base64) {
        imageUrl = await uploadToImgBB(image.base64);
      }

      const docRef = await addDoc(collection(db, "complaints"), {
        userId: user.uid,
        name: user.displayName || "Anonymous",
        contactNumber: contactNumber || null,
        title,
        description: description.trim() || null,
        imageUrl: imageUrl || null,
        location: {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        },
        status: "open",
        helpers: [],
        createdAt: new Date(),
      });

      Alert.alert("Success", `Complaint registered!\nID: ${docRef.id}`, [
        { text: "OK", onPress: () => router.push("/") },
      ]);

      setTitle("");
      setContactNumber("");
      setDescription("");
      setImage(null);
    } catch (err) {
      console.error("Error adding complaint:", err);
      Alert.alert("Error", "Failed to register complaint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>Register Complaint</Text>

      <TextInput
        placeholder="Enter title (required, max 120 chars)"
        placeholderTextColor="#000"
        value={title}
        onChangeText={(text) => setTitle(text.slice(0, 120))}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          color: "#000",
        }}
      />

      <TextInput
        placeholder="Enter contact number (optional)"
        placeholderTextColor="#000"
        value={contactNumber}
        onChangeText={setContactNumber}
        keyboardType="phone-pad"
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          color: "#000",
        }}
      />

      <TextInput
        placeholder="Enter description (optional)"
        placeholderTextColor="#000"
        value={description}
        onChangeText={setDescription}
        multiline
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          height: 100,
          color: "#000",
        }}
      />

      <Pressable
        onPress={pickImage}
        style={{
          backgroundColor: "#1976d2",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          {image ? "Change Image" : "Pick an Image"}
        </Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" />
      ) : (
        <Pressable
          onPress={handleSubmit}
          style={{
            backgroundColor: "green",
            padding: 14,
            borderRadius: 8,
            marginTop: 10,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
            Submit Complaint
          </Text>
        </Pressable>
      )}
    </View>
  );
}
