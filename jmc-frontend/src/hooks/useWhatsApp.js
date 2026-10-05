import { useCallback } from "react";
import { useSettings } from "../context/SettingsContext";
import { useToast } from "../context/ToastContext";
import { buildWhatsAppUrl, openWhatsApp } from "../utils/whatsapp";

/** Public enquiry: no login, no cart, opens WhatsApp immediately. */
export default function useWhatsApp() {
  const { whatsapp } = useSettings();
  const toast = useToast();

  return useCallback(
    (product) => {
      if (!whatsapp) {
        toast.error("WhatsApp contact is not available right now. Please try again shortly.");
        return;
      }
      openWhatsApp(buildWhatsAppUrl(whatsapp, product));
    },
    [whatsapp, toast]
  );
}
