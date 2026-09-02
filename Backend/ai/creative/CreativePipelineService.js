/**
 * CreativePipelineService.js
 * Central Creative Generation & Revision Pipeline Orchestrator (Stabilized)
 */

const Customer = require("../../models/Customer");
const ClientLocation = require("../../models/ClientLocation");
const CreativeProject = require("../../models/CreativeProject");
const CreativeAsset = require("../../models/CreativeAsset");
const ApprovalRequest = require("../../models/ApprovalRequest");
const ApprovalEngine = require("../approval/ApprovalEngine");
const creativePosterEngine = require("../agents/creativePosterEngine");
const ImageProviderRouter = require("./ImageProviderRouter");
const CreativeRenderer = require("./CreativeRenderer");
const AssetStorageService = require("../../services/storage/AssetStorageService");
const CreativeQAGuardian = require("./CreativeQAGuardian");

class CreativePipelineService {
  /**
   * Generates a commercial advertising poster from prompt and customer context.
   */
  async generateCreative({
    customerId,
    locationId = null,
    occasion = "Vinayaka Chavithi",
    topic = "Festival Poster",
    customPrompt = null,
    requestedBy = null,
  }) {
    if (!customerId) throw new Error("customerId is required to generate creative.");

    // 1. Resolve Customer & Location
    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error(`Customer '${customerId}' not found.`);

    let location = null;
    if (locationId) {
      location = await ClientLocation.findById(locationId);
    } else {
      location = await ClientLocation.findOne({ customerId: customer._id });
    }

    // 2. Brand Context
    const brandContext = {
      name: customer.name,
      companyName: customer.companyName || customer.name,
      brandName: customer.brandName || customer.companyName || customer.name,
      industry: customer.industry || "Technology & Services",
      logoUrl: customer.logo || null,
      primaryColor: customer.primaryColor || customer.brandColor || "#0F172A",
      secondaryColor: customer.secondaryColor || "#F8FAFC",
      accentColor: customer.accentColor || "#F59E0B",
      website: customer.website || "apexbee.in",
      phone: location?.phone || customer.phone || "9988776655",
      address: location?.address || customer.address || "Hyderabad",
      locationName: location?.name || location?.city || "Hyderabad",
    };

    // 3. Generate Blueprint
    const blueprint = await creativePosterEngine.generatePosterStrategy({
      customer,
      location,
      campaign: {
        topic: occasion || topic,
        service: occasion || topic,
        offer: occasion || "Special Festive Offer",
        cta: "Connect With Us",
      },
    });

    if (customPrompt) {
      blueprint.backgroundPrompt = customPrompt;
    }

    const timestampStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const title = `${brandContext.brandName} - ${occasion || topic} Poster (${timestampStr})`;

    // 4. Create CreativeProject Record
    let project = await CreativeProject.create({
      customerId: customer._id,
      locationId: location?._id || null,
      title,
      status: "Draft",
      headline: blueprint.headline,
      subheadline: blueprint.subheadline,
      offerText: blueprint.offerText,
      ctaText: blueprint.ctaText,
      deliverables: [{ type: "Poster", platform: "Instagram", dimensions: "1080x1080" }],
    });

    // 5. Create ApprovalRequest
    const approval = await ApprovalEngine.createApprovalRequest({
      title,
      domain: "CREATIVE",
      riskLevel: "R1",
      customer: customer._id,
      clientLocation: location?._id || null,
      relatedResourceType: "CreativeProject",
      relatedResourceId: project._id,
      executionIntent: {
        action: "creative.render",
        connector: "LocalRenderer",
      },
      initialPayload: {
        blueprint,
        brandContext,
        occasion,
      },
      initialStatus: "AI_GENERATED",
      submittedBy: requestedBy,
    });

    // 6. Execute Render Pipeline
    const assetResult = await this.executeRenderPipeline({
      customerId: customer._id,
      locationId: location?._id || null,
      creativeProjectId: project._id,
      approvalId: approval._id,
      title,
      occasion,
      blueprint,
      brandContext,
      version: 1,
      revisionType: "INITIAL",
      requestedBy,
    });

    // Update Project with top-level attributes
    project = await CreativeProject.findById(project._id).lean();

    // 7. Update ApprovalRequest with generated preview
    await ApprovalRequest.findByIdAndUpdate(approval._id, {
      $set: {
        status: "WAITING_APPROVAL",
        "currentSnapshot.previewUrl": assetResult.assetUrl,
        "currentSnapshot.blueprintPayload": blueprint,
        "executionIntent.assetId": assetResult.assetId,
      },
    });

    return {
      success: true,
      project,
      approvalId: approval.approvalId,
      asset: assetResult,
    };
  }

