// main.js

let state = {
    miirymCount: 0,
    scourgeCount: 0,
    terrorCount: 0,
    genericDragons: 0,
    stack: [],
    totalDamage: 0,
    activeEngine: '' // 'scourge' or 'terror'
};

let battlefieldState = {
    miirym: 0,
    scourge: 0,
    terror: 0,
    genericDragons: 0
};

const CREATURE_POWER = 5; // Terror deals damage equal to entering creature's power

// =====================
// Battlefield ETB
// =====================

// Spawn only Generic Dragons and reset Scourges/Terrors
function spawnDragons() {
    const count = parseInt(document.getElementById("dragonInput").value) || 0;
    if (count <= 0) return;

    state.genericDragons = count;

    // Remove all Scourge and Terror images
    const battlefieldDiv = document.getElementById("battlefield");
    Array.from(battlefieldDiv.querySelectorAll("img")).forEach(img => {
        if (img.src.includes("dragon.png") || img.src.includes("valkas.png") || img.src.includes("terror.png")) {
            img.remove();
        }
    });

    // Reset state
    battlefieldState.genericDragons = 0;
    battlefieldState.scourge = 0;
    battlefieldState.terror = 0;
    state.scourgeCount = 0;
    state.terrorCount = 0;
    state.stack = [];
    state.totalDamage = 0;

    document.getElementById("stack").innerHTML = "";
    updateBattlefield();
    updateDamage();
}
function spawnMiiryms() {
    state.miirymCount = parseInt(document.getElementById("miirymInput").value);

    // Clear previous battlefield visuals
    const battlefieldDiv = document.getElementById("battlefield");
    Array.from(battlefieldDiv.querySelectorAll("img")).forEach(img => {
        if (
            img.src.includes("miirym.png") ||
            img.src.includes("valkas.png") ||
            img.src.includes("terror.png")

        ) {
            img.remove();
        }
    });

    // Reset state
    battlefieldState.miirym = 0;
    battlefieldState.scourge = 0;
    battlefieldState.terror = 0;
    state.scourgeCount = 0;
    state.terrorCount = 0;
    state.stack = [];
    state.totalDamage = 0;

    document.getElementById("stack").innerHTML = "";
    updateBattlefield();
    updateDamage();
}

// =====================
// Stack Helpers
// =====================

function getStackStartOffset() {
    const stackDiv = document.getElementById("stack");
    const headingHeight = stackDiv.previousElementSibling
        ? stackDiv.previousElementSibling.offsetHeight
        : 50;
    return headingHeight + 10;
}

function pushStack(description, resolveFn) {
    const index = state.stack.length;
    state.stack.push({ description, resolve: resolveFn });

    const stackDiv = document.getElementById("stack");
    const abilityOverlap = 30;
    const startOffset = getStackStartOffset();
    const stackWidth = stackDiv.offsetWidth;

    const img = document.createElement("img");
    img.classList.add("ability");
    img.style.left = (stackWidth / 2 - 100) + "px";
    img.style.top = startOffset + index * abilityOverlap + "px";

    if (description.includes("Miirym")) {
        img.src = "miirymability.png";
    } else if (description.includes("Terror")) {
        img.src = "terrorability.png";
    } else {
        img.src = "valkasability.png";
    }

    stackDiv.appendChild(img);
    requestAnimationFrame(() => requestAnimationFrame(() => img.classList.add("show")));
    updateBattlefield();
}

function pushStackStaggered(abilities, delay = 50) {
    abilities.forEach((abilityFn, index) => {
        setTimeout(() => {
            pushStack(abilityFn.description, abilityFn.resolve);
            const triggerSound = new Audio("trigger.mp3");
            triggerSound.play();
        }, index * delay);
    });
}

// =====================
// CAST FUNCTIONS
// =====================

function castScourge() {
    state.activeEngine = 'scourge';
    initDragonCast();

    pushStack("Original Scourge Trigger", () => dealDamage());
    setupMiirymTriggers('scourge');
}

function castTerror() {
    state.activeEngine = 'terror';
    initDragonCast();
    setupMiirymTriggers('terror');
}

