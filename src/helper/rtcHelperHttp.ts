import { randomBytes } from "crypto";

import { decrypt, encrypt } from "./cryptoHelper";
import { signalingService } from "../../environment.development";

export const RTCChannelStatus = Object.freeze({
  // value must be string
  // channel.send(string)
  Finalized: "0",
});

// Signaling errors
export const RTCErrorCause = Object.freeze({
  ServiceError: "signaling-server-error",
  RemotePeerFail: "signaling-remote-peer-connection",
  BadUid: "signaling-user-bad-uid",
  BadCryptoKey: "signaling-user-bad-crypto-key",
  BadPayload: "signaling-server-bad-payload",
});

export const RTCSignalingMsgKey = Object.freeze({
  Uid: "uid",
  Payload: "payload",
});

export function rtcSignalingInitiate(
  encryptKey: string,
  onShareIdReady: (exchangeId: string) => void
) {
  // pre-shared-secret for later retrieval
  let retrieveId = randomBytes(16).toString("base64");

  const msgP = new Promise<{
    uid: string;
    peer: RTCPeerConnection;
    channel: RTCDataChannel;
  }>(async (resolve, reject) => {
    let peer = new RTCPeerConnection();

    // channel before offer
    const channel = peer.createDataChannel("data-share");
    let description: RTCSessionDescriptionInit;
    try {
      description = await peer.createOffer();
    } catch (err) {
      reject(err);
      return;
    }
    await peer.setLocalDescription(description);

    peer.onicecandidate = (e) => {
      const { candidate } = e;
      if (candidate !== null) {
        // console.log("peer1.onicecandidate");
        // console.log(peer1ice);

        const payload = { description, candidate, keyword: retrieveId };
        const data = new URLSearchParams({
          [RTCSignalingMsgKey.Payload]: JSON.stringify(
            encrypt("aes-192-cbc", encryptKey, JSON.stringify(payload))
          ),
        });

        fetch(`${signalingService}/set`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: data,
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error("Server Error", {
                cause: {
                  code: RTCErrorCause.ServiceError,
                  status: res.status,
                },
              });
            }
            return res.text();
          })
          .then((uid) => {
            resolve({ uid, peer, channel });
          })
          .catch(reject);
      }
    };
  });

  return msgP.then((info) => {
    const { uid, peer, channel } = info;

    onShareIdReady(uid);

    return new Promise<[string, RTCDataChannel]>((resolve, reject) => {
      setTimeout(() => {
        rtcSignalingInitiateDone(encryptKey, uid, retrieveId, peer, channel)
          .then(resolve)
          .catch(reject);
      }, 10000);
    });
  });
}

function rtcSignalingInitiateDone(
  encryptKey: string,
  uid: string,
  retrieveId: string,
  peer: RTCPeerConnection,
  channel: RTCDataChannel
) {
  const data = new URLSearchParams({
    [RTCSignalingMsgKey.Uid]: `${uid}-${retrieveId}`,
  });

  return fetch(`${signalingService}/get`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: data,
  })
    .then((res) => {
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Remote peer failed connection setup", {
            cause: {
              code: RTCErrorCause.RemotePeerFail /*, status: res.status*/,
            },
          });
        }
        throw new Error("Server Error", {
          cause: {
            code: RTCErrorCause.ServiceError,
            status: res.status,
          },
        });
      }
      return res.text();
    })
    .then((info) => {
      const { encrypted, iv } = parseSeviceResponse(info);
      const { description, candidate } = decryptIntoDescriptionCandidate(
        encryptKey,
        iv,
        encrypted
      );

      return peer.setRemoteDescription(description).then(() =>
        peer.addIceCandidate(candidate).then(() => {
          // peer1 has to wait till peer2 is ready
          return new Promise<[string, RTCDataChannel]>((resolve) => {
            channel.onopen = () => resolve([encryptKey, channel]);
          });
        })
      );
    });
}

