import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView,Modal} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/Ionicons';

const DashBoard = () => {
  const [selectedDate, setSelectedDate] = useState('2025-07-21');
  const [isModalVisible, setModalVisible] = useState(false);
const [selectedSlot, setSelectedSlot] = useState(null);
const [isPatientModalVisible, setPatientModalVisible] = useState(false);

const specialties = [
  { img: require('../../images/s4.png'), title: 'Arthroscopy' },
  { img: require('../../images/s3.png'), title: 'Sports Med.' },
  { img: require('../../images/s2.png'), title: 'Shoulder Sur.' },
  { img: require('../../images/s1.png'), title: 'Joint Repla.' },
];
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../../images/logo2.png')} style={styles.logo} />
        <Icon name="notifications-outline" size={24} color="#fff" style={styles.notificationIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for Doctor, Tests, Appointments..."
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Banner Card */}
      <View style={styles.banner}>
        <View style={{flex:0.6}}>
            <Text style={styles.bannerTitle}>Medical Checks!</Text>
        <Text style={styles.bannerText}>Regular Health Check-Ups Help Prevent Diseases And Ensure A Healthier Future.</Text>
        <TouchableOpacity style={styles.viewMoreBtn}>
          <Text style={styles.viewMoreText}>View More</Text>
        </TouchableOpacity>
         
        </View>
       <View style={{flex:0.4}}>
         <Image source={require('../../images/drimg.png')} style={styles.doctorImage} />
         <Text style={{color:"white",marginTop:5,fontSize:12}}>Dr. RAGHU NAGARAJ</Text>
       </View>
      </View>

      {/* Doctor Specialty */}
      <View style={{marginHorizontal:10,marginVertical:6}}>
        <Text style={styles.sectionTitle}>Doctor Specialty</Text>
        <Text style={{color:"black",fontSize:12}}>Find a Doctor for your Health Problem</Text>
      </View>
      <View style={styles.specialtyContainer}>
        {specialties?.map((item, index) => (
          <TouchableOpacity key={index} style={styles.specialtyCard}>
            <Image source={item.img} style={{width: 60, height: 60, borderRadius: 50}} />
            <Text style={styles.specialtyText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Appointment Options */}
      <View style={styles.appointmentOptions}>
        <TouchableOpacity style={styles.appointmentCard}>
          <Image source={require('../../images/b1.png')} style={styles.appointmentImage} />
          <Text style={styles.appointmentText}>Book In-clinic Appointment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.appointmentCard}>
          <Image source={require('../../images/b2.png')} style={styles.appointmentImage} />
          <Text style={styles.appointmentText}>Online Consultation or Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <View style={{marginHorizontal:10,marginVertical:6}}>
     <Text style={styles.sectionTitle}>Book an Appointment</Text>
      <Text style={{color:"black",fontSize:12}}>Select a date to book an appointment</Text>
      </View>
      <View style={{marginHorizontal:10,marginVertical:6}}>
        <Calendar
        onDayPress={day => {setSelectedDate(day.dateString); 
            
            setModalVisible(true);}}
        markedDates={{
          [selectedDate]: { selected: true, marked: true, selectedColor: '#5B67CA' },
          '2025-07-21': { selected: true, selectedColor: 'green' },
        }}
        theme={{
          selectedDayBackgroundColor: '#5B67CA',
          todayTextColor: '#5B67CA',
          arrowColor: '#5B67CA',
        }}
      />
      <View style={{flexDirection:'row',marginVertical:10}}>
        <View style={{flexDirection:'row',flex:0.3}}>
            <Icon name="square" size={20} color="green"/>
            <Text style={{color:"black",fontSize:14,fontWeight:'500',marginLeft:3}}>Booked</Text>
        </View>
        <View style={{flexDirection:'row'}}>
            <Icon name="square" size={20} color="white"/>
            <Text style={{color:"black",fontSize:14,fontWeight:'500',marginLeft:3}}>Available</Text>
        </View>
      </View>
      </View>
      <Modal
  visible={isModalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <TouchableOpacity
        onPress={() => setModalVisible(false)}
        style={styles.closeButton}
      >
        <Icon name="close" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.modalTitle}>New Appointment</Text>
      <Text style={styles.modalSubtitle}>
  Choose an available Time slot to book your appointment
</Text>

<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical: 10}}>
  {['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map((slot, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.slotButton,
        selectedSlot === slot && styles.selectedSlotButton
      ]}
      onPress={() => setSelectedSlot(slot)}
    >
      <Text
        style={[
          styles.slotText,
          selectedSlot === slot && styles.selectedSlotText
        ]}
      >
        {slot}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>

<TouchableOpacity
  style={styles.nextButton}
  onPress={() => {
    if (selectedSlot) {
      setModalVisible(false);
      setPatientModalVisible(true);
    } else {
      alert('Please select a time slot first.');
    }
  }}
>
  <Text style={styles.nextButtonText}>Next</Text>
</TouchableOpacity>
    </View>
  </View>
</Modal>
<Modal
  visible={isPatientModalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setPatientModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <TouchableOpacity
        onPress={() => setPatientModalVisible(false)}
        style={styles.closeButton}
      >
        <Icon name="close" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.modalTitle}>Patient Details</Text>
      <Text style={styles.modalSubtitle}>
        Manage patient information, including personal details, medical history, and treatment records.
      </Text>

      <TextInput
        placeholder="Enter Name"
        style={styles.inputField}
        placeholderTextColor="#aaa"
      />
      <TextInput
        placeholder="Enter your Mobile Number"
        style={styles.inputField}
        placeholderTextColor="#aaa"
        keyboardType="phone-pad"
      />

      <Text style={{alignSelf: 'flex-start', color: '#555', marginTop: 10}}>Purpose</Text>
      <View style={styles.dropdown}>
        <Text style={{color: '#555'}}>Consultation</Text>
        <Icon name="chevron-down" size={20} color="#555" />
      </View>

      <TouchableOpacity style={styles.uploadBox}>
        <Icon name="image-outline" size={40} color="#5B67CA" />
        <Text style={{color: '#5B67CA'}}>Upload Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.nextButton}>
        <Text style={styles.nextButtonText}>Confirm Booking</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: { backgroundColor: '#5B67CA', padding: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  logo: { width: 150, height: 40, marginBottom: 10 },
  notificationIcon: { position: 'absolute', top: 25, right: 20 },
  searchInput: { backgroundColor: '#fff', borderRadius: 8, padding: 10, marginTop: 10,color:"black" },
  banner: { backgroundColor: '#5B67CA', borderRadius: 12, padding: 10, margin: 10,marginTop:15, position: 'relative',flexDirection:'row',alignItems:"center" },
  bannerTitle: { color: '#fff', fontSize: 16, fontWeight: '500' },
  bannerText: { color: '#fff', marginTop: 5,fontSize:12 },
  viewMoreBtn: { backgroundColor: '#fff', padding: 8, borderRadius: 6, marginTop: 10, alignSelf: 'flex-start' },
  viewMoreText: { color: '#5B67CA', fontWeight: '500' },
  doctorImage: { width: 100, height: 120,borderRadius:20 },
  sectionTitle: { fontSize: 15, fontWeight: '500',color:'black'},
  specialtyContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  specialtyCard: { alignItems: 'center' },
  specialtyText: { marginTop: 5, fontSize: 12, color: '#333' },
  appointmentOptions: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  appointmentCard: { width: '45%', backgroundColor: '#fff', borderRadius: 8, padding: 10, alignItems: 'center', elevation: 3 },
  appointmentImage: { width:'100%', height: 80,marginBottom: 5,borderRadius:10 },
  appointmentText: { textAlign: 'center', fontSize: 12, color: '#333' },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContainer: {
  backgroundColor: '#fff',
  borderRadius: 10,
  width: '85%',
  padding: 20,
  alignItems: 'center',
},
closeButton: {
  alignSelf: 'flex-end',
},
modalTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#5B67CA',
  marginBottom: 10,
},
modalSubtitle: {
  fontSize: 14,
  color: '#555',
  textAlign: 'center',
  marginBottom: 20,
},
slotContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 10,
},
slotButton: {
  backgroundColor: '#5B67CA',
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderRadius: 20,
  margin: 5,
},
slotText: {
  color: '#fff',
  fontWeight: '500',
},
nextButton: {
  backgroundColor: '#5B67CA',
  paddingVertical: 10,
  paddingHorizontal: 40,
  borderRadius: 8,
  marginTop: 20,
},
nextButtonText: {
  color: '#fff',
  fontWeight: '600',
},
inputField: {
  width: '100%',
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 6,
  padding: 10,
  marginVertical: 8,
  color: '#000'
},
dropdown: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 6,
  padding: 10,
  marginVertical: 8,
  width: '100%',
},
uploadBox: {
  borderWidth: 1,
  borderColor: '#5B67CA',
  borderRadius: 6,
  padding: 20,
  alignItems: 'center',
  justifyContent: 'center',
  marginVertical: 10,
  width: '100%',
},
selectedSlotButton: {
  backgroundColor: '#333',
},
selectedSlotText: {
  color: '#fff',
},

});

export default DashBoard;
