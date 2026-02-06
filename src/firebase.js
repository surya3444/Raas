
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// REPLACE THIS WITH YOUR ACTUAL FIREBASE CONFIG FROM THE CONSOLE
const firebaseConfig = {
    apiKey: "AIzaSyAd8kVZEt919GfWvhhstgebLWxgwaunT5o",
    authDomain: "rajchavin-raas.firebaseapp.com",
    projectId: "rajchavin-raas",
    storageBucket: "rajchavin-raas.firebasestorage.app",
    messagingSenderId: "14499629170",
    appId: "1:14499629170:web:1cd21aa2434df98afcdaeb"
};
// 1. Initialize App
const app = initializeApp(firebaseConfig);

// 2. Initialize Services
export const auth = getAuth(app);       // <--- Exports 'auth' for Login
export const db = getFirestore(app);    // <--- Exports 'db' for Database
export const storage = getStorage(app); // <--- Exports 'storage' for Files

export default app;