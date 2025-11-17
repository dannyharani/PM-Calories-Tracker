import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { getGraphQLClient } from "@/src/amplifyClient";
import {
  createUser as createUserMutation,
  updateUser as updateUserMutation,
} from "@/src/graphql/mutations";
import { getUser as getUserQuery } from "@/src/graphql/queries";
import DateTimePicker from "@react-native-community/datetimepicker";
import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Button,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// Utility: compute age from DOB (YYYY-MM-DD)
function dobToAge(dob?: string | null): number | null {
    if (!dob) return null;
    const parts = dob.split("-");
    if (parts.length !== 3) return null;
    const d = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
}

export default function ProfileSettings() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [statusMsg, setStatusMsg] = useState<string>("");
    const [isExistingUser, setIsExistingUser] = useState<boolean>(false);

    // Editable fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [gender, setGender] = useState("");
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [dob, setDob] = useState(""); // stored as YYYY-MM-DD
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        undefined
    );
    const [goal, setGoal] = useState<string>("MAINTAIN_WEIGHT");
    const [calorieGoal, setCalorieGoal] = useState<number | null>(null);

    const textColor = useThemeColor({}, "text");
    const borderColor = useThemeColor({}, "icon");

    // Recalculate calorie goal when inputs or goal change
    useEffect(() => {
        const w = parseFloat(weight);
        const h = parseFloat(height);
        const age = dobToAge(dob);
        if (!w || !h || age == null) {
            setCalorieGoal(null);
            return;
        }
        let bmr = 10 * w + 6.25 * h - 5 * age;
        if (gender?.toLowerCase() === "male" || gender?.toLowerCase() === "m")
            bmr += 5;
        else bmr -= 161;
        const maintenance = Math.round(bmr * 1.2);
        switch (goal) {
            case "LOSE_WEIGHT":
                setCalorieGoal(maintenance - 500);
                break;
            case "GAIN_WEIGHT":
                setCalorieGoal(maintenance + 500);
                break;
            case "BUILD_MUSCLE":
                setCalorieGoal(maintenance + 250);
                break;
            case "LOSE_FAT":
                setCalorieGoal(maintenance - 300);
                break;
            default:
                setCalorieGoal(maintenance);
        }
    }, [weight, height, dob, gender, goal]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const current = await getCurrentUser();
                const id =
                    (current as any)?.userId ||
                    (current as any)?.attributes?.sub ||
                    (current as any)?.username;
                if (!id) throw new Error("No authenticated user");
                const client = await getGraphQLClient();
                const resp: any = await client.graphql({
                    query: getUserQuery,
                    variables: { id },
                    authMode: "userPool",
                });
                const u = resp?.data?.getUser;
                if (u && mounted) {
                    setIsExistingUser(true);
                    setFirstName(u.firstName || "");
                    setLastName(u.lastName || "");
                    setGender(u.gender || "");
                    setHeight(u.height ? String(u.height) : "");
                    setWeight(u.weight ? String(u.weight) : "");
                    setDob(u.dob || "");
                    setSelectedDate(u.dob ? parseDobToDate(u.dob) : undefined);
                    if (u.goal) setGoal(u.goal);
                    if (typeof u.calorieGoal === "number")
                        setCalorieGoal(u.calorieGoal);
                } else if (!u) {
                    // Attempt to prefill from attributes if profile missing
                    const attrs = await fetchUserAttributes();
                    setFirstName(attrs?.name || "");
                    setIsExistingUser(false);
                }
            } catch (e: any) {
                setErrorMsg(e?.message || "Failed to load profile.");
            } finally {
                mounted && setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // Keep selectedDate in sync when dob changes (in case it's changed programmatically)
    useEffect(() => {
        if (dob) {
            const d = parseDobToDate(dob);
            setSelectedDate(d);
        }
    }, [dob]);

    const onSave = async () => {
        setErrorMsg("");
        setStatusMsg("");
        setSaving(true);
        try {
            const user = await getCurrentUser();
            const id =
                (user as any)?.userId ||
                (user as any)?.attributes?.sub ||
                (user as any)?.username;
            if (!id) throw new Error("No authenticated user");
            const input: any = {
                id,
                firstName: firstName || null,
                lastName: lastName || null,
                gender: gender || null,
                height: height ? parseFloat(height) : null,
                weight: weight ? parseFloat(weight) : null,
                dob: dob || null,
                age: dobToAge(dob),
                goal: goal || null,
                calorieGoal: calorieGoal || null,
            };
            const client = await getGraphQLClient();
            const mutationToUse = isExistingUser
                ? updateUserMutation
                : createUserMutation;
            // include email on create to satisfy schema
            if (!isExistingUser) {
                try {
                    const attrs = await fetchUserAttributes();
                    (input as any).email = attrs?.email || null;
                } catch {}
            }
            const resp: any = await client.graphql({
                query: mutationToUse,
                variables: { input },
                authMode: "userPool",
            });
            if (resp.errors)
                throw new Error(resp.errors[0]?.message || "Update failed");
            setStatusMsg("Profile updated");
            // Give quick feedback then navigate back
            setTimeout(() => router.back(), 600);
        } catch (e: any) {
            setErrorMsg(e?.message || "Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const radio_color = useThemeColor({}, "tabIconSelected");
    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={styles.title}>Profile Settings</ThemedText>
                <ThemedText>Loading…</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.title}>Profile Settings</ThemedText>
            <KeyboardAvoidingView
                style={{ flex: 1, width: "100%" }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <TouchableWithoutFeedback
                    onPress={Keyboard.dismiss}
                    accessible={false}
                >
                    <ScrollView
                        style={{ width: "100%" }}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <ThemedText style={styles.label}>First Name</ThemedText>
                        <TextInput
                            value={firstName}
                            onChangeText={setFirstName}
                            style={[
                                styles.input,
                                { color: textColor, borderColor },
                            ]}
                            placeholderTextColor={borderColor}
                        />

                        <ThemedText style={styles.label}>Last Name</ThemedText>
                        <TextInput
                            value={lastName}
                            onChangeText={setLastName}
                            style={[
                                styles.input,
                                { color: textColor, borderColor },
                            ]}
                            placeholderTextColor={borderColor}
                        />

                        <ThemedText style={styles.label}>Gender</ThemedText>
                        <TextInput
                            value={gender}
                            onChangeText={setGender}
                            style={[
                                styles.input,
                                { color: textColor, borderColor },
                            ]}
                            placeholder="male / female / other"
                            placeholderTextColor={borderColor}
                        />

                        <ThemedText style={styles.label}>
                            Height (cm)
                        </ThemedText>
                        <TextInput
                            value={height}
                            onChangeText={setHeight}
                            keyboardType="numeric"
                            style={[
                                styles.input,
                                { color: textColor, borderColor },
                            ]}
                            placeholderTextColor={borderColor}
                        />

                        <ThemedText style={styles.label}>
                            Weight (kg)
                        </ThemedText>
                        <TextInput
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="numeric"
                            style={[
                                styles.input,
                                { color: textColor, borderColor },
                            ]}
                            placeholderTextColor={borderColor}
                        />

                        <ThemedText style={styles.label}>
                            Date of Birth
                        </ThemedText>
                        <TouchableOpacity
                            style={[
                                styles.input,
                                { justifyContent: "center", borderColor },
                            ]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text
                                style={{
                                    color: selectedDate
                                        ? textColor
                                        : borderColor,
                                }}
                            >
                                {selectedDate
                                    ? formatDateToYMD(selectedDate)
                                    : "Select date of birth"}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate || new Date(1990, 0, 1)}
                                mode="date"
                                maximumDate={new Date()}
                                display={
                                    Platform.OS === "ios"
                                        ? "spinner"
                                        : "default"
                                }
                                onChange={(event, date) => {
                                    // on Android the picker returns a dismissed event with date undefined
                                    if (Platform.OS === "android")
                                        setShowDatePicker(false);
                                    if (date) {
                                        setSelectedDate(date);
                                        setDob(formatDateToYMD(date));
                                    }
                                }}
                            />
                        )}

                        <ThemedText style={styles.label}>Goal</ThemedText>
                        <View style={styles.radioGroup}>
                            {[
                                {
                                    label: "Maintain weight",
                                    value: "MAINTAIN_WEIGHT",
                                },
                                { label: "Lose weight", value: "LOSE_WEIGHT" },
                                { label: "Gain weight", value: "GAIN_WEIGHT" },
                                {
                                    label: "Build muscle",
                                    value: "BUILD_MUSCLE",
                                },
                                { label: "Lose fat", value: "LOSE_FAT" },
                            ].map((g) => (
                                <TouchableOpacity
                                    key={g.value}
                                    style={styles.radioItem}
                                    onPress={() => setGoal(g.value)}
                                    accessibilityRole="radio"
                                    accessibilityState={{
                                        selected: goal === g.value,
                                    }}
                                >
                                    <View
                                        style={[
                                            styles.radioCircle,
                                            { borderColor },
                                        ]}
                                    >
                                        {goal === g.value ? (
                                            <View
                                                style={[
                                                    styles.radioDot,
                                                    {
                                                        backgroundColor:
                                                            radio_color,
                                                    },
                                                ]}
                                            />
                                        ) : null}
                                    </View>
                                    <ThemedText style={styles.radioLabel}>
                                        {g.label}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {typeof calorieGoal === "number" ? (
                            <ThemedText style={{ marginTop: 8 }}>
                                Daily calorie target: {calorieGoal} kcal
                            </ThemedText>
                        ) : null}

                        {errorMsg ? (
                            <ThemedText style={styles.error}>
                                {errorMsg}
                            </ThemedText>
                        ) : null}
                        {statusMsg ? (
                            <ThemedText style={styles.status}>
                                {statusMsg}
                            </ThemedText>
                        ) : null}

                        <View style={styles.buttonRow}>
                            <Button
                                title={saving ? "Saving…" : "Save Changes"}
                                onPress={onSave}
                                disabled={saving}
                            />
                        </View>
                        <View style={styles.buttonRow}>
                            <Button
                                title="Cancel"
                                color="#666"
                                onPress={() => router.back()}
                                disabled={saving}
                            />
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: {
        fontSize: 22,
        fontWeight: "600",
        marginBottom: 12,
        textAlign: "center",
    },
    label: { marginTop: 12, marginBottom: 4, fontWeight: "500" },
    input: {
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    radioGroup: { marginTop: 6 },
    radioItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 12,
        marginBottom: 8,
    },
    radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
    radioDot: { width: 8, height: 8, borderRadius: 14 },
    radioLabel: { fontSize: 14 },
    buttonRow: { marginTop: 14 },
    error: { color: "#e74c3c", marginTop: 10 },
    status: { color: "#2e8b57", marginTop: 10 },
});

// Helpers for date parsing/formatting (YYYY-MM-DD)
function formatDateToYMD(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function parseDobToDate(dob?: string | null): Date | undefined {
    if (!dob) return undefined;
    const parts = dob.split("-");
    if (parts.length !== 3) return undefined;
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    const dt = new Date(y, m, day);
    if (isNaN(dt.getTime())) return undefined;
    return dt;
}
