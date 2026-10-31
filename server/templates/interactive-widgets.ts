import { icon } from "./icons";
import type { Post } from "../lib/posts";
import { esc } from "../lib/escape";

/**
 * Renders an Open Source release banner at the top of open-source posts (e.g. BabbleScribe)
 * and interactive playable widgets tailored to each flagship post.
 */
export function renderPostInteractiveBanner(post: Post): string {
  if (post.category === "open-source") {
    return `
      <div class="oss-release-banner reveal-on-scroll" role="region" aria-label="Open source release details">
        <div class="oss-release-info">
          <div class="oss-release-badges">
            <span class="pill-badge pill-oss">${icon("code", { size: 14 })} Open Source Release</span>
            ${post.version ? `<span class="pill-badge pill-mono">${esc(post.version)}</span>` : ""}
            ${post.license ? `<span class="pill-badge pill-mono">${icon("shield", { size: 13 })} ${esc(post.license)}</span>` : ""}
          </div>
          <p class="oss-release-summary">Built in the open. Zero ads, zero analytics, encrypted on-device storage.</p>
        </div>
        <div class="oss-release-actions">
          ${post.releaseUrl ? `
            <a href="${esc(post.releaseUrl)}" target="_blank" rel="noopener" class="btn-cta btn-cta-oss">
              ${icon("download", { size: 16 })} Download APK
            </a>
          ` : ""}
          ${post.repoUrl ? `
            <a href="${esc(post.repoUrl)}" target="_blank" rel="noopener" class="btn-cta btn-cta-secondary">
              ${icon("github", { size: 16 })} View on GitHub ${icon("external-link", { size: 13 })}
            </a>
          ` : ""}
        </div>
      </div>
    `;
  }
  return "";
}

export function renderPostInteractiveWidget(slug: string): string {
  if (slug === "babblescribe-private-voice-typing") {
    return renderBabbleScribeWidget();
  }
  if (slug === "healthforce-snowflake-anthropic-hackathon") {
    return renderHealthForceWidget();
  }
  if (slug === "recall-storm-gemini-hackathon") {
    return renderRecallStormWidget();
  }
  if (slug === "text-to-sql-agent") {
    return renderTextToSqlWidget();
  }
  return "";
}

