import React, { useEffect, useState } from "react";
import { Dimensions, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Alert, ActivityIndicator, SafeAreaView } from "react-native";



const Login = ({navigation}) => {
    const [email, setEmail] = useState('');
    const [isValid, setIsValid] = useState(true);
    const [isLoginPressed, setIsLoginPressed] = useState(false);

    const validateEmail = (email) => {
        const regex = /^[6789]\d{9}$/;
        return regex.test(email);
    };

   
    const handleEmailChange = (value) => {
        setEmail(value);
        if (validateEmail(value)) {
            setIsValid(true);
            setIsLoginPressed(false);
        } else {
            setIsValid(false);
            setIsLoginPressed(true);
        }
    };

    const loginOnPress = async () => {
       
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={[styles.container]}>
            <View style={styles.header}>
                <Text style={styles.greeting}>{"\t"}Hello,</Text>
                <Text style={styles.subGreeting}>{"\t"}Login Your Account !</Text>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.form}>
                    <Text style={[styles.label, styles.marginTop40]}>Enter Phone number </Text>
                    <View style={[
                        styles.input,
                        {
                            borderColor: isValid ? '#205998' : 'red',
                            backgroundColor: 'white'
                        }
                    ]}>
                        <TextInput
                            style={{ width: '85%' }}
                            placeholder="Enter phone number"
                            placeholderTextColor={'#767676'}
                            value={email}
                            onChangeText={handleEmailChange}
                            keyboardType={'phone-pad'}
                            maxLength={10}
                        />
                        {/* <View style={{ width: 50, height: 50, marginLeft: 30 }}>
                            {isValid && <Image
                                source={require('../../images/Group.png')}
                                style={styles.checkMark}
                            />}
                        </View> */}
                    </View>
                    {email && (
                        <TouchableOpacity 
                            disabled={!isValid || isLoginPressed} 
                            onPress={loginOnPress} 
                            style={[styles.button, { backgroundColor: (!isValid || isLoginPressed) ? 'lightgrey' : '#205998' }]}>
                            {isLoginPressed ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Continue</Text>
                            )}
                        </TouchableOpacity>
                    )}

                    <Text style={styles.infoText}>
                        We will send you{"\n"}one time password ( OTP )
                    </Text>
                </View>
            </View>

            <Text style={styles.footer}>
                Don’t have account? <Text style={styles.registerText} onPress={() => navigation.navigate('CreateAccount')}>Register</Text>
            </Text>
        </View>
        </SafeAreaView>
    );
};

export default Login;

const styles = StyleSheet.create({
    container: {
        backgroundColor:'#205998',
        flex: 1,
    },
    header: {
        height: 100,
       marginHorizontal:20
    },
    greeting: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: 'white',
        marginTop: 20,
    },
    subGreeting: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: 'white',
        marginTop: 5,
    },
    formContainer: {
        backgroundColor: 'white',
        height: Dimensions.get('screen').height,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    form: {
        marginTop: 40,
        marginHorizontal: '10%',
    },
    label: {
        color: '#205998',
        fontWeight: '700',
        fontSize: 16,
    },
    input: {
        width: '100%',
        height: 40,
        borderBottomWidth: 1,
        borderColor:'#205998',
        flexDirection: 'row',
        marginTop: 5,
        justifyContent: 'space-between'
    },
    marginTop40: {
        marginTop: 20,
    },
    button: {
        marginTop : 30,
        width: '100%',
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 18,
    },
    infoText: {
        color:'#205998',
        fontWeight: '500',
        fontSize: 16,
        marginTop: 50,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        color: '#767676',
        fontWeight: '400',
        fontSize: 14,
        left: '25%',
    },
    registerText: {
        fontWeight: '800',
        color:'#205998',
    },
    checkMark: {
        width: 15,
        height: 15,
        marginTop: 10,
    },
});
