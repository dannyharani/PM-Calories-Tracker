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

/**
 * Calculates age from date of birth string (YYYY-MM-DD format).
 * Accounts for whether birthday has occurred this year.
 * 
 * @param dob - Date of birth in YYYY-MM-DD format
 * @returns Age in years, or null if invalid date
 */
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
    // Adjust age if birthday hasn't occurred yet this year
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
}

/**
 * Profile settings screen component - Allows users to manage their profile and nutrition goals.
 * 
 * Features:
 * - Personal information (name, gender, height, weight, date of birth)
 * - Fitness goal selection (maintain/lose/gain weight, build muscle, lose fat)
 * - Automatic calorie goal calculation using Mifflin-St Jeor equation
 * - BMR (Basal Metabolic Rate) calculation with activity multiplier
 * - Goal-based calorie adjustments (+/- 250-500 calories)
 * - Creates or updates user profile in database
 * 
 * Calorie Calculation:
 * - BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age + gender_offset
 * - Maintenance = BMR * 1.2 (sedentary activity level)
 * - Adjusted based on goal (e.g., -500 for weight loss, +500 for weight gain)
 */
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

    /**
     * Recalculates calorie goal whenever user inputs change.
     * 
     * Uses Mifflin-St Jeor equation for BMR:
     * - Men: BMR = 10 * weight + 6.25 * height - 5 * age + 5
     * - Women: BMR = 10 * weight + 6.25 * height - 5 * age - 161
     * 
     * Maintenance calories = BMR * 1.2 (sedentary activity level)
     * 
     * Goal adjustments:
     * - LOSE_WEIGHT: -500 calories (1 lb/week loss)
     * - GAIN_WEIGHT: +500 calories (1 lb/week gain)
     * - BUILD_MUSCLE: +250 calories (lean bulk)
     * - LOSE_FAT: -300 calories (moderate deficit)
     * - MAINTAIN_WEIGHT: no adjustment
     */
    useEffect(() => {
        const w = parseFloat(weight);
        const h = parseFloat(height);
        const age = dobToAge(dob);
        if (!w || !h || age == null) {
            setCalorieGoal(null);
            return;
        }
        // Calculate BMR using Mifflin-St Jeor equation
        let bmr = 10 * w + 6.25 * h - 5 * age;
        if (gender?.toLowerCase() === "male" || gender?.toLowerCase() === "m")
            bmr += 5; // Male adjustment
        else bmr -= 161; // Female adjustment

        // Calculate maintenance calories (BMR * activity multiplier)
        const maintenance = Math.round(bmr * 1.2); // 1.2 = sedentary

        // Adjust calories based on fitness goal
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

    // Load existing user profile on mount, or prefill from Cognito attributes
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

                // Try to fetch existing user profile from database
                const client = await getGraphQLClient();
                const resp: any = await client.graphql({
                    query: getUserQuery,
                    variables: { id },
                    authMode: "userPool",
                });
                const u = resp?.data?.getUser;
                if (u && mounted) {
                    // Profile exists - populate form with existing data
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
                    // No profile exists - prefill from Cognito attributes if available
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

    // Keep selectedDate in sync when dob changes programmatically
    useEffect(() => {
        if (dob) {
            const d = parseDobToDate(dob);
            setSelectedDate(d);
        }
    }, [dob]);

    /**
     * Saves profile changes to the database.
     * Creates new profile if none exists, otherwise updates existing profile.
     * 
     * Flow:
     * 1. Get current user ID
     * 2. Prepare input with all profile fields
     * 3. Calculate age from date of birth
     * 4. Use createUser or updateUser mutation based on isExistingUser flag
     * 5. On success, show confirmation and navigate back
     */
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

            // Prepare profile data
            const input: any = {
                id,
                firstName: firstName || null,
                lastName: lastName || null,
                gender: gender || null,
                height: height ? parseFloat(height) : null,
                weight: weight ? parseFloat(weight) : null,
                dob: dob || null,
                age: dobToAge(dob), // Calculate age from DOB
                goal: goal || null,
                calorieGoal: calorieGoal || null,
            };
            const client = await getGraphQLClient();
            // Use create or update mutation based on whether profile exists
            const mutationToUse = isExistingUser
                ? updateUserMutation
                : createUserMutation;
            // Include email on create to satisfy schema requirements
            if (!isExistingUser) {
                try {
                    const attrs = await fetchUserAttributes();
                    (input as any).email = attrs?.email || null;
                } catch { }
            }
            const resp: any = await client.graphql({
                query: mutationToUse,
                variables: { input },
                authMode: "userPool",
            });
            if (resp.errors)
                throw new Error(resp.errors[0]?.message || "Update failed");
            setStatusMsg("Profile updated");
            // Give quick feedback then navigate back to previous screen
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
