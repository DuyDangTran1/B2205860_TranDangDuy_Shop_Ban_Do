// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBparw9jne3XCgwaFJnCxEctlcVd4gIusk",
  authDomain: "shop-a4dba.firebaseapp.com",
  projectId: "shop-a4dba",
  storageBucket: "shop-a4dba.firebasestorage.app",
  messagingSenderId: "13847414214",
  appId: "1:13847414214:web:8846eb1dab5640ebce5ec7",
  measurementId: "G-J226SF2CRF",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
