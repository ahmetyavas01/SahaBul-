import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../supabaseClient';
import { MaterialIcons } from '@expo/vector-icons';

const MapScreen = ({ route }) => {
  const defaultLocation = {
    latitude: 41.0082,
    longitude: 28.9784,
  };

  const initialLocation = route.params || defaultLocation;
  
  const [region, setRegion] = useState({
    latitude: initialLocation.latitude,
    longitude: initialLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [matches, setMatches] = useState([]);
  const [mapRef, setMapRef] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setUserLocation(currentLocation.coords);
        
        if (!route.params) {
          setRegion({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      }
    })();
  }, []);

  useEffect(() => {
    fetchMatches();

    const subscription = supabase
      .channel('matches_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => fetchMatches())
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*');

      if (error) {
        console.error('Error fetching matches:', error);
      } else {
        setMatches(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (route.params) {
      setRegion({
        latitude: route.params.latitude,
        longitude: route.params.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [route.params]);

  const goToUserLocation = () => {
    if (userLocation && mapRef) {
      mapRef.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={ref => setMapRef(ref)}
        style={styles.map}
        region={region}
      >
        {route.params && (
          <Marker 
            coordinate={{ 
              latitude: route.params.latitude, 
              longitude: route.params.longitude 
            }} 
            title="Match Location" 
          />
        )}
        {userLocation && (
          <Marker 
            coordinate={userLocation} 
            title="Your Location" 
            pinColor="blue" 
          />
        )}
        {matches.map((match) => (
          <Marker
            key={match.id}
            coordinate={{
              latitude: match.latitude,
              longitude: match.longitude
            }}
            title={match.match_name}
            description={`${match.price}₺ - ${new Date(match.date).toLocaleDateString()}`}
            pinColor="red"
          />
        ))}
      </MapView>
      <TouchableOpacity 
        style={styles.locationButton}
        onPress={goToUserLocation}
      >
        <MaterialIcons name="my-location" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
});

export default MapScreen;