// ══════════════════════════════════════════════
// AXO Master System — English Translations
// ══════════════════════════════════════════════

import type { NodeData, TabConfig } from "./axoMasterSystem";

// English NODE_DATA translations
export const NODE_DATA_EN: Record<string, NodeData> = {
  // ── TAB 1: INFLUENCE ──
  "axo-center": {
    color: "#c9952a",
    eyebrow: "System Center",
    title: "AXO Floors",
    intro: "Central position on the local influence map. Receives demand both directly from actors and via the end customer. AXO's brand, trust, and execution turn referrals into closed jobs.",
    sections: [
      {
        title: "Value proposition on the map",
        color: "#c9952a",
        items: [
          { t: "Quality execution", s: "The final product everyone refers — quality is non-negotiable" },
          { t: "Trust and compliance", s: "HIC · EPA RRP · Insurance — foundation for corporate partners" },
          { t: "Recognizable brand", s: "AXO name = reference in hardwood flooring in the NJ market" },
          { t: "Clear process", s: "Communication SOP — partner knows what to expect" },
        ],
      },
    ],
    axo: { t: "Activation system", x: "Each actor around is a potential referral channel. The goal is to convert actors into active partners — who refer AXO systematically, not occasionally." },
  },

  "inf-realtors": {
    color: "#3aaa60",
    eyebrow: "Influencer · High Urgency",
    title: "Realtors",
    intro: "Highest urgency and fastest decision-making channel. Realtor needs refinish before listing — closing deadline creates pressure that favors trusted contractors with agile scheduling.",
    sections: [
      {
        title: "Why they are valuable",
        color: "#3aaa60",
        items: [
          { t: "Listing timing creates urgency", s: "Pre-sale = short deadline · quick decision · little price comparison" },
          { t: "Clear ROI for the client", s: "Refinish raises perceived property value · sells faster" },
          { t: "Predictable seasonal volume", s: "Spring/summer peak = capacity planning possible" },
          { t: "One realtor = multiple clients", s: "Each active agent has a continuous listing portfolio" },
        ],
      },
      {
        title: "How to activate this channel",
        color: "#3aaa60",
        items: [
          { t: "Flawless first job + deadline met", s: "Trust built on the first job" },
          { t: "Simple referral materials", s: "Card with QR code · direct link · easy to share with client" },
          { t: "Response in under 2h", s: "Realtor values speed — slow response = lose the job" },
          { t: "Partnership with RE Company", s: "One partnership = access to multiple agents" },
        ],
      },
    ],
  },

  "inf-builders": {
    color: "#3aaa60",
    eyebrow: "Influencer · High Volume",
    title: "Builders",
    intro: "New projects and large-scale renovations. Each active builder can generate multiple jobs per month — but requires professional process, full compliance, and consistent pricing.",
    sections: [
      {
        title: "Channel profile",
        color: "#3aaa60",
        items: [
          { t: "Volume per project", s: "A new build can have 2,000–5,000 sqft of hardwood" },
          { t: "Systematic subcontracting", s: "Builder doesn't do flooring — needs a reliable trade specialist" },
          { t: "Long-term relationship", s: "Satisfied builder becomes a recurring source for years" },
          { t: "Lower margin, higher volume", s: "Volume pricing negotiation is expected" },
        ],
      },
      {
        title: "Requirements to enter this channel",
        color: "#3aaa60",
        items: [
          { t: "Full compliance mandatory", s: "HIC · insurance · EPA RRP — without it, no entry to the job site" },
          { t: "Clear communication process", s: "Progress updates · documentation · professional invoice" },
          { t: "Team capacity", s: "Volume jobs require available and scalable crew" },
        ],
      },
    ],
  },

  "inf-re": {
    color: "#3aaa60",
    eyebrow: "Influencer · Multiplier",
    title: "Real Estate Companies",
    intro: "A partnership with the company multiplies reach to all agents in the portfolio. Channel with highest leverage per activation effort.",
    sections: [
      {
        title: "Leverage mechanics",
        color: "#3aaa60",
        items: [
          { t: "One company = dozens of realtors", s: "Keller Williams NJ · RE/MAX · Coldwell Banker — each with a listing portfolio" },
          { t: "Preferred vendor program", s: "Some RE companies maintain approved contractor lists — joining = passive flow" },
          { t: "Training and presentation", s: "Opportunity to present AXO at company team meetings" },
          { t: "Digital co-marketing", s: "RE company tag on Instagram amplifies local reach" },
        ],
      },
    ],
  },

  "inf-pm": {
    color: "#3aaa60",
    eyebrow: "Influencer · Recurrence",
    title: "Property Managers",
    intro: "Residential and commercial unit portfolios. Tenant turnover generates predictable and recurring demand — ideal for AXO's capacity planning.",
    sections: [
      {
        title: "Why it's the most predictable channel",
        color: "#3aaa60",
        items: [
          { t: "Tenant turnover = frequent refinish", s: "Each tenant departure = potential refinish or recoat job" },
          { t: "Portfolio of multiple units", s: "10–200 units per PM = stable volume per quarter" },
          { t: "Centralized decision", s: "One contact decides for all units — commercial efficiency" },
          { t: "Negotiable volume pricing", s: "Annual contract with predictable pricing for both sides" },
        ],
      },
      {
        title: "How to approach",
        color: "#3aaa60",
        items: [
          { t: "Annual contract proposal", s: "Fixed price per service type · response SLA · schedule priority" },
          { t: "Compliance as argument", s: "Corporate portfolio PM requires insurance and license — having it is a prerequisite" },
          { t: "First job free or discounted", s: "Trial job to prove quality and process" },
        ],
      },
    ],
  },

  "inf-designers": {
    color: "#8a7ad4",
    eyebrow: "Influencer · Premium",
    title: "Interior Designers",
    intro: "They specify product and contractor as part of the project. Designer's client comes with premium expectations — higher ticket, higher demands, but very high LTV.",
    sections: [
      {
        title: "How they work",
        color: "#8a7ad4",
        items: [
          { t: "Formal specification", s: "Designer puts AXO in the spec book — client arrives pre-sold" },
          { t: "Trust in contractor is personal", s: "Designer recommends with their own name — only refers who won't embarrass" },
          { t: "Focus on color matching and premium finishes", s: "Water-based · custom stain · Rubio Monocoat — technical mastery required" },
          { t: "Repeat across multiple projects", s: "Active designer has 5–20 simultaneous or sequential projects" },
        ],
      },
      {
        title: "How to attract designers",
        color: "#8a7ad4",
        items: [
          { t: "Premium visual portfolio", s: "Instagram with quality before/after · professional photos · differentiated projects" },
          { t: "Custom stain samples", s: "Physical sample kit to present to clients" },
          { t: "Clear specification process", s: "PDF with finish options · timeline · available samples" },
        ],
      },
    ],
  },

  "inf-arq": {
    color: "#8a7ad4",
    eyebrow: "Influencer · Projects",
    title: "Architects",
    intro: "Residential and commercial projects at larger scale. Long cycle but high ticket — when the architect specifies AXO, the job is guaranteed before the client asks for a quote.",
    sections: [
      {
        title: "Channel profile",
        color: "#8a7ad4",
        items: [
          { t: "Specification in the plan", s: "Architect defines floor type and finish at the design stage — before construction" },
          { t: "Premium residential projects", s: "High-end renovations · additions · custom homes" },
          { t: "Commercial projects", s: "Boutique offices · studios · premium retail · hospitality" },
          { t: "6–18 month cycle", s: "Design → approval → construction — long lead time but guaranteed job" },
        ],
      },
    ],
  },

  "inf-gcs": {
    color: "#8a7ad4",
    eyebrow: "Influencer · Direct B2B",
    title: "GCs (General Contractors)",
    intro: "Manage complete construction and subcontract each trade. For an active GC, having a reliable flooring contractor is an operational need — not a luxury.",
    sections: [
      {
        title: "Channel dynamics",
        color: "#8a7ad4",
        items: [
          { t: "Systematic subcontracting", s: "GC doesn't do flooring — needs a specialist who shows up on the right day" },
          { t: "Reliability > price", s: "GC prefers to pay more for a contractor who won't mess up on site" },
          { t: "Multiple simultaneous projects", s: "Active GC has 3–10 open jobs — real volume potential" },
          { t: "Organic referral among GCs", s: "GCs recommend each other — entering one network means entering many" },
        ],
      },
      {
        title: "How to enter this channel",
        color: "#8a7ad4",
        items: [
          { t: "First job: zero failures", s: "Deadline · quality · communication — everything must be perfect" },
          { t: "Professional invoice process", s: "GC needs documentation to bill the property owner" },
          { t: "Compliance at the tip of your tongue", s: "HIC · EPA RRP · insurance — GC will ask before hiring" },
        ],
      },
    ],
  },

  "inf-handyman": {
    color: "#8a7ad4",
    eyebrow: "Influencer · Warm Referral",
    title: "Handymans",
    intro: "They receive flooring requests they don't have the skill or license to execute. They refer trusted specialized contractors — warm referral because the handyman already qualified the client.",
    sections: [
      {
        title: "Referral mechanics",
        color: "#8a7ad4",
        items: [
          { t: "Client already qualified and ready", s: "Handyman only refers when client wants the service now — not a cold lead" },
          { t: "Low activation cost", s: "Active handyman needs few contacts to become a recurring source" },
          { t: "Natural reciprocity", s: "AXO can refer handyman to clients with other services · value exchange" },
          { t: "Dense local network", s: "Handymans know other contractors, realtors and PMs — entry point to local network" },
        ],
      },
    ],
  },

  // ── TAB 2: PARTNER ──
  "p-prospect": {
    color: "#c9952a",
    eyebrow: "Stage 01 — Top of Funnel",
    title: "Prospect the Right Partners",
    intro: "It's not about quantity — it's about fit. A wrong partner consumes energy without generating volume. The goal is to identify actors with real volume, clients aligned with AXO's standard, and willingness for long-term relationship.",
    sections: [
      {
        title: "Qualification criteria",
        color: "#c9952a",
        items: [
          { t: "Partner type", s: "GC · Builder · Designer · PM · Realtor · Handyman" },
          { t: "Estimated volume", s: "How many jobs/month the partner can realistically generate" },
          { t: "Quality fit", s: "Client standard aligned with AXO's positioning" },
          { t: "Payment fit", s: "Payment terms compatible with AXO's cash flow" },
          { t: "Territory", s: "Within current operating area — target NJ counties" },
        ],
      },
      {
        title: "Prospecting sources",
        color: "#c9952a",
        items: [
          { t: "Personal network + referrals", s: "Fastest — partner referred by someone who already trusts AXO" },
          { t: "Local LinkedIn", s: "Search for GC and PM in NJ · direct connection" },
          { t: "Construction events and fairs", s: "Home shows · NAHB chapters · RE associations" },
          { t: "Targeted cold outreach", s: "Door-to-door at active job sites · email to RE offices" },
        ],
      },
    ],
  },

  "p-onboard": {
    color: "#c9952a",
    eyebrow: "Stage 02 — Activation",
    title: "Professional Onboarding",
    intro: "The partner's first impression of the AXO system. Professional onboarding signals that AXO is an organized company — not an individual contractor.",
    sections: [
      {
        title: "Onboarding kit components",
        color: "#c9952a",
        items: [
          { t: "Physical or digital welcome kit", s: "PDF with services · reference prices · process · direct contact" },
          { t: "AXO process explanation", s: "How scheduling works · communication · delivery · warranty" },
          { t: "Expectation setting", s: "What AXO delivers · what the partner needs to provide · SLA" },
          { t: "Compliance presentation", s: "HIC · EPA RRP · insurance — proof of credibility" },
          { t: "Dedicated communication channel", s: "WhatsApp or direct email — not general phone" },
        ],
      },
    ],
  },

  "p-activate": {
    color: "#c9952a",
    eyebrow: "Stage 03 — Proof",
    title: "First Active Job",
    intro: "The trial job is the moment of proof. Everything promised during onboarding is tested here. A flawless first job transforms a curious partner into a committed partner.",
    sections: [
      {
        title: "What needs to happen on this job",
        color: "#c9952a",
        items: [
          { t: "100% deadline met", s: "Delay on the first job = end of the channel before it starts" },
          { t: "Proactive communication", s: "Updates without the partner having to ask · photos during execution" },
          { t: "Quality above expectations", s: "Positively surprising is the goal — not just meeting expectations" },
          { t: "Clear invoice process", s: "Professional documentation · easy payment" },
          { t: "Immediate feedback request", s: "Explicitly ask how it went — signals commitment to quality" },
        ],
      },
    ],
  },

  "p-exec": {
    color: "#c9952a",
    eyebrow: "Stage 04 — Standard",
    title: "AXO Standard Execution",
    intro: "The execution SOP that all partner jobs follow. Consistency is what transforms a good first job into lasting trust.",
    sections: [
      {
        title: "Execution SOP for partner jobs",
        color: "#c9952a",
        items: [
          { t: "Pre-job briefing", s: "Scope confirmation · material · access · timeline with partner" },
          { t: "Crew briefing", s: "Crew knows it's a partner job — extra presentation standard" },
          { t: "Before + process + after photos", s: "Standard documentation on every partner job" },
          { t: "Daily updates", s: "WhatsApp with status at the end of each work day" },
          { t: "Walkthrough with approval", s: "Partner (or partner's client) approves before closing" },
          { t: "Invoice with documentation", s: "Report of services executed + photos for partner to present to end client" },
        ],
      },
    ],
  },

  "p-integrate": {
    color: "#3aaa60",
    eyebrow: "Stage 05 — Integration",
    title: "Integrate into Partner's Flow",
    intro: "The partner starts including AXO automatically in their own process — without needing to be asked. This is the signal that the channel is working.",
    sections: [
      {
        title: "Signs of real integration",
        color: "#3aaa60",
        items: [
          { t: "Partner refers AXO without being asked", s: "Client asks about flooring → partner sends AXO contact directly" },
          { t: "Jobs arrive without AXO outreach", s: "Passive inbound via partner — CAC = $0" },
          { t: "Partner requests samples or presentation materials", s: "Uses AXO portfolio in client meetings" },
          { t: "Partner gives proactive feedback", s: "Reports what client said about the service — trust relationship" },
        ],
      },
      {
        title: "How to accelerate integration",
        color: "#3aaa60",
        items: [
          { t: "Make referral as easy as possible", s: "Direct link · QR · pre-written WhatsApp message" },
          { t: "Acknowledge every referral", s: "Explicitly thank every referral — reinforces the behavior" },
          { t: "Co-create materials", s: "Project photo with partner credit · joint Instagram post" },
        ],
      },
    ],
  },

  "p-recur": {
    color: "#3aaa60",
    eyebrow: "Stage 06 — Active Channel",
    title: "Generate Recurrence",
    intro: "Active channel generating regular jobs. At this stage, the partner is Tier 2 (Preferred) and has priority slots reserved on the AXO schedule.",
    sections: [
      {
        title: "Recurrence mechanisms",
        color: "#3aaa60",
        items: [
          { t: "Priority scheduling", s: "Preferred partner has reserved weekly slots · doesn't compete with general schedule" },
          { t: "Estimate in 24h", s: "Exclusive response SLA · partner knows they'll get a quick response" },
          { t: "Volume discount", s: "Better pricing for partners with proven frequency" },
          { t: "Quarterly review", s: "Relationship check-in · projected volume · feedback · opportunities" },
        ],
      },
    ],
  },

  "p-elite": {
    color: "#b090e0",
    eyebrow: "Stage 07 — Locked Channel",
    title: "Retain / Lock Channel",
    intro: "Elite Partner is a strategic asset. The channel is locked — switching to another contractor has high cost. AXO is this actor's default flooring partner.",
    sections: [
      {
        title: "What locks a channel",
        color: "#b090e0",
        items: [
          { t: "Accumulated trust history", s: "Years of perfect execution = high switching cost for partner" },
          { t: "Integration in internal process", s: "AXO is in the construction checklist, proposal template, saved contacts" },
          { t: "Exclusive Tier 3 benefits", s: "Co-marketing · revenue share · monthly report · exclusive portal" },
          { t: "Personal relationship with owner", s: "Eduardo ↔ partner's owner — not a contractor/client relationship" },
        ],
      },
    ],
    axo: { t: "End goal", x: "Have 8–12 active Elite partners generating 60–70% of AXO's volume predictably — freeing the digital channel for additional growth and new market testing." },
  },

  "tier-entry": {
    color: "#c0b870",
    eyebrow: "Tier 1",
    title: "Entry Partner",
    intro: "Partner who completed the first job successfully. Qualified, but without volume track record yet.",
    sections: [
      {
        title: "Benefits",
        color: "#c0b870",
        items: [
          { t: "Access to AXO standard process", s: "Complete SOP · onboarding kit" },
          { t: "Direct support on 1st job", s: "Eduardo or lead available for any questions" },
          { t: "Post-job evaluation", s: "Structured feedback for both sides" },
          { t: "Eligible for upgrade", s: "After 2 satisfactory jobs → evaluation for Preferred" },
        ],
      },
    ],
    loopBox: { label: "Eligible for →", tags: ["Preferred after 2 satisfactory jobs"] },
  },

  "tier-preferred": {
    color: "#c9952a",
    eyebrow: "Tier 2",
    title: "Preferred Partner",
    intro: "Positive track record, consistent volume, integrated into AXO's flow. Receives exclusive priority benefits.",
    sections: [
      {
        title: "Preferred Benefits",
        color: "#c9952a",
        items: [
          { t: "Weekly priority scheduling", s: "Reserved weekly slots — doesn't compete with general schedule" },
          { t: "Guaranteed 24h estimate", s: "Exclusive response SLA" },
          { t: "Volume discount", s: "Better pricing for proven volume" },
          { t: "Access to premium materials", s: "Higher quality product available for partner jobs" },
          { t: "Dedicated support", s: "Direct communication channel — not general queue" },
        ],
      },
    ],
    loopBox: { label: "Eligible for →", tags: ["Elite after volume and track record"] },
  },

  "tier-elite": {
    color: "#c0a0f0",
    eyebrow: "Tier 3",
    title: "Elite Partner",
    intro: "Locked channel. High volume, predictable recurrence. AXO brand ambassador partner.",
    sections: [
      {
        title: "Elite Benefits",
        color: "#c0a0f0",
        items: [
          { t: "Exclusive communication channel", s: "Direct WhatsApp with Eduardo · response in <1h" },
          { t: "Active co-marketing", s: "AXO logo on partner materials · joint Instagram post" },
          { t: "Revenue share on referrals", s: "% or credit per closed referral" },
          { t: "Guaranteed priority scheduling", s: "Slots blocked 30 days in advance" },
          { t: "Monthly performance report", s: "Volume · average ticket · satisfaction · opportunities" },
          { t: "Access to FloorPRO Partner Portal", s: "Exclusive jobs dashboard · history · express proposal" },
        ],
      },
    ],
    axo: { t: "Active Elites goal", x: "8–12 Elite partners generating 60–70% of AXO's total volume with near-zero CAC." },
    loopBox: { label: "↻ locked channel", tags: ["Co-marketing · Revenue share · Partner Portal"] },
  },

  "p-recovery": {
    color: "#e07040",
    eyebrow: "Recovery Loop",
    title: "Feedback Loop — Dissatisfied Partner",
    intro: "Not every first job is perfect. Well-executed recovery can save a channel that would have been lost — and demonstrates professionalism that often consolidates the relationship.",
    sections: [
      {
        title: "Recovery process",
        color: "#e07040",
        items: [
          { t: "Structured feedback survey", s: "Specific questions — what didn't go well · what was expected · what would improve" },
          { t: "Identify root cause", s: "Execution quality · communication · deadline · misaligned expectations" },
          { t: "Specific action plan", s: "One concrete action per failure point — not a generic response" },
          { t: "Recovery job", s: "With discount or priority — proof of commitment" },
          { t: "Unrecoverable partner", s: "Archive with notes · don't force · energy better invested in new partner" },
        ],
      },
    ],
  },

  // ── TAB 3: MASTER FLOW ──
  "mf-discovery": {
    color: "#c9952a",
    eyebrow: "Phase 01 — Top of Funnel",
    title: "Discovery",
    intro: "How AXO is discovered. Multiple simultaneous channels — each with different cost and lead quality. The ideal mix combines high-intent digital with low-CAC referral.",
    sections: [
      {
        title: "Discovery channels",
        color: "#c9952a",
        items: [
          { t: "Doorhanger + QR Code", s: "Hyperlocal · neighborhood · low cost · high geographic intent" },
          { t: "Google Search / Maps", s: "High intent · competitive CPC · converts well with reviews and optimized GBP" },
          { t: "Referral / Word of mouth", s: "CAC = $0 · highest conversion rate · depends on good post-service" },
          { t: "Partner referral", s: "Realtors · GCs · PMs → direct referral to end client" },
          { t: "Instagram / Social", s: "Before/after content · brand awareness · latent demand" },
          { t: "Cold outreach", s: "Targeted to B2B partners · not homeowners" },
        ],
      },
    ],
    axo: { t: "Mix strategy", x: "Priority 1: GBP + reviews for organic Google. Priority 2: doorhanger in target zip codes. Priority 3: activate partners as referral channel. Social as brand support." },
  },

  "mf-entry": {
    color: "#c9952a",
    eyebrow: "Phase 02 — Entry",
    title: "Entry Point",
    intro: "Where the prospect makes first formal contact. The goal is to reduce friction to the maximum — each extra form field reduces conversion.",
    sections: [
      {
        title: "Entry points",
        color: "#c9952a",
        items: [
          { t: "Landing page with quiz", s: "Preferred route — qualifies before entering the pipeline" },
          { t: "Direct WhatsApp", s: "Fast route — especially for partner referrals" },
          { t: "Call / direct call", s: "Older or urgent clients · requires immediate response" },
          { t: "Website form", s: "Asynchronous · not ideal for high urgency" },
          { t: "Google Business Profile", s: '"Call" or "Request quote" directly from search' },
        ],
      },
    ],
  },

  "mf-capture": {
    color: "#c9952a",
    eyebrow: "Phase 03 — Capture",
    title: "Lead Capture + Intent Detection",
    intro: "Captures basic data and identifies lead type. The Residential vs Partner split determines which pipeline follows — different processes, different expectations.",
    sections: [
      {
        title: "Captured data",
        color: "#c9952a",
        items: [
          { t: "Name and phone", s: "Minimum required — everything starts here" },
          { t: "Email", s: "For automated follow-up and proposal" },
          { t: "Project type", s: "Refinish · installation · repair · maintenance" },
          { t: "Type indicator", s: "Homeowner → Residential · GC/Builder/Designer → Partner" },
        ],
      },
      {
        title: "Intent detection",
        color: "#c9952a",
        items: [
          { t: "Classification quiz questions", s: '"Are you the property owner?" · "Is this for a client project?"' },
          { t: "Discovery source", s: "Realtor referred → probably urgent · Google → comparing prices" },
          { t: "Declared urgency", s: '"Need it next week" vs "I\'m researching"' },
        ],
      },
    ],
  },

  "mf-residential": {
    color: "#3aaa60",
    eyebrow: "Track A — Homeowner",
    title: "Residential Flow",
    intro: "Pipeline dedicated to the residential end client. More emotional, higher margin, more dependent on trust and reviews.",
    sections: [
      {
        title: "Track characteristics",
        color: "#3aaa60",
        items: [
          { t: "Emotional decision", s: "Homeowner buys trust · not just price" },
          { t: "Higher margin per job", s: "No intermediary · direct proposal · upsell possible" },
          { t: "Shorter sales cycle", s: "Frequent urgency · decision in 1–3 contacts" },
          { t: "Reviews are critical", s: "Homeowner checks Google before closing · 5 stars is prerequisite" },
        ],
      },
    ],
  },

  "mf-partner": {
    color: "#4a9ad4",
    eyebrow: "Track B — B2B",
    title: "Partner Flow",
    intro: "Pipeline dedicated to B2B partners. More rational, lower unit margin, higher volume and recurrence.",
    sections: [
      {
        title: "Track characteristics",
        color: "#4a9ad4",
        items: [
          { t: "Rational and procedural decision", s: "Compliance · price · deadline · process — all evaluated" },
          { t: "Volume and recurrence", s: "One active partner > 10 residential clients in annual volume" },
          { t: "Longer sales cycle", s: "First job is a relationship investment" },
          { t: "Compliance as entry", s: "Without HIC and insurance, there's no conversation" },
        ],
      },
    ],
  },

  "mf-quiz": {
    color: "#3aaa60",
    eyebrow: "Residential R1",
    title: "Project Quiz",
    intro: "Automated residential project qualification. Collects enough data to generate an estimate before the visit.",
    sections: [
      {
        title: "Data collected in quiz",
        color: "#3aaa60",
        items: [
          { t: "Approximate size", s: "In sqft or number of rooms" },
          { t: "Current floor condition", s: "Good · medium · very damaged · with current stain" },
          { t: "Desired service type", s: "Full refinish · recoat · installation · repair" },
          { t: "Timeline", s: "Urgent (< 2 weeks) · next month · researching" },
          { t: "Budget range", s: "Optional but qualifying" },
        ],
      },
    ],
  },

  "mf-estimate": {
    color: "#3aaa60",
    eyebrow: "Residential R2",
    title: "Estimate Engine",
    intro: "Generates automatic proposal in three packages — removes the friction of waiting for manual quote on each lead.",
    sections: [
      {
        title: "Package structure",
        color: "#3aaa60",
        items: [
          { t: "Silver — Essential", s: "Sand + 2 coats oil-based · no stain · entry price" },
          { t: "Gold — Recommended", s: "Sand + standard stain + 3 coats water-based · most popular" },
          { t: "Platinum — Premium", s: "Sand + custom stain + Bona premium finish + extended warranty" },
        ],
      },
      {
        title: "Available upsells",
        color: "#3aaa60",
        items: [
          { t: "Stairs", s: "Per flight or per step" },
          { t: "Spot repairs", s: "Board replacement · gap filling" },
          { t: "Move furniture", s: "Include or charge separately" },
        ],
      },
    ],
  },

  "mf-schedule": {
    color: "#3aaa60",
    eyebrow: "Residential R3",
    title: "Schedule + Follow-up",
    intro: "Scheduling and follow-up automation. Goal: reduce manual intervention without losing human warmth.",
    sections: [
      {
        title: "Scheduling flow",
        color: "#3aaa60",
        items: [
          { t: "Self-serve booking link", s: "Calendly or similar · client picks available time" },
          { t: "Automatic confirmation", s: "WhatsApp + email with visit details" },
          { t: "Automatic pre-visit kit", s: "Preparation instructions · what to expect · direct contact" },
        ],
      },
      {
        title: "Follow-up for unclosed leads",
        color: "#3aaa60",
        items: [
          { t: "Day 1", s: '"Saw you filled out the quiz — can I answer any questions?"' },
          { t: "Day 4", s: "Send similar before/after case" },
          { t: "Day 10", s: '"Still thinking? I can adjust the package."' },
          { t: "Day 21", s: "Last contact — reactivation in 90 days" },
        ],
      },
    ],
  },

  "mf-pqualify": {
    color: "#4a9ad4",
    eyebrow: "Partner P1",
    title: "Partner Qualify",
    intro: "Manual B2B partner qualification. More rigorous than residential quiz — the goal is to enter long-term relationships with real fit.",
    sections: [
      {
        title: "Qualification criteria",
        color: "#4a9ad4",
        items: [
          { t: "Type and estimated volume", s: "Active GC · builder with ongoing projects · PM with portfolio" },
          { t: "Territory and market", s: "Within AXO's area · compatible client profile" },
          { t: "Willingness for relationship", s: "Wants a trusted partner or just price?" },
          { t: "Payment terms", s: "30 days net is B2B standard — AXO needs capital to support" },
        ],
      },
    ],
  },

  "mf-contact": {
    color: "#4a9ad4",
    eyebrow: "Partner P2",
    title: "Initial Contact",
    intro: "First formal contact with qualified partner. The goal is not to sell — it's to understand the partner's business and present how AXO solves a real problem for them.",
    sections: [
      {
        title: "Contact approach",
        color: "#4a9ad4",
        items: [
          { t: "Research before calling", s: "Understand active projects · operation level · probable pain points" },
          { t: "Pain-focused opening", s: '"Do you often need a last-minute flooring contractor?" → if yes, AXO solves it' },
          { t: "Proactively present compliance", s: "HIC · insurance · EPA RRP — before being asked" },
          { t: "Propose a trial job", s: "Not a contract · a job to prove quality without commitment" },
        ],
      },
    ],
  },

  "mf-firstjob": {
    color: "#4a9ad4",
    eyebrow: "Partner P3",
    title: "First Job Activation",
    intro: "The job that defines the channel. Everything promised is tested. There's no second chance for first impression — but a perfect first job can lock a channel for years.",
    sections: [
      {
        title: "First partner job checklist",
        color: "#4a9ad4",
        items: [
          { t: "Complete briefing with partner", s: "Expectations aligned before starting" },
          { t: "Team briefed on importance", s: "Crew knows it's a strategic job" },
          { t: "Proactive communication during", s: "Updates without being asked · progress photos" },
          { t: "Delivery before deadline (if possible)", s: "Positively surprise" },
          { t: "Walkthrough and feedback request", s: "Immediate feedback · demonstrates commitment to quality" },
        ],
      },
    ],
  },

  "mf-production": {
    color: "#8a7ad4",
    eyebrow: "Phase 04 — Convergence",
    title: "Production Flow",
    intro: "Where both tracks converge. Every approved job — residential or partner — enters the same production system with the same execution standard.",
    sections: [
      {
        title: "Production stages",
        color: "#8a7ad4",
        items: [
          { t: "Project Planning", s: "Final scope · materials list · crew schedule" },
          { t: "Material ordering", s: "Abrasives · finish · stain — ordered in advance" },
          { t: "Crew assignment", s: "Lead crew defined · job briefing" },
          { t: "Daily execution", s: "Sanding → stain → finish SOP with QC checkpoints" },
          { t: "Progress updates", s: "Before photo · daily updates · after photo" },
          { t: "Final walkthrough", s: "Client or partner approves in person or via photo" },
        ],
      },
    ],
  },

  "mf-postjob": {
    color: "#c9952a",
    eyebrow: "Phase 05–06 — Post-Job and Retention",
    title: "Post-Job + Retention Loop",
    intro: "The system that transforms each job into a growth source. Review + content + referral + retention — executed in automated sequence.",
    sections: [
      {
        title: "Post-job sequence",
        color: "#c9952a",
        items: [
          { t: "Day 0 (completion)", s: "Review request via WhatsApp with direct link · after photos" },
          { t: "Day 1", s: "Thank you and care instructions sent" },
          { t: "Day 7", s: "Satisfaction check-in · ask about referrals" },
          { t: "Day 30", s: 'Maintenance follow-up · "How is the floor?"' },
          { t: "Day 90 / Day 180", s: "Reactivation · recoat or new project opportunity" },
        ],
      },
      {
        title: "Feedback loops",
        color: "#c9952a",
        items: [
          { t: "Reviews → Google ranking", s: "Volume and recency affect local 3-pack position" },
          { t: "Referrals → Word of mouth", s: "Satisfied client refers to neighbor · realtor · colleague" },
          { t: "Content → Instagram", s: "Before/after becomes discovery for new clients" },
          { t: "Partner recurrence", s: "Partner job → priority slot → next job automatic" },
        ],
      },
    ],
    axo: { t: "Loop goal", x: "Each job generates at least 1 five-star review + 1 potential referral contact. In 12 months, this compounds a volume of reviews and referrals that sustains organic growth without depending on ad spend." },
    loopBox: { label: "↻ loop closes here", tags: ["Content → Discovery", "Reviews → Google ranking"] },
  },

  // ── TAB 4: OPERATIONAL ──
  "op-inbound": {
    color: "#c9952a",
    eyebrow: "Entry — Top of System",
    title: "Inbound Sources",
    intro: "All entry channels converge to the same router. The system doesn't discriminate by channel — every lead enters the same qualification process.",
    sections: [
      {
        title: "Entry channels",
        color: "#c9952a",
        items: [
          { t: "QR Code (doorhanger · truck · yard sign)", s: "Hyperlocal · high geographic intent" },
          { t: "Cold outreach (email · call · visit)", s: "Proactive · mainly used for B2B partners" },
          { t: "Google Search / Maps / GBP", s: 'High intent · "hardwood floor refinishing NJ"' },
          { t: "Referral (client · partner · realtor)", s: "CAC = $0 · highest conversion rate" },
          { t: "Instagram / Social", s: "Awareness + before/after · generated demand, not captured" },
        ],
      },
    ],
  },

  "op-router": {
    color: "#c9952a",
    eyebrow: "Classification — Central Router",
    title: "Intent Detection Router",
    intro: "System bifurcation point. Identifies lead type and directs to the correct pipeline — residential or partner. Different process, different expectations, different SLA.",
    sections: [
      {
        title: "How routing works",
        color: "#c9952a",
        items: [
          { t: "Entry quiz (automated)", s: "3–5 questions that identify homeowner vs B2B automatically" },
          { t: "Direct question on first contact", s: '"Is the property yours?" · "Are you a contractor / agent?"' },
          { t: "Lead source as signal", s: "Realtor referred → probably urgent residential · GC entered → Partner track" },
          { t: "Manual override", s: "Eduardo can reclassify any lead manually in FloorPRO" },
        ],
      },
    ],
  },

  "op-c1": {
    color: "#3aaa60",
    eyebrow: "Residential C1 — Auto",
    title: "Qualify (Auto)",
    intro: "Automatic qualification via quiz. No manual intervention until the lead proves qualified. Saves time and keeps pipeline clean.",
    sections: [
      {
        title: "Qualification quiz",
        color: "#3aaa60",
        items: [
          { t: "Service type", s: "Refinish · recoat · installation · repair" },
          { t: "Approximate area", s: "< 500 sqft · 500–1500 · > 1500 sqft" },
          { t: "Floor condition", s: "Good · medium · very damaged" },
          { t: "Timeline", s: "Urgent · next month · researching" },
          { t: "Budget awareness", s: "Know the range? Yes/No — qualifying" },
        ],
      },
      {
        title: "Automatic disqualification criteria",
        color: "#3aaa60",
        items: [
          { t: "Outside service area", s: "Zip code outside AXO radius → friendly auto-response" },
          { t: "Service type not offered", s: "Carpet · tile · LVP → redirect or partnership" },
          { t: "Incompatible budget", s: "Expectation far below minimum viable" },
        ],
      },
    ],
  },

  "op-c2": {
    color: "#3aaa60",
    eyebrow: "Residential C2 — Engine",
    title: "Estimate Engine (S/G/P)",
    intro: "Automatic proposal generation in three packages based on quiz data. Reduces response time from days to minutes.",
    sections: [
      {
        title: "How the engine works",
        color: "#3aaa60",
        items: [
          { t: "Input: sqft + condition + service", s: "Quiz C1 feeds the engine with these three data points" },
          { t: "Calculation formula per package", s: "Silver: base per sqft · Gold: +20–30% · Platinum: +50–70%" },
          { t: "Output: PDF or proposal link", s: "Automatically generated and sent via WhatsApp or email" },
          { t: "7-day validity", s: "Creates urgency without explicitly pressuring" },
        ],
      },
      {
        title: "Package structure",
        color: "#3aaa60",
        items: [
          { t: "Silver", s: "Sand + 2 coats oil-based polyurethane · entry price" },
          { t: "Gold (recommended)", s: "Sand + standard stain + 3 coats water-based · visual highlight in proposal" },
          { t: "Platinum", s: "Sand + custom stain + Bona Traffic HD + 2-year warranty" },
        ],
      },
    ],
  },

  "op-c3": {
    color: "#3aaa60",
    eyebrow: "Residential C3 — Scheduling",
    title: "Schedule (Self-serve)",
    intro: "Client schedules the estimate visit without needing to talk to anyone. Available 24/7 — works while AXO is in the field.",
    sections: [
      {
        title: "Self-serve components",
        color: "#3aaa60",
        items: [
          { t: "Scheduling link (Calendly or similar)", s: "Available slots based on AXO's real schedule" },
          { t: "Automatic confirmation", s: "WhatsApp + email with date · time · address · what to prepare" },
          { t: "24h reminder", s: "Automatic — reduces no-show" },
          { t: "Self-serve rescheduling", s: "Client can reschedule without calling" },
        ],
      },
    ],
  },

  "op-c4": {
    color: "#3aaa60",
    eyebrow: "Residential C4 — Preparation",
    title: "Pre-Visit Kit",
    intro: "Kit sent automatically after scheduling. Prepares the client, sets expectations, and demonstrates professionalism before first in-person contact.",
    sections: [
      {
        title: "Pre-visit kit content",
        color: "#3aaa60",
        items: [
          { t: "What to expect from the visit", s: "Duration · what will be measured and photographed · how the proposal works" },
          { t: "How to prepare the space", s: "Remove small objects · facilitate access · inform about pets" },
          { t: "Recent work portfolio", s: "3–5 before/after of the same service type" },
          { t: "Common objections FAQ", s: '"How long does it last?" · "What about the smell?" · "When can I use it?"' },
          { t: "Direct contact", s: "Eduardo's WhatsApp for any questions before the visit" },
        ],
      },
    ],
  },

  "op-c5": {
    color: "#3aaa60",
    eyebrow: "Residential C5 — Decision",
    title: "Close / Nurture",
    intro: "Residential lead decision point. Closed goes to Job DB. Not closed enters nurture sequence — not abandoned.",
    sections: [
      {
        title: "If closed",
        color: "#3aaa60",
        items: [
          { t: "Deposit + digital signature", s: "50% upfront · simple contract · via WhatsApp or DocuSign" },
          { t: "Entry into Job DB (FloorPRO)", s: "Project created · crew assigned · materials ordered" },
          { t: "Schedule confirmation", s: "Date confirmed with client + crew" },
        ],
      },
      {
        title: "If not closed — nurture sequence",
        color: "#3aaa60",
        items: [
          { t: "Day 2", s: '"I noticed we didn\'t move forward — can I answer any questions?"' },
          { t: "Day 7", s: "Similar case with photo + testimonial" },
          { t: "Day 14", s: '"Still thinking? I can adjust the package."' },
          { t: "Day 30", s: 'Final check — "Is this still something you\'re considering?"' },
          { t: "Day 90", s: 'Automatic reactivation — "Hi, we noticed you inquired with us..."' },
        ],
      },
    ],
  },

  "op-d1": {
    color: "#4a9ad4",
    eyebrow: "Partner D1 — Score",
    title: "Partner Qualify (Score)",
    intro: "B2B partner qualification with structured scoring. More rigorous than residential — the goal is to invest time only in partners with real fit and volume potential.",
    sections: [
      {
        title: "Scoring criteria",
        color: "#4a9ad4",
        items: [
          { t: "Partner type (0–3)", s: "Handyman=1 · Realtor=2 · Designer/PM=3 · GC/Builder=3" },
          { t: "Estimated volume (0–3)", s: "< 2 jobs/month=1 · 2–5=2 · > 5=3" },
          { t: "Quality fit (0–2)", s: "Client compatible with AXO standard" },
          { t: "Payment fit (0–2)", s: "Payment terms viable for AXO's cash flow" },
          { t: "Score ≥ 7 → advance", s: "Score < 7 → nurture or archive" },
        ],
      },
    ],
  },

  "op-d2": {
    color: "#4a9ad4",
    eyebrow: "Partner D2 — Trial",
    title: "First Job Activation",
    intro: "Partner trial job. Relationship investment — may have lower margin or special conditions to ensure the partner experiences the AXO standard.",
    sections: [
      {
        title: "Trial job setup",
        color: "#4a9ad4",
        items: [
          { t: "Trial proposal with discount or special conditions", s: "Removes entry barrier · partner risks less" },
          { t: "Extra careful briefing", s: "Super-aligned expectations · no room for negative surprise" },
          { t: "Most experienced crew possible", s: "Strategic job → best available team" },
          { t: "Complete documentation", s: "Before/during/after photos · post-job report" },
        ],
      },
    ],
  },

  "op-d3": {
    color: "#4a9ad4",
    eyebrow: "Partner D3 — Execution",
    title: "Exec Experience",
    intro: "The execution experience the partner will have on all future jobs. The standard here is the channel's standard.",
    sections: [
      {
        title: "Execution SOP for partner jobs",
        color: "#4a9ad4",
        items: [
          { t: "Pre-job briefing with partner", s: "Scope confirmation · access · timeline" },
          { t: "Daily updates via WhatsApp", s: "Status at the end of each work day" },
          { t: "Standard before + after photos", s: "Always · no exceptions" },
          { t: "Walkthrough with approval", s: "Partner (or partner's client) approves before closing" },
          { t: "Invoice with documentation", s: "Service report + photos for partner to present to client" },
        ],
      },
    ],
  },

  "op-d4": {
    color: "#4a9ad4",
    eyebrow: "Partner D4 — Database",
    title: "Onboarding (Partner DB)",
    intro: "Satisfied partner enters the FloorPRO Partner Database. From here on, managed as a strategic asset.",
    sections: [
      {
        title: "What happens at onboarding",
        color: "#4a9ad4",
        items: [
          { t: "Registration in Partner DB", s: "Name · company · type · territory · initial tier · history" },
          { t: "Formal welcome kit", s: "Welcome PDF · tier benefits · communication channel" },
          { t: "Tier assignment", s: "Entry by default · evaluation for Preferred after 2 jobs" },
          { t: "Priority slots configured", s: "For Preferred and Elite · schedule blocked in advance" },
        ],
      },
    ],
  },

  "op-d5": {
    color: "#4a9ad4",
    eyebrow: "Partner D5 — Channel",
    title: "Recurring Slots",
    intro: "Established channel. Partner has reserved slots on AXO's schedule — doesn't compete with general demand. This is where the channel starts generating predictable volume.",
    sections: [
      {
        title: "Recurring slots mechanics",
        color: "#4a9ad4",
        items: [
          { t: "Weekly blocked slots", s: "E.g.: every Tuesday is reserved for Preferred partner jobs" },
          { t: "Express request", s: "Partner requests job → quote in 24h · confirmation in 48h" },
          { t: "Volume tracking", s: "Partner sees history and projects next jobs in Partner Portal" },
          { t: "Automatic tier upgrade", s: "Volume reaches threshold → upgrade notification to Elite" },
        ],
      },
    ],
  },

  "op-jobdb": {
    color: "#8a7ad4",
    eyebrow: "Convergence",
    title: "Job DB — Production SOP",
    intro: "Convergence point of both tracks. Every approved job enters the FloorPRO Job Database with the same production SOP.",
    sections: [
      {
        title: "What happens in the Job DB",
        color: "#8a7ad4",
        items: [
          { t: "Project registration", s: "Client · scope · sqft · service · package · price · crew assigned" },
          { t: "Material planning", s: "Abrasives · finish · stain · underlayment ordered" },
          { t: "Confirmed schedule", s: "Start date · estimated duration · crew schedule" },
          { t: "Activated SOP checklist", s: "Digital execution checklist for the crew" },
          { t: "Communication activated", s: "Automatic updates to client or partner during execution" },
        ],
      },
    ],
  },

  "op-completion": {
    color: "#30c4a8",
    eyebrow: "Quality",
    title: "Completion + QA",
    intro: "Final quality stage before financial closing. Without client approval, the job doesn't close.",
    sections: [
      {
        title: "Completion process",
        color: "#30c4a8",
        items: [
          { t: "Final walkthrough", s: "Client or partner inspects the result — in person or via photo/video" },
          { t: "Punch list", s: "Any pending item is registered and executed before closing" },
          { t: "Formal approval", s: "Written confirmation (WhatsApp works) that client approved" },
          { t: "Invoice sent", s: "Immediately after approval · with service detail" },
          { t: "Payment collected", s: "50% upfront already paid · 50% at completion · pix · check · zelle" },
          { t: "Warranty letter", s: "Warranty letter sent along with care instructions" },
        ],
      },
    ],
  },

  "op-review": {
    color: "#c9952a",
    eyebrow: "Engine G — Reviews",
    title: "Review Engine",
    intro: "Automated review request system. The goal is to maximize volume and recency of Google reviews — the two factors that most affect local ranking.",
    sections: [
      {
        title: "Review engine flow",
        color: "#c9952a",
        items: [
          { t: "Day 0 — Immediate request", s: "WhatsApp with direct Google Review link · sent at completion" },
          { t: "Day 2 — Reminder", s: "If no response · light reminder message" },
          { t: "Day 7 — Final reminder", s: "Last contact for review · don't push beyond this" },
          { t: "Internal NPS", s: "0–10 satisfaction question for internal use · identifies dissatisfied clients before requesting Google review" },
        ],
      },
      {
        title: "Review engine impact",
        color: "#c9952a",
        items: [
          { t: "Google 3-pack ranking", s: "Volume + recency + rating directly affect local position" },
          { t: "GBP conversion", s: "More reviews = more trust = more calls and messages" },
          { t: "Social proof for partners", s: "Partners check Google before referring AXO" },
        ],
      },
    ],
  },

  "op-content": {
    color: "#3aaa60",
    eyebrow: "Engine H — Content",
    title: "Content Engine → Loop",
    intro: "Content capture and publishing system that closes the loop — transforming each executed job into a source of new jobs.",
    sections: [
      {
        title: "Content capture",
        color: "#3aaa60",
        items: [
          { t: "Before photo (mandatory)", s: "Taken before any work on every job" },
          { t: "After photo (mandatory)", s: "After completion · same angle · good lighting" },
          { t: "Process video (when possible)", s: "Sanding · stain application · final result" },
          { t: "Video testimonial (high priority)", s: "30 seconds of client talking about the result" },
        ],
      },
      {
        title: "Distribution and loop",
        color: "#3aaa60",
        items: [
          { t: "Instagram (before/after)", s: "Post + stories · location tag · local hashtags" },
          { t: "Google Business Profile", s: "Photos added to profile · improves ranking" },
          { t: "Website portfolio", s: "Case study with photos · service type · city" },
          { t: "Commercial proposal", s: "Photos of similar jobs used in new proposals" },
          { t: "→ Back to Inbound Sources", s: "Content feeds discovery of new leads" },
        ],
      },
    ],
    axo: { t: "Closed loop", x: "Discovery → Lead → Job → Review + Content → Discovery. Each well-documented job is an asset that generates new jobs. In 12 months of consistent operation, accumulated content sustains organic growth." },
    loopBox: { label: "↻ loop closes here", tags: ["Content → Discovery", "Reviews → Google ranking"] },
  },
};