function renderBabbleScribeWidget(): string {
  return `
    <section class="interactive-lab lab-oss reveal-on-scroll" id="babblescribe-lab" aria-label="Interactive BabbleScribe Simulator">
      <div class="lab-header">
        <div class="lab-title-group">
          <span class="lab-kicker">${icon("mic", { size: 14 })} INTERACTIVE PLAYGROUND · BABBLESCRIBE</span>
          <h3 class="lab-title">Explore How BabbleScribe Routes Audio &amp; Fixes Spoken Self-Corrections</h3>
        </div>
        <div class="lab-mode-tabs" role="tablist" aria-label="BabbleScribe Playground Modes">
          <button type="button" class="lab-tab active" role="tab" aria-selected="true" data-bf-tab="correction">
            1. Self-Correction Verifier (62/63)
          </button>
          <button type="button" class="lab-tab" role="tab" aria-selected="false" data-bf-tab="routing">
            2. Speech Flow &amp; Privacy Routing
          </button>
        </div>
      </div>

      <!-- TAB 1: Self-Correction Verifier -->
      <div class="lab-panel active" data-bf-panel="correction">
        <p class="lab-intro">
          Tap a real dictation below to watch how BabbleScribe's updated cleanup instructions and shape-aware negation guardrail handle mid sentence corrections without losing true negations:
        </p>

        <div class="bf-scenario-pills" role="group" aria-label="Dictation test cases">
          <button type="button" class="bf-scenario-btn active" data-bf-case="0">
            <span class="bf-case-tag">Number Repair</span>
            "20 minutes? No, no. 10 minutes."
          </button>
          <button type="button" class="bf-scenario-btn" data-bf-case="1">
            <span class="bf-case-tag">Name Repair</span>
            "with Sarah, no no, with Priya"
          </button>
          <button type="button" class="bf-scenario-btn" data-bf-case="2">
            <span class="bf-case-tag">Tamil Example</span>
            "9 மணிக்கு, இல்ல 10 மணிக்கு"
          </button>
          <button type="button" class="bf-scenario-btn" data-bf-case="3">
            <span class="bf-case-tag">Guardrail Look-Alike</span>
            "Not 20, but 10 people came"
          </button>
        </div>

        <div class="bf-pipeline-stage" id="bf-pipeline-stage">
          <div class="bf-wave-row">
            <div class="bf-wave-bars" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
            <div class="bf-raw-speech">
              <span class="bf-step-label">Spoken Dictation (Raw ASR)</span>
              <p class="bf-speech-quote" id="bf-raw-text">"Hey, can we schedule a meeting in 20 minutes? No, no. 10 minutes."</p>
            </div>
          </div>

          <div class="bf-comparison-grid">
            <div class="bf-comp-card bf-comp-old">
              <div class="bf-comp-head">
                <span class="bf-status-dot status-warn"></span>
                <span>Before v0.15.0 (11/21 applied)</span>
              </div>
              <p class="bf-comp-output" id="bf-old-output">"Hey, can we schedule a meeting in 20 minutes? No, no. 10 minutes."</p>
              <p class="bf-comp-reason" id="bf-old-reason">Why it failed: Conflicting prompt clauses said "never remove words" and "preserve every number", so cautious models kept both 20 and 10.</p>
            </div>

            <div class="bf-comp-card bf-comp-new">
              <div class="bf-comp-head">
                <span class="bf-status-dot status-ok"></span>
                <span>Faithful Cleanup + Guardrail (62/63)</span>
              </div>
              <p class="bf-comp-output" id="bf-new-output">"Hey, can we schedule a meeting in 10 minutes?"</p>
              <p class="bf-comp-reason" id="bf-new-reason">Guardrail Pass: Recognizes spoken repair ("No, no. 10 minutes"), drops superseded number 20, and verifies no invented numbers or dropped negations.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: Speech Flow & Privacy Simulator -->
      <div class="lab-panel" data-bf-panel="routing" hidden>
        <p class="lab-intro">
          Simulate network conditions or toggle the <strong>"Phone &amp; my server only"</strong> hardware-enforced privacy switch to see how BabbleScribe routes your voice across providers:
        </p>

        <div class="bf-routing-controls">
          <div class="bf-sim-buttons" role="group" aria-label="Network simulation">
            <button type="button" class="bf-sim-btn active" data-bf-sim="normal">All Providers Ready</button>
            <button type="button" class="bf-sim-btn" data-bf-sim="server-busy">Home GPU Busy</button>
            <button type="button" class="bf-sim-btn" data-bf-sim="offline">Airplane Mode (Offline)</button>
          </div>
          <label class="bf-privacy-toggle">
            <input type="checkbox" id="bf-privacy-switch">
            <span class="bf-toggle-track"></span>
            <span class="bf-toggle-label">${icon("shield", { size: 14 })} "Phone &amp; my server only"</span>
          </label>
        </div>

        <div class="bf-nodes-grid" id="bf-nodes-grid">
          <div class="bf-node active-route" data-node="server">
            <div class="bf-node-header">
              <span class="bf-node-step">Priority 1</span>
              <span class="bf-node-badge" id="bf-badge-server">Active Handler</span>
            </div>
            <h4>Home GPU Server</h4>
            <p>Whisper large-v3 + a tuned speech model + local Gemma cleanup over verified LAN/Tailscale IP.</p>
          </div>

          <div class="bf-node" data-node="cloud">
            <div class="bf-node-header">
              <span class="bf-node-step">Priority 2</span>
              <span class="bf-node-badge" id="bf-badge-cloud">Standby Fallback</span>
            </div>
            <h4>BYO Cloud Key</h4>
            <p>Direct to Groq / OpenAI / OpenRouter with Keystore key. No middleman of mine.</p>
          </div>

          <div class="bf-node" data-node="phone">
            <div class="bf-node-header">
              <span class="bf-node-step">Priority 3</span>
              <span class="bf-node-badge" id="bf-badge-phone">Offline Ready</span>
            </div>
            <h4>On-Phone Model</h4>
            <p>Local Whisper / Parakeet / Moonshine (~100 MB). Runs 100% offline on Android ARM64.</p>
          </div>
        </div>

        <div class="bf-route-status" id="bf-route-status" role="status" aria-live="polite">
          <strong>Route Trace:</strong> Audio streamed to <strong>Home GPU Server</strong> (verified private LAN/Tailscale IP) → Transcribed &amp; polished locally → Saved to encrypted on-device history.
        </div>
      </div>

      <script>
        (function() {
          const lab = document.getElementById('babblescribe-lab');
          if (!lab) return;

          // Tab switching
          const tabs = lab.querySelectorAll('[data-bf-tab]');
          const panels = lab.querySelectorAll('[data-bf-panel]');
          tabs.forEach(tab => {
            tab.addEventListener('click', () => {
              const target = tab.getAttribute('data-bf-tab');
              tabs.forEach(t => {
                const active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', String(active));
              });
              panels.forEach(p => {
                const match = p.getAttribute('data-bf-panel') === target;
                p.classList.toggle('active', match);
                p.hidden = !match;
              });
            });
          });

          // Self-Correction scenarios
          const cases = [
            {
              raw: '"Hey, can we schedule a meeting in 20 minutes? No, no. 10 minutes."',
              oldOut: '"Hey, can we schedule a meeting in 20 minutes? No, no. 10 minutes."',
              oldWhy: 'Why it failed: Conflicting prompt clauses said "never remove words" and "preserve every number", so cautious models kept both 20 and 10.',
              newOut: '"Hey, can we schedule a meeting in 10 minutes?"',
              newWhy: 'Guardrail Pass: Recognizes spoken repair ("No, no. 10 minutes"), drops superseded 20, and verifies no invented numbers or dropped negations.'
            },
            {
              raw: '"The meeting is with Sarah, no no, with Priya."',
              oldOut: '"The meeting is with Sarah, no no, with Priya." (Rejected by safety check)',
              oldWhy: 'Why it failed: The old negation check only allowed "no" as a correction at the start of a sentence, so dropping "no no" triggered a false lost-negation alarm.',
              newOut: '"The meeting is with Priya."',
              newWhy: 'Guardrail Pass: Shape-aware negation verifier recognizes mid-sentence repair ("no no, with Priya") as a correction rather than a dropped negation.'
            },
            {
              raw: '"நாளைக்கு காலைல 9 மணிக்கு, இல்ல 10 மணிக்கு call பண்ணு."',
              oldOut: '"நாளைக்கு காலைல 9 மணிக்கு, இல்ல 10 மணிக்கு call பண்ணு."',
              oldWhy: 'Why it failed: Tamil correction marker ("இல்ல" / illa) was treated as a literal negation and kept alongside both timestamps.',
              newOut: '"நாளைக்கு காலைல 10 மணிக்கு call பண்ணு."',
              newWhy: 'Guardrail Pass: Recognizes Tamil self-correction marker ("இல்ல 10 மணிக்கு") and cleanly outputs the corrected 10 AM time.'
            },
            {
              raw: '"Not 20, but 10 people came to the review, and there is no problem."',
              oldOut: '"Not 20, but 10 people came to the review, and there is no problem." (17/17 kept)',
              oldWhy: 'Look-alike test: Contrastive phrasing ("Not 20, but 10") is NOT a spoken slip—both numbers and the negation must survive untouched.',
              newOut: '"Not 20, but 10 people came to the review, and there is no problem." (51/51 kept)',
              newWhy: 'Guardrail Pass: Preserves both numbers in contrastive statements and strictly blocks any model output that drops "not" or "no problem".'
            }
          ];

          const caseBtns = lab.querySelectorAll('[data-bf-case]');
          const rawEl = document.getElementById('bf-raw-text');
          const oldOutEl = document.getElementById('bf-old-output');
          const oldWhyEl = document.getElementById('bf-old-reason');
          const newOutEl = document.getElementById('bf-new-output');
          const newWhyEl = document.getElementById('bf-new-reason');
          const stageEl = document.getElementById('bf-pipeline-stage');

          caseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
              const idx = parseInt(btn.getAttribute('data-bf-case'), 10);
              const c = cases[idx];
              if (!c) return;
              caseBtns.forEach(b => b.classList.toggle('active', b === btn));
              stageEl.classList.remove('pulse-anim');
              void stageEl.offsetWidth;
              stageEl.classList.add('pulse-anim');
              rawEl.textContent = c.raw;
              oldOutEl.textContent = c.oldOut;
              oldWhyEl.textContent = c.oldWhy;
              newOutEl.textContent = c.newOut;
              newWhyEl.textContent = c.newWhy;
            });
          });

          // Routing simulator
          let simState = 'normal';
          const simBtns = lab.querySelectorAll('[data-bf-sim]');
          const privacySwitch = document.getElementById('bf-privacy-switch');
          const nodeServer = lab.querySelector('[data-node="server"]');
          const nodeCloud = lab.querySelector('[data-node="cloud"]');
          const nodePhone = lab.querySelector('[data-node="phone"]');
          const badgeServer = document.getElementById('bf-badge-server');
          const badgeCloud = document.getElementById('bf-badge-cloud');
          const badgePhone = document.getElementById('bf-badge-phone');
          const statusEl = document.getElementById('bf-route-status');

          function updateRouting() {
            const privateOnly = privacySwitch && privacySwitch.checked;
            [nodeServer, nodeCloud, nodePhone].forEach(n => {
              n.classList.remove('active-route', 'skipped-route', 'blocked-route');
            });

            if (simState === 'normal') {
              nodeServer.classList.add('active-route');
              badgeServer.textContent = 'Active Handler';
              if (privateOnly) {
                nodeCloud.classList.add('blocked-route');
                badgeCloud.textContent = 'Blocked (Privacy Switch)';
              } else {
                badgeCloud.textContent = 'Standby Fallback';
              }
              badgePhone.textContent = 'Offline Ready';
              statusEl.innerHTML = '<strong>Route Trace:</strong> Audio streamed to <strong>Home GPU Server</strong> (verified private LAN/Tailscale IP) → Transcribed &amp; polished locally → Saved to encrypted on-device history.';
            } else if (simState === 'server-busy') {
              nodeServer.classList.add('skipped-route');
              badgeServer.textContent = 'Busy / Unreachable';
              if (privateOnly) {
                nodeCloud.classList.add('blocked-route');
                badgeCloud.textContent = 'Blocked (Privacy Switch)';
                nodePhone.classList.add('active-route');
                badgePhone.textContent = 'Active Fallback';
                statusEl.innerHTML = '<strong>Route Trace:</strong> Home GPU Server unreachable → Cloud skipped because <strong>"Phone &amp; my server only"</strong> is ON → Handed off to <strong>On-Phone Model</strong> (zero bytes left the device).';
              } else {
                nodeCloud.classList.add('active-route');
                badgeCloud.textContent = 'Active Fallback';
                badgePhone.textContent = 'Standby Fallback';
                statusEl.innerHTML = '<strong>Route Trace:</strong> Home GPU Server busy → Automatically failed over to <strong>BYO Cloud Key</strong> → Notified user in 1 line which provider handled the dictation.';
              }
            } else if (simState === 'offline') {
              nodeServer.classList.add('skipped-route');
              nodeCloud.classList.add(privateOnly ? 'blocked-route' : 'skipped-route');
              nodePhone.classList.add('active-route');
              badgeServer.textContent = 'Offline';
              badgeCloud.textContent = privateOnly ? 'Blocked (Privacy Switch)' : 'Offline';
              badgePhone.textContent = 'Active (100% Offline)';
              statusEl.innerHTML = '<strong>Route Trace:</strong> Network offline → <strong>On-Phone Model</strong> (Whisper/Parakeet) transcribes locally on Android ARM64 → Encrypted in SQLCipher / Keystore.';
            }
          }

          simBtns.forEach(btn => {
            btn.addEventListener('click', () => {
              simState = btn.getAttribute('data-bf-sim');
              simBtns.forEach(b => b.classList.toggle('active', b === btn));
              updateRouting();
            });
          });
          if (privacySwitch) {
            privacySwitch.addEventListener('change', updateRouting);
          }
        })();
      </script>
    </section>
  `;
}

