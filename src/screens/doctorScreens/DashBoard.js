import React, { useState, useEffect } from "react";
import {
    Dimensions,
    Image,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    StyleSheet,
    ScrollView,
    Alert,
    Platform,
} from "react-native";
import { doctorSpeciality } from "../../helper/Rawfiles";
import { PrimaryColor } from "../../helper/color";
import BottomToolBar from "../../components/bottomToolBar";
import { useNavigation } from "@react-navigation/native";
import SideMenu from "../../components/drawer";
import CustomCalendar from "../../components/calender";
import Popup from "../../components/modal";
import apiClient from "../../apiClient";
import { endpoints } from "../../helper/ApiEndPoints";
import AsyncStorageObject from "../../lib/AsyncStorage";
import AsyncStorage from "../../helper/AsyncStorage";
import { SelectList } from "react-native-dropdown-select-list";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import RazorpayCheckout from 'react-native-razorpay';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const timing = [
    {
        name: '9:00 AM'
    },
    {
        name: '10:00 AM'
    },
    {
        name: '11:00 AM'
    },
    {
        name: '12:00 PM'
    },
    {
        name: '1:00 PM'
    },
    {
        name: '2:00 PM'
    },
    {
        name: '3:00 PM'
    },
    {
        name: '4:00 PM'
    },
    {
        name: '5:00 PM'
    },
    {
        name: '6:00 PM'
    },
    {
        name: '7:00 PM'
    },
]
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const DashBoard = () => {
    const deviceWidth = Dimensions.get("window").width;
    const itemWidth = (deviceWidth - 50) / 4;
    const navigation = useNavigation();
    const [isSideModalVisible, setSideModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [inModalVisible, setInModalVisible] = useState(false)
    const [Name, setName] = useState();
    const [PhoneNumber, setPhonenumber] = useState();
    const [selectedPaymentMode, setSelectedPaymentMode] = useState('');
    const [paymentModal, setPaymentModal] = useState(false)
    const [Time, setTime] = useState();
    const items = [
        { key: '1', value: 'Consultation' },
        { key: '2', value: 'Followup' },
        { key: '3', value: 'Dressing' },
        { key: '4', value: 'Scanning' },
    ]

    const [selected, setSelected] = useState("");
    useEffect(() => {
        userdata()
    }, [])
    useEffect(() => {
        requestNotificationPermission();
    }, []);

    const requestNotificationPermission = async () => {
        if (!Device.isDevice) {
            Alert.alert('Must use physical device for notifications');
            return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert('Permission not granted for notifications');
        }

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }
    };

    const scheduleLocalNotification = async (data) => {
        const USERNAME = await AsyncStorageObject.getItem(AsyncStorage.USERNAME)
        await Notifications.scheduleNotificationAsync({
            content: {
                title: `🔔 Hello ${USERNAME}!`,
                body: `Thank you for booking Appointment Booked on ${data.date} - ${data.time} from arthomed our doctor will confirm the appointment shortly Thank you`,
                data: { info: 'Arthomed' },
            },
            trigger: { seconds: 5 },
        });
    };
    const MakePayment = async () => {
        const USERNAME = await AsyncStorageObject.getItem(AsyncStorage.USERNAME)
        const PHONENUMBER = await AsyncStorageObject.getItem(AsyncStorage.PHONENUMBER)
        const email = await AsyncStorageObject.getItem(AsyncStorage.EMAIL)

        const options = {
            description: 'Order Payment',
            //   image: 'https://yourlogo.png',
            currency: 'INR',
            key: 'rzp_test_B1yiin6Xj6Y5tY',
            amount: '5000',
            name: 'Arthomed',
            prefill: {
                email: email,
                contact: PHONENUMBER,
                name: USERNAME,
            },
            theme: { color: '#205998' },
        };

        RazorpayCheckout.open(options)
            .then((data) => {
                Appointment()
                navigation.navigate('Viewappointments')

            })
            .catch((error) => {

                alert(`Error: ${error.description}`);
            });
    };


    const toggleModal = () => {
        setSideModalVisible(!isSideModalVisible);
    };
    const [selectedImage, setSelectedImage] = useState([]);

    const openFilePicker = async () => {
        try {
            const options = ["Take Photo", "Pick Image", "Cancel"];
            const selectedOption = await new Promise((resolve) => {
                Alert.alert(
                    "Choose File Type",
                    "Select an option",
                    options.map((option, index) => ({
                        text: option,
                        onPress: () => resolve(index),
                    }))
                );
            });

            if (selectedOption === 0) {
                const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
                if (!cameraPermission.granted) {
                    Alert.alert("Permission Required", "Camera access is needed to take a photo.");
                    return;
                }

                const result = await ImagePicker.launchCameraAsync({
                    allowsEditing: true,
                    quality: 1,
                });

                if (!result.canceled) {
                    setSelectedImage((prev) => [...prev, result.assets[0].uri]);
                }

            } else if (selectedOption === 1) {
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    quality: 1,
                });

                if (!result.canceled) {
                    setSelectedImage((prev) => [...prev, result.assets[0].uri]);
                }

            }

        } catch (error) {
            console.error("Error picking file:", error);
        }
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setIsModalVisible(!isModalVisible)
        console.log("Selected Date:", date);
    };

    const searchAppointment = async (search) => {
         const USER_ID = await AsyncStorageObject.getItem(AsyncStorage.USER_ID)
            await apiClient.get(`${endpoints().appointmentAPI}/patient/${USER_ID}?search=${search}`, (error, response) => {
              console.log(response.data);
              
            })
    }

    const Appointment = async () => {
        const USERNAME = await AsyncStorageObject.getItem(AsyncStorage.USERNAME)
        const USER_ID = await AsyncStorageObject.getItem(AsyncStorage.USER_ID)
        const PHONENUMBER = await AsyncStorageObject.getItem(AsyncStorage.PHONENUMBER)
        let data = {
            date: selectedDate,
            time: Time,
            patient_name: USERNAME,
            patient_id: USER_ID,
            patient_number: PHONENUMBER,
            purpose: selected,
            status: 'Pending',
            photos: 'sdsd',
            advice: 'aaa',
            diet: 'sss',
            exercise: 'dsds'
        }
        await apiClient.post(`${endpoints().appointmentAPI}/create`, data, (error, response) => {
            scheduleLocalNotification(data)
            setInModalVisible(!inModalVisible)
            setPaymentModal(false);
            setIsModalVisible(false)
        })
    }
    const userdata = async () => {
        const phoneNumber = await AsyncStorageObject.getItem(AsyncStorage.PHONENUMBER)
        setPhonenumber(phoneNumber)
        const UserName = await AsyncStorageObject.getItem(AsyncStorage.USERNAME)
        setName(UserName)
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}

            >
                {paymentModal && (
                    <Popup
                        height={Dimensions.get('window').height / 3}
                        isVisible={paymentModal}
                        onClose={() => setPaymentModal(!paymentModal)}
                    >
                        <View style={{ marginHorizontal: 20, marginTop: 30 }}>
                            <Text style={{ color: '#205998', fontWeight: '500', fontSize: 16, textAlign: 'center' }}>
                                Select Payment
                            </Text>

                            <View style={{ marginTop: 30 }}>
                               
                                <TouchableOpacity
                                    onPress={() => MakePayment()}
                                    style={{
                                        padding: 15,
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        borderColor: selectedPaymentMode === 'online' ? '#205998' : '#ccc',
                                        backgroundColor: selectedPaymentMode === 'online' ? '#e6f0fa' : '#fff',
                                        marginBottom: 15,
                                    }}
                                >
                                    <Text style={{ fontSize: 16, color: '#333' }}>💳 Online Payment</Text>
                                </TouchableOpacity>

                             
                                <TouchableOpacity
                                    onPress={() => {
                                        Appointment()
                                        navigation.navigate('Viewappointments')
                                    }}
                                    style={{
                                        padding: 15,
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        borderColor: selectedPaymentMode === 'cash' ? '#205998' : '#ccc',
                                        backgroundColor: selectedPaymentMode === 'cash' ? '#e6f0fa' : '#fff',
                                    }}
                                >
                                    <Text style={{ fontSize: 16, color: '#333' }}>💵 Pay on Cash</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Popup>
                )}


                {inModalVisible && (
                    <Popup height={Dimensions.get('window').height / 1.3} isVisible={inModalVisible} onClose={() => setInModalVisible(!inModalVisible)}>
                        <View style={{ marginHorizontal: 20 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, }}>
                                <Text style={{ color: '#205998', fontWeight: 500, fontSize: 16 }}>Patient Details</Text>

                                <TouchableOpacity onPress={() => setInModalVisible(!inModalVisible)}>
                                    <Image
                                        source={require('../../Images/cross.png')}
                                        style={{ width: 20, height: 20 }}
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ color: '#757575', fontWeight: 500, fontSize: 14, marginTop: 10, textAlign: 'center' }}>Manage patient information, including personal
                                details, medical history, and treatment records.</Text>
                            <View style={styles.formContainer}>
                                <View style={styles.form}>
                                    <Text style={styles.label}>Enter Name</Text>
                                    <TextInput
                                        style={styles.Input}
                                        placeholder="Navya Gupta"
                                        onChangeText={setName}
                                        placeholderTextColor={'#767676'}
                                        value={Name}
                                        editable={false}
                                    />
                                    <Text style={[styles.label, styles.marginTop40]}>Enter Mobile Number</Text>
                                    <View style={styles.phoneInputContainer}>
                                        <Text style={styles.countryCode}>+91</Text>
                                        <TextInput
                                            style={styles.phoneInput}
                                            placeholder="01234567890"
                                            onChangeText={setPhonenumber}
                                            placeholderTextColor={'#767676'}
                                            value={PhoneNumber}
                                            editable={false}
                                        />
                                    </View>
                                    <Text style={[styles.label, styles.marginTop40]}>Purpose </Text>
                                    <SelectList
                                        setSelected={(val) => setSelected(val)}
                                        data={items}
                                        save="value"
                                        boxStyles={{ borderBottomWidth: 1, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderColor: PrimaryColor }}
                                    />
                                    <View>
                                        <Text style={[styles.label, styles.marginTop40]}>Photos</Text>
                                    </View>
                                    <ScrollView horizontal style={{ marginTop: 20 }}>
                                        <View style={styles.imagearea}>

                                            {selectedImage && selectedImage.length > 0 && selectedImage.map((item, index) => (
                                                <Image source={{ uri: item }} style={styles.image} />
                                            ))}
                                            <TouchableOpacity onPress={openFilePicker}>
                                                <Image source={require('../../Images/addphoto.png')} style={styles.image} />
                                            </TouchableOpacity>
                                        </View>
                                    </ScrollView>
                                </View>
                            </View>

                            <TouchableOpacity onPress={() => {
                                setPaymentModal(true)
                            }} style={styles.button}>
                                <Text style={styles.buttonText}>Confirm Booking</Text>
                            </TouchableOpacity>
                        </View>
                    </Popup>
                )
                }
                {isModalVisible && (

                    <Popup height={Dimensions.get('window').height / 2.6} isVisible={isModalVisible} onClose={() => setIsModalVisible(!isModalVisible)}>
                        <View style={{}}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }}>
                                <Text style={{ color: '#205998', fontWeight: 500, fontSize: 16 }}>New Appointment</Text>
                                <TouchableOpacity onPress={() => setIsModalVisible(!isModalVisible)}>
                                    <Image
                                        source={require('../../Images/cross.png')}
                                        style={{ width: 20, height: 20 }}
                                    />
                                </TouchableOpacity>



                            </View>
                            <View style={{ marginTop: 20, marginLeft: 35 }}>
                                <Text style={{ fontSize: 12, fontWeight: 400, color: '#757575' }}>choose an available time to book my next doctor’s
                                    appointment.</Text>
                            </View>


                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 30, marginTop: 30 }}>
                                <Text style={{ color: '#205998', fontWeight: 500, fontSize: 16 }}>Choose Slot</Text>
                                <Image
                                    source={require('../../Images/clock.png')}
                                    style={{ width: 20, height: 20 }}
                                />
                            </View>
                            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 30, marginTop: 30 }}>
                                <View style={{ flexDirection: 'row', gap: 5 }}>
                                    {timing.map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => setTime(item.name)}
                                            style={{ width: 66, height: 30, borderRadius: 50, backgroundColor: Time == item.name ? '#205998' : 'lightgrey', justifyContent: 'center' }}>
                                            <Text style={{ fontSize: 10, fontWeight: '500', color: Time == item.name ? '#FFFFFF' : 'black', textAlign: 'center' }}>
                                                {item.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                            <TouchableOpacity
                                onPress={() => {
                                    setInModalVisible(!inModalVisible)
                                    setIsModalVisible(false)
                                }} style={{ marginTop: 30, width: '90%', height: 44, backgroundColor: '#205998', borderRadius: 10, marginLeft: '5%', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ fontWeight: 700, fontSize: 18, color: '#FFFFFF' }}>Next</Text>

                            </TouchableOpacity>
                        </View>
                    </Popup>
                )}
                <View style={styles.innerContainer}>
                    <View style={styles.headerContainer}>
                        <Image
                            source={require("../../Images/logo.png")}
                            style={styles.logo}
                        />
                        <TouchableOpacity onPress={() => navigation.navigate("Notification")}>
                            <Image
                                source={require("../../Images/notification.png")}
                                style={styles.notificationIcon}
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={()=> navigation.navigate('AppointmentSearch')} style={styles.searchContainer}>
                        <Image
                            source={require("../../Images/search.png")}
                            style={styles.searchIcon}
                        />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search"
                            placeholderTextColor={"#787B80"}
                            onChangeText={searchAppointment}
                            editable={false}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate("DashboardDetail")}
                        activeOpacity={0.8}
                    >
                        {/* <Image
                            source={require('../../Images/doctorImage.jpeg')}
                            style={{width : 120, height :140, position : 'absolute', right : 15, bottom :10, zIndex : 999, borderRadius:10}}
                        /> */}
                        <Image
                            source={require("../../Images/info.png")}
                            style={styles.infoImage}
                        />
                    </TouchableOpacity>

                    <View style={styles.specialityContainer}>
                        <Text style={styles.specialityHeader}>Doctor Speciality</Text>

                        <View style={styles.specialityList}>
                            {doctorSpeciality.map((item, index) => (
                                <View
                                    key={index}
                                    style={[styles.specialityItem, { width: itemWidth }]}
                                >
                                    <View style={styles.specialityIconContainer}>
                                        <Image source={item.image} style={styles.specialityIcon} />
                                    </View>
                                    <Text style={styles.specialityName}>{item.name}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Calendar Component */}
                    <Text style={{ color: '#205998', fontSize: 16, fontWeight: 500 }}>Date and Time</Text>

                    <CustomCalendar onDateSelect={handleDateSelect} />
                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>
            {/* <ExitConfirmationHandler /> */}

            {isSideModalVisible && (
                <SideMenu
                    isModalVisible={isSideModalVisible}
                    setModalVisible={setSideModalVisible}
                    toggleModal={toggleModal}
                />
            )}
            <BottomToolBar toggleModal={toggleModal} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    scrollContent: {
        paddingBottom: 20,
    },
    innerContainer: {
        marginHorizontal: 20,
    },
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
    },
    logo: {
        width: 144,
        height: 46,
        resizeMode: "contain",
    },
    notificationIcon: {
        width: 25,
        height: 25,
        resizeMode: "contain",
    },
    searchContainer: {
        width: "100%",
        height: 48,
        backgroundColor: "lightgrey",
        borderRadius: 8,
        marginTop: 20,
        flexDirection: "row",
        alignItems: "center",
    },
    searchIcon: {
        width: 24,
        height: 24,
        resizeMode: "contain",
        marginLeft: 10,
    },
    searchInput: {
        width: "100%",
        height: 49,
        fontSize: 16,
        fontFamily: "Poppins-Regular",
        color: "#000",
        marginTop: 3,
    },
    infoImage: {
        width: '100%',
        height: 155,
        marginTop: 15,


    },
    specialityContainer: {
        marginTop: 15,
    },
    specialityHeader: {
        fontWeight: "500",
        fontSize: 16,
        color: "#205998",
    },
    specialityList: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 15,
        justifyContent: "space-between",
    },
    specialityItem: {
        alignItems: "center",
        marginBottom: 20,
    },
    specialityIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 60,
        backgroundColor: "#20599833",
        alignItems: "center",
        justifyContent: "center",
    },
    specialityIcon: {
        width: 32,
        height: 32,
    },
    specialityName: {
        color: "#1C1B1F",
        fontSize: 10,
        fontWeight: "400",
        marginTop: 5,
        textAlign: "center",
    },
    //patient details
    formContainer: {
        backgroundColor: 'white',

    },
    form: {
        marginTop: 20,
        marginHorizontal: '10%',
    },
    label: {
        color: PrimaryColor,
        fontWeight: '700',
        fontSize: 16,
    },
    Input: {
        width: '100%',
        height: 40,
        borderBottomWidth: 1,
        borderColor: PrimaryColor,
    },
    marginTop40: {
        marginTop: 20,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        height: 40,
        borderBottomWidth: 1,
        borderColor: PrimaryColor,
    },
    countryCode: {
        color: '#767676',
    },
    phoneInput: {
        width: '100%',
        height: 50,
        marginLeft: 20,
    },
    imagearea: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        gap: 20
    },
    image: {
        width: 70,
        height: 70,
        marginTop: 20,


    },
    button: {
        width: '90%',
        height: 44,
        borderRadius: 10,
        backgroundColor: PrimaryColor,
        marginTop: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 5
    },
    buttonsection: {
        marginRight: 10,
        marginTop: 20,


    },
    buttonarea: {

        backgroundColor: '#B5B5B533',
        borderColor: 'black',
        width: 300,
        height: 100,
        borderRadius: 10,


    },
    buttonarea1: {

        backgroundColor: '#B5B5B533',
        borderColor: 'black',
        width: 300,
        height: 150,
        borderRadius: 10,

    },
    input: {
        color: 'blue',
        height: 45,
        width: 170,
        borderWidth: 1,
        borderRadius: 15,
        marginTop: 10,
        backgroundColor: '#20599833',
        padding: 10,
        borderColor: '#ffff',
        marginLeft: 10
    },
    Button1: {
        backgroundColor: '#205998',
        height: 45,
        width: '30%',
        marginRight: 10,
        borderRadius: 20,
        marginTop: 10,


    },
    Button2: {
        backgroundColor: '#205998',
        height: 45,
        width: '30%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        marginLeft: '65%',
        marginTop: '-10%'

    },

    buttonname: {
        fontSize: 14,
        fontWeight: 'bold',
        padding: 5,
        color: '#205998',
    },

    buttonname1: {
        fontSize: 14,
        fontWeight: 'bold',
        padding: 5,
        color: '#757575',



    },
    buttonContainer1: {
        width: '90%',
        height: 44,
        borderRadius: 10,
        backgroundColor: PrimaryColor,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
});



export default DashBoard;
