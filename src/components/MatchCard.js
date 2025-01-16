import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function MatchCard({ match, navigation }) {
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('MatchDetails', { match })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="sports-soccer" size={24} color={colors.primary} />
          <Text style={styles.cardTitle}>{match.match_name}</Text>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{match.price}₺</Text>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <MaterialIcons name="location-on" size={20} color={colors.primary} />
          <Text style={styles.infoText}>{match.location}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="event" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            {new Date(match.date).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="access-time" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="people" size={20} color={colors.primary} />
          <Text style={styles.infoText}>{match.players_count} Oyuncu</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  priceTag: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceText: {
    color: colors.text,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cardInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 15,
    marginLeft: 8,
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: 4,
  }
});