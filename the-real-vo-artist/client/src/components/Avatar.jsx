export default function Avatar({ src, name = '?', size = 40, className = '' }) {
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const style = { width: size, height: size, fontSize: size * 0.38 };
  return src ? (
    <img src={src} alt={name} style={style} className={`shrink-0 rounded-full object-cover ${className}`} />
  ) : (
    <div style={style} className={`flex shrink-0 items-center justify-center rounded-full bg-violet-600/30 font-semibold text-violet-200 ${className}`}>
      {initials}
    </div>
  );
}
