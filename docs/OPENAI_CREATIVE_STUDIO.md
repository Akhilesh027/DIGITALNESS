# OpenAI Creative Studio — 3 November 2026

## Flow
Creative Studio opens directly and uses dedicated OpenAI endpoints:

1. `POST /api/creatives/openai/prompt` reads the authorized customer's public brand context and calls the Responses API with a strict JSON schema. The returned prompt, concept and copy are saved in an owner-scoped draft.
2. The user reviews and edits the image prompt.
3. `POST /api/creatives/openai/generate` claims the saved draft, submits the reviewed prompt to the Images API and stores the returned PNG. It creates a Draft creative project containing the prompt, real image URL, model provenance, brand data and editable copy.
4. Repeated submission of the same completed draft returns the saved project. Concurrent requests are rejected. If project persistence fails after image storage is recorded, retry reuses that image. A different image prompt requires a new brief once an image is saved.

OpenAI image output is a 1024×1024 background; text, logo and CTA are composed separately in the existing editor. The canvas can export at its own dimensions. Image variations open a new reviewed OpenAI generation and preserve the original project. No publishing or automatic approval occurs.

There is no stock-image or alternate-provider fallback in this OpenAI flow. OpenAI refusals, invalid responses, billing failures and timeouts are explicit failures. No automatic paid retries occur. Failed storage before its checkpoint or process interruption can still require manual recovery; do not blindly repeat an uncertain generation.

## Backend configuration
Set these in the backend environment, never in frontend `VITE_*` variables:

```text
OPENAI_API_KEY=<your OpenAI API key>
OPENAI_TEXT_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-1.5
OPENAI_IMAGE_QUALITY=medium
```

Existing asset storage configuration is reused. Local uploads are resolved against the API host; set `PUBLIC_API_URL` to the externally accessible API origin when deploying. Localhost uploads cannot be fetched by external publishing platforms.

The key was already present; it was not replaced or exposed. A read-only model check returned HTTP 200 for both default models. A live prompt request failed with **`credit_balance_exhausted`**. API credit/project billing must be restored before live prompt or image generation can succeed. No successful new image was generated in this check, and no fallback image was substituted.

## Access and validation
- Client identities are denied. Administrators can use company customers, branch managers their branch, and other staff their assigned customers.
- Project listing and project routes now enforce the same customer scope.
- Prompt instructions omit internal notes/activity logs and use supplied business facts. Invented offers, contacts, rankings and testimonials are disallowed in the text-generation instructions.
- Prompts are length limited; image output must contain PNG bytes. Dimensions are read from the PNG rather than invented.
- The exact reviewed prompt and the actual provider/model are stored with the project. API keys remain server-side. Provider error messages are sanitized.

## Verification
- 49 targeted regression tests pass, including eight new OpenAI Studio tests covering structured output, refusals, malformed data, quota errors, PNG handling, persistence/reuse, concurrency and customer scoping.
- Frontend production build passes. The full TypeScript check has existing errors in unrelated pages and no errors in the changed Studio files.
- Browser verified direct Studio access, OpenAI model labels, customer selection and actionable billing error in the generation dialog.
- Successful live prompt/image generation, actual storage persistence and exported poster QA remain unverified because the API balance is exhausted.

## Official references
- [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Image generation API](https://developers.openai.com/api/reference/resources/images/methods/generate)
- [API billing](https://platform.openai.com/settings/organization/billing/overview)
