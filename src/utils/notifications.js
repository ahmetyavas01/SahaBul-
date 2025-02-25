import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../supabaseClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  token = (await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PROJECT_ID // Expo projenizin ID'sini buraya ekleyin
  })).data;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });
  }

  // Token'ı kullanıcının profiline kaydet
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', user.id);
  }

  return token;
}

export async function sendPushNotification(userIds, title, body, data = {}) {
  try {
    // Kullanıcıların push token'larını al
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('push_token')
      .in('id', userIds)
      .not('push_token', 'is', null);

    if (error) throw error;

    // Her bir token için bildirim gönder
    const messages = profiles
      .filter(profile => profile.push_token)
      .map(profile => ({
        to: profile.push_token,
        sound: 'default',
        title,
        body,
        data,
      }));

    if (messages.length > 0) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
    }
  } catch (error) {
    console.error('Bildirim gönderilirken hata:', error);
  }
}

// Bildirim dinleyicisini ayarla
export function setupNotifications(navigation) {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    // Bildirim alındığında yapılacak işlemler
    console.log('Bildirim alındı:', notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    // Bildirime tıklandığında yapılacak işlemler
    const data = response.notification.request.content.data;
    
    if (data.matchId && data.participantId) {
      navigation.navigate('Chat', {
        matchId: data.matchId,
        participantId: data.participantId,
        otherUser: data.otherUser
      });
    }
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
} 