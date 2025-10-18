// App-level constants for the NextJS dapp UI

export const APP_URL: string = process.env.NEXT_PUBLIC_URL || "";
export const APP_NAME: string = "BlockBoom";
export const APP_DESCRIPTION: string = "Decentralized music ranking game with friends";

// Optional image/icon URLs derived from APP_URL if present
export const APP_ICON_URL: string | undefined = APP_URL ? `${APP_URL}/logo.svg` : undefined;
export const APP_OG_IMAGE_URL: string | undefined = APP_URL ? `${APP_URL}/api/opengraph-image` : undefined;

// Optional splash and button text
export const APP_SPLASH_URL: string | undefined = APP_URL ? `${APP_URL}/thumbnail.jpg` : undefined;
export const APP_SPLASH_BACKGROUND_COLOR: string = "#000000";
export const APP_BUTTON_TEXT: string = "Launch BlockBoom";
