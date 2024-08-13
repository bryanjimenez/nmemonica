import { decrypt, encrypt, urlBase64ToUint8Array } from "./cryptoHelper";
import { signalingService } from "../../environment.development";

export const RTCChannelStatus = Object.freeze({
  // value must be string
  // channel.send(string)
  Finalized: "0",
});

export const RTCErrorCause = Object.freeze({
  ExportInitSvcError: "ExportInitSvcError",
  ExportFinalSvcError: "ExportFinalSvcError",
  ImportInitSvcError: "ImportInitSvcError",
  ImportFinalSvcError: "ImportFinalSvcError",
});

export const RTCSignalingMsgKey = Object.freeze({
  Uid: "uid",
  Payload: "payload",
});

export function rtcSignalingInitiate(
  encryptKey: string,
  onShareIdReady: (exchangeId: string) => void
) {
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

        const payload = { description, candidate };
        const data = new URLSearchParams();
        data.set(
          RTCSignalingMsgKey.Payload,
          JSON.stringify(
            encrypt("aes-192-cbc", encryptKey, JSON.stringify(payload))
          )
        );

        fetch(`${signalingService}/set`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: data,
          mode: "cors",
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error("RTC Signaling Server Error", {
                cause: {
                  code: RTCErrorCause.ExportInitSvcError,
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
        // reject(new Error("Expected a message with an exchange id"));
      }
    };
  });

  return msgP.then((info) => {
    const { uid, peer, channel } = info;

    onShareIdReady(uid);

    return new Promise<[string, RTCDataChannel]>((resolve, reject) => {
      setTimeout(() => {
        rtcSignalingInitiateDone(encryptKey, uid, peer, channel)
          .then(resolve)
          .catch(reject);
      }, 10000);
    });
  });
}

function rtcSignalingInitiateDone(
  encryptKey: string,
  uid: string,
  peer: RTCPeerConnection,
  channel: RTCDataChannel
) {
  const doneKeyword = buildDoneKeyword(encryptKey);
  const data = new URLSearchParams({ uid: `${uid}-${doneKeyword}` });

  return fetch(`${signalingService}/get`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: data,
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error("RTC Signaling Server Error", {
          cause: {
            code: RTCErrorCause.ExportFinalSvcError,
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
  const data = new URLSearchParams({ uid: shareId });

  return fetch(`${signalingService}/get`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: data,
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error("RTC Signaling Server Error", {
          cause: { code: RTCErrorCause.ImportInitSvcError, status: res.status },
        });
      }
      return res.text();
    })
    .then((payload) => {
      const { encrypted, iv } = parseSeviceResponse(payload);
      const { description, candidate } = decryptIntoDescriptionCandidate(
        encryptKey,
        iv,
        encrypted
      );

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

            void rtcSignalingRespondDone(encryptKey, shareId, payload).catch(
              reject
            );
          }
        };

        await peer2.setLocalDescription(peer2Desc);
        await peer2.addIceCandidate(candidate);
        await peer2.setRemoteDescription(description);
      });

      return msgP;
    });
}

function rtcSignalingRespondDone(
  encryptKey: string,
  uid: string,
  payload: {
    description: RTCSessionDescriptionInit;
    candidate: RTCIceCandidate;
  }
) {
  const data = new URLSearchParams();
  const doneKeyword = buildDoneKeyword(encryptKey);

  data.set(RTCSignalingMsgKey.Uid, `${uid}-${doneKeyword}`);
  data.set(
    RTCSignalingMsgKey.Payload,
    JSON.stringify(encrypt("aes-192-cbc", encryptKey, JSON.stringify(payload)))
  );

  return fetch(`${signalingService}/set`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: data,
  }).then((res) => {
    if (!res.ok) {
      throw new Error("RTC Signaling Server Error", {
        cause: { code: RTCErrorCause.ImportFinalSvcError, status: res.status },
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
    throw new Error("RTC Signaling failed to parse service response", {
      cause: { code: "" },
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

  try {
    const { description: desc, candidate: cand } = JSON.parse(
      decrypt("aes-192-cbc", encryptKey, iv, encrypted)
    ) as {
      description: RTCSessionDescriptionInit;
      candidate: RTCIceCandidate;
    };
    description = desc;
    candidate = cand;
  } catch (err) {
    // TODO: add catch code for signaling
    throw new Error("RTC Signaling failed to decrypt service response", {
      cause: { code: "" },
    });
  }

  return { description, candidate };
}

/**
 * Build a secret based on `encryptKey` and a shared iv
 * @param encryptKey
 */
function buildDoneKeyword(encryptKey: string) {
  const sharedKeyWord = "finished";
  const sharedIv = urlBase64ToUint8Array("+AFe6znQwUWh2avfJfB1cA==");

  let { encrypted: doneKeyword } = encrypt(
    "aes-192-cbc",
    encryptKey,
    sharedKeyWord,
    sharedIv
  );

  return doneKeyword;
}
