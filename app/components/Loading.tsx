export function Loading({ size = 100 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
    .bulb {
      transform-origin: 256px 256px;
      animation: pulse 1.6s ease-in-out infinite;
    }

    .rays {
      transform-origin: 256px 256px;
      animation: rays 1.6s ease-in-out infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.65);
      }
      50% {
        transform: scale(0.8);
      }
      100% {
        transform: scale(0.65);
      }
    }

    @keyframes bulbColor {
      0% {
        fill: #b8bcc6;
      }
      50% {
        fill: #f7c933;
      }
      100% {
        fill: #b8bcc6;
      }
    }

    @keyframes rays {
      0% {
        opacity: 0;
      }
      40% {
        opacity: 0.8;
      }
      50% {
        opacity: 1;
      }
      60% {
        opacity: 0.8;
      }
      100% {
        opacity: 0;
      }
    }

    .glass {
      animation: bulbColor 1.6s ease-in-out infinite;
    }
  `,
        }}
      />

      {/* Light rays */}
      <g className="rays" fill="#f7c933">
        <rect x="420" y="200" width="60" height="32" rx="8" />
        <rect x="32" y="200" width="60" height="32" rx="8" />

        <rect
          x="386"
          y="70"
          width="32"
          height="60"
          rx="8"
          transform="rotate(45 402 100)"
        />
        <rect
          x="40"
          y="330"
          width="32"
          height="60"
          rx="8"
          transform="rotate(45 110 392)"
        />

        <rect
          x="438"
          y="330"
          width="32"
          height="60"
          rx="8"
          transform="rotate(-45 402 392)"
        />
        <rect
          x="94"
          y="70"
          width="32"
          height="60"
          rx="8"
          transform="rotate(-45 110 100)"
        />
      </g>

      {/* Bulb */}
      <g className="bulb">
        {/* bulb body */}
        <path
          className="glass"
          d="
        M256 20
        C165 20 90 95 90 186
        C90 244 121 289 158 326
        C183 352 196 384 196 420
        L196 440
        L316 440
        L316 420
        C316 384 329 352 354 326
        C391 289 422 244 422 186
        C422 95 347 20 256 20
        Z
      "
        />

        {/* base */}
        <rect x="196" y="440" width="120" height="64" fill="#d5dbe5" />

        <rect
          x="196"
          y="472"
          width="120"
          height="64"
          rx="50"
          ry="50"
          fill="#d5dbe5"
        />

        {/* question mark */}
        <text
          x="256"
          y="255"
          textAnchor="middle"
          fontSize="170"
          fontFamily="Arial, sans-serif"
          fontWeight="700"
          fill="#2f418f"
        >
          ?
        </text>
      </g>
    </svg>
  );
}
