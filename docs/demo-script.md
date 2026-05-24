# Portaldot Mini Hackathon Demo Script

Project: PortalKubo  
Track: AI-Powered Onchain Workflows  
Demo URL: https://portalkubo.vercel.app/  
Video Link: 

One-liner: PortalKubo lets API owners sell paid tools, buyers pay with POT
through the PortalKubo payment flow, and autonomous agents buy those tools from
a funded budget on Portaldot.

## Project Write-up

PortalKubo is a Portaldot-powered marketplace for paid APIs and autonomous agent
payments. It focuses on the AI-Powered Onchain Workflows track by turning
existing HTTPS APIs into POT-paid tools that people, apps, and AI agents can buy
per request. In the demo, ClipLore becomes a paid video-generation API: a
provider copies its OpenAPI spec, adds an API key, a buyer pays through
PortalKubo, and the Video Launch Campaign Agent later buys the same tool from a
funded budget. Each paid action settles in POT on Portaldot and creates
receipts, provider traces, and proof-ready records.

Word count: 93

## Demo Flow

### 1.) Problem And Portaldot Use Case

- **Show:** PortalKubo homepage with Portaldot, POT, Portaldot payment,
  marketplace, and agent messaging.
- **Voiceover:** PortalKubo is our project for the AI-Powered Onchain Workflows
  track. It turns existing APIs, like video generation, into POT-paid tools on
  Portaldot that people and agents can buy per request through the PortalKubo
  payment flow.

### 2.) Add ClipLore

- **Show:** cliplore.ai OpenAPI URL, API key page, then PortalKubo provider
  product form.
- **Voiceover:** I copy ClipLore's OpenAPI URL, then generate an API key. In
  PortalKubo, I import the spec, choose the video job endpoint, add the key
  server-side, price it in POT, and publish it as agent-ready.

### 3.) Run From Marketplace

- **Show:** `/marketplace`, ClipLore product, `/orders/new`, payment console,
  completed order, and result link.
- **Voiceover:** A buyer opens the marketplace, runs the ClipLore, and pays
  through the PortalKubo payment flow. PortalKubo settles POT on Portaldot, then
  returns the ClipLore output link.

### 4.) Run The Agent

- **Show:** `/agents`, Video Launch Campaign Agent, funding transaction, paid
  actions, receipts, and deliverables.
- **Voiceover:** Next, I run the Video Launch Campaign Agent. I fund it with
  POT, let it choose paid tools, and run the actions. The agent buys the
  ClipLore API through the same marketplace rails.

### 5.) Play The Output

- **Show:** Agent deliverable link, ClipLore project page, and generated video
  playback.
- **Voiceover:** Finally, I open the ClipLore link returned by the agent and
  play the generated video.

### 6.) What's Next

- **Show:** End on the PortalKubo agent, proof, or receipt page.
- **Voiceover:** Next, we will onboard more real API providers, add more agent
  templates for paid digital work, improve provider analytics, and make
  PortalKubo production-ready for developers and businesses that want
  request-based POT payments on Portaldot.

## Recording Steps

### 1.) Start On PortalKubo

- Open [DEMO_URL]/.
- Show the PortalKubo hero, marketplace value, provider earnings, buyer
  checkout, and agent workflow.
- Click `Marketplace`.
- **Voiceover:** PortalKubo is a paid API marketplace on Portaldot. Providers
  earn POT per call, buyers pay before receiving results, and agents can buy
  tools from a funded budget.

### 2.) Get ClipLore Credentials

- Open `https://cliplore.ai/auth/sign-in?next=/developers/openapi`.
- Sign in.
- Open `https://cliplore.ai/developers/openapi`.
- Copy the OpenAPI URL.
- Open `https://cliplore.ai/dashboard/developers/api-keys`.
- Create a live API key named `PortalKubo marketplace`.
- Copy the API key.
- **Voiceover:** ClipLore already has the video API. I copy the OpenAPI URL
  first, then generate the API key needed for PortalKubo's server-side provider
  auth.

