import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { API } from '@aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';
// Note: You'll need to install a date picker library, e.g., @react-native-community/datetimepicker
// For the dropdown, you might use a library like @react-native-picker/picker

const UserInfo = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [dob, setDob] = useState(new Date());
  const [goal, setGoal] = useState('');
  const [goalDate, setGoalDate] = useState(new Date());
  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const createUserMutation = `
    mutation CreateUser($input: CreateUserInput!) {
      createUser(input: $input) {
        id
        email
        firstName
        lastName
        dob
        gender
        height
        weight
        goal
        goalDate
      }
    }
  `;

  const onSavePressed = async () => {
    setErrorMsg('');
    setSaving(true);
    try {
      const user: any = await getCurrentUser();
      const email = user?.attributes?.email || user?.username;

      const input: any = {
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        dob: dob ? dob.toISOString().split('T')[0] : null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        goal: goal || null,
        goalDate: goalDate ? goalDate.toISOString().split('T')[0] : null,
      };

  await API.graphql({ query: createUserMutation, variables: { input } });

      // After saving, redirect to the dashboard
      router.replace('/dashboard');
    } catch (err: any) {
      console.error('Error saving user info', err);
      setErrorMsg(err?.message || 'Failed to save user info');
    } finally {
      setSaving(false);
    }
  };

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Tell us about yourself</ThemedText>
      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First Name"
        style={[styles.input, { color: textColor, borderColor }]}
        placeholderTextColor={borderColor}
      />
      <TextInput
        value={lastName}
        onChangeText={setLastName}
        placeholder="Last Name"
        style={[styles.input, { color: textColor, borderColor }]}
        placeholderTextColor={borderColor}
      />
      <TextInput
        value={height}
        onChangeText={setHeight}
        placeholder="Height (cm)"
        style={[styles.input, { color: textColor, borderColor }]}
        placeholderTextColor={borderColor}
        keyboardType="numeric"
      />
      <TextInput
        value={weight}
        onChangeText={setWeight}
        placeholder="Weight (kg)"
        style={[styles.input, { color: textColor, borderColor }]}
        placeholderTextColor={borderColor}
        keyboardType="numeric"
      />
      {/* Add Date pickers and a dropdown for goal */}
      <View style={styles.buttonContainer}>
        <Button title="Save and Continue" onPress={onSavePressed} />
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    marginVertical: 10,
  },
});

export default UserInfo;
