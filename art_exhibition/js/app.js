/* =========================================================
   光与孤 · 云端画展 — 前端逻辑
   ========================================================= */
(function () {
    const data = window.EXHIBITION;
    const $  = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    // 页面派发:hero | 1 | 2 | 3 | 4
    const PAGE = document.body.dataset.page || 'hero';
    const isHero = PAGE === 'hero';
    const chapterIdx = isHero ? -1 : (parseInt(PAGE, 10) - 1);  // 0-based,章节页有效

    // 章节页 → html 文件名映射
    const chapterHref = i => `chapter${i + 1}.html`;

    /* ---------- Hero 注入(仅序幕页) ---------- */
    if ($('#brandTitle')) $('#brandTitle').innerHTML = `${data.title} <span>/</span> ${data.subtitleEn}`;
    if (isHero && $('#heroMeta')) {
        $('#heroMeta').textContent = data.meta;
        $('#heroSubtitle').textContent = data.subtitleEn;

        // Hero 背景图(Ken Burns)
        if (data.heroImage) {
            const bg = $('#heroBackdrop');
            const pre = new Image();
            pre.onload = () => {
                bg.style.backgroundImage = `url("${data.heroImage}")`;
                bg.classList.add('loaded');
            };
            pre.src = data.heroImage;
        }

        // 标题逐字拆分 + 阶梯动画
        const titleEl = $('#heroTitle');
        titleEl.innerHTML = '';
        [...data.title].forEach((ch, i) => {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = ch === ' ' ? '\u00A0' : ch;
            span.style.animationDelay = `${0.45 + i * 0.12}s`;
            titleEl.appendChild(span);
        });

        // Facts
        const factsEl = $('#heroFacts');
        data.facts.forEach(f => {
            const d = document.createElement('div');
            d.className = 'hero__fact';
            d.innerHTML = `<div class="hero__fact-label">${f.label}</div><div class="hero__fact-value">${f.value}</div>`;
            factsEl.appendChild(d);
        });
    }

    /* ---------- 策展人语 · 字符级阶梯入场 ---------- */
    function splitToChars(el, text, baseDelay = 0, step = 0.025) {
        el.innerHTML = '';
        [...text].forEach((ch, i) => {
            const s = document.createElement('span');
            s.className = 'char-r';
            s.textContent = ch === ' ' ? '\u00A0' : ch;
            s.style.transitionDelay = `${baseDelay + i * step}s`;
            el.appendChild(s);
        });
    }
    if (isHero && $('#curatorQuote')) {
        splitToChars($('#curatorQuote'), data.curator.quote, 0, 0.018);
        $('#curatorAuthor').textContent = data.curator.author;
        $('#curatorDate').textContent = data.curator.date;
    }

    /* ---------- 终章(仅序幕页) ---------- */
    if (isHero && $('#epilogueLine')) {
        splitToChars($('#epilogueLine'), data.epilogue.line, 0, 0.04);
        $('#epilogueLineEn').textContent = data.epilogue.lineEn;
        if (data.epilogue.line2) {
            splitToChars($('#epilogueLine2'), data.epilogue.line2, 0, 0.04);
            $('#epilogueLine2En').textContent = data.epilogue.line2En || '';
        }
    }

    /* ---------- 导航(跨页跳转 4 章节) ---------- */
    const navLinks = $('#navLinks');
    const indicator = $('#indicator');
    if (navLinks) {
        data.sections.forEach((s, i) => {
            const a = document.createElement('a');
            a.href = chapterHref(i);
            a.textContent = `${s.chapter} · ${s.title}`;
            if (i === chapterIdx) a.classList.add('is-active');
            navLinks.appendChild(a);
        });
    }
    if (indicator) {
        data.sections.forEach((s, i) => {
            const dot = document.createElement('a');
            dot.href = chapterHref(i);
            dot.className = 'indicator__dot';
            dot.dataset.target = s.id;
            if (i === chapterIdx) dot.classList.add('active');
            dot.innerHTML = `<span class="indicator__label">${s.chapter} · ${s.title}</span>`;
            indicator.appendChild(dot);
        });
    }

    /* ---------- 渲染展厅 ---------- */
    const rooms = $('#rooms');
    const allWorks = [];

    // 章节页只渲染当前章
    const sectionsToRender = isHero ? [] : (chapterIdx >= 0 ? [data.sections[chapterIdx]] : data.sections);

    function aspectClass(src) {
        // 根据 URL 中的宽高推断方向(picsum URL 含尺寸),否则走默认
        const m = /\/(\d+)\/(\d+)(?:\?|$)/.exec(src);
        if (!m) return '';
        const w = +m[1], h = +m[2];
        if (Math.abs(w - h) / Math.max(w, h) < 0.05) return 'artwork--square';
        return h > w ? 'artwork--portrait' : '';
    }

    function buildMarquee() {
        const bar = document.createElement('div');
        bar.className = 'marquee';
        const track = document.createElement('div');
        track.className = 'marquee__track';
        const text = (data.marquee || '光 · 影 · CDUT · 2026 · ').repeat(2);
        const parts = text.split(/\s+/).filter(Boolean);
        // 重复两份以支持 translateX(-50%) 无缝循环
        for (let k = 0; k < 2; k++) {
            parts.forEach((p, i) => {
                const span = document.createElement('span');
                span.className = 'marquee__item' + (i % 3 === 0 ? ' marquee__item--solid' : '');
                span.textContent = p;
                track.appendChild(span);
            });
        }
        bar.appendChild(track);
        return bar;
    }

    if (rooms) sectionsToRender.forEach((section, si) => {
        // 章节之间插入滚动 marquee(单页只一章,不会触发)
        if (si > 0) rooms.appendChild(buildMarquee());

        const room = document.createElement('section');
        room.className = 'room';
        room.id = section.id;

        // 展厅入口
        const entry = document.createElement('div');
        entry.className = 'room__entry reveal';
        const bgStyle = section.backdrop ? `style="background-image:url('${section.backdrop}')"` : '';
        entry.innerHTML = `
            <div class="room__entry-bg" ${bgStyle} aria-hidden="true"></div>
            <div class="room__chapter-num" data-parallax="0.25">${section.chapter}</div>
            <div class="room__chapter-label">CHAPTER ${section.chapter}</div>
            <h2 class="room__chapter-title">${section.title}<small>${section.titleEn}</small></h2>
            <p class="room__prelude">&ldquo;${section.prelude}&rdquo;</p>
        `;
        room.appendChild(entry);

        // === 第二章:电影胶卷布局 =================================
        if (section.layout === 'filmstrip') {
            const film = document.createElement('div');
            film.className = 'filmstrip';
            film.dataset.section = section.id;

            // 先把本章作品按顺序进入全局 allWorks(灯箱要用这个全局索引)
            const frameIdx = section.works.map(w => {
                const i = allWorks.length;
                allWorks.push(w);
                return i;
            });

            // 上下齿孔条:用足够多的 span 在宽屏也覆盖满,track 是两份相同帧
            const PERF_COUNT = 60;
            const perfs = Array.from({ length: PERF_COUNT },
                () => '<span class="filmstrip__perf"></span>').join('');

            const buildFrames = () => section.works.map((work, i) => {
                const idx = frameIdx[i];
                return `
                    <figure class="filmframe filmframe--with-card" data-index="${idx}" data-local-index="${i}">
                        <div class="filmframe__img">
                            <img src="${work.src}" alt="${work.title}" loading="lazy" decoding="async">
                        </div>
                        <aside class="filmframe__card">
                            <h4 class="filmframe__card-title">${work.title}</h4>
                            <p class="filmframe__card-desc">${work.desc || ''}</p>
                            <span class="filmframe__card-no">No.${String(i + 1).padStart(2, '0')}</span>
                        </aside>
                    </figure>
                `;
            }).join('');

            film.innerHTML = `
                <div class="filmstrip__reel">
                    <div class="filmstrip__brand filmstrip__brand--top">FILM 035 · KODAK · CDUT 2026 · ►</div>
                    <div class="filmstrip__edge filmstrip__edge--top">${perfs}</div>
                    <div class="filmstrip__track">
                        ${buildFrames()}
                        ${buildFrames()}
                    </div>
                    <div class="filmstrip__edge filmstrip__edge--bottom">${perfs}</div>
                    <div class="filmstrip__brand filmstrip__brand--bottom">◄ · 02 LIGHT &amp; SHADOW · 24FPS · ►</div>
                </div>
                <div class="filmstrip__hint"><span>CLICK · 点击单格放大</span></div>
            `;

            // 局部索引 + 局部 works,使灯箱只播放本章节作品
            film.addEventListener('click', e => {
                const frame = e.target.closest('.filmframe');
                if (!frame) return;
                const localIdx = +frame.dataset.localIndex;
                if (Number.isInteger(localIdx)) openViewer(localIdx, section.works);
            });

            room.appendChild(film);
            rooms.appendChild(room);
            return; // 跳过 3D 长廊渲染
        }

        // === 第三章:拼贴墙 ========================================
        if (section.layout === 'collage') {
            // 4 个错落槽位:左上大 / 右上中 / 左下中 / 右下小
            const SLOTS = [
                { x: '4%',  y: '6%',  rot: -3, size: 'piece--lg' },
                { x: '58%', y: '10%', rot:  4, size: 'piece--md' },
                { x: '14%', y: '52%', rot: -5, size: 'piece--md' },
                { x: '60%', y: '56%', rot:  2, size: 'piece--sm' }
            ];
            const TAPE_COLORS = ['tape--cream', 'tape--blue', 'tape--pink', 'tape--kraft'];

            const localStart = allWorks.length;
            section.works.forEach(w => allWorks.push(w));

            const collage = document.createElement('div');
            collage.className = 'collage-room';
            collage.dataset.section = section.id;

            const piecesHtml = section.works.map((w, i) => {
                const slot     = SLOTS[i] || SLOTS[i % SLOTS.length];
                const variant  = w.style === 'polaroid' ? 'piece--polaroid' : 'piece--bare';
                const tapeCls  = TAPE_COLORS[i % TAPE_COLORS.length];
                const tapesBare = (i % 2 === 0)
                    ? `<span class="piece__tape piece__tape--tl ${tapeCls}"></span><span class="piece__tape piece__tape--br ${tapeCls}"></span>`
                    : `<span class="piece__tape piece__tape--tr ${tapeCls}"></span>`;
                const noStr = String(i + 1).padStart(2, '0');

                if (w.style === 'polaroid') {
                    return `
                        <figure class="piece ${slot.size} ${variant}"
                                style="--rot:${slot.rot}deg; --x:${slot.x}; --y:${slot.y}; --i:${i};"
                                data-index="${localStart + i}" data-local-index="${i}"
                                tabindex="0" role="button" aria-label="${w.title}">
                            <span class="piece__tape piece__tape--tl ${tapeCls}"></span>
                            <div class="piece__photo">
                                <img src="${w.src}" alt="${w.title}" loading="lazy" decoding="async">
                            </div>
                            <figcaption class="piece__cap piece__cap--polaroid">
                                <span class="piece__handwrite">${w.title}</span>
                                <span class="piece__stamp">No.${noStr}</span>
                            </figcaption>
                            <aside class="piece__note" aria-hidden="true">
                                <span class="piece__note-distance">${w.distance || ''}</span>
                                <h5 class="piece__note-title">${w.title}</h5>
                                <p class="piece__note-desc">${w.desc || ''}</p>
                            </aside>
                        </figure>
                    `;
                }

                return `
                    <figure class="piece ${slot.size} ${variant}"
                            style="--rot:${slot.rot}deg; --x:${slot.x}; --y:${slot.y}; --i:${i};"
                            data-index="${localStart + i}" data-local-index="${i}"
                            tabindex="0" role="button" aria-label="${w.title}">
                        ${tapesBare}
                        <span class="piece__curl" aria-hidden="true"></span>
                        <div class="piece__photo">
                            <img src="${w.src}" alt="${w.title}" loading="lazy" decoding="async">
                        </div>
                        <figcaption class="piece__cap">
                            <span class="piece__title">${w.title}</span>
                            <span class="piece__hint">${w.distance || ''}</span>
                        </figcaption>
                        <aside class="piece__note" aria-hidden="true">
                            <span class="piece__note-distance">${w.distance || ''}</span>
                            <h5 class="piece__note-title">${w.title}</h5>
                            <p class="piece__note-desc">${w.desc || ''}</p>
                        </aside>
                    </figure>
                `;
            }).join('');

            collage.innerHTML = `
                <div class="collage-room__wall" aria-hidden="true"></div>
                <div class="collage-room__poster collage-room__poster--a" aria-hidden="true"></div>
                <div class="collage-room__poster collage-room__poster--b" aria-hidden="true"></div>
                <div class="collage-room__sun" aria-hidden="true"></div>
                <div class="collage-room__pieces">${piecesHtml}</div>
                <p class="collage-room__hint">HOVER · 拿起来看 · CLICK · 放大</p>
            `;

            // 点击/键盘:打开图片播放器,只播本章 3 张
            const handleOpen = el => {
                const localIdx = +el.dataset.localIndex;
                if (Number.isInteger(localIdx)) openViewer(localIdx, section.works);
            };
            collage.addEventListener('click', e => {
                const card = e.target.closest('.piece');
                if (card) handleOpen(card);
            });
            collage.addEventListener('keydown', e => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const card = e.target.closest('.piece');
                if (card) { e.preventDefault(); handleOpen(card); }
            });

            // 入场:依次落下
            const collageIO = new IntersectionObserver(entries => {
                entries.forEach(en => {
                    if (en.isIntersecting) {
                        en.target.classList.add('is-in');
                        collageIO.unobserve(en.target);
                    }
                });
            }, { threshold: 0.2 });
            collage.querySelectorAll('.piece').forEach(el => collageIO.observe(el));

            room.appendChild(collage);
            rooms.appendChild(room);
            return;
        }

        // === 第四章:黑胶唱片 ======================================
        if (section.layout === 'vinyl') {
            const TRACKS = section.works;
            const PERIOD = 3000; // ms

            const SEASON_LABEL = {
                spring: '春 · SPRING',
                summer: '夏 · SUMMER',
                autumn: '秋 · AUTUMN',
                winter: '冬 · WINTER',
                dusk:   '黄昏 · DUSK'
            };

            // 把本章作品送入全局 allWorks
            section.works.forEach(w => allWorks.push(w));

            // 预加载 4 张图,避免切歌时空闪
            TRACKS.forEach(w => { const i = new Image(); i.src = w.src; });

            const vinylRoom = document.createElement('div');
            vinylRoom.className = 'vinyl-room';
            vinylRoom.dataset.section = section.id;

            const tracksHtml = TRACKS.map((w, i) => `
                <li class="track${i === 0 ? ' is-current' : ''}" data-local-index="${i}" tabindex="0" role="button" aria-label="${w.title}">
                    <span class="track__num">${String(i + 1).padStart(2, '0')}</span>
                    <span class="track__main">
                        <span class="track__title">${w.title}</span>
                        <span class="track__season">${[SEASON_LABEL[w.season], w.date || w.year].filter(Boolean).join(' · ')}</span>
                        <span class="track__desc">${w.desc || ''}</span>
                    </span>
                    <span class="track__bar"><i></i></span>
                </li>
            `).join('');

            vinylRoom.innerHTML = `
                <div class="vinyl-room__bg" aria-hidden="true"></div>
                <div class="vinyl-stage">
                    <div class="vinyl" id="vinyl-${section.id}">
                        <div class="vinyl__disc">
                            <div class="vinyl__grooves" aria-hidden="true"></div>
                            <div class="vinyl__shine"   aria-hidden="true"></div>
                            <div class="vinyl__label">
                                <img class="vinyl__art" src="${TRACKS[0].src}" alt="${TRACKS[0].title}">
                                <span class="vinyl__hole" aria-hidden="true"></span>
                            </div>
                        </div>
                    </div>
                    <div class="tonearm" aria-hidden="true">
                        <div class="tonearm__base"></div>
                        <div class="tonearm__pivot">
                            <div class="tonearm__arm"></div>
                            <div class="tonearm__head"></div>
                        </div>
                    </div>
                    <ol class="tracklist">${tracksHtml}</ol>
                </div>
                <p class="vinyl-room__hint">3s 自动切歌 · 点击曲目跳选 · 点击唱片放大</p>
            `;

            room.appendChild(vinylRoom);
            rooms.appendChild(room);

            // === 控制逻辑 ===
            const vinylEl   = vinylRoom.querySelector('.vinyl');
            const discEl    = vinylRoom.querySelector('.vinyl__disc');
            const artEl     = vinylRoom.querySelector('.vinyl__art');
            const labelEl   = vinylRoom.querySelector('.vinyl__label');
            const tonearmEl = vinylRoom.querySelector('.tonearm');
            const listEl    = vinylRoom.querySelector('.tracklist');
            let cur = 0;
            let timer = null;
            let visible = false;

            function updateTrack() {
                listEl.querySelectorAll('.track').forEach((el, i) => {
                    el.classList.toggle('is-current', i === cur);
                    // 重置进度条:先去掉 running,reflow 后再加上,触发 3s 动画
                    const bar = el.querySelector('.track__bar i');
                    bar.style.animation = 'none';
                    if (i === cur) {
                        // 强制 reflow
                        // eslint-disable-next-line no-unused-expressions
                        bar.offsetHeight;
                        bar.style.animation = `trackProgress ${PERIOD}ms linear forwards`;
                    }
                });
            }

            function go(next, fromUser) {
                next = ((next % TRACKS.length) + TRACKS.length) % TRACKS.length;
                if (next === cur && !fromUser) return;
                cur = next;

                // 唱针寻道动画(600ms)
                tonearmEl.classList.add('is-seeking');
                setTimeout(() => tonearmEl.classList.remove('is-seeking'), 600);

                // 中心标签淡出 → 换图 → 淡入
                labelEl.classList.add('is-fading');
                setTimeout(() => {
                    artEl.src = TRACKS[cur].src;
                    artEl.alt = TRACKS[cur].title;
                    labelEl.classList.remove('is-fading');
                }, 230);

                updateTrack();
                restart();   // 不论手动还是自动,都安排下一次切歌,保证无限循环
            }

            function restart() {
                clearTimeout(timer);
                if (!visible) return;
                timer = setTimeout(() => go(cur + 1, false), PERIOD);
            }

            // 进度条结束回调:用动画结束事件触发下一首,确保节奏与进度条对齐
            // (备用机制:setTimeout 已经控制了)

            // 进入视口:旋转 + 启动定时器
            const stageIO = new IntersectionObserver(([e]) => {
                visible = e.isIntersecting;
                vinylEl.classList.toggle('is-spinning', visible);
                tonearmEl.classList.toggle('is-playing', visible);
                if (visible) {
                    updateTrack();
                    restart();
                } else {
                    clearTimeout(timer);
                    // 暂停进度条
                    const bar = listEl.querySelector('.track.is-current .track__bar i');
                    if (bar) bar.style.animationPlayState = 'paused';
                }
            }, { threshold: 0.35 });
            stageIO.observe(vinylRoom);

            // 点击清单跳歌
            listEl.addEventListener('click', e => {
                const t = e.target.closest('.track');
                if (t) go(+t.dataset.localIndex, true);
            });
            listEl.addEventListener('keydown', e => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const t = e.target.closest('.track');
                if (t) { e.preventDefault(); go(+t.dataset.localIndex, true); }
            });

            // 点击唱片中央 → 打开播放器,只在 4 张内循环
            discEl.addEventListener('click', () => openViewer(cur, TRACKS));

            return;
        }

        // 3D 长廊舞台
        const stage = document.createElement('div');
        stage.className = 'stage';

        const scene = document.createElement('div');
        scene.className = 'scene';

        // 拆分:墙面作品 vs 尽头作品
        const wallWorks = section.works.filter(w => w.placement !== 'end');
        const endWorks  = section.works.filter(w => w.placement === 'end');
        const END_Z = -1900;  // 尽头墙位置(比最深墙画再深一档)

        // 静态环境元素:地面/天花/灯带/两侧画墙(+ 尽头墙)
        const backWallHtml = endWorks.length
            ? `<div class="scene__wall scene__wall--back" aria-hidden="true"></div>`
            : '';
        scene.insertAdjacentHTML('beforeend', `
            <div class="scene__floor"   aria-hidden="true"></div>
            <div class="scene__ceiling" aria-hidden="true"></div>
            <div class="scene__lights"  aria-hidden="true"></div>
            <div class="scene__wall scene__wall--left"  aria-hidden="true"></div>
            <div class="scene__wall scene__wall--right" aria-hidden="true"></div>
            ${backWallHtml}
        `);

        // 作品分配:左右墙交替;≤3 幅用显式三档深度(远/中/近),>3 幅用动态间距
        const N = wallWorks.length;
        const STATIC_3 = [
            { side: -1, z: -1500 },  // 远 · 左墙
            { side:  1, z:  -900 },  // 中 · 右墙
            { side: -1, z:  -300 }   // 近 · 左墙
        ];
        const Z_STEP = 500;
        const sideCount = { '-1': 0, '1': 0 };

        // 渲染单幅作品(可指定为尽头)
        function renderArt(work, localIdx, opts = {}) {
            const idx = allWorks.length;
            allWorks.push(work);

            const art = document.createElement('figure');
            art.className = 'artwork' + (opts.end ? ' artwork--end' : '');
            art.dataset.index = idx;
            art.dataset.localIndex = localIdx;
            if (work.featured) art.dataset.featured = 'true';
            if (opts.end) {
                art.style.setProperty('--z', (END_Z + 10) + 'px');  // 略前于墙面,避免 z-fight
            } else {
                art.style.setProperty('--side', opts.side);
                art.style.setProperty('--z', opts.z + 'px');
            }
            art.innerHTML = `
                <div class="artwork__spot" aria-hidden="true"></div>
                <div class="artwork__frame artwork__frame--with-card">
                    <div class="artwork__canvas">
                        <img src="${work.src}" alt="${work.title}" loading="lazy" decoding="async">
                    </div>
                    <aside class="artwork__card">
                        <h4 class="artwork__card-title">${work.title}</h4>
                        <p class="artwork__card-desc">${work.desc || ''}</p>
                        <span class="artwork__card-no">No.${String(idx + 1).padStart(2, '0')}</span>
                    </aside>
                </div>
            `;
            scene.appendChild(art);
        }

        // 墙面 3 幅(注意 localIndex 仍按整组 section.works 中的原始顺序对应)
        wallWorks.forEach((work, i) => {
            const localIdx = section.works.indexOf(work);
            let side, z;
            if (N <= 3) {
                const pos = STATIC_3[i] || STATIC_3[STATIC_3.length - 1];
                side = pos.side; z = pos.z;
            } else {
                side = (i % 2 === 0) ? -1 : 1;
                const slot = sideCount[side]++;
                z = -400 - slot * Z_STEP - (side === 1 ? Z_STEP / 2 : 0);
            }
            renderArt(work, localIdx, { side, z });
        });
        // 尽头(走廊深处那一幅)
        endWorks.forEach(work => {
            const localIdx = section.works.indexOf(work);
            renderArt(work, localIdx, { end: true });
        });

        const hint = document.createElement('div');
        hint.className = 'corridor__hint';
        hint.innerHTML = `<span>WALK · 镜头自动前行</span>`;

        const fade = document.createElement('div');
        fade.className = 'stage__fade';

        stage.appendChild(scene);
        stage.appendChild(fade);
        stage.appendChild(hint);

        // 手动判中:浏览器对 90° 旋转的 3D 元素 hit-test 不稳,自己用 AABB 判断
        stage.addEventListener('click', e => {
            const arts = stage.querySelectorAll('.artwork');
            let hit = null;
            for (const a of arts) {
                const r = a.getBoundingClientRect();
                if (r.width < 4 || r.height < 4) continue; // 过滤掉退化矩形
                if (e.clientX >= r.left && e.clientX <= r.right &&
                    e.clientY >= r.top  && e.clientY <= r.bottom) {
                    hit = a; break;
                }
            }
            if (!hit) return;
            const localIdx = +hit.dataset.localIndex;
            if (Number.isInteger(localIdx)) openViewer(localIdx, section.works);
        });

        room.appendChild(stage);
        rooms.appendChild(room);
    });

    /* ---------- 进度条 & 滚动导航 ---------- */
    const nav = $('#nav');
    const progress = $('#progress');
    const dots = $$('.indicator__dot');
    const sections = sectionsToRender.map(s => document.getElementById(s.id));

    function onScroll() {
        const scrolled = window.scrollY;
        const h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = `${Math.min(100, (scrolled / h) * 100)}%`;
        nav.classList.toggle('scrolled', scrolled > 60);

        // indicator active
        const mid = scrolled + window.innerHeight * 0.4;
        let activeId = null;
        sections.forEach(sec => {
            if (!sec) return;
            const top = sec.offsetTop;
            if (top <= mid) activeId = sec.id;
        });
        if (isHero) {
            dots.forEach(d => d.classList.toggle('active', d.dataset.target === activeId));
        }

        // parallax chapter nums
        $$('.room__chapter-num').forEach(el => {
            const rect = el.getBoundingClientRect();
            const offset = (rect.top - window.innerHeight / 2) * -0.15;
            el.style.transform = `translateY(${offset}px)`;
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Hero 鼠标射灯(仅序幕页) ---------- */
    const hero = $('#hero');
    const spot = $('#heroSpot');
    if (hero && spot) {
        hero.addEventListener('mousemove', e => {
            const r = hero.getBoundingClientRect();
            spot.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
            spot.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
        });
    }

    /* ---------- Reveal 观察(画作按入场顺序错峰) ---------- */
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in-view');
                io.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });
    $$('.reveal').forEach(el => io.observe(el));

    /* ---------- 长廊循环漫游:走 → 黑场 → 重置 → 点亮 → 再走 ---------- */
    const SCENES = []; // { el, fadeEl, walkEnd, cam, phase, t, visible }
    const SPEED      = 0.137;  // px / ms,3 幅画走完±15s 一周(walk 12.8s + fade 2.2s)
    const FADE_OUT   = 1000;   // ms
    const FADE_IN    = 1200;   // ms

    const PHASE_WALK     = 0;
    const PHASE_FADE_OUT = 1;
    const PHASE_FADE_IN  = 2;

    $$('.scene').forEach(sceneEl => {
        const fadeEl = sceneEl.parentElement.querySelector('.stage__fade');
        // 自适应 walkEnd:确保最深的画作也能被推到镜头前再 + 250px 缓冲
        const arts = sceneEl.querySelectorAll('.artwork');
        let deepest = -800;
        arts.forEach(a => {
            const z = parseFloat(a.style.getPropertyValue('--z')) || -800;
            if (z < deepest) deepest = z;
        });
        const walkEnd = -deepest + 250;
        SCENES.push({
            el: sceneEl,
            fadeEl,
            walkEnd,
            cam: 0,
            phase: PHASE_WALK,
            t: 0,
            visible: false
        });
    });

    // 视口可见性 → 控制是否推进(节能)。用 rootMargin 提前 200px 激活,任何一丝可见就保持运行
    const visIO = new IntersectionObserver(entries => {
        entries.forEach(e => {
            const s = SCENES.find(x => x.el === e.target);
            if (s) s.visible = e.isIntersecting;
        });
    }, { threshold: 0, rootMargin: '200px 0px' });
    SCENES.forEach(s => visIO.observe(s.el));

    // 全局暂停(灯箱打开时)
    let roamPaused = false;

    let lastT = performance.now();
    function roamTick(now) {
        const dt = Math.min(now - lastT, 64);
        lastT = now;

        if (!roamPaused) {
            for (const s of SCENES) {
                if (!s.visible) continue;

                if (s.phase === PHASE_WALK) {
                    s.cam += dt * SPEED;
                    if (s.cam >= s.walkEnd) {
                        s.cam = s.walkEnd;
                        s.phase = PHASE_FADE_OUT;
                        s.t = 0;
                    }
                } else if (s.phase === PHASE_FADE_OUT) {
                    s.t += dt;
                    if (s.t >= FADE_OUT) {
                        // 画面已全黑,瞬间重置
                        s.cam = 0;
                        s.phase = PHASE_FADE_IN;
                        s.t = 0;
                    }
                } else if (s.phase === PHASE_FADE_IN) {
                    s.t += dt;
                    if (s.t >= FADE_IN) {
                        s.phase = PHASE_WALK;
                        s.t = 0;
                    }
                }

                // 应用变换 & 黑幕透明度
                s.el.style.transform = `translateZ(${s.cam}px)`;
                let opacity = 0;
                if (s.phase === PHASE_FADE_OUT) opacity = Math.min(1, s.t / FADE_OUT);
                else if (s.phase === PHASE_FADE_IN) opacity = 1 - Math.min(1, s.t / FADE_IN);
                s.fadeEl.style.opacity = opacity;
            }
        }
        requestAnimationFrame(roamTick);
    }
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        requestAnimationFrame(roamTick);
    }

    // 灯箱开/关时暂停或恢复漫游
    window.__pauseRoam  = () => { roamPaused = true;  };
    window.__resumeRoam = () => { roamPaused = false; lastT = performance.now(); };

    /* ---------- 推门而入:幕布过渡 → 跳第一章 ---------- */
    const curtain = $('#curtain');
    const enterBtn = $('#enterBtn');
    if (curtain && enterBtn) {
        enterBtn.addEventListener('click', () => {
            curtain.classList.add('active');
            curtain.classList.remove('opening');
            curtain.classList.add('closing');
            setTimeout(() => {
                location.href = 'chapter1.html';
            }, 1200);
        });
        curtain.classList.add('opening');
    }

    /* ---------- 回到序幕(终章按钮) ---------- */
    const backTopBtn = $('#backTop');
    if (backTopBtn) {
        backTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ---------- 灯箱(图片播放器) ---------- */
    const viewer       = $('#viewer');
    const viewerImg    = $('#viewerImg');
    const viewerT      = $('#viewerTitle');
    const viewerD      = $('#viewerDesc');
    const viewerM      = $('#viewerMeta');
    const viewerN      = $('#viewerNo');
    const viewerIdx    = $('#viewerIndex');
    const viewerCount  = $('#viewerCounter');
    const viewerThumbs = $('#viewerThumbs');
    let current = -1;
    let currentWorks = allWorks;          // 当前灯箱播放的作品集合(可被局部章节覆盖)
    let lastWorksRendered = null;          // 缩略图缓存:作品集合发生变化时重渲染

    function renderThumbs() {
        if (lastWorksRendered === currentWorks) return;
        viewerThumbs.innerHTML = currentWorks.map((w, i) => `
            <div class="viewer__thumb" data-index="${i}" role="button" aria-label="第 ${i + 1} 张:${w.title}">
                <img src="${w.src}" alt="${w.title}" loading="lazy">
                <span class="viewer__thumb__no">${String(i + 1).padStart(2, '0')}</span>
            </div>
        `).join('');
        lastWorksRendered = currentWorks;
    }
    // 缩略图点击委托(只绑一次)
    viewerThumbs.addEventListener('click', e => {
        const t = e.target.closest('.viewer__thumb');
        if (!t) return;
        const idx = +t.dataset.index;
        if (Number.isInteger(idx) && idx !== current) {
            current = idx;
            updateViewer();
        }
    });

    function openViewer(index, works) {
        currentWorks = works || allWorks;
        renderThumbs();
        current = index;
        updateViewer();
        viewer.classList.add('open');
        document.body.classList.add('locked');
        // 灯箱里隐藏自定义锤子光标 + 恢复原生指针,避免 mix-blend-mode + backdrop-filter 吞 click
        document.body.classList.remove('no-cursor');
        const _cur = document.getElementById('cursor');
        if (_cur) _cur.classList.add('hidden');
        if (window.__pauseRoam) window.__pauseRoam();
    }
    function closeViewer() {
        viewer.classList.remove('open');
        document.body.classList.remove('locked');
        const _cur = document.getElementById('cursor');
        if (_cur) _cur.classList.remove('hidden');
        if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
            document.body.classList.add('no-cursor');
        }
        if (window.__resumeRoam) window.__resumeRoam();
    }
    function updateViewer() {
        const w = currentWorks[current];
        const total = currentWorks.length;
        viewerImg.classList.add('swapping');
        viewerCount.textContent = `${String(current + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
        // 缩略图高亮 + 滚到可见
        viewerThumbs.querySelectorAll('.viewer__thumb').forEach((el, i) => {
            const active = i === current;
            el.classList.toggle('is-current', active);
            if (active) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
        setTimeout(() => {
            viewerImg.src = w.src;
            viewerImg.alt = w.title;
            viewerN.textContent = `No.${String(current + 1).padStart(2, '0')}`;
            viewerT.textContent = w.title;
            viewerM.textContent = [w.medium, w.year].filter(Boolean).join(' · ');
            viewerD.textContent = w.desc || '';
            viewerIdx.textContent = `${String(current + 1).padStart(2, '0')} — ${String(total).padStart(2, '0')}`;
            viewerImg.classList.remove('swapping');
        }, 180);
    }
    function step(delta) {
        current = (current + delta + currentWorks.length) % currentWorks.length;
        updateViewer();
    }

    const _closeBtn = $('#viewerClose');
    _closeBtn.addEventListener('click', closeViewer);
    _closeBtn.addEventListener('pointerdown', e => { e.stopPropagation(); closeViewer(); });
    $('#viewerPrev').addEventListener('click', e => { e.stopPropagation(); step(-1); });
    $('#viewerNext').addEventListener('click', e => { e.stopPropagation(); step(1); });
    viewer.addEventListener('click', e => { if (e.target === viewer) closeViewer(); });

    document.addEventListener('keydown', e => {
        if (!viewer.classList.contains('open')) return;
        if (e.key === 'Escape')     closeViewer();
        if (e.key === 'ArrowLeft')  step(-1);
        if (e.key === 'ArrowRight') step(1);
    });

    /* ---------- 自定义光标(平滑跟随) ---------- */
    const isFinePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (isFinePointer) {
        document.body.classList.add('no-cursor');
        const cur = $('#cursor');
        let tx = innerWidth / 2, ty = innerHeight / 2;
        let cx = tx, cy = ty;

        window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
        window.addEventListener('mousedown', () => {
            cur.classList.remove('is-down');
            // 触发 reflow 以便重放动画
            void cur.offsetWidth;
            cur.classList.add('is-down');
        });
        cur.addEventListener('animationend', () => cur.classList.remove('is-down'));
        document.addEventListener('mouseleave', () => { cur.style.opacity = 0; });
        document.addEventListener('mouseenter', () => { cur.style.opacity = 1; });

        const hoverSel = 'a, button, .artwork, .indicator__dot, .hero__cta, .epilogue__tools a, .epilogue__tools button';
        document.addEventListener('mouseover', e => {
            if (e.target.closest(hoverSel)) cur.classList.add('is-hover');
        });
        document.addEventListener('mouseout', e => {
            if (e.target.closest(hoverSel)) cur.classList.remove('is-hover');
        });

        (function tick() {
            cx += (tx - cx) * 0.2;
            cy += (ty - cy) * 0.2;
            cur.style.setProperty('--x', cx + 'px');
            cur.style.setProperty('--y', cy + 'px');
            requestAnimationFrame(tick);
        })();
    }

    /* ---------- 3D 倾斜(画作:仅对非 3D 场景内的作品启用) ---------- */
    if (isFinePointer) {
        $$('.artwork').forEach(art => {
            if (art.closest('.scene')) return;
            const frame = art.querySelector('.artwork__frame');
            art.addEventListener('mousemove', e => {
                const r = frame.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top)  / r.height - 0.5;
                const max = 7; // 最大倾角
                art.style.setProperty('--ry', `${px * max}deg`);
                art.style.setProperty('--rx', `${-py * max}deg`);
                art.classList.add('artwork--tilt');
            });
            art.addEventListener('mouseleave', () => {
                art.classList.remove('artwork--tilt');
                art.style.removeProperty('--rx');
                art.style.removeProperty('--ry');
            });
        });
    }

    /* ---------- CTA 磁吸 ---------- */
    if (isFinePointer && $('#enterBtn')) {
        const cta = $('#enterBtn');
        cta.addEventListener('mousemove', e => {
            const r = cta.getBoundingClientRect();
            const mx = e.clientX - r.left - r.width / 2;
            const my = e.clientY - r.top - r.height / 2;
            cta.style.transform = `translate(${mx * 0.25}px, ${my * 0.35}px)`;
        });
        cta.addEventListener('mouseleave', () => { cta.style.transform = ''; });
    }

    /* ---------- 背景音乐:跨页持续播放(静音自动播放 + 按钮取消静音) ---------- */
    const bgm    = document.getElementById('bgm');
    const bgmBtn = document.getElementById('bgmToggle');
    if (bgm && bgmBtn) {
        const TARGET_VOL = 0.25;
        const FADE_MS    = 800;
        const KEY_TIME   = 'bgm.time';
        const KEY_AUDIBLE = 'bgm.audible';   // '1' = 出声,'0' = 静音

        // —— 跨页恢复进度 ——
        const savedTime = parseFloat(sessionStorage.getItem(KEY_TIME) || '0');
        if (Number.isFinite(savedTime) && savedTime > 0) {
            const seek = () => { try { bgm.currentTime = savedTime; } catch (_) {} };
            if (bgm.readyState >= 1) seek();
            else bgm.addEventListener('loadedmetadata', seek, { once: true });
        }
        // 默认出声(首次访问)
        const audible = sessionStorage.getItem(KEY_AUDIBLE) !== '0';

        function fadeVolume(target, ms) {
            const start = bgm.volume;
            const t0 = performance.now();
            (function step(now) {
                const k = Math.min(1, (now - t0) / ms);
                bgm.volume = start + (target - start) * k;
                if (k < 1) requestAnimationFrame(step);
            })(t0);
        }
        function markAudible() { bgmBtn.classList.remove('bgm-toggle--pending', 'bgm-toggle--muted'); }
        function markMuted()   { bgmBtn.classList.add('bgm-toggle--muted'); bgmBtn.classList.remove('bgm-toggle--pending'); }

        // 兜底:某些浏览器可能没立即起 autoplay,补一次 play()
        const ensurePlaying = () => {
            if (bgm.paused) bgm.play().catch(() => {});
        };
        ensurePlaying();
        bgm.addEventListener('canplay', ensurePlaying, { once: true });

        // 取消静音并淡入(返回是否成功)
        function unmute() {
            bgm.muted  = false;
            bgm.volume = 0;
            const p = bgm.play();
            if (p && p.then) {
                p.then(() => {
                    fadeVolume(TARGET_VOL, FADE_MS);
                    markAudible();
                }).catch(() => {});
            } else {
                fadeVolume(TARGET_VOL, FADE_MS);
                markAudible();
            }
        }

        // 浏览器若拦截了"自动取消静音",挂一次性监听:首次任意交互即出声
        // 严格条件:audible='1'(用户希望出声)。用户按按钮静音后永不挂。
        let wakeArmed = false;
        function armWake() {
            if (wakeArmed) return;
            wakeArmed = true;
            const wake = () => {
                if (sessionStorage.getItem(KEY_AUDIBLE) !== '0') unmute();
                window.removeEventListener('pointerdown', wake, true);
                window.removeEventListener('keydown',     wake, true);
                window.removeEventListener('touchstart',  wake, true);
                wakeArmed = false;
            };
            window.addEventListener('pointerdown', wake, { capture: true, passive: true });
            window.addEventListener('keydown',     wake, { capture: true });
            window.addEventListener('touchstart',  wake, { capture: true, passive: true });
        }

        // 应用初始状态
        if (audible) {
            unmute();
            // 给浏览器一点时间;若 250ms 后还在静音/无声,说明被拦截 → 挂兜底
            setTimeout(() => {
                if (bgm.muted || bgm.paused || bgm.volume < 0.01) armWake();
            }, 250);
        } else {
            bgm.muted = true;
            markMuted();
        }

        // —— 悬停按钮切回原生指针 ——
        bgmBtn.addEventListener('mouseenter', () => {
            document.body.classList.add('native-cursor');
            const c = document.getElementById('cursor');
            if (c) c.classList.add('hidden');
        });
        bgmBtn.addEventListener('mouseleave', () => {
            document.body.classList.remove('native-cursor');
            if (!document.body.classList.contains('locked')) {
                const c = document.getElementById('cursor');
                if (c) c.classList.remove('hidden');
            }
        });

        // —— 唯一控制点:按钮切换静音 ——
        bgmBtn.addEventListener('click', e => {
            e.stopPropagation();
            ensurePlaying();
            if (bgm.muted || bgm.volume < 0.01) {
                bgm.muted = false;
                fadeVolume(TARGET_VOL, FADE_MS);
                markAudible();
                sessionStorage.setItem(KEY_AUDIBLE, '1');
            } else {
                fadeVolume(0, 300);
                setTimeout(() => { bgm.muted = true; }, 320);
                markMuted();
                sessionStorage.setItem(KEY_AUDIBLE, '0');
            }
        });

        // —— 周期性保存进度,跨页无缝衔接 ——
        const saveTime = () => {
            if (Number.isFinite(bgm.currentTime) && bgm.currentTime > 0) {
                sessionStorage.setItem(KEY_TIME, String(bgm.currentTime));
            }
        };
        window.addEventListener('pagehide', saveTime);
        window.addEventListener('beforeunload', saveTime);
        setInterval(saveTime, 1000);
    }
})();
