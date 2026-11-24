import { siWhatsapp, siGmail, siGooglecalendar, siGooglechrome, siDiscord, siGooglemeet, siApple } from "simple-icons";

const pick = (i) => ({ path: i.path, hex: "#" + i.hex, title: i.title });
export const icons = {
  whatsapp: pick(siWhatsapp),
  gmail: pick(siGmail),
  calendar: pick(siGooglecalendar),
  chrome: pick(siGooglechrome),
  discord: pick(siDiscord),
  meet: pick(siGooglemeet),
  apple: pick(siApple),
};
