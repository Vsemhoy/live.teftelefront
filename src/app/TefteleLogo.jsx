export const TefteleLogo = () => (
  <svg
    width="120"
    height="40"
    viewBox="-60 -20 120 40"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Teftele"
    style={{ display: 'block' }}
  >
    <rect x="-60" y="-20" width="120" height="40" rx="8"
      fill="var(--color-background-secondary)" />

    {/* Иконка TF */}
    <rect x="-52" y="-10" width="20" height="20" rx="4" fill="#0f172a" />
    {/* T белый */}
    <rect x="-50" y="-6"  width="8"  height="4"  rx="1.5" fill="white" />
    <rect x="-46" y="-2"  width="4"  height="8"  rx="1.5" fill="white" />
    {/* F жёлтый */}
    <rect x="-41" y="-6"  width="8"  height="4"  rx="1.5" fill="#fbbf24" />
    <rect x="-41" y="-2"  width="4"  height="8"  rx="1.5" fill="#fbbf24" />
    <rect x="-41" y="1"   width="5"  height="3"  rx="1.5" fill="#fbbf24" opacity="0.7" />

    {/* Wordmark */}
    <text
      x="-24" y="5"
      fontFamily="var(--font-sans)"
      fontSize="14"
      fontWeight="500"
      fill="var(--color-text-primary)"
    >
      teftele
    </text>
  </svg>
);
