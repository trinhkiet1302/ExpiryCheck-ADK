
const firebaseConfig = {
  apiKey: "AIzaSyCqQXlEHMTssZ1QlcE8A5wnlmlEb4h2XKg",
  authDomain: "xpirycheck.firebaseapp.com",
  projectId: "xpirycheck",
  storageBucket: "xpirycheck.firebasestorage.app",
  messagingSenderId: "556664532434",
  appId: "1:556664532434:web:18467b6ddf45665e5fac0b",
  measurementId: "G-FLB518RG8P",
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();