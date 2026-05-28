export type AgricultorBulletin = {
  id: string;
  municipioId: string;
  municipioNome: string;
  uf: 'MA';
  status: 'published';
  generatedAt: string;
  validUntil: string;
  producerText: string;
  riskLevel?: 'baixo' | 'moderado' | 'alto' | 'critico';
  recommendation?: string;
  generationMode?: 'manual' | 'scheduled' | 'on_demand';
};

export type AgricultorBulletinResponse =
  | {
      ok: true;
      source: 'cache' | 'generated';
      bulletin: AgricultorBulletin;
    }
  | {
      ok: false;
      error: string;
    };

const defaultApiBase =
  process.env.REACT_APP_GOES_AMBIENTAL_BASE_URL?.replace(/\/$/, '') ||
  'https://sgtr-goes-ambiental.vercel.app';

export async function fetchAgricultorBulletin(
  municipioId: string,
  municipioNome: string,
): Promise<AgricultorBulletinResponse> {
  const query = new URLSearchParams({ municipioId, municipioNome });
  const response = await fetch(`/api/agricultor/bulletin?${query.toString()}`, {
    cache: 'no-store',
  });

  if (response.ok) {
    return (await response.json()) as AgricultorBulletinResponse;
  }

  const fallbackResponse = await fetch(
    `${defaultApiBase}/api/environmental-bulletins/latest?${query.toString()}`,
    {
      cache: 'no-store',
    },
  );

  return (await fallbackResponse.json()) as AgricultorBulletinResponse;
}

