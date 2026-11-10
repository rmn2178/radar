export function ResearchVisual() {
  return (
    <div className="research-visual" aria-hidden="true">
      <svg viewBox="0 0 520 520" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hero-grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" stroke="#0D2749" strokeOpacity="0.07" strokeWidth="1" /></pattern>
          <linearGradient id="arc-teal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#087E83" /><stop offset="1" stopColor="#0D2749" /></linearGradient>
        </defs>
        <rect width="520" height="520" fill="url(#hero-grid)" />
        <circle cx="260" cy="250" r="196" stroke="#0D2749" strokeOpacity="0.12" />
        <circle cx="260" cy="250" r="150" stroke="#0D2749" strokeOpacity="0.16" strokeDasharray="3 7" />
        <circle cx="260" cy="250" r="104" stroke="#087E83" strokeOpacity="0.35" />
        <path d="M260 54a196 196 0 0 1 169 97" stroke="url(#arc-teal)" strokeWidth="10" strokeLinecap="round" />
        <path d="M429 347a196 196 0 0 1-169 99" stroke="#C69A39" strokeWidth="6" strokeLinecap="round" />
        <path d="M91 347a196 196 0 0 1-27-99" stroke="#087E83" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
        <path d="M156 250h44l18-42 26 84 22-58 16 16h82" stroke="#087E83" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <g stroke="#0D2749" strokeWidth="1.5" opacity="0.65">
          <path d="M330 150l38-30M368 120h44M348 196l52-12M400 184h30M340 292l54 22M394 314h34" />
        </g>
        <g fill="#0D2749"><circle cx="368" cy="120" r="5" /><circle cx="400" cy="184" r="5" /><circle cx="394" cy="314" r="5" /></g>
        <g fill="#087E83"><circle cx="412" cy="120" r="4" /><circle cx="430" cy="184" r="4" /><circle cx="428" cy="314" r="4" /></g>
        <circle cx="260" cy="250" r="58" fill="#FAFAF7" stroke="#0D2749" strokeOpacity="0.2" />
        <path d="M238 250c0-18 10-30 24-30 12 0 20 8 20 18 0 14-12 18-12 30M260 282v2" stroke="#0D2749" strokeWidth="3" strokeLinecap="round" />
        <circle cx="260" cy="250" r="74" stroke="#C69A39" strokeOpacity="0.5" strokeDasharray="2 6" />
        <g fontFamily="Manrope, sans-serif" fontSize="10" letterSpacing="2" fill="#778394"><text x="72" y="470">IMAGING</text><text x="228" y="470">INTELLIGENCE</text><text x="392" y="470">SENSING</text></g>
      </svg>
    </div>
  );
}
