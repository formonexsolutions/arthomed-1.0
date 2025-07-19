import React, { useEffect, useRef, useState } from "react";
import { Dimensions,StyleSheet, Text, TextInput, TouchableOpacity, View, Image, ScrollView, KeyboardAvoidingView, Platform } from "react-native";



const OtpVerify = ({ props, navigation }) => {

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isFocused, setIsFocused] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [timer, setTimer] = useState(60);
    const [resendDisabled, setResendDisabled] = useState(true);


    const et1 = useRef();
    const et2 = useRef();
    const et3 = useRef();
    const et4 = useRef();
    const et5 = useRef();
    const et6 = useRef();

    useEffect(() => {
        startTimer();
    }, []);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setResendDisabled(false);
        }
    }, [timer]);

    const startTimer = () => {
        setTimer(60);
        setResendDisabled(true);
    };

    const sendOtp = async () => {

    };

    const handleOtpChange = (text, index) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        if (text.length >= 1 && index < 5) refs[index + 1]?.current.focus();
        else if (text.length < 1 && index > 0) refs[index - 1]?.current.focus();
    };

    const refs = [et1, et2, et3, et4, et5, et6];

    const verifyOtp = async () => {

    };

    return (

        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={[styles.container]}>
                <View style={styles.header}>
                    <Text style={styles.greeting}>OTP</Text>
                    <Text style={styles.subGreeting}>Enter OTP sent to your Phone Number</Text>
                </View>
                <View style={styles.formContainer}>
                    <View style={styles.form}>
                        <View style={{ justifyContent: 'center', alignItems: 'center', height: 300 }}>
                            <Image source={require('../../images/infographic.png')} style={styles.checkMark} />
                        </View>
                        <Text style={styles.label}>Enter Verification Code</Text>
                        <View style={styles.otp}>
                            {otp.map((_, index) => (
                                <TextInput
                                    key={index}
                                    ref={refs[index]}
                                    style={[styles.inputview, { borderColor: isValid ? '#205998' : isFocused ? '#205998' : '#D1D1D1' }]}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    onFocus={() => setIsFocused(true)}
                                    onChangeText={(text) => handleOtpChange(text, index)}
                                    value={otp[index]}
                                />
                            ))}
                        </View>
                        <TouchableOpacity onPress={verifyOtp} style={styles.button}>
                            <Text style={styles.buttonText}>Continue</Text>
                        </TouchableOpacity>
                        <Text style={styles.infoText}>Didn’t receive an OTP?</Text>
                        <TouchableOpacity disabled={resendDisabled} onPress={() => { sendOtp(); startTimer(); }}>
                            <Text style={[styles.resendText, { color: resendDisabled ? 'gray' : '#205998' }]}>Resend OTP {resendDisabled ? `in ${timer}s` : ''}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

export default OtpVerify;

const styles = StyleSheet.create({
    container: { backgroundColor: '#205998', flex: 1 },
    header: { height: 100, marginLeft: 30 },
    greeting: { fontSize: 14, color: "white", marginTop: 20 },
    subGreeting: { fontSize: 14, color: "white", marginTop: 5 },
    formContainer: { backgroundColor: "white", height: Dimensions.get("screen").height, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    form: { marginHorizontal: "10%" },
    label: { color: '#205998', fontWeight: "500", fontSize: 18, textAlign: 'center' },
    otp: { justifyContent: "center", flexDirection: "row", marginTop: 40 },
    inputview: { width: 43, height: 43, borderWidth: 1, borderRadius: 5, marginLeft: 10, textAlign: "center", fontSize: 18 },
    button: { width: "100%", height: 44, borderRadius: 10, backgroundColor: '#205998', marginTop: 40, justifyContent: "center", alignItems: "center" },
    buttonText: { color: "white", fontWeight: "500", fontSize: 16 },
    infoText: { color: 'rgb(121, 120, 120)', fontSize: 16, marginTop: 40, textAlign: "center" },
    resendText: { fontWeight: '500', fontSize: 15, marginTop: 10, textAlign: "center" }
});
