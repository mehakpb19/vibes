import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, push, serverTimestamp } from "firebase/database";

// Your actual Firebase config keys
const firebaseConfig = {
  apiKey: "AIzaSyD81fnyOYu4x5R2HMRopMYys3KQME2OCx4",
  authDomain: "geet-with-me.firebaseapp.com",
  databaseURL: "https://geet-with-me-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "geet-with-me",
  storageBucket: "geet-with-me.firebasestorage.app",
  messagingSenderId: "16931353809",
  appId: "1:16931353809:web:e2164c5bc586c64d8281f0",
  measurementId: "G-36EES2ZWR4"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const YOUTUBE_API_KEY = "AIzaSyA69yTXVIYhXIJQBKSzxb-4oScsIHauXas";

export { db, ref, onValue, update, push, serverTimestamp };

// Use set() for initial creation to ensure the path exists
export const initializeRoom = (roomId: string, data: Record<string, any>) => {
  const roomRef = ref(db, `rooms/${roomId}`);
  return set(roomRef, {
    ...data,
    updatedAt: serverTimestamp()
  }).catch(err => console.error("Firebase Init Error:", err));
};

// FIXED: Added TypeScript definitions (roomId: string, data: Record<string, any>)
export const syncRoom = (roomId: string, data: Record<string, any>) => {
  const roomRef = ref(db, `rooms/${roomId}`);
  return update(roomRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

// FIXED: Added TypeScript definitions for the message object
export const sendMessage = (roomId: string, message: { text: string; user: string; [key: string]: any }) => {
  const chatRef = ref(db, `rooms/${roomId}/chat`);
  return push(chatRef, {
    ...message,
    timestamp: serverTimestamp()
  }).catch(err => console.error("Firebase Send Error:", err));
};