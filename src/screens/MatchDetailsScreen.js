import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../supabaseClient';
import * as Location from 'expo-location';

export default function MatchDetailsScreen({ route, navigation }) {
  const { match } = route.params;
  const [creator, setCreator] = useState(null);
  const [locationText, setLocationText] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const maskUsername = (username) => {
    if (!username) return 'Anonim';
    if (username.length <= 5) return username; // Çok kısa isimleri maskeleme
    
    const firstChar = username.charAt(0);
    const lastTwoChars = username.slice(-2);
    const maskedPart = '*'.repeat(Math.min(6, username.length - 3));
    
    return `${firstChar}${maskedPart}${lastTwoChars}`;
  };

  const fetchParticipants = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('match_participants')
        .select(`
          *,
          profiles!match_participants_user_id_fkey (
            username,
            full_name
          )
        `)
        .eq('match_id', match.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Katılımcılar:', data);
      setParticipants(data || []);
    } catch (error) {
      console.error('Katılımcılar alınırken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParticipantStatus = async (participantId, newStatus) => {
    try {
      const { error } = await supabase
        .from('match_participants')
        .update({ status: newStatus })
        .eq('id', participantId);

      if (error) throw error;
      
      Alert.alert(
        'Başarılı',
        newStatus === 'approved' ? 'Katılımcı onaylandı!' : 'Katılımcı reddedildi!'
      );
      
      fetchParticipants();
    } catch (error) {
      console.error('Katılımcı durumu güncellenirken hata:', error);
      Alert.alert('Hata', 'İşlem başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

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
            username: 'Anonim',
            full_name: 'Anonim Kullanıcı',
          });
        } else if (creator) {
          setCreator({
            ...creator,
            username: maskUsername(creator.username),
            full_name: maskUsername(creator.full_name)
          });
        } else {
          setCreator({
            username: 'Anonim',
            full_name: 'Anonim Kullanıcı',
          });
        }
      } catch (error) {
        console.error('Error fetching creator:', error);
      }
    };

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
              address.city,
              address.country
            ].filter(Boolean).join(', ');
            setLocationText(locationString);
          }
        }
      } catch (error) {
        console.error('Konum çözümlenemedi:', error);
        setLocationText(match.location || 'Konum belirtilmedi');
      }
    };

    const checkIfCreator = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const isMatchCreator = user?.id === match.user_id;
      setIsCreator(isMatchCreator);
      if (isMatchCreator) {
        fetchParticipants();
      }
    };

    fetchCreator();
    getLocationName();
    checkIfCreator();
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

  const handleJoinMatch = async () => {
    if (isJoining) return;

    try {
      setIsJoining(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Kullanıcı bilgisi alınamadı:', userError);
        throw new Error('Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.');
      }

      if (!user) {
        Alert.alert('Hata', 'Maça katılmak için giriş yapmalısınız.');
        navigation.navigate('Login');
        return;
      }

      if (match.user_id === user.id) {
        Alert.alert('Bilgi', 'Kendi oluşturduğunuz maça katılamazsınız.');
        return;
      }

      const { data: existingParticipant, error: participantError } = await supabase
        .from('match_participants')
        .select('*')
        .eq('match_id', match.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (participantError) {
        console.error('Katılım kontrolü hatası:', participantError);
        throw new Error(`Katılım durumu kontrol edilemedi: ${participantError.message}`);
      }

      if (existingParticipant) {
        navigation.navigate('Chat', {
          matchId: match.id,
          participantId: existingParticipant.id,
          otherUser: creator
        });
        return;
      }

      const { data: participant, error: joinError } = await supabase
        .from('match_participants')
        .insert([
          {
            match_id: match.id,
            user_id: user.id,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (joinError) throw joinError;

      navigation.navigate('Chat', {
        matchId: match.id,
        participantId: participant.id,
        otherUser: creator
      });

    } catch (error) {
      console.error('Maça katılırken hata:', error);
      Alert.alert(
        'Hata',
        error.message || 'Maça katılırken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.container}>
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
              <MaterialIcons name="directions" size={16} color="#fff" />
              <Text style={styles.directionsText}>Yol Tarifi</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={16} color="#4CAF50" />
              <Text style={styles.infoText}>{locationText}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="access-time" size={16} color="#4CAF50" />
              <Text style={styles.infoText}>{formatDate(match.date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="sports-soccer" size={16} color="#4CAF50" />
              <Text style={styles.infoText}>{match.required_positions?.join(', ')}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="group" size={16} color="#4CAF50" />
              <Text style={styles.infoText}>{match.players_count} Oyuncu</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="attach-money" size={16} color="#4CAF50" />
              <Text style={styles.infoText}>{match.price}₺</Text>
            </View>
          </View>

          <View style={styles.creatorCard}>
            <View style={styles.creatorAvatar}>
              <MaterialIcons name="person" size={18} color="#fff" />
            </View>
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{creator?.username || maskUsername(match.creator_name)}</Text>
              <Text style={styles.creatorDate}>{formatDate(match.created_at)}</Text>
            </View>
          </View>
        </View>

        {isCreator ? (
          <View style={styles.participantsSection}>
            <Text style={styles.sectionTitle}>Katılım İstekleri</Text>
            {isLoading ? (
              <Text style={styles.loadingText}>Yükleniyor...</Text>
            ) : participants.length === 0 ? (
              <Text style={styles.emptyText}>Henüz katılım isteği yok</Text>
            ) : (
              participants.map((participant) => (
                <View key={participant.id} style={styles.participantCard}>
                  <TouchableOpacity 
                    style={styles.participantInfo}
                    onPress={() => navigation.navigate('Chat', {
                      matchId: match.id,
                      participantId: participant.id,
                      otherUser: {
                        username: maskUsername(participant.profiles?.username || 'Anonim')
                      }
                    })}
                  >
                    <Text style={styles.participantName}>
                      {maskUsername(participant.profiles?.username || 'Anonim')}
                    </Text>
                    <Text style={styles.participantStatus}>
                      {participant.status === 'pending' ? 'Bekliyor' : 
                       participant.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                    </Text>
                  </TouchableOpacity>
                  {participant.status === 'pending' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleParticipantStatus(participant.id, 'approved')}
                      >
                        <MaterialIcons name="check" size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleParticipantStatus(participant.id, 'rejected')}
                      >
                        <MaterialIcons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
            onPress={handleJoinMatch}
            disabled={isJoining}
          >
            <Text style={styles.joinButtonText}>
              {isJoining ? 'Katılınıyor...' : 'Maça Katıl'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 12,
  },
  mapCard: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  map: {
    flex: 1,
  },
  directionsButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  directionsText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 12,
  },
  infoCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#B0B0B0',
    flex: 1,
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  creatorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorInfo: {
    marginLeft: 10,
    flex: 1,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  creatorDate: {
    fontSize: 12,
    color: '#808080',
    marginTop: 2,
  },
  joinButton: {
    margin: 12,
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#2D5A2E',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  participantsSection: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  loadingText: {
    color: '#808080',
    textAlign: 'center',
    padding: 12,
  },
  emptyText: {
    color: '#808080',
    textAlign: 'center',
    padding: 12,
  },
  participantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  participantStatus: {
    fontSize: 12,
    color: '#808080',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FF5252',
  },
});