function renderHealthForceWidget(): string {
  return `
    <section class="interactive-lab lab-hackathon reveal-on-scroll" id="healthforce-lab" aria-label="Interactive HealthForce ER Handoff Simulator">
      <div class="lab-header">
        <div class="lab-title-group">
          <span class="lab-kicker">${icon("trophy", { size: 14 })} 1ST PLACE WINNER · ANTHROPIC × SNOWFLAKE HACKATHON</span>
          <h3 class="lab-title">Interactive 3-Role ER Patient Handoff on One Snowflake Cortex Agent</h3>
        </div>
      </div>

      <p class="lab-intro">
        Click through the three clinical roles below to see how a single Snowflake Cortex Agent tracks the same trauma patient across ` + "`1.42M`" + ` synthetic records while enforcing role-specific RBAC masking:
      </p>

      <div class="bf-scenario-pills" role="group" aria-label="Clinical Roles">
        <button type="button" class="bf-scenario-btn active" data-hf-role="0">
          <span class="bf-case-tag">Step 1 · Ambulance</span>
          Paramedic En Route
        </button>
        <button type="button" class="bf-scenario-btn" data-hf-role="1">
          <span class="bf-case-tag">Step 2 · Trauma Bay</span>
          ER Attending Physician
        </button>
        <button type="button" class="bf-scenario-btn" data-hf-role="2">
          <span class="bf-case-tag">Step 3 · Bedside</span>
          Trauma Nurse Execution
        </button>
      </div>

      <div class="bf-pipeline-stage" id="hf-stage">
        <div class="hf-grid">
          <div class="bf-comp-card">
            <div class="bf-comp-head">
              <span class="bf-status-dot status-ok"></span>
              <span id="hf-role-title">Paramedic Voice Input (Unit 42)</span>
            </div>
            <p class="bf-comp-output" id="hf-voice-input">"Unconscious male, mid-40s, wallet ID says Marcus Vance, BP 82/50, laceration left flank—ETA 4 minutes."</p>
            <p class="bf-comp-reason" id="hf-rbac-note">Snowflake Governance: Paramedic role sees allergies, blood type &amp; active meds; SSN and billing fields are masked by Snowflake masking policy.</p>
          </div>

          <div class="bf-comp-card bf-comp-new">
            <div class="bf-comp-head">
              <span class="bf-status-dot status-ok"></span>
              <span>Cortex Agent Resolution (1.42M Synthea Records)</span>
            </div>
            <p class="bf-comp-output" id="hf-agent-output">Matched Patient #884912 (Marcus Vance) · Blood Type: AB+ · Alert: Penicillin Allergy · Pre-staged Trauma Bay 2</p>
            <p class="bf-comp-reason" id="hf-agent-detail">Cortex Search + SQL Tool resolved patient identity in &lt;1.2s and shared live session state with the incoming ER team.</p>
          </div>
        </div>
      </div>

      <script>
        (function() {
          const lab = document.getElementById('healthforce-lab');
          if (!lab) return;
          const roles = [
            {
              title: 'Paramedic Voice Input (Ambulance Rig)',
              voice: '"Unconscious male, mid-40s, wallet ID says Marcus Vance, BP 82/50, laceration left flank—ETA 4 minutes."',
              rbac: 'Snowflake Governance: Paramedic role sees allergies, blood type & active meds; SSN and billing fields are dynamically masked.',
              out: 'Matched Patient #884912 (Marcus Vance) · Blood Type: AB+ · Alert: Penicillin Allergy · Pre-staged Trauma Bay 2',
              detail: 'Cortex Search + SQL Tool resolved patient identity across 1.42M synthetic records and opened the shared clinical handoff thread.'
            },
            {
              title: 'ER Attending Physician (Trauma Bay Arrival)',
              voice: '"He\'s here. Pull off the gauze and hang blood."',
              rbac: 'Zero-Repetition Handoff: Doctor never says the patient\'s name or blood group—the agent binds to the active Trauma Bay 2 context.',
              out: 'Verified Order Prepared: 2 Units AB+ Packed RBC · Stat Type & Crossmatch · Contradiction Check: Clear',
              detail: 'The Cortex Agent pulls AB+ from the matched Synthea chart and translates "hang blood" into a structured, type-specific transfusion order.'
            },
            {
              title: 'Trauma Nurse (Bedside Administration)',
              voice: '"Confirming unit serial #AB-4092 at bedside—any medication conflicts before we start infusion?"',
              rbac: 'Closed-Loop Verification: Nurse sees exact unit compatibility, dosage checklist, and allergy blocks in real time.',
              out: 'Infusion Verified: AB+ Compatible · Ceftriaxone flagged (Penicillin cross-reactivity warning) → Switched to Aztreonam',
              detail: 'All three roles operated on one shared patient state in Snowflake without a single manual chart re-lookup.'
            }
          ];
          const btns = lab.querySelectorAll('[data-hf-role]');
          const stage = document.getElementById('hf-stage');
          btns.forEach(btn => {
            btn.addEventListener('click', () => {
              const r = roles[parseInt(btn.getAttribute('data-hf-role'), 10)];
              if (!r) return;
              btns.forEach(b => b.classList.toggle('active', b === btn));
              stage.classList.remove('pulse-anim');
              void stage.offsetWidth;
              stage.classList.add('pulse-anim');
              document.getElementById('hf-role-title').textContent = r.title;
              document.getElementById('hf-voice-input').textContent = r.voice;
              document.getElementById('hf-rbac-note').textContent = r.rbac;
              document.getElementById('hf-agent-output').textContent = r.out;
              document.getElementById('hf-agent-detail').textContent = r.detail;
            });
          });
        })();
      </script>
    </section>
  `;
}

