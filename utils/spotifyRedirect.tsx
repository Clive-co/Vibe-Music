import { applicationId } from "expo-application";
import { makeRedirectUri } from "expo-auth-session";

// Function to dynamically select the redirect URI
export const getSpotifyRedirectUri = () => {
  const SPOTIFY_REDIRECT_URI_APP = makeRedirectUri({
    scheme: "myapp",
    path: "(tabs)/",
  });

  const SPOTIFY_REDIRECT_URI_LOCAL = "exp://127.0.0.1:8081";

  const isStandalone = applicationId !== null;
  const redirectUri = isStandalone
    ? SPOTIFY_REDIRECT_URI_APP
    : SPOTIFY_REDIRECT_URI_LOCAL;

  console.log("Redirect URI in use:", redirectUri);
  return redirectUri;
};
