import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export function useAuditStream() {
  const [liveLogs, setLiveLogs] = useState([]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws-security"),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      client.subscribe("/topic/audit-stream", (message) => {
        const log = JSON.parse(message.body);

        setLiveLogs((prev) => [log, ...prev].slice(0, 100));
      });
    };

    client.activate();

    return () => client.deactivate();
  }, []);

  return liveLogs;
}
export const getAuditAnalytics = async () => {
  const res = await fetch('/api/audit/analytics');
  return res.json();
};