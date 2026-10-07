import { fallbackResponse } from '../lib/assistant-fallback.js';

const ALLOWED_ORIGINS = new Set([
  'https://www.nachoslegacy.com',
  'https://nachoslegacy.com',
  'https://nacholegacy.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 24;
const MAX_BODY_BYTES = 16_000;
const buckets = globalThis.__nachosChatRateBuckets || new Map();
globalThis.__nachosChatRateBuckets = buckets;

const BUSINESS_CONTEXT = `
You are the bilingual virtual front desk for Nacho's Legacy Body Shop, a family-owned collision repair center at 27 Third Street, Lansdowne, PA 19050. Phone: (484) 362-5873. Email: contact@nachoslegacybodyshop.com. Hours: Monday-Friday, 9 AM-6 PM. The shop has 15 years of experience and assists customers in English and Spanish.

Services: complete collision repair; body and panel repair; panel fitment and replacement of severely damaged parts; serious structural/frame repair using a frame machine; complete or partial automotive refinishing; in-house paint and color/texture matching; restoration; vehicle modifications; custom paint; professional detailing; and insurance claim support. The shop works on all makes and models. It does not provide state inspections, registration services, wheel alignment or balancing. Mechanical work is limited to what is required as part of an insurance collision repair.

Local service area: Lansdowne, Darby, Upper Darby, Folcroft, Clifton Heights, Yeadon and Drexel Hill, Pennsylvania. Estimates are free and normally require an appointment. Urgent same-day scheduling may be available after contacting the shop. Photos are useful for an initial assessment, but a precise estimate requires an in-person inspection.

Insurance and logistics: the shop regularly handles claims involving Progressive, GEICO, State Farm, OTTO and Allstate and can work with other insurers. Never imply an official affiliation or preferred-shop relationship. The shop can coordinate towing; cost varies by distance and transport complexity. Rental or towing benefits may be available through the customer's insurer. Credit-card payments are accepted through Square with a disclosed 3% processing adjustment; ask the customer to confirm current payment terms before authorization.

Warranty: a one-year limited workmanship warranty may cover qualifying paint die-back, peeling paint or clear coat, or an installed part becoming loose without a later collision or external damage. Never broaden the warranty or omit that terms and exclusions should be confirmed in writing on the repair order.

Useful timing guidance: timing varies by damage, insurance approval and parts availability. After approval, replacement parts commonly take 3-7 business days to arrive. Repairable/refinishable parts commonly require 3-4 days. Under normal conditions, a repair may be completed in approximately 7 business days after authorization and parts availability, but this is never a guarantee. Insurer adjuster scheduling can take days or sometimes weeks and is outside the shop's control; the shop follows up consistently.

Potential deductible assistance by eligible repair total: $2,000-$3,999 up to $300; $4,000-$5,999 up to $400; $6,000-$7,999 up to $500; $8,000-$9,999 up to $700; $10,000 or more up to $1,000. It is not automatic or guaranteed and depends on repair scope, claim terms, insurer requirements and shop approval. Never suggest changing or misrepresenting the documented repair scope. Never promise an exact price, completion date, insurer approval, safety result or perfect outcome. A proper inspection is required. For emergencies, injuries, unsafe vehicles or active accidents, direct the visitor to emergency services, their insurer or towing as appropriate; do not provide legal or mechanical instructions.

Be warm, concise and human. Match the website language unless the visitor clearly uses another language. In Spanish, use clear neutral Latin American Spanish, address the visitor naturally as tú, and prefer familiar automotive terms such as carrocería and pintura automotriz instead of literal technical translations. Answer the question first, then ask at most one natural follow-up. Never repeat details already provided. Gradually collect only what is useful: name, vehicle year/make/model, damage or what happened, insurance/claim status and preferred contact. Do not force lead collection for informational questions.

The website controls initial welcome shortcuts. After the welcome, return at most ONE contextual action and only when it is the natural next step: "sms" after useful details and contact information are collected; "call" for urgent or explicitly requested calls; "email" when email is preferred; "maps" for directions; "estimate" when the assessment form is the best next step. Otherwise return an empty actions array.

Return ONLY valid JSON:
{"reply":"natural answer","lead":{"name":"","vehicle":"","damage":"","insurance":"","contact":""},"readyToSend":false,"actions":[]}
Unknown lead fields must remain empty strings. readyToSend may be true only when the visitor wants service and has provided contact information plus vehicle or damage details.
`;

function setSecurityHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function clientIp(req) {
  return String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim().slice(0, 80);
}

function rateLimited(ip) {
  const now = Date.now();
  if (buckets.size > 500) for (const [key, value] of buckets) if (now - value.started > RATE_WINDOW_MS * 2) buckets.delete(key);
  const current = buckets.get(ip);
  if (!current || now - current.started >= RATE_WINDOW_MS) {
    buckets.set(ip, { started: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT;
}

function safeText(value, max = 240) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeLead(value = {}) {
  return {
    name: safeText(value.name, 100),
    vehicle: safeText(value.vehicle, 180),
    damage: safeText(value.damage, 500),
    insurance: safeText(value.insurance, 240),
    contact: safeText(value.contact, 180)
  };
}

function parseModelJson(content) {
  const cleaned = String(content || '').trim().replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/, '');
  return JSON.parse(cleaned || '{}');
}

async function askGroq(payload, models) {
  let lastError = new Error('No model available');
  for (const model of models) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(12_000),
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, ...payload })
      });
      if (!response.ok) {
        const providerError = new Error(`Provider status ${response.status}`);
        providerError.status = response.status;
        throw providerError;
      }
      const result = await response.json();
      return { parsed: parseModelJson(result.choices?.[0]?.message?.content), model };
    } catch (error) {
      lastError = error;
      if (error.status === 401 || error.status === 403 || error.status === 429) break;
    }
  }
  throw lastError;
}

