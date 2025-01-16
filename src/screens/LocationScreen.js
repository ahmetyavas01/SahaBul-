import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

export default function LocationScreen() {
  const [location, setLocation] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      fetchNearbyPlaces(currentLocation.coords);
    })();
  }, []);

  const fetchNearbyPlaces = async (coords) => {
    // Burada API çağrısı yaparak veya veritabanından en yakın yerleri alabilirsiniz
    const places = [
      { id: '1', name: 'Park', latitude: coords.latitude + 0.001, longitude: coords.longitude + 0.001 },
      { id: '2', name: 'Restoran', latitude: coords.latitude + 0.002, longitude: coords.longitude + 0.002 },
      // Diğer yerler...
    ];
    setNearbyPlaces(places);
  };

  const handleNavigateToMap = () => {
    if (nearbyPlaces.length > 0) {
      navigation.navigate('MapScreen', { nearbyPlaces });
    } else {
      console.log('No nearby places available');
    }
  };

  return (
    <View>
      <Text>Kullanıcı Konumu: {JSON.stringify(location)}</Text>
      <FlatList
        data={nearbyPlaces}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
          </View>
        )}
      />
      <Button title="Haritaya Git" onPress={handleNavigateToMap} />
    </View>
  );
} 