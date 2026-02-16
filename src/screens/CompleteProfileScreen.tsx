import { useState } from "react";
import { useAuth, type PreferredSide } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

// Ajusta estes imports conforme o teu UI kit
import { Card, Button, Input } from "../components/ui"; // <- se isto não existir, diz-me o que estás a usar

export function CompleteProfileScreen() {
  const { player, refreshPlayer } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    phone: string;
    federation_points: number;
    preferred_side: PreferredSide;
  }>({
    phone: "",
    federation_points: 0,
    preferred_side: "Jogador Direita",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!player?.id) throw new Error("Jogador não encontrado");

      const { error: updErr } = await supabase
        .from("players")
        .update({
          phone: form.phone || null,
          federation_points: Number.isFinite(form.federation_points) ? form.federation_points : 0,
          preferred_side: form.preferred_side,
          profile_completed: true,
        })
        .eq("id", player.id);

      if (updErr) throw updErr;

      await refreshPlayer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao guardar perfil";
      setError(msg);
      console.error("CompleteProfileScreen submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-xl font-bold mb-2">Completa o teu perfil</h1>
        <p className="text-sm text-gray-600 mb-4">Só falta isto para arrancarmos.</p>

        {error && (
          <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Telefone</label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((s) => ({ ...s, phone: e.target.value }))
              }
              placeholder="912345678"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Pontos de Federação</label>
            <Input
              type="number"
              value={form.federation_points}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((s) => ({ ...s, federation_points: parseInt(e.target.value || "0", 10) || 0 }))
              }
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Lado Preferencial</label>
            <select
              value={form.preferred_side}
              onChange={(e) => setForm((s) => ({ ...s, preferred_side: e.target.value as PreferredSide }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg"
            >
              <option value="Jogador Esquerda">Jogador Esquerda</option>
              <option value="Jogador Direita">Jogador Direita</option>
              <option value="Ambos os lados">Ambos os lados</option>
            </select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A guardar..." : "Guardar e Continuar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}