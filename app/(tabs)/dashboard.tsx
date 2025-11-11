import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
// Avatar uses ThemedText initial; IconSymbol import removed
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { deleteUser as deleteUserMutation } from '@/src/graphql/mutations';
import { getUser, listMeals } from '@/src/graphql/queries';
import DateTimePicker from '@react-native-community/datetimepicker';
import { generateClient } from 'aws-amplify/api';
import { deleteUser as deleteUserAuth, getCurrentUser, signOut } from 'aws-amplify/auth';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Button, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { showAlert, showConfirm } from '../utils/alert';

const client = generateClient();

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
  const [calorieGoal, setCalorieGoal] = useState<number | null>(null);
  const [mealsToday, setMealsToday] = useState<any[]>([]);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const router = useRouter();
  const dateInputRef = useRef<HTMLInputElement | null>(null);

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

  const formatDateShort = (d: Date) => {
    try {
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return formatDateForInput(d);
    }
  };
  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const cognitoUser: any = await getCurrentUser();
        const id = cognitoUser?.userId || cognitoUser?.attributes?.sub || cognitoUser?.username;

        if (!id) {
          router.replace('/auth/sign-in');
          return;
        }

        setUserId(id);

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

          // store calorie goal from profile
          setCalorieGoal(userProfile?.calorieGoal ?? null);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        router.replace('/auth/sign-in');
      }
    };
    fetchUser();
    return () => {
      mounted = false;
    };
  }, [router]);

  // Fetch meals whenever selectedDate or userId changes
  useEffect(() => {
    const fetchMealsForDate = async (dateToFetch: Date, id: string) => {
      try {
        const startOfDay = new Date(dateToFetch.getFullYear(), dateToFetch.getMonth(), dateToFetch.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(dateToFetch.getFullYear(), dateToFetch.getMonth(), dateToFetch.getDate(), 23, 59, 59, 999);

        const mealsResult: any = await client.graphql({
          query: listMeals,
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
      } catch (err) {
        console.warn('Could not fetch meals for date', err);
        setMealsToday([]);
        setTodayCalories(0);
      }
    };

    if (userId) {
      fetchMealsForDate(selectedDate, userId);
    }

    console.log(selectedDate)
  }, [selectedDate, userId]);

  // Small presentational component for a meal row
  const MealRow = ({ meal, onPress }: { meal: any; onPress?: () => void }) => {
    const dateStr = meal?.date || meal?.dateTime || meal?.createdAt || '';
    let timeLabel = '';
    try {
      const dt = new Date(dateStr);
      timeLabel = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      // ignore parse errors
    }

    // potential thumbnail fields (app may not store photos yet)
    const thumbUrl = meal?.photo || meal?.image || meal?.imageUrl || meal?.thumbnail || meal?.s3Key || null;

    return (
      <TouchableOpacity onPress={onPress} style={styles.mealRow} accessibilityRole="link">
        <View style={styles.mealThumbWrapper}>
          {thumbUrl ? (
            <Image source={{ uri: thumbUrl }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
              <ThemedText style={{ fontSize: 18 }}>🍴</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.mealLeft}>
          <ThemedText style={styles.mealTitle}>{`${meal.mealType}: ${meal.calories} cal`}</ThemedText>
          <ThemedText style={styles.mealTime}>{timeLabel}</ThemedText>
        </View>

        <IconSymbol name="chevron.right" size={18} color={iconColor as string} />
      </TouchableOpacity>
    );
  };

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
      {/* Date pill — shows short date and opens picker when pressed */}
      <ThemedText>{firstName ? `Hello, ${firstName}` : 'Welcome to your dashboard!'}</ThemedText>
      <View style={styles.dateRow}>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS === 'web') {
              // try to focus then click the hidden native date input to open browser picker
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
          style={[styles.datePill, { borderColor: menuBorder as any, backgroundColor: menuBg as any }]}
        >
          <ThemedText style={styles.datePillText}>{formatDateShort(selectedDate)}</ThemedText>
        </TouchableOpacity>

        {/* hidden input used on web to trigger native date picker UI */}
        {Platform.OS === 'web' ? (
          <input
            ref={dateInputRef}
            type="date"
            value={formatDateForInput(selectedDate)}
            onChange={(e: any) => setSelectedDate(e.target.value ? parseDateFromInput(e.target.value) : new Date())}
            // keep the input in the DOM but visually hidden so programmatic click can open the picker
            style={{ position: 'absolute', opacity: 0, width: 1, height: 1, left: -9999 }}
          />
        ) : null}
      </View>
      {/* Today's calories summary and progress */}
      {calorieGoal ? (
        <View style={{ width: '100%', marginTop: 16 }}>
          <ThemedText style={{ marginBottom: 6 }}>{"Today's calories: "}{todayCalories}{' cal'}</ThemedText>
          <ThemedText style={{ marginBottom: 6 }}>{'Goal: '}{calorieGoal}{' cal'}</ThemedText>
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
              ? `Over by ${todayCalories - calorieGoal} cal`
              : `Remaining ${calorieGoal - todayCalories} cal`}
          </ThemedText>
          {mealsToday && mealsToday.length > 0 ? (
                <View style={{ marginTop: 8 }}>
                  {mealsToday.map((m: any, idx: number) => (
                    <React.Fragment key={m.id}>
                      <MealRow meal={m} onPress={() => router.push({ pathname: '/meal/[id]', params: { id: m.id } })} />
                      {idx < mealsToday.length - 1 ? <View style={styles.divider} /> : null}
                    </React.Fragment>
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
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePillText: {
    marginRight: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  datePillIcon: {
    fontSize: 14,
  },
  mealRow: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealLeft: {
    flex: 1,
    paddingRight: 8,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  mealTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  mealThumbWrapper: {
    width: 56,
    height: 56,
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#8a8a8aff',
    width: '100%',
  },
});
