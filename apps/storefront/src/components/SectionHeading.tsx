export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={`mb-10 ${align === 'center' ? 'text-center' : 'text-left'}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-espresso sm:text-4xl">{title}</h2>
      {subtitle && <p className={`mt-3 max-w-xl text-sm leading-relaxed text-mocha ${align === 'center' ? 'mx-auto' : ''}`}>{subtitle}</p>}
      <div className={`mt-5 gold-divider ${align === 'left' ? '!mx-0' : ''}`} />
    </div>
  );
}
