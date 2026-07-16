import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyCSK8POTwUNM9FegMH9N928OhHrhRz6cJU",
  authDomain: "sgtr-plataforma.firebaseapp.com",
  projectId: "sgtr-plataforma",
  storageBucket: "sgtr-plataforma.firebasestorage.app",
  messagingSenderId: "883612105941",
  appId: "1:883612105941:web:6061d320adf00ed7c8365c"
};

const app = initializeApp(firebaseConfig);

if (typeof window == 'undefined') {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(' 6LdA9FUtAAAAAFcwRpAdm4LXwJ7Gpg8z8Ta_1SCy'),
    isTokenAutoRefreshEnabled: true
  })
}

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