// English TAB label translations
export const TABS_EN_LABELS: Record<string, { label: string; paneLabel: string; paneTitle: string; paneSub: string }> = {
  influence: {
    label: "01 · Local Influence",
    paneLabel: "Tab 01",
    paneTitle: "Local Influence Map",
    paneSub: "AXO at the center — 8 surrounding actors who influence clients and refer directly. Click each one.",
  },
  partner: {
    label: "02 · Partner Program",
    paneLabel: "Tab 02",
    paneTitle: "AXO Partner Program",
    paneSub: "Partner journey — from prospecting to locked channel. Click each stage or tier.",
  },
  masterflow: {
    label: "03 · Master Flow",
    paneLabel: "Tab 03",
    paneTitle: "Master Flow System",
    paneSub: "Complete pipeline — Discovery to Loop. Dual track Residential / Partner converging into Production.",
  },
  operational: {
    label: "04 · Operating System",
    paneLabel: "Tab 04",
    paneTitle: "AXO Operating System",
    paneSub: "Pipeline engineering — dual track C1–C5 (Residential) and D1–D5 (Partner) converging into Job DB.",
  },
};

// English node card labels (tag, title, subtitle)
export const NODE_CARD_EN: Record<string, { tag?: string; title?: string; subtitle?: string }> = {
  // Tab 1
  "axo-center": { tag: "⬡ Center", subtitle: "Execution · Trust · Brand" },
  "inf-realtors": { tag: "Referral", subtitle: "High urgency · pre-listing" },
  "inf-builders": { tag: "Volume", subtitle: "Recurring jobs · B2B" },
  "inf-re": { tag: "Multiplier", subtitle: "Agent portfolio" },
  "inf-pm": { tag: "Recurrence", subtitle: "Units · predictable turn" },
  "inf-designers": { tag: "Premium", subtitle: "High LTV · specification" },
  "inf-arq": { tag: "Projects", subtitle: "Long cycle · high ticket" },
  "inf-gcs": { tag: "Direct B2B", subtitle: "Trade partner · frequency" },
  "inf-handyman": { tag: "Warm referral", subtitle: "Refer specialists" },
  // Tab 2
  "p-prospect": { tag: "01", title: "Prospect", subtitle: "GC · Builder · Designer · PM" },
  "p-onboard": { tag: "02", title: "Onboarding", subtitle: "Kit · process · expectations" },
  "p-activate": { tag: "03", title: "1st Active Job", subtitle: "Trial · proof of quality" },
  "p-exec": { tag: "04", title: "AXO Execution", subtitle: "SOP · updates · QC" },
  "p-integrate": { tag: "05", title: "Integrate Flow", subtitle: "AXO in partner's process" },
  "p-recur": { tag: "06", title: "Recurrence", subtitle: "Priority slots · volume" },
  "p-elite": { tag: "07", title: "Retain", subtitle: "Locked channel · scale" },
  "tier-entry": { subtitle: "1st job completed · qualified" },
  "tier-preferred": { subtitle: "Consistent volume · priority slots" },
  "tier-elite": { subtitle: "Locked channel · co-marketing" },
  "p-recovery": { tag: "Recovery", subtitle: "Unsatisfactory job → plan" },
  // Tab 3
  "mf-discovery": { tag: "Phase 01", subtitle: "Doorhanger · Google · Referral · Social" },
  "mf-entry": { tag: "Phase 02", subtitle: "Landing page · Form · Quiz" },
  "mf-capture": { tag: "Phase 03", subtitle: "Name · Phone · Email · Type" },
  "mf-residential": { tag: "Track A", subtitle: "Homeowner / Seller / Buyer" },
  "mf-partner": { tag: "Track B", subtitle: "GC · Builder · Designer · PM" },
  "mf-quiz": { subtitle: "Size · Condition · Budget" },
  "mf-estimate": { subtitle: "Silver · Gold · Platinum" },
  "mf-schedule": { subtitle: "Automation · nurture" },
  "mf-pqualify": { subtitle: "GC · Builder · Designer" },
  "mf-contact": { subtitle: "Call · Message · Meeting" },
  "mf-firstjob": { subtitle: "Trial experience" },
  "mf-production": { tag: "Phase 04", subtitle: "Planning · Execution · Completion" },
  "mf-postjob": { tag: "Phase 05–06", subtitle: "Review · Content · Loop" },
  // Tab 4
  "op-inbound": { tag: "Entry", subtitle: "QR · Outreach · Google · Referral" },
  "op-router": { tag: "Router", subtitle: "Homeowner vs Partner" },
  "op-c1": { subtitle: "Auto quiz" },
  "op-c2": { subtitle: "Auto S/G/P" },
  "op-c3": { subtitle: "Self-serve booking" },
  "op-c4": { subtitle: "Sent automatically" },
  "op-c5": { subtitle: "Closed → Job DB" },
  "op-d1": { subtitle: "Auto score" },
  "op-d2": { subtitle: "Trial job" },
  "op-d3": { subtitle: "SOP · QC · updates" },
  "op-d4": { subtitle: "Complete onboarding" },
  "op-d5": { subtitle: "Established channel" },
  "op-jobdb": { tag: "Convergence", subtitle: "Production SOP" },
  "op-completion": { tag: "Quality", subtitle: "Walkthrough · invoice" },
  "op-review": { tag: "Engine G", subtitle: "Google · NPS" },
  "op-content": { tag: "Engine H", subtitle: "Before/after → loop" },
};

