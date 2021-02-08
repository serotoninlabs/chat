import React from "react";
import { ChatService } from "../services/ChatService";

export interface Manager {
  service: ChatService;
}

// @ts-ignore ignore setting undefined
export const ChatManagerContext = React.createContext<Manager>();

export const ChatManager: React.FC<{ service: ChatService }> = ({
  children,
  service,
}) => {
  return (
    <ChatManagerContext.Provider value={{ service }}>
      {children}
    </ChatManagerContext.Provider>
  );
};
