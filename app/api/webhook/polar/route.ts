import { WebhookVerificationError, validateEvent } from '@polar-sh/sdk/webhooks';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize a Supabase Admin client to bypass Row Level Security during webhooks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET!;
    
    // Convert Headers to Record<string, string> for validateEvent
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // Cryptographically verify the event comes from Polar
    const event = validateEvent(body, headers, webhookSecret);

    // When a subscription is successfully created and active
    if (event.type === 'subscription.active') {
      const subscription = event.data;
      
      // We pass the Supabase user ID as the 'external_customer_id' during checkout
      const userId = subscription.customer_id; // In production, map this using external_customer_id

      await supabaseAdmin
       .from('user_subscriptions')
       .upsert({
          user_id: userId,
          polar_subscription_id: subscription.id,
          status: 'active',
        });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}