import React, { useRef, useState } from 'react';
import { View, Text, Alert, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, Modal, findNodeHandle, UIManager } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/Ionicons';
import { Dropdown } from 'react-native-element-dropdown';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const defaultData = {
  name: '',
  mobile: '',
  purpose: '',
  photos: [],
}
const DashBoard = () => {
  const [selectedDate, setSelectedDate] = useState();
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isPatientModalVisible, setPatientModalVisible] = useState(false);
  const [formData, setFormData] = useState(defaultData);
const scrollRef = useRef(null);
  const calendarRef = useRef(null);

const scrollToCalendar = () => {
    const scrollViewNode = findNodeHandle(scrollRef.current);
    const calendarNode = findNodeHandle(calendarRef.current);

    if (scrollViewNode && calendarNode) {
      UIManager.measureLayout(
        calendarNode,
        scrollViewNode,
        () => {
          console.warn('measureLayout failed');
        },
        (x, y) => {
          scrollRef.current?.scrollTo({ y, animated: true });
        }
      );
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  const specialties = [
    { img: require('../../images/s4.png'), title: 'Arthroscopy' },
    { img: require('../../images/s3.png'), title: 'Sports Med.' },
    { img: require('../../images/s2.png'), title: 'Shoulder Sur.' },
    { img: require('../../images/s1.png'), title: 'Joint Repla.' },
  ];
  const bookedAppointments = [
    { date: '2025-07-21', time: '10:00 AM' },
    { date: '2025-07-23', time: '2:00 PM' },
    { date: '2025-07-25', time: '4:00 PM' },
  ];

  const purposeOptions = [
    { label: 'Consultation', value: 'consultation' },
    { label: 'Followup', value: 'followup' },
    { label: 'Dressing', value: 'dressing' },
    { label: 'Scanning', value: 'scanning' },
  ];
  const getMarkedDates = () => {
    const marks = {};

    bookedAppointments.forEach(item => {
      marks[item.date] = {
        customStyles: {
          container: {
            backgroundColor: '#4CAF50',
            borderRadius: 8,
          },
          text: {
            color: '#fff',
            fontWeight: '500',
          },
        },
      };
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        customStyles: {
          container: {
            backgroundColor: '#5B67CA',
            borderRadius: 8,
          },
          text: {
            color: '#fff',
            fontWeight: '500',
          },
        },
      };
    }

    return marks;
  };

  const handleUploadPhoto = (indexToReplace = null) => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
    };

    const actions = [
      {
        text: 'Take Photo',
        onPress: () => {
          launchCamera(options, response => {
            if (response.assets && response.assets.length > 0) {
              const base64Data = response.assets[0].base64;
              const newPhoto = `data:${response.assets[0].type};base64,${base64Data}`;
              addOrReplacePhoto(newPhoto, indexToReplace);
            }
          });
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: () => {
          launchImageLibrary(options, response => {
            if (response.assets && response.assets.length > 0) {
              const base64Data = response.assets[0].base64;
              const newPhoto = `data:${response.assets[0].type};base64,${base64Data}`;
              addOrReplacePhoto(newPhoto, indexToReplace);
            }
          });
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ];

    Alert.alert('Upload Photo', 'Choose an option', actions);
  };

  const addOrReplacePhoto = (newPhoto, indexToReplace) => {
    const updatedPhotos = [...formData.photos];
    if (indexToReplace !== null) {
      updatedPhotos[indexToReplace] = newPhoto;
    } else {
      if (updatedPhotos.length >= 4) {
        alert('Max 4 photos allowed');
        return;
      }
      updatedPhotos.push(newPhoto);
    }
    setFormData(prev => ({ ...prev, photos: updatedPhotos }));
  };

  const handleDeletePhoto = index => {
    const updatedPhotos = formData.photos.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, photos: updatedPhotos }));
  };

  const handleConfirmBooking = async () => {
    const { name, mobile, purpose, photos } = formData;

    if (!name || !mobile || !purpose || photos.length === 0 || !selectedDate || !selectedSlot) {
      Alert.alert('Error', 'Please complete all required fields.');
      return;
    }

    const payload = {
      ...formData,
      mobile: `+91${formData.mobile}`,
      date: selectedDate,
      slot: selectedSlot,
    };
    console.log('Booking Payload:', payload);

    // API call with payload
  };

  return (
    <ScrollView style={styles.container} ref={scrollRef} >
      {/* Header */}
      <View style={styles.header}>
        {/* <Image source={require('../../images/logo2.png')} style={styles.logo} />
        <Icon name="notifications-outline" size={24} color="#fff" style={styles.notificationIcon} /> */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search for Doctor, Tests, Appointments..."
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Banner Card */}
      <View style={styles.banner}>
        <View style={{ flex: 0.6 }}>
          <Text style={styles.bannerTitle}>Medical Checks!</Text>
          <Text style={styles.bannerText}>Regular Health Check-Ups Help Prevent Diseases And Ensure A Healthier Future.</Text>
          <TouchableOpacity style={styles.viewMoreBtn}>
            <Text style={styles.viewMoreText}>View More</Text>
          </TouchableOpacity>

        </View>
        <View style={{ flex: 0.4 }}>
          <Image source={require('../../images/drimg.png')} style={styles.doctorImage} />
          <Text style={{ color: "white", marginTop: 5, fontSize: 12 }}>Dr. RAGHU NAGARAJ</Text>
        </View>
      </View>

      {/* Doctor Specialty */}
      <View style={{ marginHorizontal: 10, marginVertical: 6 }}>
        <Text style={styles.sectionTitle}>Doctor Specialty</Text>
        <Text style={{ color: "black", fontSize: 12 }}>Find a Doctor for your Health Problem</Text>
      </View>
      <View style={styles.specialtyContainer}>
        {specialties?.map((item, index) => (
          <TouchableOpacity key={index} style={styles.specialtyCard}>
            <Image source={item.img} style={{ width: 60, height: 60, borderRadius: 50 }} />
            <Text style={styles.specialtyText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Appointment Options */}
      <View style={styles.appointmentOptions}>
        <TouchableOpacity style={styles.appointmentCard} onPress={scrollToCalendar}>
          <Image source={require('../../images/b1.png')} style={styles.appointmentImage} />
          <Text style={styles.appointmentText}>Book In-clinic Appointment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.appointmentCard}>
          <Image source={require('../../images/b2.png')} style={styles.appointmentImage} />
          <Text style={styles.appointmentText}>Online Consultation or Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <View style={{ marginHorizontal: 10, marginVertical: 6 }}>
        <Text style={styles.sectionTitle}>Book an Appointment</Text>
        <Text style={{ color: "black", fontSize: 12 }}>Select a date to book an appointment</Text>
      </View>
      <View style={{ marginHorizontal: 10, marginVertical: 6 }} ref={calendarRef} collapsable={false}>
        <Calendar
          markingType={'custom'}
          markedDates={getMarkedDates()}
          minDate={new Date()}
          onDayPress={day => {
            setSelectedDate(day.dateString);
            setModalVisible(true);
          }}
          theme={{
            todayTextColor: '#5B67CA',
            arrowColor: '#5B67CA',
          }}
        />
        <View style={{ flexDirection: 'row', marginVertical: 10 }}>
          <View style={{ flexDirection: 'row', flex: 0.3 }}>
            <Icon name="square" size={20} color="green" />
            <Text style={{ color: "black", fontSize: 14, fontWeight: '500', marginLeft: 3 }}>Booked</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Icon name="square" size={20} color="white" />
            <Text style={{ color: "black", fontSize: 14, fontWeight: '500', marginLeft: 3 }}>Available</Text>
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

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
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
            <Text style={{ alignSelf: 'flex-start', color: '#555', marginTop: 5 }}>Patient Name</Text>
            <TextInput
              placeholder="Enter Name"
              style={styles.inputField}
              placeholderTextColor="#aaa"
              value={formData.name}
              onChangeText={value => handleInputChange('name', value)}
            />
            <Text style={{ alignSelf: 'flex-start', color: '#555', marginTop: 5 }}>Mobile Number</Text>
            <View style={styles.mobileInputWrapper}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                placeholder="Enter your Mobile Number"
                style={styles.mobileInput}
                placeholderTextColor="#aaa"
                value={formData.mobile}
                onChangeText={value => handleInputChange('mobile', value)}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <Text style={{ alignSelf: 'flex-start', color: '#555', marginTop: 10 }}>Purpose</Text>
            <Dropdown
              style={styles.dropdowns}
              containerStyle={styles.dropdownContainer}
              data={purposeOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Purpose"
              search
              searchPlaceholder="Search..."
              value={formData.purpose}
              onChange={item => handleInputChange('purpose', item.value)}
              renderLeftIcon={() => (
                <Icon name="search" size={18} color="#555" style={{ marginRight: 8 }} />
              )}
              renderRightIcon={() => (
                <Icon name="chevron-down" size={20} color="#555" />
              )}
            />

            <View style={styles.photoGrid}>
              {formData?.photos.map((photo, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <TouchableOpacity onPress={() => handleUploadPhoto(index)}>
                    <Image
                      source={{ uri: photo }}
                      style={styles.photoItem}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteIcon}
                    onPress={() => handleDeletePhoto(index)}
                  >
                    <Icon name="close-circle" size={20} color="#ff4d4f" />
                  </TouchableOpacity>
                </View>
              ))}

              {formData?.photos.length < 4 && (
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={() => handleUploadPhoto()}
                >
                  <Icon name="image-outline" size={30} color="#5B67CA" />
                  <Text style={{ color: '#5B67CA', fontSize: 12 }}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>


            <TouchableOpacity style={styles.nextButton} onPress={handleConfirmBooking}>
              <Text style={styles.nextButtonText}>Confirm Booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { backgroundColor: '#5B67CA', paddingHorizontal:15, borderBottomLeftRadius: 20, borderBottomRightRadius: 20,paddingBottom:25 },
  logo: { width: 150, height: 40, marginBottom: 10 },
  notificationIcon: { position: 'absolute', top: 25, right: 20 },
  searchInput: { backgroundColor: '#fff', borderRadius: 8, padding: 10,color: "black" },
  banner: { backgroundColor: '#5B67CA', borderRadius: 12, padding: 10, margin: 10, marginTop: 15, position: 'relative', flexDirection: 'row', alignItems: "center" },
  bannerTitle: { color: '#fff', fontSize: 16, fontWeight: '500' },
  bannerText: { color: '#fff', marginTop: 5, fontSize: 12 },
  viewMoreBtn: { backgroundColor: '#fff', padding: 8, borderRadius: 6, marginTop: 10, alignSelf: 'flex-start' },
  viewMoreText: { color: '#5B67CA', fontWeight: '500' },
  doctorImage: { width: 100, height: 120, borderRadius: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '500', color: 'black' },
  specialtyContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  specialtyCard: { alignItems: 'center' },
  specialtyText: { marginTop: 5, fontSize: 12, color: '#333' },
  appointmentOptions: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  appointmentCard: { width: '45%', backgroundColor: '#fff', borderRadius: 8, padding: 10, alignItems: 'center', elevation: 3 },
  appointmentImage: { width: '100%', height: 80, marginBottom: 5, borderRadius: 10 },
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
    width: '90%',
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
    // paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
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
    marginVertical: 6,
    color: 'black'
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

  selectedSlotButton: {
    backgroundColor: '#333',
  },
  selectedSlotText: {
    color: '#fff',
  },
  dropdowns: {
    height: 40,
    marginTop: 5,
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  dropdownContainer: {
    borderRadius: 6,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginVertical: 10,
    gap: 10,
    width: '100%',
  },
  photoItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 5,
  },
  uploadBox: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: '#5B67CA',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  deleteIcon: {
    position: 'absolute',
    top: -4,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  mobileInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 5,
    height: 45,
  },

  countryCode: {
    color: '#333',
    fontSize: 16,
    marginRight: 6,
  },

  mobileInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },


});

export default DashBoard;
