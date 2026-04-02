import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { uploadArquivo } from './services/upload';

type TelaKey = 'inicio' | 'problemas' | 'visitas' | 'locktec' | 'status' | 'perfil';

type Problema = {
  id: string;
  titulo: string;
  categoria: string;
  descricao: string;
  prioridade: string;
  localizacao: string;
  data: string;
  status: string;
  beneficiarioId?: string;
  beneficiarioNome?: string;
  uidCriador?: string;
  imagem?: string;
  nomeImagem?: string;
  video?: string;
  nomeVideo?: string;
};

type SolicitacaoVisita = {
  id: string;
  motivo: string;
  dataPreferida: string;
  turno: string;
  observacoes: string;
  status: string;
  dataSolicitacao: string;
  beneficiarioId?: string;
  beneficiarioNome?: string;
  uidCriador?: string;
};

type UsuarioAgricultor = {
  uid: string;
  nome: string;
  perfil: 'agricultor';
  cpf?: string;
  cpfMasked?: string;
  beneficiarioId?: string;
  macroRegiaoId?: string;
  ativo: boolean;
  ultimoLoginEm?: any;
};

type BeneficiarioVinculado = {
  id: string;
  nome: string;
  comunidade?: string;
  municipio?: string;
  macroRegiaoId?: string;
  telefone?: string;
  cpf?: string;
  tecnico?: string;
  status?: string;
  statusCadastro?: 'rascunho' | 'pendente_validacao' | 'aprovado' | 'rejeitado' | 'aguardando_correcao' | 'inativo';
};

const JARILO_URL = 'https://www.jarilo.com.br/questions/question/3d1a5e16-c489-4819-925e-89e45c32425c/details';

const colors = {
  bg: '#eef4ea',
  sidebar: '#1f4d2b',
  sidebarSoft: '#2f6a3e',
  primary: '#2f7a3c',
  primaryDark: '#1d4f2c',
  primarySoft: '#dce9d8',
  text: '#172117',
  muted: '#5d6e61',
  border: '#d7e1d2',
  card: '#ffffff',
  chip: '#f6f1e7'
};

function cardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: colors.card,
    borderRadius: 24,
    padding: 22,
    boxShadow: '0 8px 22px rgba(31, 77, 43, 0.08)',
    ...extra
  };
}

function Badge({ text, tone = 'default' }: { text: string; tone?: 'default' | 'success' | 'warning' }) {
  let background = colors.primarySoft;
  let color = colors.primaryDark;
  if (tone === 'success') {
    background = '#d8ecd5';
    color = '#24522d';
  }
  if (tone === 'warning') {
    background = '#f2e7c1';
    color = '#8a5a1d';
  }
  return <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background, color }}>{text}</span>;
}