function renderRecallStormWidget(): string {
  return `
    <section class="interactive-lab lab-hackathon reveal-on-scroll" id="recall-lab" aria-label="Interactive Recall Storm Verifier">
      <div class="lab-header">
        <div class="lab-title-group">
          <span class="lab-kicker">${icon("cpu", { size: 14 })} GEMINI 4 ARGON SF HACKATHON · MILLION TOKEN TRACK</span>
          <h3 class="lab-title">Why "Consistent Isn't Correct": 646,825 Tokens vs. The Domain Verifier</h3>
        </div>
      </div>

      <p class="lab-intro">
        Toggle between the raw 911-file generation and the deterministic verifier pass to see what long-context models get right—and where silent arithmetic/domain drift hides:
      </p>

      <div class="bf-scenario-pills" role="group" aria-label="Verification stages">
        <button type="button" class="bf-scenario-btn active" data-rs-stage="0">
          <span class="bf-case-tag">Pass 1 · Structural Seams</span>
          646,825 Tokens · 911 Files
        </button>
        <button type="button" class="bf-scenario-btn" data-rs-stage="1">
          <span class="bf-case-tag">Pass 2 · Domain Verifier</span>
          21,459 Constraint Failures Found
        </button>
        <button type="button" class="bf-scenario-btn" data-rs-stage="2">
          <span class="bf-case-tag">Pass 3 · Closed-Loop Fix</span>
          Verified AB 418 Overnight Pull
        </button>
      </div>

      <div class="bf-pipeline-stage" id="rs-stage">
        <div class="bf-comparison-grid">
          <div class="bf-comp-card">
            <div class="bf-comp-head">
              <span class="bf-status-dot status-ok"></span>
              <span id="rs-left-title">Cross-File Structural Integrity: 100%</span>
            </div>
            <p class="bf-comp-output" id="rs-left-out">911 files generated in one continuous run · Every import, schema key, and store ID cross-reference resolved cleanly.</p>
            <p class="bf-comp-reason" id="rs-left-why">Long-context strength: Gemini kept naming conventions, JSON schemas, and TypeScript interfaces coherent across 646K tokens.</p>
          </div>
          <div class="bf-comp-card bf-comp-new">
            <div class="bf-comp-head">
              <span class="bf-status-dot status-warn" id="rs-right-dot"></span>
              <span id="rs-right-title">Verifier Audit: Hidden Domain Drift</span>
            </div>
            <p class="bf-comp-output" id="rs-right-out">21,459 domain &amp; arithmetic violations detected across shift capacities, hidden E127/erythrosine aliases, and quarantine bin limits.</p>
            <p class="bf-comp-reason" id="rs-right-why">Takeaway: Long-context generation gives you architectural coherence, but deterministic verifiers are mandatory for physical/regulatory constraints.</p>
          </div>
        </div>
      </div>

      <script>
        (function() {
          const lab = document.getElementById('recall-lab');
          if (!lab) return;
          const stages = [
            {
              lTitle: 'Cross-File Structural Integrity: 100%',
              lOut: '911 files generated in one continuous run · Every import, schema key, and store ID cross-reference resolved cleanly.',
              lWhy: 'Long-context strength: Gemini kept naming conventions, JSON schemas, and TypeScript interfaces coherent across 646K tokens.',
              rDot: 'status-warn',
              rTitle: 'Verifier Audit: Hidden Domain Drift',
              rOut: '21,459 domain & arithmetic violations detected across shift capacities, hidden E127/erythrosine aliases, and quarantine bin limits.',
              rWhy: 'Takeaway: Long-context generation gives you architectural coherence, but deterministic verifiers are mandatory for regulatory compliance.'
            },
            {
              lTitle: 'What the Model Missed Inside Valid JSON',
              lOut: 'Ingredient alias blindness (Red 3 hidden as FD&C Red No. 3 / Erythrosine / E127) + overnight clerk minutes exceeding shift length.',
              lWhy: 'A model optimizing for plausible structure writes plans that look valid to a linter while overflowing physical store labor capacity.',
              rDot: 'status-ok',
              rTitle: 'Deterministic Verifier Breakdown',
              rOut: 'Checked every SKU ingredient tree, shelf-pull minute budget, disposal manifest weight, and sign-off dependency graph.',
              rWhy: 'Every single violation was pinpointed with file, store ID, SKU, and exact constraint delta.'
            },
            {
              lTitle: 'Generator + Verifier Loop',
              lOut: 'Feed structured verifier counterexamples back into the compliance engine rather than trusting one-shot prose.',
              lWhy: 'Pairing million-token context with a fast formal/programmatic checker turns impressive demos into trustworthy engineering.',
              rDot: 'status-ok',
              rTitle: 'Result: Audit-Grade Overnight Recall',
              rOut: 'Zero unpulled Red No. 3 SKUs · Shift labor balanced across overnight crews · Complete chain-of-custody quarantine logs.',
              rWhy: 'Consistent + Verified = Production-Ready.'
            }
          ];
          const btns = lab.querySelectorAll('[data-rs-stage]');
          const stage = document.getElementById('rs-stage');
          btns.forEach(btn => {
            btn.addEventListener('click', () => {
              const s = stages[parseInt(btn.getAttribute('data-rs-stage'), 10)];
              if (!s) return;
              btns.forEach(b => b.classList.toggle('active', b === btn));
              stage.classList.remove('pulse-anim');
              void stage.offsetWidth;
              stage.classList.add('pulse-anim');
              document.getElementById('rs-left-title').textContent = s.lTitle;
              document.getElementById('rs-left-out').textContent = s.lOut;
              document.getElementById('rs-left-why').textContent = s.lWhy;
              const dot = document.getElementById('rs-right-dot');
              dot.className = 'bf-status-dot ' + s.rDot;
              document.getElementById('rs-right-title').textContent = s.rTitle;
              document.getElementById('rs-right-out').textContent = s.rOut;
              document.getElementById('rs-right-why').textContent = s.rWhy;
            });
          });
        })();
      </script>
    </section>
  `;
}

