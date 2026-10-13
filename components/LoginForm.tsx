"use client";

import { FormEvent, useState } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [failed, setFailed] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFailed(false);
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setFailed(true);
      return;
    }
    setPassword("");
    window.location.href = "/admin";
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5">
      <div className="rounded-[2rem] bg-white/90 px-6 py-10">
      <h1 className="text-2xl font-normal">后台</h1>
      <label className="mt-8 block text-sm" htmlFor="password">
        密码
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full border border-[#e4dcd0] bg-white px-3 py-2 text-base"
        />
      </label>
      <button type="submit" className="mt-6 w-fit border border-[#1c1917] px-3 py-1 text-sm">
        进入
      </button>
      {failed ? <p className="mt-4 text-sm">密码不对。</p> : null}
      </div>
    </form>
  );
}
