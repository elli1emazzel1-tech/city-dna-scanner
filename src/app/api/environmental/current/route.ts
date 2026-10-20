import {
  CURRENT_PROVIDERS,
  CurrentProviderError,
  fetchCurrentProviderPayload,
  type CurrentProvider,
} from '../../../../lib/data/openMeteoCurrent';

function failureResponse(message: string, status = 502) {
  return Response.json({ error: message }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const provider = params.get('provider');
  const latitude = Number(params.get('latitude'));
  const longitude = Number(params.get('longitude'));
  if ((provider !== 'weather' && provider !== 'air-quality')
    || !Number.isFinite(latitude)
    || latitude < -90
    || latitude > 90
    || !Number.isFinite(longitude)
    || longitude < -180
    || longitude > 180) {
    return failureResponse('A valid provider and city coordinate pair are required.', 400);
  }

  const config = CURRENT_PROVIDERS[provider as CurrentProvider];
  const coordinates = { latitude, longitude };

  try {
    const result = await fetchCurrentProviderPayload(
      provider as CurrentProvider,
      coordinates,
      request.signal,
    );
    return Response.json({
      payload: result.payload,
      referenceTime: result.referenceTimeIso,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });

    if (error instanceof CurrentProviderError) {
      console.error('Open-Meteo current conditions request rejected.', error.diagnostics);
      if (error.kind === 'http') {
        return failureResponse(`${config.label} provider request failed (${error.message}).`);
      }
      if (error.kind === 'stale-timestamp') {
        return failureResponse(`${config.label} provider returned stale or future-dated conditions.`);
      }
      return failureResponse(config.safeFailure);
    }

    console.error('Open-Meteo current conditions request failed.', error);
    return failureResponse(config.safeFailure);
  }
}
