/**
 * publishService.js
 * Multi-tenant automated publisher for Meta Graph API (Facebook & Instagram)
 */

const ContentItem = require("../models/ContentItem");
const Customer = require("../models/Customer");
const AuditLog = require("../models/AuditLog");

/**
 * Publishes an image to a Facebook Page via Meta Graph API
 */
async function publishToFacebook({ pageId, accessToken, imageUrl, message }) {
  if (!pageId || !accessToken) {
    return {
      success: false,
      mode: "Simulated",
      message: "Facebook credentials not configured for client",
      postId: `fb_sim_${Date.now()}`,
    };
  }

  const url = `https://graph.facebook.com/v19.0/${pageId}/photos`;
  const params = new URLSearchParams({
    url: imageUrl,
    message: message || "",
    access_token: accessToken,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || "Facebook Graph API publish error");
  }

  return {
    success: true,
    mode: "Live",
    postId: data.post_id || data.id,
  };
}

/**
 * Publishes an image to Instagram Business Account via 2-step Container API
 */
async function publishToInstagram({ accountId, accessToken, imageUrl, caption }) {
  if (!accountId || !accessToken) {
    return {
      success: false,
      mode: "Simulated",
      message: "Instagram credentials not configured for client",
      postId: `ig_sim_${Date.now()}`,
    };
  }

  // Step 1: Create Container
  const containerUrl = `https://graph.facebook.com/v19.0/${accountId}/media`;
  const containerParams = new URLSearchParams({
    image_url: imageUrl,
    caption: caption || "",
    access_token: accessToken,
  });

  const containerRes = await fetch(containerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: containerParams.toString(),
  });

  const containerData = await containerRes.json();
  if (!containerRes.ok || containerData.error) {
    throw new Error(containerData.error?.message || "Instagram container creation error");
  }

  const creationId = containerData.id;

  // Step 2: Publish Container
  const publishUrl = `https://graph.facebook.com/v19.0/${accountId}/media_publish`;
  const publishParams = new URLSearchParams({
    creation_id: creationId,
    access_token: accessToken,
  });

  const publishRes = await fetch(publishUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: publishParams.toString(),
  });

  const publishData = await publishRes.json();
  if (!publishRes.ok || publishData.error) {
    throw new Error(publishData.error?.message || "Instagram media publish error");
  }

  return {
    success: true,
    mode: "Live",
    postId: publishData.id,
  };
}

/**
 * Main dispatcher to publish a ContentItem to all configured client platforms
 */
exports.publishContentItem = async (contentItemId) => {
  const contentItem = await ContentItem.findById(contentItemId);
  if (!contentItem) throw new Error("ContentItem not found");

  const customer = await Customer.findById(contentItem.customerId);
  if (!customer) throw new Error("Customer not found");

  const integrations = customer.socialIntegrations || {};
  const platforms = contentItem.platforms || ["Instagram", "Facebook"];
  const caption = `${contentItem.headline ? contentItem.headline + "\n\n" : ""}${contentItem.caption || ""}\n\n${(contentItem.hashtags || []).join(" ")}`.trim();
  const imageUrl = contentItem.mediaUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop";

  const results = {};

  // Publish to Facebook if selected
  if (platforms.includes("Facebook")) {
    try {
      results.facebook = await publishToFacebook({
        pageId: integrations.facebook?.pageId,
        accessToken: integrations.facebook?.accessToken,
        imageUrl,
        message: caption,
      });
    } catch (err) {
      results.facebook = { success: false, error: err.message };
    }
  }

  // Publish to Instagram if selected
  if (platforms.includes("Instagram")) {
    try {
      results.instagram = await publishToInstagram({
        accountId: integrations.instagram?.accountId,
        accessToken: integrations.instagram?.accessToken,
        imageUrl,
        caption,
      });
    } catch (err) {
      results.instagram = { success: false, error: err.message };
    }
  }

  // Mark ContentItem as published
  contentItem.status = "Published";
  contentItem.publishStatus = "Published";
  contentItem.publishedAt = new Date();
  await contentItem.save();

  await AuditLog.create({
    actorType: "Scheduler",
    actorName: "AutoPublisher Engine",
    action: "content_published",
    entityType: "ContentItem",
    entityId: contentItem._id,
    customerId: customer._id,
    clientLocationId: contentItem.clientLocationId,
    inputSummary: `Auto-published "${contentItem.title}" to ${platforms.join(", ")}. Results: ${JSON.stringify(results)}`,
    status: "Success",
  });

  return {
    contentItem,
    results,
    publishedAt: contentItem.publishedAt,
  };
};
