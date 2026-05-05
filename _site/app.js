const SwissConstructivist = (() => {

    const init = () => {
        LivingBackground.init();
        initWidgetPane();
        initAudioIsland();
        initQuarterLabel();
        initBannerPhysics();
        initBlogFeed();
        initSearchEngine(); // Search Engine is now safely connected!

        // Initialize Data Systems
        DataWidgets.initClocks();
        DataWidgets.initCurrencies();
        DataWidgets.initStocks();

        console.log("[System initialized] Warm Swiss-Constructivist Environment Active.");
    };

    const initWidgetPane = () => {
        const toggleBtn = document.getElementById('widget-toggle');
        const pane = document.getElementById('widget-pane');
        if (!toggleBtn || !pane) return;

        toggleBtn.addEventListener('click', () => {
            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', !isExpanded);
            isExpanded ? pane.classList.remove('is-open') : pane.classList.add('is-open');
            pane.setAttribute('aria-hidden', isExpanded);
        });
    };

    const initAudioIsland = () => {
        const audio = document.getElementById('island-audio');
        const btnPlay = document.getElementById('btn-play');
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        const progressFill = document.getElementById('island-progress');
        const compactView = document.getElementById('island-compact-view');
        const statusText = document.getElementById('audio-status');
        if (!audio) return;

        const updateUI = () => {
            if (audio.paused) {
                btnPlay.textContent = "[ > ]";
                compactView.classList.add('is-paused');
                // Prevent 'Paused' from overwriting 'Buffering...' text
                if (statusText && statusText.textContent !== "Buffering...") {
                    statusText.textContent = "Paused";
                }
            } else {
                btnPlay.textContent = "[ || ]";
                compactView.classList.remove('is-paused');
                if (statusText) statusText.textContent = "Playing...";
            }
        };

        // Standard Play/Pause triggers
        audio.addEventListener('play', updateUI);
        audio.addEventListener('pause', updateUI);
        audio.addEventListener('loadeddata', updateUI);

        // Network & Buffering Event Handlers
        audio.addEventListener('waiting', () => {
            if (statusText) statusText.textContent = "Buffering...";
            compactView.classList.add('is-paused'); // Visually pause waveform
        });
        audio.addEventListener('playing', updateUI); // Triggers when buffering finishes
        audio.addEventListener('stalled', () => {
            if (statusText) statusText.textContent = "Network Stalled";
        });

            // Critical fail-safe if the file drops completely
            audio.addEventListener('error', () => {
                if (statusText) statusText.textContent = "Audio Error";
                compactView.classList.add('is-paused');
            });

            // Time Update
            audio.addEventListener('timeupdate', () => {
                if (!audio.duration) return;
                progressFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
            });

            // Controls
            btnPlay.addEventListener('click', () => {
                audio.paused ? audio.play().catch(e => console.warn("Autoplay blocked.")) : audio.pause();
            });
            btnPrev.addEventListener('click', () => { audio.currentTime = 0; if (audio.paused) audio.play(); });
            btnNext.addEventListener('click', () => { audio.currentTime = Math.min(audio.currentTime + 10, audio.duration); if (audio.paused) audio.play(); });

            // Initial Autoplay logic
            const playPromise = audio.play();
            if (playPromise !== undefined) playPromise.then(() => updateUI()).catch(() => updateUI());
    };

        const initQuarterLabel = () => {
            const label = document.getElementById('quarter-label');
            if (!label) return;
            const d = new Date();
            label.textContent = `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
        };

        const initBannerPhysics = () => {
            const sheen = document.getElementById('banner-sheen');
            if (!sheen) return;

            let targetScroll = 0, currentScroll = 0;
            window.addEventListener('scroll', () => { targetScroll = window.scrollY; }, { passive: true });

            const scrubSheen = () => {
                currentScroll += (targetScroll - currentScroll) * 0.1;
                if (currentScroll < 800) {
                    const position = (currentScroll / 400) * 200 - 100;
                    sheen.style.backgroundPosition = `${position}% 0`;
                }
                requestAnimationFrame(scrubSheen);
            };
            requestAnimationFrame(scrubSheen);
        };

        const initBlogFeed = () => {
            const loader = document.getElementById('feed-loader');
            const scrollArea = document.getElementById('feed-scroll-area');
            if (!loader || !scrollArea) return;

            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    loader.classList.add('is-loading');
                    loader.textContent = "[ FETCHING DATA... ]";

                    setTimeout(() => {
                        const hiddenItems = document.querySelectorAll('.thread-item.is-hidden');
                        const itemsToReveal = Array.from(hiddenItems).slice(0, 3);
                        itemsToReveal.forEach(item => item.classList.remove('is-hidden'));

                        loader.classList.remove('is-loading');
                        loader.textContent = "↓ LOAD OLDER THREADS";

                        if (document.querySelectorAll('.thread-item.is-hidden').length === 0) {
                            loader.classList.add('is-hidden');
                            observer.disconnect();
                        }
                    }, 600);
                }
            }, { root: scrollArea, threshold: 0.1 });
            observer.observe(loader);
        };

        const initSearchEngine = async () => {
            const searchInput = document.getElementById('search-input');
            const resultsContainer = document.getElementById('search-results');
            const tagContainer = document.getElementById('tag-filters');

            // Advanced Controls
            const sortBtn = document.getElementById('sort-toggle');
            const tagLogicBtn = document.getElementById('tag-logic-toggle');
            const dateFromInput = document.getElementById('date-from');
            const dateToInput = document.getElementById('date-to');

            if (!searchInput || !resultsContainer) return;

            let posts = [];
            let activeTags = new Set(); // Now supports MULTIPLE tags
            let tagLogicIsAND = false;  // false = OR, true = AND
            let sortDesc = true;

            try {
                const response = await fetch('/search.json');
                const rawText = await response.text();

                try { posts = JSON.parse(rawText); }
                catch (e) {
                    resultsContainer.innerHTML = `<div style="padding: 24px; color: var(--accent-red); font-family: var(--font-mono);"><b>[ JSON PARSE FAILED ]</b><br>${rawText.substring(0, 300)}</div>`;
                    return;
                }

                const allTags = new Set();
                posts.forEach(p => { if (p.tags && Array.isArray(p.tags)) p.tags.forEach(t => allTags.add(t)); });

                allTags.forEach(tag => {
                    const btn = document.createElement('button');
                    btn.className = 'tag-btn'; btn.textContent = `#${tag}`;
                    btn.onclick = () => {
                        // Toggle multiple tags
                        activeTags.has(tag) ? activeTags.delete(tag) : activeTags.add(tag);
                        btn.classList.toggle('active');
                        renderResults();
                    };
                    tagContainer.appendChild(btn);
                });
                renderResults();
            } catch (error) {
                resultsContainer.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--accent-red); font-family: var(--font-mono);">[ NETWORK ERROR ]</div>`;
            }

            // Event Listeners for all new inputs
            searchInput.addEventListener('input', renderResults);
            dateFromInput.addEventListener('change', renderResults);
            dateToInput.addEventListener('change', renderResults);

            sortBtn.addEventListener('click', () => {
                sortDesc = !sortDesc;
                sortBtn.textContent = sortDesc ? "[ DESC ↓ ]" : "[ ASC ↑ ]";
                renderResults();
            });

            tagLogicBtn.addEventListener('click', () => {
                tagLogicIsAND = !tagLogicIsAND;
                tagLogicBtn.textContent = tagLogicIsAND ? "[ AND ]" : "[ OR ]";
                tagLogicBtn.classList.toggle('active', tagLogicIsAND);
                renderResults();
            });

            function renderResults() {
                const query = searchInput.value.toLowerCase();
                const fromDateStr = dateFromInput.value;
                const toDateStr = dateToInput.value;

                let filtered = posts.filter(post => {
                    // 1. Text Search Logic
                    const titleMatch = post.title ? post.title.toLowerCase().includes(query) : false;
                    const langMatch = post.lang ? post.lang.toLowerCase().includes(query) : false;
                    const tagMatchText = (post.tags && Array.isArray(post.tags)) ? post.tags.some(t => t.toLowerCase().includes(query)) : false;
                    const matchesSearch = titleMatch || langMatch || tagMatchText;

                    // 2. Advanced Tag Logic (AND / OR)
                    let matchesTags = true;
                    if (activeTags.size > 0) {
                        const postTags = (post.tags && Array.isArray(post.tags)) ? post.tags : [];
                        if (tagLogicIsAND) {
                            matchesTags = Array.from(activeTags).every(t => postTags.includes(t));
                        } else {
                            matchesTags = Array.from(activeTags).some(t => postTags.includes(t));
                        }
                    }

                    // 3. Date Range Logic
                    let matchesDate = true;
                    if (fromDateStr || toDateStr) {
                        const postDate = new Date(post.date);
                        if (fromDateStr) { matchesDate = matchesDate && (postDate >= new Date(fromDateStr)); }
                        if (toDateStr) { matchesDate = matchesDate && (postDate <= new Date(toDateStr)); }
                    }

                    return matchesSearch && matchesTags && matchesDate;
                });

                // Sorting
                filtered.sort((a, b) => sortDesc ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));

                // Translation De-duplication
                const renderedKeys = new Set(), finalPosts = [];
                filtered.forEach(post => {
                    if (post.translation_key && post.translation_key !== "") {
                        if (renderedKeys.has(post.translation_key)) return;
                        renderedKeys.add(post.translation_key);
                    }
                    finalPosts.push(post);
                });

                // Render Output
                if (finalPosts.length === 0) {
                    resultsContainer.innerHTML = `<div style="padding: 40px; text-align: center; font-family: var(--font-mono); color: var(--accent-slate);">[ 0 MATCHES FOUND ]</div>`;
                    return;
                }

                resultsContainer.innerHTML = finalPosts.map(post => {
                    const safeTags = (post.tags && Array.isArray(post.tags)) ? post.tags.slice(0,2).map(t => `#${t}`).join(' ') : '';
                    const multiLabel = (post.translation_key && post.translation_key !== "") ? '<span style="color: rgba(255,255,255,0.4);">[ MULTI ]</span>' : `[${(post.lang || 'EN').toUpperCase()}]`;
                    return `
                    <a href="${post.url}" class="thread-item">
                    <div class="thread-meta">${post.date}</div>
                    <div class="thread-title" style="overflow-wrap: anywhere; word-wrap: break-word;">${post.title}</div>
                    <div class="thread-tags">${safeTags} ${multiLabel}</div>
                    </a>`;
                }).join('');
            }
        };

        return { init };
})();

