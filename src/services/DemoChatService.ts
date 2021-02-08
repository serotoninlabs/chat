import { SignalService } from "./SignalService";
import { ChatService } from "./ChatService";
import { DemoRemoteService } from "./DemoRemoteService";

export class DemoChatService {
  static async build(
    userId: string,
    storagePrefix: string
  ): Promise<ChatService> {
    const remote = await DemoRemoteService.build();
    remote.setAddress({ userId, deviceId: storagePrefix });
    const signal = await SignalService.build(remote, userId, storagePrefix);
    const service = await ChatService.build(signal, remote, userId);

    return service;
  }
}
