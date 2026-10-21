"use client";

export default function LogoutButton() {
  async function logout() {
    await fetch("/api/session", { method: "DELETE" });
    window.location.href = "/admin";
  }

  return (
    <button type="button" onClick={logout} className="rounded-full border border-stone-300 px-3 py-1.5 text-sm font-bold text-stone-800">
      退出
    </button>
  );
}
