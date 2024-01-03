import type { ActionHandlerTuple } from "nmemonica";

export function setMediaSessionMetadata(
  title: string,
  artist = "Nmemonica App",
  album?: string
) {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album,
      artwork: [
        // { src: 'icon96.png',   sizes: '96x96',   type: 'image/png' },
        // { src: 'icon128.png', sizes: '128x128', type: 'image/png' },
        { src: "icon192.png", sizes: "192x192", type: "image/png" },
        // { src: 'icon256.png', sizes: '256x256', type: 'image/png' },
        // { src: 'icon384.png', sizes: '384x384', type: 'image/png' },
        { src: "icon512.png", sizes: "512x512", type: "image/png" },
      ],
    });
  }
}

export function setMediaSessionPlaybackState(
  state: "playing" | "paused" | "none"
) {
  if ("mediaSession" in navigator) {
    const mediaSession = navigator.mediaSession;
    try {
      mediaSession.playbackState = state;
    } catch (e) {
      console.error(e);
    }
  } else {
    console.error("mediaSession not available");
  }
}

export function mediaSessionAttach(actionHandlers: ActionHandlerTuple[]) {
  if ("mediaSession" in navigator) {
    const mediaSession = navigator.mediaSession;
    try {
      for (const [action, handler] of actionHandlers) {
        try {
          mediaSession.setActionHandler(action, handler);
        } catch (e) {
          console.error(e);
        }
      }
    } catch (e) {
      console.error(e);
    }
  } else {
    console.error("mediaSession not available");
  }
}

export function mediaSessionDetachAll() {
  if ("mediaSession" in navigator) {
    const mediaSession = navigator.mediaSession;
    try {
      mediaSession.metadata = null;
      mediaSession.playbackState = "none";
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    } catch (e) {
      console.error(e);
    }
  } else {
    console.error("mediaSession not available");
  }
}
