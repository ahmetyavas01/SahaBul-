import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { supabase } from '../supabaseClient';
import MatchCard from '../components/MatchCard';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import * as Location from 'expo-location';

export default function HomeScreen({ navigation, route }) {
  const [matches, setMatches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [locationName, setLocationName] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  const getLocationName = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Konum izni reddedildi');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      let result = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      if (result.length > 0) {
        const address = result[0];
        const locationText = [
          address.district,
          address.city,
          address.region,
          address.country
        ].filter(Boolean).join(', ');
        setLocationName(locationText || 'Konum bilgisi alınamadı');
      }
    } catch (error) {
      console.error('Konum alınamadı:', error);
      setLocationName('Konum bilgisi alınamadı');
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Dünya'nın yarıçapı (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase.from('matches').select('*').order('created_at', { ascending: true });
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
    let filteredMatches = matches;

    // Önce zaman filtresini uygula
    switch (activeFilter) {
      case 'today':
        filteredMatches = matches.filter(match => new Date(match.date).toDateString() === now.toDateString());
        break;
      case 'week':
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        filteredMatches = matches.filter(match => {
          const matchDate = new Date(match.date);
          return matchDate >= now && matchDate <= nextWeek;
        });
        break;
      case 'nearby':
        if (userLocation) {
          filteredMatches = matches.filter(match => {
            if (!match.latitude || !match.longitude) return false;
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              parseFloat(match.latitude),
              parseFloat(match.longitude)
            );
            return distance <= 10; // 10 km yarıçapındaki maçları göster
          });
        }
        break;
    }

    return filteredMatches;
  };

  useEffect(() => {
    fetchMatches();
    getLocationName();
    const subscription = supabase.channel('matches_channel').on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => fetchMatches()).subscribe();
    if (route.params?.refresh) {
      fetchMatches();
      navigation.setParams({ refresh: false });
    }
    return () => subscription.unsubscribe();
  }, [route.params?.refresh]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchMatches(), getLocationName()]);
    setRefreshing(false);
  }, []);

  const ListHeader = () => (
    <View style={styles.header}>
      <View style={styles.welcomeContainer}> 
        <Text style={styles.welcomeText}>Halısaha Zamanı !</Text>
      </View>
      <Text style={styles.subText}>{locationName ? `${locationName} bölgesindeki maçları keşfet` : 'Yakınındaki Maçları Keşfet ve Katıl'}</Text>
      <View style={styles.filterContainer}>
        {['all', 'nearby', 'today', 'week'].map(filter => (
          <TouchableOpacity 
            key={filter} 
            style={[styles.filterButton, activeFilter === filter && styles.activeFilter]} 
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
              {filter === 'all' ? 'Tümü' 
               : filter === 'today' ? 'Bugün' 
               : filter === 'nearby' ? 'Yakınımda'
               : 'Bu Hafta'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Henüz Maç Yok</Text>
      <Text style={styles.emptySubText}>İlk maçı sen oluştur ve oyuncuları davet et!</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={filterMatches()}
        renderItem={({ item }) => <MatchCard match={item} navigation={navigation} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000'
  },
  header: { 
    paddingTop: 70,
    paddingHorizontal: 12, 
    paddingBottom: 12,
    
    marginBottom: 8
  },
  welcomeContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8
  },
  welcomeText: { 
    fontSize: 24, 
    fontWeight: '600', 
    color: '#FFFFFF', 
    marginLeft: 6
  },
  subText: { 
    fontSize: 12, 
    color: '#808080', 
    marginBottom: 12, 
    lineHeight: 16
  },
  filterContainer: { 
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 2
  },
  filterButton: { 
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginHorizontal: 2
  },
  activeFilter: { 
    backgroundColor: '#4CAF50'
  },
  filterText: { 
    color: '#808080', 
    fontWeight: '500', 
    fontSize: 11,
    textAlign: 'center'
  },
  activeFilterText: { 
    color: '#FFFFFF'
  },
  listContainer: { 
    paddingHorizontal: 12,
    paddingBottom: 16
  },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    marginHorizontal: 12
  },
  emptyText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#FFFFFF', 
    marginTop: 12,
    textAlign: 'center'
  },
  emptySubText: { 
    fontSize: 12, 
    color: '#808080', 
    marginTop: 4, 
    textAlign: 'center', 
    lineHeight: 16,
    paddingHorizontal: 12
  }
});