  /**
   * Internal render execution pipeline (Generates visual, renders vector overlay, runs QA, and uploads)
   */
  async executeRenderPipeline({
    customerId,
    locationId,
    creativeProjectId,
    approvalId,
    title,
    occasion,
    blueprint,
    brandContext,
    version = 1,
    revisionType = "INITIAL",
    heroImageUrlOverride = null,
    renderOptions = {},
    requestedBy = null,
  }) {
    // 1. Resolve Hero Visual
    let heroImageUrl = heroImageUrlOverride;
    let sourceProvider = "CreativeAsset Reused Visual";
    let generationId = null;
    let isFallback = false;
    let fallbackReason = null;

    if (!heroImageUrl) {
      const visualRes = await ImageProviderRouter.generateHeroVisual({
        prompt: blueprint.backgroundPrompt || `${occasion} festive modern Indian commercial visual`,
        width: 1080,
        height: 1080,
        brandContext,
      });
      heroImageUrl = visualRes.imageUrl || "https://images.unsplash.com/photo-1567591414240-e14b3017cfc9?q=80&w=1080";
      sourceProvider = visualRes.provider;
      generationId = visualRes.generationId;
      isFallback = Boolean(visualRes.fallback);
      fallbackReason = visualRes.fallbackReason || null;
    }

    // 2. Deterministic Rendering
    const renderRes = await CreativeRenderer.renderPoster({
      heroImageUrl,
      brandContext,
      blueprint,
      renderOptions,
    });

    // 3. Asset Storage Upload
    const assetId = `asset_${Date.now()}_v${version}`;
    const storageRes = await AssetStorageService.upload({
      customerId,
      occasion,
      assetId,
      version,
      buffer: renderRes.buffer,
      format: "svg",
    });

    // 4. QA Guardian Validation (incorporating storage and fallback status)
    const qaReport = CreativeQAGuardian.validate({
      renderResult: renderRes,
      brandContext,
      blueprint,
      assetMeta: {
        isPublic: storageRes.isPublic,
        fallback: isFallback,
        fallbackReason,
      },
    });

    // 5. Persist CreativeAsset
    const creativeAsset = await CreativeAsset.create({
      assetId,
      customerId,
      locationId: locationId || null,
      creativeProjectId,
      approvalId,
      title,
      occasion,
      type: "POSTER",
      format: "SVG",
      width: 1080,
      height: 1080,
      version,
      status: "READY",
      storageProvider: storageRes.storageProvider,
      storageKey: storageRes.storageKey,
      assetUrl: storageRes.assetUrl,
      previewUrl: storageRes.previewUrl,
      sourceProvider,
      sourceGenerationId: generationId,
      checksum: storageRes.checksum,
      renderSettings: {
        ...renderRes.renderMeta,
        heroImageUrl,
        fallback: isFallback,
        fallbackReason,
      },
      blueprint,
      qaReport,
      revisionType,
      requestedBy,
    });

    // 6. Update CreativeProject with newly generated version
    if (creativeProjectId) {
      await CreativeProject.findByIdAndUpdate(creativeProjectId, {
        $push: {
          versions: {
            versionNumber: version,
            fileUrl: storageRes.assetUrl || storageRes.previewUrl,
            bgImageUrl: heroImageUrl,
            heroImageUrl: heroImageUrl,
            headline: blueprint.headline || "TRANSFORM YOUR BRAND'S GROWTH",
            subheadline: blueprint.subheadline || "",
            offerText: blueprint.offerText || "",
            ctaText: blueprint.ctaText || "Connect With Us",
            prompt: blueprint.backgroundPrompt || "",
            phone: brandContext.phone || "",
            website: brandContext.website || "",
            locationName: brandContext.locationName || "",
            logoUrl: brandContext.logoUrl || null,
            showLogo: true,
            notes: `AI Generated V${version} (${sourceProvider})`,
            createdAt: new Date(),
            createdBy: requestedBy,
          },
        },
        $set: {
          currentVersion: version,
          bgImageUrl: heroImageUrl,
          headline: blueprint.headline || "TRANSFORM YOUR BRAND'S GROWTH",
          subheadline: blueprint.subheadline || "",
          offerText: blueprint.offerText || "",
          ctaText: blueprint.ctaText || "Connect With Us",
          phone: brandContext.phone || "",
          website: brandContext.website || "",
          locationName: brandContext.locationName || "",
          logoUrl: brandContext.logoUrl || null,
          showLogo: true,
          aiPrompt: blueprint.backgroundPrompt || "",
          approvalStatus: "Draft",
        },
      });
    }

    return creativeAsset;
  }

