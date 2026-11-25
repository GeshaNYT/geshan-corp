import { createFileRoute, redirect } from "@tanstack/react-router";

// Мониторинг теперь на странице MineCube — старый адрес /server ведёт туда
export const Route = createFileRoute("/server")({
  beforeLoad: () => {
    throw redirect({ to: "/p/$slug", params: { slug: "minecube" } });
  },
});
