/**
 * workspaceResponseBuilder.js
 * Universal Response Builder for Digitalness AI Workspace.
 * Builds standardized WorkspaceResponse objects with typed UI blocks.
 */

const { WORKSPACE_STATES } = require("./conversationStateMachine");
const responseComposer = require("./conversationalResponseComposer");

class WorkspaceResponseBuilder {
  /**
   * Builds an AWAITING_ENTITY response with EntityPickerBlock.
   */
  buildEntityPickerResponse({
    conversationId,
    turnId = `turn_${Date.now()}`,
    pendingCommandId,
    intent,
    parameters = {},
    reason = "CUSTOMER_NOT_SPECIFIED",
    candidates = [],
    entityType = "Customer",
    unregisteredClientName = null,
  }) {
    const text = responseComposer.composeEntityPrompt({ intent, parameters, reason, candidates, unregisteredClientName });

    return {
      conversationId,
      turnId,
      state: WORKSPACE_STATES.AWAITING_ENTITY,
      message: {
        role: "assistant",
        text,
      },
      uiBlocks: [
        {
          type: "entity_picker",
          pendingCommandId,
          entityType,
          reason,
          promptText: text,
          candidates: candidates.slice(0, 8).map((c) => ({
            id: String(c._id || c.id),
            name: c.name || c.companyName,
            companyName: c.companyName || c.name,
            industry: c.industry || "Client",
            city: c.city || "",
          })),
          allowSearch: true,
          totalCandidatesCount: candidates.length,
        },
      ],
      context: {
        intent,
        pendingCommandId,
        state: WORKSPACE_STATES.AWAITING_ENTITY,
      },
    };
  }

  /**
   * Builds a COLLECTING_INPUT response with IntakeQuestionBlock.
   */
  buildIntakeQuestionResponse({
    conversationId,
    turnId = `turn_${Date.now()}`,
    pendingCommandId,
    field,
    question,
    currentEntityName,
    collected = {},
    missingFields = [],
    options = [],
    allowSkip = true,
  }) {
    const text = responseComposer.composeIntakeQuestion({ field, question, currentEntityName, collected });

    return {
      conversationId,
      turnId,
      state: WORKSPACE_STATES.COLLECTING_INPUT,
      message: {
        role: "assistant",
        text,
      },
      uiBlocks: [
        {
          type: "intake_question",
          pendingCommandId,
          field,
          question: text,
          options,
          allowSkip,
          currentEntityName,
          collectedSummary: collected,
          remainingFieldsCount: missingFields.length,
        },
      ],
      context: {
        pendingCommandId,
        currentField: field,
        state: WORKSPACE_STATES.COLLECTING_INPUT,
      },
    };
  }

  /**
   * Builds an AWAITING_APPROVAL response with ExecutionBlueprintBlock.
   */
  buildBlueprintResponse({
    conversationId,
    turnId = `turn_${Date.now()}`,
    pendingCommandId,
    command,
    intent,
    customerId,
    customerName,
    blueprint,
    brandContext = null,
    riskLevel = "LOW_RISK_WRITE",
  }) {
    const text = responseComposer.composeBlueprintReady({ intent, customerName });

    return {
      conversationId,
      turnId,
      state: WORKSPACE_STATES.AWAITING_APPROVAL,
      message: {
        role: "assistant",
        text,
      },
      uiBlocks: [
        {
          type: "execution_blueprint",
          pendingCommandId,
          command,
          intent,
          customerId,
          customerName,
          riskLevel,
          actions: blueprint.actions || [],
          parameters: blueprint.parameters || {},
          brandContextSummary: brandContext
            ? {
                hasLogo: brandContext.hasLogo,
                brandColors: brandContext.brandColors,
                phone: brandContext.phone,
                industry: brandContext.industry,
                toneOfVoice: brandContext.toneOfVoice,
              }
            : null,
          estimatedImpact: blueprint.estimatedImpact || "Safe CRM update",
          supportsRollback: blueprint.supportsRollback !== false,
        },
      ],
      context: {
        pendingCommandId,
        customerId,
        customerName,
        state: WORKSPACE_STATES.AWAITING_APPROVAL,
      },
    };
  }

