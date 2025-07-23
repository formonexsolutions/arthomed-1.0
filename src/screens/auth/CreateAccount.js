import React, { useState, useCallback } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import DatePicker from "../../components/DatePicker";

const defaultData = {
    name: "",
    email: "",
    phone: "+91", 
    dob: "",
    gender: "",
};

const CreateAccount = ({ navigation }) => {
    const [formData, setFormData] = useState(defaultData);
    const [errors, setErrors] = useState({});
    const genderOptions = [
        { key: "1", value: "Female" },
        { key: "2", value: "Male" },
        { key: "3", value: "Others" },
    ];

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: null });
        }
    };

    const validate = () => {
        const { name, email, phone, dob, gender } = formData;
        const phoneDigits = phone.replace("+91", "");
        const newErrors = {};

        if (!/^[A-Za-z]{2,}$/.test(name)) {
            newErrors.name = "Enter a valid name (only alphabets, min 2 characters)";
        }
        if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            newErrors.email = "Enter a valid email address";
        }
        if (!/^[6789]\d{9}$/.test(phoneDigits)) {
            newErrors.phone = "Enter a valid 10-digit Indian mobile number";
        }
        if (!dob) {
            newErrors.dob = "Select date of birth";
        }
        if (!gender) {
            newErrors.gender = "Select gender";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = useCallback(() => {
        if (!validate()) return;

        const payload = {
            ...formData,
            role: "2",
        };

        console.log("Submitting:", payload);
        navigation.navigate("OtpVerify", { phone: formData.phone });
        // API call logic here (uncomment when API ready)
        // await apiClient.post(`${endpoints().userAPI}/register`, payload, (error, response) => {
        //     if (response) {
        //         navigation.navigate("OTP", { email: formData.phone });
        //     } else {
        //         Toast.show(error.response.data.message, Toast.LONG);
        //     }
        // });
    }, [formData]);

    return (
         <ScrollView  bounces={false} style={{ flexGrow: 1, }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Register</Text>
                <Text style={styles.subGreeting}>Create Your Account!</Text>
            </View>
            <View style={styles.formContainer}>
        
                    <View style={styles.form}>
                        {/* Name Field */}
                        <Text style={styles.label}>Enter Name</Text>
                        <TextInput
                            style={[styles.input, errors.name && styles.inputError]}
                            placeholder="Enter Name"
                            placeholderTextColor="#767676"
                            onChangeText={(val) => handleChange("name", val)}
                            value={formData.name}
                        />
                        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                        {/* Email Field */}
                        <Text style={styles.label}>Enter Email Address</Text>
                        <TextInput
                            style={[styles.input, errors.email && styles.inputError]}
                            placeholder="enter@gmail.com"
                            placeholderTextColor="#767676"
                            onChangeText={(val) => handleChange("email", val)}
                            value={formData.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                        {/* Phone Field */}
                        <Text style={styles.label}>Enter Phone Number</Text>
                        <View style={styles.phoneInputContainer}>
                            <Text style={styles.countryCode}>+91</Text>
                            <TextInput
                                style={[
                                    styles.phoneInput,
                                    errors.phone && styles.inputError,
                                ]}
                                placeholder="0123456789"
                                placeholderTextColor="#767676"
                                onChangeText={(val) =>
                                    handleChange(
                                        "phone",
                                        "+91" + val.replace(/[^0-9]/g, "")
                                    )
                                }
                                value={formData.phone.replace("+91", "")}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                        </View>
                        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

                        {/* DOB Picker */}
                        <DatePicker
                            label="Date of Birth"
                            onDateSelect={(formattedDate) => {
                                handleChange("dob", formattedDate);
                            }}
                        />
                        {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}

                        {/* Gender Select */}
                        <Text style={styles.label}>Gender</Text>
                        <SelectList
                            setSelected={(val) => handleChange("gender", val)}
                            data={genderOptions}
                            save="value"
                            boxStyles={styles.selectBox}
                        />
                        {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}

                        {/* Register Button */}
                        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                            <Text style={styles.buttonText}>Register</Text>
                        </TouchableOpacity>

                        <Text style={styles.footer}>
                            Already have an account?{" "}
                            <Text
                                onPress={() => navigation.navigate("Login")}
                                style={styles.loginText}
                            >
                                Login
                            </Text>
                        </Text>
                    </View>
               
            </View>
        </View>
        </ScrollView>
    );
};

export default CreateAccount;

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#4B2EDE",
        flex: 1,
    },
    header: {
        height: 100,
        marginHorizontal: 20,
        justifyContent: "center",
    },
    greeting: {
        fontFamily: "Poppins-Medium",
        fontSize: 15,
        color: "white",
    },
    subGreeting: {
        fontFamily: "Poppins-Regular",
        fontSize: 15,
        color: "white",
        marginTop: 5,
    },
    formContainer: {
        backgroundColor: "white",
        flex: 1,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    form: {
        marginVertical: 20,
        marginHorizontal: 20,
        flex:1
    },
    label: {
        color: "black",
        // fontWeight: "500",
        fontSize: 14,
        marginTop: 20,
    },
    input: {
        width: "100%",
        
        borderWidth: 1,
        marginTop:5,
        borderRadius:7,
        borderColor: "black",
    },
    inputError: {
        borderColor: "red",
    },
    errorText: {
        color: "red",
        fontSize: 12,
        marginTop: 5,
    },
    phoneInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        borderBottomWidth: 1,
        borderColor: "#4B2EDE",
    },
    countryCode: {
        color: "#767676",
        marginRight: 5,
    },
    phoneInput: {
        flex: 1,
        height: 40,
    },
    selectBox: {
        borderBottomWidth: 1,
        borderColor: "#4B2EDE",
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
    },
    button: {
        width: "100%",
        height: 44,
        borderRadius: 10,
        backgroundColor: "#4B2EDE",
        marginTop: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontWeight: "500",
        fontSize: 16,
    },
    footer: {
        textAlign: "center",
        color: "#767676",
        fontWeight: "400",
        fontSize: 14,
        marginTop: 30,
    },
    loginText: {
        fontWeight: "500",
        color: "#4B2EDE",
    },
});
