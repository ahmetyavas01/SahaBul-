import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, shadows } from '../theme/colors';

export default function CreateMatchScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [coordinate, setCoordinate] = useState(null);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [price, setPrice] = useState('');
  const [playerCount, setPlayerCount] = useState('');
  const [requiredPosition, setRequiredPosition] = useState('Kaleci');
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapRef, setMapRef] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [mode, setMode] = useState(null);
  const [dateString, setDateString] = useState('');
  const [timeString, setTimeString] = useState('');

  const positions = [
    { label: 'Kaleci', value: 'Kaleci', icon: 'sports-handball' },
    { label: 'Defans', value: 'Defans', icon: 'shield' },
    { label: 'Orta Saha', value: 'Orta Saha', icon: 'sync' },
    { label: 'Forvet', value: 'Forvet', icon: 'sports-soccer' }
  ];

  const handleShowMap = () => {
    if (coordinate) {
      navigation.navigate('Map', {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });
    } else {
      Alert.alert('Hata', 'Lütfen bir konum seçin.');
    }
  };

  const handleCreateMatch = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert('Hata', 'Lütfen giriş yapın.');
        return;
      }

      const matchDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
        time.getHours(), time.getMinutes());

      const { data, error } = await supabase
        .from('matches')
        .insert([
          {
            match_name: title.trim(),
            location: location.trim(),
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            date: matchDateTime.toISOString(),
            players_count: parseInt(playerCount),
            price: parseInt(price),
            required_positions: [requiredPosition],
            user_id: user.id,
            creator_name: user.email.split('@')[0],
          },
        ])
        .select();

      if (error) throw error;

      Alert.alert(
        'Başarılı',
        'Maç başarıyla oluşturuldu!',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.navigate('Home', { refresh: true })
          }
        ]
      );

    } catch (error) {
      console.error('Error:', error);
      Alert.alert(
        'Hata',
        'Maç oluşturulurken bir hata oluştu: ' + error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validateInputs = () => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Lütfen maç başlığını giriniz.');
      return false;
    }
    if (!location.trim() || !coordinate) {
      Alert.alert('Hata', 'Lütfen haritadan konum seçiniz.');
      return false;
    }
    if (!playerCount || parseInt(playerCount) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir oyuncu sayısı giriniz.');
      return false;
    }
    if (!price || parseInt(price) < 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir ücret giriniz.');
      return false;
    }
    return true;
  };

  const showDateTimePicker = (currentMode) => {
    setShowDatePicker(true);
    setMode(currentMode);
  };

  const handleDateTimeChange = (event, selectedValue) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'set') {
      const currentDate = selectedValue || date;
      if (mode === 'date') {
        setDate(currentDate);
        setDateString(currentDate.toLocaleDateString('tr-TR'));
      } else {
        setTime(currentDate);
        setTimeString(currentDate.toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
      }
    }
  };

  const handleSearchLocation = async () => {
    if (searchQuery) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=tr`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          const location = data[0];
          setShowMap(true);
          
          mapRef?.animateToRegion({
            latitude: parseFloat(location.lat),
            longitude: parseFloat(location.lon),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);

          setCoordinate({
            latitude: parseFloat(location.lat),
            longitude: parseFloat(location.lon),
          });
          setLocation(location.display_name);
        } else {
          Alert.alert('Hata', 'Konum bulunamadı.');
        }
      } catch (error) {
        console.error('Arama hatası:', error);
        Alert.alert('Hata', 'Konum aranırken bir hata oluştu.');
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Maç Oluştur</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Maç Başlığı</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Örn: Dostluk Maçı"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Konum</Text>
          <TouchableOpacity 
            style={styles.locationButton} 
            onPress={() => setShowMap(true)}
          >
            <MaterialIcons name="location-on" size={24} color={colors.primary} />
            <Text style={styles.locationText}>
              {location || "Konum Seçin"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tarih ve Saat</Text>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity 
              style={styles.dateTimeButton} 
              onPress={() => showDateTimePicker('date')}
            >
              <MaterialIcons name="calendar-today" size={24} color={colors.primary} />
              <Text style={styles.dateTimeText}>
                {dateString || "Tarih Seçin"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateTimeButton} 
              onPress={() => showDateTimePicker('time')}
            >
              <MaterialIcons name="access-time" size={24} color={colors.primary} />
              <Text style={styles.dateTimeText}>
                {timeString || "Saat Seçin"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Fiyat (₺)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Oyuncu Sayısı</Text>
          <TextInput
            style={styles.input}
            value={playerCount}
            onChangeText={setPlayerCount}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Gerekli Pozisyon</Text>
          <TouchableOpacity 
            style={styles.positionButton}
            onPress={() => setShowPositionModal(true)}
          >
            <MaterialIcons 
              name={positions.find(p => p.value === requiredPosition)?.icon || 'sports-soccer'} 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.positionText}>{requiredPosition}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleCreateMatch}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Oluşturuluyor...' : 'Maç Oluştur'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showMap}
        animationType="slide"
        onRequestClose={() => setShowMap(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowMap(false)}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={24} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Konum ara..."
                onSubmitEditing={handleSearchLocation}
              />
            </View>
          </View>

          <MapView
            ref={ref => setMapRef(ref)}
            style={styles.map}
            initialRegion={{
              latitude: 41.0082,
              longitude: 28.9784,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={(e) => {
              setCoordinate(e.nativeEvent.coordinate);
              setLocation(`${e.nativeEvent.coordinate.latitude}, ${e.nativeEvent.coordinate.longitude}`);
            }}
          >
            {coordinate && (
              <Marker coordinate={coordinate} />
            )}
          </MapView>

          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={() => setShowMap(false)}
          >
            <Text style={styles.confirmButtonText}>Konumu Onayla</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={showPositionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPositionModal(false)}
      >
        <View style={styles.positionModalContainer}>
          <View style={styles.positionModalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowPositionModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Pozisyon Seç</Text>
              <View style={{ width: 24 }} />
            </View>

            {positions.map((position) => (
              <TouchableOpacity
                key={position.value}
                style={[
                  styles.positionOption,
                  position.value === requiredPosition && styles.selectedPosition
                ]}
                onPress={() => {
                  setRequiredPosition(position.value);
                  setShowPositionModal(false);
                }}
              >
                <MaterialIcons 
                  name={position.icon} 
                  size={24} 
                  color={position.value === requiredPosition ? '#2E7D32' : '#666'} 
                />
                <Text style={[
                  styles.positionOptionText,
                  position.value === requiredPosition && styles.selectedPositionText
                ]}>
                  {position.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={mode === 'date' ? date : time}
          mode={mode}
          is24Hour={true}
          display="default"
          onChange={handleDateTimeChange}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    ...shadows.small,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    ...shadows.small,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    ...shadows.small,
  },
  dateTimeText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  positionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    ...shadows.small,
  },
  positionText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    ...shadows.main,
  },
  submitButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 70 : 40,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 160,
  },
  confirmButton: {
    position: 'absolute',
    bottom: 85,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    ...shadows.main,
  },
  confirmButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  positionModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  positionModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  positionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedPosition: {
    backgroundColor: '#f0f9f0',
  },
  positionOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  selectedPositionText: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
});