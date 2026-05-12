import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

export async function salvarProblema(data: any) {
  const docRef = await addDoc(collection(db, "problemas_agricultor"), data);
  return docRef.id;
}