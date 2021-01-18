import { KeyPair, SerializedKeyPair } from "./types";

export function bufferToHex(buffer: Uint8Array): string {
  return (
    "0x" +
    buffer.reduce(
      (str: string, byte: number) => str + byte.toString(16).padStart(2, "0"),
      ""
    )
  );
}

export function serializeKey(key: ArrayBuffer) {
  return bufferToHex(new Uint8Array(key));
}
export function deserializeKey(hexString: string): ArrayBuffer {
  return new Uint8Array(
    hexString
      .replace("0x", "")
      .match(/.{1,2}/g)!
      .map((byte) => parseInt(byte, 16))
  ).buffer;
}

export function serializeKeyPair(keyPair: KeyPair): SerializedKeyPair {
  return {
    privKey: serializeKey(keyPair.privKey),
    pubKey: serializeKey(keyPair.pubKey),
  };
}

export function deserializeKeyPair(keyPair: SerializedKeyPair): KeyPair {
  return {
    privKey: deserializeKey(keyPair.privKey),
    pubKey: deserializeKey(keyPair.pubKey),
  };
}

export function str2ab(str: string): ArrayBuffer {
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

export function ab2str(buf: ArrayBuffer): string {
  // @ts-ignore
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}
