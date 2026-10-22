/* CVCraft configuration — edit this file to run your own business rules. */
window.CVCRAFT_CONFIG = {
  brand: 'CVCraft',

  // Free users get JPG (with a small watermark). Premium users get PDF + Word (+ clean JPG).
  paywallEnabled: true,
  freeWatermark: true,
  watermarkText: 'Created with CVCraft · upgrade to remove this line',

  // Shown in the upgrade dialog. Change to your real pricing.
  priceLabel: '$4.99 one-time (placeholder price)',

  // Paste your hosted checkout link here (Lemon Squeezy / Paddle / Safepay / Stripe payment link...).
  // When set, the "Buy premium" button opens it.
  checkoutUrl: '',

  // (Cloud mode: premium now comes from your account on the server; the demo unlock is controlled by ALLOW_DEMO_UNLOCK in server/.env.)
  // Lets you test the premium flow locally without paying.
  // IMPORTANT: turn this OFF in production. A browser-only flag can be bypassed;
  // real enforcement needs a small backend that verifies payment (see README).
  demoUnlock: true
};
