/**
 * Serverless Health Check Endpoint
 * GET /api/health
 */

import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  service: string;
  hasLtaKey: boolean;
  uptimeSeconds: number;
}

const startTime = Date.now();

/**
 * Standard Vercel / Express serverless request handler
 */
export default async function handler(
  req: ExpressRequest | any,
  res: ExpressResponse | any
) {
  // Set CORS headers
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, AccountKey');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const hasLtaKey = Boolean(process.env.LTA_ACCOUNT_KEY || process.env.LTA_DATAMALL_KEY);

  const payload: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sg-lta-bus-arrival-api',
    hasLtaKey,
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
  };

  return res.status(200).json(payload);
}

/**
 * Web Standard edge runtime handler (Next.js / Cloudflare / Fetch API)
 */
export async function GET(request: Request): Promise<Response> {
  const hasLtaKey = Boolean(process.env.LTA_ACCOUNT_KEY || process.env.LTA_DATAMALL_KEY);

  const payload: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sg-lta-bus-arrival-api',
    hasLtaKey,
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
