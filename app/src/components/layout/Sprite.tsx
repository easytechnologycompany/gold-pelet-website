/**
 * Every crisp and every icon on the site, as hand-authored SVG symbols.
 * Rendered once in the root layout; everything else references a symbol with
 * `<use href="#id">`.
 *
 * Hard invariant (CLAUDE.md §2): no external images, no icon CDN, no
 * `<img src="https://…">`. New artwork gets drawn here.
 */
export function Sprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="g-classic" viewBox="0 0 200 200">
          <path
            d="M100,24 C118,20 130,34 146,37 C164,40 178,54 172,70 C167,84 178,98 173,114 C168,132 150,138 140,150 C128,164 110,178 94,173 C77,168 66,153 52,147 C35,140 24,124 29,108 C34,93 22,80 29,64 C36,48 53,44 65,35 C77,26 88,27 100,24 Z"
            fill="currentColor"
            fillOpacity=".3"
            stroke="currentColor"
            strokeWidth="2"
          />
          <g fill="currentColor" fillOpacity=".5">
            <ellipse cx="80" cy="84" rx="9" ry="5.5" transform="rotate(-18 80 84)" />
            <ellipse cx="124" cy="120" rx="7" ry="4.5" transform="rotate(12 124 120)" />
            <ellipse cx="110" cy="62" rx="5" ry="3.5" />
          </g>
        </symbol>

        <symbol id="g-ridged" viewBox="0 0 200 200">
          <path
            d="M100,24 C118,20 130,34 146,37 C164,40 178,54 172,70 C167,84 178,98 173,114 C168,132 150,138 140,150 C128,164 110,178 94,173 C77,168 66,153 52,147 C35,140 24,124 29,108 C34,93 22,80 29,64 C36,48 53,44 65,35 C77,26 88,27 100,24 Z"
            fill="currentColor"
            fillOpacity=".3"
            stroke="currentColor"
            strokeWidth="2"
          />
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity=".55"
          >
            <path d="M58,62 C70,78 70,94 58,110 C48,122 50,134 58,144" />
            <path d="M88,44 C100,62 100,82 88,98 C76,114 78,132 88,150" />
            <path d="M120,44 C132,62 132,82 120,98 C108,114 110,132 120,152" />
            <path d="M148,60 C158,74 158,88 148,102 C138,116 140,128 148,140" />
          </g>
        </symbol>

        <symbol id="g-ring" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="64"
            fill="currentColor"
            fillOpacity=".3"
            stroke="currentColor"
            strokeWidth="2"
          />
          {/* Explicit --bg-2 so the hole matches the card's shot background.
              Inheriting --surface here turned the ring into a dark blob in
              dark mode — a bug found and fixed during the design session. */}
          <circle cx="100" cy="100" r="25" fill="var(--bg-2)" stroke="currentColor" strokeWidth="2" />
          <g fill="currentColor" fillOpacity=".5">
            <circle cx="74" cy="74" r="4" />
            <circle cx="128" cy="124" r="3.4" />
            <circle cx="130" cy="72" r="2.8" />
          </g>
        </symbol>

        <symbol id="g-curl" viewBox="0 0 200 200">
          <path
            d="M58,148 C36,126 42,86 70,66 C98,46 136,52 152,76 C166,98 158,124 138,132 C120,139 104,130 102,116 C100,102 110,92 122,94"
            fill="none"
            stroke="currentColor"
            strokeWidth="27"
            strokeLinecap="round"
            opacity=".3"
          />
          <path
            d="M58,148 C36,126 42,86 70,66 C98,46 136,52 152,76 C166,98 158,124 138,132 C120,139 104,130 102,116 C100,102 110,92 122,94"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            transform="translate(0,-13)"
          />
          <path
            d="M58,148 C36,126 42,86 70,66 C98,46 136,52 152,76 C166,98 158,124 138,132 C120,139 104,130 102,116 C100,102 110,92 122,94"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            transform="translate(0,13)"
          />
        </symbol>

        <symbol id="g-stick" viewBox="0 0 200 200">
          <g fill="currentColor" fillOpacity=".3" stroke="currentColor" strokeWidth="2">
            <rect x="32" y="46" width="20" height="114" rx="10" transform="rotate(-12 42 103)" />
            <rect x="74" y="36" width="20" height="128" rx="10" transform="rotate(4 84 100)" />
            <rect x="116" y="44" width="20" height="118" rx="10" transform="rotate(-7 126 103)" />
            <rect x="150" y="58" width="18" height="96" rx="9" transform="rotate(13 159 106)" />
          </g>
        </symbol>

        <symbol
          id="i-chev"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 5 7 7-7 7" />
        </symbol>

        <symbol
          id="i-check"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </symbol>

        <symbol
          id="i-cert"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="9" r="6" />
          <path d="m8.5 14-1.5 7 5-2.5 5 2.5-1.5-7" />
        </symbol>

        <symbol
          id="i-leaf"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 20c0-8 5-14 16-15 0 11-5 16-13 16H4Z" />
          <path d="M4 20c3-4 6-6.5 10-8.5" />
        </symbol>

        <symbol
          id="i-scan"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M7 12h10" />
        </symbol>

        <symbol
          id="i-truck"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 6.5h11v10H2zM13 10h4.5l3.5 3.5v3H13z" />
          <circle cx="6.5" cy="19" r="2" />
          <circle cx="17" cy="19" r="2" />
        </symbol>
      </defs>
    </svg>
  )
}