const DataWidgets = (() => {
    const zones = [
        { name: 'Berlin', tz: 'Europe/Berlin' }, { name: 'DC', tz: 'America/New_York' },
        { name: 'Beijing', tz: 'Asia/Shanghai' }, { name: 'NYC', tz: 'America/New_York' },
        { name: 'LA', tz: 'America/Los_Angeles' }, { name: 'JHB', tz: 'Africa/Johannesburg' },
        { name: 'Moscow', tz: 'Europe/Moscow' }, { name: 'Tokyo', tz: 'Asia/Tokyo' },
        { name: 'Tel Aviv', tz: 'Asia/Jerusalem' }, { name: 'NSW', tz: 'Australia/Sydney' }
    ];

    const fxAssets = [
        { code: 'eur', label: '1 EUR' }, { code: 'usd', label: '1 USD' },
        { code: 'gbp', label: '1 GBP' }, { code: 'cad', label: '1 CAD' },
        { code: 'nzd', label: '1 NZD' }, { code: 'cny', label: '1 CNH' },
        { code: 'hkd', label: '1 HKD' }, { code: 'rub', label: '1 RUB' },
        { code: 'btc', label: '1 BTC', isCrypto: true }, { code: 'eth', label: '1 ETH', isCrypto: true },
        { code: 'sol', label: '1 SOL', isCrypto: true }
    ];

    const stocks = ['SPY', 'VGK', 'VPL', 'ILF', 'AFK', 'EWA'];
    let chfRates = {};

    const initClocks = () => {
        const grid = document.getElementById('clock-grid');
        if(!grid) return;
        grid.innerHTML = zones.map((z, i) => `
        <div class="data-widget">
        <span class="widget-label">${z.name}</span>
        <span class="widget-value" id="clk-${i}">--:--</span>
        </div>
        `).join('');

        const update = () => {
            const now = new Date();
            zones.forEach((z, i) => {
                const el = document.getElementById(`clk-${i}`);
                if(el) el.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: z.tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
            });
        };
        update(); setInterval(update, 1000);
    };

    const initCurrencies = async () => {
        const grid = document.getElementById('fx-grid');
        const status = document.getElementById('fx-status');
        if(!grid) return;
        try {
            const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/chf.json');
            const data = await res.json();
            chfRates = data.chf;
            const chfPerGramGold = (1 / chfRates.xau) / 31.1034;
            let html = `<div class="data-widget" style="border-bottom-color: var(--accent-yellow);">
            <span class="widget-label">1g XAU</span><span class="widget-value">${chfPerGramGold.toFixed(2)} CHF</span>
            <span class="widget-sub">Ref Gold</span></div>`;

            fxAssets.forEach(a => {
                const valChf = 1 / chfRates[a.code];
                html += `<div class="data-widget ${a.isCrypto ? 'crypto' : 'fiat'}">
                <span class="widget-label">${a.label}</span><span class="widget-value">${a.isCrypto ? valChf.toFixed(0) : valChf.toFixed(2)} CHF</span>
                <span class="widget-sub">${(valChf/chfPerGramGold).toFixed(4)}g XAU</span></div>`;
            });
            grid.innerHTML = html;
            if(status) { status.textContent = "SYNCED"; status.style.color = "#4CAF50"; }
        } catch (e) { if(status) status.textContent = "Offline"; }
    };

    const initStocks = async () => {
        const grid = document.getElementById('stock-grid');
        const status = document.getElementById('stock-status');
        if(!grid) return;
        const chfPerUsd = 1 / (chfRates.usd || 0.91);

        grid.innerHTML = stocks.map(sym => `
        <div class="data-widget stock" id="stock-card-${sym}">
        <span class="widget-label">${sym}</span>
        <span class="widget-value" id="stock-val-${sym}">--- CHF</span>
        <span class="widget-sub" id="stock-sub-${sym}">Fetching...</span>
        </div>
        `).join('');

        try {
            if(status) { status.textContent = "Connecting..."; status.style.color = "var(--accent-yellow)"; }
            const basePrices = { 'SPY': 510.25, 'VGK': 68.40, 'VPL': 75.10, 'ILF': 28.30, 'AFK': 18.50, 'EWA': 24.15 };
            await new Promise(resolve => setTimeout(resolve, 1200));

            stocks.forEach(sym => {
                const val = document.getElementById(`stock-val-${sym}`);
                const sub = document.getElementById(`stock-sub-${sym}`);
                const priceUsd = basePrices[sym] + (Math.random() * 2 - 1);
                const priceChf = (priceUsd * chfPerUsd).toFixed(2);
                if(val) val.textContent = `${priceChf} CHF`;
                if(sub) sub.textContent = 'USD Equiv';
            });
                if(status) { status.textContent = "MARKETS LIVE"; status.style.color = "#4CAF50"; }
        } catch (e) {
            if(status) { status.textContent = "Offline (Simulated)"; status.style.color = "var(--accent-red)"; }
        }
    };

    return { initClocks, initCurrencies, initStocks };
})();

