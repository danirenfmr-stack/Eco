import React, { useState, useRef, useEffect } from 'react';
import { Send, Wind, Eye, PenLine, MessageCircle, AlertCircle, Phone, X, Sparkles, RotateCcw } from 'lucide-react';

/* ---------- Tokens ---------- */
const COLORS = {
  paper: '#FAF8F5',
  paperDeep: '#F3EFE8',
  ink: '#2B2A33',
  inkSoft: '#726E7C',
  accent: '#5B4B8A',
  accentDeep: '#463A6E',
  accentSoft: '#EEEAF7',
  moderate: '#AD7A2C',
  crisis: '#A03D50',
  crisisSoft: '#F8E9EC',
  border: '#E7E1D6',
  surface: '#FFFFFF',
};

const FONT_HEAD = "'Fraunces', Georgia, serif";
const FONT_BODY = "'Work Sans', system-ui, sans-serif";

/* ---------- Eco's brain ---------- */
const SYSTEM_PROMPT = `Eres "Eco", un compañero de reflexión. Tu única función es escuchar, no aconsejar. No eres terapeuta ni sustituyes ayuda profesional, y lo aclaras con calidez si te lo preguntan directamente.

CÓMO RESPONDES:
- Nunca das consejos directos ni dices qué "debería" hacer o pensar la persona.
- Respondes sobre todo con preguntas abiertas y reflexivas (escucha activa), o reflejando/parafraseando lo que dice para que se sienta escuchada, no juzgada.
- Tono cálido, cercano, humano. Nunca clínico ni robótico. Máximo 2-4 frases por respuesta.
- Nunca diagnosticas ni usas etiquetas clínicas.
- De vez en cuando —no en cada mensaje— si crees que puede ayudar, invitas (nunca impones) a probar una técnica breve: respiración, un ejercicio sensorial de grounding, o escritura reflexiva.

CLASIFICA la gravedad de cada mensaje del usuario en exactamente uno de estos niveles:
- "leve": estrés cotidiano, reflexión general, frustraciones normales
- "moderado": tristeza persistente, ansiedad notable, conflictos importantes, angustia sostenida
- "crisis": autolesión, ideas suicidas, desesperanza extrema, intención de hacerse daño a sí mismo/a o a otras personas, o cualquier señal de peligro inmediato

Si detectas "crisis": rompe el patrón normal de solo preguntar. Valida con calidez lo que siente y anímale de forma clara y directa a buscar apoyo humano real ahora mismo (la interfaz también mostrará recursos). No le restes importancia ofreciendo solo un ejercicio de respiración como si bastara.

Responde ÚNICAMENTE con JSON válido, sin texto antes ni después, exactamente con esta forma:
{"severity": "leve", "response": "tu respuesta aquí", "technique": null}
o, cuando invites a una técnica:
{"severity": "moderado", "response": "tu respuesta aquí", "technique": {"type": "respiracion", "name": "nombre breve de la técnica", "invite": "una frase de invitación breve"}}

"technique.type" debe ser exactamente uno de estos tres valores: "respiracion", "grounding", "journaling". Usa "technique": null cuando no aplique.`;

const CRISIS_KEYWORDS = [
  'suicid', 'matarme', 'quitarme la vida', 'no quiero vivir', 'no quiero seguir viviendo',
  'acabar con todo', 'acabar con mi vida', 'hacerme daño', 'autolesio', 'cortarme',
  'quiero morir', 'quiero desaparecer', 'no vale la pena vivir', 'mejor estaria muerto',
  'mejor estaria muerta', 'no aguanto mas vivir', 'matar a', 'hacerle daño a',
];

function detectCrisis(text) {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

const CRISIS_RESOURCES = [
  { title: '024', desc: 'Línea de atención a la conducta suicida en España. Gratuita y confidencial, 24 horas.' },
  { title: 'Teléfono ANAR', desc: 'Para niños y adolescentes en España: 900 20 20 10. Gratuito, 24 horas.' },
  { title: 'Find a Helpline', desc: 'Directorio internacional de líneas de ayuda verificadas, en findahelpline.com.' },
  { title: 'Emergencias', desc: 'El 112 en España y la Unión Europea, el 911 en gran parte de América.' },
];

const JOURNAL_PROMPTS = [
  '¿Qué es lo que más pesa hoy?',
  '¿Qué necesitarías escuchar ahora mismo?',
  '¿Qué ha cambiado desde ayer?',
  'Si esta emoción pudiera hablar, ¿qué diría?',
];

/* ---------- Piezas pequeñas ---------- */
function SeverityDot({ severity }) {
  const color = severity === 'crisis' ? COLORS.crisis : severity === 'moderado' ? COLORS.moderate : COLORS.accent;
  return <span style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: color, display: 'inline-block' }} />;
}

