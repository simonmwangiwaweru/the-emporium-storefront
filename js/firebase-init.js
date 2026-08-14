// Shared Firebase setup — imported by storefront.js and admin.js.
// CDN modular SDK, no bundler. Keep this version string in sync everywhere it's used.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDgK-uYz07OI8yir5AObQrN1VtBlMZ1eMQ",
  authDomain: "the-emporium-b50e5.firebaseapp.com",
  projectId: "the-emporium-b50e5",
  storageBucket: "the-emporium-b50e5.firebasestorage.app",
  messagingSenderId: "605529899512",
  appId: "1:605529899512:web:adbeef206b42cba4b3560d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
