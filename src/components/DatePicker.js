import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const DatePicker = ({ label, onDateSelect }) => {
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleConfirm = (date) => {
        const formattedDate = formatDate(date);
        setSelectedDate(date);
        onDateSelect(formattedDate);
        hideDatePicker();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.input} onPress={showDatePicker}>
                <Text
                    style={
                        selectedDate ? styles.dateText : styles.placeholderText
                    }
                >
                    {selectedDate
                        ? formatDate(selectedDate)
                        : "Select Date of Birth"}
                </Text>
            </TouchableOpacity>
            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
                maximumDate={new Date()} // ✅ restrict future DOBs
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 15,
    },
    label: {
        color: "black",
        fontSize: 14,
        marginBottom: 5,
    },
    input: {
        width: "100%",
        height: 45,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 7,
        justifyContent: "center",
        paddingHorizontal: 10,
        backgroundColor:'#F9F9F9'
    },
    dateText: {
        color: "black",
        fontSize: 14,
    },
    placeholderText: {
        color: "#767676",
        fontSize: 14,
    },
});

export default DatePicker;