  /**
   * Handles creative revision requests (Renderer-Only vs Generative)
   */
  async requestRevision({
    creativeAssetId,
    changes = {},
    feedback = "Revise creative",
    actorId = null,
  }) {
    const existingAsset = await CreativeAsset.findOne({ assetId: creativeAssetId });
    if (!existingAsset) {
      throw new Error(`CreativeAsset '${creativeAssetId}' not found for revision.`);
    }

    const nextVersion = (existingAsset.version || 1) + 1;
    const isRendererOnly = !changes.changeBackground && !changes.newConcept;

    // Load customer brand context dynamically from CRM
    const customer = await Customer.findById(existingAsset.customerId);
    const location = existingAsset.locationId ? await ClientLocation.findById(existingAsset.locationId) : null;

    const brandContext = {
      name: customer?.name || "ApexBee",
      companyName: customer?.companyName || "ApexBee",
      brandName: customer?.brandName || "ApexBee",
      phone: location?.phone || customer?.phone || "9988776655",
      website: customer?.website || "apexbee.in",
      locationName: location?.name || "Hyderabad",
      logoUrl: customer?.logo || null,
      primaryColor: customer?.primaryColor || "#0F172A",
      secondaryColor: customer?.secondaryColor || "#F8FAFC",
      accentColor: customer?.accentColor || "#F59E0B",
    };

    const renderOptions = {
      logoScale: changes.logoScale || (changes.enlargeLogo ? 1.3 : 1.0),
      heroScale: changes.heroScale || (changes.reduceHero ? 0.85 : 1.0),
      accentColorOverride: changes.accentColor || (changes.moreYellow ? "#FACC15" : null),
    };

    // 1. Transition ApprovalEngine to CHANGES_REQUESTED -> REGENERATING
    if (existingAsset.approvalId) {
      const approval = await ApprovalRequest.findById(existingAsset.approvalId);
      if (approval) {
        await ApprovalEngine.requestChanges({
          approvalId: approval.approvalId,
          feedback,
          actorId,
        });
      }
    }

    // 2. Execute Render Pipeline for Next Version
    const newAsset = await this.executeRenderPipeline({
      customerId: existingAsset.customerId,
      locationId: existingAsset.locationId,
      creativeProjectId: existingAsset.creativeProjectId,
      approvalId: existingAsset.approvalId,
      title: existingAsset.title,
      occasion: existingAsset.occasion,
      blueprint: existingAsset.blueprint,
      brandContext,
      version: nextVersion,
      revisionType: isRendererOnly ? "RENDERER_ONLY" : "GENERATIVE",
      heroImageUrlOverride: isRendererOnly ? existingAsset.renderSettings?.heroImageUrl || existingAsset.blueprint?.heroImageUrl : null,
      renderOptions,
      requestedBy: actorId,
    });

    // 3. Update Approval to WAITING_APPROVAL with V2
    if (existingAsset.approvalId) {
      await ApprovalEngine.submitNewVersion({
        approvalId: (await ApprovalRequest.findById(existingAsset.approvalId)).approvalId,
        blueprintPayload: existingAsset.blueprint,
        executionPayload: { assetId: newAsset.assetId, version: nextVersion },
        previewUrl: newAsset.assetUrl,
      });
    }

    return newAsset;
  }
}

module.exports = new CreativePipelineService();