// UI Labels translations
export const UI_LABELS = {
  pt: {
    operatingSystem: "Sistema Operacional",
    edit: "Editar",
    editing: "Editando",
    node: "Node",
    newNode: "Novo Node",
    createNode: "Criar Node",
    editCard: "Editar Card",
    removeNode: "Remover node",
    confirmRemoveNode: "Tem certeza que deseja remover este node?",
    tag: "Tag",
    title: "Título",
    subtitle: "Subtítulo",
    color: "Cor",
    saveChanges: "Salvar alterações",
    cardUpdated: "Card atualizado",
    clickToEdit: "Clique para editar...",
    clickToAddDescription: "Clique para adicionar uma descrição...",
    description: "Descrição...",
    addItem: "Adicionar item",
    addSection: "Adicionar seção",
    removeSection: "Remover esta seção?",
    removeItem: "Remover item",
    newItem: "Novo item",
    newSection: "Nova Seção",
    yourNotes: "Suas Anotações",
    save: "Salvar",
    saving: "Salvando...",
    loading: "Carregando...",
    notesPlaceholder: "Escreva suas anotações aqui...\n\n• Ações pendentes\n• Observações estratégicas\n• Links e referências",
    errorSaving: "Erro ao salvar",
    modalMode: "Modo modal",
    sidebarMode: "Modo sidebar",
    fullscreen: "Tela cheia",
  },
  en: {
    operatingSystem: "Operating System",
    edit: "Edit",
    editing: "Editing",
    node: "Node",
    newNode: "New Node",
    createNode: "Create Node",
    editCard: "Edit Card",
    removeNode: "Remove node",
    confirmRemoveNode: "Are you sure you want to remove this node?",
    tag: "Tag",
    title: "Title",
    subtitle: "Subtitle",
    color: "Color",
    saveChanges: "Save changes",
    cardUpdated: "Card updated",
    clickToEdit: "Click to edit...",
    clickToAddDescription: "Click to add a description...",
    description: "Description...",
    addItem: "Add item",
    addSection: "Add section",
    removeSection: "Remove this section?",
    removeItem: "Remove item",
    newItem: "New item",
    newSection: "New Section",
    yourNotes: "Your Notes",
    save: "Save",
    saving: "Saving...",
    loading: "Loading...",
    notesPlaceholder: "Write your notes here...\n\n• Pending actions\n• Strategic observations\n• Links and references",
    errorSaving: "Error saving",
    modalMode: "Modal mode",
    sidebarMode: "Sidebar mode",
    fullscreen: "Fullscreen",
  },
} as const;
