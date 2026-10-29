import React, { useEffect, useState } from "react";
import { api } from "../data/paymentApi";

export function NotificationPreferences({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    api<{ notifications: { customerWhatsappConfigured?: boolean } }>(
      "/health",
      undefined,
      { signal: controller.signal },
    )
      .then((result) => {
        if (!controller.signal.aborted)
          setAvailable(!!result.notifications.customerWhatsappConfigured);
      })
      .catch(() => {
        /* An optional messaging outage must not block checkout. */
      });
    return () => controller.abort();
  }, []);
  return (
    <div className="space-y-2 text-sm">
      <p>We’ll email your confirmation and payment updates.</p>
      {available && (
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span>
            Also send my booking or order updates by WhatsApp to the number
            above (optional). Include your country code, for example +44. No
            marketing messages.
          </span>
        </label>
      )}
    </div>
  );
}
