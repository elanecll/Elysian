import { useEffect, useState } from "react";
import { londonDate } from "../../shared/payments";

export function useLondonDate() {
  const [today, setToday] = useState(londonDate);
  useEffect(() => {
    const update = () => setToday(londonDate());
    const timer = window.setInterval(update, 30000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return today;
}
