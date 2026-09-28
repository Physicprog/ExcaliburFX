declare module "../../stores.js" {
  export const TRANSITION_MS: number;
}

declare module "../../logic.js" {
  export function sendNotif(
    text?: string,
    color_green?: boolean,
    returnit?: boolean,
  ): void;
}
