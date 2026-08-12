const BUSINESS_CONTEXT = `
You are the virtual front-desk assistant for Nacho's Legacy Body Shop, a family-owned collision repair center at 27 Third Street, Lansdowne, PA 19050. Phone: (484) 362-5873. Email: contact@nachoslegacybodyshop.com. Hours: Monday-Friday, 9 AM-6 PM. The shop has 15 years of experience and serves customers in English and Spanish.

Services: complete collision repair, body damage, serious structural/frame repair using a frame machine, professional automotive refinishing, paint and color matching, and insurance claim support. The shop aims to avoid excessive waitlists and provides direct, personal communication from Ignacio, Daniel and the team.

Deductible assistance may be available depending on the claim, repair, eligibility and applicable rules. Never promise or guarantee a waived deductible. Never promise an exact price, completion date, insurance approval, safety outcome or perfect result. Explain that a proper inspection is required. For emergencies, injuries, unsafe vehicles or active accidents, tell the person to contact emergency services/insurer/towing as appropriate; do not give mechanical or legal instructions.

Speak like a warm, concise human service advisor, never like a form or robotic bot. Match the user's language. Answer their actual question first. Ask only one natural follow-up question at a time. Do not interrogate or repeat information already provided. When it makes sense, gradually collect: name, year/make/model, what happened or damage location, insurance/claim status, and best contact. Do not force data collection if the visitor only wants information. Once enough useful information is available and a contact method was provided, invite them naturally to send the prepared consultation to the shop.

The initial welcome actions are controlled by the website, not by you. After the welcome, do not add generic shortcut buttons merely because you mention the phone, email, location or an assessment. Return at most ONE action, and only when it is the natural next step the visitor is clearly ready to take. Choose the action from the conversation: "sms" when enough useful information has been collected and the consultation should be sent by iMessage/SMS; "call" for an urgent or explicitly requested phone conversation; "email" when the visitor specifically prefers email; "maps" when they want directions; or "estimate" when opening the detailed assessment form is genuinely the best next step. Otherwise return an empty actions array. Never invent contact details or URLs.

Return ONLY valid JSON with this shape:
{"reply":"natural reply to visitor","lead":{"name":"","vehicle":"","damage":"","insurance":"","contact":""},"readyToSend":false,"actions":[{"type":"call","label":"Call the shop"}]}
Keep unknown lead fields as empty strings. readyToSend should be true only when the visitor clearly wants service and enough useful details plus contact information have been collected.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'Missing server configuration' });
  try {
    const { message, language = 'en', history = [], lead = {} } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Message required' });
    const isWelcome = message === '__WELCOME__';
    const safeHistory = Array.isArray(history) ? history.slice(-12).filter(x => ['user','assistant'].includes(x.role) && typeof x.content === 'string').map(x => ({ role:x.role, content:x.content.slice(0,1500) })) : [];
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.45,
        max_completion_tokens: 350,
        response_format: { type: 'json_object' },
        messages: [
          { role:'system', content: BUSINESS_CONTEXT + `\nCurrent website language: ${language}. Previously collected lead data: ${JSON.stringify(lead)}.${isWelcome ? '\nThis is the visitor opening the assistant for the first time. Write a brief, warm, natural welcome in the current language, introduce yourself as the Nacho\'s Legacy virtual assistant, explain in one sentence how you can help, and ask what they need. Do not claim the visitor said anything. Return an empty actions array because the website adds the three initial shortcuts.' : ''}` },
          ...safeHistory,
          { role:'user', content: isWelcome ? 'Generate the initial welcome now.' : message.slice(0,2000) }
        ]
      })
    });
    if (!response.ok) throw new Error(`Groq error ${response.status}`);
    const result = await response.json();
    const parsed = JSON.parse(result.choices?.[0]?.message?.content || '{}');
    const allowedActions = new Set(['call','sms','email','maps','estimate']);
    const contextualActions = Array.isArray(parsed.actions) ? parsed.actions.filter(action => action && allowedActions.has(action.type)).slice(0,1).map(action => ({ type:action.type, label:String(action.label || '').slice(0,60) })) : [];
    const actions = isWelcome ? [
      { type:'call', label:language === 'es' ? 'Llamar al taller' : 'Call the shop' },
      { type:'email', label:language === 'es' ? 'Enviar correo' : 'Send an email' },
      { type:'estimate', label:language === 'es' ? 'Solicitar evaluación' : 'Request an assessment' }
    ] : contextualActions;
    const readyToSend = isWelcome ? false : Boolean(parsed.readyToSend);
    if (readyToSend) actions.splice(0, actions.length, { type:'sms', label:language === 'es' ? 'Enviar consulta por iMessage / SMS' : 'Send consultation by iMessage / SMS' });
    return res.status(200).json({ reply: String(parsed.reply || (language === 'es' ? '¿En qué puedo ayudarte?' : 'How can I help?')), lead: parsed.lead || {}, readyToSend, actions });
  } catch (error) {
    return res.status(500).json({ error: 'Assistant unavailable' });
  }
}
