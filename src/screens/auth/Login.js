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
  SafeAreaView,
  Animated,
  PanResponder,
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

const Login = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const flatListRef = useRef(null);
  
  // Animation values for dragging
  const translateY = useRef(new Animated.Value(0)).current;
  const carouselOpacity = useRef(new Animated.Value(1)).current;
  
  // Initial positions
  const INITIAL_FORM_POSITION = height * 0.55; // Form starts at 55% from top
  const EXPANDED_FORM_POSITION = 0; // Form goes to top of screen
  const SNAP_THRESHOLD = 80;

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

  // PanResponder for drag functionality
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        translateY.setOffset(translateY._value);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow upward dragging
        const newValue = Math.min(0, gestureState.dy);
        const maxDrag = -INITIAL_FORM_POSITION;
        const clampedValue = Math.max(maxDrag, newValue);
        
        translateY.setValue(clampedValue);
        
        // Update carousel opacity based on drag distance
        const dragProgress = Math.abs(clampedValue) / INITIAL_FORM_POSITION;
        carouselOpacity.setValue(1 - dragProgress);
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateY.flattenOffset();
        
        const dragDistance = gestureState.dy;
        
        if (dragDistance < -SNAP_THRESHOLD) {
          // Snap to expanded state (full screen)
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: -INITIAL_FORM_POSITION,
              useNativeDriver: false,
              tension: 80,
              friction: 8,
            }),
            Animated.timing(carouselOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }),
          ]).start();
        } else {
          // Return to original position
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: false,
              tension: 80,
              friction: 8,
            }),
            Animated.timing(carouselOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Fixed Carousel Section */}
        <Animated.View style={[styles.carouselContainer, { opacity: carouselOpacity }]}>
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
        </Animated.View>

        {/* Draggable Form Section - Full Height */}
        <Animated.View 
          style={[
            styles.formContainer,
            {
              transform: [{ translateY }],
            }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle} />
          
          <View style={styles.formContent}>
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
              <Text style={styles.registerBaseText}>Don't have an Account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('CreateAccount')}>
                <Text style={styles.registerText}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4B2EDE',
  },
  container: {
    flex: 1,
    backgroundColor: '#4B2EDE',
  },
  carouselContainer: {
    height: height * 0.55,
    backgroundColor: '#4B2EDE',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  carouselItem: {
    width: width,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: height * 0.06,
    width: width * 0.4,
    // resizeMode: 'contain',
    marginBottom: 15,
  },
  image: {
    width: width * 0.5,
    height: height * 0.25,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  carouselText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 15,
    fontSize: width * 0.04,
    fontWeight: '500',
    paddingHorizontal: 20,
    lineHeight: width * 0.055,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    margin: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    position: 'absolute',
    top: height * 0.55, // Starts at 55% from top
    left: 0,
    right: 0,
    bottom: -height, // Extends below screen to ensure full coverage
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 12,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  welcome: {
    fontSize: width * 0.065,
    fontWeight: 'bold',
    color: '#4B2EDE',
    marginBottom: 8,
    textAlign: 'center',
  },
  subText: {
    fontSize: width * 0.035,
    marginBottom: 10,
    // textAlign: 'center',
    color: 'black',
    lineHeight: width * 0.05,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#e0e0e0',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 2,
    // marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  code: {
    marginRight: 12,
    fontSize: width * 0.04,
    color: '#333',
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: width * 0.04,
    color: '#333',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 10,
    marginTop: 5,
    fontSize: width * 0.035,
    // textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#4B2EDE',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
    shadowColor: '#4B2EDE',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  troubleText: {
    color: '#4B2EDE',
    textDecorationLine: 'underline',
    textAlign: 'center',
    fontSize: width * 0.035,
    marginBottom: 15,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerBaseText: {
    fontSize: width * 0.035,
    color: '#666',
  },
  registerText: {
    color: '#4B2EDE',
    fontWeight: 'bold',
    fontSize: width * 0.035,
  },
});