import React, { useEffect, useMemo, useState } from 'react';

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

type OfertaLockTec = {
  id: string;
  nome: string;
  tipo: 'Locação' | 'Compra';
  categoria: string;
  preco: string;
  fornecedor: string;
  municipio: string;
  disponibilidade: string;
};

type PerfilAgricultor = {
  nome: string;
  propriedade: string;
  comunidade: string;
  municipio: string;
  telefone: string;
  atividades: string;
};

const STORAGE_KEYS = {
  problemas: 'agricultor_problemas_v1',
  visitas: 'agricultor_visitas_v1',
  perfil: 'agricultor_perfil_v1'
};

const colors = {
  bg: '#eef4ea',
  sidebar: '#20422a',
  sidebarSoft: '#2e5a3a',
  card: '#ffffff',
  border: '#d8e2d5',
  text: '#182218',
  muted: '#637363',
  primary: '#2f6a3b',
  primarySoft: '#dcebd9',
  chip: '#f5f1e7',
  earth: '#8a5d3b',
  warningBg: '#f6e5bd',
  warningText: '#8a5a1d'
};

const telas: { key: TelaKey; label: string }[] = [
  { key: 'inicio', label: 'Início' },
  { key: 'problemas', label: 'Relatar problema' },
  { key: 'visitas', label: 'Solicitar visita' },
  { key: 'locktec', label: 'LockTec' },
  { key: 'status', label: 'Acompanhamento' },
  { key: 'perfil', label: 'Meu perfil' }
];

const seedProblemas: Problema[] = [
  {
    id: 'PRB-001',
    titulo: 'Baixa pressão na irrigação',
    categoria: 'Irrigação',
    descricao: 'A água está chegando fraca nos canteiros do fundo.',
    prioridade: 'Alta',
    localizacao: 'Setor da horta',
    data: '13/03/2026 08:20',
    status: 'Recebido'
  }
];

const seedVisitas: SolicitacaoVisita[] = [
  {
    id: 'VIS-AGR-001',
    motivo: 'Orientação para controle de pragas',
    dataPreferida: '18/03/2026',
    turno: 'Manhã',
    observacoes: 'Preferência por visita cedo por causa do manejo.',
    status: 'Agendada',
    dataSolicitacao: '13/03/2026 09:10'
  }
];

const seedLockTec: OfertaLockTec[] = [
  {
    id: 'LCK-001',
    nome: 'Microtrator 15 cv',
    tipo: 'Locação',
    categoria: 'Trator',
    preco: 'R$ 280/dia',
    fornecedor: 'LockTec Rosário',
    municipio: 'Rosário - MA',
    disponibilidade: 'Disponível'
  },
  {
    id: 'LCK-002',
    nome: 'Grade aradora leve',
    tipo: 'Locação',
    categoria: 'Implemento',
    preco: 'R$ 120/dia',
    fornecedor: 'LockTec Icatu',
    municipio: 'Icatu - MA',
    disponibilidade: 'Poucas unidades'
  },
  {
    id: 'LCK-003',
    nome: 'Trator 50 cv seminovo',
    tipo: 'Compra',
    categoria: 'Trator',
    preco: 'R$ 78.000',
    fornecedor: 'Parceiro LockTec',
    municipio: 'São Luís - MA',
    disponibilidade: 'Disponível'
  }
];

const seedPerfil: PerfilAgricultor = {
  nome: 'Maria do Socorro Silva',
  propriedade: 'Sítio Esperança',
  comunidade: 'Povoado Esperança',
  municipio: 'Rosário - MA',
  telefone: '(98) 99999-0001',
  atividades: 'Horta, Galinhas, Mandioca'
};

function cardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: colors.card,
    borderRadius: 22,
    padding: 20,
    boxShadow: '0 8px 24px rgba(32, 66, 42, 0.08)',
    ...extra
  };
}