### 3.) Publish ClipLore On PortalKubo

- Open `[DEMO_URL]/provider/products/new`.
- Import `https://cliplore.ai/api/v1/openapi.json`.
- Select `POST /video/jobs`.
- Click `Fill listing`.
- Set auth to bearer with `Authorization`.
- Paste the ClipLore API key in the server-side secret field.
- Use credit-metered pricing with `estimatedCredits` and `0.01` POT per credit.
- Set visibility to `Published`.
- Enable `Agent ready`.
- Save the product.
- **Voiceover:** The API key stays server-side. Buyers and agents never see it;
  they only see the paid ClipLore product and its POT price.

### 4.) Run ClipLore From Marketplace

- Open `/marketplace`.
- Search `ClipLore` or `video`.
- Open the ClipLore product.
- Click `Run with wallet`.
- Use the sample payload.
- Set the prompt to:
  `Create a short launch video explaining PortalKubo paid APIs, Portaldot POT settlement, and autonomous agent payments.`
- Click `Test run`.
- On the order page, click `Run`.
- Confirm the wallet prompts.
- Wait for quote, approval, settlement, provider result, receipt, and ClipLore
  link.
- **Voiceover:** The buyer pays through the PortalKubo payment flow before
  ClipLore starts work. PortalKubo settles POT on Portaldot, records the
  receipt, polls the async job, and returns the ClipLore project link.

### 5.) Show The ClipLore Output

- Click the ClipLore result link.
- Confirm the public project page loads.
- Play or preview the generated video.
- Return to the PortalKubo order.
- Open the receipt.
- Show buyer wallet, provider wallet, POT amount, fee split, and Portaldot
  transaction.
- **Voiceover:** The result is real output, not just JSON. The receipt proves
  who paid, who earned, how much settled, and which Portaldot transaction
  completed the payment.

### 6.) What's Next

- End on the agent run, proof, or receipt page.
- Show the completed paid action history and ClipLore output link.
- **Voiceover:** Next, we will onboard more real API providers, add more agent
  templates for paid digital work, improve provider analytics, and make
  PortalKubo production-ready for developers and businesses that want
  request-based POT payments on Portaldot.

### 7.) Run The Video Launch Campaign Agent

- Open `/agents`.
- Select `Video Launch Campaign Agent`.
- Choose `AI decides`.
- Objective:
  `Create a video launch campaign for PortalKubo showing ClipLore API publishing, Portaldot payment checkout, Portaldot POT receipts, and autonomous agent proof.`
- Source context:
  `PortalKubo is a Portaldot-powered marketplace for paid APIs, Portaldot payments, POT settlement, provider revenue, browser checkout, developer integration, and autonomous agent runs.`
- Budget: `1.35`.
- Actions: `4`.
- Create the run.
- Click `Fund agent`.
- Confirm the funding transaction.
- Click `Run actions`.
- Wait until all selected tools complete.
- **Voiceover:** The agent uses the same marketplace rails. It spends only from
  the funded POT budget, buys paid tools through the PortalKubo payment flow,
  and records receipts for each paid action.

### 8.) Play The Agent Video

- Open the completed agent deliverable.
- Click the ClipLore project or output link.
- Play the generated video.
- Optionally return to PortalKubo and attest the proof if time allows.
- **Voiceover:** This is the full PortalKubo loop: a provider publishes a real
  API, a buyer pays for it, an agent buys it autonomously, and the final
  ClipLore video proves the paid action produced real work.

## Pacing Notes

- Keep the two-minute cut focused on ClipLore output.
- Do not show the raw ClipLore API key in the final recording.
- Use prepared wallets, balances, products, orders, and agent runs if live
  wallet prompts are slow.
- Do not end on a queued job ID. Wait for a completed ClipLore project or output
  link.
