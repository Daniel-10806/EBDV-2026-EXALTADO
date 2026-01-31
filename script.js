function cleanEffects() {

    document.querySelectorAll(
        ".balloonAnim, .floatMsg"
    ).forEach(e => e.remove());
}

let lastPositions = {};

/* MESSAGE QUEUE SYSTEM */

let msgQueue = [];
let showingMsg = false;
let verseHistory =
    JSON.parse(localStorage.getItem("verseHistory")) || [];

function queueMsg(text, color, time = 1400) {

    msgQueue.push({ text, color, time });

    if (!showingMsg) {
        playQueue();
    }
}

function playQueue() {

    if (msgQueue.length === 0) {
        showingMsg = false;
        return;
    }

    showingMsg = true;

    const { text, color, time } = msgQueue.shift();

    const box = document.getElementById("centerMsg");

    box.style.display = "none";
    void box.offsetWidth;

    box.innerText = text;

    if (text.includes("MISIÓN")) {
        box.classList.add("missionGlow");
    } else {
        box.classList.remove("missionGlow");
    }

    box.style.background = color;
    box.style.display = "block";

    setTimeout(() => {
        box.style.display = "none";

        setTimeout(() => {
            playQueue();
        }, 200);

    }, time);
}

let gameState = "ready";
// ready | countdown | playing | finished

let honorPoints = {
    rojo: 0, azul: 0, verde: 0, amarillo: 0
};

function giveHonor(team) {

    honorPoints[team]++;

    showCenterMsg(
        "🏅 HONOR PARA " + team.toUpperCase(),
        "rgba(255,193,7,.9)"
    );
}

let history = JSON.parse(
    localStorage.getItem("history")
) || [];

function addHistory(text) {

    let entry = {
        msg: text,
        time: new Date().toLocaleTimeString()
    };

    history.push(entry);

    if (history.length > 20) {
        history.shift();
    }

    localStorage.setItem("history", JSON.stringify(history));
}

let missions = [
    {
        text: "🤝 Ayuden a otro equipo",
        bonus: "teamwork"
    },
    {
        text: "🙏 Todos digan Amén",
        bonus: "faith"
    },
    {
        text: "📖 Escuchen el verso atentos",
        bonus: "word"
    },
    {
        text: "💙 Jueguen sin pelear",
        bonus: "respect"
    }
];

let verseCounter = 0;
localStorage.removeItem("verseCounter");

let currentMission = null;

let streak = {
    rojo: 0,
    azul: 0,
    verde: 0,
    amarillo: 0
};

/* AUDIO */

let ready = false;

const sounds = {
    win: new Audio("sounds/win.mp3"),
    lose: new Audio("sounds/lose.mp3"),
    victory: new Audio("sounds/victory.mp3")
};

document.addEventListener("click", () => {
    if (!ready) {
        sounds.win.play().then(() => {
            sounds.win.pause();
            sounds.win.currentTime = 0;
            ready = true;
        });
    }
});

/* PARTICULAS */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
addEventListener("resize", resize);
resize();

let particles = [];

function balloonEffect(x, y) {

    let el = document.createElement("div");

    el.className = "balloonAnim";
    el.innerText = "🎈";

    el.style.left = x + "px";
    el.style.top = y + "px";

    document.body.appendChild(el);

    setTimeout(() => {
        el.remove();
    }, 800);

}

function showFloatMsg(text, x, y, color) {

    let el = document.createElement("div");

    el.className = "floatMsg";
    el.innerText = text;

    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.background = color;

    document.body.appendChild(el);

    setTimeout(() => {
        el.remove();
    }, 1200);

}

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p, i) => {

        ctx.globalAlpha = p.life / 45;
        ctx.font = "24px serif";
        ctx.fillText("✨", p.x, p.y);

        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life <= 0) particles.splice(i, 1);

    });

    ctx.globalAlpha = 1;

    requestAnimationFrame(draw);
}

function championEffect() {

    for (let i = 0; i < 250; i++) {

        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - .5) * 8,
            vy: (Math.random() - .5) * 8,
            life: 80
        });
    }
}

draw();

/* GAME */

const MAX = 10;

const ranking = document.getElementById("ranking");
const message = document.getElementById("message");
const timerEl = document.getElementById("timer");
const popup = document.getElementById("popup");

