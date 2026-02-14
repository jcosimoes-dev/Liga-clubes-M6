interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 shadow-md">
      <div className="px-6 py-5">
        <h1 className="text-xl font-bold text-white tracking-tight">
          {title}
        </h1>
      </div>
    </header>
  );
}
