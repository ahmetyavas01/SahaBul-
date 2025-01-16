import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../supabaseClient';
import MatchCard from '../components/MatchCard';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function HomeScreen({ navigation, route }) {
  const [matches, setMatches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching matches:', error);
      } else {
        setMatches(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filterMatches = () => {
    const now = new Date();
    switch (activeFilter) {
      case 'today':
        return matches.filter(match => new Date(match.date).toDateString() === now.toDateString());
      case 'week':
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return matches.filter(match => {
          const matchDate = new Date(match.date);
          return matchDate >= now && matchDate <= nextWeek;
        });
      default:
        return matches;
    }
  };

  useEffect(() => {
    fetchMatches();

    const subscription = supabase
      .channel('matches_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => fetchMatches())
      .subscribe();

    if (route.params?.refresh) {
      fetchMatches();
      navigation.setParams({ refresh: false });
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [route.params?.refresh]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  }, []);

  const ListHeader = () => (
    <View style={styles.header}>
      <View style={styles.welcomeContainer}>
        <MaterialIcons name="sports-soccer" size={32} color={colors.primary} />
        <Text style={styles.welcomeText}>Hoş Geldiniz!</Text>
      </View>
      <Text style={styles.subText}>Yakınınızdaki maçları keşfedin</Text>
      <View style={styles.filterContainer}>
        {['all', 'today', 'week'].map(filter => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterButton, activeFilter === filter && styles.activeFilter]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
              {filter === 'all' ? 'Tümü' : filter === 'today' ? 'Bugün' : 'Bu Hafta'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="sports-soccer" size={64} color={colors.inactive} />
      <Text style={styles.emptyText}>Henüz maç bulunmuyor</Text>
      <Text style={styles.emptySubText}>Yeni bir maç oluşturarak başlayabilirsiniz</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filterMatches()}
        renderItem={({ item }) => <MatchCard match={item} navigation={navigation} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    padding: 20,
    backgroundColor: colors.surfaceLight,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 10,
  },
  subText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.backgroundLight,
    borderRadius: 30,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'transparent',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  activeFilter: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  activeFilterText: {
    color: colors.surfaceLight,
  },
  listContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: colors.inactive,
    marginTop: 8,
    textAlign: 'center',
  },
});