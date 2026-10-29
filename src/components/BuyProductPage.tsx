import { NotificationPreferences } from "./NotificationPreferences";
import { PaymentOptions } from "./PaymentOptions";
import React, { useRef, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import type { CartItem, PageTab } from "../types";
import { money, type ShopRequest } from "../../shared/payments";
import { ApiError, submissionKey, submitShop } from "../data/paymentApi";
import { buttonClass, ErrorMessage, Field, inputClass } from "./PaymentUI";

interface BuyProductPageProps {
  cart: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onNavigate: (page: PageTab) => void;
  onOpenCRM?: () => void;
}
export function BuyProductPage({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigate,
}: BuyProductPageProps) {
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
    whatsappUpdates: false,
  });
  const [deliveryOption, setDeliveryOption] = useState<
    "collection" | "delivery"
  >("collection");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = useRef<{ fingerprint: string; key: string } | null>(null);
  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Math.round(item.product.numericPrice * 100) * item.quantity,
    0,
  );
  const promo = promoCode.trim().toUpperCase();
  const discount = ["ELYSIAN10", "TROPIC10"].includes(promo)
    ? Math.round(subtotal * 0.1)
    : 0;
  const shipping = deliveryOption === "delivery" && subtotal < 5000 ? 395 : 0;
  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const body: ShopRequest = {
      customer,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      deliveryOption,
      deliveryAddress,
      promoCode: promo,
    };
    key.current = submissionKey(key.current, body);
    try {
      const result = await submitShop(body, key.current.key);
      try {
        localStorage.setItem(`elysian_checkout_${result.recordId}`, "1");
      } catch {
        /* Payment works even when cart storage is unavailable. */
      }
      window.location.assign(
        result.url || `/?receipt=${result.receiptToken}#payment`,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) key.current = null;
      setError((err as Error).message);
      setBusy(false);
    }
  }
  if (!cart.length)
    return (
      <section className="px-5 py-20 text-center">
        <ShoppingBag className="mx-auto mb-4 text-[#BE757C]" size={40} />
        <h2 className="mb-5 font-display text-3xl">Your basket is empty</h2>
        <button className={buttonClass} onClick={() => onNavigate("shop")}>
          Explore the boutique
        </button>
      </section>
    );
  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-2">
      <div className="space-y-5">
        <h2 className="font-display text-2xl">Your selected skincare</h2>
        {cart.map((item) => (
          <article
            key={item.product.id}
            className="flex gap-4 rounded-2xl border border-[#E8BAC0]/50 bg-white p-4"
          >
            <img
              className="h-24 w-20 rounded-xl object-contain"
              src={item.product.image}
              alt={item.product.name}
            />
            <div className="flex-1">
              <h3 className="font-display text-lg">{item.product.name}</h3>
              <p className="mb-3 text-sm">
                {money(Math.round(item.product.numericPrice * 100))}
              </p>
              <div className="flex items-center gap-4">
                <button
                  disabled={busy}
                  type="button"
                  aria-label={`Decrease ${item.product.name} quantity`}
                  onClick={() => onUpdateQuantity(item.product.id, -1)}
                >
                  <Minus size={16} />
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  disabled={busy || item.quantity >= 20}
                  aria-label={`Increase ${item.product.name} quantity`}
                  onClick={() => onUpdateQuantity(item.product.id, 1)}
                >
                  <Plus size={16} />
                </button>
                <button
                  disabled={busy}
                  type="button"
                  aria-label={`Remove ${item.product.name}`}
                  onClick={() => onRemoveItem(item.product.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <strong className="text-sm">
              {money(
                Math.round(item.product.numericPrice * 100) * item.quantity,
              )}
            </strong>
          </article>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={onClearCart}
          className="text-xs underline"
        >
          Empty basket
        </button>
      </div>
      <form
        onSubmit={pay}
        className="space-y-5 rounded-3xl border border-[#E8BAC0]/50 bg-[#FAF0F2] p-5 sm:p-8"
      >
        <h2 className="font-display text-2xl">Checkout</h2>
        <fieldset disabled={busy} className="space-y-4">
          <Field label="Full name">
            <input
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              className={inputClass}
              value={customer.name}
              onChange={(e) =>
                setCustomer({ ...customer, name: e.target.value })
              }
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email">
              <input
                required
                type="email"
                maxLength={254}
                autoComplete="email"
                className={inputClass}
                value={customer.email}
                onChange={(e) =>
                  setCustomer({ ...customer, email: e.target.value })
                }
              />
            </Field>
            <Field label="Phone">
              <input
                required
                type="tel"
                minLength={7}
                maxLength={30}
                autoComplete="tel"
                className={inputClass}
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
              />
            </Field>
          </div>
          <NotificationPreferences
            checked={customer.whatsappUpdates}
            onChange={(whatsappUpdates) =>
              setCustomer({ ...customer, whatsappUpdates })
            }
          />
          <Field label="Delivery">
            <select
              className={inputClass}
              value={deliveryOption}
              onChange={(e) =>
                setDeliveryOption(e.target.value as "collection" | "delivery")
              }
            >
              <option value="collection">
                Collect at the sanctuary — free
              </option>
              <option value="delivery">
                Postal delivery — £3.95, free from £50
              </option>
            </select>
          </Field>
          {deliveryOption === "delivery" && (
            <Field label="Full postal address">
              <textarea
                required
                minLength={10}
                maxLength={1000}
                autoComplete="street-address"
                className={inputClass}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
            </Field>
          )}
          <Field label="Promotion code (optional)">
            <input
              maxLength={40}
              className={inputClass}
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
          </Field>
          {promo && !["ELYSIAN10", "TROPIC10"].includes(promo) && (
            <p className="text-xs text-red-800">
              This promotion code is not recognised.
            </p>
          )}
          <Field label="Order notes (optional)">
            <textarea
              maxLength={2000}
              className={inputClass}
              value={customer.notes}
              onChange={(e) =>
                setCustomer({ ...customer, notes: e.target.value })
              }
            />
          </Field>
        </fieldset>
        <div className="space-y-2 rounded-xl bg-white p-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>−{money(discount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{money(shipping)}</span>
          </div>
          <div className="flex justify-between border-t border-[#E8BAC0]/50 pt-3 font-bold">
            <span>Total</span>
            <span>{money(subtotal - discount + shipping)}</span>
          </div>
        </div>
        <PaymentOptions />
        <p className="text-xs">
          Your order is confirmed once payment has been verified.
        </p>
        <ErrorMessage error={error} />
        <button
          className={`${buttonClass} flex w-full items-center justify-center gap-2`}
          type="submit"
          disabled={busy}
        >
          {busy ? "Opening checkout…" : "Continue to Stripe checkout"}
          <ArrowRight size={16} />
        </button>
      </form>
    </section>
  );
}
