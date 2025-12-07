import * as firebaseApp from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD50a8VsCsgZwEZOBWl6hiqwn2wy-Nf-Xs",
  authDomain: "codesphere-35dae.firebaseapp.com",
  projectId: "codesphere-35dae",
  storageBucket: "codesphere-35dae.firebasestorage.app",
  messagingSenderId: "81768316898",
  appId: "1:81768316898:web:d42fcebdbdfa4b339c43bb",
  measurementId: "G-PYW815JT1Y"
};

// Use namespace import compatibility or singleton pattern to avoid re-initialization
const app = firebaseApp.getApps().length > 0 ? firebaseApp.getApp() : firebaseApp.initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);