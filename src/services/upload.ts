import { auth, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadArquivo(file: File) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Usuário não autenticado para upload.');
  }

  const sanitizedName = file.name.replace(/[^\w.-]/g, '_');
  const fileRef = ref(storage, `uploads/${uid}/${Date.now()}_${sanitizedName}`);

  await uploadBytes(fileRef, file);

  const url = await getDownloadURL(fileRef);

  return url;
}