function loadTeams() {

    // Siempre empezar limpio en modo ready
    if (gameState === "ready") {

        const fresh = {
            rojo: MAX,
            azul: MAX,
            verde: MAX,
            amarillo: MAX
        };

        localStorage.setItem("teams", JSON.stringify(fresh));
        return fresh;
    }

    let saved = JSON.parse(localStorage.getItem("teams"));

    // Si está dañado, reiniciar
    if (
        !saved ||
        typeof saved.rojo !== "number" ||
        typeof saved.azul !== "number" ||
        typeof saved.verde !== "number" ||
        typeof saved.amarillo !== "number"
    ) {

        const fresh = {
            rojo: MAX,
            azul: MAX,
            verde: MAX,
            amarillo: MAX
        };

        localStorage.setItem("teams", JSON.stringify(fresh));
        return fresh;
    }

    return saved;
}

let teams = loadTeams();

let timer = null;
let time = 60;
let finished = false;

/* RENDER */

function render() {

    for (let t in teams) {

        document.getElementById(t).innerHTML =
            Array(teams[t])
                .fill("<span>🎈</span>")
                .join("");

    }

    updateRanking();
    updatePowerBars();
    checkComeback();
    updateMood();
    save();
    highlightLeader();
    updateControlsLock();
    updateHypeMode();
}

function updateControlsLock() {

    document.querySelectorAll(".team")
        .forEach(t => {

            if (gameState === "playing") {
                t.classList.remove("locked");
            } else {
                t.classList.add("locked");
            }

        });
}

function perseveranceBonus(team) {

    if (teams[team] <= 2) {

        if (Math.random() < 0.25) {

            teams[team]++;

            showCenterMsg(
                "🙏 DIOS HONRA TU ESFUERZO (" + team.toUpperCase() + ")",
                "rgba(63,81,181,.9)"
            );

            sounds.win.play();
            giveHonor(team);
        }
    }
}

function updatePowerBars() {

    for (let t in teams) {

        let percent = (teams[t] / MAX) * 100;

        let bar = document.getElementById("bar-" + t);

        if (bar) {
            bar.style.width = percent + "%";
        }
    }
}

/* CONTROLES */

function add(t, e) {

    if (gameState !== "playing") return;

    if (teams[t] < MAX) {

        teams[t]++;

        sounds.win.currentTime = 0;
        sounds.win.play();

        balloonEffect(e.clientX, e.clientY);

        showFloatMsg(
            "+1 Vida 🎈",
            e.clientX,
            e.clientY - 25,
            "rgba(76,175,80,.9)"
        );

        updateStreak(t);
        perseveranceBonus(t);
        render();
        flashTeam(t);
    }
}

function updateStreak(team) {

    // Reinicia otros
    for (let t in streak) {
        if (t !== team) streak[t] = 0;
    }

    streak[team]++;
}

/* EVENTO ESPECIAL */

setInterval(() => {

    // Solo durante juego activo
    if (gameState !== "playing") return;

    if (Math.random() < 0.12) {

        miracleEvent();

    }

}, 15000);

function miracleEvent() {

    let teamsArr = Object.keys(teams);

    let t = teamsArr[
        Math.floor(Math.random() * 4)
    ];

    teams[t] = Math.min(MAX, teams[t] + 1);

    showCenterMsg(
        "✨ BENDICIÓN PARA " + t.toUpperCase() + " 🙏",
        "rgba(156,39,176,.9)"
    );

    flashLogo();

    render();
}

function flashLogo() {

    const logo = document.getElementById("mainLogo");

    logo.classList.add("logoPower");

    setTimeout(() => {
        logo.classList.remove("logoPower");
    }, 600);

}

function flashTeam(team) {

    const el = document.querySelector(`.${team}`);

    el.classList.add("powerFlash");

    setTimeout(() => {
        el.classList.remove("powerFlash");
    }, 400);

}

let countdownInterval = null;

function startCountdown() {

    if (gameState !== "ready") return;

    gameState = "countdown";

    msgQueue = []; // limpia cola previa

    queueMsg("⏳ 3", "rgba(33,150,243,.9)", 1200);
    queueMsg("⏳ 2", "rgba(33,150,243,.9)", 1200);
    queueMsg("⏳ 1", "rgba(33,150,243,.9)", 1200);

    // Mensaje puente
    queueMsg("⚔️ ¡PREPÁRENSE!", "rgba(255,193,7,.95)", 1200);

    queueMsg("🔥 ¡EMPIEZA! 🔥", "rgba(76,175,80,.95)", 1400);

    setTimeout(() => {
        startGameWithMission();
    }, 6200);
}

