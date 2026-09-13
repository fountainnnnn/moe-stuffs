type IconName =
  | "brand-bolt"
  | "prompting"
  | "knowledge"
  | "leaderboard"
  | "quest-map"
  | "lock"
  | "crown"
  | "alert";

export default function UiIcon({
  name,
  size = 20,
  className = "",
  label,
}: {
  name: IconName;
  size?: number;
  className?: string;
  label?: string;
}) {
  return (
    // Generated raster icons are deliberately used here instead of an SVG library.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icons/${name}.png`}
      width={size}
      height={size}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      className={`inline-block shrink-0 object-contain ${className}`}
    />
  );
}
