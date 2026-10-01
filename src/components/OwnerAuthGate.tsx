import React, { useState } from "react";
import { api } from "../data/paymentApi";
import { buttonClass, ErrorMessage, Field, inputClass } from "./PaymentUI";

export function OwnerAuthGate({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api("/owner/login", { username, password });
      setPassword("");
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="mx-auto max-w-sm space-y-5" onSubmit={login}>
      <h3 className="font-display text-2xl">Owner sign in</h3>
      <p className="text-sm">
        Use the owner credentials configured on the server. Your session lasts
        four hours.
      </p>
      <Field label="Username">
        <input
          autoComplete="username"
          required
          maxLength={100}
          className={inputClass}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </Field>
      <Field label="Password">
        <input
          autoComplete="current-password"
          type="password"
          required
          maxLength={1024}
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <ErrorMessage error={error} />
      <button className={buttonClass} disabled={busy} type="submit">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
