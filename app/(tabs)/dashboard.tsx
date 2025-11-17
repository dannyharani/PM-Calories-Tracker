import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
// Avatar uses ThemedText initial; IconSymbol import removed
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { getGraphQLClient } from "@/src/amplifyClient";
import { deleteUser as deleteUserMutation } from "@/src/graphql/mutations";
import { getUser } from "@/src/graphql/queries";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import {
    deleteUser as deleteUserAuth,
    getCurrentUser,
    signOut,
} from "aws-amplify/auth";
import { getUrl } from 'aws-amplify/storage';
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Button,
    Easing,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { showAlert, showConfirm } from "../../src/utils/alert";
import { isStorageConfigured } from '../../src/utils/storage';

// GraphQL client is loaded lazily when needed to ensure Amplify is configured first

export default function DashboardScreen() {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [expandedDaily, setExpandedDaily] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const menuBg = useThemeColor({}, "background");
    const menuBorder = useThemeColor({}, "icon");
    const iconColor = useThemeColor({}, "icon");
    const colorScheme = useColorScheme();
    const panelBg = useThemeColor({}, "background");
    const panelBorder = useThemeColor({}, "icon");
    const progressBg = useThemeColor({ light: '#f0f0f0', dark: '#1f1f1f' }, 'background');
    const textColor = useThemeColor({}, 'text');
    const overlayColor =
        colorScheme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)";
    const [firstName, setFirstName] = useState<string | null>(null);
    const [todayCalories, setTodayCalories] = useState<number>(0);
    const [todayProtein, setTodayProtein] = useState<number>(0);
    const [todayCarbs, setTodayCarbs] = useState<number>(0);
    const [todayFat, setTodayFat] = useState<number>(0);
    const [calorieGoal, setCalorieGoal] = useState<number | null>(null);
    const [macroGoals, setMacroGoals] = useState<{
        protein: number;
        carbs: number;
        fat: number;
    } | null>(null);
    const [mealsToday, setMealsToday] = useState<any[]>([]);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const router = useRouter();
    const dateInputRef = useRef<HTMLInputElement | null>(null);
    // Animated expansion for the macros area
    const expandAnim = useRef(new Animated.Value(0)).current;
    const [macroContentHeight, setMacroContentHeight] = useState(0);
    const macroMeasured = useRef(false);

    // Helpers to format dates for HTML date inputs and parse them as local dates
    const formatDateForInput = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${dd}`;
    };

    const parseDateFromInput = (s: string) => {
        // s is in YYYY-MM-DD; construct a local Date to avoid UTC parsing issues
        const parts = s.split("-").map((p) => parseInt(p, 10));
        if (parts.length !== 3) return new Date(s);
        return new Date(parts[0], parts[1] - 1, parts[2]);
    };

    const formatDateShort = (d: Date) => {
        try {
            return d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } catch {
            return formatDateForInput(d);
        }
    };
    const fetchUser = useCallback(async () => {
        let mounted = true;
        try {
            const cognitoUser: any = await getCurrentUser();
            const id =
                cognitoUser?.userId ||
                cognitoUser?.attributes?.sub ||
                cognitoUser?.username;

            if (!id) {
                router.push("/auth/sign-in");
                return;
            }

            setUserId(id);

            const client = await getGraphQLClient();
            const result: any = await client.graphql({
                query: getUser,
                variables: { id },
                authMode: "userPool",
            });

            const userProfile = result.data.getUser;

            if (mounted) {
                // Set the name!
                if (userProfile && userProfile.firstName) {
                    setFirstName(userProfile.firstName);
                } else {
                    setFirstName(
                        cognitoUser.username ||
                            cognitoUser.attributes?.email ||
                            null
                    );
                }

                const cals = userProfile?.calorieGoal ?? null;
                setCalorieGoal(cals);
                if (cals) {
                    setMacroGoals({
                        protein: Math.round((0.3 * cals) / 4),
                        carbs: Math.round((0.4 * cals) / 4),
                        fat: Math.round((0.3 * cals) / 9),
                    });
                } else {
                    setMacroGoals(null);
                }
            }
        } catch (e) {
            router.push("/auth/sign-in");
        }
        // mark unmounted
        mounted = false;
    }, [router]);

    useEffect(() => {
        fetchUser();
        return () => {};
    }, [fetchUser]);

    // animate when expandedDaily changes
    useEffect(() => {
        Animated.timing(expandAnim, {
            toValue: expandedDaily ? 1 : 0,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [expandedDaily, expandAnim]);

    // Refetch when screen gains focus (e.g., returning from settings)
    useFocusEffect(
        useCallback(() => {
            fetchUser();
            return () => {};
        }, [fetchUser])
    );

    // Fetch meals whenever selectedDate or userId changes
    useEffect(() => {
        const fetchMealsForDate = async (dateToFetch: Date, id: string) => {
            try {
                const startOfDay = new Date(
                    dateToFetch.getFullYear(),
                    dateToFetch.getMonth(),
                    dateToFetch.getDate(),
                    0,
                    0,
                    0,
                    0
                );
                const endOfDay = new Date(
                    dateToFetch.getFullYear(),
                    dateToFetch.getMonth(),
                    dateToFetch.getDate(),
                    23,
                    59,
                    59,
                    999
                );

                const listMealsForDashboard = /* GraphQL */ `
                    query ListMeals($filter: ModelMealFilterInput) {
                        listMeals(filter: $filter) {
                            items {
                                id
                                mealType
                                calories
                                proteinGrams
                                carbsGrams
                                fatGrams
                                date
                                photoKey
                                user_estimated_calories
                                user_estimated_proteinGrams
                                user_estimated_carbsGrams
                                user_estimated_fatGrams
                            }
                        }
                    }
                `;

                const client = await getGraphQLClient();
                const mealsResult: any = await client.graphql({
                    query: listMealsForDashboard,
                    variables: {
                        filter: {
                            userMealsId: { eq: id },
                            date: {
                                between: [
                                    startOfDay.toISOString(),
                                    endOfDay.toISOString(),
                                ],
                            },
                        },
                    },
                    authMode: "userPool",
                });

                const items = mealsResult?.data?.listMeals?.items || [];
                // Resolve signed URLs for photos (if any) so thumbnails display
                const itemsWithUrls = await Promise.all(
                    (items as any[]).map(async (it) => {
                        if (it?.photoKey && isStorageConfigured()) {
                            try {
                                const result = await getUrl({ path: it.photoKey, options: { expiresIn: 3600 } });
                                // getUrl returns { url }
                                (it as any).photoUrl = String(result.url ?? result);
                            } catch (err) {
                                // leave item as-is on error
                                console.warn('Could not resolve photo URL for', it?.photoKey, err);
                            }
                        }
                        return it;
                    })
                );
                setMealsToday(itemsWithUrls);
                // Aggregate today's totals from fetched meals so the progress bars reflect real data
                const totalCalories = items.reduce(
                    (s: number, m: any) => s + (Number(m?.user_estimated_calories ?? m?.calories) || 0),
                    0
                );
                const totalProtein = items.reduce(
                    (s: number, m: any) => s + (Number(m?.user_estimated_proteinGrams ?? m?.proteinGrams) || 0),
                    0
                );
                const totalCarbs = items.reduce(
                    (s: number, m: any) => s + (Number(m?.user_estimated_carbsGrams ?? m?.carbsGrams) || 0),
                    0
                );
                const totalFat = items.reduce(
                    (s: number, m: any) => s + (Number(m?.user_estimated_fatGrams ?? m?.fatGrams) || 0),
                    0
                );
                setTodayCalories(totalCalories);
                setTodayProtein(totalProtein);
                setTodayCarbs(totalCarbs);
                setTodayFat(totalFat);
            } catch (err) {
                console.warn("Could not fetch meals for date", err);
                setMealsToday([]);
                setTodayCalories(0);
                setTodayProtein(0);
                setTodayCarbs(0);
                setTodayFat(0);
            }
        };

        if (userId) {
            fetchMealsForDate(selectedDate, userId);
        }
    }, [selectedDate, userId]);

    // Small presentational component for a meal row
    const MealRow = ({
        meal,
        onPress,
    }: {
        meal: any;
        onPress?: () => void;
    }) => {
        const dateStr = meal?.date || meal?.dateTime || meal?.createdAt || "";
        let timeLabel = "";
        try {
            const dt = new Date(dateStr);
            timeLabel = dt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            // ignore parse errors
        }

        // potential thumbnail fields (app may not store photos yet)
        const thumbUrl =
            meal?.photoUrl ||
            meal?.photo ||
            meal?.image ||
            meal?.imageUrl ||
            meal?.thumbnail ||
            meal?.s3Key ||
            null;

        return (
            <TouchableOpacity
                onPress={onPress}
                style={styles.mealRow}
                accessibilityRole="link"
            >
                <View style={styles.mealThumbWrapper}>
                    {thumbUrl ? (
                        <Image
                            source={{ uri: thumbUrl }}
                            style={styles.thumbnail}
                        />
                    ) : (
                        <View
                            style={[
                                styles.thumbnail,
                                {
                                    backgroundColor: "#f0f0f0",
                                    alignItems: "center",
                                    justifyContent: "center",
                                },
                            ]}
                        >
                            <ThemedText style={{ fontSize: 18 }}>🍴</ThemedText>
                        </View>
                    )}
                </View>

                <View style={styles.mealLeft}>
                    <ThemedText style={styles.mealTitle}>
                        {meal.mealType.slice(0, 1) + meal.mealType.toLowerCase().slice(1)}
                    </ThemedText>
                    <ThemedText style={styles.mealSubtitle}>
                        {meal.user_estimated_calories ?? meal.calories} Calories
                    </ThemedText>
                    
                    {typeof (meal.user_estimated_proteinGrams ?? meal.proteinGrams) === "number" ? (
                        <ThemedText
                            style={styles.mealMacros}
                        >{`Pro ${Math.round(meal.user_estimated_proteinGrams ?? meal.proteinGrams)}g · Carb ${Math.round(
                            (meal.user_estimated_carbsGrams ?? meal.carbsGrams) || 0
                        )}g · Fat ${Math.round(
                            (meal.user_estimated_fatGrams ?? meal.fatGrams) || 0
                        )}g`}</ThemedText>
                    ) : null}
                </View>

                <View style={{alignItems: 'flex-end'}}>
                    <IconSymbol
                        name="chevron.right"
                        size={18}
                        color={iconColor as string}
                    />
                    <ThemedText style={[styles.mealTime, {marginTop: 'auto'}]}>{timeLabel}</ThemedText>
                </View>
            </TouchableOpacity>
        );
    };

    const handleSignOut = async () => {
        setIsSigningOut(true);
        setStatusMessage("Signing out...");
        try {
            await signOut();
            router.replace("/auth/sign-in");
        } catch (error: any) {
            console.error("Error signing out: ", error);
            setStatusMessage(error?.message || "Failed to sign out");
            setIsSigningOut(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = await showConfirm(
            "Delete account",
            "This will permanently delete your account. Are you sure?"
        );
        if (!confirmed) return;

        setIsDeleting(true);
        setStatusMessage("Deleting account...");
        try {
            const { userId } = await getCurrentUser();
            if (!userId) {
                throw new Error("Could not find user ID.");
            }

            const client = await getGraphQLClient();
            await client.graphql({
                query: deleteUserMutation,
                variables: { input: { id: userId } },
                authMode: "userPool",
            });

            await deleteUserAuth();

            await showAlert(
                "Account deleted",
                "Your account has been deleted."
            );
            router.replace("/auth/sign-up");
        } catch (err: any) {
            console.error("Error deleting user", err);
            const msg = err?.message || "Failed to delete account";
            await showAlert("Error", msg);
            setStatusMessage(msg);
            setIsDeleting(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            {/* Overlay to dismiss user menu when tapping outside */}
            {showUserMenu ? (
                <Pressable
                    style={[
                        styles.menuOverlay,
                        { backgroundColor: overlayColor },
                    ]}
                    onPress={() => setShowUserMenu(false)}
                />
            ) : null}
            
            <View style={styles.headerRow}>
                <ThemedText type="title">Dashboard</ThemedText>
                <TouchableOpacity
                    onPress={() => setShowUserMenu((s) => !s)}
                    style={[
                        styles.userIcon,
                        { borderRadius: 40, width: 40, height: 40, borderStyle: "solid", borderWidth: 1, borderColor: "#adadadff", justifyContent: "center" },
                    ]}
                >
                    {/* Show an initial or fallback avatar so the icon is always visible and sizable */}
                    <ThemedText
                        style={{ fontSize: 16, color: iconColor as any, textAlign: "center" }}
                    >
                        {firstName ? firstName.charAt(0).toUpperCase() : "👤"}
                    </ThemedText>
                </TouchableOpacity>
            </View>
            {/* Date pill — shows short date and opens picker when pressed */}
            <ThemedText>
                {firstName
                    ? `Hello, ${firstName}`
                    : "Welcome to your dashboard!"}
            </ThemedText>
            <View style={styles.dateRow}>
                <TouchableOpacity
                    onPress={() => {
                        if (Platform.OS === "web") {
                            try {
                                dateInputRef.current?.focus?.();
                                dateInputRef.current?.click?.();
                            } catch {
                                // ignore
                            }
                        } else {
                            setShowDatePicker(true);
                        }
                    }}
                    style={[
                        styles.datePill,
                        {
                            borderColor: menuBorder as any,
                            backgroundColor: menuBg as any,
                        },
                    ]}
                >
                    <ThemedText style={styles.datePillText}>
                        {formatDateShort(selectedDate)}
                    </ThemedText>
                </TouchableOpacity>

                {/* hidden input used on web to trigger native date picker UI */}
                {Platform.OS === "web" ? (
                    <input
                        ref={dateInputRef}
                        type="date"
                        value={formatDateForInput(selectedDate)}
                        onChange={(e: any) =>
                            setSelectedDate(
                                e.target.value
                                    ? parseDateFromInput(e.target.value)
                                    : new Date()
                            )
                        }
                        // keep the input in the DOM but visually hidden so programmatic click can open the picker
                        style={{
                            position: "absolute",
                            opacity: 0,
                            width: 1,
                            height: 1,
                            left: -9999,
                        }}
                    />
                ) : null}
            </View>
            
            <ScrollView keyboardShouldPersistTaps="handled">
                <View
                    style={[
                        styles.dailyContainer,
                        { backgroundColor: panelBg, borderColor: panelBorder },
                    ]}
                >
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setExpandedDaily((s) => !s)}
                        style={styles.dailyHeader}
                    >
                        <ThemedText style={styles.dailyTitle}>
                            Today&apos;s targets
                        </ThemedText>
                        <Animated.View
                            style={{
                                transform: [
                                    {
                                        rotate: expandAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ["0deg", "180deg"],
                                        }),
                                    },
                                    {
                                        scale: expandAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 1.06],
                                        }),
                                    },
                                ],
                            }}
                        >
                            <IconSymbol
                                name={"chevron.down"}
                                size={18}
                                color={iconColor as string}
                            />
                        </Animated.View>
                    </TouchableOpacity>

                    {/* Calories progress (always visible) */}
                    <View style={{ marginTop: 8 }}>
                        <ThemedText style={styles.metricLabel}>
                            Calories
                        </ThemedText>
                        <View style={[styles.progressBar, { backgroundColor: progressBg as any }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: calorieGoal
                                            ? `${Math.min(
                                                  (todayCalories /
                                                      Math.max(
                                                          1,
                                                          calorieGoal
                                                      )) *
                                                      100,
                                                  100
                                              )}%`
                                            : "0%",
                                        backgroundColor:
                                            calorieGoal &&
                                            todayCalories > calorieGoal
                                                ? "#e74c3c"
                                                : "#4da6ff",
                                    },
                                ]}
                            />
                            <View
                                style={styles.progressOverlay}
                                pointerEvents="none"
                            >
                                <ThemedText
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    style={{
                                        color:
                                            calorieGoal &&
                                            Math.min(
                                                (todayCalories /
                                                    Math.max(1, calorieGoal)) *
                                                    100,
                                                100
                                            ) > 30
                                                ? "#fff"
                                                : textColor,
                                        fontWeight: "600",
                                        fontSize: 12,
                                    }}
                                >
                                    {`Goal: ${
                                        calorieGoal ?? "?"
                                    } cal • Remaining: ${
                                        calorieGoal
                                            ? Math.max(
                                                  0,
                                                  calorieGoal - todayCalories
                                              ) + " cal"
                                            : "?"
                                    } `}
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* hidden measurer for content height */}
                    <View
                        style={{
                            position: "absolute",
                            left: -9999,
                            top: 0,
                            opacity: 0,
                        }}
                        onLayout={(e) => {
                            if (!macroMeasured.current) {
                                const h = e.nativeEvent.layout.height || 0;
                                setMacroContentHeight(h);
                                macroMeasured.current = true;
                            }
                        }}
                    >
                        <View style={{ marginTop: 12 }}>
                            <ThemedText style={styles.metricLabel}>
                                Macros
                            </ThemedText>
                            <View style={styles.macroList}>
                                {[
                                    {
                                        key: "protein",
                                        label: "Protein",
                                        today: todayProtein,
                                        goal: macroGoals?.protein,
                                        unit: "g",
                                    },
                                    {
                                        key: "carbs",
                                        label: "Carbs",
                                        today: todayCarbs,
                                        goal: macroGoals?.carbs,
                                        unit: "g",
                                    },
                                    {
                                        key: "fat",
                                        label: "Fat",
                                        today: todayFat,
                                        goal: macroGoals?.fat,
                                        unit: "g",
                                    },
                                ].map((m) => {
                                    const g = m.goal as
                                        | number
                                        | undefined
                                        | null;
                                    const t = m.today as
                                        | number
                                        | undefined
                                        | null;
                                    const pct =
                                        g && g > 0
                                            ? Math.min(
                                                  ((t ?? 0) / g) * 100,
                                                  100
                                              )
                                            : 0;
                                    const over = g ? (t ?? 0) > g : false;
                                    return (
                                        <View
                                            key={m.key}
                                            style={{ marginTop: 8 }}
                                        >
                                            <ThemedText
                                                style={styles.macroLabel}
                                            >
                                                {m.label}
                                            </ThemedText>
                                            <View style={[styles.progressBar, { backgroundColor: progressBg as any }]}>
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        {
                                                            width: `${pct}%`,
                                                            backgroundColor:
                                                                over
                                                                    ? "#e74c3c"
                                                                    : "#4da6ff",
                                                        },
                                                    ]}
                                                />
                                                <View
                                                    style={
                                                        styles.progressOverlay
                                                    }
                                                    pointerEvents="none"
                                                >
                                                    <ThemedText
                                                        numberOfLines={1}
                                                        ellipsizeMode="tail"
                                                        style={{
                                                            fontWeight: "600",
                                                            color:
                                                                pct > 30
                                                                    ? "#fff"
                                                                    : textColor,
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        {`Goal: ${g ?? "?"}${
                                                            m.unit
                                                        } • Remaining: ${
                                                            g
                                                                ? Math.max(
                                                                      0,
                                                                      (g as number) -
                                                                          (t ??
                                                                              0)
                                                                  ) + m.unit
                                                                : "?"
                                                        } `}
                                                    </ThemedText>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </View>

                    <Animated.View
                        style={{
                            height: expandAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, macroContentHeight],
                            }),
                            opacity: expandAnim,
                            overflow: "hidden",
                        }}
                    >
                        {/* visible content mirrored from measurer */}
                        <View style={{ marginTop: 12 }}>
                            <ThemedText style={styles.metricLabel}>
                                Macros
                            </ThemedText>
                            <View style={styles.macroList}>
                                {[
                                    {
                                        key: "protein",
                                        label: "Protein",
                                        today: todayProtein,
                                        goal: macroGoals?.protein,
                                        unit: "g",
                                    },
                                    {
                                        key: "carbs",
                                        label: "Carbs",
                                        today: todayCarbs,
                                        goal: macroGoals?.carbs,
                                        unit: "g",
                                    },
                                    {
                                        key: "fat",
                                        label: "Fat",
                                        today: todayFat,
                                        goal: macroGoals?.fat,
                                        unit: "g",
                                    },
                                ].map((m) => {
                                    const g = m.goal as
                                        | number
                                        | undefined
                                        | null;
                                    const t = m.today as
                                        | number
                                        | undefined
                                        | null;
                                    const pct =
                                        g && g > 0
                                            ? Math.min(
                                                  ((t ?? 0) / g) * 100,
                                                  100
                                              )
                                            : 0;
                                    const over = g ? (t ?? 0) > g : false;
                                    return (
                                        <View
                                            key={m.key}
                                            style={{ marginTop: 8 }}
                                        >
                                            <ThemedText
                                                style={styles.macroLabel}
                                            >
                                                {m.label}
                                            </ThemedText>
                                            <View style={[styles.progressBar, { backgroundColor: progressBg as any }]}>
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        {
                                                            width: `${pct}%`,
                                                            backgroundColor:
                                                                over
                                                                    ? "#e74c3c"
                                                                    : "#4da6ff",
                                                        },
                                                    ]}
                                                />
                                                <View
                                                    style={
                                                        styles.progressOverlay
                                                    }
                                                    pointerEvents="none"
                                                >
                                                    <ThemedText
                                                        numberOfLines={1}
                                                        ellipsizeMode="tail"
                                                        style={{
                                                            fontWeight: "600",
                                                            color:
                                                                pct > 30
                                                                    ? "#fff"
                                                                    : textColor,
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        {`Goal: ${g ?? "?"}${
                                                            m.unit
                                                        } • Remaining: ${
                                                            g
                                                                ? Math.max(
                                                                      0,
                                                                      (g as number) -
                                                                          (t ??
                                                                              0)
                                                                  ) + m.unit
                                                                : "?"
                                                        } `}
                                                    </ThemedText>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </Animated.View>
                </View>
            {mealsToday && mealsToday.length > 0 ? (
                <View style={{ marginTop: 12 }}>
                    {mealsToday.map((m: any, idx: number) => (
                        <React.Fragment key={m.id}>
                            <MealRow
                                meal={m}
                                onPress={() =>
                                    router.push({
                                      pathname: "/meal/[id]",
                                      params: { id: m.id },
                                    })
                                  }
                            />
                        </React.Fragment>
                    ))}
                </View>
            ) : null}

            {statusMessage ? (
              <ThemedText style={styles.status}>{statusMessage}</ThemedText>
            ) : null}
            </ScrollView>


            {/* User menu dropdown */}
            {showUserMenu ? (
                <View
                    style={[
                        styles.userMenu,
                        {
                            backgroundColor: menuBg as any,
                            borderColor: menuBorder as any,
                            position: "absolute",
                            right: 12,
                            top: 56,
                            zIndex: 2000,
                        },
                    ]}
                >
                    <Button
                        title={isSigningOut ? "Signing out..." : "Sign Out"}
                        onPress={() => {
                            setShowUserMenu(false);
                            handleSignOut();
                        }}
                        disabled={isSigningOut || isDeleting}
                    />
                    <View style={{ height: 8 }} />
                    <Button
                        title={isDeleting ? "Deleting..." : "Delete Account"}
                        color="#d9534f"
                        onPress={() => {
                            setShowUserMenu(false);
                            handleDeleteAccount();
                        }}
                        disabled={isSigningOut || isDeleting}
                    />
                    <View style={{ height: 8 }} />
                    <Button
                        title="Profile Settings"
                        onPress={() => {
                            setShowUserMenu(false);
                            router.push("/profile/settings");
                        }}
                    />
                </View>
            ) : null}
            {/* Native DateTimePicker dialog for non-web platforms */}
            {Platform.OS !== "web" && showDatePicker && (
                <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(_e: any, picked?: Date) => {
                        setShowDatePicker(false);
                        if (picked) setSelectedDate(picked);
                    }}
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "stretch",
        justifyContent: "flex-start",
        paddingTop: 32,
        paddingHorizontal: 15,
        position: "relative",
    },
    status: {
        marginVertical: 10,
        color: "#ff6b6b",
        textAlign: "center",
    },
    progressBar: {
        height: 28,
        backgroundColor: "#f0f0f0",
        borderRadius: 14,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 14,
    },
    headerRow: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 24,
        marginBottom: 6,
    },
    userIcon: {
        padding: 6,
        textAlign: "justify"
    },
    userMenu: {
        marginTop: 12,
        minWidth: 160,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: "#e6e6e6",
        borderRadius: 8,
        backgroundColor: "#fff",
        // elevation / shadow for visibility on native
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    dateRow: {
        width: "100%",
        marginTop: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12
    },
    dateButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderRadius: 6,
    },
    datePill: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    datePillText: {
        marginRight: 8,
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center"
    },
    datePillIcon: {
        fontSize: 14,
    },
    mealRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0', // A neutral border
    },
    mealThumbWrapper: {
        marginRight: 12,
    },
    thumbnail: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    mealLeft: {
        flex: 1,
        justifyContent: 'center',
    },
    mealTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    mealSubtitle: {
        fontSize: 14,
        opacity: 0.9,
        marginTop: 2,
    },
    mealMacros: {
        fontSize: 12,
        opacity: 0.7,
        marginTop: 4,
    },
    mealTime: {
        fontSize: 12,
        opacity: 0.7,
    },
    divider: {
        height: 1,
        backgroundColor: "#8a8a8aff",
        width: "100%",
    },
    dailyContainer: {
        width: "100%",
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e6e6e6",
        backgroundColor: "#fff",
    },
    dailyTitle: {
        fontSize: 16,
        fontWeight: "700",
    },
    metricLabel: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 6,
    },
    progressOverlay: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
    },
    macroList: {},
    macroLabel: {
        fontSize: 12,
        opacity: 0.9,
        marginBottom: 4,
    },
    dailyHeader: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    menuOverlay: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 1500,
    },
});
