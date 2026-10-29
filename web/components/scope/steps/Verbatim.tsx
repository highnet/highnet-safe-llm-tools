type VerbatimProps = { text: string };

// A model's words exactly as sent or received, wrapped so nothing scrolls sideways.
const Verbatim = ({ text }: VerbatimProps) => (
  <pre className="voice-data max-h-80 overflow-auto rounded-sm border border-dashed px-3 py-2 text-xs leading-relaxed break-words whitespace-pre-wrap">
    {text}
  </pre>
);

export { Verbatim };
