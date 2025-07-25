import axios from '../axios'
import AsyncStorage from '@react-native-async-storage/async-storage';

const auth = {
  loginWithOtp(data) {
    return new Promise((resolve, reject) => {
      axios
        .post('login-with-otp', data)
        .then(({ data }) => {
          resolve(data);
        })
        .catch(({ response }) => {
          reject(response);
        });
    });
  },
  loginwithsocial(data) {
    return new Promise((resolve, reject) => {
      axios
        .post('social-login', data)
        .then(({ data }) => {
          this.saveToken(data.token);
          resolve(data);
        })
        .catch(({ response }) => {
          reject(response);
        });
    });
  },
  otpVerification(data) {
    return new Promise((resolve, reject) => {
      axios
        .post('otp-verification', data)
        .then(({ data }) => {
          this.saveToken(data.token);
          resolve(data);
        })
        .catch(({ response }) => {
          reject(response);
        });
    });
  },
  logout() {
    return new Promise((resolve, reject) => {
      AsyncStorage.getItem('token').then(value => {
        axios
          .post('logout')
          .then(({ data }) => {
            this.destroyToken();
            resolve(data);
          })
          .catch(({ response }) => {
            reject(response);
          });
      });
    });
  },
  registration(data) {
    return new Promise((resolve, reject) => {
      AsyncStorage.getItem('token').then(value => {
        axios.setToken(value);
        axios
          .post('update-profile', data)
          .then(({ data }) => {
            resolve(data);
          })
          .catch(({ response }) => {
            reject(response);
          });
      });
    });
  },
  mobileAuth(data) {
    return new Promise((resolve, reject) => {
      axios
        .post('mobile-number-authentication', data)
        .then(({ data }) => {
          this.saveToken(data.token);
          resolve(data);
        })
        .catch(({ response }) => {
          reject(response);
        });
    });
  },
  async getToken() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token !== null) {

        return await AsyncStorage.getItem('token');
      } else {

      }
    } catch (error) {

    }
  },
  async saveToken(token) {
    try {
      await AsyncStorage.setItem('token', token);

    } catch (error) {

    }
  },
  destroyToken() {
    AsyncStorage.removeItem('token');
  },
};

export default auth;
