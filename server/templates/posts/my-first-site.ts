import { icon } from "../icons";

// Rich HTML template for "my-first-site" blog post
// This provides a fancy, interactive experience instead of plain markdown

export function getMyFirstSiteContent(): string {
    return `
    <!-- Hero Banner -->
    <div class="post-hero">
      <div class="post-hero-bg"></div>
      <div class="post-hero-content">
        <span class="post-hero-badge">✨ Featured Post</span>
        <h1 class="post-hero-title">Two Sites, <span class="gradient-text">Two Paths</span></h1>
        <p class="post-hero-subtitle">Cloud Portfolio + Self-Hosted Blog</p>
        <div class="post-hero-stats">
          <div class="stat-pill">${icon("clock")} 2 min read</div>
          <div class="stat-pill">${icon("calendar")} Jan 15, 2024</div>
          <div class="stat-pill">${icon("flame")} Popular</div>
        </div>
      </div>
    </div>

    <!-- Quote Block -->
    <blockquote class="fancy-quote">
      ${icon("quote")}
      <p>"The best way to learn infrastructure is to break it yourself."</p>
      <cite>— Me, at 2 AM debugging DNS</cite>
    </blockquote>

    <!-- Intro -->
    <p class="lead-paragraph">
      Why I built <strong>two versions</strong> of my web presence—one in the cloud, one self-hosted on bare metal. 
      The lessons, the costs, the 3 AM debugging sessions, and what I'd do differently.
    </p>

    <!-- Comparison Cards -->
    <section class="comparison-section">
      <h2 class="section-heading"><span class="emoji">🤔</span> Why Two Paths?</h2>
      
      <p>I've always been curious: <strong>how does the internet actually work?</strong> Not the textbook version, but the real thing.</p>
      
      <div class="comparison-grid">
        <div class="comparison-card cloud">
          <div class="card-icon">☁️</div>
          <h3>Cloud Path</h3>
          <h4>sudharsana.dev</h4>
          <ul class="feature-list">
            <li>${icon("check")} Firebase + GCP</li>
            <li>${icon("check")} React SPA</li>
            <li>${icon("check")} ~$0/month</li>
            <li>${icon("check")} Managed CI/CD</li>
          </ul>
          <div class="card-badge">Beginner Friendly</div>
        </div>
        
        <div class="comparison-card homelab">
          <div class="card-icon">🖥️</div>
          <h3>Homelab Path</h3>
          <h4>blog.sudharsana.dev</h4>
          <ul class="feature-list">
            <li>${icon("check")} Kubernetes (k8s)</li>
            <li>${icon("check")} Bun.js + TypeScript</li>
            <li>${icon("check")} Minimal (shared hardware)</li>
            <li>${icon("check")} Full control</li>
          </ul>
          <div class="card-badge">Deep Learning</div>
        </div>
      </div>
    </section>

    <!-- Mindset Section -->
    <section class="mindset-section">
      <h2 class="section-heading"><span class="emoji">🧠</span> The Mindset</h2>
      
      <div class="mindset-grid">
        <div class="mindset-card">
          <div class="mindset-icon">🔧</div>
          <h4>Build to Learn</h4>
          <p>System design sticks better when you deploy it, not just read about it.</p>
        </div>
        <div class="mindset-card">
          <div class="mindset-icon">🔗</div>
          <h4>Own the Layers</h4>
          <p>From HTML to DNS to CDN—ownership unlocks infinite customization.</p>
        </div>
        <div class="mindset-card">
          <div class="mindset-icon">🤖</div>
          <h4>Use AI Ruthlessly</h4>
          <p>It makes me 5–10× faster for scaffolding, docs, and first drafts.</p>
        </div>
      </div>
    </section>

    <!-- Timeline Section -->
    <section class="timeline-section">
      <h2 class="section-heading"><span class="emoji">📅</span> The 4-Week Journey</h2>
      
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-marker">1</div>
          <div class="timeline-content">
            <h4>Week 1: "I should build something real"</h4>
            <p class="timeline-meta">The spark & choice paralysis</p>
            <p>Spent 3 days researching frameworks. Made a spreadsheet comparing Firebase vs. Vercel vs. AWS. Finally just picked Firebase because it had the nicest docs.</p>
            <div class="timeline-lesson">
              ${icon("lightbulb")}
              <span>Lesson: Perfect is the enemy of done. Just pick something.</span>
            </div>
          </div>
        </div>
        
        <div class="timeline-item">
          <div class="timeline-marker">2</div>
          <div class="timeline-content">
            <h4>Week 2: "Let's start with cloud"</h4>
            <p class="timeline-meta">GCP setup & first deployment</p>
            <p>Domain registration is weirdly satisfying. Firebase deploy is almost too easy. SSL certificates used to be a nightmare—now they're automatic.</p>
            <div class="code-showcase">
              <div class="code-header"><span class="code-dot red"></span><span class="code-dot yellow"></span><span class="code-dot green"></span> Terminal</div>
              <pre><code>$ firebase deploy
✓ Deploy complete!
Hosting URL: https://sudharsana.dev</code></pre>
            </div>
          </div>
        </div>
        
        <div class="timeline-item">
          <div class="timeline-marker">3</div>
          <div class="timeline-content">
            <h4>Week 3: "What about my homelab?"</h4>
            <p class="timeline-meta">The learning curve</p>
            <p>Dusted off my UM790 mini-PC. Installed Ubuntu + k8s. Spent 6 hours figuring out why pods wouldn't start (spoiler: memory limits).</p>
            <div class="code-showcase error">
              <div class="code-header"><span class="code-dot red"></span><span class="code-dot yellow"></span><span class="code-dot green"></span> Debug Session</div>
              <pre><code>$ kubectl get pods
NAME                    STATUS             RESTARTS
blog-5d4f9c8b7-x2k9p   CrashLoopBackOff   5

# Diagnosis: OOMKilled - memory limit too low!</code></pre>
            </div>
          </div>
        </div>
        
        <div class="timeline-item">
          <div class="timeline-marker">4</div>
          <div class="timeline-content">
            <h4>Week 4: "This is actually working!"</h4>
            <p class="timeline-meta">The payoff</p>
            <div class="milestone-grid">
              <div class="milestone">${icon("circle-check")} First visitor from Google</div>
              <div class="milestone">${icon("circle-check")} Portfolio celebrations working</div>
              <div class="milestone">${icon("circle-check")} Blog loading in < 1 second</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Architecture Diagram -->
    <section class="architecture-section">
      <h2 class="section-heading"><span class="emoji">🏗️</span> Architecture Overview</h2>
      
      <div class="architecture-diagram">
        <div class="arch-path cloud-path">
          <div class="arch-label">CLOUD PATH</div>
          <div class="arch-flow">
            <div class="arch-node">${icon("user")}<span>User</span></div>
            <div class="arch-arrow">${icon("arrow-right")}</div>
            <div class="arch-node highlight">${icon("cloud")}<span>Cloudflare CDN</span></div>
            <div class="arch-arrow">${icon("arrow-right")}</div>
            <div class="arch-node">${icon("flame")}<span>Firebase</span></div>
            <div class="arch-arrow">${icon("arrow-right")}</div>
            <div class="arch-node">${icon("box")}<span>React SPA</span></div>
          </div>
        </div>
        
        <div class="arch-path homelab-path">
          <div class="arch-label">HOMELAB PATH</div>
          <div class="arch-flow">
            <div class="arch-node">${icon("user")}<span>User</span></div>
            <div class="arch-arrow">${icon("arrow-right")}</div>
            <div class="arch-node highlight">${icon("cloud")}<span>Cloudflare CDN</span></div>
            <div class="arch-arrow">${icon("arrow-right")}</div>
            <div class="arch-node">${icon("network")}<span>Tunnel</span></div>
            <div class="arch-arrow">${icon("arrow-right")}</div>
            <div class="arch-node">${icon("globe")}<span>K8s Ingress</span></div>
            <div class="arch-arrow">${icon("arrow-right")}</div>
            <div class="arch-node">${icon("box")}<span>Blog Pod</span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Troubleshooting Section -->
    <section class="troubleshooting-section">
      <h2 class="section-heading"><span class="emoji">💥</span> Things That Broke</h2>
      
      <div class="trouble-cards">
        <div class="trouble-card">
          <div class="trouble-header">
            <span class="trouble-icon">🔴</span>
            <h4>The 502 Errors</h4>
          </div>
          <div class="trouble-body">
            <p><strong>Symptom:</strong> Random 502s during traffic spikes</p>
            <p><strong>Root Cause:</strong> Ingress timeout too low for cold starts</p>
          </div>
          <div class="trouble-solution">
            <span class="solution-badge">✓ Solution</span>
            <code>nginx.ingress.kubernetes.io/proxy-read-timeout: "300"</code>
          </div>
        </div>
        
        <div class="trouble-card">
          <div class="trouble-header">
            <span class="trouble-icon">🔴</span>
            <h4>CSS Caching Nightmare</h4>
          </div>
          <div class="trouble-body">
            <p><strong>Symptom:</strong> Users seeing old styles after deploy</p>
            <p><strong>Root Cause:</strong> Browser + CDN caching</p>
          </div>
          <div class="trouble-solution">
            <span class="solution-badge">✓ Solution</span>
            <code>/styles/main.css?v=20250101</code>
          </div>
        </div>
        
        <div class="trouble-card">
          <div class="trouble-header">
            <span class="trouble-icon">🔴</span>
            <h4>Pod Evictions</h4>
          </div>
          <div class="trouble-body">
            <p><strong>Symptom:</strong> Pods randomly dying on mini-PC</p>
            <p><strong>Root Cause:</strong> Memory limits + system processes fighting</p>
          </div>
          <div class="trouble-solution">
            <span class="solution-badge">✓ Solution</span>
            <code>Added 4G swap + realistic limits</code>
          </div>
        </div>
      </div>
    </section>

    <!-- Lessons Grid -->
    <section class="lessons-section">
      <h2 class="section-heading"><span class="emoji">💡</span> Key Lessons</h2>
      
      <div class="lessons-grid">
        <div class="lesson-card">
          <div class="lesson-number">01</div>
          <h4>Own Your Domain</h4>
          <p>It's your identity on the internet</p>
        </div>
        <div class="lesson-card">
          <div class="lesson-number">02</div>
          <h4>Start Managed</h4>
          <p>Then progressively take back control</p>
        </div>
        <div class="lesson-card">
          <div class="lesson-number">03</div>
          <h4>Automate Everything</h4>
          <p>Even for personal projects</p>
        </div>
        <div class="lesson-card">
          <div class="lesson-number">04</div>
          <h4>Document As You Go</h4>
          <p>Your future self will thank you</p>
        </div>
        <div class="lesson-card">
          <div class="lesson-number">05</div>
          <h4>Ship Then Iterate</h4>
          <p>Perfect is the enemy of done</p>
        </div>
        <div class="lesson-card">
          <div class="lesson-number">06</div>
          <h4>Monitor Everything</h4>
          <p>You can't fix what you can't see</p>
        </div>
      </div>
    </section>

    <!-- What's Next -->
    <section class="next-section">
      <h2 class="section-heading"><span class="emoji">🔮</span> What's Next?</h2>
      
      <div class="roadmap-grid">
        <div class="roadmap-card">
          <div class="roadmap-icon">
            ${icon("network")}
          </div>
          <div class="roadmap-content">
            <h4>Architecture Deep-Dive</h4>
            <p>Full breakdown of the k8s setup, networking, and GitOps pipeline</p>
            <span class="roadmap-status upcoming">Coming Soon</span>
          </div>
        </div>
        
        <div class="roadmap-card">
          <div class="roadmap-icon">
            ${icon("bot")}
          </div>
          <div class="roadmap-content">
            <h4>AI Integrations</h4>
            <p>Adding LLM-powered features to the blog experience</p>
            <span class="roadmap-status planned">Planned</span>
          </div>
        </div>
        
        <div class="roadmap-card">
          <div class="roadmap-icon">
            ${icon("globe")}
          </div>
          <div class="roadmap-content">
            <h4>Edge Deployments</h4>
            <p>Exploring Cloudflare Workers and edge computing</p>
            <span class="roadmap-status planned">Exploring</span>
          </div>
        </div>
        
        <div class="roadmap-card">
          <div class="roadmap-icon">
            ${icon("mail")}
          </div>
          <div class="roadmap-content">
            <h4>Weekly Newsletter</h4>
            <p>Curated learnings delivered to your inbox</p>
            <span class="roadmap-status idea">Maybe?</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <div class="final-cta">
      <div class="cta-quote">
        ${icon("zap")}
        <p>"Not using AI now is like skipping the internet during the dot-com boom.<br><strong>Learn it. Use it. Ship faster.</strong>"</p>
      </div>
    </div>
    
    <p class="cta-close" style="text-align: center; margin-top: var(--space-xl); color: var(--color-text-muted); padding-bottom: var(--space-xl);">
      Built with ❤️ and curiosity. Architecture deep-dive coming soon.
    </p>
  `;
}
