export default function RatingStars({
  rating,
  count,
  size = 14,
}: {
  rating: number;
  count?: number;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex text-gold">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.3 1.3-6.5-4.9-4.6 6.6-.8L12 2.5z" />
          </svg>
        ))}
      </span>
      {count != null && count > 0 && <span className="text-xs text-mocha">({count})</span>}
    </span>
  );
}
