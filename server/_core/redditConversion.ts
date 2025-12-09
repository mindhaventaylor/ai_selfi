import { ENV } from "./env.js";

const REDDIT_PIXEL_ID = "a2_i58dh9zd9yl1";
const REDDIT_CONVERSION_API_URL = `https://ads-api.reddit.com/api/v3/pixels/${REDDIT_PIXEL_ID}/conversion_events`;

interface RedditConversionEvent {
  event_at: number; // Unix epoch timestamp in milliseconds
  action_source: "website" | "app" | "email" | "phone_call" | "chat" | "physical_store" | "system_generated" | "other";
  type: {
    tracking_type: string;
    custom_event_name?: string;
  };
  click_id?: string;
  user?: {
    ip_address?: string;
    user_agent?: string;
    screen_dimensions?: {
      width: number;
      height: number;
    };
    email?: string;
    phone_number?: string;
    external_id?: string;
    idfa?: string;
    aaid?: string;
    uuid?: string;
  };
  metadata?: {
    item_count?: number;
    currency?: string;
    value?: number;
    conversion_id?: string;
    products?: Array<{
      id: string;
      name: string;
      category?: string;
    }>;
  };
}

/**
 * Send a conversion event to Reddit's Conversion API
 */
export async function sendRedditConversionEvent(
  event: Omit<RedditConversionEvent, "event_at" | "action_source"> & {
    event_at?: number;
    action_source?: RedditConversionEvent["action_source"];
  }
): Promise<void> {
  const accessToken = ENV.redditConversionAccessToken;

  if (!accessToken) {
    console.warn("[Reddit Conversion] Access token not configured. Skipping conversion event.");
    return;
  }

  try {
    const payload = {
      data: {
        events: [
          {
            event_at: event.event_at || Date.now(),
            action_source: event.action_source || "website",
            type: event.type,
            ...(event.click_id && { click_id: event.click_id }),
            ...(event.user && { user: event.user }),
            ...(event.metadata && { metadata: event.metadata }),
          },
        ],
      },
    };

    const response = await fetch(REDDIT_CONVERSION_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Reddit Conversion] API error (${response.status}):`,
        errorText
      );
      throw new Error(`Reddit Conversion API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("[Reddit Conversion] Successfully sent conversion event:", result);
  } catch (error: any) {
    // Don't throw - we don't want conversion tracking failures to break payment processing
    console.error("[Reddit Conversion] Failed to send conversion event:", error.message);
  }
}

/**
 * Send a Purchase conversion event to Reddit
 */
export async function sendRedditPurchaseConversion(
  options: {
    conversionId: string; // Unique ID for deduplication (e.g., Stripe session ID)
    userEmail?: string;
    userId?: number;
    currency?: string;
    value?: number;
    userAgent?: string;
    ipAddress?: string;
  }
): Promise<void> {
  await sendRedditConversionEvent({
    type: {
      tracking_type: "Purchase",
    },
    user: {
      ...(options.userEmail && { email: options.userEmail }),
      ...(options.userId && { external_id: options.userId.toString() }),
      ...(options.userAgent && { user_agent: options.userAgent }),
      ...(options.ipAddress && { ip_address: options.ipAddress }),
    },
    metadata: {
      conversion_id: options.conversionId,
      ...(options.currency && { currency: options.currency }),
      ...(options.value !== undefined && { value: options.value }),
    },
  });
}

