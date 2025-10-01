import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance (lazy initialization to avoid build-time errors)
let stripeInstance: Stripe | null = null;

export const getStripeInstance = () => {
  if (!stripeInstance && process.env.STRIPE_SECRET_KEY) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    });
  }
  if (!stripeInstance) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return stripeInstance;
};

// Client-side Stripe instance
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};

// Product configurations
export const PRODUCTS = {
  basic: {
    name: 'Drömlyktan Basic',
    description: '3-8 min sagor, 3 sagor/dag, 1 sparad karaktär, Standard-röster',
    prices: {
      monthly: 2900, // 29 kr in öre
      yearly: 29900, // 299 kr in öre
    }
  },
  plus: {
    name: 'Drömlyktan Plus',
    description: 'Allt i Basic + 3-10 min sagor, 5 sagor/dag, Sleep Mode, Obegränsade karaktärer, Premium-röster, Sagoteman',
    prices: {
      monthly: 3900, // 39 kr in öre
      yearly: 39900, // 399 kr in öre
    }
  },
  premium: {
    name: 'Drömlyktan Premium',
    description: 'Allt i Plus + 3-15 min sagor, 10 sagor/dag, Kapitel-serie, Rabatt på böcker, Familjeprofil',
    prices: {
      monthly: 7900, // 79 kr in öre
      yearly: 79900, // 799 kr in öre
    }
  }
};

// Create Stripe checkout session
export async function createCheckoutSession(
  tier: 'basic' | 'plus' | 'premium',
  period: 'monthly' | 'yearly',
  successUrl: string,
  cancelUrl: string
) {
  const stripe = getStripeInstance();
  const product = PRODUCTS[tier];
  const price = product.prices[period];
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'sek',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: price,
          recurring: period === 'monthly' ? {
            interval: 'month'
          } : {
            interval: 'year'
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tier,
      period,
    },
  });

  return session;
}
