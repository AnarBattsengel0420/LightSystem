import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCitMme4KdBJnDNzXOAq0is11LH9jKGI68",
  authDomain: "light-system-b1c66.firebaseapp.com",
  projectId: "light-system-b1c66",
  storageBucket: "light-system-b1c66.appspot.com",
  messagingSenderId: "1086172143695",
  appId: "1:1086172143695:web:f3638567bd3d5d5c88ca3a",
  databaseURL: "https://light-system-b1c66-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
console.log("Firebase initialized", app);

export const auth = getAuth(app);
export const db = getDatabase(app);
