export default function Card({ children, className = '', destaque = false, ...props }) {
  return (
    <div
      className={[
        'rounded-2xl border p-5 sm:p-6',
        destaque
          ? 'border-primaria/40 bg-fundo-claro/70 shadow-xl shadow-primaria/10'
          : 'border-white/10 bg-white/5',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
