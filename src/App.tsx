// ===== FIREBASE + UPLOAD + FIRESTORE INTEGRADO =====

// IMPORTS (topo do arquivo)
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { uploadArquivo } from "./services/upload";

// ===== FUNÇÃO PARA SALVAR NO FIRESTORE =====
export async function salvarProblema(problema: any) {
  try {
    await addDoc(collection(db, "problemas_agricultor"), {
      ...problema,
      criadoEm: new Date()
    });
  } catch (error) {
    console.error("Erro ao salvar problema:", error);
  }
}

// ===== FUNÇÃO PRINCIPAL DE ENVIO =====
async function enviarProblema(novoProblema: any) {
  await salvarProblema(novoProblema);
}

// ===== EXEMPLO COMPLETO COM IMAGEM + VÍDEO =====
// IMPORTANTE: fileImagem e fileVideo devem vir do input (ou câmera)

async function handleSubmit(fileImagem: File | null, fileVideo: File | null) {
  try {
    let urlImagem = "";
    let urlVideo = "";

    // Upload da imagem
    if (fileImagem) {
      urlImagem = await uploadArquivo(fileImagem);
    }

    // Upload do vídeo
    if (fileVideo) {
      urlVideo = await uploadArquivo(fileVideo);
    }

    const novoProblema = {
      descricao: "Problema enviado pelo agricultor",
      imagem: urlImagem || null,
      video: urlVideo || null,
      status: "pendente"
    };

    await enviarProblema(novoProblema);

    alert("Problema enviado com sucesso");
  } catch (error) {
    console.error("Erro no envio:", error);
  }
}

// ===== OBSERVAÇÃO =====
// Agora o fluxo está correto:
// 1. Upload imagem/vídeo → Firebase Storage
// 2. Salva URL no Firestore
// 3. App técnico consegue visualizar