function Input({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.border}`, borderRadius: 16, padding: '14px 16px', fontSize: 14, background: '#fff', color: colors.text, outline: 'none' }}
      />
    </div>
  );
}

function Area({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 140, border: `1px solid ${colors.border}`, borderRadius: 18, padding: 16, fontSize: 14, resize: 'vertical', background: '#fff', color: colors.text, outline: 'none' }}
      />
    </div>
  );
}

function ActionButton({ text, onClick, secondary = false }: { text: string; onClick?: () => void; secondary?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', borderRadius: 18, border: secondary ? `1px solid ${colors.border}` : 'none', background: secondary ? '#fff' : colors.primary, color: secondary ? colors.primaryDark : '#fff', padding: '14px 16px', fontWeight: 700, cursor: 'pointer' }}
    >
      {text}
    </button>
  );
}

function ProblemImage({ src, fileName }: { src?: string; fileName?: string }) {
  if (!src) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <img src={src} alt={fileName || 'Imagem enviada'} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 16, border: `1px solid ${colors.border}` }} />
      {fileName && <div style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>{fileName}</div>}
    </div>
  );
}

function ProblemVideo({ src, fileName }: { src?: string; fileName?: string }) {
  if (!src) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <video controls style={{ width: '100%', maxHeight: 260, borderRadius: 16, border: `1px solid ${colors.border}`, background: '#000' }}>
        <source src={src} />
        Seu navegador não suporta vídeo incorporado.
      </video>
      {fileName && <div style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>{fileName}</div>}
    </div>
  );
}

function formatarCpf(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  if (!numeros) return '';
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  if (numeros.length <= 9) return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
}

function cpfParaEmailInterno(cpfFormatado: string) {
  const numeros = cpfFormatado.replace(/\D/g, '');
  return `${numeros}@sgtr.app`;
}

function descricaoStatusCadastro(status?: BeneficiarioVinculado['statusCadastro']) {
  switch (status) {
    case 'aprovado':
      return 'Cadastro aprovado e liberado para atendimento.';
    case 'pendente_validacao':
      return 'Cadastro aguardando validação do administrativo.';
    case 'aguardando_correcao':
      return 'Cadastro aguardando correção pela equipe técnica.';
    case 'rejeitado':
      return 'Cadastro rejeitado. Procure a equipe responsável.';
    case 'inativo':
      return 'Cadastro inativo no momento.';
    case 'rascunho':
    default:
      return 'Cadastro em rascunho ou sem status definido.';
  }
}

function bloquearInteracaoAgricultor(status?: BeneficiarioVinculado['statusCadastro']) {
  return status === 'rejeitado' || status === 'inativo' || status === 'aguardando_correcao';
}

export default function App() {
  const [active, setActive] = useState<TelaKey>('visitas');
  const [usuarioSistema, setUsuarioSistema] = useState<UsuarioAgricultor | null>(null);
  const [beneficiarioVinculado, setBeneficiarioVinculado] = useState<BeneficiarioVinculado | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ cpf: '', senha: '' });
  const [loginMsg, setLoginMsg] = useState('');
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoVisita[]>([]);
  const [firebaseStatus, setFirebaseStatus] = useState<'conectando' | 'online' | 'erro'>('conectando');
  const [firebaseMsg, setFirebaseMsg] = useState('Faça login com CPF e senha para acessar o app.');
  const [msgProblema, setMsgProblema] = useState('');
  const [msgVisita, setMsgVisita] = useState('');

  const [problemaForm, setProblemaForm] = useState({
    titulo: '',
    categoria: 'Irrigação',
    descricao: '',
    prioridade: 'Média',
    localizacao: ''
  });

  const [visitaForm, setVisitaForm] = useState({
    motivo: '',
    dataPreferida: '',
    turno: 'Manhã',
    observacoes: ''
  });

  const [imagemProblema, setImagemProblema] = useState<string>('');
  const [nomeImagemProblema, setNomeImagemProblema] = useState('');
  const [videoProblema, setVideoProblema] = useState<string>('');
  const [nomeVideoProblema, setNomeVideoProblema] = useState('');
  const videoCameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoGalleryInputRef = useRef<HTMLInputElement | null>(null);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 960 : false;

  useEffect(() => {
    let unsubProblemas: (() => void) | undefined;
    let unsubSolicitacoes: (() => void) | undefined;
    let unsubBeneficiario: (() => void) | undefined;

    const startRealtime = (beneficiarioId: string) => {
      unsubBeneficiario = onSnapshot(
        doc(db, 'beneficiarios', beneficiarioId),
        (snapshot) => {
          if (!snapshot.exists()) {
            setBeneficiarioVinculado(null);
            setFirebaseStatus('erro');
            setFirebaseMsg('Beneficiário vinculado não encontrado na base.');
            return;
          }
          setBeneficiarioVinculado({ id: snapshot.id, ...snapshot.data() } as BeneficiarioVinculado);
        },
        (error) => {
          console.error(error);
          setBeneficiarioVinculado(null);
        }
      );

      unsubProblemas = onSnapshot(
        collection(db, 'problemas_agricultor'),
        (snapshot) => {
          const lista = snapshot.docs
            .map((item) => ({ id: item.id, ...item.data() } as Problema))
            .filter((item) => item.beneficiarioId === beneficiarioId);
          setProblemas(lista.sort((a, b) => String(b.data || '').localeCompare(String(a.data || ''))));
          setFirebaseStatus('online');
          setFirebaseMsg('Problemas sincronizados em tempo real com o Firestore.');
        },
        (error) => {
          console.error(error);
          setFirebaseStatus('erro');
          setFirebaseMsg('Falha ao ler problemas no Firestore.');
        }
      );

      unsubSolicitacoes = onSnapshot(
        collection(db, 'solicitacoes_visita'),
        (snapshot) => {
          const lista = snapshot.docs
            .map((item) => ({ id: item.id, ...item.data() } as SolicitacaoVisita))
            .filter((item) => item.beneficiarioId === beneficiarioId);
          setSolicitacoes(lista.sort((a, b) => String(b.dataSolicitacao || '').localeCompare(String(a.dataSolicitacao || ''))));
          setFirebaseStatus('online');
          setFirebaseMsg('Solicitações de visita sincronizadas em tempo real com o Firestore.');
        },
        (error) => {
          console.error(error);
          setFirebaseStatus('erro');
          setFirebaseMsg('Falha ao ler solicitações de visita no Firestore.');
        }
      );
    };

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      unsubProblemas?.();
      unsubSolicitacoes?.();
      unsubBeneficiario?.();

      if (!user) {
        setUsuarioSistema(null);
        setBeneficiarioVinculado(null);
        setProblemas([]);
        setSolicitacoes([]);
        setAuthLoading(false);
        setFirebaseStatus('conectando');
        setFirebaseMsg('Faça login com CPF e senha para acessar o app.');
        return;
      }

      try {
        setAuthLoading(true);
        const userRef = doc(db, 'usuarios', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await signOut(auth);
          setLoginMsg('Usuário autenticado, mas não encontrado na base do sistema.');
          setFirebaseStatus('erro');
          setFirebaseMsg('Cadastro do usuário não encontrado.');
          return;
        }

        const userData = { uid: user.uid, ...userSnap.data() } as UsuarioAgricultor;

        if (!userData.ativo) {
          await signOut(auth);
          setLoginMsg('Seu acesso está inativo no sistema.');
          setFirebaseStatus('erro');
          setFirebaseMsg('Usuário inativo.');
          return;
        }

        if (userData.perfil !== 'agricultor') {
          await signOut(auth);
          setLoginMsg('Este acesso não pertence ao app agricultor.');
          setFirebaseStatus('erro');
          setFirebaseMsg('Perfil inválido para este app.');
          return;
        }

        if (!userData.beneficiarioId) {
          await signOut(auth);
          setLoginMsg('Seu cadastro ainda não está vinculado a um beneficiário.');
          setFirebaseStatus('erro');
          setFirebaseMsg('Beneficiário não vinculado ao usuário.');
          return;
        }

        setUsuarioSistema(userData);
        setFirebaseStatus('conectando');
        setFirebaseMsg('Conectado. Iniciando sincronização em tempo real...');

        await addDoc(collection(db, 'access_logs'), {
          uid: userData.uid,
          nome: userData.nome,
          perfil: userData.perfil,
          macroRegiaoId: userData.macroRegiaoId || null,
          tecnicoId: null,
          beneficiarioId: userData.beneficiarioId,
          appOrigem: 'app-agricultor',
          evento: 'login',
          timestamp: serverTimestamp()
        });

        await setDoc(doc(db, 'usuarios', userData.uid), { ultimoLoginEm: serverTimestamp() }, { merge: true });

        startRealtime(userData.beneficiarioId);
        setLoginMsg('');
      } catch (error: any) {
        console.error(error);
        setUsuarioSistema(null);
        setBeneficiarioVinculado(null);
        setProblemas([]);
        setSolicitacoes([]);
        setFirebaseStatus('erro');
        setFirebaseMsg(`Erro Firebase: ${error?.code || 'desconhecido'} - ${error?.message || ''}`);
        setLoginMsg(error?.message || 'Falha ao iniciar sessão.');
      } finally {
        setAuthLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubProblemas?.();
      unsubSolicitacoes?.();
      unsubBeneficiario?.();
    };
  }, []);

  async function realizarLogin() {
    const cpfLimpo = loginForm.cpf.replace(/\D/g, '');

    if (cpfLimpo.length !== 11 || !loginForm.senha) {
      setLoginMsg('Informe CPF e senha para entrar.');
      return;
    }

    try {
      setAuthLoading(true);
      setLoginMsg('Validando acesso...');
      await signInWithEmailAndPassword(auth, cpfParaEmailInterno(loginForm.cpf), loginForm.senha);
      setLoginMsg('');
    } catch (error) {
      console.error(error);
      setLoginMsg('Não foi possível entrar. Verifique CPF e senha.');
      setAuthLoading(false);
    }
  }

  async function sairDoSistema() {
    try {
      await signOut(auth);
      setUsuarioSistema(null);
      setLoginForm({ cpf: '', senha: '' });
      setLoginMsg('Sessão encerrada com sucesso.');
    } catch (error) {
      console.error(error);
      setLoginMsg('Erro ao sair do sistema.');
    }
  }

  function handleImagemProblema(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setImagemProblema(result);
      setNomeImagemProblema(file.name);
    };
    reader.readAsDataURL(file);
  }

  function removerImagemProblema() {
    setImagemProblema('');
    setNomeImagemProblema('');
  }

  function handleVideoProblema(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setVideoProblema(result);
      setNomeVideoProblema(file.name);
    };
    reader.readAsDataURL(file);
  }

  function removerVideoProblema() {
    setVideoProblema('');
    setNomeVideoProblema('');
    if (videoCameraInputRef.current) videoCameraInputRef.current.value = '';
    if (videoGalleryInputRef.current) videoGalleryInputRef.current.value = '';
  }

  function abrirCameraVideo() {
    videoCameraInputRef.current?.click();
  }

  function escolherVideoSalvo() {
    videoGalleryInputRef.current?.click();
  }

  async function salvarProblema() {
    if (bloqueioOperacional) {
      setMsgProblema(`Seu cadastro está em ${statusCadastroBeneficiario}. No momento não é possível enviar novos problemas.`);
      return;
    }

    if (!problemaForm.titulo) {
      setMsgProblema('Preencha ao menos o título do problema.');
      return;
    }

    if (!problemaForm.descricao && !imagemProblema && !videoProblema) {
      setMsgProblema('Envie uma descrição, uma imagem ou um vídeo curto do problema.');
      return;
    }

    if (!usuarioSistema?.beneficiarioId) {
      setMsgProblema('Seu cadastro ainda não está vinculado corretamente. Procure a equipe da SAF.');
      return;
    }

    try {
      let imagemURL = '';
      let videoURL = '';

      if (imagemProblema) {
        const blob = await fetch(imagemProblema).then((r) => r.blob());
        const file = new File([blob], nomeImagemProblema || 'imagem.jpg');
        imagemURL = await uploadArquivo(file);
      }

      if (videoProblema) {
        const blob = await fetch(videoProblema).then((r) => r.blob());
        const file = new File([blob], nomeVideoProblema || 'video.mp4');
        videoURL = await uploadArquivo(file);
      }

      await addDoc(collection(db, 'problemas_agricultor'), {
        beneficiarioId: usuarioSistema.beneficiarioId,
        beneficiarioNome: usuarioSistema.nome,
        uidCriador: usuarioSistema.uid,
        titulo: problemaForm.titulo,
        categoria: problemaForm.categoria,
        descricao: problemaForm.descricao || 'Relato enviado por mídia anexada.',
        prioridade: problemaForm.prioridade,
        localizacao: problemaForm.localizacao || 'Não informada',
        data: new Date().toLocaleString('pt-BR'),
        status: 'Recebido',
        ...(imagemURL ? { imagem: imagemURL, nomeImagem: nomeImagemProblema || 'imagem.jpg' } : {}),
        ...(videoURL ? { video: videoURL, nomeVideo: nomeVideoProblema || 'video.mp4' } : {}),
        createdAt: serverTimestamp()
      });

      setProblemaForm({ titulo: '', categoria: 'Irrigação', descricao: '', prioridade: 'Média', localizacao: '' });
      removerImagemProblema();
      removerVideoProblema();
      setMsgProblema('Problema enviado com sucesso ao Firestore.');
    } catch (error) {
      console.error(error);
      setMsgProblema('Erro ao enviar problema para o Firebase.');
    }
  }

  async function solicitarVisita() {
    if (bloqueioOperacional) {
      setMsgVisita(`Seu cadastro está em ${statusCadastroBeneficiario}. No momento não é possível solicitar novas visitas.`);
      return;
    }

    if (!visitaForm.motivo || !visitaForm.dataPreferida) {
      setMsgVisita('Preencha motivo e data preferida.');
      return;
    }

    if (!usuarioSistema?.beneficiarioId) {
      setMsgVisita('Seu cadastro ainda não está vinculado corretamente. Procure a equipe da SAF.');
      return;
    }

    try {
      await addDoc(collection(db, 'solicitacoes_visita'), {
        beneficiarioId: usuarioSistema.beneficiarioId,
        beneficiarioNome: usuarioSistema.nome,
        uidCriador: usuarioSistema.uid,
        motivo: visitaForm.motivo,
        dataPreferida: visitaForm.dataPreferida,
        turno: visitaForm.turno,
        observacoes: visitaForm.observacoes,
        status: 'Solicitada',
        dataSolicitacao: new Date().toLocaleString('pt-BR'),
        createdAt: serverTimestamp()
      });

      setVisitaForm({ motivo: '', dataPreferida: '', turno: 'Manhã', observacoes: '' });
      setMsgVisita('Solicitação enviada ao Firestore com sucesso.');
    } catch (error) {
      console.error(error);
      setMsgVisita('Erro ao enviar solicitação de visita.');
    }
  }

  const ultimosProblemas = useMemo(() => problemas.slice(0, 3), [problemas]);
  const ultimasSolicitacoes = useMemo(() => solicitacoes.slice(0, 5), [solicitacoes]);
  const statusCadastroBeneficiario = beneficiarioVinculado?.statusCadastro;
  const bloqueioOperacional = bloquearInteracaoAgricultor(statusCadastroBeneficiario);
  const mensagemStatusCadastro = descricaoStatusCadastro(statusCadastroBeneficiario);

  if (authLoading && !usuarioSistema) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg, padding: 20, fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div style={{ ...cardStyle({ width: 'min(460px, 100%)', textAlign: 'center' }) }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: colors.text }}>MeuCampo Agricultor</div>
          <div style={{ fontSize: 14, color: colors.muted, marginTop: 10 }}>Validando acesso ao sistema...</div>
        </div>
      </div>
    );
  }

  if (!usuarioSistema) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg, padding: 20, fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div style={{ ...cardStyle({ width: 'min(520px, 100%)' }) }}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>MeuCampo Agricultor</div>
            <div style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>Entre com seu CPF e sua senha para acessar seu atendimento.</div>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <Input label="CPF" value={loginForm.cpf} onChange={(v) => setLoginForm((prev) => ({ ...prev, cpf: formatarCpf(v) }))} placeholder="000.000.000-00" />
            <Input label="Senha" value={loginForm.senha} onChange={(v) => setLoginForm((prev) => ({ ...prev, senha: v }))} placeholder="Digite sua senha" type="password" />
            <ActionButton text={authLoading ? 'Entrando...' : 'Entrar'} onClick={realizarLogin} />
          </div>

          <div style={{ marginTop: 16, background: colors.chip, borderRadius: 16, padding: 14 }}>
            <div style={{ fontSize: 13, color: colors.muted }}>Quem pode entrar aqui</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <Badge text="Agricultor" tone="success" />
            </div>
          </div>

          {loginMsg && <div style={{ marginTop: 14, fontSize: 14, color: loginMsg.toLowerCase().includes('sucesso') ? '#166534' : '#8b1e1e' }}>{loginMsg}</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, padding: 16, fontFamily: 'Arial, Helvetica, sans-serif', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '360px 1fr', gap: 24 }}>
        <div style={{ background: colors.sidebar, color: '#fff', borderRadius: 28, padding: 20, boxShadow: '0 8px 24px rgba(31, 58, 42, 0.20)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: colors.sidebarSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🌾</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>MeuCampo Agricultor</div>
              <div style={{ fontSize: 13, color: '#d7e4d4' }}>Canal direto com assistência e serviços</div>
            </div>
          </div>

          <div style={{ background: colors.sidebarSoft, borderRadius: 22, padding: 16, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: '#d7e4d4' }}>Status da conexão</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>
                  {firebaseStatus === 'online' ? 'Firebase online' : firebaseStatus === 'conectando' ? 'Conectando...' : 'Falha de conexão'}
                </div>
              </div>
              <Badge text={firebaseStatus === 'online' ? 'Firestore' : firebaseStatus === 'conectando' ? 'Sincronizando' : 'Erro'} tone={firebaseStatus === 'erro' ? 'warning' : 'success'} />
            </div>
            <div style={{ fontSize: 12, color: '#d7e4d4', marginTop: 12 }}>{firebaseMsg}</div>
          </div>

          <div style={{ background: colors.sidebarSoft, borderRadius: 22, padding: 16, marginBottom: 18 }}>
            <div style={{ fontSize: 13, color: '#d7e4d4', marginBottom: 8 }}>Produtor vinculado</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{usuarioSistema.nome}</div>
            <div style={{ fontSize: 14, color: '#d7e4d4', marginTop: 6 }}>{usuarioSistema.cpfMasked || formatarCpf(usuarioSistema.cpf || '')}</div>
            {usuarioSistema.beneficiarioId && <div style={{ fontSize: 13, color: '#d7e4d4', marginTop: 6 }}>Cadastro: {usuarioSistema.beneficiarioId}</div>}
            <div style={{ marginTop: 10 }}>
              <Badge text={statusCadastroBeneficiario || 'sem_status'} tone={statusCadastroBeneficiario === 'aprovado' ? 'success' : bloqueioOperacional ? 'warning' : 'default'} />
            </div>
            <div style={{ fontSize: 12, color: '#d7e4d4', marginTop: 10 }}>{mensagemStatusCadastro}</div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {[
              ['inicio', 'Início'],
              ['problemas', 'Relatar problema'],
              ['visitas', 'Solicitar visita'],
              ['locktec', 'LockTec'],
              ['status', 'Acompanhamento'],
              ['perfil', 'Meu perfil']
            ].map(([key, label]) => {
              const selected = active === key;
              return (
                <button
                  key={key}
                  onClick={() => setActive(key as TelaKey)}
                  style={{ textAlign: 'left', padding: '14px 16px', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 700, background: selected ? '#ffffff' : 'transparent', color: selected ? colors.primaryDark : '#e2f0e0' }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div style={{ background: colors.sidebarSoft, borderRadius: 22, padding: 16, marginTop: 18 }}>
            <div style={{ fontSize: 13, color: '#d7e4d4', marginBottom: 8 }}>Sessão</div>
            <div style={{ fontSize: 14, color: '#d7e4d4', marginBottom: 12 }}>Logado como <strong>{usuarioSistema.nome}</strong></div>
            <ActionButton text="Sair" onClick={sairDoSistema} secondary />
          </div>

          <div style={{ background: colors.sidebarSoft, borderRadius: 22, padding: 16, marginTop: 18 }}>
            <div style={{ fontSize: 13, color: '#d7e4d4', marginBottom: 8 }}>IA do Agro</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>JARILO</div>
            <div style={{ fontSize: 13, color: '#d7e4d4', marginTop: 6 }}>acesso direto à comunidade SGTR</div>
            <a
              href={JARILO_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block',
                textAlign: 'center',
                textDecoration: 'none',
                marginTop: 14,
                padding: '12px 14px',
                borderRadius: 14,
                background: '#ffffff',
                color: colors.primaryDark,
                fontWeight: 700
              }}
            >
              Abrir JARILO
            </a>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          {bloqueioOperacional && (
            <div style={{ ...cardStyle(), border: '1px solid #f2e7c1', background: '#fffaf0' }}>
              <h2 style={{ marginTop: 0, color: colors.text }}>Atenção ao cadastro</h2>
              <p style={{ color: colors.muted, fontSize: 14, marginBottom: 0 }}>
                {mensagemStatusCadastro} Enquanto essa situação não for regularizada pela equipe técnica ou administrativa, o envio de novos problemas e solicitações de visita fica bloqueado.
              </p>
            </div>
          )}

          {active === 'inicio' && (
            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0, color: colors.text }}>Início</h2>
              <p style={{ color: colors.muted, fontSize: 14 }}>Acompanhe o andamento do seu cadastro e use este canal para se comunicar com a equipe técnica.</p>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
                <div style={{ background: colors.chip, borderRadius: 18, padding: 16 }}>
                  <div style={{ fontSize: 13, color: colors.muted }}>Status do cadastro</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: colors.text, marginTop: 8 }}>{statusCadastroBeneficiario || 'sem_status'}</div>
                </div>
                <div style={{ background: colors.chip, borderRadius: 18, padding: 16 }}>
                  <div style={{ fontSize: 13, color: colors.muted }}>Problemas enviados</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: colors.text, marginTop: 8 }}>{problemas.length}</div>
                </div>
                <div style={{ background: colors.chip, borderRadius: 18, padding: 16 }}>
                  <div style={{ fontSize: 13, color: colors.muted }}>Solicitações de visita</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: colors.text, marginTop: 8 }}>{solicitacoes.length}</div>
                </div>
              </div>
            </div>
          )}

          {active === 'visitas' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 0.95fr', gap: 20 }}>
              <div style={cardStyle()}>
                <h2 style={{ margin: 0, fontSize: 28, color: colors.text }}>Solicitar visita técnica</h2>
                <p style={{ margin: '10px 0 0 0', color: colors.muted, fontSize: 14 }}>Peça atendimento técnico e informe a melhor data para a propriedade.</p>
                <div style={{ display: 'grid', gap: 16, marginTop: 22 }}>
                  {bloqueioOperacional && <div style={{ color: '#8a5a1d', fontSize: 14, background: '#f2e7c1', borderRadius: 16, padding: 14 }}>{mensagemStatusCadastro}</div>}
                  <Input label="Motivo da visita" value={visitaForm.motivo} onChange={(v) => setVisitaForm((p) => ({ ...p, motivo: v }))} placeholder="Ex.: controle de pragas, manejo, solo" />
                  <Input label="Data preferida" value={visitaForm.dataPreferida} onChange={(v) => setVisitaForm((p) => ({ ...p, dataPreferida: v }))} placeholder="DD/MM/AAAA" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>Turno</div>
                    <select value={visitaForm.turno} onChange={(e) => setVisitaForm((p) => ({ ...p, turno: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.border}`, borderRadius: 16, padding: '14px 16px', fontSize: 14, background: '#fff', color: colors.text, outline: 'none' }}>
                      <option>Manhã</option>
                      <option>Tarde</option>
                    </select>
                  </div>
                  <Area label="Observações" value={visitaForm.observacoes} onChange={(v) => setVisitaForm((p) => ({ ...p, observacoes: v }))} placeholder="Informe detalhes úteis para a visita." />
                  <ActionButton text={bloqueioOperacional ? 'Solicitação bloqueada' : 'Enviar solicitação'} onClick={solicitarVisita} secondary={bloqueioOperacional} />
                  {msgVisita && <div style={{ fontSize: 14, color: msgVisita.toLowerCase().includes('erro') ? '#8b1e1e' : '#166534' }}>{msgVisita}</div>}
                </div>
              </div>

              <div style={cardStyle()}>
                <h3 style={{ marginTop: 0, color: colors.text, fontSize: 20 }}>Solicitações de visita</h3>
                <div style={{ display: 'grid', gap: 14 }}>
                  {ultimasSolicitacoes.length === 0 ? (
                    <div style={{ background: colors.chip, borderRadius: 18, padding: 16, color: colors.muted }}>Nenhuma solicitação enviada ainda.</div>
                  ) : (
                    ultimasSolicitacoes.map((item) => (
                      <div key={item.id} style={{ background: colors.chip, borderRadius: 18, padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                          <div style={{ fontWeight: 700, color: colors.text, fontSize: 17 }}>{item.motivo}</div>
                          <Badge text={item.status} tone={item.status === 'Atendida' ? 'success' : 'default'} />
                        </div>
                        <div style={{ marginTop: 12, color: colors.muted, fontSize: 14 }}>Data preferida: {item.dataPreferida} • {item.turno}</div>
                        <div style={{ marginTop: 8, color: colors.muted, fontSize: 14 }}>{item.observacoes}</div>
                        <div style={{ marginTop: 12 }}>
                          <Badge text={`Solicitada em ${item.dataSolicitacao}`} tone="success" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {active === 'problemas' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 0.95fr', gap: 20 }}>
              <div style={cardStyle()}>
                <h2 style={{ margin: 0, fontSize: 28, color: colors.text }}>Relatar problema</h2>
                <p style={{ margin: '10px 0 0 0', color: colors.muted, fontSize: 14 }}>Escreva, anexe imagem ou grave vídeo curto para facilitar o atendimento.</p>
                <div style={{ display: 'grid', gap: 16, marginTop: 22 }}>
                  {bloqueioOperacional && <div style={{ color: '#8a5a1d', fontSize: 14, background: '#f2e7c1', borderRadius: 16, padding: 14 }}>{mensagemStatusCadastro}</div>}
                  <Input label="Título" value={problemaForm.titulo} onChange={(v) => setProblemaForm((p) => ({ ...p, titulo: v }))} placeholder="Ex.: baixa pressão na irrigação" />
                  <Input label="Categoria" value={problemaForm.categoria} onChange={(v) => setProblemaForm((p) => ({ ...p, categoria: v }))} placeholder="Irrigação, praga, solo..." />
                  <Input label="Prioridade" value={problemaForm.prioridade} onChange={(v) => setProblemaForm((p) => ({ ...p, prioridade: v }))} placeholder="Alta, Média, Baixa" />
                  <Input label="Localização" value={problemaForm.localizacao} onChange={(v) => setProblemaForm((p) => ({ ...p, localizacao: v }))} placeholder="Ex.: setor da horta" />
                  <Area label="Descrição ou relato opcional" value={problemaForm.descricao} onChange={(v) => setProblemaForm((p) => ({ ...p, descricao: v }))} placeholder="Se preferir, escreva aqui. Também pode enviar imagem ou gravar vídeo." />

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>Imagem do problema</div>
                    <input type="file" accept="image/*" onChange={handleImagemProblema} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.border}`, borderRadius: 14, padding: '10px 12px', fontSize: 14, background: '#fff', color: colors.text }} />
                    {nomeImagemProblema && (
                      <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                        <div style={{ fontSize: 13, color: colors.muted }}>Imagem selecionada: {nomeImagemProblema}</div>
                        <ProblemImage src={imagemProblema} fileName={nomeImagemProblema} />
                        <ActionButton text="Remover imagem" onClick={removerImagemProblema} secondary />
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>Vídeo curto do problema</div>
                    <div style={{ background: colors.chip, borderRadius: 18, padding: 14, display: 'grid', gap: 12 }}>
                      <div style={{ fontSize: 14, color: colors.text, fontWeight: 700 }}>Grave direto pelo app no celular</div>
                      <div style={{ fontSize: 12, color: colors.muted }}>No celular, o botão abaixo tenta abrir a câmera traseira para gravar o vídeo na hora. Se não funcionar no navegador, use a opção de escolher um vídeo já salvo.</div>
                      <input ref={videoCameraInputRef} type="file" accept="video/*" capture="environment" onChange={handleVideoProblema} style={{ display: 'none' }} />
                      <input ref={videoGalleryInputRef} type="file" accept="video/*" onChange={handleVideoProblema} style={{ display: 'none' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                        <ActionButton text="Gravar vídeo agora" onClick={abrirCameraVideo} />
                        <ActionButton text="Escolher vídeo salvo" onClick={escolherVideoSalvo} secondary />
                      </div>
                    </div>
                    {nomeVideoProblema && (
                      <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                        <div style={{ fontSize: 13, color: colors.muted }}>Vídeo selecionado: {nomeVideoProblema}</div>
                        <ProblemVideo src={videoProblema} fileName={nomeVideoProblema} />
                        <ActionButton text="Remover vídeo" onClick={removerVideoProblema} secondary />
                      </div>
                    )}
                  </div>

                  <ActionButton text={bloqueioOperacional ? 'Envio bloqueado' : 'Enviar problema'} onClick={salvarProblema} secondary={bloqueioOperacional} />
                  {msgProblema && <div style={{ fontSize: 14, color: msgProblema.toLowerCase().includes('erro') ? '#8b1e1e' : '#166534' }}>{msgProblema}</div>}
                </div>
              </div>

              <div style={cardStyle()}>
                <h3 style={{ marginTop: 0, color: colors.text, fontSize: 20 }}>Últimos problemas enviados</h3>
                <div style={{ display: 'grid', gap: 14 }}>
                  {ultimosProblemas.length === 0 ? (
                    <div style={{ background: colors.chip, borderRadius: 18, padding: 16, color: colors.muted }}>Nenhum problema enviado ainda.</div>
                  ) : (
                    ultimosProblemas.map((item) => (
                      <div key={item.id} style={{ background: colors.chip, borderRadius: 18, padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                          <div style={{ fontWeight: 700, color: colors.text, fontSize: 17 }}>{item.titulo}</div>
                          <Badge text={item.status} tone={item.status === 'Concluído' ? 'success' : 'default'} />
                        </div>
                        <div style={{ marginTop: 10, fontSize: 14, color: colors.muted }}>{item.descricao}</div>
                        <div style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>{item.data}</div>
                        <ProblemImage src={item.imagem} fileName={item.nomeImagem} />
                        <ProblemVideo src={item.video} fileName={item.nomeVideo} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {active === 'status' && (
            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0, color: colors.text }}>Acompanhamento do cadastro</h2>
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ background: colors.chip, borderRadius: 18, padding: 16 }}>
                  <div style={{ fontSize: 13, color: colors.muted }}>Status de validação</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginTop: 8 }}>{statusCadastroBeneficiario || 'sem_status'}</div>
                  <div style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>{mensagemStatusCadastro}</div>
                </div>
                <div style={{ background: colors.chip, borderRadius: 18, padding: 16 }}>
                  <div style={{ fontSize: 13, color: colors.muted }}>Status operacional</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginTop: 8 }}>{beneficiarioVinculado?.status || 'Não informado'}</div>
                </div>
                <div style={{ background: colors.chip, borderRadius: 18, padding: 16 }}>
                  <div style={{ fontSize: 13, color: colors.muted }}>Técnico responsável</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginTop: 8 }}>{beneficiarioVinculado?.tecnico || 'Não informado'}</div>
                </div>
                <div style={{ background: colors.chip, borderRadius: 18, padding: 16 }}>
                  <div style={{ fontSize: 13, color: colors.muted }}>Macro região</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginTop: 8 }}>{beneficiarioVinculado?.macroRegiaoId || usuarioSistema.macroRegiaoId || 'Não informada'}</div>
                </div>
              </div>
            </div>
          )}

          {active === 'perfil' && (
            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0, color: colors.text }}>Meu perfil</h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <div style={{ background: colors.chip, borderRadius: 18, padding: 16 }}>
                  <div style={{ fontSize: 13, color: colors.muted }}>Nome</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginTop: 8 }}>{usuarioSistema.nome}</div>
                </div>
                <div style={{ background: colors.chip, borderRadius: 18, padding: 16 }}>
                  <div style={{ fontSize: 13, color: colors.muted }}>CPF</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginTop: 8 }}>{usuarioSistema.cpfMasked || formatarCpf(usuarioSistema.cpf || '') || '-'}</div>
                </div>
                <div style={{ background: colors.chip, borderRadius: 18, padding: 16 }}>
                  <div style={{ fontSize: 13, color: colors.muted }}>E-mail interno de acesso</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginTop: 8 }}>{cpfParaEmailInterno(usuarioSistema.cpfMasked || usuarioSistema.cpf || '')}</div>
                </div>
                <div style={{ background: colors.chip, borderRadius: 18, padding: 16 }}>
                  <div style={{ fontSize: 13, color: colors.muted }}>Macro região</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginTop: 8 }}>{beneficiarioVinculado?.macroRegiaoId || usuarioSistema.macroRegiaoId || '-'}</div>
                </div>
              </div>
            </div>
          )}

          {active === 'locktec' && (
            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0, color: colors.text }}>LockTec</h2>
              <p style={{ color: colors.muted, fontSize: 14 }}>Área reservada para evoluções futuras. O acesso do agricultor continua controlado pelo usuário autenticado e pelo status do beneficiário vinculado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