export function rtcSignalingRespond(encryptKey: string, shareId: string) {
  const data = new URLSearchParams({ [RTCSignalingMsgKey.Uid]: shareId });

  return fetch(`${signalingService}/get`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: data,
  })
    .then((res) => {
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Incorrect share id", {
            cause: { code: RTCErrorCause.BadUid /*, status: res.status*/ },
          });
        }
        throw new Error("Server Error", {
          cause: { code: RTCErrorCause.ServiceError, status: res.status },
        });
      }
      return res.text();
    })
    .then((payload) => {
      const { encrypted, iv } = parseSeviceResponse(payload);
      const {
        description,
        candidate,
        keyword: retrieveId,
      } = decryptIntoDescriptionCandidate(encryptKey, iv, encrypted);

      const msgP = new Promise<RTCDataChannel>(async (resolve, reject) => {
        let peer2 = new RTCPeerConnection();
        await peer2.setRemoteDescription(description);

        let peer2Desc: RTCSessionDescriptionInit;
        try {
          peer2Desc = await peer2.createAnswer();
        } catch (err) {
          reject(err);
          return;
        }

        peer2.ondatachannel = (e: RTCDataChannelEvent) => {
          const { channel } = e;
          resolve(channel);
        };

        peer2.onicecandidate = (e) => {
          const peer2ice = e.candidate;
          if (peer2ice !== null) {
            // console.log("peer2.onicecandidate");
            // console.log(peer2ice);

            // send back via http
            const payload = { description: peer2Desc, candidate: peer2ice };

            void rtcSignalingRespondDone(
              encryptKey,
              shareId,
              retrieveId,
              payload
            ).catch(reject);
          }
        };

        await peer2.setLocalDescription(peer2Desc);
        await peer2.addIceCandidate(candidate);
        await peer2.setRemoteDescription(description);
      });

      return msgP;
    });
}

/**
 * Send Signaling Service the messaging payload
 */
function rtcSignalingRespondDone(
  encryptKey: string,
  uid: string,
  doneKeyword: string,
  payload: {
    description: RTCSessionDescriptionInit;
    candidate: RTCIceCandidate;
  }
) {
  const data = new URLSearchParams({
    [RTCSignalingMsgKey.Uid]: `${uid}-${doneKeyword}`,
    [RTCSignalingMsgKey.Payload]: JSON.stringify(
      encrypt("aes-192-cbc", encryptKey, JSON.stringify(payload))
    ),
  });

  return fetch(`${signalingService}/set`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: data,
  }).then((res) => {
    if (!res.ok) {
      throw new Error("Server Error", {
        cause: { code: RTCErrorCause.ServiceError, status: res.status },
      });
    }
  });
}

function parseSeviceResponse(info: string) {
  let initVector: string;
  let cypherText: string;
  try {
    const { encrypted, iv } = JSON.parse(info) as Record<string, string>;
    initVector = iv;
    cypherText = encrypted;
  } catch (err) {
    // TODO: add catch code for signaling
    throw new Error("Failed to parse service response", {
      cause: { code: RTCErrorCause.BadPayload },
    });
  }
  return { encrypted: cypherText, iv: initVector };
}

function decryptIntoDescriptionCandidate(
  encryptKey: string,
  iv: string,
  encrypted: string
) {
  let description: RTCSessionDescriptionInit;
  let candidate: RTCIceCandidate;
  let keyword: string;

  try {
    const {
      description: descriptionO,
      candidate: candidateO,
      keyword: retrieveId,
    } = JSON.parse(decrypt("aes-192-cbc", encryptKey, iv, encrypted)) as {
      description: RTCSessionDescriptionInit;
      candidate: RTCIceCandidate;
      keyword: string;
    };
    description = descriptionO;
    candidate = candidateO;
    keyword = retrieveId;
  } catch (err) {
    throw new Error("Failed to decrypt service response", {
      cause: { code: RTCErrorCause.BadCryptoKey },
    });
  }

  return { description, candidate, keyword };
}
