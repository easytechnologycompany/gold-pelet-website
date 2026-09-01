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

        {/* The eight shapes below complete a mark per catalogue product, so no
            two products fall back to the same drawing. Each depicts what its
            product actually is — the slugs name real shapes — rather than
            being an arbitrary token. Same construction as the four above:
            currentColor at .3 behind a 2px stroke, holes filled with --bg-2 so
            they read as holes in both themes rather than as dark blobs. */}

        <symbol id="g-fish" viewBox="0 0 200 200">
          <ellipse
            cx="114"
            cy="100"
            rx="54"
            ry="36"
            fill="currentColor"
            fillOpacity=".3"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M62,100 L26,70 L36,100 L26,130 Z"
            fill="currentColor"
            fillOpacity=".3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="146" cy="90" r="5" fill="currentColor" fillOpacity=".5" />
          <path
            d="M96,78 C108,88 108,112 96,122"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity=".45"
          />
        </symbol>

        <symbol id="g-ball" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="62"
            fill="currentColor"
            fillOpacity=".3"
            stroke="currentColor"
            strokeWidth="2"
          />
          <g fill="currentColor" fillOpacity=".5">
            <circle cx="78" cy="78" r="9" />
            <circle cx="122" cy="112" r="6" />
            <circle cx="112" cy="66" r="4" />
            <circle cx="72" cy="118" r="4.5" />
          </g>
        </symbol>

        <symbol id="g-window" viewBox="0 0 200 200">
          <rect
            x="36"
            y="36"
            width="128"
            height="128"
            rx="24"
            fill="currentColor"
            fillOpacity=".3"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="74"
            y="74"
            width="52"
            height="52"
            rx="14"
            fill="var(--bg-2)"
            stroke="currentColor"
            strokeWidth="2"
          />
          <g fill="currentColor" fillOpacity=".5">
            <circle cx="56" cy="56" r="3.4" />
            <circle cx="146" cy="146" r="3" />
          </g>
        </symbol>

        <symbol id="g-skin" viewBox="0 0 200 200">
          <path
            d="M38,152 C38,92 88,44 158,42 C152,100 108,152 38,152 Z"
            fill="currentColor"
            fillOpacity=".3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* The skin-on edge, drawn heavier than the cut edges. */}
          <path
            d="M38,152 C38,92 88,44 158,42"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            opacity=".55"
          />
          <g fill="currentColor" fillOpacity=".5">
            <ellipse cx="92" cy="108" rx="8" ry="5" transform="rotate(-24 92 108)" />
            <ellipse cx="118" cy="82" rx="6" ry="4" transform="rotate(-20 118 82)" />
          </g>
        </symbol>

        <symbol id="g-serrated" viewBox="0 0 200 200">
          <path
            d="M44,56 L60,44 L76,56 L92,44 L108,56 L124,44 L140,56 L156,44
               L156,144 L140,156 L124,144 L108,156 L92,144 L76,156 L60,144 L44,156 Z"
            fill="currentColor"
            fillOpacity=".3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity=".45"
          >
            <path d="M70,74 L70,126" />
            <path d="M100,70 L100,130" />
            <path d="M130,74 L130,126" />
          </g>
        </symbol>

        <symbol id="g-pipe" viewBox="0 0 200 200">
          <rect
            x="38"
            y="72"
            width="124"
            height="56"
            rx="28"
            fill="currentColor"
            fillOpacity=".3"
            stroke="currentColor"
            strokeWidth="2"
          />
          {/* The bore, at the near end. --bg-2 for the same reason as g-ring. */}
          <ellipse
            cx="146"
            cy="100"
            rx="15"
            ry="27"
            fill="var(--bg-2)"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M54,100 C54,86 60,78 68,74"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity=".45"
          />
        </symbol>

        <symbol id="g-ring-large" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="72"
            fill="currentColor"
            fillOpacity=".3"
            stroke="currentColor"
            strokeWidth="2"
          />
          {/* Wider bore than g-ring, which is what separates the large ring
              from the small one at a glance rather than absolute size — both
              are drawn to the same box. */}
          <circle cx="100" cy="100" r="44" fill="var(--bg-2)" stroke="currentColor" strokeWidth="2" />
          <g fill="currentColor" fillOpacity=".5">
            <circle cx="100" cy="42" r="3.6" />
            <circle cx="152" cy="120" r="3" />
          </g>
        </symbol>

        {/* Crinkle Smooth. The scalloped rim is the whole point: g-ridged is
            an irregular blob that happens to carry ridges, while a crinkle cut
            is round with a wavy perimeter, and the two must not be mistaken for
            each other on a page that shows both. */}
        <symbol id="g-crinkle" viewBox="0 0 200 200">
          <path
            d="M170.0,100.0 A15.7,15.7 0 0 1 164.7,126.8 A15.7,15.7 0 0 1 149.5,149.5 A15.7,15.7 0 0 1 126.8,164.7 A15.7,15.7 0 0 1 100.0,170.0 A15.7,15.7 0 0 1 73.2,164.7 A15.7,15.7 0 0 1 50.5,149.5 A15.7,15.7 0 0 1 35.3,126.8 A15.7,15.7 0 0 1 30.0,100.0 A15.7,15.7 0 0 1 35.3,73.2 A15.7,15.7 0 0 1 50.5,50.5 A15.7,15.7 0 0 1 73.2,35.3 A15.7,15.7 0 0 1 100.0,30.0 A15.7,15.7 0 0 1 126.8,35.3 A15.7,15.7 0 0 1 149.5,50.5 A15.7,15.7 0 0 1 164.7,73.2 A15.7,15.7 0 0 1 170.0,100.0 Z"
            fill="currentColor"
            fillOpacity=".3"
            stroke="currentColor"
            strokeWidth="2"
          />
          {/* Chords cut to the scallop valleys rather than the outer radius, so
              no ridge runs out past the rim it belongs to. */}
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".45">
            <path d="M54.3,66 L145.7,66" />
            <path d="M45.6,83 L154.4,83" />
            <path d="M43,100 L157,100" />
            <path d="M45.6,117 L154.4,117" />
            <path d="M54.3,134 L145.7,134" />
          </g>
        </symbol>

        {/* Square Tube. Drawn as a box rather than a bar because the section is
            what names it — g-pipe is the same object with a round bore, and
            side-on they would be one drawing. */}
        <symbol id="g-tube-square" viewBox="0 0 200 200">
          <path
            d="M50,86 L86,58 L142,58 L106,86 Z"
            fill="currentColor"
            fillOpacity=".18"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M106,86 L142,58 L142,114 L106,142 Z"
            fill="currentColor"
            fillOpacity=".18"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="50"
            y="86"
            width="56"
            height="56"
            fill="currentColor"
            fillOpacity=".3"
            stroke="currentColor"
            strokeWidth="2"
          />
          {/* The bore. --bg-2 for the same reason as g-ring: a hole has to stay
              a hole when the page goes dark. */}
          <rect
            x="64"
            y="100"
            width="28"
            height="28"
            fill="var(--bg-2)"
            stroke="currentColor"
            strokeWidth="2"
          />
        </symbol>

        {/* Cones. Hollow, so the mouth is a --bg-2 ellipse rather than a filled
            base — a solid triangle would read as a corn chip, which is a
            different product. */}
        <symbol id="g-cone" viewBox="0 0 200 200">
          <path
            d="M100,32 L148,140 A48,16 0 0 1 52,140 Z"
            fill="currentColor"
            fillOpacity=".3"
            stroke="currentColor"
            strokeWidth="2"
          />
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".45">
            <path d="M100,44 L100,140" />
            <path d="M92,46 L74,134" />
            <path d="M108,46 L126,134" />
          </g>
          <ellipse
            cx="100"
            cy="140"
            rx="48"
            ry="16"
            fill="var(--bg-2)"
            stroke="currentColor"
            strokeWidth="2"
          />
        </symbol>

        {/* Flat Small. Two overlapping discs and no surface marks at all: the
            product is defined by being plain and small, so the drawing carries
            that by showing more than one piece and nothing on them. */}
        <symbol id="g-flat-small" viewBox="0 0 200 200">
          <g fill="currentColor" fillOpacity=".3" stroke="currentColor" strokeWidth="2">
            <ellipse cx="74" cy="118" rx="46" ry="36" transform="rotate(-12 74 118)" />
            <ellipse cx="126" cy="84" rx="46" ry="36" transform="rotate(10 126 84)" />
          </g>
        </symbol>

        <symbol id="g-flower" viewBox="0 0 200 200">
          <g
            fill="currentColor"
            fillOpacity=".3"
            stroke="currentColor"
            strokeWidth="2"
          >
            <ellipse cx="100" cy="56" rx="23" ry="30" />
            <ellipse cx="100" cy="56" rx="23" ry="30" transform="rotate(60 100 100)" />
            <ellipse cx="100" cy="56" rx="23" ry="30" transform="rotate(120 100 100)" />
            <ellipse cx="100" cy="56" rx="23" ry="30" transform="rotate(180 100 100)" />
            <ellipse cx="100" cy="56" rx="23" ry="30" transform="rotate(240 100 100)" />
            <ellipse cx="100" cy="56" rx="23" ry="30" transform="rotate(300 100 100)" />
          </g>
          <circle cx="100" cy="100" r="21" fill="var(--bg-2)" stroke="currentColor" strokeWidth="2" />
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
