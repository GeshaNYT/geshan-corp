// Настройки серверов Minecraft для мониторинга. Хранятся в site_settings под ключом "mc_servers",
// редактируются в админке (вкладка «Сервер»).
import { useSetting } from "./content";

export type Edition = "java" | "bedrock";

export interface McServer {
  id: string;
  label: string;
  edition: Edition;
  host: string;
  /** Пусто — стандартный порт (Java 25565, Bedrock 19132) */
  port: string;
  /** Пусто — версия определяется автоматически по ответу сервера */
  version: string;
  hidden?: boolean;
}

export const DEFAULT_SERVERS: McServer[] = [
  {
    id: "java",
    label: "Java",
    edition: "java",
    host: "mc.minecube.pro",
    port: "",
    version: "1.16.5 – 26.3",
  },
  {
    id: "bedrock",
    label: "Bedrock",
    edition: "bedrock",
    host: "pe.minecube.pro",
    port: "25787",
    version: "",
  },
];

export const DEFAULT_PORT: Record<Edition, string> = { java: "25565", bedrock: "19132" };

export function useServers() {
  const list = useSetting<McServer[]>("mc_servers", DEFAULT_SERVERS);
  return (list?.length ? list : DEFAULT_SERVERS).filter((s) => s.host.trim());
}

export function serverAddress(s: McServer) {
  const port = s.port.trim();
  return port && port !== DEFAULT_PORT[s.edition] ? `${s.host.trim()}:${port}` : s.host.trim();
}
