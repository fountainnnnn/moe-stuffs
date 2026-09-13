export default function AuraBadge({
  aura,
  size = "md",
}: {
  aura: number;
  size?: "sm" | "md" | "lg";
}) {
  const pad =
    size === "lg"
      ? "px-4 py-1.5 text-2xl"
      : size === "sm"
        ? "px-2 py-0.5 text-xs"
        : "px-3 py-1 text-base";
  return (
    <span
      className={`inline-flex items-baseline gap-1 rounded-full border-[2.5px] border-ink font-extrabold tabular-nums ${pad}`}
      style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
      title={`${aura} aura`}
    >
      <span>{aura}</span>
      <span className="text-[0.7em] uppercase tracking-wide">aura</span>
    </span>
  );
}