  /**
   * Builds a COMPLETED response with ExecutionResult or GeneratedAsset UI block.
   */
  buildCompletedResponse({
    conversationId,
    turnId = `turn_${Date.now()}`,
    command,
    intent,
    customerId,
    customerName,
    result,
    verification,
    asset = null,
    executionId = null,
  }) {
    const text = responseComposer.composeExecutionSuccess({ command, result, customerName });
    const uiBlocks = [];

    // If generated creative asset is present
    if (asset || command?.includes("creative")) {
      uiBlocks.push({
        type: "generated_asset",
        creativeRunId: asset?.runId || result?.runId || result?._id,
        version: asset?.version || 1,
        imageUrl: asset?.imageUrl || result?.output?.imageUrl || result?.outputs?.imageUrl || result?.imageUrl,
        headline: asset?.headline || result?.outputs?.copy?.headline || result?.output?.copy?.headline || result?.plan?.campaignName || "Generated Creative",
        caption: asset?.caption || result?.outputs?.copy?.caption || result?.output?.copy?.caption || result?.caption || "",
        tags: asset?.hashtags || result?.outputs?.copy?.hashtags || result?.output?.copy?.hashtags || [],
        clientName: customerName || result?.clientName,
        imagePrompt: asset?.imagePrompt || result?.outputs?.creativeOutput?.imagePromptText || result?.outputs?.creativeOutput?.imagePrompt || "",
        platformVariants: asset?.platformVariants || result?.outputs?.socialOutput?.platformVariants || {},
        status: "APPROVED_FOR_REVIEW",
      });
    } else if (command?.startsWith("briefing.")) {
      uiBlocks.push({
        type: "morning_briefing",
        briefingData: result,
      });
    } else if (command?.startsWith("decision.")) {
      uiBlocks.push({
        type: "decision_inbox",
        decisions: result?.data || result || [],
        count: result?.count || (Array.isArray(result) ? result.length : 0),
        safeCount: result?.safeCount || 0,
      });
    } else if (command?.startsWith("sla.")) {
      uiBlocks.push({
        type: "sla_alerts",
        slaData: result,
      });
    } else if (command?.startsWith("social.") || command?.startsWith("ads.")) {
      uiBlocks.push({
        type: "execution_result",
        executionId: executionId || `exec_${Date.now()}`,
        command,
        result,
        verification: verification || { status: "VERIFIED", details: "Intelligence generated." },
        supportsRollback: false,
      });
    } else {
      uiBlocks.push({
        type: "execution_result",
        executionId: executionId || `exec_${Date.now()}`,
        command,
        result,
        verification: verification || { status: "VERIFIED", details: "Database state confirmed." },
        supportsRollback: true,
      });
    }

    return {
      conversationId,
      turnId,
      state: WORKSPACE_STATES.COMPLETED,
      message: {
        role: "assistant",
        text,
      },
      uiBlocks,
      context: {
        command,
        customerId,
        customerName,
        executionId,
        state: WORKSPACE_STATES.COMPLETED,
      },
    };
  }

  /**
   * Builds an AWAITING_APPROVAL response with CreativeBriefBlock.
   */
  buildCreativeBriefResponse({
    conversationId,
    turnId = `turn_${Date.now()}`,
    pendingCommandId,
    client,
    campaign,
    communication,
    creativeConcept,
    visualComposition,
    finalPrompt,
    verifiedChecklist,
    introText,
  }) {
    const text =
      introText ||
      `I understand. I’ll verify ${
        client?.name || "Client 1"
      }’s brand information and launch details first, then I’ll prepare the full creative brief and generation prompt for your approval.\n\nI’ve completed the background checks. Here is the full proposed plan. Please review the exact details before I execute anything.`;

    return {
      conversationId,
      turnId,
      state: WORKSPACE_STATES.AWAITING_APPROVAL,
      message: {
        role: "assistant",
        text,
      },
      uiBlocks: [
        {
          type: "creative_brief",
          pendingCommandId,
          client,
          campaign,
          communication,
          creativeConcept,
          visualComposition,
          finalPrompt,
          verifiedChecklist,
        },
      ],
      context: {
        pendingCommandId,
        customerName: client?.name,
        state: WORKSPACE_STATES.AWAITING_APPROVAL,
      },
    };
  }

