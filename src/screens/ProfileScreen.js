import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const userStats = {
    totalMatches: 15,
    goalsScored: 8,
    assists: 5,
    rating: 4.5,
  };

  const userMatches = [
    {
      id: '1',
      title: 'Dostluk Maçı',
      date: '20 Nisan 2024',
      location: 'Florya Halı Saha',
      status: 'upcoming',
    },
    {
      id: '2',
      title: 'Haftalık Maç',
      date: '15 Nisan 2024',
      location: 'Beşiktaş Halı Saha',
      status: 'completed',
    },
  ];

  const renderMatchItem = (match) => (
    <TouchableOpacity 
      key={match.id}
      style={styles.matchItem}
      onPress={() => navigation.navigate('MatchDetails', { match })}
    >
      <View style={styles.matchInfo}>
        <Text style={styles.matchTitle}>{match.title}</Text>
        <Text style={styles.matchDate}>{match.date}</Text>
        <Text style={styles.matchLocation}>{match.location}</Text>
      </View>
      <MaterialIcons 
        name="chevron-right" 
        size={24} 
        color="#666"
      />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Image
            style={styles.profileImage}
            source={{ uri: 'https://via.placeholder.com/100' }}
          />
          <TouchableOpacity style={styles.editButton}>
            <MaterialIcons name="edit" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>Ahmet Yavaş</Text>
        <Text style={styles.userPosition}>Forvet</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.totalMatches}</Text>
          <Text style={styles.statLabel}>Maç</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.goalsScored}</Text>
          <Text style={styles.statLabel}>Gol</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.assists}</Text>
          <Text style={styles.statLabel}>Asist</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.rating}</Text>
          <Text style={styles.statLabel}>Puan</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Yaklaşan Maçlarım</Text>
        {userMatches
          .filter(match => match.status === 'upcoming')
          .map(renderMatchItem)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Geçmiş Maçlarım</Text>
        {userMatches
          .filter(match => match.status === 'completed')
          .map(renderMatchItem)}
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <MaterialIcons name="logout" size={24} color="#fff" />
        <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#2E7D32',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userPosition: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  matchDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  matchLocation: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#d32f2f',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 