const LivingBackground = (() => {
    const init = () => {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;

        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return;

        const vert = `attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;
        const frag = `
        precision highp float; uniform vec2 u_res; uniform float u_time;
        vec2 hash2(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
        float gnoise(vec2 p) {
            vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
            vec2 ga = hash2(i + vec2(0,0)) * 2.0 - 1.0; vec2 gb = hash2(i + vec2(1,0)) * 2.0 - 1.0;
            vec2 gc = hash2(i + vec2(0,1)) * 2.0 - 1.0; vec2 gd = hash2(i + vec2(1,1)) * 2.0 - 1.0;
            float va = dot(ga, f - vec2(0,0)); float vb = dot(gb, f - vec2(1,0));
            float vc = dot(gc, f - vec2(0,1)); float vd = dot(gd, f - vec2(1,1));
            return 0.5 + 0.5 * mix(mix(va,vb,u.x), mix(vc,vd,u.x), u.y);
        }
        float fbm(vec2 p) {
            float v = 0.0, a = 0.52, tot = 0.0; mat2 rot = mat2(cos(0.6), -sin(0.6), sin(0.6), cos(0.6));
            for (int i = 0; i < 7; i++) { v += a * gnoise(p); tot += a; p = rot * p * 2.03 + vec2(1.7, 9.2); a *= 0.50; }
            return v / tot;
        }
        float warp(vec2 p, float t) {
            vec2 d1 = vec2(cos(t * 0.000051), sin(t * 0.000037)); vec2 d2 = vec2(sin(t * 0.000043), -cos(t * 0.000061)); vec2 d3 = vec2(cos(t * 0.000029 + 1.3), sin(t * 0.000071 + 2.1));
            vec2 q = vec2(fbm(p + d1), fbm(p + vec2(5.2, 1.3) + d2));
            vec2 r = vec2(fbm(p + 4.8 * q + vec2(1.7, 9.2) + d2), fbm(p + 4.8 * q + vec2(8.3, 2.8) + d1));
            vec2 s = vec2(fbm(p * 1.1 + 4.0 * r + vec2(3.1, 5.6) + d3), fbm(p * 1.1 + 4.0 * r + vec2(7.4, 0.9) + d3));
            return fbm(p + 4.5 * s);
        }
        vec3 palette(float t) {
            vec3 c0 = vec3(0.24, 0.11, 0.02); vec3 c1 = vec3(0.45, 0.24, 0.05); vec3 c2 = vec3(0.68, 0.43, 0.12); vec3 c3 = vec3(0.87, 0.65, 0.28); vec3 c4 = vec3(0.96, 0.84, 0.58); vec3 c5 = vec3(1.00, 0.97, 0.87); vec3 c6 = vec3(1.00, 1.00, 0.94);
            t = clamp(t, 0.0, 1.0) * 6.0; float f = fract(t); int i = int(t);
            if (i == 0) return mix(c0, c1, f); if (i == 1) return mix(c1, c2, f); if (i == 2) return mix(c2, c3, f); if (i == 3) return mix(c3, c4, f); if (i == 4) return mix(c4, c5, f); return mix(c5, c6, f);
        }
        void main() {
            vec2 uv = gl_FragCoord.xy / u_res.xy; float aspect = u_res.x / u_res.y; vec2 p = vec2(uv.x * aspect, uv.y);
            float f = warp(p * 2.1, u_time); float field = smoothstep(0.05, 0.95, pow(f, 0.85)); vec3 col = palette(field);
            vec2 vd = uv - 0.5; float vig = clamp(pow(1.0 - dot(vd, vd) * 1.6, 0.55), 0.0, 1.0);
            gl_FragColor = vec4(mix(vec3(0.15, 0.06, 0.01), col, vig), 1.0);
        }
        `;
        const s_vert = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(s_vert, vert); gl.compileShader(s_vert);
        const s_frag = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(s_frag, frag); gl.compileShader(s_frag);
        const prog = gl.createProgram(); gl.attachShader(prog, s_vert); gl.attachShader(prog, s_frag); gl.linkProgram(prog); gl.useProgram(prog);
        const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
        const aPos = gl.getAttribLocation(prog, 'a_pos'); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
        const uRes = gl.getUniformLocation(prog, 'u_res'); const uTime = gl.getUniformLocation(prog, 'u_time');

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio, 2);
            canvas.width = Math.floor(window.innerWidth * dpr);
            canvas.height = Math.floor(window.innerHeight * dpr);
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resize(); window.addEventListener('resize', resize);

        let start = null;
        const render = (ts) => {
            if (!start) start = ts;
            gl.uniform2f(uRes, canvas.width, canvas.height); gl.uniform1f(uTime, ts - start);
            gl.drawArrays(gl.TRIANGLES, 0, 6); requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    };
    return { init };
})();

document.addEventListener('DOMContentLoaded', SwissConstructivist.init);