function startGameWithMission() {

    cleanEffects();

    document.body.classList.add("gameStartFlash");

    setTimeout(() => {
        document.body.classList.remove("gameStartFlash");
    }, 1200);

    gameState = "playing";

    updateControlsLock();

    time = 60;
    updateTimer();

    document.getElementById("statusInfo").innerText = "🟢 Jugando";

    // Seleccionar misión
    currentMission = missions[
        Math.floor(Math.random() * missions.length)
    ];

    startTimerLoop();
}

function showCountdown(num) {

    showCenterMsg(
        "⏳ " + num,
        "rgba(33,150,243,.9)"
    );

    const box = document.getElementById("centerMsg");
    box.classList.remove("countdownPulse");
    void box.offsetWidth;
    box.classList.add("countdownPulse");

}

function startTimerLoop() {

    timer = setInterval(() => {

        time--;
        updateTimer();

        if (time <= 0) {
            stopTimer();
            finishGame();
        }

    }, 1000);
}

function remove(t, e) {

    if (gameState !== "playing") return;

    if (teams[t] > 0) {

        teams[t]--;

        sounds.lose.currentTime = 0;
        sounds.lose.play();

        balloonEffect(e.clientX, e.clientY);

        showFloatMsg(
            "-1 Vida 🎈",
            e.clientX,
            e.clientY - 25,
            "rgba(244,67,54,.9)"
        );

        render();
    }
}

/* RANKING */

function updateRanking() {

    let s = Object.entries(teams)
        .sort((a, b) => b[1] - a[1]);

    let html = "";

    s.forEach((e, i) => {

        let medal = ["🥇", "🥈", "🥉", "🎖"][i];

        html += `
<div class="rankRow">
${medal} ${e[0].toUpperCase()}
<span>${e[1]}</span>
</div>
`;

    });

    ranking.innerHTML = html;

    // Leader info
    document.getElementById("leaderName").innerText =
        s[0][0].toUpperCase();

    // Difference
    let diff = s[0][1] - s[1][1];
    document.getElementById("diffPoints").innerText = diff;

}

/* LIDER */

function highlightLeader() {

    document.querySelectorAll(".team").forEach(t => {
        t.classList.remove("leader", "spiritAura");
    });

    let max = Math.max(...Object.values(teams));

    let leaders = Object.keys(teams)
        .filter(t => teams[t] === max);

    if (leaders.length === 1) {

        let el = document.querySelector(`.${leaders[0]}`);

        el.classList.add("leader", "spiritAura");
    }
}

/* TIMER */

function startTimer() {

    if (gameState !== "ready") return;

    startCountdown();

}

function stopTimer() {
    clearInterval(timer);
    timer = null;
}

function updateTimer() {
    timerEl.innerText = `00:${time.toString().padStart(2, 0)}`;
}

/* FINAL */

function finishGame() {

    gameState = "finished";

    document.getElementById("statusInfo")
        .innerText = "🏁 Finalizado";

    finished = true;

    let s = Object.entries(teams)
        .sort((a, b) => b[1] - a[1]);

    sounds.victory.play();

    // Campeón
    let max = s[0][1];

    let winners = s
        .filter(e => e[1] === max)
        .map(e => e[0].toUpperCase());

    let champ =
        winners.length > 1
            ? "EMPATE: " + winners.join(" & ")
            : "CAMPEÓN: " + winners[0];

    addHistory("Ganó " + champ);

    let verse =
        verses[Math.floor(Math.random() * verses.length)];

    // Mostrar gráfico primero
    showResultChart(() => {

        // Luego ceremonia
        showFinalCeremony(champ, verse);

    });
}

function showFinalCeremony(champ, verse) {

    const box =
        document.getElementById("finalCeremony");

    const winner =
        document.getElementById("ceremonyWinner");

    const verseBox =
        document.getElementById("ceremonyVerse");

    const countEl =
        document.getElementById("ceremonyCountdown");

    winner.innerText = "🏆 " + champ;

    verseBox.innerText = "🙏 " + verse;

    box.style.display = "flex";

    // Partículas
    championEffect();

    let count = 10;

    countEl.innerText = count;

    let interval = setInterval(() => {

        count--;

        countEl.innerText = count;

        if (count <= 0) {

            clearInterval(interval);

            box.style.display = "none";

            resetGame();

        }

    }, 1000);
}

