const rainDrops = Array.from({ length: 24 }, (_, index) => ({
  left: `${(index + 1) * 4}%`,
  delay: `${(index % 7) * 0.6}s`,
  duration: `${7 + (index % 5) * 1.4}s`,
  opacity: 0.22 + (index % 4) * 0.08,
}));

const sparkles = Array.from({ length: 18 }, (_, index) => ({
  left: `${8 + (index * 5) % 82}%`,
  top: `${6 + (index * 7) % 78}%`,
  delay: `${(index % 6) * 0.35}s`,
  duration: `${2.1 + (index % 4) * 0.4}s`,
}));

const floatingElements = [
  { left: '8%', top: '14%', delay: '0s', icon: 'plane', size: 'lg' },
  { left: '85%', top: '18%', delay: '1.4s', icon: 'compass', size: 'md' },
  { left: '10%', top: '61%', delay: '2.1s', icon: 'palm', size: 'lg' },
  { left: '82%', top: '70%', delay: '0.8s', icon: 'anchor', size: 'md' },
  { left: '58%', top: '12%', delay: '2.8s', icon: 'plane', size: 'sm' },
  { left: '63%', top: '78%', delay: '1.9s', icon: 'compass', size: 'sm' },
];

function TravelGlyph({ icon }) {
  if (icon === 'plane') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 19l20-7-20-7 5 7-5 7Z" />
        <path d="M8 12h8" />
      </svg>
    );
  }

  if (icon === 'compass') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <path d="m10 14 1.5-4 4-1.5-1.5 4L10 14Z" />
      </svg>
    );
  }

  if (icon === 'palm') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22v-8" />
        <path d="M12 14c-1-2-3.5-3.5-6-3" />
        <path d="M12 14c1-2 3.5-3.5 6-3" />
        <path d="M12 10c-1.7-2.5-4.2-4-7-4" />
        <path d="M12 10c1.7-2.5 4.2-4 7-4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <path d="M5 10a7 7 0 0 1 14 0" />
      <path d="M7 10h10" />
      <path d="m9 21 3-3 3 3" />
    </svg>
  );
}

export default function AmbientScene() {
  return (
    <div className="tf-ambient-scene" aria-hidden="true">
      {rainDrops.map((drop, index) => (
        <span
          key={`rain-${index}`}
          className="tf-rain-drop"
          style={{ left: drop.left, animationDelay: drop.delay, animationDuration: drop.duration, opacity: drop.opacity }}
        />
      ))}

      {sparkles.map((sparkle, index) => (
        <span
          key={`sparkle-${index}`}
          className="tf-sparkle"
          style={{ left: sparkle.left, top: sparkle.top, animationDelay: sparkle.delay, animationDuration: sparkle.duration }}
        />
      ))}

      {floatingElements.map((item, index) => (
        <div
          key={`float-${index}`}
          className="tf-floating-element"
          data-size={item.size}
          style={{ left: item.left, top: item.top, animationDelay: item.delay }}
        >
          <TravelGlyph icon={item.icon} />
        </div>
      ))}
    </div>
  );
}
