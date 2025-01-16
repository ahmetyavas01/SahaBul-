import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';

export default function MatchDetailsScreen({ route, navigation }) {
  const { match } = route.params;
  const [creator, setCreator] = useState(null);

  useEffect(() => {
    const fetchCreator = async () => {
      try {
        const { data: creator, error: creatorError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', match.user_id)
          .maybeSingle();

        if (creatorError) {
          console.error('Error fetching creator:', creatorError);
          setCreator({
            username: 'Unknown',
            full_name: 'Unknown User',
          });
        } else if (creator) {
          setCreator(creator);
        } else {
          setCreator({
            username: 'Unknown',
            full_name: 'Unknown User',
          });
        }
      } catch (error) {
        console.error('Error fetching creator:', error);
      }
    };

    fetchCreator();
  }, [match.user_id]);

  const openMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${match.latitude},${match.longitude}`;
    Linking.openURL(url);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{match.match_name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{match.price}₺</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.mapCard}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: match.latitude,
                longitude: match.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: match.latitude,
                  longitude: match.longitude,
                }}
              />
            </MapView>
            <TouchableOpacity style={styles.directionsButton} onPress={openMaps}>
              <MaterialIcons name="directions" size={20} color="#fff" />
              <Text style={styles.directionsText}>Yol Tarifi</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={20} color="#666" />
              <Text style={styles.infoText}>{match.location}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="access-time" size={20} color="#666" />
              <Text style={styles.infoText}>{formatDate(match.date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="sports-soccer" size={20} color="#666" />
              <Text style={styles.infoText}>{match.required_positions?.join(', ')}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="group" size={20} color="#666" />
              <Text style={styles.infoText}>{match.players_count} Oyuncu</Text>
            </View>
          </View>

          <View style={styles.creatorCard}>
            <View style={styles.creatorAvatar}>
              <MaterialIcons name="person" size={24} color="#fff" />
            </View>
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{match.creator_name}</Text>
              <Text style={styles.creatorDate}>{formatDate(match.created_at)}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.joinButton}>
          <Text style={styles.joinButtonText}>Maça Katıl</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  priceContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  price: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  mapCard: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  directionsButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  directionsText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorInfo: {
    marginLeft: 12,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  creatorDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  joinButton: {
    margin: 16,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});