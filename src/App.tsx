import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
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

export default function App() {
  const [active, setActive] = useState<TelaKey>('visitas');
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoVisita[]>([]);
  const [firebaseStatus, setFirebaseStatus] = useState<'conectando' | 'online' | 'erro'>('conectando');
  const [firebaseMsg, setFirebaseMsg] = useState('Autenticando e conectando ao Firebase...');
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

    const startRealtime = () => {
      unsubProblemas = onSnapshot(
        collection(db, 'problemas_agricultor'),
        (snapshot) => {
          const lista = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Problema));
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
          const lista = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as SolicitacaoVisita));
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
      try {
        if (!user) {
          setFirebaseStatus('conectando');
          setFirebaseMsg('Autenticando no Firebase...');
          await signInAnonymously(auth);
          return;
        }
        setFirebaseStatus('conectando');
        setFirebaseMsg('Conectado. Iniciando sincronização em tempo real...');
        startRealtime();
      } catch (error: any) {
        console.error(error);
        setFirebaseStatus('erro');
        setFirebaseMsg(`Erro Firebase: ${error?.code || 'desconhecido'} - ${error?.message || ''}`);
      }
    });

    return () => {
      unsubAuth();
      unsubProblemas?.();
      unsubSolicitacoes?.();
    };
  }, []);

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
    if (!problemaForm.titulo) {
      setMsgProblema('Preencha ao menos o título do problema.');
      return;
    }

    if (!problemaForm.descricao && !imagemProblema && !videoProblema) {
      setMsgProblema('Envie uma descrição, uma imagem ou um vídeo curto do problema.');
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
        beneficiarioId: 'BEN-001',
        beneficiarioNome: 'Maria do Socorro Silva',
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
    if (!visitaForm.motivo || !visitaForm.dataPreferida) {
      setMsgVisita('Preencha motivo e data preferida.');
      return;
    }

    try {
      await addDoc(collection(db, 'solicitacoes_visita'), {
        beneficiarioId: 'BEN-001',
        beneficiarioNome: 'Maria do Socorro Silva',
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
            <div style={{ fontSize: 13, color: '#d7e4d4', marginBottom: 8 }}>Propriedade vinculada</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Sítio Esperança</div>
            <div style={{ fontSize: 14, color: '#d7e4d4', marginTop: 6 }}>Povoado Esperança • Rosário - MA</div>
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
            <div style={{ fontSize: 13, color: '#d7e4d4', marginBottom: 8 }}>IA do Agro</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>JARILO</div>
            <div style={{ fontSize: 13, color: '#d7e4d4', marginTop: 6 }}>acesso direto à SGTR</div>
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
          {active === 'visitas' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 0.95fr', gap: 20 }}>
              <div style={cardStyle()}>
                <h2 style={{ margin: 0, fontSize: 28, color: colors.text }}>Solicitar visita técnica</h2>
                <p style={{ margin: '10px 0 0 0', color: colors.muted, fontSize: 14 }}>Peça atendimento técnico e informe a melhor data para a propriedade.</p>
                <div style={{ display: 'grid', gap: 16, marginTop: 22 }}>
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
                  <ActionButton text="Enviar solicitação" onClick={solicitarVisita} />
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

                  <ActionButton text="Enviar problema" onClick={salvarProblema} />
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

          {active !== 'problemas' && active !== 'visitas' && (
            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0, color: colors.text }}>Módulo em prototipagem</h2>
              <p style={{ color: colors.muted, fontSize: 14 }}>Esta área continua pronta para evolução, mantendo a integração com Firebase já ativa no app.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
