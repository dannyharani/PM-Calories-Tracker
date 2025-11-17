import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { getGraphQLClient } from "@/src/amplifyClient";
import { Picker } from "@react-native-picker/picker";
import { getCurrentUser } from "aws-amplify/auth";
import { uploadData } from "aws-amplify/storage";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Button,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    getStorageMissingMessage,
    isStorageConfigured,
} from "../../src/utils/storage";

export default function CaptureTab() {
    const router = useRouter();
    const [mode, setMode] = useState<"initial" | "picked">("initial");
    const [previewUri, setPreviewUri] = useState<string | null>(null);
    const textColor = useThemeColor({}, "text");
    const iconColor = useThemeColor({}, "icon");
    const cardBg = useThemeColor({}, "background");
    const [mealType, setMealType] = useState<"BREAKFAST" | "LUNCH" | "DINNER" | "SNACK">("LUNCH");
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSignedIn, setIsSignedIn] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            try {
                await getCurrentUser();
                setIsSignedIn(true);
            } catch {
                setIsSignedIn(false);
            }
        };
        checkUser();
    }, []);

    const onWebFile = (e: any) => {
        const file = e?.target?.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreviewUri(url);
        setPhotoUri(url);
        setMode("picked");
    };

    const pickFromCamera = async () => {
        try {
            const { status } =
                await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") return;
            const result = await ImagePicker.launchCameraAsync({
                quality: 0.6,
            });
            if ((result as any).canceled) return;
            const asset = (result as any).assets?.[0];
            if (asset?.uri) {
                setPreviewUri(asset.uri);
                setPhotoUri(asset.uri);
                setMode("picked");
            }
        } catch (err) {
            console.warn("camera error", err);
        }
    };

    const pickFromLibrary = async () => {
        try {
            const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") return;
            const result = await ImagePicker.launchImageLibraryAsync({
                quality: 0.6,
            });
            if ((result as any).canceled) return;
            const asset = (result as any).assets?.[0];
            if (asset?.uri) {
                setPreviewUri(asset.uri);
                setPhotoUri(asset.uri);
                setMode("picked");
            }
        } catch (err) {
            console.warn("library error", err);
        }
    };

    const handleCancel = () => {
        // reset capture/manual form to initial blank state
        setMode("initial");
        setPreviewUri(null);
        setPhotoUri(null);
        setError(null);
    };

    const handleSaveMeal = async () => {
        setIsSaving(true);
        setError(null);
        let newMealId: string | null = null;
        const client = await getGraphQLClient();

        try {
            const user = await getCurrentUser();
            const userId = user.userId || user.username;
            if (!userId) throw new Error("Not signed in");


            const createInput = {
                date: new Date().toISOString(),
                mealType,
                userMealsId: userId,
                status: photoUri ? 'PROCESSING' : 'MANUAL',
            };

            const createRes = await client.graphql({
                query: /* GraphQL */ `
                    mutation CreateMeal($input: CreateMealInput!) { 
                        createMeal(input: $input) { 
                            id 
                            status
                        } 
                    }
                `,
                variables: { input: createInput },
                authMode: "userPool",
            });

            newMealId = (createRes as any).data?.createMeal?.id;
            if (!newMealId) {
                throw new Error("Failed to create meal entry.");
            }

            let photoKey: string | undefined;
            if (photoUri && isStorageConfigured()) {
                const response = await fetch(photoUri);
                const blob = await response.blob();
                const ext = photoUri.split(".").pop() || "jpg";
                
                const path = `public/uploads/${newMealId}.${ext}`;

                await uploadData({
                    path,
                    data: blob,
                    options: { contentType: (blob as any).type || "image/jpeg" },
                }).result;
                
                photoKey = path;

                const updateInput = {
                    id: newMealId,
                    photoKey: photoKey,
                };

                await client.graphql({
                    query: /* GraphQL */ `
                        mutation UpdateMeal($input: UpdateMealInput!) {
                            updateMeal(input: $input) {
                                id
                                photoKey
                            }
                        }
                    `,
                    variables: { input: updateInput },
                    authMode: "userPool",
                });

            } else if (photoUri && !isStorageConfigured()) {
                setError(getStorageMissingMessage());
            }


            router.replace({ pathname: "/meal/[id]", params: { id: newMealId } });

        } catch (e: any) {
            console.error("Failed to save meal:", e);
            setError(e?.message || "Failed to save meal");

            // const updateInput = {
            //     id: newMealId,
            //     status: 'ERROR',
            // };
        
            // await client.graphql({
            //     query: /* GraphQL */ `
            //         mutation UpdateMeal($input: UpdateMealInput!) {
            //             updateMeal(input: $input) {
            //                 id
            //             }
            //         }
            //     `,
            //     variables: { input: updateInput },
            //     authMode: "userPool",
            // });

        } finally {
            setIsSaving(false);
        }
    };

    if (!isSignedIn) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={{textAlign: 'center', marginBottom: 12}}>Account Required</ThemedText>
                <ThemedText style={{textAlign: 'center', marginBottom: 20}}>
                    Please sign in or create an account to capture meals. Guest mode will be available in a future version.
                </ThemedText>
                <View style={{width: '60%'}}>
                    <Button title="Sign In" onPress={() => router.push('/auth/sign-in')} />
                    <View style={{height: 12}} />
                    <Button title="Sign Up" onPress={() => router.push('/auth/sign-up')} />
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <View style={{ flex: 1, width: "100%", margin:20 }}>
                {mode === "initial" ? (
                    <View style={{padding: 26}}>
                        <ThemedText type="title">Capture a meal</ThemedText>
                        <ThemedText style={{ marginTop: 8 }}>
                            Choose an action below to begin
                        </ThemedText>
                    </View>
                ) : null}

                {mode === "picked" ? (
                    <View style={{ width: "100%", position: "relative" }}>
                        {previewUri ? (
                            <Image
                                source={{ uri: previewUri }}
                                style={styles.bgImage}
                            />
                        ) : null}

                        <KeyboardAvoidingView
                            behavior={
                                Platform.OS === "ios" ? "padding" : "height"
                            }
                            style={{ width: "100%" }}
                        >
                            <ScrollView keyboardShouldPersistTaps="handled">
                                <View
                                    style={[
                                        styles.contentPane,
                                        { backgroundColor: cardBg },
                                    ]}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <ThemedText type="title">Review Meal</ThemedText>
                                        <Button title="Cancel" color="#777" onPress={handleCancel} />
                                    </View>

                                    <View style={{ marginBottom: 8 }}>
                                        <ThemedText style={{ marginBottom: 6 }}>
                                            Meal type
                                        </ThemedText>
                                        <View
                                            style={[
                                                styles.pickerWrapper,
                                                { borderColor: "#ddd" },
                                            ]}
                                        >
                                            <Picker
                                                selectedValue={mealType}
                                                onValueChange={(v) =>
                                                    setMealType(v as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK")
                                                }
                                            >
                                                <Picker.Item
                                                    label="Breakfast"
                                                    value="BREAKFAST"
                                                />
                                                <Picker.Item label="Lunch" value="LUNCH" />
                                                <Picker.Item
                                                    label="Dinner"
                                                    value="DINNER"
                                                />
                                                <Picker.Item label="Snack" value="SNACK" />
                                            </Picker>
                                        </View>
                                    </View>
                                    
                                    {error ? <Text style={{color: 'red', marginVertical: 10}}>{error}</Text> : null}

                                    <View style={{ marginTop: 20, marginBottom: 20 }}>
                                        {isSaving ? (
                                            <ActivityIndicator />
                                        ) : (
                                            <Button
                                                title={photoUri ? "Save and Analyze Meal" : "Save Meal"}
                                                onPress={handleSaveMeal}
                                            />
                                        )}
                                    </View>
                                    <ThemedText style={{textAlign: 'center', fontSize: 12}}>
                                        {photoUri 
                                            ? "After saving, your meal will be analyzed by our AI to estimate its nutritional content. You can see the results on the meal detail page."
                                            : "You will be able to add ingredients and nutritional information on the next screen."
                                        }
                                    </ThemedText>
                                </View>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                ) : null}
            </View>

            {/* action grid pinned to bottom */}
            <View style={styles.actionGrid}>
                <TouchableOpacity
                    style={styles.squircleButton}
                    onPress={() => {
                        if (Platform.OS === "web") {
                            const el = document.getElementById(
                                "hidden-camera"
                            ) as HTMLInputElement | null;
                            if (el) el.click();
                        } else pickFromCamera();
                    }}
                    accessibilityLabel="Take photo"
                >
                    <IconSymbol
                        name="camera"
                        size={36}
                        color={iconColor as string}
                    />
                    <Text
                        style={[
                            styles.squircleLabel,
                            { color: textColor as any },
                        ]}
                    >
                        Take Photo
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.squircleButton}
                    onPress={() => {
                        if (Platform.OS === "web") {
                            const el = document.getElementById(
                                "hidden-upload"
                            ) as HTMLInputElement | null;
                            if (el) el.click();
                        } else pickFromLibrary();
                    }}
                    accessibilityLabel="Upload photo"
                >
                    <IconSymbol
                        name="arrow.up.doc"
                        size={36}
                        color={iconColor as string}
                    />
                    <Text
                        style={[
                            styles.squircleLabel,
                            { color: textColor as any },
                        ]}
                    >
                        Upload
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.squircleButton}
                    onPress={() => {
                        setPhotoUri(null);
                        setPreviewUri(null);
                        setMode("picked");
                    }}
                    accessibilityLabel="Add meal manually"
                >
                    <IconSymbol
                        name="pencil"
                        size={36}
                        color={iconColor as string}
                    />
                    <Text
                        style={[
                            styles.squircleLabel,
                            { color: textColor as any },
                        ]}
                    >
                        Add Manually
                    </Text>
                </TouchableOpacity>

                {Platform.OS === "web" ? (
                    <>
                        <input
                            id="hidden-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={onWebFile}
                        />
                        <input
                            id="hidden-camera"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: "none" }}
                            onChange={onWebFile}
                        />
                    </>
                ) : null}
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        // padding: 12,
        paddingBottom: 0,
        alignItems: "center",
        justifyContent: "flex-start",
    },
    actionGrid: {
        width: "100%",
        maxWidth: 720,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingVertical: 24,
    },
    squircleButton: {
        maxWidth: 120,
        maxHeight: 120,
        minWidth: 100,
        minHeight: 100,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#ddd",
        justifyContent: "center",
        alignItems: "center",
    },
    squircleLabel: { marginTop: 8, fontSize: 13 },
    preview: { width: 320, height: 200, borderRadius: 8, marginTop: 12 },
    pickerWrapper: { borderWidth: 1, borderRadius: 8, overflow: "hidden" },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 8,
        borderRadius: 6,
        color: "#000",
    },
    contentPane: {
        marginTop: 220,
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        padding: 16,
        minHeight: 200,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    bgImage: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        height: 320,
    },
});