function renderTextToSqlWidget(): string {
  return `
    <section class="interactive-lab lab-engineering reveal-on-scroll" id="sql-agent-lab" aria-label="Interactive Dual-Model Text-to-SQL Simulator">
      <div class="lab-header">
        <div class="lab-title-group">
          <span class="lab-kicker">${icon("terminal", { size: 14 })} ARCHITECTURE SIMULATOR · LOCAL GPU INFERENCE</span>
          <h3 class="lab-title">Trace a Question Through the Dual-Model Text-to-SQL Pipeline</h3>
        </div>
      </div>

      <div class="bf-scenario-pills" role="group" aria-label="Sample natural language database queries">
        <button type="button" class="bf-scenario-btn active" data-sql-q="0">
          <span class="bf-case-tag">Blog Metrics</span>
          "How many comments and likes did we get this week?"
        </button>
        <button type="button" class="bf-scenario-btn" data-sql-q="1">
          <span class="bf-case-tag">Safety Guardrail</span>
          "DROP TABLE comments; --"
        </button>
      </div>

      <div class="bf-pipeline-stage" id="sql-stage">
        <div class="bf-comparison-grid">
          <div class="bf-comp-card">
            <div class="bf-comp-head">
              <span class="bf-status-dot status-ok"></span>
              <span id="sql-step1-title">1. Qwen Tool-Caller + Read-Only Boundary</span>
            </div>
            <p class="bf-comp-output mono-code" id="sql-query-out">SELECT COUNT(*) AS likes FROM likes WHERE created_at &gt;= NOW() - INTERVAL '7 days';</p>
            <p class="bf-comp-reason" id="sql-guard-why">Boundary Check: AST validator enforces SELECT-only, injects LIMIT 100, and executes under read-only Postgres role (readonly_agent) with 5s timeout.</p>
          </div>
          <div class="bf-comp-card bf-comp-new">
            <div class="bf-comp-head">
              <span class="bf-status-dot status-ok" id="sql-step2-dot"></span>
              <span id="sql-step2-title">2. Gemma Conversational Synthesis</span>
            </div>
            <p class="bf-comp-output" id="sql-answer-out">"In the last 7 days, your blog received 14 new likes and 6 approved reader comments, led by the BabbleScribe launch post."</p>
            <p class="bf-comp-reason" id="sql-answer-why">Replaced a 5-step SSH → kubectl exec → psql ritual with a 2-second natural language answer running 100% on local homelab GPU.</p>
          </div>
        </div>
      </div>

      <script>
        (function() {
          const lab = document.getElementById('sql-agent-lab');
          if (!lab) return;
          const items = [
            {
              qOut: "SELECT COUNT(*) AS likes FROM likes WHERE created_at >= NOW() - INTERVAL '7 days';",
              qWhy: "Boundary Check: Validator enforces SELECT-only, injects LIMIT 100, and executes under read-only Postgres role (readonly_agent) with 5s timeout.",
              dot: "status-ok",
              s2Title: "2. Gemma Conversational Synthesis",
              aOut: '"In the last 7 days, your blog received 14 new likes and 6 approved reader comments, led by the BabbleScribe launch post."',
              aWhy: "Replaced a 5-step SSH → kubectl exec → psql ritual with a 2-second natural language answer running 100% on local homelab GPU."
            },
            {
              qOut: "BLOCKED BY SQL BOUNDARY: Mutating keyword 'DROP' rejected before database connection.",
              qWhy: "Defense in depth: Even if the regex/AST guard were bypassed, the database role 'readonly_agent' has zero write/DDL privileges on blog_db.",
              dot: "status-warn",
              s2Title: "2. Safe Refusal Response",
              aOut: '"I only have read-only access to query metrics and cannot modify or drop tables."',
              aWhy: "Zero risk of accidental or prompt-injected data loss."
            }
          ];
          const btns = lab.querySelectorAll('[data-sql-q]');
          const stage = document.getElementById('sql-stage');
          btns.forEach(btn => {
            btn.addEventListener('click', () => {
              const item = items[parseInt(btn.getAttribute('data-sql-q'), 10)];
              if (!item) return;
              btns.forEach(b => b.classList.toggle('active', b === btn));
              stage.classList.remove('pulse-anim');
              void stage.offsetWidth;
              stage.classList.add('pulse-anim');
              document.getElementById('sql-query-out').textContent = item.qOut;
              document.getElementById('sql-guard-why').textContent = item.qWhy;
              document.getElementById('sql-step2-dot').className = 'bf-status-dot ' + item.dot;
              document.getElementById('sql-step2-title').textContent = item.s2Title;
              document.getElementById('sql-answer-out').textContent = item.aOut;
              document.getElementById('sql-answer-why').textContent = item.aWhy;
            });
          });
        })();
      </script>
    </section>
  `;
}
