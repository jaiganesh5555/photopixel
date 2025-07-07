// Use localhost for local development
export const BACKEND_URL = "https://photopixel.gjaiganesh.top";
export const CLOUDFLARE_URL = "https://pub-ef34763ed7604da3af89117f48ad57b4.r2.dev";


const isDocker = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL?.includes('backend:8080') || false;
};

// Use the appropriate backend URL based on the environment
export const getBackendUrl = () => {
  if (isDocker()) {
    return "https://backend:8080";
  }
  return BACKEND_URL;
};
