export type TrackingEventName =
  | "product_view"
  | "add_to_cart"
  | "wishlist_add"
  | "checkout_started"
  | "order_placed";

export type TrackingPayload = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: TrackingEventName, payload: TrackingPayload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("sunspark:track", {
      detail: {
        name,
        payload,
        at: new Date().toISOString()
      }
    })
  );
}
