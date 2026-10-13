export default function Panel({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  const className =
    tone === "dark"
      ? "rounded-[2rem] bg-[#1b2333] px-6 py-10 text-[#f7f4ef] sm:px-10"
      : "rounded-[2rem] bg-white/85 px-6 py-10 shadow-[0_20px_60px_rgba(28,36,48,0.06)] sm:px-10";
  return <div className={className}>{children}</div>;
}
