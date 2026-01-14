const firebaseConfig = {

  apiKey: "AIzaSyBZaCqhsLGzNjLjgZCsbl43cjazsRR8Mx8",

  authDomain: "absensi-karyawan-e6d95.firebaseapp.com",

  projectId: "absensi-karyawan-e6d95",

  storageBucket: "absensi-karyawan-e6d95.firebasestorage.app",

  messagingSenderId: "498370825132",

  appId: "1:498370825132:web:c3890129ea106fbca58809",

  measurementId: "G-J02NSH9MMQ"

};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Export untuk penggunaan global
window.auth = auth;
window.db = db;
window.storage = storage;
