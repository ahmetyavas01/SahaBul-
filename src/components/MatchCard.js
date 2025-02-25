import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import * as Location from 'expo-location';

export default function MatchCard({ match, navigation }) {
  const [locationText, setLocationText] = useState('');

  useEffect(() => {
    const getLocationName = async () => {
      try {
        if (match.latitude && match.longitude) {
          const result = await Location.reverseGeocodeAsync({
            latitude: parseFloat(match.latitude),
            longitude: parseFloat(match.longitude)
          });

          if (result.length > 0) {
            const address = result[0];
            const locationString = [
              address.district,
              address.city
            ].filter(Boolean).join(', ');
            setLocationText(locationString);
          }
        }
      } catch (error) {
        console.error('Konum çözümlenemedi:', error);
        setLocationText(match.location || 'Konum belirtilmedi');
      }
    };

    getLocationName();
  }, [match]);

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('MatchDetails', { match })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="sports-soccer" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>{match.match_name}</Text>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{match.price}₺</Text>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <MaterialIcons name="location-on" size={16} color={colors.primary} />
          <Text style={styles.infoText}>{locationText}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="event" size={16} color={colors.primary} />
          <Text style={styles.infoText}>
            {new Date(match.date).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long'
            })}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="access-time" size={16} color={colors.primary} />
          <Text style={styles.infoText}>
            {new Date(match.date).toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="people" size={16} color={colors.primary} />
          <Text style={styles.infoText}>{match.players_count} Oyuncu</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  priceTag: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  cardInfo: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 1,
  },
  infoText: {
    color: '#B0B0B0',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.02)'
  }
});