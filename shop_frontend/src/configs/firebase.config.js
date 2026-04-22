import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBparw9jne3XCgwaFJnCxEctlcVd4gIusk",
  authDomain: "shop-a4dba.firebaseapp.com",
  projectId: "shop-a4dba",
  storageBucket: "shop-a4dba.firebasestorage.app",
  messagingSenderId: "13847414214",
  appId: "1:13847414214:web:8846eb1dab5640ebce5ec7",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
