import { Alert, Platform } from "react-native";

export function showAlert(title: string, message?: string) {
    if (Platform.OS === "web") {
        // window.alert is synchronous but fine for simple info
        window.alert(`${title}${message ? "\n\n" + message : ""}`);
        return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
        Alert.alert(title, message, [
            {
                text: "OK",
                onPress: () => resolve(),
            },
        ]);
    });
}

export function showConfirm(title: string, message?: string): Promise<boolean> {
    if (Platform.OS === "web") {
        const confirmed = window.confirm(
            `${title}${message ? "\n\n" + message : ""}`
        );
        return Promise.resolve(confirmed);
    }

    return new Promise<boolean>((resolve) => {
        Alert.alert(
            title,
            message,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => resolve(false),
                },
                { text: "OK", onPress: () => resolve(true) },
            ],
            { cancelable: true }
        );
    });
}
