import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDvWJf_LH3KQoVfUNFXLeznv05icGNdTr4",
  authDomain: "zta-allenamento.firebaseapp.com",
  projectId: "zta-allenamento",
  storageBucket: "zta-allenamento.firebasestorage.app",
  messagingSenderId: "825289687261",
  appId: "1:825289687261:web:25f087a657f55146095b34",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Persist login across browser close/reopen and iOS PWA restarts
setPersistence(auth, browserLocalPersistence);
export const db = getFirestore(app);