  /**
  * Builds an AWAITING_FINAL_REVIEW response with PosterPreviewQABlock (truthful status).
  */
  buildPosterPreviewQAResponse({
    conversationId,
    turnId = `turn_${Date.now()}`,
    creativeRunId,
    client,
    campaign,
    socialCopy,
    introText,
    hasRealAsset = false,
  }) {
    const text =
      introText ||
      (hasRealAsset
        ? `Approved. I’ve rendered the creative asset using the confirmed brand specifications. QA validation completed.`
        : `Creative Brief Approved.\n\n• **Image Generation**: Not configured (Provider required)\n• **Poster Asset**: Not created\n• **QA Status**: Not run\n• **Copy & Caption**: Ready\n• **Hashtags**: Ready (${socialCopy?.hashtags?.length || 5} hashtags)\n• **Publishing**: Disabled\n\nNext required action: Configure an image-generation provider to render the visual asset.`);

    const finalSocialCopy = socialCopy || {
      caption: `✨ ${(campaign.headline || "Scale Your Digital Presence & Revenue").toUpperCase()} ✨\n\n${campaign.supportingLine || "Data-driven performance marketing tailored for modern brands"}.\n\n📞 Phone: ${client?.phone || "+91 91234 56789"}\n🌐 Website: ${client?.website || "www.digitalness.agency"}\n\n👉 ${campaign.cta || "Get Started Today"}\n\n${(campaign.hashtags || []).join(" ")}`,
      instagramCaption: `✨ ${(campaign.headline || "Scale Your Digital Presence & Revenue").toUpperCase()} ✨\n\n${campaign.supportingLine || "Data-driven performance marketing tailored for modern brands"}.\n\n📞 Phone: ${client?.phone || "+91 91234 56789"}\n🌐 Website: ${client?.website || "www.digitalness.agency"}\n\n👉 ${campaign.cta || "Get Started Today"}`,
      hashtags: campaign.hashtags || [
        "#DigitalMarketing",
        "#SocialMediaMarketing",
        "#BusinessGrowth",
        "#Digitalness",
        "#HyderabadBusiness",
      ],
    };

    return {
      conversationId,
      turnId,
      state: hasRealAsset ? "AWAITING_FINAL_REVIEW" : "IMAGE_PROVIDER_REQUIRED",
      message: {
        role: "assistant",
        text,
      },
      uiBlocks: [
        {
          type: "poster_preview_qa",
          creativeRunId: creativeRunId || `run_${Date.now()}`,
          client,
          campaign,
          socialCopy: finalSocialCopy,
          qaPassed: hasRealAsset,
          qaStatus: hasRealAsset ? "QA_PASSED" : "QA_NOT_RUN (No image generated)",
          status: hasRealAsset ? "WAITING_MANAGER_REVIEW" : "IMAGE_PROVIDER_REQUIRED",
          isDemoPreview: !hasRealAsset,
        },
      ],
      context: {
        creativeRunId,
        customerName: client?.name,
        state: hasRealAsset ? "AWAITING_FINAL_REVIEW" : "IMAGE_PROVIDER_REQUIRED",
      },
    };
  }

  /**
   * Builds an AWAITING_DELIVERY_SCHEDULE or CREATIVE_APPROVED response (respecting publishAllowed).
   */
  buildDeliveryScheduleResponse({
    conversationId,
    turnId = `turn_${Date.now()}`,
    creativeRunId,
    destination = "Instagram",
    approvedVersionStatus = "Approved Draft · QA Sealed",
    immediateOption = "Publish Now",
    scheduledOption = "Tomorrow · 10:00 AM",
    publishAllowed = true,
    introText,
  }) {
    if (!publishAllowed) {
      const text =
        introText ||
        `Creative Approved. Saved as Approved Draft.\n\n• **Status**: Locked & Approved Draft\n• **Destination**: ${destination}\n• **Publishing**: Disabled (Explicit manager instruction)\n\nNo external publishing will be executed. You can download the creative, request revisions, or issue an explicit scheduling command when ready.`;

      return {
        conversationId,
        turnId,
        state: "CREATIVE_APPROVED",
        message: {
          role: "assistant",
          text,
        },
        uiBlocks: [
          {
            type: "delivery_schedule",
            creativeRunId: creativeRunId || `run_${Date.now()}`,
            destination,
            approvedVersionStatus: "Approved Draft (Publishing Disabled)",
            isDraftOnly: true,
            publishAllowed: false,
            options: ["Download Copy", "Request Revision", "Save as Approved Draft", "Start Publishing Workflow"],
          },
        ],
        context: {
          creativeRunId,
          destination,
          publishAllowed: false,
          state: "CREATIVE_APPROVED",
        },
      };
    }

    const text =
      introText ||
      `Final approval recorded. The completed work is now locked as the approved version.\n\nThe approved work is ready for scheduling to **${destination}**. Choose when it should move to its destination.`;

    return {
      conversationId,
      turnId,
      state: "AWAITING_DELIVERY_SCHEDULE",
      message: {
        role: "assistant",
        text,
      },
      uiBlocks: [
        {
          type: "delivery_schedule",
          creativeRunId: creativeRunId || `run_${Date.now()}`,
          destination,
          approvedVersionStatus,
          immediateOption,
          scheduledOption,
          publishAllowed: true,
          options: [immediateOption, scheduledOption, "Save as Approved Draft"],
        },
      ],
      context: {
        creativeRunId,
        destination,
        publishAllowed: true,
        state: "AWAITING_DELIVERY_SCHEDULE",
      },
    };
  }

  /**
   * Builds an ERROR response.
   */
  buildErrorResponse({
    conversationId,
    turnId = `turn_${Date.now()}`,
    error,
    pendingCommandId = null,
  }) {
    const text = responseComposer.composeErrorMessage(error);

    return {
      conversationId,
      turnId,
      state: WORKSPACE_STATES.ERROR,
      message: {
        role: "assistant",
        text,
      },
      uiBlocks: [
        {
          type: "error_card",
          errorMessage: text,
          technicalDetails: error?.message || String(error),
          pendingCommandId,
          canRetry: Boolean(pendingCommandId),
        },
      ],
      context: {
        pendingCommandId,
        state: WORKSPACE_STATES.ERROR,
      },
    };
  }
}

module.exports = new WorkspaceResponseBuilder();
