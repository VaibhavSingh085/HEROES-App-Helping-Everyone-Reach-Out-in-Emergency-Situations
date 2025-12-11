// app/verifyUser.js
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";

// --------------------------------------------------------
// SAME ImgBB FUNCTION USED IN COMPLAINTS
// --------------------------------------------------------
const uploadToImgBB = async (base64) => {
  const apiKey = "a6079285c61ca7672e18094a9b84f30a";
  try {
    const formData = new FormData();
    formData.append("image", base64);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      {
        method: "POST",
        body: formData
      }
    );

    const json = await response.json();
    if (json.success && json.data?.url) return json.data.url;

    console.warn("ImgBB upload failed:", json);
    return null;
  } catch (err) {
    console.error("ImgBB upload error:", err);
    return null;
  }
};

export default function VerifyUser() {
  const router = useRouter();
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.displayName || "");
  const [profession, setProfession] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------------
  // Create missing fields for older accounts
  // --------------------------------------------------------
  useEffect(() => {
    const ensureUserFields = async () => {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || "",
          email: user.email,
          points: 0,
          isVerified: false,
          verificationAwarded: false
        });
      } else {
        const data = snap.data();
        const updateObj = {};

        if (data.isVerified === undefined) updateObj.isVerified = false;
        if (data.verificationAwarded === undefined)
          updateObj.verificationAwarded = false;

        if (Object.keys(updateObj).length > 0) updateDoc(userRef, updateObj);
      }
    };

    ensureUserFields();
  }, [user]);

  // --------------------------------------------------------
  // PICK IMAGE
  // --------------------------------------------------------
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted)
      return Alert.alert("Permission Required", "Please allow gallery access.");

    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.6,
      allowsEditing: true
    });

    if (!result.canceled) setImage(result.assets[0]);
  };

  // --------------------------------------------------------
  // SUBMIT VERIFICATION REQUEST
  // --------------------------------------------------------
  const handleSubmit = async () => {
    if (!fullName || !profession || !idNumber)
      return Alert.alert("Missing info", "Please fill all required fields.");

    setLoading(true);

    try {
      let proofUrl = null;
      if (image?.base64) proofUrl = await uploadToImgBB(image.base64);

      await addDoc(collection(db, "verificationRequests"), {
        userId: user.uid,
        email: user.email,
        fullName,
        profession,
        idNumber,
        notes,
        proofUrl,
        createdAt: new Date().toISOString(),
        status: "none"
      });

      Alert.alert(
        "Submitted",
        "Your verification request has been submitted."
      );

      router.replace("/profile");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to submit verification request.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------
  // UI
  // --------------------------------------------------------
  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
        Apply for Verified Badge 🎖️
      </Text>

      <Text>Full Name</Text>
      <TextInput value={fullName} onChangeText={setFullName} style={input} />

      <Text>Profession</Text>
      <TextInput value={profession} onChangeText={setProfession} style={input} />

      <Text>ID / License Number</Text>
      <TextInput value={idNumber} onChangeText={setIdNumber} style={input} />

      <Text>Notes (optional)</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        multiline
        style={[input, { height: 80 }]}
      />

      <Pressable onPress={pickImage} style={btnBlue}>
        <Text style={{ color: "white", textAlign: "center" }}>
          {image ? "Change Proof Image" : "Upload Proof Image"}
        </Text>
      </Pressable>

      {image?.uri && (
        <Image
          source={{ uri: image.uri }}
          style={{
            width: "100%",
            height: 200,
            marginTop: 12,
            borderRadius: 8
          }}
        />
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        style={[btnGreen, { opacity: loading ? 0.7 : 1 }]}
      >
        <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>
          {loading ? "Submitting..." : "Submit Verification Request"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const input = {
  borderWidth: 1,
  borderColor: "#ccc",
  padding: 10,
  borderRadius: 8,
  marginBottom: 12
};

const btnBlue = {
  backgroundColor: "#1976d2",
  padding: 12,
  borderRadius: 8,
  marginTop: 10
};

const btnGreen = {
  backgroundColor: "green",
  padding: 14,
  borderRadius: 8,
  marginTop: 20
};
