import { useCallback, useEffect, useRef, useState } from "react";
import {
  getTwitchLoginStateFromQueryString,
  getTwitchUserProfile,
  openTwitchOauthLogin,
  subscribeMessageForWs
} from "./methods";
import { TWITCH_WS_URL } from "./constants";
import { TwitchOauthLoginState, TwitchUserState, TwitchWsMessagePayload } from "./types";

// constants
const client_id = import.meta.env["VITE_TWITCH_CLIENT_ID"];
const redirect_uri = import.meta.env["VITE_TWITCH_OAUTH_REDIRECT_URI"];

type WsEventHandler<T> =
  | {
      onOpen?: () => void;
      onClose?: () => void;
      onMessage?: (data: T) => void;
      onError?: () => void;
    }
  | undefined;

function useTwitchOauth() {
  const [twitchState, setTwitchState] = useState<TwitchOauthLoginState & TwitchUserState>();
  const [receivedMsg, setReceivedMsg] = useState<TwitchWsMessagePayload[]>();
  const receivedMsgRef = useRef<TwitchWsMessagePayload[]>([]);
  const websocketRef = useRef<WebSocket>();
  const isWsConnectedRef = useRef<boolean>(false);

  // Get twitch login state from querystring
  const handleGetTwitchState = useCallback(async () => {
    const loginData = getTwitchLoginStateFromQueryString();
    if (!loginData) return;

    const { access_token } = loginData;
    const userData = await getTwitchUserProfile(client_id, access_token);
    if (!userData) return;

    setTwitchState({ ...loginData, ...userData });
  }, []);

  useEffect(() => {
    handleGetTwitchState();
  }, [handleGetTwitchState]);

  function startOauthConnect() {
    openTwitchOauthLogin(client_id, redirect_uri);
  }

  function startWebsocket(events: WsEventHandler<TwitchWsMessagePayload> = {}) {
    const { onOpen, onClose, onMessage, onError } = events;
    if (!twitchState) return;

    const { access_token, id } = twitchState;
    const ws = new WebSocket(TWITCH_WS_URL);
    ws.onopen = () => {
      onOpen && onOpen();
    };
    ws.onclose = () => {
      isWsConnectedRef.current = false;
      onClose && onClose();
    };

    ws.addEventListener("message", async (event) => {
      const data = JSON.parse(event.data);

      if (isWsConnectedRef.current) {
        // channel.read.redemptions
        // channel.chat.message
        if (data.metadata.subscription_type === "channel.read.redemptions") {
          
          const newMsg = data.payload;

          onMessage && onMessage(newMsg);
          receivedMsgRef.current = [...receivedMsgRef.current, newMsg];
          setReceivedMsg([...receivedMsgRef.current]);
        }
      } else {
        const session_id = data.payload.session.id;
        const isSubscribeSuccess = await subscribeMessageForWs(
          session_id,
          client_id,
          access_token,
          id,
        );
        if (isSubscribeSuccess) {
          isWsConnectedRef.current = true;
        } else {
          onError && onError();
        }
      }
    });

    websocketRef.current = ws;
  }

  return {
    twitchState,
    startOauthConnect,
    startWebsocket,
    messages: receivedMsg,
  };
}

export default useTwitchOauth;
