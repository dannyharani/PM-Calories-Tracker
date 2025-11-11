import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
// Avatar uses ThemedText initial; IconSymbol import removed
import { useThemeColor } from '@/hooks/use-theme-color';
import { getGraphQLClient } from '@/src/amplifyClient';
import { deleteUser as deleteUserMutation } from '@/src/graphql/mutations';
import { getUser } from '@/src/graphql/queries';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { deleteUser as deleteUserAuth, getCurrentUser, signOut } from 'aws-amplify/auth';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { showAlert, showConfirm } from '../../src/utils/alert';

// GraphQL client is loaded lazily when needed to ensure Amplify is configured first

export default function DashboardScreen() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const menuBg = useThemeColor({}, 'background');
  const menuBorder = useThemeColor({}, 'icon');
  const iconColor = useThemeColor({}, 'icon');
  const [firstName, setFirstName] = useState<string | null>(null);
  const [todayCalories, setTodayCalories] = useState<number>(0);
  const [todayProtein, setTodayProtein] = useState<number>(0);
  const [todayCarbs, setTodayCarbs] = useState<number>(0);
  const [todayFat, setTodayFat] = useState<number>(0);
  const [calorieGoal, setCalorieGoal] = useState<number | null>(null);
  const [macroGoals, setMacroGoals] = useState<{ protein: number; carbs: number; fat: number } | null>(null);
  const [mealsToday, setMealsToday] = useState<any[]>([]);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const router = useRouter();

  // Helpers to format dates for HTML date inputs and parse them as local dates
  const formatDateForInput = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const parseDateFromInput = (s: string) => {
    // s is in YYYY-MM-DD; construct a local Date to avoid UTC parsing issues
    const parts = s.split('-').map((p) => parseInt(p, 10));
    if (parts.length !== 3) return new Date(s);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };
  const fetchUser = useCallback(async () => {
    let mounted = true;
      try {
        const cognitoUser: any = await getCurrentUser();
        const id = cognitoUser?.userId || cognitoUser?.attributes?.sub || cognitoUser?.username;

        if (!id) {
          router.replace('/auth/sign-in');
          return;
        }

        setUserId(id);

  const client = await getGraphQLClient();
  const result: any = await client.graphql({
          query: getUser,
          variables: { id },
          authMode: 'userPool'
        });

        const userProfile = result.data.getUser;

        if (mounted) {
          // Set the name!
          if (userProfile && userProfile.firstName) {
            setFirstName(userProfile.firstName);
          } else {
            setFirstName(cognitoUser.username || cognitoUser.attributes?.email || null);
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
      } catch (err) {
        console.error('Error fetching user data:', err);
        router.replace('/auth/sign-in');
      }
    // mark unmounted
    mounted = false;
  }, [router]);

  useEffect(() => {
    fetchUser();
    return () => {};
  }, [fetchUser]);

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
        const startOfDay = new Date(dateToFetch.getFullYear(), dateToFetch.getMonth(), dateToFetch.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(dateToFetch.getFullYear(), dateToFetch.getMonth(), dateToFetch.getDate(), 23, 59, 59, 999);

        const listMealsForDashboard = /* GraphQL */ `
          query ListMeals($filter: ModelMealFilterInput) {
            listMeals(filter: $filter) { items { id mealType calories proteinGrams carbsGrams fatGrams date photoKey } }
          }
        `;

  const client = await getGraphQLClient();
  const mealsResult: any = await client.graphql({
          query: listMealsForDashboard,
          variables: {
            filter: {
              userMealsId: { eq: id },
              date: { between: [startOfDay.toISOString(), endOfDay.toISOString()] },
            },
          },
          authMode: 'userPool',
        });

        const items = mealsResult?.data?.listMeals?.items || [];
        setMealsToday(items);
        const total = items.reduce((s: number, m: any) => s + (m?.calories || 0), 0);
        setTodayCalories(total);
        setTodayProtein(items.reduce((s: number, m: any) => s + (m?.proteinGrams || 0), 0));
        setTodayCarbs(items.reduce((s: number, m: any) => s + (m?.carbsGrams || 0), 0));
        setTodayFat(items.reduce((s: number, m: any) => s + (m?.fatGrams || 0), 0));
      } catch (err) {
        console.warn('Could not fetch meals for date', err);
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

    console.log(selectedDate)
  }, [selectedDate, userId]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setStatusMessage('Signing out...');
    try {
      await signOut();
      router.replace('/auth/sign-in');
    } catch (error: any) {
      console.error('Error signing out: ', error);
      setStatusMessage(error?.message || 'Failed to sign out');
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await showConfirm('Delete account', 'This will permanently delete your account. Are you sure?');
    if (!confirmed) return;

    setIsDeleting(true);
    setStatusMessage('Deleting account...');
    try {
      const { userId } = await getCurrentUser();
      if (!userId) {
        throw new Error("Could not find user ID.");
      }

  const client = await getGraphQLClient();
  await client.graphql({
        query: deleteUserMutation,
        variables: { input: { id: userId } },
        authMode: 'userPool'
      });

      await deleteUserAuth();

      await showAlert('Account deleted', 'Your account has been deleted.');
      router.replace('/auth/sign-up');

    } catch (err: any) {
      console.error('Error deleting user', err);
      const msg = err?.message || 'Failed to delete account';
      await showAlert('Error', msg);
      setStatusMessage(msg);
      setIsDeleting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title">Dashboard</ThemedText>
        <TouchableOpacity onPress={() => setShowUserMenu((s) => !s)} style={[styles.userIcon, { borderRadius: 20, backgroundColor: menuBg as any }]}>
          {/* Show an initial or fallback avatar so the icon is always visible and sizable */}
          <ThemedText style={{ fontSize: 16, color: iconColor as any }}>{firstName ? firstName.charAt(0).toUpperCase() : '👤'}</ThemedText>
        </TouchableOpacity>
      </View>
      {/* Date picker to select which day's meals to view */}
      <View style={styles.dateRow}>
        <ThemedText style={{ marginRight: 8 }}>Selected date:</ThemedText>
        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={formatDateForInput(selectedDate)}
            onChange={(e: any) => setSelectedDate(e.target.value ? parseDateFromInput(e.target.value) : new Date())}
            style={{ height: 36, padding: 8, borderRadius: 6, borderWidth: 1, borderColor: menuBorder as any, backgroundColor: menuBg as any, color: iconColor as any }}
          />
        ) : (
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.dateButton, { borderColor: menuBorder as any, backgroundColor: menuBg as any }]}>
            <ThemedText>{formatDateForInput(selectedDate)}</ThemedText>
          </TouchableOpacity>
        )}
      </View>
  <ThemedText>{firstName ? `Hello, ${firstName}` : 'Welcome to your dashboard!'}</ThemedText>
  <View style={{ height: 8 }} />
  <Button title="Add meal" onPress={() => router.push('/meal/add')} />
      {/* Today's calories summary and progress */}
      {calorieGoal ? (
        <View style={{ width: '100%', marginTop: 16 }}>
          <ThemedText style={{ marginBottom: 6 }}>{"Today's calories: "}{todayCalories}{' kcal'}</ThemedText>
          <ThemedText style={{ marginBottom: 6 }}>{'Goal: '}{calorieGoal}{' kcal'}</ThemedText>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((todayCalories / Math.max(1, calorieGoal)) * 100, 100)}%`,
                  backgroundColor: todayCalories > (calorieGoal || 0) ? '#e74c3c' : '#4da6ff',
                },
              ]}
            />
          </View>
          <ThemedText style={{ marginTop: 6 }}>
            {todayCalories > calorieGoal
              ? `Over by ${todayCalories - calorieGoal} kcal`
              : `Remaining ${calorieGoal - todayCalories} kcal`}
          </ThemedText>
          {macroGoals ? (
            <View style={{ marginTop: 8 }}>
              <ThemedText>{`Protein: ${Math.round(todayProtein)}g / ${macroGoals.protein}g`}</ThemedText>
              <ThemedText>{`Carbs: ${Math.round(todayCarbs)}g / ${macroGoals.carbs}g`}</ThemedText>
              <ThemedText>{`Fat: ${Math.round(todayFat)}g / ${macroGoals.fat}g`}</ThemedText>
            </View>
          ) : null}
          {mealsToday && mealsToday.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              {mealsToday.map((m: any) => (
                <TouchableOpacity key={m.id} onPress={() => router.push({ pathname: '/meal/[id]', params: { id: m.id } })} style={{ paddingVertical: 6 }}>
                  <ThemedText style={{ fontSize: 14 }}>{`${m.mealType}: ${m.calories} kcal`}</ThemedText>
                  {typeof m.proteinGrams === 'number' ? (
                    <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>{`P ${Math.round(m.proteinGrams)}g · C ${Math.round(m.carbsGrams || 0)}g · F ${Math.round(m.fatGrams || 0)}g`}</ThemedText>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <ThemedText style={{ marginTop: 12 }}>Set your calorie goal in your profile to see daily progress.</ThemedText>
      )}
      {statusMessage ? <ThemedText style={styles.status}>{statusMessage}</ThemedText> : null}

      {/* User menu dropdown */}
      {showUserMenu ? (
        <View style={[
          styles.userMenu,
          { backgroundColor: menuBg as any, borderColor: menuBorder as any, position: 'absolute', right: 12, top: 56, zIndex: 2000 },
        ]}>
          <Button title={isSigningOut ? 'Signing out...' : 'Sign Out'} onPress={() => { setShowUserMenu(false); handleSignOut(); }} disabled={isSigningOut || isDeleting} />
          <View style={{ height: 8 }} />
          <Button title={isDeleting ? 'Deleting...' : 'Delete Account'} color="#d9534f" onPress={() => { setShowUserMenu(false); handleDeleteAccount(); }} disabled={isSigningOut || isDeleting} />
          <View style={{ height: 8 }} />
          <Button title="Profile Settings" onPress={() => { setShowUserMenu(false); router.push('/profile/settings'); }} />
        </View>
      ) : null}
      {/* Native DateTimePicker dialog for non-web platforms */}
      {Platform.OS !== 'web' && showDatePicker && (
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
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 12,
    position: 'relative',
  },
  status: {
    marginVertical: 10,
    color: '#ff6b6b',
    textAlign: 'center',
  },
  progressBar: {
    height: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userIcon: {
    padding: 6,
  },
  userMenu: {
    marginTop: 12,
    minWidth: 160,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 8,
    backgroundColor: '#fff',
    // elevation / shadow for visibility on native
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  dateRow: {
    width: '100%',
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 6,
  },
});
