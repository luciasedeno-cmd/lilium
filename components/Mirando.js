// «2 personas más están mirando este turno»: un ojo y el número (no sale nada si nadie más lo mira)
import { useTextos } from "./Idioma";

const TEXTOS = {
  es: {
    corto: (n) => `${n} ${n === 1 ? "persona" : "personas"} ${n === 1 ? "lo está" : "lo están"} mirando`,
    largo: (n) => (n === 1 ? "Otra persona está mirando este turno ahora mismo" : `${n} personas más están mirando este turno ahora mismo`),
  },
  en: {
    corto: (n) => `${n} ${n === 1 ? "person is" : "people are"} looking`,
    largo: (n) => (n === 1 ? "Someone else is looking at this session right now" : `${n} other people are looking at this session right now`),
  },
};

export default function Mirando({ n, largo = false, className = "" }) {
  const t = useTextos(TEXTOS);
  if (!n) return null;
  return (
    <p className={`mirando ${className}`} role="status">
      <svg className="mirando__ojo" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3.3" fill="currentColor" />
      </svg>
      <span>{largo ? t.largo(n) : t.corto(n)}</span>
    </p>
  );
}