function initDragonCast() {
    state.totalDamage = 0;
    state.stack = [];
    document.getElementById("stack").innerHTML = "";

    const battlefieldDiv = document.getElementById("battlefield");
    Array.from(battlefieldDiv.querySelectorAll("img")).forEach(img => {
        if (!img.src.includes("miirym.png")) img.remove();
    });

    // Scourge himself is always 1
    state.scourgeCount = (state.activeEngine === 'scourge') ? 1 : 0;
    state.terrorCount = (state.activeEngine === 'terror') ? 1 : 0;

    battlefieldState.scourge = 0;
    battlefieldState.terror = 0;
    battlefieldState.genericDragons = 0;

    updateBattlefield();
    updateDamage();
}

function setupMiirymTriggers(type) {
    let staggeredAbilities = [];

    for (let i = 1; i <= state.miirymCount; i++) {
        staggeredAbilities.push({
            description: "Miirym Trigger #" + i,
            resolve: () => {
                let innerAbilities = [];

                if (type === 'scourge') {
    state.scourgeCount++; // Valkas himself counts only
    for (let j = 1; j <= state.scourgeCount; j++) {
        innerAbilities.push({
            description: "Scourge Trigger #" + j,
            resolve: () => dealDamage()
        });
    }
} else {
                    state.terrorCount++;
                    let existingTerrors = state.terrorCount - 1;

                    for (let j = 1; j <= existingTerrors; j++) {
                        innerAbilities.push({
                            description: "Terror Trigger #" + j,
                            resolve: () => dealDamage(CREATURE_POWER)
                        });
                    }
                }

                pushStackStaggered(innerAbilities, 50);
            }
        });
    }

    pushStackStaggered(staggeredAbilities, 50);
}

// =====================
// RESOLVE STACK
// =====================

function resolveOne() {
    if (state.stack.length === 0) return;

    const topIndex = state.stack.length - 1;
    const removed = state.stack.pop();
    removed.resolve();

    const stackDiv = document.getElementById("stack");
    const abilityOverlap = 30;
    const startOffset = getStackStartOffset();
    const stackWidth = stackDiv.offsetWidth;

    const abilityImgs = Array.from(stackDiv.querySelectorAll(".ability"));
    const originalTopImg = abilityImgs[abilityImgs.length - 1];
    if (originalTopImg) originalTopImg.remove();

    const exitImg = document.createElement("img");

    if (removed.description.includes("Miirym")) {
        exitImg.src = "miirymability.png";
    } else if (removed.description.includes("Terror")) {
        exitImg.src = "terrorability.png";
    } else {
        exitImg.src = "valkasability.png";
    }

    exitImg.style.width = "200px";
    exitImg.style.position = "absolute";
    exitImg.style.left = (stackWidth / 2 - 100) + "px";
    exitImg.style.top = startOffset + topIndex * abilityOverlap + "px";
    exitImg.style.transition = "transform 0.1s ease, opacity 0.1s ease";
    stackDiv.appendChild(exitImg);

    requestAnimationFrame(() => {
        exitImg.style.transform = "translateX(300px)";
        exitImg.style.opacity = "0";
    });

    setTimeout(() => exitImg.remove(), 300);

    const remaining = Array.from(stackDiv.querySelectorAll(".ability"));
    remaining.forEach((child, i) => {
        child.style.top = startOffset + i * abilityOverlap + "px";
    });

    updateBattlefield();
    updateDamage();
}

function resolveAll() {
    if (state.stack.length === 0) return;

    let startTime = Date.now();
    let currentDelay = 100; 
    let interval;

    const runResolution = () => {
        if (state.stack.length === 0) {
            clearInterval(interval);
            return;
        }

        resolveOne();

        let elapsed = Date.now() - startTime;
        let newDelay = currentDelay;

        if (elapsed > 6000) {
            newDelay = 50; 
        } else if (elapsed > 4000) {
            newDelay = 75; 
        } else if (elapsed > 2000) {
            newDelay = 100;
        }

        if (newDelay !== currentDelay) {
            currentDelay = newDelay;
            clearInterval(interval);
            interval = setInterval(runResolution, currentDelay);
        }
    };

    interval = setInterval(runResolution, currentDelay);
}

// =====================
// DAMAGE
// =====================

function dealDamage(fixedAmount = null) {
    if (fixedAmount !== null) {
        state.totalDamage += fixedAmount;
    } else {
        // Add generic dragons to scourge damage
        state.totalDamage += (state.scourgeCount + state.miirymCount + state.genericDragons);
    }

    new Audio("fireball.mp3").play();
    shakeScreen();
}

function updateDamage() {
    const dmg = document.getElementById("damageDisplay");
    dmg.innerText = "Total Damage: " + state.totalDamage;
    dmg.classList.add("pulse");
    setTimeout(() => dmg.classList.remove("pulse"), 150);
}