function Badge({ text, tone = 'default' }: { text: string; tone?: 'default' | 'warning' | 'success' }) {
  let background = colors.primarySoft;
  let color = colors.primary;
  if (tone === 'warning') {
    background = colors.warningBg;
    color = colors.warningText;
  }
  if (tone === 'success') {
    background = '#d6edd9';
    color = '#24522d';
  }
  return (
    <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background, color }}>
      {text}
    </span>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 26, color: colors.text }}>{title}</h2>
      <p style={{ margin: '8px 0 0 0', color: colors.muted }}>{subtitle}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.border}`, borderRadius: 14, padding: '12px 14px', fontSize: 14, background: '#fff', color: colors.text, outline: 'none' }}
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
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 120, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 14, fontSize: 14, background: '#fff', color: colors.text, outline: 'none', resize: 'vertical' }}
      />
    </div>
  );
}

function ActionButton({ text, onClick, secondary = false }: { text: string; onClick?: () => void; secondary?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: secondary ? `1px solid ${colors.border}` : 'none', background: secondary ? '#fff' : colors.primary, color: secondary ? colors.primary : '#fff', cursor: 'pointer', fontWeight: 700 }}
    >
      {text}
    </button>
  );
}

function safeLoad<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function AgricultorApp() {
  const [active, setActive] = useState<TelaKey>('inicio');
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoVisita[]>([]);
  const [perfil, setPerfil] = useState<PerfilAgricultor>(seedPerfil);
  const [msgProblema, setMsgProblema] = useState('');
  const [imagemProblema, setImagemProblema] = useState<string>('');
  const [nomeImagemProblema, setNomeImagemProblema] = useState('');
  const [videoProblema, setVideoProblema] = useState<string>('');
  const [nomeVideoProblema, setNomeVideoProblema] = useState('');
  const [msgVisita, setMsgVisita] = useState('');
  const [buscaLockTec, setBuscaLockTec] = useState('');

  const [problemaForm, setProblemaForm] = useState({
    titulo: '',
    categoria: 'Irrigação',
    descricao: '',
    prioridade: 'Média',
    localizacao: ''
  });

  function handleImagemProblema(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const resultado = typeof reader.result === 'string' ? reader.result : '';
      setImagemProblema(resultado);
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

    const tamanhoMaximo = 15 * 1024 * 1024;
    if (file.size > tamanhoMaximo) {
      setMsgProblema('O vídeo precisa ter no máximo 15 MB nesta versão demonstrativa.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultado = typeof reader.result === 'string' ? reader.result : '';
      setVideoProblema(resultado);
      setNomeVideoProblema(file.name);
    };
    reader.readAsDataURL(file);
  }

  function removerVideoProblema() {
    setVideoProblema('');
    setNomeVideoProblema('');
  }

  const [visitaForm, setVisitaForm] = useState({
    motivo: '',
    dataPreferida: '',
    turno: 'Manhã',
    observacoes: ''
  });

  useEffect(() => {
    setProblemas(safeLoad(STORAGE_KEYS.problemas, seedProblemas));
    setSolicitacoes(safeLoad(STORAGE_KEYS.visitas, seedVisitas));
    setPerfil(safeLoad(STORAGE_KEYS.perfil, seedPerfil));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.problemas, JSON.stringify(problemas));
  }, [problemas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.visitas, JSON.stringify(solicitacoes));
  }, [solicitacoes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.perfil, JSON.stringify(perfil));
  }, [perfil]);

  const ofertasFiltradas = useMemo(() => {
    const q = buscaLockTec.toLowerCase().trim();
    if (!q) return seedLockTec;
    return seedLockTec.filter((item) =>
      [item.nome, item.tipo, item.categoria, item.fornecedor, item.municipio, item.disponibilidade].join(' ').toLowerCase().includes(q)
    );
  }, [buscaLockTec]);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 960 : false;

  function salvarProblema() {
    if (!problemaForm.titulo) {
      setMsgProblema('Preencha ao menos o título do problema.');
      return;
    }
    if (!problemaForm.descricao && !imagemProblema && !videoProblema) {
      setMsgProblema('Envie uma descrição, uma imagem ou um vídeo curto do problema.');
      return;
    }
    const novo: Problema = {
      id: `PRB-${String(Date.now()).slice(-6)}`,
      titulo: problemaForm.titulo,
      categoria: problemaForm.categoria,
      descricao: problemaForm.descricao || 'Relato enviado por mídia anexada.',
      prioridade: problemaForm.prioridade,
      localizacao: problemaForm.localizacao || 'Não informada',
      data: new Date().toLocaleString('pt-BR'),
      status: 'Recebido',
      imagem: imagemProblema || undefined,
      nomeImagem: nomeImagemProblema || undefined,
      video: videoProblema || undefined,
      nomeVideo: nomeVideoProblema || undefined
    };
    setProblemas((prev) => [novo, ...prev]);
    setProblemaForm({ titulo: '', categoria: 'Irrigação', descricao: '', prioridade: 'Média', localizacao: '' });
    removerImagemProblema();
    removerVideoProblema();
    setMsgProblema('Problema enviado com sucesso.');
  }

  function solicitarVisita() {
    if (!visitaForm.motivo || !visitaForm.dataPreferida) {
      setMsgVisita('Preencha motivo e data preferida.');
      return;
    }
    const nova: SolicitacaoVisita = {
      id: `SVC-${String(Date.now()).slice(-6)}`,
      motivo: visitaForm.motivo,
      dataPreferida: visitaForm.dataPreferida,
      turno: visitaForm.turno,
      observacoes: visitaForm.observacoes,
      status: 'Solicitada',
      dataSolicitacao: new Date().toLocaleString('pt-BR')
    };
    setSolicitacoes((prev) => [nova, ...prev]);
    setVisitaForm({ motivo: '', dataPreferida: '', turno: 'Manhã', observacoes: '' });
    setMsgVisita('Solicitação de visita enviada.');
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, padding: 16, fontFamily: 'Arial, Helvetica, sans-serif', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '290px 1fr', gap: 20 }}>
        <div style={{ background: colors.sidebar, color: '#fff', borderRadius: 28, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: colors.sidebarSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              🌾
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>MeuCampo Agricultor</div>
              <div style={{ fontSize: 13, color: '#d7e4d4' }}>Canal direto com assistência e serviços</div>
            </div>
          </div>

          <div style={{ background: colors.sidebarSoft, borderRadius: 20, padding: 16, marginBottom: 18 }}>
            <div style={{ fontSize: 13, color: '#d7e4d4' }}>Propriedade vinculada</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>{perfil.propriedade}</div>
            <div style={{ fontSize: 13, color: '#d7e4d4', marginTop: 6 }}>{perfil.comunidade} • {perfil.municipio}</div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {telas.map((item) => {
              const ativo = active === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActive(item.key)}
                  style={{ textAlign: 'left', padding: '14px 16px', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 700, background: ativo ? '#ffffff' : 'transparent', color: ativo ? colors.primary : '#e2f0e0' }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          {active === 'inicio' && (
            <>
              <div style={cardStyle()}>
                <SectionTitle title="App do agricultor" subtitle="Protótipo inicial para relatar problemas, pedir visitas e acessar serviços parceiros." />
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
                  <div style={cardStyle({ background: colors.chip, padding: 16 })}>
                    <div style={{ fontSize: 13, color: colors.muted }}>Problemas relatados</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: colors.text, marginTop: 8 }}>{problemas.length}</div>
                  </div>
                  <div style={cardStyle({ background: colors.chip, padding: 16 })}>
                    <div style={{ fontSize: 13, color: colors.muted }}>Visitas solicitadas</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: colors.text, marginTop: 8 }}>{solicitacoes.length}</div>
                  </div>
                  <div style={cardStyle({ background: colors.chip, padding: 16 })}>
                    <div style={{ fontSize: 13, color: colors.muted }}>Ofertas LockTec</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: colors.text, marginTop: 8 }}>{seedLockTec.length}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
                <div style={cardStyle()}>
                  <h3 style={{ marginTop: 0, color: colors.text }}>Ações rápidas</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <ActionButton text="Relatar problema" onClick={() => setActive('problemas')} />
                    <ActionButton text="Solicitar visita técnica" onClick={() => setActive('visitas')} secondary />
                    <ActionButton text="Abrir LockTec" onClick={() => setActive('locktec')} secondary />
                  </div>
                </div>
                <div style={cardStyle()}>
                  <h3 style={{ marginTop: 0, color: colors.text }}>Última movimentação</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {problemas.slice(0, 2).map((p) => (
                      <div key={p.id} style={{ background: colors.chip, padding: 14, borderRadius: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <strong style={{ color: colors.text }}>{p.titulo}</strong>
                          <Badge text={p.status} tone="warning" />
                        </div>
                        {p.imagem && (
                          <div style={{ marginTop: 10 }}>
                            <img
                              src={p.imagem}
                              alt={p.nomeImagem || p.titulo}
                              style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 14, border: `1px solid ${colors.border}` }}
                            />
                          </div>
                        )}
                        {p.video && (
                          <div style={{ marginTop: 10 }}>
                            <video controls style={{ width: '100%', maxHeight: 170, borderRadius: 14, border: `1px solid ${colors.border}`, background: '#000' }}>
                              <source src={p.video} />
                              Seu navegador não suporta vídeo incorporado.
                            </video>
                          </div>
                        )}
                        <div style={{ fontSize: 14, color: colors.muted, marginTop: 6 }}>{p.categoria} • {p.data}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {active === 'problemas' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
              <div style={cardStyle()}>
                <SectionTitle title="Relatar problema" subtitle="Canal para informar falhas, pragas, irrigação, máquinas e outras demandas." />
                <div style={{ display: 'grid', gap: 14 }}>
                  <Field label="Título do problema" value={problemaForm.titulo} onChange={(v) => setProblemaForm((p) => ({ ...p, titulo: v }))} placeholder="Ex.: Falha na irrigação" />
                  <Field label="Categoria" value={problemaForm.categoria} onChange={(v) => setProblemaForm((p) => ({ ...p, categoria: v }))} placeholder="Irrigação, praga, solo..." />
                  <Field label="Prioridade" value={problemaForm.prioridade} onChange={(v) => setProblemaForm((p) => ({ ...p, prioridade: v }))} placeholder="Baixa, Média, Alta" />
                  <Field label="Localização" value={problemaForm.localizacao} onChange={(v) => setProblemaForm((p) => ({ ...p, localizacao: v }))} placeholder="Talhão, horta, curral..." />
                  <Area label="Descrição ou relato opcional" value={problemaForm.descricao} onChange={(v) => setProblemaForm((p) => ({ ...p, descricao: v }))} placeholder="Se preferir, escreva aqui. Também pode enviar imagem ou gravar vídeo." />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>Imagem do problema</div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImagemProblema}
                      style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.border}`, borderRadius: 14, padding: '10px 12px', fontSize: 14, background: '#fff', color: colors.text }}
                    />
                    {nomeImagemProblema && (
                      <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                        <div style={{ fontSize: 13, color: colors.muted }}>Arquivo selecionado: {nomeImagemProblema}</div>
                        {imagemProblema && (
                          <img
                            src={imagemProblema}
                            alt="Pré-visualização do problema"
                            style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 16, border: `1px solid ${colors.border}` }}
                          />
                        )}
                        <ActionButton text="Remover imagem" onClick={removerImagemProblema} secondary />
                      </div>
                    )}
                  </div>
                </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>Vídeo curto do problema</div>
                    <input
                      type="file"
                      accept="video/*"
                      capture="environment"
                      onChange={handleVideoProblema}
                      style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.border}`, borderRadius: 14, padding: '10px 12px', fontSize: 14, background: '#fff', color: colors.text }}
                    />
                    <div style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>No celular, esse botão tende a abrir a câmera para gravar o vídeo direto no app. Prefira vídeos curtos.</div>
                    {nomeVideoProblema && (
                      <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                        <div style={{ fontSize: 13, color: colors.muted }}>Vídeo selecionado: {nomeVideoProblema}</div>
                        {videoProblema && (
                          <video controls style={{ width: '100%', maxHeight: 260, borderRadius: 16, border: `1px solid ${colors.border}`, background: '#000' }}>
                            <source src={videoProblema} />
                            Seu navegador não suporta vídeo incorporado.
                          </video>
                        )}
                        <ActionButton text="Remover vídeo" onClick={removerVideoProblema} secondary />
                      </div>
                    )}
                  </div>
                <div style={{ marginTop: 16 }}>
                  <ActionButton text="Enviar problema" onClick={salvarProblema} />
                </div>
                {msgProblema && <div style={{ marginTop: 12, color: '#166534', fontSize: 14 }}>{msgProblema}</div>}
              </div>

              <div style={cardStyle()}>
                <h3 style={{ marginTop: 0, color: colors.text }}>Problemas enviados</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {problemas.map((item) => (
                    <div key={item.id} style={{ background: colors.chip, padding: 16, borderRadius: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: colors.text }}>{item.titulo}</div>
                          <div style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>{item.categoria} • {item.localizacao}</div>
                        </div>
                        <Badge text={item.prioridade} tone={item.prioridade === 'Alta' ? 'warning' : 'default'} />
                      </div>
                      <div style={{ fontSize: 14, color: colors.muted, marginTop: 10 }}>{item.descricao}</div>
                      {item.imagem && (
                        <div style={{ marginTop: 10 }}>
                          <img
                            src={item.imagem}
                            alt={item.nomeImagem || item.titulo}
                            style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 14, border: `1px solid ${colors.border}` }}
                          />
                        </div>
                      )}
                      {item.video && (
                        <div style={{ marginTop: 10 }}>
                          <video controls style={{ width: '100%', maxHeight: 170, borderRadius: 14, border: `1px solid ${colors.border}`, background: '#000' }}>
                            <source src={item.video} />
                            Seu navegador não suporta vídeo incorporado.
                          </video>
                        </div>
                      )}
                      {item.video && (
                        <div style={{ marginTop: 12 }}>
                          <video controls style={{ width: '100%', maxHeight: 260, borderRadius: 16, border: `1px solid ${colors.border}`, background: '#000' }}>
                            <source src={item.video} />
                            Seu navegador não suporta vídeo incorporado.
                          </video>
                          {item.nomeVideo && <div style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>{item.nomeVideo}</div>}
                        </div>
                      )}
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Badge text={item.status} />
                        <Badge text={item.data} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {active === 'visitas' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
              <div style={cardStyle()}>
                <SectionTitle title="Solicitar visita técnica" subtitle="Peça atendimento técnico e informe a melhor data para a propriedade." />
                <div style={{ display: 'grid', gap: 14 }}>
                  <Field label="Motivo da visita" value={visitaForm.motivo} onChange={(v) => setVisitaForm((p) => ({ ...p, motivo: v }))} placeholder="Ex.: controle de pragas, manejo, solo" />
                  <Field label="Data preferida" value={visitaForm.dataPreferida} onChange={(v) => setVisitaForm((p) => ({ ...p, dataPreferida: v }))} placeholder="DD/MM/AAAA" />
                  <Field label="Turno" value={visitaForm.turno} onChange={(v) => setVisitaForm((p) => ({ ...p, turno: v }))} placeholder="Manhã, Tarde, Noite" />
                  <Area label="Observações" value={visitaForm.observacoes} onChange={(v) => setVisitaForm((p) => ({ ...p, observacoes: v }))} placeholder="Informe detalhes úteis para a visita." />
                </div>
                <div style={{ marginTop: 16 }}>
                  <ActionButton text="Enviar solicitação" onClick={solicitarVisita} />
                </div>
                {msgVisita && <div style={{ marginTop: 12, color: '#166534', fontSize: 14 }}>{msgVisita}</div>}
              </div>

              <div style={cardStyle()}>
                <h3 style={{ marginTop: 0, color: colors.text }}>Solicitações de visita</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {solicitacoes.map((item) => (
                    <div key={item.id} style={{ background: colors.chip, padding: 16, borderRadius: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <strong style={{ color: colors.text }}>{item.motivo}</strong>
                        <Badge text={item.status} tone={item.status === 'Agendada' ? 'success' : 'default'} />
                      </div>
                      <div style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>Data preferida: {item.dataPreferida} • {item.turno}</div>
                      <div style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>{item.observacoes}</div>
                      <div style={{ marginTop: 10 }}>
                        <Badge text={`Solicitada em ${item.dataSolicitacao}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {active === 'locktec' && (
            <div style={cardStyle()}>
              <SectionTitle title="LockTec" subtitle="Acesso rápido a ofertas de locação e compra de tratores e implementos." />
              <div style={{ maxWidth: 420, marginBottom: 16 }}>
                <Field label="Buscar equipamento" value={buscaLockTec} onChange={setBuscaLockTec} placeholder="Trator, grade, roçadeira..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
                {ofertasFiltradas.map((item) => (
                  <div key={item.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 18, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: colors.text }}>{item.nome}</div>
                        <div style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>{item.categoria} • {item.municipio}</div>
                      </div>
                      <Badge text={item.tipo} tone={item.tipo === 'Compra' ? 'warning' : 'success'} />
                    </div>
                    <div style={{ marginTop: 12, fontSize: 22, fontWeight: 700, color: colors.primary }}>{item.preco}</div>
                    <div style={{ marginTop: 8, fontSize: 14, color: colors.muted }}>Fornecedor: {item.fornecedor}</div>
                    <div style={{ marginTop: 8 }}><Badge text={item.disponibilidade} /></div>
                    <div style={{ marginTop: 16 }}>
                      <ActionButton text={item.tipo === 'Locação' ? 'Quero alugar' : 'Quero comprar'} secondary />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'status' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
              <div style={cardStyle()}>
                <SectionTitle title="Acompanhamento" subtitle="Veja o andamento dos problemas relatados e das visitas solicitadas." />
                <div style={{ display: 'grid', gap: 12 }}>
                  {problemas.map((item) => (
                    <div key={item.id} style={{ background: colors.chip, padding: 14, borderRadius: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <strong style={{ color: colors.text }}>{item.titulo}</strong>
                        <Badge text={item.status} />
                      </div>
                      {item.imagem && (
                        <div style={{ marginTop: 10 }}>
                          <img
                            src={item.imagem}
                            alt={item.nomeImagem || item.titulo}
                            style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 14, border: `1px solid ${colors.border}` }}
                          />
                        </div>
                      )}
                      <div style={{ marginTop: 8, color: colors.muted, fontSize: 14 }}>{item.categoria} • {item.data}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle()}>
                <h3 style={{ marginTop: 0, color: colors.text }}>Agenda de visitas</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {solicitacoes.map((item) => (
                    <div key={item.id} style={{ background: colors.chip, padding: 14, borderRadius: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <strong style={{ color: colors.text }}>{item.motivo}</strong>
                        <Badge text={item.status} tone={item.status === 'Agendada' ? 'success' : 'default'} />
                      </div>
                      <div style={{ marginTop: 8, color: colors.muted, fontSize: 14 }}>{item.dataPreferida} • {item.turno}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {active === 'perfil' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
              <div style={cardStyle()}>
                <SectionTitle title="Meu perfil" subtitle="Dados básicos do agricultor e da propriedade vinculada." />
                <div style={{ display: 'grid', gap: 14 }}>
                  <Field label="Nome" value={perfil.nome} onChange={(v) => setPerfil((p) => ({ ...p, nome: v }))} placeholder="Nome completo" />
                  <Field label="Propriedade" value={perfil.propriedade} onChange={(v) => setPerfil((p) => ({ ...p, propriedade: v }))} placeholder="Nome da propriedade" />
                  <Field label="Comunidade" value={perfil.comunidade} onChange={(v) => setPerfil((p) => ({ ...p, comunidade: v }))} placeholder="Comunidade" />
                  <Field label="Município" value={perfil.municipio} onChange={(v) => setPerfil((p) => ({ ...p, municipio: v }))} placeholder="Município" />
                  <Field label="Telefone" value={perfil.telefone} onChange={(v) => setPerfil((p) => ({ ...p, telefone: v }))} placeholder="Telefone" />
                  <Field label="Atividades" value={perfil.atividades} onChange={(v) => setPerfil((p) => ({ ...p, atividades: v }))} placeholder="Horta, mandioca, aves..." />
                </div>
              </div>
              <div style={cardStyle()}>
                <h3 style={{ marginTop: 0, color: colors.text }}>Resumo da unidade produtiva</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ background: colors.chip, padding: 16, borderRadius: 16 }}>
                    <div style={{ fontSize: 13, color: colors.muted }}>Agricultor</div>
                    <div style={{ marginTop: 6, fontWeight: 700, color: colors.text }}>{perfil.nome}</div>
                  </div>
                  <div style={{ background: colors.chip, padding: 16, borderRadius: 16 }}>
                    <div style={{ fontSize: 13, color: colors.muted }}>Propriedade</div>
                    <div style={{ marginTop: 6, fontWeight: 700, color: colors.text }}>{perfil.propriedade}</div>
                  </div>
                  <div style={{ background: colors.chip, padding: 16, borderRadius: 16 }}>
                    <div style={{ fontSize: 13, color: colors.muted }}>Localização</div>
                    <div style={{ marginTop: 6, fontWeight: 700, color: colors.text }}>{perfil.comunidade} • {perfil.municipio}</div>
                  </div>
                  <div style={{ background: colors.chip, padding: 16, borderRadius: 16 }}>
                    <div style={{ fontSize: 13, color: colors.muted }}>Atividades</div>
                    <div style={{ marginTop: 6, fontWeight: 700, color: colors.text }}>{perfil.atividades}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