/* ---------- Técnicas / juegos ---------- */
function BreathingExercise() {
  const phases = [
    { label: 'Inhala', duration: 4000, scale: 1.35 },
    { label: 'Sostén', duration: 4000, scale: 1.35 },
    { label: 'Exhala', duration: 5000, scale: 0.82 },
    { label: 'Sostén', duration: 2000, scale: 0.82 },
  ];
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPhase((p) => (p + 1) % phases.length), phases[phase].duration);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 4px' }}>
      <h3 style={{ fontFamily: FONT_HEAD, color: COLORS.ink, fontSize: 19, fontWeight: 500, margin: 0 }}>Respiración guiada</h3>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginTop: 4, marginBottom: 28 }}>Sigue el ritmo del círculo con tu respiración</p>
      <div
        style={{
          width: 132,
          height: 132,
          borderRadius: 999,
          backgroundColor: COLORS.accentSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${phases[phase].scale})`,
          transition: `transform ${phases[phase].duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        <span style={{ color: COLORS.accentDeep, fontFamily: FONT_HEAD, fontSize: 17 }}>{phases[phase].label}</span>
      </div>
    </div>
  );
}

function GroundingExercise() {
  const items = [
    { n: 5, label: 'cosas que puedes ver' },
    { n: 4, label: 'cosas que puedes tocar' },
    { n: 3, label: 'cosas que puedes oír' },
    { n: 2, label: 'cosas que puedes oler' },
    { n: 1, label: 'cosa que puedes saborear, o te gustaría' },
  ];
  const [answers, setAnswers] = useState({ 5: '', 4: '', 3: '', 2: '', 1: '' });

  return (
    <div style={{ padding: '4px 0' }}>
      <h3 style={{ fontFamily: FONT_HEAD, color: COLORS.ink, fontSize: 19, fontWeight: 500, margin: 0 }}>Grounding, 5-4-3-2-1</h3>
      <p style={{ color: COLORS.inkSoft, fontSize: 13, marginTop: 4, marginBottom: 18 }}>Nombra, con tus palabras, lo que percibes ahora mismo.</p>
      {items.map((item) => (
        <div key={item.n} style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: COLORS.inkSoft }}>{item.n} {item.label}</label>
          <input
            value={answers[item.n]}
            onChange={(e) => setAnswers({ ...answers, [item.n]: e.target.value })}
            placeholder="Escribe aquí..."
            style={{
              width: '100%', boxSizing: 'border-box', border: `1px solid ${COLORS.border}`, borderRadius: 10,
              padding: '9px 12px', fontSize: 14, marginTop: 5, outline: 'none', fontFamily: FONT_BODY, color: COLORS.ink,
              backgroundColor: COLORS.surface,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function JournalingExercise({ prompt, onSave }) {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  return (
    <div style={{ padding: '4px 0' }}>
      <h3 style={{ fontFamily: FONT_HEAD, color: COLORS.ink, fontSize: 19, fontWeight: 500, margin: 0 }}>Escritura reflexiva</h3>
      <p style={{ color: COLORS.inkSoft, fontSize: 14, marginTop: 8, marginBottom: 12 }}>{prompt}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Escribe con libertad, nadie más lo lee..."
        style={{
          width: '100%', boxSizing: 'border-box', border: `1px solid ${COLORS.border}`, borderRadius: 10,
          padding: 12, fontSize: 14, outline: 'none', fontFamily: FONT_BODY, color: COLORS.ink, resize: 'vertical',
          backgroundColor: COLORS.surface,
        }}
      />
      <button
        onClick={() => { onSave(text); setSaved(true); }}
        style={{
          marginTop: 12, backgroundColor: COLORS.accent, color: '#fff', border: 'none', borderRadius: 999,
          padding: '9px 20px', fontSize: 13, fontWeight: 500, fontFamily: FONT_BODY, cursor: 'pointer',
        }}
      >
        {saved ? 'Guardado' : 'Guardar para mí'}
      </button>
    </div>
  );
}

function TechniqueModal({ technique, onClose, onSaveJournal }) {
  if (!technique) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(43,42,51,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: COLORS.surface, borderRadius: 20, width: '100%', maxWidth: 380, maxHeight: '85vh', overflowY: 'auto', padding: '22px 22px 26px', position: 'relative' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft }}>
          <X size={19} />
        </button>
        {technique.type === 'respiracion' && <BreathingExercise />}
        {technique.type === 'grounding' && <GroundingExercise />}
        {technique.type === 'journaling' && (
          <JournalingExercise prompt={technique.invite || JOURNAL_PROMPTS[0]} onSave={onSaveJournal} />
        )}
      </div>
    </div>
  );
}

function ResourcesModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(43,42,51,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: COLORS.surface, borderRadius: 20, width: '100%', maxWidth: 380, padding: '22px 22px 24px', position: 'relative' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft }}>
          <X size={19} />
        </button>
        <h3 style={{ fontFamily: FONT_HEAD, color: COLORS.ink, fontSize: 19, fontWeight: 500, margin: 0 }}>Ayuda inmediata</h3>
        <p style={{ color: COLORS.inkSoft, fontSize: 13, marginTop: 6, marginBottom: 16, lineHeight: 1.5 }}>
          Eco no sustituye a un profesional. Si hay peligro inmediato, contacta a los servicios de emergencia.
        </p>
        <div>
          {CRISIS_RESOURCES.map((r, i) => (
            <div key={r.title} style={{ paddingTop: i === 0 ? 0 : 12, paddingBottom: 12, borderBottom: i < CRISIS_RESOURCES.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: COLORS.ink }}>{r.title}</p>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.45 }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- App principal ---------- */
export default function App() {
  const [screen, setScreen] = useState('intro');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [severity, setSeverity] = useState(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showTechniquesMenu, setShowTechniquesMenu] = useState(false);
  const [activeTechnique, setActiveTechnique] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('eco:messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length) {
          setMessages(parsed);
          setScreen('chat');
        }
      }
    } catch (e) {
      /* aún no hay conversación guardada */
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const persist = (msgs) => {
    try {
      localStorage.setItem('eco:messages', JSON.stringify(msgs));
    } catch (e) {
      /* fallo silencioso: no debe interrumpir la conversación */
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    const localCrisis = detectCrisis(text);

    try {
      const apiMessages = history.map((m) => ({ role: m.role, content: m.text }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: SYSTEM_PROMPT, messages: apiMessages }),
      });

      if (!res.ok) throw new Error('network');
      const data = await res.json();
      const textBlock = (data.content || []).find((c) => c.type === 'text');
      if (!textBlock) throw new Error('no-content');

      let parsed;
      try {
        const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        parsed = { severity: 'leve', response: textBlock.text, technique: null };
      }

      const finalSeverity = localCrisis ? 'crisis' : parsed.severity;
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: parsed.response || 'Estoy aquí. Cuéntame más, si quieres.',
        technique: parsed.technique || null,
      };
      const updated = [...history, aiMsg];
      setMessages(updated);
      setSeverity(finalSeverity);
      if (finalSeverity === 'crisis') setShowCrisis(true);
      persist(updated);
    } catch (err) {
      const fallbackText = localCrisis
        ? 'Lo que compartes suena muy serio. Ahora mismo no puedo responder bien, pero quiero asegurarme de que tengas apoyo real — mira los recursos de aquí abajo.'
        : 'No he podido responder ahora mismo. ¿Puedes intentarlo de nuevo en un momento?';
      const aiMsg = { id: Date.now() + 1, role: 'assistant', text: fallbackText, technique: null };
      const updated = [...history, aiMsg];
      setMessages(updated);
      if (localCrisis) {
        setSeverity('crisis');
        setShowCrisis(true);
      }
      persist(updated);
    } finally {
      setLoading(false);
    }
  };

  const saveJournal = (text) => {
    if (!text || !text.trim()) return;
    try {
      localStorage.setItem(`eco:journal:${Date.now()}`, text);
    } catch (e) {
      /* fallo silencioso */
    }
  };

  const openTechnique = (type, invite) => {
    setActiveTechnique({ type, invite });
    setShowTechniquesMenu(false);
  };

  const resetConversation = () => {
    if (!window.confirm('¿Borrar toda la conversación? Esto no se puede deshacer.')) return;
    setMessages([]);
    setSeverity(null);
    setShowCrisis(false);
    localStorage.removeItem('eco:messages');
  };

  /* ---------- Pantalla de intro ---------- */
  if (screen === 'intro') {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${COLORS.paperDeep} 0%, ${COLORS.paper} 55%)`, fontFamily: FONT_BODY, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: 999, backgroundColor: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, animation: 'ecoPulse 4s ease-in-out infinite' }}>
          <MessageCircle color="#fff" size={26} />
        </div>
        <h1 style={{ fontFamily: FONT_HEAD, fontSize: 34, fontWeight: 500, color: COLORS.ink, margin: '0 0 10px' }}>Eco</h1>
        <p style={{ color: COLORS.inkSoft, fontSize: 15, lineHeight: 1.55, maxWidth: 270, margin: '0 0 30px' }}>
          Un espacio para escucharte a ti mismo. Eco no te aconseja: te acompaña con preguntas, algo de calma y alguna técnica si te apetece.
        </p>
        <button
          onClick={() => setScreen('chat')}
          style={{ backgroundColor: COLORS.accent, color: '#fff', border: 'none', borderRadius: 999, padding: '13px 34px', fontSize: 15, fontWeight: 500, fontFamily: FONT_BODY, cursor: 'pointer', marginBottom: 18 }}
        >
          Comenzar
        </button>
        <button onClick={() => setShowResources(true)} style={{ background: 'none', border: 'none', color: COLORS.inkSoft, fontSize: 13, textDecoration: 'underline', cursor: 'pointer', marginBottom: 30, fontFamily: FONT_BODY }}>
          Ver recursos de ayuda inmediata
        </button>
        <p style={{ color: COLORS.inkSoft, fontSize: 12, lineHeight: 1.5, maxWidth: 270, opacity: 0.85 }}>
          Eco no sustituye a un profesional de salud mental. Si estás en peligro inmediato, contacta a los servicios de emergencia de tu país.
        </p>
        {showResources && <ResourcesModal onClose={() => setShowResources(false)} />}
      </div>
    );
  }

  /* ---------- Pantalla de chat ---------- */
  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.paper, fontFamily: FONT_BODY, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 999, backgroundColor: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle color="#fff" size={14} />
          </div>
          <span style={{ fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 17, color: COLORS.ink }}>Eco</span>
          {severity && <SeverityDot severity={severity} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setShowTechniquesMenu(true)} title="Técnicas" style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft, display: 'flex' }}>
            <Sparkles size={18} />
          </button>
          <button onClick={() => setShowResources(true)} title="Ayuda inmediata" style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft, display: 'flex' }}>
            <Phone size={18} />
          </button>
          <button onClick={resetConversation} title="Borrar conversación" style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft, display: 'flex' }}>
            <RotateCcw size={17} />
          </button>
        </div>
      </div>

      {showCrisis && (
        <div style={{ backgroundColor: COLORS.crisisSoft, padding: '12px 16px', borderBottom: `1px solid ${COLORS.crisis}22` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
            <AlertCircle size={17} color={COLORS.crisis} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 6px', fontSize: 13.5, fontWeight: 500, color: COLORS.crisis }}>Esto suena muy serio. Mereces apoyo real ahora mismo.</p>
              {CRISIS_RESOURCES.map((r) => (
                <p key={r.title} style={{ margin: '0 0 2px', fontSize: 12, color: COLORS.crisis, opacity: 0.85, lineHeight: 1.4 }}>
                  <strong style={{ fontWeight: 600 }}>{r.title}:</strong> {r.desc}
                </p>
              ))}
            </div>
            <button onClick={() => setShowCrisis(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.crisis, opacity: 0.6, flexShrink: 0 }}>
 
