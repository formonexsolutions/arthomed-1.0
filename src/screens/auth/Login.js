import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const sliderData = [
  {
    image: require('../../images/img2.png'),
    text: 'Consult with top doctors anytime, anywhere',
  },
  {
    image: require('../../images/img1.png'),
    text: 'Browse top-rated specialists instantly',
  },
   {
    image: require('../../images/img3.png'),
    text: 'Get expert medical advice at your fingertips',
  },
];

const Login = ({navigation}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const flatListRef = useRef(null);

  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  });

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const renderItem = ({ item }) => (
    <View style={styles.carouselItem}>
      <Image source={require('../../images/logo1.png')} style={styles.logo} />
      <Image source={item.image} style={styles.image} />
      <Text style={styles.carouselText}>{item.text}</Text>
    </View>
  );

  const handleLogin = () => {
    setError('');
    const trimmedPhone = phoneNumber.trim();
    if (trimmedPhone.length < 10 || !/^\d+$/.test(trimmedPhone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    navigation.navigate('OtpVerify', { phone: trimmedPhone });

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Carousel */}
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={sliderData}
              renderItem={renderItem}
              keyExtractor={(_, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewRef.current}
              viewabilityConfig={viewConfigRef.current}
            />
            {/* Dots */}
            <View style={styles.dotsContainer}>
              {sliderData.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activeIndex === index ? styles.activeDot : null,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Auth Form */}
          <View style={styles.formContainer}>
            <Text style={styles.welcome}>Welcome</Text>
            <Text style={styles.subText}>Let's Get Started! Enter Your Mobile Number</Text>

            {/* Mobile Number Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.code}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Mobile Number"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={10}
              />
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.troubleText}>Trouble Signing In?</Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text>Don't have an Account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('CreateAccount')}>
                <Text style={styles.registerText}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4B2EDE',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height, // Ensures minimum height for scrolling
  },
  container: {
    // flex: 1,
    backgroundColor: '#fff',
  },
  carouselContainer: {
    height: height * 0.65,
    backgroundColor: '#4B2EDE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselItem: {
    width: width,
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  logo: {
    height: 90,
    width: 200,
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 250,
    alignSelf: 'center',
  },
  carouselText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    position: 'absolute',
    bottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#bbb',
    margin: 5,
  },
  activeDot: {
    backgroundColor: '#fff',
  },
  formContainer: {
    // flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    minHeight: height * 0.4, // Ensures enough content for scrolling
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B2EDE',
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  code: {
    marginHorizontal: 8,
    fontSize: 16,
    color: '#333',
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  },
  troubleText: {
    color: '#4B2EDE',
    textDecorationLine: 'underline',
    marginVertical: 10,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40, // Add extra bottom margin for better scrolling
  },
  registerText: {
    color: '#4B2EDE',
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#4B2EDE',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});