function resetGame() {

    cleanEffects();

    verseCounter = 0;
    document.getElementById("verseCount").innerText = 0;

    teams = {
        rojo: MAX,
        azul: MAX,
        verde: MAX,
        amarillo: MAX
    };

    finished = false;

    time = 60;

    stopTimer();

    updateTimer();

    render();

    gameState = "ready";

    updateControlsLock();

    document.getElementById("statusInfo")
        .innerText = "🟡 Listos";
}

function startFinalMode() {

    // Ocultar podio primero
    document.getElementById("finalPodium").style.display = "none";

    const fm = document.getElementById("finalMode");
    const ft = document.getElementById("finalTimer");

    fm.style.display = "flex";

    let count = 10;

    ft.innerText = count;

    let interval = setInterval(() => {

        count--;

        ft.innerText = count;

        if (count <= 0) {

            clearInterval(interval);

            fm.style.display = "none";

        }

    }, 1000);
}

/* MENSAJES */

function msgAdd(team) {

    let values = Object.values(teams);

    let max = Math.max(...values);

    let leaders = Object.keys(teams)
        .filter(t => teams[t] === max);

    let msgs = [
        "¡EXCELENTE! 🌟",
        "¡DIOS LOS BENDICE! 🙌",
        "¡SIGAN ASÍ! 🚀"
    ];

    // Solo si es líder único
    if (leaders.length === 1 && leaders[0] === team) {

        addHistory(team.toUpperCase() + " tomó la delantera");
        msgs.push("¡VAN LIDERANDO! 🏆");

    }

    showCenterMsg(
        msgs[Math.floor(Math.random() * msgs.length)],
        "rgba(76,175,80,.9)"
    );
}

function msgRemove() {

    const msgs = [
        "¡ÁNIMO! 💙",
        "¡PUEDEN REMONTAR! 🔥",
        "¡NO SE RINDAN! 💪",
        "¡SIGAN LUCHANDO! ⚔️"
    ];

    showCenterMsg(
        msgs[Math.floor(Math.random() * msgs.length)],
        "rgba(255,152,0,.9)"
    );

}

function showCenterMsg(text, color, time = 1600) {
    // DESACTIVADO
    return;
}

function bless() {

    const blessings = [
        "Dios está con ustedes 🙏",
        "Jesús los ama ❤️",
        "Sigan firmes 💪",
        "El Señor los guía ✨",
        "Dios es fiel 🌟"
    ];

    let msg =
        blessings[Math.floor(Math.random() * blessings.length)];

    showPopup("🙏 " + msg);

}

/* POPUP */

function showPopup(t) {

    popup.innerText = t;
    popup.style.display = "flex";

    setTimeout(() => {
        popup.style.display = "none";
    }, 3500);
}

/* VERSOS */

const verses = [

    // MISIÓN
    "Por tanto, id, y haced discípulos - Mateo 28:19",
    "Vayan por todo el mundo y prediquen - Marcos 16:15",

    // LLAMADO
    "Muchos son llamados, pocos escogidos - Mateo 22:14",
    "Antes que nacieras te escogí - Jeremías 1:5",

    // VALENTÍA
    "Sé fuerte y valiente - Josué 1:9",
    "No temas, porque yo estoy contigo - Isaías 41:10",

    // SERVICIO
    "El que quiera ser grande, sirva - Mateo 20:26",
    "Sirvan al Señor con alegría - Salmos 100:2",

    // PROPÓSITO
    "Todo coopera para bien - Romanos 8:28",
    "Somos hechura suya - Efesios 2:10",

    // FE
    "Todo es posible para el que cree - Marcos 9:23",
    "Camina por fe, no por vista - 2 Corintios 5:7",

    // IDENTIDAD
    "Somos hijos de Dios - Romanos 8:16",
    "Linaje escogido - 1 Pedro 2:9"
];

