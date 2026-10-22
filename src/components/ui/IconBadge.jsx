const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
}

const iconSizeMap = {
  sm: 16,
  md: 20,
  lg: 26,
}

function IconBadge({ icon: Icon, size = 'md', tone = 'terracotta', className = '' }) {
  const toneClasses =
    tone === 'forest'
      ? 'bg-[#047857]/10 text-[#047857]'
      : tone === 'white'
      ? 'bg-white/15 text-white'
      : 'bg-[#C2410C]/10 text-[#C2410C]'

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${sizeMap[size]} ${toneClasses} ${className}`}
    >
      <Icon size={iconSizeMap[size]} strokeWidth={2} aria-hidden="true" />
    </span>
  )
}

export default IconBadge
