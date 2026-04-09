import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { getAll, run } from '../components/database/database';

const mealCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const filterCategories = ['All', ...mealCategories];
const moodOptions = ['Happy', 'Neutral', 'Tired', 'Cheerful', 'Focused'];

const formatDisplayDate = (value) => {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

const HomeScreenWeb = ({ navigation, route }) => {
  const userId = route.params?.userId;
  const userEmail = route.params?.userEmail ?? 'guest';

  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [journals, setJournals] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [entryCategory, setEntryCategory] = useState(mealCategories[0]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [mood, setMood] = useState(moodOptions[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadJournals = async () => {
    if (!userId) {
      Alert.alert('Error', 'User session is missing. Please sign in again.');
      return;
    }

    try {
      const rows = await getAll(
        'SELECT id, userId, image, description, date, mealCategory, mood FROM journals WHERE userId = ? ORDER BY date DESC',
        userId
      );
      setJournals(rows);
    } catch (error) {
      console.error('Load journals error:', error);
      Alert.alert('Error', 'Unable to load journal entries.');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await loadJournals();
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [userId]);

  const filteredJournals = useMemo(() => {
    if (filterCategory === 'All') {
      return journals;
    }

    return journals.filter((item) => item.mealCategory === filterCategory);
  }, [filterCategory, journals]);

  const journalStats = useMemo(() => {
    const latest = journals[0];
    return {
      total: journals.length,
      latestDate: latest ? formatDisplayDate(latest.date) : 'No entries yet',
    };
  }, [journals]);

  const resetForm = () => {
    setImage(null);
    setDescription('');
    setEditingId(null);
    setEntryCategory(mealCategories[0]);
    setMood(moodOptions[0]);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Unable to select an image.');
    }
  };

  const saveJournal = async () => {
    if (!image || !description.trim()) {
      Alert.alert('Validation error', 'Add both a meal photo and a short description.');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User session is missing. Please sign in again.');
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        await run(
          'UPDATE journals SET image = ?, description = ?, mealCategory = ?, mood = ? WHERE id = ?',
          image,
          description.trim(),
          entryCategory,
          mood,
          editingId
        );
      } else {
        await run(
          'INSERT INTO journals (userId, image, description, date, mealCategory, mood) VALUES (?, ?, ?, ?, ?, ?)',
          userId,
          image,
          description.trim(),
          new Date().toISOString(),
          entryCategory,
          mood
        );
      }

      await loadJournals();
      resetForm();
    } catch (error) {
      console.error('Save journal error:', error);
      Alert.alert('Error', 'Unable to save the journal entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteJournal = async (id) => {
    try {
      await run('DELETE FROM journals WHERE id = ?', id);
      await loadJournals();
    } catch (error) {
      console.error('Delete journal error:', error);
      Alert.alert('Error', 'Unable to delete the journal entry.');
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setDescription(item.description);
    setImage(item.image);
    setEntryCategory(item.mealCategory);
    setMood(item.mood ?? moodOptions[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size="large" color="#1f6feb" />
        <Text style={styles.loadingText}>Loading journal entries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.container}>
          <View style={styles.headerCard}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>My food journal</Text>
                <Text style={styles.headerSubtitle}>{userEmail}</Text>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.replace('Auth')}>
                <Text style={styles.logoutButtonText}>Log out</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total entries</Text>
                <Text style={styles.statValue}>{journalStats.total}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Latest entry</Text>
                <Text style={styles.statValueSmall}>{journalStats.latestDate}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{editingId ? 'Edit entry' : 'New entry'}</Text>

            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>No photo selected yet</Text>
              </View>
            )}

            <TouchableOpacity style={styles.secondaryActionButton} onPress={pickImage}>
              <Text style={styles.secondaryActionButtonText}>Choose image</Text>
            </TouchableOpacity>

            <TextInput
              placeholder="Describe the meal, ingredients, or how you felt"
              placeholderTextColor="#7a8797"
              value={description}
              onChangeText={setDescription}
              style={styles.textArea}
              multiline
            />

            <Text style={styles.fieldLabel}>Meal category</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={entryCategory} onValueChange={setEntryCategory} style={styles.picker}>
                {mealCategories.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>

            <Text style={styles.fieldLabel}>Mood after eating</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={mood} onValueChange={setMood} style={styles.picker}>
                {moodOptions.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity
              style={[styles.primaryActionButton, isSaving && styles.disabledButton]}
              onPress={saveJournal}
              disabled={isSaving}
            >
              <Text style={styles.primaryActionButtonText}>
                {isSaving ? 'Saving...' : editingId ? 'Update entry' : 'Save entry'}
              </Text>
            </TouchableOpacity>

            {editingId ? (
              <TouchableOpacity style={styles.cancelEditButton} onPress={resetForm}>
                <Text style={styles.cancelEditButtonText}>Cancel editing</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Journal timeline</Text>
            <Text style={styles.fieldLabel}>Filter by category</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={filterCategory} onValueChange={setFilterCategory} style={styles.picker}>
                {filterCategories.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>

            {filteredJournals.length > 0 ? (
              <View>
                {filteredJournals.map((item) => (
                  <View key={String(item.id)} style={styles.journalItem}>
                    <Image source={{ uri: item.image }} style={styles.journalImage} />
                    <View style={styles.journalDetails}>
                      <Text style={styles.journalDescription}>{item.description}</Text>
                      <Text style={styles.journalMeta}>
                        {item.mealCategory} | {item.mood ?? 'No mood'}
                      </Text>
                      <Text style={styles.journalDate}>{formatDisplayDate(item.date)}</Text>
                      <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.smallButton, styles.editButton]} onPress={() => startEditing(item)}>
                          <Text style={styles.smallButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.smallButton, styles.deleteButton]}
                          onPress={() => deleteJournal(item.id)}
                        >
                          <Text style={styles.smallButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No entries yet</Text>
                <Text style={styles.emptyStateText}>Add your first meal above to start the journal.</Text>
              </View>
            )}
          </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    height: '100vh',
    overflow: 'scroll',
    backgroundColor: '#eef3f7',
    padding: 16,
    paddingBottom: 64,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  centeredScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef3f7',
  },
  loadingText: {
    marginTop: 12,
    color: '#334155',
    fontSize: 15,
  },
  headerCard: {
    backgroundColor: '#16324f',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#d3deea',
    marginTop: 4,
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#f2c66d',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoutButtonText: {
    color: '#16324f',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#24486c',
    borderRadius: 18,
    padding: 14,
  },
  statLabel: {
    color: '#bfd1e3',
    fontSize: 13,
    marginBottom: 8,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  statValueSmall: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#183153',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#17324d',
    marginBottom: 14,
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 18,
    marginBottom: 14,
  },
  imagePlaceholder: {
    height: 240,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d8e0e8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fbfd',
    marginBottom: 14,
  },
  imagePlaceholderText: {
    color: '#6b7a8c',
    fontSize: 15,
  },
  secondaryActionButton: {
    backgroundColor: '#edf3fb',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  secondaryActionButtonText: {
    color: '#17324d',
    fontWeight: '700',
  },
  textArea: {
    minHeight: 82,
    borderWidth: 1,
    borderColor: '#d6dce5',
    borderRadius: 14,
    padding: 14,
    textAlignVertical: 'top',
    marginBottom: 14,
    fontSize: 15,
    color: '#1d2a3a',
    backgroundColor: '#fbfcfe',
  },
  fieldLabel: {
    color: '#41576d',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#d6dce5',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fbfcfe',
    marginBottom: 14,
  },
  picker: {
    height: 52,
  },
  primaryActionButton: {
    backgroundColor: '#1f6feb',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryActionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  cancelEditButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  cancelEditButtonText: {
    color: '#d14343',
    fontWeight: '700',
  },
  journalItem: {
    flexDirection: 'row',
    backgroundColor: '#f9fbfd',
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  journalImage: {
    width: 76,
    height: 76,
    borderRadius: 14,
  },
  journalDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  journalDescription: {
    color: '#10233d',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  journalMeta: {
    color: '#486077',
    marginBottom: 4,
  },
  journalDate: {
    color: '#6c7b8b',
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  smallButton: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editButton: {
    backgroundColor: '#f2c66d',
  },
  deleteButton: {
    backgroundColor: '#d14343',
  },
  smallButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#17324d',
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#607086',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default HomeScreenWeb;
