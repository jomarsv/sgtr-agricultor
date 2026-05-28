import { useMemo, useState } from 'react';
import {
  AGRICULTOR_MUNICIPALITIES,
  type AgricultorMunicipality,
} from '../services/agricultorMunicipalities';
import {
  fetchAgricultorBulletin,
  type AgricultorBulletin,
  type AgricultorBulletinResponse,
} from '../services/agricultorBulletin';

const defaultMunicipality = AGRICULTOR_MUNICIPALITIES[0];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' });
}

function riskLabelClass(risk?: AgricultorBulletin['riskLevel']) {
  switch (risk) {
    case 'baixo':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'alto':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'critico':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'moderado':
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
}

export function AgricultorBulletinPanel() {
  const [municipio, setMunicipio] = useState<AgricultorMunicipality>(defaultMunicipality);
  const [response, setResponse] = useState<AgricultorBulletinResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Selecione um município para carregar o boletim.');

  const bulletin = response?.ok ? response.bulletin : null;

  const mapUrl = useMemo(
    () =>
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${municipio.municipioNome}, Maranhão`,
      )}`,
    [municipio.municipioNome],
  );

  const handleLoad = async () => {
    setLoading(true);
    setStatus('Carregando boletim...');
    try {
      const result = await fetchAgricultorBulletin(municipio.municipioId, municipio.municipioNome);
      setResponse(result);
      if (result.ok) {
        setStatus(
          result.source === 'cache'
            ? 'Boletim carregado do cache público.'
            : 'Boletim gerado sob demanda pelo backend.',
        );
      } else {
        setStatus('error' in result ? result.error : 'Falha ao carregar o boletim.');
      }
    } catch {
      setResponse({ ok: false, error: 'Falha ao carregar o boletim.' });
      setStatus('Falha ao carregar o boletim.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-[#d7ded8] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4a6b5f]">
          SGTR Agricultor
        </p>
        <h2 className="text-3xl font-semibold tracking-normal text-[#10201d]">
          Boletim para o produtor
        </h2>
        <p className="max-w-3xl text-lg leading-8 text-[#43524e]">
          Interface de leitura simples. Este app consome apenas o boletim público por município
          publicado pelo SGTR GOES-R Ambiental.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1e2c28]">Município</span>
          <select
            className="w-full rounded-2xl border border-[#cdd7d1] bg-white px-4 py-4 text-base outline-none focus:border-[#4a6b5f]"
            value={municipio.municipioId}
            onChange={(event) => {
              const next = AGRICULTOR_MUNICIPALITIES.find((item) => item.municipioId === event.target.value);
              if (next) setMunicipio(next);
              setResponse(null);
              setStatus('Selecione um município e carregue o boletim.');
            }}
          >
            {AGRICULTOR_MUNICIPALITIES.map((item) => (
              <option key={item.municipioId} value={item.municipioId}>
                {item.municipioNome}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="min-h-14 rounded-2xl bg-[#2f7a5e] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#28684f] disabled:cursor-not-allowed disabled:opacity-70"
          onClick={handleLoad}
          disabled={loading}
        >
          {loading ? 'Carregando...' : 'Ver boletim'}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#52615c]">
        <span className="rounded-full bg-[#eef4ef] px-3 py-1 font-medium text-[#2f7a5e]">
          {municipio.municipioNome}
        </span>
        <a
          className="text-[#2f7a5e] underline underline-offset-4"
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
        >
          Abrir mapa de referência
        </a>
      </div>

      <p className="mt-4 rounded-2xl border border-[#edd9ad] bg-[#fff7e8] px-4 py-3 text-sm font-medium text-[#8a5b07]">
        {status}
      </p>

      {bulletin ? (
        <article className="mt-6 rounded-3xl border border-[#d7ded8] bg-[#fbfcfb] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#4a6b5f]">Boletim público</p>
              <h3 className="mt-1 text-2xl font-semibold text-[#10201d]">{bulletin.municipioNome}</h3>
              <p className="mt-1 text-sm text-[#52615c]">
                Gerado em {formatDateTime(bulletin.generatedAt)} · válido até{' '}
                {formatDateTime(bulletin.validUntil)}
              </p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${riskLabelClass(bulletin.riskLevel)}`}>
              {bulletin.riskLevel ?? 'moderado'}
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#e3e8e4] bg-white p-4">
              <h4 className="text-sm font-semibold text-[#1e2c28]">Mensagem ao produtor</h4>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-[#24322e]">
                {bulletin.producerText}
              </p>
            </section>

            <section className="rounded-2xl border border-[#e3e8e4] bg-white p-4">
              <h4 className="text-sm font-semibold text-[#1e2c28]">Orientação prática</h4>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-[#24322e]">
                {bulletin.recommendation || 'Acompanhe as condições locais e as fontes oficiais.'}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[#6a7b76]">Modo</dt>
                  <dd className="font-medium text-[#24322e]">{bulletin.generationMode || 'on_demand'}</dd>
                </div>
                <div>
                  <dt className="text-[#6a7b76]">UF</dt>
                  <dd className="font-medium text-[#24322e]">{bulletin.uf}</dd>
                </div>
              </dl>
            </section>
          </div>
        </article>
      ) : null}
    </section>
  );
}