// =====================
// BATTLEFIELD
// =====================

function updateBattlefield() {
    const battlefieldDiv = document.getElementById("battlefield");
    const verticalOverlap = 60;
    const startY = 10;

    const containerWidth = battlefieldDiv.offsetWidth;

    // Three columns: 0%, 50%, 100% minus image width
    const imgWidth = 200;
    const startXMiirym = 0;
    const startXDragons = (containerWidth - imgWidth) / 2;
    const startXEngine = containerWidth - imgWidth;

    // Miiryms (left)
    for (let i = battlefieldState.miirym; i < state.miirymCount; i++) {
        battlefieldDiv.appendChild(
            createCreatureImg("miirym.png", startXMiirym, startY + i * verticalOverlap)
        );
        new Audio("etb.mp3").play();
    }

    // Dragons (center)
    for (let i = battlefieldState.genericDragons; i < state.genericDragons; i++) {
        battlefieldDiv.appendChild(
            createCreatureImg("dragon.png", startXDragons, startY + i * verticalOverlap)
        );
        new Audio("etb.mp3").play();
    }

    // Scourge/Terror (right)
    for (let i = battlefieldState.scourge; i < state.scourgeCount; i++) {
        battlefieldDiv.appendChild(
            createCreatureImg("valkas.png", startXEngine, startY + i * verticalOverlap)
        );
        new Audio("etb.mp3").play();
    }

    for (let i = battlefieldState.terror; i < state.terrorCount; i++) {
        battlefieldDiv.appendChild(
            createCreatureImg("terror.png", startXEngine, startY + i * verticalOverlap)
        );
        new Audio("etb.mp3").play();
    }

    battlefieldState.miirym = state.miirymCount;
    battlefieldState.scourge = state.scourgeCount;
    battlefieldState.terror = state.terrorCount;
    battlefieldState.genericDragons = state.genericDragons;
}

function createCreatureImg(src, x, y) {
    const img = document.createElement("img");
    img.src = src;
    img.classList.add("battlefield-creature");
    img.style.left = x + "px";
    img.style.top = y + "px";
    requestAnimationFrame(() => requestAnimationFrame(() => img.classList.add("show")));
    return img;
}

// =====================
// SCREEN EFFECTS
// =====================

function shakeScreen() {
    const body = document.body;
    body.style.transition = '';
    body.style.background = 'rgba(103, 16, 16, 1)';

    setTimeout(() => {
        body.style.transition = 'background 0.3s';
        body.style.background = '#111';
    }, 50);

    const duration = 300;
    const intensity = 5;
    const start = performance.now();

    function animate(now) {
        const elapsed = now - start;
        if (elapsed < duration) {
            body.style.transform =
                `translate(${(Math.random() - 0.5) * intensity}px, ${(Math.random() - 0.5) * intensity}px)`;
            requestAnimationFrame(animate);
        } else {
            body.style.transform = '';
        }
    }

    requestAnimationFrame(animate);
}

function showResult() {
    state.miirymCount = parseInt(document.getElementById("miirymInput").value);
    state.genericDragons = parseInt(document.getElementById("dragonInput").value || 0);
    state.totalDamage = 0;

    let tempStack = [];

    if (state.activeEngine === 'scourge') {
        state.scourgeCount = 1;

        tempStack.push(() => {
            state.totalDamage += state.scourgeCount + state.miirymCount + state.genericDragons;
        });

        for (let i = 1; i <= state.miirymCount; i++) {
            tempStack.push(() => {
                state.scourgeCount++;
                let currentScourges = state.scourgeCount;

                for (let j = 1; j <= currentScourges; j++) {
                    tempStack.push(() => {
                        state.totalDamage += state.scourgeCount + state.miirymCount  + state.genericDragons;
                    });
                }
            });
        }
    } else if (state.activeEngine === 'terror') {
        state.terrorCount = 1;

        for (let i = 1; i <= state.miirymCount; i++) {
            tempStack.push(() => {
                let existingTerrors = state.terrorCount;

                for (let j = 1; j <= existingTerrors; j++) {
                    tempStack.push(() => {
                        state.totalDamage += CREATURE_POWER;
                    });
                }

                state.terrorCount++;
            });
        }
    }

    while (tempStack.length > 0) {
        tempStack.pop()();
    }

    state.stack = [];
    updateBattlefield();
    updateDamage();
    document.getElementById("stack").innerHTML = "";
}