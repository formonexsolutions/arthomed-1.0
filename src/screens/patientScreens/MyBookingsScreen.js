import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, Dimensions } from 'react-native';

const TABS = ['Upcoming', 'Completed', 'Canceled'];

const MyBookingsScreen = () => {
  const [selectedTab, setSelectedTab] = useState('Upcoming');
  const [bookings, setBookings] = useState([
  {
    "id": "1",
    "date": "May 22, 2023",
    "time": "10:00 AM",
    "status": "upcoming",
    "doctor": {
      "name": "Dr. James Robinson",
      "specialty": "Orthopedic Surgery",
      "clinic": "Elite Ortho Clinic, Goa",
      "image": "https://link-to-image.com/doc1.jpg"
    }
  },
  {
    "id": "2",
    "date": "May 23, 2023",
    "time": "11:00 AM",
    "status": "completed",
    "doctor": {
      "name": "Dr. Sarah Johnson",
      "specialty": "Cardiology",
      "clinic": "Heart Care Clinic, Mumbai",
      "image": "https://link-to-image.com/doc2.jpg"
    }
  },
  {
    "id": "3",
    "date": "May 24, 2023",
    "time": "12:00 PM",
    "status": "canceled",
    "doctor": {
      "name": "Dr. Emily Davis",
      "specialty": "Dermatology",
      "clinic": "Skin Health Clinic, Bangalore",
      "image": "https://link-to-image.com/doc3.jpg"
    }
  },
  {
    "id": "4",
    "date": "May 24, 2023",
    "time": "11:00 AM",
    "status": "upcoming",
    "doctor": {
      "name": "Dr. James Robinson",
      "specialty": "Orthopedic Surgery",
      "clinic": "Elite Ortho Clinic, Goa",
      "image": "https://link-to-image.com/doc1.jpg"
    }
  },
  {
    "id": "5",
    "date": "May 24, 2023",
    "time": "11:00 AM",
    "status": "upcoming",
    "doctor": {
      "name": "Dr. James Robinson",
      "specialty": "Orthopedic Surgery",
      "clinic": "Elite Ortho Clinic, Goa",
      "image": "https://link-to-image.com/doc1.jpg"
    }
  },
  {
    "id": "7",
    "date": "May 24, 2023",
    "time": "11:00 AM",
    "status": "upcoming",
    "doctor": {
      "name": "Dr. James Robinson",
      "specialty": "Orthopedic Surgery",
      "clinic": "Elite Ortho Clinic, Goa",
      "image": "https://link-to-image.com/doc1.jpg"
    }
  },
]);

  
  const handleCancel = (id) => {
    console.log(`Cancel booking ${id}`);
    // API call to cancel
  };

  const handleReschedule = (id) => {
    console.log(`Reschedule booking ${id}`);
    // navigate to reschedule screen
  };

  const filteredBookings = bookings.filter(
    (b) => b.status.toLowerCase() === selectedTab.toLowerCase()
  );

  const renderBookingCard = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.date}>{`${item.date} - ${item.time}`}</Text>
      <View style={styles.doctorRow}>
        <Image source={require('../../images/b2.png')} style={styles.image} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.name}>{item.doctor.name}</Text>
          <Text style={styles.specialty}>{item.doctor.specialty}</Text>
          <Text style={styles.clinic}>{item.doctor.clinic}</Text>
        </View>
      </View>
      {selectedTab === 'Upcoming' ?(
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rescheduleBtn} onPress={() => handleReschedule(item.id)}>
            <Text style={styles.rescheduleText}>Reschedule</Text>
          </TouchableOpacity>
        </View>
      ):(
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.rescheduleBtn, { width: '100%' }]} onPress={() => handleReschedule(item.id)}>
            <Text style={styles.rescheduleText}>Re Book</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1,padding:10}}>
      
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && styles.activeTab
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.activeTabText
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingCard}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No bookings found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-around',
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTab: {
    borderColor: '#007BFF',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  activeTabText: {
    color: '#007BFF',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 14,
    borderRadius: 10,
    elevation: 2,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    height: 60,
    width: 60,
    borderRadius: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  specialty: {
    fontSize: 14,
    color: '#777',
  },
  clinic: {
    fontSize: 13,
    color: '#aaa',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  cancelBtn: {
    paddingVertical: 8,
    width:"48%",
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelText: {
    color: 'black',
  },
  rescheduleBtn: {
    paddingVertical: 8,
    width:"48%",
    alignItems: 'center',
    backgroundColor: '#007BFF',
    borderRadius: 6,
  },
  rescheduleText: {
    color: '#fff',
  },
  
});

export default MyBookingsScreen;
