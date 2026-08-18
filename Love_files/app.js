(function () {
    "use strict";

    var STAGE_W = 1100;
    var STAGE_H = 680;
    var TOGETHER = new Date(2015, 9, 9, 20, 20, 0);

    var wrap = document.getElementById("wrap");
    var stageSizer = document.getElementById("stage-sizer");
    var canvas = document.getElementById("canvas");
    var textBox = document.getElementById("text");
    var codeEl = document.getElementById("code");
    var clockBox = document.getElementById("clock-box");
    var clockEl = document.getElementById("clock");
    var dock = document.getElementById("dock");
    var hint = document.getElementById("hint");
    var musicBtn = document.getElementById("music-btn");
    var bgm = document.getElementById("bgm");
    var errorEl = document.getElementById("error");

    function sleep(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function pad(n) {
        return String(n).padStart(2, "0");
    }

    function isCompact() {
        return window.innerWidth < 768 || (window.innerWidth < 1100 && window.innerHeight < 560);
    }

    function fitStage() {
        var compact = isCompact();
        document.body.classList.toggle("is-compact", compact);

        if (compact) {
            if (textBox.parentElement !== dock) {
                dock.appendChild(textBox);
                dock.appendChild(clockBox);
            }
        } else if (textBox.parentElement !== wrap) {
            wrap.appendChild(textBox);
            wrap.appendChild(clockBox);
        }

        var margin = compact ? 28 : 32;
        var availW = Math.max(240, window.innerWidth - margin);
        var availH = Math.max(220, window.innerHeight - (compact ? 120 : 32));
        var scale = compact
            ? availW / STAGE_W
            : Math.min(availW / STAGE_W, availH / STAGE_H);
        scale = Math.max(0.22, Math.min(scale, 1));

        stageSizer.style.width = Math.round(STAGE_W * scale) + "px";
        stageSizer.style.height = Math.round(STAGE_H * scale) + "px";
        wrap.style.transform = "scale(" + scale + ")";
    }

    function canvasPoint(event) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (canvas.width / rect.width),
            y: (event.clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    function typewriter(el, interval) {
        return new Promise(function (resolve) {
            var html = el.innerHTML;
            el.classList.add("is-on");
            el.innerHTML =
                '<div class="code-ghost" aria-hidden="true">' + html + "</div>" +
                '<div class="code-live"></div>';

            var live = el.querySelector(".code-live");
            var sourceLines = el.querySelectorAll(".code-ghost .say");
            var lines = [];
            var i;
            for (i = 0; i < sourceLines.length; i += 1) {
                var line = document.createElement("span");
                line.className = sourceLines[i].className;
                live.appendChild(line);
                lines.push({
                    el: line,
                    text: sourceLines[i].textContent || ""
                });
            }

            var lineIndex = 0;
            var charIndex = 0;
            var caret = document.createElement("span");
            caret.className = "typed-caret";
            caret.setAttribute("aria-hidden", "true");

            function placeCaret(target) {
                if (caret.parentNode) {
                    caret.parentNode.removeChild(caret);
                }
                target.appendChild(caret);
            }

            if (lines[0]) {
                placeCaret(lines[0].el);
            }

            var timer = setInterval(function () {
                if (lineIndex >= lines.length) {
                    clearInterval(timer);
                    if (caret.parentNode) {
                        caret.parentNode.removeChild(caret);
                    }
                    resolve();
                    return;
                }

                var current = lines[lineIndex];
                charIndex += 1;
                current.el.textContent = current.text.slice(0, charIndex);
                placeCaret(current.el);

                if (charIndex >= current.text.length) {
                    lineIndex += 1;
                    charIndex = 0;
                }
            }, interval || 72);
        });
    }

    function timeElapse(date) {
        var seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
        var days = Math.floor(seconds / 86400);
        seconds %= 86400;
        var hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        var minutes = Math.floor(seconds / 60);
        seconds %= 60;
        clockEl.innerHTML =
            "<div class=\"clock-days\">第 <span class=\"digit\">" + days + "</span> 天</div>" +
            "<div class=\"clock-hms\">" +
            "<span class=\"digit\">" + pad(hours) + "</span> 小时 " +
            "<span class=\"digit\">" + pad(minutes) + "</span> 分钟 " +
            "<span class=\"digit\">" + pad(seconds) + "</span> 秒</div>";
    }

    function updateMusicUi() {
        var playing = !bgm.paused;
        musicBtn.setAttribute("aria-pressed", playing ? "true" : "false");
        musicBtn.setAttribute("aria-label", playing ? "暂停音乐" : "播放音乐");
    }

    function tryPlayMusic() {
        var play = bgm.play();
        if (play && typeof play.catch === "function") {
            play.catch(function () {});
        }
        updateMusicUi();
    }

    function startSky() {
        var sky = document.getElementById("sky");
        var ctx = sky.getContext("2d");
        if (!ctx) {
            return;
        }

        var particles = [];
        var width = 0;
        var height = 0;

        function dpr() {
            return Math.min(window.devicePixelRatio || 1, 2);
        }

        function spawn(count) {
            particles = [];
            for (var i = 0; i < count; i += 1) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: 5 + Math.random() * 9,
                    s: 0.25 + Math.random() * 0.7,
                    a: 0.16 + Math.random() * 0.45,
                    rot: Math.random() * Math.PI,
                    rv: (Math.random() - 0.5) * 0.02,
                    kind: Math.random() > 0.42 ? "heart" : "star"
                });
            }
        }

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            var ratio = dpr();
            sky.width = Math.floor(width * ratio);
            sky.height = Math.floor(height * ratio);
            sky.style.width = width + "px";
            sky.style.height = height + "px";
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            spawn(width < 640 ? 28 : 52);
        }

        function drawHeart(p) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = p.a;
            ctx.fillStyle = "rgba(232, 120, 140, 0.28)";
            ctx.beginPath();
            var scale = p.r / 18;
            for (var t = 0; t < Math.PI * 2; t += 0.18) {
                var x = 16 * Math.pow(Math.sin(t), 3) * scale;
                var y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
                if (t === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        function tick() {
            ctx.clearRect(0, 0, width, height);
            for (var i = 0; i < particles.length; i += 1) {
                var p = particles[i];
                p.y += p.s;
                p.x += Math.sin(p.y / 46) * 0.35;
                p.rot += p.rv;
                if (p.y > height + 24) {
                    p.y = -24;
                    p.x = Math.random() * width;
                }
                if (p.kind === "heart") {
                    drawHeart(p);
                } else {
                    ctx.globalAlpha = p.a;
                    ctx.fillStyle = "rgba(232, 160, 170, 0.35)";
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, Math.max(0.8, p.r * 0.12), 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.globalAlpha = 1;
            requestAnimationFrame(tick);
        }

        resize();
        window.addEventListener("resize", resize);
        requestAnimationFrame(tick);
    }

    function startTree() {
        if (!canvas.getContext) {
            errorEl.style.display = "block";
            canvas.style.display = "none";
            return;
        }

        var width = STAGE_W;
        var height = STAGE_H;
        var hold = true;
        var bloomCount = window.innerWidth < 640 ? 420 : 700;

        var tree = new Tree(canvas, width, height, {
            seed: {
                x: width / 2 - 20,
                color: "rgb(190, 26, 37)",
                scale: 2
            },
            branch: [
                [535, 680, 570, 250, 500, 200, 30, 100, [
                    [540, 500, 455, 417, 340, 400, 13, 100, [
                        [450, 435, 434, 430, 394, 395, 2, 40]
                    ]],
                    [550, 445, 600, 356, 680, 345, 12, 100, [
                        [578, 400, 648, 409, 661, 426, 3, 80]
                    ]],
                    [539, 281, 537, 248, 534, 217, 3, 40],
                    [546, 397, 413, 247, 328, 244, 9, 80, [
                        [427, 286, 383, 253, 371, 205, 2, 40],
                        [498, 345, 435, 315, 395, 330, 4, 60]
                    ]],
                    [546, 357, 608, 252, 678, 221, 6, 100, [
                        [590, 293, 646, 277, 648, 271, 2, 80]
                    ]]
                ]]
            ],
            bloom: {
                num: bloomCount,
                width: 1080,
                height: 650
            },
            footer: {
                width: 1200,
                height: 5,
                speed: 10
            }
        });

        var seed = tree.seed;
        var foot = tree.footer;

        function onPointerMove(event) {
            var point = canvasPoint(event);
            canvas.classList.toggle("hand", seed.hover(point.x, point.y));
        }

        function onPointerDown(event) {
            var point = canvasPoint(event);
            if (!seed.hover(point.x, point.y)) {
                return;
            }
            hold = false;
            hint.classList.add("is-gone");
            canvas.classList.remove("hand");
            canvas.removeEventListener("pointermove", onPointerMove);
            canvas.removeEventListener("pointerdown", onPointerDown);
            tryPlayMusic();
        }

        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerdown", onPointerDown);

        async function seedAnimate() {
            seed.draw();
            while (hold) {
                await sleep(10);
            }
            while (seed.canScale()) {
                seed.scale(0.95);
                await sleep(10);
            }
            while (seed.canMove()) {
                seed.move(0, 2);
                foot.draw();
                await sleep(10);
            }
        }

        async function growAnimate() {
            do {
                tree.grow();
                await sleep(10);
            } while (tree.canGrow());
        }

        async function flowAnimate() {
            do {
                tree.flower(2);
                await sleep(10);
            } while (tree.canFlower());
        }

        async function moveAnimate() {
            tree.snapshot("p1", 240, 0, 610, 680);
            while (tree.move("p1", 500, 0)) {
                foot.draw();
                await sleep(10);
            }
            foot.draw();
            tree.snapshot("p2", 500, 0, 610, 680);
            wrap.style.background = "url(" + tree.toDataURL("image/png") + ")";
            canvas.style.background = "#ffffee";
            await sleep(300);
            canvas.style.background = "none";
        }

        async function jumpAnimate() {
            while (true) {
                tree.ctx.clearRect(0, 0, width, height);
                tree.jump();
                foot.draw();
                await sleep(25);
            }
        }

        async function textAnimate() {
            document.body.classList.add("story-on");
            clockBox.classList.add("is-on");
            timeElapse(TOGETHER);
            fitStage();
            typewriter(codeEl);
            while (true) {
                timeElapse(TOGETHER);
                await sleep(1000);
            }
        }

        (async function run() {
            await seedAnimate();
            await growAnimate();
            await flowAnimate();
            await moveAnimate();
            textAnimate();
            await jumpAnimate();
        })();
    }

    musicBtn.addEventListener("click", function () {
        if (bgm.paused) {
            tryPlayMusic();
        } else {
            bgm.pause();
            updateMusicUi();
        }
    });

    window.addEventListener("resize", fitStage);
    window.addEventListener("orientationchange", fitStage);

    fitStage();
    startSky();
    startTree();
    updateMusicUi();
})();