export default async function handler(req, res) {
  setSecurityHeaders(res);
  const origin = safeText(req.headers?.origin, 300);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return res.status(403).json({ error: 'Origin not allowed' });
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const declaredLength = Number(req.headers?.['content-length'] || 0);
  if (declaredLength > MAX_BODY_BYTES) return res.status(413).json({ error: 'Request too large' });
  if (rateLimited(clientIp(req))) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Too many requests' });
  }

  let input;
  try {
    input = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  if (Buffer.byteLength(JSON.stringify(input), 'utf8') > MAX_BODY_BYTES) return res.status(413).json({ error: 'Request too large' });

  const message = safeText(input.message, 2_000);
  const language = input.language === 'es' ? 'es' : 'en';
  const isWelcome = message === '__WELCOME__';
  const previousLead = safeLead(input.lead);
  const fallback = () => ({ ...fallbackResponse(message, language), mode: 'fallback' });
  if (!message) return res.status(400).json({ error: 'Message required' });
  if (!process.env.GROQ_API_KEY) return res.status(200).json(fallback());

  const safeHistory = Array.isArray(input.history)
    ? input.history.slice(-12)
      .filter(item => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
      .map(item => ({ role: item.role, content: safeText(item.content, 1_500) }))
    : [];

  try {
    const modelPayload = {
      temperature: 0.35,
      max_completion_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: BUSINESS_CONTEXT + `\nCurrent website language: ${language}. Previously collected lead data: ${JSON.stringify(previousLead)}.` +
            (isWelcome ? `\nThis is the first opening. Give a brief welcome in ${language === 'es' ? 'Spanish' : 'English'}, identify yourself as the Nacho's Legacy virtual assistant, explain how you can help in one sentence, and ask what the visitor needs. Return an empty actions array because the website adds the initial shortcuts.` : '')
        },
        ...safeHistory,
        { role: 'user', content: isWelcome ? 'Generate the initial welcome.' : message }
      ]
    };
    const primaryModel = safeText(process.env.GROQ_MODEL, 120) || 'openai/gpt-oss-20b';
    const models = [...new Set([primaryModel, 'llama-3.3-70b-versatile'])];
    const { parsed, model } = await askGroq(modelPayload, models);
    const lead = { ...previousLead, ...safeLead(parsed.lead) };
    const allowedActions = new Set(['call', 'sms', 'email', 'maps', 'estimate']);
    const contextual = Array.isArray(parsed.actions)
      ? parsed.actions
        .filter(action => action && allowedActions.has(action.type))
        .slice(0, 1)
        .map(action => ({ type: action.type, label: safeText(action.label, 60) }))
      : [];
    const sufficientLead = Boolean(lead.contact && (lead.vehicle || lead.damage));
    const readyToSend = !isWelcome && Boolean(parsed.readyToSend) && sufficientLead;
    let actions = isWelcome ? [
      { type: 'call', label: language === 'es' ? 'Llamar al taller' : 'Call the shop' },
      { type: 'email', label: language === 'es' ? 'Enviar correo' : 'Send an email' },
      { type: 'estimate', label: language === 'es' ? 'Solicitar evaluación' : 'Request an assessment' }
    ] : contextual.filter(action => action.type !== 'sms' || sufficientLead);
    if (readyToSend) actions = [{ type: 'sms', label: language === 'es' ? 'Enviar consulta por iMessage / SMS' : 'Send consultation by iMessage / SMS' }];

    return res.status(200).json({
      reply: safeText(parsed.reply, 1_000) || (language === 'es' ? '¿En qué puedo ayudarte?' : 'How can I help?'),
      lead,
      readyToSend,
      actions,
      mode: 'ai',
      model
    });
  } catch (error) {
    console.error('Assistant provider unavailable:', error.name, safeText(error.message, 120));
    return res.status(200).json(fallback());
  }
}
