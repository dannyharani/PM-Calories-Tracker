import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getGraphQLClient } from '@/src/amplifyClient';
import { createUser, updateUser } from '@/src/graphql/mutations';
import { getUser as getUserQuery } from '@/src/graphql/queries';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
// awsconfig no longer needed for raw fetch when using Amplify client

const UserInfo = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [dob, setDob] = useState<Date | null>(new Date());
  const [goal, setGoal] = useState<string>('MAINTAIN_WEIGHT');
  const [goalDate, setGoalDate] = useState<Date | null>(new Date());
  const [gender, setGender] = useState<string>('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [calorieLimit, setCalorieLimit] = useState<number | null>(null);
  const [step, setStep] = useState<number>(1);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // helper: age
  function calculateAge(d: Date | null) {
    if (!d) return null;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
      age--;
    }
    return age;
  }

  // load existing profile
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const cognito: any = await getCurrentUser();
        const id = cognito?.userId || cognito?.attributes?.sub || cognito?.username;
        if (!id) return;
        setUserId(id);
        const client = await getGraphQLClient();
        const existingResp: any = await client.graphql({ query: getUserQuery, variables: { id }, authMode: 'userPool' });
        const existing = existingResp?.data?.getUser;
        if (existing && mounted) {
          setIsExistingUser(true);
          setFirstName(existing.firstName || '');
          setLastName(existing.lastName || '');
          setHeight(existing.height ? String(existing.height) : '');
          setWeight(existing.weight ? String(existing.weight) : '');
          setDob(existing.dob ? new Date(existing.dob) : new Date());
          setGoal(existing.goal || 'MAINTAIN_WEIGHT');
          setGoalDate(existing.goalDate ? new Date(existing.goalDate) : new Date());
          setGender(existing.gender || '');
          setCalorieLimit(existing.calorieGoal || null);
        }
      } catch (err) {
        console.warn('Could not load existing profile', err);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // update calorie limit when inputs change
  useEffect(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = calculateAge(dob);
    if (!w || !h || a == null) {
      setCalorieLimit(null);
      return;
    }
    let bmr = 10 * w + 6.25 * h - 5 * a;
    if (gender?.toLowerCase() === 'male' || gender?.toLowerCase() === 'm') {
      bmr += 5;
    } else {
      bmr -= 161;
    }
    const maintenance = Math.round(bmr * 1.2);
    if (goal === 'LOSE_WEIGHT') setCalorieLimit(maintenance - 500);
    else if (goal === 'GAIN_WEIGHT') setCalorieLimit(maintenance + 500);
    else setCalorieLimit(maintenance);
  }, [weight, height, dob, gender, goal]);

  const onSavePressed = async () => {
    setErrorMsg('');
    setSaving(true);
    try {
      const user: any = await getCurrentUser();
      const {email} = (await fetchUserAttributes())
      const id = userId || user?.userId || user?.attributes?.sub || user?.username;

      if (!id) {
        throw new Error('Missing user id');
      }

      const input: any = {
        id,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        dob: dob ? dob.toISOString().split('T')[0] : null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        goal: goal || null,
        goalDate: goalDate ? goalDate.toISOString().split('T')[0] : null,
        gender: gender || null,
        age: dob ? calculateAge(dob) : null,
        calorieGoal: calorieLimit || null,
      };

      const queryToUse = isExistingUser ? updateUser : createUser;
  const client = await getGraphQLClient();
  const resp = await client.graphql({query: queryToUse, variables: {input}, authMode: 'userPool'})

      if (resp.errors) throw new Error(resp.errors[0]?.message || 'GraphQL error');

  router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      console.error('Error saving user info', err);
      setErrorMsg(err?.message || 'Failed to save user info');
    } finally {
      setSaving(false);
    }
  };

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');
  const selectedBg = useThemeColor({ light: '#e6f7ff', dark: '#203449' }, 'background');
  const selectedBorder = useThemeColor({ light: '#4da6ff', dark: '#4da6ff' }, 'tint');
  const selectedTextColor = useThemeColor({ light: '#0b3a55', dark: '#fff' }, 'text');

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Tell us about yourself</ThemedText>

      {/* Step 1: Name + DOB */}
      {step === 1 && (
        <View>
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
          {/* Date of birth: native date picker on mobile, text input fallback on web */}
          {Platform.OS === 'web' ? (
            // Use native HTML date input on web for better UX
            <input
              type="date"
              value={dob ? dob.toISOString().split('T')[0] : ''}
              onChange={(e) => setDob(e.target.value ? new Date(e.target.value) : null)}
              style={{ height: 40, paddingLeft: 10, paddingRight: 10, borderRadius: 5, borderWidth: 1, borderColor: borderColor as any, color: textColor as any, marginBottom: 10 }}
            />
          ) : (
            <TouchableOpacity onPress={() => setShowDobPicker(true)} style={[styles.input, { justifyContent: 'center' }] as any}>
              <ThemedText style={{ color: textColor }}>{dob ? dob.toISOString().split('T')[0] : 'Select date of birth'}</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Step 2: Height, Weight, Gender */}
      {step === 2 && (
        <View>
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
          <ThemedText style={{ marginBottom: 6 }}>Gender</ThemedText>
          <View style={styles.optionsRow}>
            {[{ key: 'male', label: '♂ Male', value: 'male' }, { key: 'female', label: '♀ Female', value: 'female' }, { key: 'other', label: '⚧ Other', value: 'other' }].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.optionButton,
                  gender === opt.value && { backgroundColor: selectedBg, borderColor: selectedBorder },
                ]}
                onPress={() => setGender(opt.value)}
              >
                <ThemedText style={[styles.optionText, gender === opt.value && { color: selectedTextColor }]}>{opt.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Step 3: Goal, Goal date, Preview */}
      {step === 3 && (
        <View>
          <ThemedText style={{ marginBottom: 6 }}>Goal</ThemedText>
          <View style={styles.optionsRow}>
            {[{ key: 'lose', label: 'Lose', value: 'LOSE_WEIGHT' }, { key: 'maintain', label: 'Maintain', value: 'MAINTAIN_WEIGHT' }, { key: 'gain', label: 'Gain', value: 'GAIN_WEIGHT' }].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.optionButton,
                  goal === opt.value && { backgroundColor: selectedBg, borderColor: selectedBorder },
                ]}
                onPress={() => setGoal(opt.value)}
              >
                <ThemedText style={[styles.optionText, goal === opt.value && { color: selectedTextColor }]}>{opt.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          {/* Goal date: native date picker on mobile, text input fallback on web */}
          {Platform.OS === 'web' ? (
            // Use native HTML date input on web for better UX
            <input
              type="date"
              value={goalDate ? goalDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setGoalDate(e.target.value ? new Date(e.target.value) : null)}
              style={{ height: 40, paddingLeft: 10, paddingRight: 10, borderRadius: 5, borderWidth: 1, borderColor: borderColor as any, color: textColor as any, marginBottom: 10 }}
            />
          ) : (
            <TouchableOpacity onPress={() => setShowGoalPicker(true)} style={[styles.input, { justifyContent: 'center' }] as any}>
              <ThemedText style={{ color: textColor }}>{goalDate ? goalDate.toISOString().split('T')[0] : 'Select goal date'}</ThemedText>
            </TouchableOpacity>
          )}
          {calorieLimit ? <ThemedText style={{ marginVertical: 8 }}>Daily calorie target: {calorieLimit} kcal</ThemedText> : null}
        </View>
      )}

        {/* Native DateTimePicker dialogs (only on native platforms) */}
        {Platform.OS !== 'web' && showDobPicker && (
          <DateTimePicker
            value={dob || new Date()}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(_event: any, selectedDate?: Date) => {
              setShowDobPicker(false);
              if (selectedDate) setDob(selectedDate);
            }}
          />
        )}
        {Platform.OS !== 'web' && showGoalPicker && (
          <DateTimePicker
            value={goalDate || new Date()}
            mode="date"
            display="default"
            onChange={(_event: any, selectedDate?: Date) => {
              setShowGoalPicker(false);
              if (selectedDate) setGoalDate(selectedDate);
            }}
          />
        )}

      {errorMsg ? <ThemedText style={styles.errorText}>{errorMsg}</ThemedText> : null}

      <View style={styles.buttonContainer}>
        {step > 1 ? (
          <View style={styles.inlineLeft}>
            <View style={styles.backWrapper}>
              <Button title="Back" onPress={() => setStep((s) => Math.max(1, s - 1))} />
            </View>
          </View>
        ) : null}

        {step < 3 ? (
          <View style={styles.inlineRight}>
            <Button title="Continue" onPress={() => setStep((s) => Math.min(3, s + 1))} />
          </View>
        ) : (
          <View style={styles.fullWidthButton}>
            <Button title={saving ? 'Saving…' : isExistingUser ? 'Update profile' : 'Save and Continue'} onPress={onSavePressed} disabled={saving} />
          </View>
        )}
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
  errorText: {
    color: '#ff6b6b',
    marginBottom: 10,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: '#e6f7ff',
    borderColor: '#4da6ff',
  },
  optionText: {
    fontSize: 14,
  },
  inlineLeft: {
    flex: 1,
    marginRight: 8,
  },
  inlineRight: {
    flex: 1,
  },
  backWrapper: {
    marginBottom: 8,
  },
  fullWidthButton: {
    width: '100%',
  },
});

export default UserInfo;
