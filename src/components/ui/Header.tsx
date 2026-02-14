interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="bg-gradient-to-b from-emerald-700 to-emerald-600 shadow-md">
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base opacity-80">🎾</span>
          <h1 className="text-base font-bold text-white tracking-wide">
            Equipa M6 APC Nome Patrocínio
          </h1>
        </div>

        <div className="h-px bg-white/25 mb-3" />

        <h2 className="text-2xl font-semibold text-white leading-tight">
          {title}
        </h2>
      </div>
    </header>
  );
}
