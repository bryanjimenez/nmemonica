import { decrypt, encrypt } from "./cryptoHelper";
import { signalingService } from "../../environment.development";

export const RTCChannelStatus = Object.freeze({
  // value must be string
  // channel.send(string)
  Finalized: "0",
});

export function exportSignaling(
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
        // TODO: hardcoded payload
        data.set(
          "payload",
          JSON.stringify(
            encrypt("aes-192-cbc", encryptKey, JSON.stringify(payload))
          )
        );

        fetch(signalingService, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: data,
          mode: "cors",
        })
          .then((res) => res.text())
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

    return new Promise<RTCDataChannel>((resolve, reject) => {
      setTimeout(() => {
        exportSignalingDone(encryptKey, uid, peer, channel)
          .then(resolve)
          .catch(reject);
      }, 10000);
    });
  });
}

function exportSignalingDone(
  encryptKey: string,
  uid: string,
  peer: RTCPeerConnection,
  channel: RTCDataChannel
) {
  const data = new URLSearchParams({ uid: `${uid}-finished` });

  return fetch(`${signalingService}/get`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: data,
  })
    .then((res) => res.text())
    .then((info) => {
      // TODO: try catch
      const { encrypted: encryptedText, iv } = JSON.parse(info) as Record<
        string,
        string
      >;
      const { description, candidate } = JSON.parse(
        decrypt("aes-192-cbc", encryptKey, iv, encryptedText)
      ) as {
        description: RTCSessionDescriptionInit;
        candidate: RTCIceCandidate;
      };

      return peer.setRemoteDescription(description).then(() =>
        peer.addIceCandidate(candidate).then(() => {
          // peer1 has to wait till peer2 is ready
          return new Promise<RTCDataChannel>((resolve) => {
            channel.onopen = () => resolve(channel);
          });
        })
      );
    });
}

export function importSignaling(encryptKey: string, shareId: string) {
  const data = new URLSearchParams({ uid: shareId });

  return fetch(`${signalingService}/get`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: data,
  })
    .then((data) => data.text())
    .then((payload) => {
      // TODO: try catch
      const { encrypted: encryptedText, iv } = JSON.parse(payload) as Record<
        string,
        string
      >;
      const { description, candidate } = JSON.parse(
        decrypt("aes-192-cbc", encryptKey, iv, encryptedText)
      ) as {
        description: RTCSessionDescriptionInit;
        candidate: RTCIceCandidate;
      };

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

            void importSignalingDone(encryptKey, shareId, payload);
          }
        };

        await peer2.setLocalDescription(peer2Desc);
        await peer2.addIceCandidate(candidate);
        await peer2.setRemoteDescription(description);
      });

      return msgP;
    });
}

function importSignalingDone(
  encryptKey: string,
  uid: string,
  payload: {
    description: RTCSessionDescriptionInit;
    candidate: RTCIceCandidate;
  }
) {
  const data = new URLSearchParams();
  data.set("uid", `${uid}-finished`);
  // TODO: hardcoded payload
  data.set(
    "payload",
    JSON.stringify(encrypt("aes-192-cbc", encryptKey, JSON.stringify(payload)))
  );

  return fetch(`${signalingService}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: data,
  });
}
