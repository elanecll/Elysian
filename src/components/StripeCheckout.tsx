import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckoutElementsProvider,
  ExpressCheckoutElement,
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js/pure";
import type {
  Stripe,
  StripeExpressCheckoutElementConfirmEvent,
} from "@stripe/stripe-js";
import { CreditCard, LockKeyhole } from "lucide-react";
import { getCheckout } from "../data/paymentApi";
import { money } from "../../shared/payments";
import { ErrorMessage } from "./PaymentUI";

const clients = new Map<string, Promise<Stripe | null>>();
function stripeClient(key: string) {
  if (!clients.has(key)) clients.set(key, loadStripe(key));
  return clients.get(key)!;
}
const appleOptions = {
  buttonHeight: 52,
  paymentMethodOrder: ["apple_pay"],
  buttonTheme: { applePay: "black" as const },
  buttonType: { applePay: "plain" as const },
  layout: { maxColumns: 1, maxRows: 1, overflow: "auto" as const },
  paymentMethods: {
    applePay: "always" as const,
    googlePay: "never" as const,
    link: "never" as const,
    amazonPay: "never" as const,
    paypal: "never" as const,
    klarna: "never" as const,
  },
};
function CheckoutForm({
  amount,
  onConfirmed,
}: {
  amount: number;
  onConfirmed: () => void;
}) {
  const result = useCheckoutElements();
  const [cardOpen, setCardOpen] = useState(false);
  const [appleReady, setAppleReady] = useState<boolean | null>(null);
  useEffect(() => {
    // Wallet detection must never leave the card option waiting indefinitely.
    const timer = setTimeout(
      () => setAppleReady((ready) => ready ?? false),
      12000,
    );
    return () => clearTimeout(timer);
  }, []);
  const [cardReady, setCardReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState("");
  async function confirm(event?: StripeExpressCheckoutElementConfirmEvent) {
    if (result.type !== "success" || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await result.checkout.confirm({
        redirect: "if_required",
        ...(event ? { expressCheckoutConfirmEvent: event } : {}),
      });
      if (response.type === "error") setError(response.error.message);
      else onConfirmed(); // The receipt API, not this callback, verifies payment.
    } catch {
      setError(
        "We couldn't confirm payment. Check the status before trying again.",
      );
      onConfirmed();
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  if (result.type === "loading")
    return <p role="status">Loading secure payment options…</p>;
  if (result.type === "error")
    return <ErrorMessage error={result.error.message} />;
  return (
    <div className="space-y-5 text-left">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0" aria-label="Apple Pay">
          <div
            className={appleReady === false ? "hidden" : ""}
            style={busy ? { pointerEvents: "none", opacity: 0.6 } : undefined}
          >
            <ExpressCheckoutElement
              options={appleOptions}
              onConfirm={confirm}
              onReady={(event) =>
                setAppleReady(!!event.availablePaymentMethods?.applePay)
              }
              onLoadError={() => setAppleReady(false)}
            />
          </div>
          {appleReady === null && (
            <p className="text-xs text-stone-500" role="status">
              Checking Apple Pay availability…
            </p>
          )}
          {appleReady === false && (
            <div className="flex min-h-[52px] items-center justify-center rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm text-stone-500">
              Apple Pay unavailable on this device
            </div>
          )}
        </div>
        <button
          type="button"
          disabled={busy}
          aria-expanded={cardOpen}
          aria-controls="card-payment-form"
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-lg bg-[#008849] px-4 font-semibold text-white disabled:opacity-50"
          onClick={() => setCardOpen(true)}
        >
          <CreditCard size={20} />
          Pay by card
        </button>
      </div>
      {appleReady === false && (
        <p className="text-xs text-stone-600">
          For Apple Pay, open this page in a supported browser with Apple Wallet
          set up. You can also pay by card below.
        </p>
      )}
      <form
        id="card-payment-form"
        className={cardOpen ? "space-y-4" : "hidden"}
        onSubmit={(event) => {
          event.preventDefault();
          void confirm();
        }}
      >
        <PaymentElement
          options={{
            layout: "tabs",
            wallets: { applePay: "never", googlePay: "never", link: "never" },
          }}
          onReady={() => setCardReady(true)}
          onLoadError={() =>
            setError(
              "Card details couldn't load. Refresh this page to try again.",
            )
          }
        />
        <button
          className="w-full rounded-lg bg-[#008849] px-5 py-3 font-semibold text-white disabled:opacity-50"
          type="submit"
          disabled={busy || !cardReady || !result.checkout.canConfirm}
        >
          {busy ? "Confirming payment…" : `Pay ${money(amount)} by card`}
        </button>
      </form>
      <ErrorMessage error={error} />
      <p className="flex items-center justify-center gap-2 text-xs text-stone-500">
        <LockKeyhole size={14} />
        Secure payment processed by Stripe
      </p>
    </div>
  );
}
export function StripeCheckout({
  token,
  amount,
  onConfirmed,
}: {
  token: string;
  amount: number;
  onConfirmed: () => void;
}) {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof getCheckout>
  > | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    getCheckout(token, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      });
    return () => controller.abort();
  }, [token, retry]);
  const options = useMemo(
    () =>
      data
        ? {
            clientSecret: data.clientSecret,
            elementsOptions: {
              appearance: {
                theme: "stripe" as const,
                variables: {
                  colorPrimary: "#008849",
                  borderRadius: "8px",
                  fontFamily: "Arial, sans-serif",
                },
              },
            },
          }
        : null,
    [data],
  );
  return (
    <div className="space-y-4 rounded-2xl border border-[#E8BAC0] bg-white p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Choose how to pay</h2>
      <p>
        Pay now: <strong>{money(amount)}</strong>
      </p>
      {error ? (
        <>
          <ErrorMessage error={error} />
          <button className="underline" onClick={() => setRetry((n) => n + 1)}>
            Retry loading checkout
          </button>
        </>
      ) : data && options ? (
        <CheckoutElementsProvider
          key={data.sessionId}
          stripe={stripeClient(data.publishableKey)}
          options={options}
        >
          <CheckoutForm amount={amount} onConfirmed={onConfirmed} />
        </CheckoutElementsProvider>
      ) : (
        <p role="status">Loading secure checkout…</p>
      )}
    </div>
  );
}
