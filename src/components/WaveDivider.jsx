// Vagues animées (deux calques) pour séparer une section photo du contenu : clin d'œil à la piscine.
const path = 'M0 60 C240 20 480 100 720 60 S1200 20 1440 60 C1680 20 1920 100 2160 60 S2640 20 2880 60 V120 H0Z'

export default function WaveDivider({ fill = '#FFFCF8', className = '' }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 -bottom-px h-14 overflow-hidden leading-none sm:h-24 ${className}`} aria-hidden="true">
      <svg className="wave-a absolute bottom-0 h-full w-[200%] max-w-none" viewBox="0 0 2880 120" preserveAspectRatio="none">
        <path d={path} fill={fill} fillOpacity="0.45" />
      </svg>
      <svg className="wave-b absolute bottom-0 h-[78%] w-[200%] max-w-none" viewBox="0 0 2880 120" preserveAspectRatio="none">
        <path d={path} fill={fill} />
      </svg>
    </div>
  )
}
