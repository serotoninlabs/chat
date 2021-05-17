import React from "react";
import { ChatManagerContext } from "../components";

export function useChatService() {
  const { service } = React.useContext(ChatManagerContext);

  return service;
}
