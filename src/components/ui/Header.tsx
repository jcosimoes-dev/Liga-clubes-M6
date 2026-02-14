interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header
      style={{
        padding: 24,
        background: "#0f766e",
        color: "white",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 600,
        }}
      >
        {title}
      </h1>
    </header>
  );
}