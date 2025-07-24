import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([
  {
    "id": "1",
    "title": "Appointment Confirmed",
    "message": "Your booking with Dr. Smith is confirmed.",
    "timestamp": "2023-07-24 10:00 AM"
  },
  {
    "id": "2",
    "title": "Reminder",
    "message": "Don’t forget your appointment tomorrow.",
    "timestamp": "2023-07-23 9:00 AM"
  },
  {
    "id": "3",
    "title": "New Message",
    "message": "You have a new message from Dr. Smith.",
    "timestamp": "2023-07-22 5:00 PM"
  },
  {
    "id": "4",
    "title": "Appointment Canceled",
    "message": "Your appointment with Dr. Smith has been canceled.",
    "timestamp": "2023-07-21 2:00 PM"
  },
  {
    "id": "5",
    "title": "Feedback Request",
    "message": "Please provide feedback on your last appointment.",
    "timestamp": "2023-07-20 11:00 AM"
  },
  {
    "id": "6",
    "title": "New Feature Alert",
    "message": "Check out our new feature in the app!",
    "timestamp": "2023-07-19 3:00 PM"
  }
]);



  const deleteNotification = async (id) => {
    try {
      const filtered = notifications.filter(item => item.id !== id);
      setNotifications(filtered);
    } catch (error) {
      Alert.alert('Error', 'Unable to delete notification');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.rowFront}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.timestamp}>{item.timestamp}</Text>
    </View>
  );

  const renderHiddenItem = (data) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => deleteNotification(data.item.id)}
      >
        <Icon name="delete" size={30} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
        <View style={{ flex:0.1 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#5B67CA" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 0.75,alignItems:'center'}}>
          <Text style={styles.header}>Notifications</Text>
        </View>
      </View>
      <SwipeListView
      showsVerticalScrollIndicator={false}
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-70}
        disableRightSwipe
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 15, paddingHorizontal: 10 },
  header: { fontSize: 20, fontWeight: '500'},
  rowFront: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  title: { fontWeight: '500', fontSize: 16, marginBottom: 4 },
  message: { fontSize: 14, color: '#555' },
  timestamp: { fontSize: 12, color: '#999', marginTop: 6 },
  rowBack: {
    alignItems: 'flex-end',
    backgroundColor: '#e8cac9ff',
    width: '100%',
    borderRadius: 20,
    marginBottom: 10,
  },
  deleteBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: 75,
  },
  deleteText: { color: 'white', fontWeight: 'bold' },
});

export default NotificationScreen;
