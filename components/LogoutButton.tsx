"use client";

export default function LogoutButton() {
  async function logout() {
    await fetch("/api/session", { method: "DELETE" });
    window.location.href = "/admin";
  }

  return (
    <button type="button" onClick={logout} className="text-sm underline">
      退出
    </button>
  );
}
