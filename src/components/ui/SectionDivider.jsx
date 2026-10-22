function SectionDivider({ fromColor = '#FFFCF8', toColor = '#FDF6EC', flip = false }) {
  return (
    <div
      aria-hidden="true"
      className="relative h-8 w-full overflow-hidden sm:h-14"
      style={{ backgroundColor: fromColor }}
    >
      <svg
        className={`absolute inset-0 h-full w-full ${flip ? 'rotate-180' : ''}`}
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
      >
        <path
          d="M0,32 C240,80 480,0 720,24 C960,48 1200,96 1440,40 L1440,80 L0,80 Z"
          fill={toColor}
        />
      </svg>
    </div>
  )
}

export default SectionDivider
