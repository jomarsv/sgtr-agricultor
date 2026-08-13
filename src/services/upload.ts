import { auth, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 30 * 1024 * 1024;

function nomeSeguro(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-120);
}

export async function uploadArquivo(file: File, problemaId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado para enviar o arquivo.');

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) throw new Error('Formato de mídia não permitido. Envie uma imagem ou um vídeo.');
  if (isImage && file.size > MAX_IMAGE_SIZE) throw new Error('A imagem deve ter no máximo 10 MB.');
  if (isVideo && file.size > MAX_VIDEO_SIZE) throw new Error('O vídeo deve ter no máximo 30 MB.');

  if (!problemaId) throw new Error('O problema precisa ser registrado antes do envio da mídia.');
  const fileRef = ref(storage, `problemas_agricultor/${uid}/${problemaId}/${Date.now()}_${nomeSeguro(file.name)}`);

  await uploadBytes(fileRef, file, { contentType: file.type });

  const url = await getDownloadURL(fileRef);

  return url;
}
