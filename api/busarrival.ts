/**
 * Serverless LTA DataMall Bus Arrival Proxy
 * GET /api/busarrival?BusStopCode=83139[&ServiceNo=...]
 * 
 * Proxies live arrivals from Singapore LTA DataMall v3:
 * GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=<BusStopCode>
 * Header: AccountKey: <LTA_ACCOUNT_KEY>
 * Header: accept: application/json
 */

import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

const LTA_DATAMALL_BUS_ARRIVAL_V3_URL = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

/**
 * Retrieve LTA AccountKey from environment or request headers
 * (No hardcoded keys; reads from process.env or headers)
 */
function resolveAccountKey(reqHeaders?: Record<string, any>): string | undefined {
  return (
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    reqHeaders?.['accountkey'] ||
    reqHeaders?.['AccountKey'] ||
    reqHeaders?.['x-account-key']
  );
}

/**
 * Standard Vercel / Express serverless request handler
 */
export default async function handler(
  req: ExpressRequest | any,
  res: ExpressResponse | any
) {
  // CORS setup
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, AccountKey, x-account-key');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Extract query parameters
  const query = req.query || {};
  const busStopCode = query.BusStopCode || query.busStopCode;
  const serviceNo = query.ServiceNo || query.serviceNo;

  if (!busStopCode) {
    return res.status(400).json({
      error: 'Missing required parameter: BusStopCode',
      example: '/api/busarrival?BusStopCode=83139',
    });
  }

  // Check for AccountKey without hardcoding
  const accountKey = resolveAccountKey(req.headers);
  if (!accountKey) {
    return res.status(503).json({
      error: 'LTA_ACCOUNT_KEY not configured',
      message: 'Please define LTA_ACCOUNT_KEY in your environment variables (.env) or pass an AccountKey header.',
      hint: 'Get your key at https://datamall.lta.gov.sg/content/datamall/en/request-api.html',
    });
  }

  try {
    // Construct LTA DataMall v3 target URL
    const targetUrl = new URL(LTA_DATAMALL_BUS_ARRIVAL_V3_URL);
    targetUrl.searchParams.set('BusStopCode', String(busStopCode));
    if (serviceNo) {
      targetUrl.searchParams.set('ServiceNo', String(serviceNo));
    }

    const upstreamResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'AccountKey': accountKey,
        'accept': 'application/json',
      },
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      return res.status(upstreamResponse.status).json({
        error: `LTA DataMall upstream error: ${upstreamResponse.statusText}`,
        status: upstreamResponse.status,
        details: errorText,
      });
    }

    const data = await upstreamResponse.json();

    // Cache control: cache for 10 seconds, allow stale up to 20 seconds
    res.setHeader?.('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=20');
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Failed to proxy LTA bus arrival:', error);
    return res.status(502).json({
      error: 'Bad Gateway: Failed to communicate with LTA DataMall',
      message: error?.message || 'Unknown network error',
    });
  }
}

/**
 * Web Standard edge runtime handler (Next.js / Cloudflare / Fetch API)
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const busStopCode = url.searchParams.get('BusStopCode') || url.searchParams.get('busStopCode');
  const serviceNo = url.searchParams.get('ServiceNo') || url.searchParams.get('serviceNo');

  if (!busStopCode) {
    return new Response(
      JSON.stringify({
        error: 'Missing required parameter: BusStopCode',
        example: '/api/busarrival?BusStopCode=83139',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  const accountKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    request.headers.get('accountkey') ||
    request.headers.get('x-account-key');

  if (!accountKey) {
    return new Response(
      JSON.stringify({
        error: 'LTA_ACCOUNT_KEY not configured',
        message: 'Please define LTA_ACCOUNT_KEY in your environment variables (.env) or pass an AccountKey header.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  try {
    const targetUrl = new URL(LTA_DATAMALL_BUS_ARRIVAL_V3_URL);
    targetUrl.searchParams.set('BusStopCode', busStopCode);
    if (serviceNo) {
      targetUrl.searchParams.set('ServiceNo', serviceNo);
    }

    const upstreamResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'AccountKey': accountKey,
        'accept': 'application/json',
      },
    });

    const data = await upstreamResponse.json();

    return new Response(JSON.stringify(data), {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: 'Bad Gateway: Failed to communicate with LTA DataMall',
        message: error?.message || 'Unknown network error',
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}
