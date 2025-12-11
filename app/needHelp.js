// app/needHelp.js
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// 🔹 Updated categories (Removed Fire, added Other Request)
const categories = [
  "🚑 Medical Emergency",
  "🚨 Theft or Crime In Progress",
  "👶 Missing Person Alert",
  "🍽️ Hunger / No Food",
  "🩹 First Aid Support",
  "🐶 Injured Animal Rescue",
  "🐾 Lost Pet Assistance",
  "📝 Other Request",
];

export default function NeedHelp() {
  const [selected, setSelected] = useState(null);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>WHAT HELP DO YOU NEED?</Text>

      {categories.map((cat, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.option, selected === i && styles.selected]}
          onPress={() => setSelected(i)}
        >
          <Text style={styles.optionText}>{cat}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.button, selected === null && { opacity: 0.5 }]}
        disabled={selected === null}
        onPress={() => router.push("/registerComplaint")}
      >
        <Text style={styles.buttonText}>Request!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, justifyContent: "center" },

  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#000",
  },

  option: {
    padding: 15,
    marginVertical: 6,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  selected: {
    backgroundColor: "#e0e0e0",
    borderColor: "#888",
  },

  optionText: { color: "#000", fontSize: 16 },

  button: {
    backgroundColor: "#d32f2f",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
