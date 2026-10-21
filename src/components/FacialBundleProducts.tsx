import React, { useState } from "react";
import { SPA_PRODUCTS } from "../data/shopData";
import { money, type BundleProductSelection } from "../../shared/payments";
import { itemTotal } from "../../shared/bookingPricing";
import { buttonClass, Field, inputClass } from "./PaymentUI";

export function FacialBundleProducts({
  value,
  onChange,
}: {
  value: BundleProductSelection[];
  onChange: (value: BundleProductSelection[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("");
  const available = SPA_PRODUCTS.filter(
    (product) =>
      !value.some((item) => item.productId === product.id) &&
      `${product.brand} ${product.name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <section
      className="space-y-3 rounded-2xl border border-[#E8BAC0]/60 bg-[#FFF9F9] p-4"
      aria-label="Bundle skincare products"
    >
      <h3 className="font-display text-xl">
        Choose your skincare products — 10% off
      </h3>
      <p className="text-sm">
        Select at least one product. Your products are paid in full after 10%
        off, alongside your 50% facial deposit after approval. Collect them at
        your appointment.
      </p>
      <Field label="Find a skincare product">
        <input
          className={inputClass}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setProductId("");
          }}
          placeholder="Search CLINICARE or Tropic products"
        />
      </Field>
      <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Field label="Skincare product">
          <select
            aria-label="Skincare product"
            className={inputClass}
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            <option value="">Choose a product</option>
            {available.map((product) => (
              <option key={product.id} value={product.id}>
                {product.brandType === "clinicare" ? "CLINICARE" : "Tropic"} ·{" "}
                {product.name} · {money(Math.round(product.numericPrice * 100))}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="button"
          className={buttonClass}
          disabled={!productId || value.length >= 50}
          onClick={() => {
            if (!available.some((product) => product.id === productId)) return;
            onChange([...value, { productId, quantity: 1 }]);
            setProductId("");
          }}
        >
          Add product
        </button>
      </div>
      {!available.length && (
        <p className="text-sm">No more products match your search.</p>
      )}
      <ul className="space-y-3" aria-label="Selected bundle products">
        {value.map((item) => {
          const product = SPA_PRODUCTS.find(
            (product) => product.id === item.productId,
          );
          if (!product) return null;
          const total = itemTotal({
            id: product.id,
            name: product.name,
            kind: "product",
            unitPricePence: Math.round(product.numericPrice * 100),
            quantity: item.quantity,
          });
          return (
            <li
              key={item.productId}
              className="rounded-xl border border-[#E8BAC0]/40 bg-white p-3"
            >
              <p className="font-semibold text-sm">{product.name}</p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                <Field label={`Quantity — ${product.name}`}>
                  <input
                    className={`${inputClass} max-w-24`}
                    type="number"
                    min={1}
                    max={20}
                    step={1}
                    value={item.quantity}
                    onChange={(event) => {
                      const quantity = Math.max(
                        1,
                        Math.min(
                          20,
                          Math.floor(Number(event.target.value) || 1),
                        ),
                      );
                      onChange(
                        value.map((selection) =>
                          selection.productId === item.productId
                            ? { ...selection, quantity }
                            : selection,
                        ),
                      );
                    }}
                  />
                </Field>
                <div className="text-sm">
                  <s className="text-[#7A5852]">
                    {money(
                      Math.round(product.numericPrice * 100) * item.quantity,
                    )}
                  </s>{" "}
                  <strong>{money(total)}</strong>
                  <span className="block text-xs">After 10% off</span>
                </div>
                <button
                  type="button"
                  className="text-sm underline"
                  aria-label={`Remove ${product.name}`}
                  onClick={() =>
                    onChange(
                      value.filter(
                        (selection) => selection.productId !== item.productId,
                      ),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {!value.length && (
        <p className="text-sm font-medium">
          Add at least one product to complete your bundle.
        </p>
      )}
    </section>
  );
}
