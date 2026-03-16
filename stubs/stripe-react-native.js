// Stub web pour @stripe/stripe-react-native
// Sur web, les paiements Stripe sont gérés par Stripe.js (pas le SDK natif)
// Ce stub évite les erreurs d'import de modules natifs lors du build web.

const noop = () => {};
const noopComponent = () => null;

module.exports = {
  StripeProvider: ({ children }) => children,
  useStripe: () => ({
    initPaymentSheet: async () => ({ error: null }),
    presentPaymentSheet: async () => ({ error: null }),
    confirmPayment: async () => ({ error: null }),
    createPaymentMethod: async () => ({ error: null }),
  }),
  useConfirmPayment: () => [noop, { loading: false }],
  CardField: noopComponent,
  CardForm: noopComponent,
  ApplePayButton: noopComponent,
  GooglePayButton: noopComponent,
  AuBECSDebitForm: noopComponent,
  presentGooglePay: async () => ({ error: null }),
  confirmApplePayPayment: async () => ({ error: null }),
};
