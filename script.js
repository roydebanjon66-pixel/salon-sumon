/* Scissors Over Comb - JS */

document.addEventListener('DOMContentLoaded', () => {

    // ── PERSISTENT STATE ────────────────────────────
    let transitionOverlay;
    let revealObs;
    let isNavigating = false;          // debounce guard

    // ── Web Audio snip sound (generated, no file needed) ──
    const playSnip = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
            }
            const src = ctx.createBufferSource();
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.35, ctx.currentTime);
            src.buffer = buf;
            src.connect(gain);
            gain.connect(ctx.destination);
            src.start();
        } catch (_) { /* audio not available, skip silently */ }
    };

    // ═══════════════════════════════════════════════
    //  1. BUILD TRANSITION OVERLAY
    // ═══════════════════════════════════════════════
    const setupTransition = () => {
        if (document.getElementById('scissor-transition')) {
            transitionOverlay = document.getElementById('scissor-transition');
            return;
        }

        /* ── Modern minimal vector scissors (viewBox 0 0 100 100, pivot at 50,50) ── */
        const overlayHTML = `
      <div class="transition-overlay" id="scissor-transition">

        <!-- Black cover panels – start at translateY(0) so they hide the screen -->
        <div class="panel-top"></div>
        <div class="panel-bottom"></div>

        <!-- Yellow glow cut-line -->
        <div class="cut-line"></div>

        <!-- Scissors (large, centred, pivot at SVG origin = screen centre) -->
        <div class="scissor-wrap">
          <!--
            viewBox="-60 -50 160 100"
            Pivot screw sits at (0, 0) — the exact SVG origin.
            Positive X  → blade tips (right)
            Negative X  → handle rings (left)
            Positive Y  → bottom blade / bottom handle
            Negative Y  → top blade / top handle
            Both blades are perfect mirrors around Y = 0 (horizontal centreline).
          -->
          <svg class="scissor-svg" viewBox="-60 -50 160 100"
               fill="none" xmlns="http://www.w3.org/2000/svg">

            <!-- ═══ TOP BLADE (rotates around 0,0) ═══ -->
            <g class="blade-top">
              <!--  Blade body: from pivot (0,0) tapering to a sharp tip at (95, 0)
                    Upper edge rises slightly, lower edge is the centreline.         -->
              <path d="M0,0 L95,-3 C98,-4 99,-1 97,1 L0,3 Z"
                    fill="#FFC107" stroke="#C68A00" stroke-width="0.5"/>
              <!-- shine highlight on blade -->
              <path d="M0,0 L90,-1.5 C93,-2 94,0 93,0.5 L0,1 Z"
                    fill="rgba(255,255,255,0.3)"/>
              <!-- handle arm: straight line from pivot leftward-upward to ring centre -->
              <line x1="0" y1="0" x2="-42" y2="-18"
                    stroke="#FFC107" stroke-width="3.5" stroke-linecap="round"/>
              <!-- finger ring -->
              <circle cx="-48" cy="-21" r="14"
                      fill="#1C1C1C" stroke="#FFC107" stroke-width="2.8"/>
              <circle cx="-48" cy="-21" r="9"
                      fill="none" stroke="#FFC107" stroke-width="1.2"/>
              <!-- tang / finger-rest nub -->
              <path d="M-48,-35 Q-46,-40 -42,-38 Q-45,-34 -48,-35 Z"
                    fill="#FFC107"/>
            </g>

            <!-- ═══ BOTTOM BLADE — perfect Y-mirror of top ═══ -->
            <g class="blade-bottom">
              <path d="M0,0 L95,3 C98,4 99,1 97,-1 L0,-3 Z"
                    fill="#FFC107" stroke="#C68A00" stroke-width="0.5"/>
              <path d="M0,0 L90,1.5 C93,2 94,0 93,-0.5 L0,-1 Z"
                    fill="rgba(255,255,255,0.3)"/>
              <line x1="0" y1="0" x2="-42" y2="18"
                    stroke="#FFC107" stroke-width="3.5" stroke-linecap="round"/>
              <circle cx="-48" cy="21" r="14"
                      fill="#1C1C1C" stroke="#FFC107" stroke-width="2.8"/>
              <circle cx="-48" cy="21" r="9"
                      fill="none" stroke="#FFC107" stroke-width="1.2"/>
              <path d="M-48,35 Q-46,40 -42,38 Q-45,34 -48,35 Z"
                    fill="#FFC107"/>
            </g>

            <!-- ═══ PIVOT SCREW at exact origin (0,0) ═══ -->
            <circle cx="0" cy="0" r="5"
                    fill="#111" stroke="#FFC107" stroke-width="1.8"/>
            <!-- crosshair engraving -->
            <line x1="-2.5" y1="0" x2="2.5" y2="0"
                  stroke="#FFC107" stroke-width="0.8"/>
            <line x1="0" y1="-2.5" x2="0" y2="2.5"
                  stroke="#FFC107" stroke-width="0.8"/>

          </svg>
        </div>

      </div>
    `;

        document.body.insertAdjacentHTML('beforeend', overlayHTML);
        transitionOverlay = document.getElementById('scissor-transition');
    };

    // ═══════════════════════════════════════════════
    //  2. CLOSE MOBILE MENU
    // ═══════════════════════════════════════════════
    const closeMenu = () => {
        document.querySelector('.hamburger')?.classList.remove('open');
        document.querySelector('.mobile-nav')?.classList.remove('open');
        document.querySelector('.mobile-nav-overlay')?.classList.remove('open');
        document.body.style.overflow = '';
    };

    // ═══════════════════════════════════════════════
    //  3. INIT PAGE (re-runs after every navigation)
    // ═══════════════════════════════════════════════
    const initPage = () => {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';

        /* ── sticky header ── */
        const header = document.getElementById('header');
        const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        /* ── mobile nav toggle ── */
        const hamburger = document.querySelector('.hamburger');
        const mobileNav = document.querySelector('.mobile-nav');
        const mobileOverlay = document.querySelector('.mobile-nav-overlay');
        if (hamburger && mobileNav && mobileOverlay) {
            hamburger.onclick = (e) => {
                e.stopPropagation();
                const open = mobileNav.classList.toggle('open');
                hamburger.classList.toggle('open', open);
                mobileOverlay.classList.toggle('open', open);
                document.body.style.overflow = open ? 'hidden' : '';
            };
            mobileOverlay.onclick = closeMenu;
            document.querySelectorAll('.mobile-nav a').forEach(a => a.onclick = closeMenu);
        }

        /* ── active nav highlight ── */
        document.querySelectorAll('.nav-menu a, .mobile-nav a').forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === currentPath);
        });

        /* ── scroll reveal (IntersectionObserver) ── */
        if (revealObs) revealObs.disconnect();
        revealObs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    revealObs.unobserve(e.target);
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

        /* ── anchor smooth scroll ── */
        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.onclick = function (e) {
                const target = document.querySelector(this.getAttribute('href'));
                if (target) { e.preventDefault(); window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' }); }
            };
        });

        /* ── interactive service menu ── */
        const svcBtns = document.querySelectorAll('.service-btn');
        const svcPanels = document.querySelectorAll('.service-panel');
        svcBtns.forEach(btn => {
            btn.onclick = () => {
                svcBtns.forEach(b => b.classList.remove('active'));
                svcPanels.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`panel-${btn.dataset.target}`)?.classList.add('active');
            };
        });

        /* ── intercept internal links ── */
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            const internal = href && !href.startsWith('#') && !href.startsWith('tel:') &&
                !href.startsWith('mailto:') && !href.startsWith('http') &&
                !link.hasAttribute('download') && link.target !== '_blank';
            if (internal) {
                link.onclick = (e) => {
                    const to = href.split('/').pop() || 'index.html';
                    const from = window.location.pathname.split('/').pop() || 'index.html';
                    if (to === from) return;
                    e.preventDefault();
                    closeMenu();
                    navigateTo(href);
                };
            }
        });
    };

    // ═══════════════════════════════════════════════
    //  4. SCISSOR ANIMATION SEQUENCE
    //  Timeline (ms):
    //   0    → overlay visible, panels cover screen, scissors pop in (open)
    //   500  → scissors SNAP closed (.snipping), cut-line flashes, SNIP sound
    //   640  → content swap happens behind the panels
    //   700  → panels FLY apart (.splitting), scissors shrink away
    //   1450 → overlay hidden, all classes cleared
    // ═══════════════════════════════════════════════
    const runScissorAnimation = (onSwapReady) => {
        const ov = transitionOverlay;

        // reset all state classes
        ov.classList.remove('snipping', 'splitting');

        // step 0 — show overlay (panels cover screen, scissors hidden)
        ov.classList.add('active');

        // step 1 — scissors have popped in by ~450ms, snap closed at 500ms
        const t1 = setTimeout(() => {
            ov.classList.add('snipping');    // blades close fast
            playSnip();                      // 🔊 snip!
        }, 500);

        // step 2 — content swap (while panels still cover screen)
        const t2 = setTimeout(() => {
            onSwapReady();
        }, 640);

        // step 3 — panels fly apart, revealing new content
        const t3 = setTimeout(() => {
            ov.classList.add('splitting');   // panels translateY ±100%
        }, 700);

        // step 4 — cleanup
        const t4 = setTimeout(() => {
            ov.classList.remove('active', 'snipping', 'splitting');
            document.body.classList.remove('sc-transitioning');
        }, 1450);

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    };

    // ═══════════════════════════════════════════════
    //  5. AJAX NAVIGATION
    // ═══════════════════════════════════════════════
    const navigateTo = async (url, pushHistory = true) => {
        if (isNavigating) return;
        isNavigating = true;
        document.body.classList.add('sc-transitioning');

        try {
            const fetchPromise = fetch(url).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.text();
            });

            let swapFn = null;
            let swapCalled = false;

            // Wire the animation's swap callback
            const cancelAnim = runScissorAnimation(async () => {
                if (swapCalled) return;
                swapCalled = true;

                try {
                    const text = await fetchPromise;
                    const doc = new DOMParser().parseFromString(text, 'text/html');

                    document.title = doc.title;
                    const saved = document.getElementById('scissor-transition');
                    document.body.innerHTML = doc.querySelector('body').innerHTML;
                    if (saved) document.body.appendChild(saved);

                    if (pushHistory) history.pushState({ url }, '', url);
                    initPage();
                    window.scrollTo(0, 0);
                } catch (err) {
                    window.location.href = url;
                } finally {
                    isNavigating = false;
                }
            });

        } catch (err) {
            console.error('Navigation error', err);
            window.location.href = url;
            isNavigating = false;
        }
    };

    // ═══════════════════════════════════════════════
    //  6. BROWSER BACK / FORWARD
    // ═══════════════════════════════════════════════
    window.onpopstate = () => navigateTo(window.location.pathname, false);

    // ── BOOT ──────────────────────────────────────
    setupTransition();
    initPage();

});