function openVerse() {

    const overlay = document.getElementById("verseOverlay");
    const verseText = document.getElementById("verseText");
    const mini = document.getElementById("miniVerse");
    const sub = document.getElementById("verseSub");

    overlay.style.display = "flex";

    verseCounter++;
    localStorage.setItem("verseCounter", verseCounter);

    document.getElementById("verseCount").innerText =
        verseCounter;

    let v = verses[Math.floor(Math.random() * verses.length)];

    verseText.innerText = "“" + v + "”";

    const reflections = [
        "💭 ¿Cómo puedes obedecer este verso hoy?",
        "🙏 ¿Por quién puedes orar hoy?",
        "❤️ ¿A quién puedes ayudar?",
        "✨ ¿Qué te quiere enseñar Dios?",
        "📖 ¿Cómo aplicarías esto en tu vida?"
    ];

    document.getElementById("verseReflection").innerText =
        reflections[Math.floor(Math.random() * reflections.length)];

    mini.innerText = "🙏 " + v.split("-")[0];

    const subs = [
        "💛 Recibe esta palabra con fe",
        "✨ Dios te está hablando hoy",
        "🙏 Guarda esto en tu corazón",
        "📖 Su palabra es vida",
        "🌟 Cree y confía"
    ];

    sub.innerText =
        subs[Math.floor(Math.random() * subs.length)];

    // Guardar historial

    verseHistory.unshift(v);

    if (verseHistory.length > 10) {
        verseHistory.pop();
    }

    localStorage.setItem(
        "verseHistory",
        JSON.stringify(verseHistory)
    );
}

function closeVerse() {

    document.getElementById("verseOverlay")
        .style.display = "none";

}

function closeVerseHistory() {

    document.getElementById("historyOverlay")
        .style.display = "none";
}

/* SAVE */

function save() {
    localStorage.setItem("teams", JSON.stringify(teams));
}

/* START */

render();
updateTimer();

function toggleFull() {

    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function checkComeback() {

    let sorted = Object.entries(teams)
        .sort((a, b) => b[1] - a[1]);

    let first = sorted[0][0];
    let last = sorted[sorted.length - 1][0];

    if (lastPositions[first] === "last") {

        addHistory(first.toUpperCase() + " hizo remontada");
        showCenterMsg(
            "🔥 ¡REMONTADA ÉPICA " + first.toUpperCase() + "! 🔥",
            "rgba(255,61,0,.95)"
        );

        championEffect();
    }

    lastPositions = {};

    sorted.forEach((e, i) => {

        if (i === 0) lastPositions[e[0]] = "first";
        if (i === sorted.length - 1) lastPositions[e[0]] = "last";

    });
}

function updateMood() {

    let avg =
        Object.values(teams)
            .reduce((a, b) => a + b) / 4;

    if (avg >= 8) {
        document.body.style.filter = "brightness(1.1)";
    }
    else if (avg <= 4) {
        document.body.style.filter = "brightness(.9)";
    }
    else {
        document.body.style.filter = "brightness(1)";
    }
}

function updateHypeMode() {

    let values = Object.values(teams);
    let sorted = [...values].sort((a, b) => b - a);

    let diff = sorted[0] - sorted[1];

    if (diff >= 3) {

        document.body.classList.add("hypeMode");

    } else {

        document.body.classList.remove("hypeMode");

    }
}

function showVerseHistory() {

    const overlay =
        document.getElementById("historyOverlay");

    const list =
        document.getElementById("historyList");

    list.innerHTML = "";

    if (verseHistory.length === 0) {

        list.innerHTML =
            "<p style='opacity:.7'>Aún no hay versos guardados 🙏</p>";

    } else {

        verseHistory.forEach((v, i) => {

            let div = document.createElement("div");

            div.className = "historyItem";

            div.innerText =
                (i + 1) + ". " + v;

            list.appendChild(div);
        });
    }

    overlay.style.display = "flex";
}

function showResultChart(callback) {

    const overlay =
        document.getElementById("resultOverlay");

    overlay.style.display = "flex";

    const max = Math.max(...Object.values(teams));

    ["rojo", "azul", "verde", "amarillo"].forEach(t => {

        const val = teams[t];

        const percent = (val / max) * 100;

        const bar =
            document.querySelector(`.${t}Bar .barFill`);

        const span =
            document.querySelector(`.${t}Bar span`);

        bar.style.width = "0%";

        setTimeout(() => {
            bar.style.width = percent + "%";
            span.innerText = val + " pts";
        }, 200);

    });

    // Mostrar 8s
    setTimeout(() => {

        overlay.style.display = "none";

        if (callback) callback();

    }, 8000);
}