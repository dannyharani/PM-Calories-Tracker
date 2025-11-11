import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
// Avatar uses ThemedText initial; IconSymbol import removed
import { useThemeColor } from '@/hooks/use-theme-color';
import { getGraphQLClient, getPreferredAuthMode } from '@/src/amplifyClient';
import { getUser } from '@/src/graphql/queries';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { getCurrentUser } from 'aws-amplify/auth';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
// Alerts not needed here; dashboard is read-only now for account actions

// GraphQL client is loaded lazily when needed to ensure Amplify is configured first

export default function DashboardScreen() {
  // Clean header; user actions moved to Profile tab
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
  // Removed sign out/delete from dashboard; handled in Profile tab
  const [statusMessage] = useState<string | null>(null);
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
  const authMode = await getPreferredAuthMode();
  const result: any = await client.graphql({
          query: getUser,
          variables: { id },
    ...(authMode ? { authMode } : {}),
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
            const goalType = (userProfile?.goal || 'MAINTAIN_WEIGHT') as string;
            let pPct = 0.3, cPct = 0.4, fPct = 0.3;
            switch (goalType) {
              case 'LOSE_WEIGHT':
              case 'LOSE_FAT':
                pPct = 0.35; cPct = 0.35; fPct = 0.30; // higher protein, moderate carbs
                break;
              case 'GAIN_WEIGHT':
                pPct = 0.25; cPct = 0.50; fPct = 0.25; // more carbs for surplus
                break;
              case 'BUILD_MUSCLE':
                pPct = 0.35; cPct = 0.45; fPct = 0.20; // high protein, leaner fats
                break;
              default:
                pPct = 0.30; cPct = 0.40; fPct = 0.30; // maintain
            }
            setMacroGoals({
              protein: Math.round((pPct * cals) / 4),
              carbs: Math.round((cPct * cals) / 4),
              fat: Math.round((fPct * cals) / 9),
            });
          } else {
            setMacroGoals(null);
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        // Do not redirect on data fetch errors; only redirect when not authenticated.
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

  const fetchMealsForDate = useCallback(async (dateToFetch: Date, id: string) => {
      try {
        const startOfDay = new Date(dateToFetch.getFullYear(), dateToFetch.getMonth(), dateToFetch.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(dateToFetch.getFullYear(), dateToFetch.getMonth(), dateToFetch.getDate(), 23, 59, 59, 999);

        const listMealsForDashboard = /* GraphQL */ `
          query ListMeals($filter: ModelMealFilterInput) {
            listMeals(filter: $filter) { items { id mealType calories proteinGrams carbsGrams fatGrams date photoKey } }
          }
        `;

  const client = await getGraphQLClient();
  const authMode2 = await getPreferredAuthMode();
  const mealsResult: any = await client.graphql({
          query: listMealsForDashboard,
          variables: {
            filter: {
              userMealsId: { eq: id },
              date: { between: [startOfDay.toISOString(), endOfDay.toISOString()] },
            },
          },
          ...(authMode2 ? { authMode: authMode2 } : {}),
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
    }, []);

  // Fetch meals whenever selectedDate or userId changes
  useEffect(() => {

    if (userId) {
      fetchMealsForDate(selectedDate, userId);
    }

    console.log(selectedDate)
  }, [selectedDate, userId, fetchMealsForDate]);

  // Refetch meals when dashboard gains focus (after adding a meal)
  useFocusEffect(
    useCallback(() => {
      if (userId) fetchMealsForDate(selectedDate, userId);
      return () => {};
    }, [userId, selectedDate, fetchMealsForDate])
  );

  // Sign out / delete logic moved to Profile tab

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title">Dashboard</ThemedText>
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
  <Button
        title="Add meal"
        onPress={() =>
          router.push({ pathname: '/(tabs)/meal/add', params: { date: formatDateForInput(selectedDate) } })
        }
      />
      {/* Today's calories summary and progress */}
      {calorieGoal ? (
        <View style={styles.card}>
          <ThemedText style={{ marginBottom: 4 }}>{`Calories: ${todayCalories}/${calorieGoal} kcal (${((todayCalories/Math.max(1,calorieGoal))*100).toFixed(0)}%)`}</ThemedText>
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
              <ThemedText>{`Protein: ${Math.round(todayProtein)}/${macroGoals.protein} g (${((todayProtein/Math.max(1,macroGoals.protein))*100).toFixed(0)}%)`}</ThemedText>
              <View style={styles.macroBar}><View style={[styles.macroFill, { width: `${Math.min((todayProtein/Math.max(1,macroGoals.protein))*100, 100)}%`, backgroundColor: '#6c5ce7' }]} /></View>
              <ThemedText style={{ marginTop: 4 }}>{`Carbs: ${Math.round(todayCarbs)}/${macroGoals.carbs} g (${((todayCarbs/Math.max(1,macroGoals.carbs))*100).toFixed(0)}%)`}</ThemedText>
              <View style={styles.macroBar}><View style={[styles.macroFill, { width: `${Math.min((todayCarbs/Math.max(1,macroGoals.carbs))*100, 100)}%`, backgroundColor: '#00b894' }]} /></View>
              <ThemedText style={{ marginTop: 4 }}>{`Fat: ${Math.round(todayFat)}/${macroGoals.fat} g (${((todayFat/Math.max(1,macroGoals.fat))*100).toFixed(0)}%)`}</ThemedText>
              <View style={styles.macroBar}><View style={[styles.macroFill, { width: `${Math.min((todayFat/Math.max(1,macroGoals.fat))*100, 100)}%`, backgroundColor: '#fdcb6e' }]} /></View>
            </View>
          ) : null}
          {mealsToday && mealsToday.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              {mealsToday.map((m: any) => (
                <TouchableOpacity key={m.id} onPress={() => router.push({ pathname: '/(tabs)/meal/[id]', params: { id: m.id } })} style={{ paddingVertical: 6 }}>
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
  card: {
    width: '100%',
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff10',
    borderWidth: 1,
    borderColor: '#e2e2e2',
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
  macroBar: {
    height: 8,
    backgroundColor: '#f2f2f2',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  macroFill: {
    height: '100%',
    borderRadius: 4,
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
