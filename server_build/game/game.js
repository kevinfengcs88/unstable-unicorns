"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._findInstruction = exports._findInProgressScenesWithProtagonist = exports._findOpenScenesWithProtagonist = exports._addSceneFromDo = exports.canDraw = exports.canPlayCard = void 0;
var do_1 = require("./do");
var card_1 = require("./card");
var constants_1 = require("./constants");
var do_2 = require("./do");
var _ = require("underscore");
var UnstableUnicorns = {
    name: "unstable_unicorns",
    setup: function (ctx, setupData) {
        var players = Array.from({ length: ctx.numPlayers }, function (val, idx) {
            return {
                id: "".concat(idx),
                name: "Spieler ".concat(idx),
            };
        });
        var deck = (0, card_1.initializeDeck)();
        var discardPile = [];
        var nursery = [];
        var drawPile = _.shuffle(deck).filter(function (c) { return c.type !== "baby"; }).map(function (c) { return c.id; });
        var hand = {};
        var stable = {};
        var temporaryStable = {};
        var upgradeDowngradeStable = {};
        var playerEffects = {};
        var ready = {};
        players.forEach(function (pl) {
            ready[pl.id] = false;
            hand[pl.id] = _.first(drawPile, constants_1.CONSTANTS.numberOfHandCardsAtStart);
            drawPile = _.rest(drawPile, constants_1.CONSTANTS.numberOfHandCardsAtStart);
            stable[pl.id] = [];
            temporaryStable[pl.id] = [];
            upgradeDowngradeStable[pl.id] = [];
            playerEffects[pl.id] = [];
        });
        return {
            players: players,
            deck: deck,
            drawPile: drawPile,
            nursery: nursery,
            discardPile: discardPile,
            hand: hand,
            stable: stable,
            temporaryStable: temporaryStable,
            upgradeDowngradeStable: upgradeDowngradeStable,
            script: { scenes: [] },
            playerEffects: playerEffects,
            mustEndTurnImmediately: false,
            countPlayedCardsInActionPhase: 0,
            clipboard: {},
            endGame: false,
            babyStarter: [],
            ready: ready,
            uiHoverHandIndex: undefined,
            uiExecuteDo: undefined,
            uiCardToCard: undefined,
            lastNeighResult: undefined,
        };
    },
    phases: {
        pregame: {
            start: true,
            onBegin: function (G, ctx) {
                var _a;
                (_a = ctx.events) === null || _a === void 0 ? void 0 : _a.setActivePlayers({ all: "pregame" });
            }
        },
        main: {
            //start: true,
            onBegin: function (G, ctx) {
            }
        }
    },
    turn: {
        onBegin: function (G, ctx) {
            var _a, _b;
            if (ctx.phase === "pregame") {
                return;
            }
            // this is run whenever a new player starts its turn
            // perfect for placing players in a stage
            if (G.drawPile.length > 0) {
                G.script = { scenes: [] };
                G.countPlayedCardsInActionPhase = 0;
                G.mustEndTurnImmediately = false;
                // begin of turn: add scene
                __spreadArray(__spreadArray([], G.stable[ctx.currentPlayer], true), G.upgradeDowngradeStable[ctx.currentPlayer], true).forEach(function (c) { return _addSceneFromDo(G, ctx, c, ctx.currentPlayer, "begin_of_turn"); });
                // begin of turn: add effect
                __spreadArray(__spreadArray([], G.stable[ctx.currentPlayer], true), G.upgradeDowngradeStable[ctx.currentPlayer], true).forEach(function (c) {
                    var _a;
                    var card = G.deck[c];
                    var cardOnBegin = (_a = card.on) === null || _a === void 0 ? void 0 : _a.filter(function (c) { return c.trigger === "begin_of_turn"; });
                    // all unicorns are basic
                    // trigger no effect
                    if (G.playerEffects[ctx.currentPlayer].find(function (s) { return s.effect.key === "my_unicorns_are_basic"; })) {
                        if (G.playerEffects[ctx.currentPlayer].find(function (s) { return s.effect.key === "pandamonium"; }) === undefined) {
                            if (card.type === "narwhal" || card.type === "unicorn") {
                                return;
                            }
                        }
                    }
                    if (cardOnBegin) {
                        cardOnBegin.filter(function (on) { return on.do.type === "add_effect"; }).forEach(function (on) {
                            var doAddEffect = on.do;
                            // check if effect has already been added
                            if (G.playerEffects[ctx.currentPlayer].filter(function (s) { return s.cardID === c; }).length === 0) {
                                G.playerEffects[ctx.currentPlayer] = __spreadArray(__spreadArray([], G.playerEffects[ctx.currentPlayer], true), [{ cardID: c, effect: doAddEffect.info }], false);
                            }
                        });
                    }
                });
                (_a = ctx.events) === null || _a === void 0 ? void 0 : _a.setActivePlayers({ all: "beginning" });
            }
            else {
                // no cards to draw
                // need to end the game
                (_b = ctx.events) === null || _b === void 0 ? void 0 : _b.setPhase("end");
            }
        },
        stages: {
            pregame: {
                moves: { ready: ready, selectBaby: selectBaby, changeName: changeName }
            },
            beginning: {
                moves: { drawAndAdvance: drawAndAdvance, executeDo: do_2.executeDo, end: end, commit: commit, skipExecuteDo: skipExecuteDo, setUIHoverHandIndex: setUIHoverHandIndex, setUICardToCard: setUICardToCard }
            },
            action_phase: {
                moves: {
                    commit: commit,
                    executeDo: do_2.executeDo,
                    end: end,
                    drawAndEnd: drawAndEnd,
                    playCard: playCard,
                    playUpgradeDowngradeCard: playUpgradeDowngradeCard,
                    playNeigh: playNeigh,
                    playSuperNeigh: playSuperNeigh,
                    dontPlayNeigh: dontPlayNeigh,
                    skipExecuteDo: skipExecuteDo,
                    setUIHoverHandIndex: setUIHoverHandIndex,
                    setUICardToCard: setUICardToCard
                }
            }
        }
    }
};
function initializeGame(G, ctx) {
    var a = [];
    for (var i = 0; i < 13; i++) {
        a.push(i);
    }
    G.babyStarter.forEach(function (_a) {
        var cardID = _a.cardID, owner = _a.owner;
        G.stable[owner].push(cardID);
        a = _.without(a, cardID);
    });
    a.forEach(function (cardId) {
        G.nursery.push(cardId);
    });
}
function changeName(G, ctx, protagonist, name) {
    G.players[parseInt(protagonist)].name = name;
}
function ready(G, ctx, protagonist) {
    var _a;
    G.ready[protagonist] = true;
    if (_.every(_.values(G.ready), function (bo) { return bo; })) {
        initializeGame(G, ctx);
        (_a = ctx.events) === null || _a === void 0 ? void 0 : _a.setPhase("main");
    }
}
function selectBaby(G, ctx, protagonist, cardID) {
    G.babyStarter.push({
        cardID: cardID,
        owner: protagonist
    });
}
function drawAndAdvance(G, ctx) {
    var _a;
    G.hand[ctx.currentPlayer].push(_.first(G.drawPile));
    G.drawPile = _.rest(G.drawPile, 1);
    (_a = ctx.events) === null || _a === void 0 ? void 0 : _a.setActivePlayers({ all: "action_phase" });
    G.script = { scenes: [] };
}
function canPlayCard(G, ctx, protagonist, cardID) {
    if (ctx.currentPlayer === protagonist && ctx.activePlayers[protagonist] === "action_phase" && (G.countPlayedCardsInActionPhase === 0 || (G.countPlayedCardsInActionPhase === 1 && G.playerEffects[protagonist].find(function (c) { return c.effect.key === "double_dutch"; })))) {
        return (0, do_1.canEnter)(G, ctx, { playerID: protagonist, cardID: cardID });
    }
    return false;
}
exports.canPlayCard = canPlayCard;
function playCard(G, ctx, protagonist, cardID) {
    G.countPlayedCardsInActionPhase = G.countPlayedCardsInActionPhase + 1;
    G.hand[protagonist] = _.without(G.hand[protagonist], cardID);
    var playerState = {};
    for (var _i = 0, _a = G.players; _i < _a.length; _i++) {
        var player = _a[_i];
        playerState[player.id] = { vote: player.id === protagonist ? "no_neigh" : "undecided" };
    }
    if (G.playerEffects[protagonist].findIndex(function (f) { return f.effect.key === "your_cards_cannot_be_neighed"; }) > -1) {
        (0, do_1.enter)(G, ctx, { playerID: protagonist, cardID: cardID });
    }
    else {
        // resolve neigh
        G.neighDiscussion = {
            cardID: cardID,
            protagonist: protagonist,
            rounds: [{ state: "open", playerState: playerState }],
            target: protagonist,
        };
    }
}
function playUpgradeDowngradeCard(G, ctx, protagonist, targetPlayer, cardID) {
    G.countPlayedCardsInActionPhase = G.countPlayedCardsInActionPhase + 1;
    G.hand[protagonist] = _.without(G.hand[protagonist], cardID);
    if (G.playerEffects[protagonist].findIndex(function (f) { return f.effect.key === "your_cards_cannot_be_neighed"; }) > -1) {
        (0, do_1.enter)(G, ctx, { playerID: targetPlayer, cardID: cardID });
    }
    else {
        // resolve neigh
        var playerState = {};
        for (var _i = 0, _a = G.players; _i < _a.length; _i++) {
            var player = _a[_i];
            playerState[player.id] = { vote: player.id === protagonist ? "no_neigh" : "undecided" };
        }
        G.neighDiscussion = {
            cardID: cardID,
            protagonist: protagonist,
            rounds: [{
                    state: "open",
                    playerState: playerState,
                }],
            target: targetPlayer,
        };
    }
}
function playNeigh(G, ctx, cardID, protagonist, roundIndex) {
    if (G.neighDiscussion) {
        G.hand[protagonist] = _.without(G.hand[protagonist], cardID);
        G.discardPile = __spreadArray(__spreadArray([], G.discardPile, true), [cardID], false);
        var round = G.neighDiscussion.rounds[roundIndex];
        // check if there was already a neigh vote during this round
        // if yes do nothing
        if (round.state !== "open") {
            return;
        }
        // there was no neigh round yet
        // hence neigh the round and add a next round
        var playerState = {};
        for (var _i = 0, _a = G.players; _i < _a.length; _i++) {
            var player = _a[_i];
            playerState[player.id] = { vote: player.id === protagonist ? "no_neigh" : "undecided" };
        }
        round.playerState = playerState;
        round.state = "neigh";
        G.neighDiscussion.rounds.push({
            state: "open",
            playerState: playerState,
        });
    }
}
function playSuperNeigh(G, ctx, cardID, protagonist, roundIndex) {
    if (G.neighDiscussion) {
        G.hand[protagonist] = _.without(G.hand[protagonist], cardID);
        G.discardPile = __spreadArray(__spreadArray([], G.discardPile, true), [cardID], false);
        var round = G.neighDiscussion.rounds[roundIndex];
        // check if there was already a neigh vote during this round
        // if yes do nothing
        if (round.state !== "open") {
            return;
        }
        // there was no neigh round yet
        // hence neigh the round and add a next round
        round.playerState[protagonist] = { vote: "neigh" };
        round.state = "neigh";
        var cardWasNeighed = (G.neighDiscussion.rounds.length + 1) % 2 === 0;
        if (cardWasNeighed) {
            G.discardPile.push(G.neighDiscussion.cardID);
            G.lastNeighResult = { id: _.uniqueId(), result: "cardWasNeighed" };
        }
        else {
            (0, do_1.enter)(G, ctx, { playerID: G.neighDiscussion.protagonist, cardID: G.neighDiscussion.cardID });
            G.lastNeighResult = { id: _.uniqueId(), result: "cardWasPlayed" };
        }
        G.neighDiscussion = undefined;
    }
}
function dontPlayNeigh(G, ctx, protagonist, roundIndex) {
    // end
    if (G.neighDiscussion) {
        var round = G.neighDiscussion.rounds[roundIndex];
        round.playerState[protagonist] = { vote: "no_neigh" };
        if (_.findKey(round.playerState, function (val) { return val.vote === "undecided"; }) === undefined) {
            // everyone has voted => advance the game
            var cardWasNeighed = G.neighDiscussion.rounds.length % 2 === 0;
            if (cardWasNeighed) {
                G.discardPile.push(G.neighDiscussion.cardID);
                G.lastNeighResult = { id: _.uniqueId(), result: "cardWasNeighed" };
            }
            else {
                (0, do_1.enter)(G, ctx, { playerID: G.neighDiscussion.target, cardID: G.neighDiscussion.cardID });
                G.lastNeighResult = { id: _.uniqueId(), result: "cardWasPlayed" };
            }
            G.neighDiscussion = undefined;
        }
    }
}
function canDraw(G, ctx) {
    if (G.mustEndTurnImmediately === true) {
        return false;
    }
    if (ctx.activePlayers[ctx.currentPlayer] === "beginning") {
        // if there is a mandatory scene => one cannot draw
        if (_findOpenScenesWithProtagonist(G, ctx.currentPlayer).find(function (_a) {
            var instr = _a[0], sc = _a[1];
            return sc.mandatory === true;
        })) {
            return false;
        }
        // if there is an ongoing scene => one cannot draw
        if (_findInProgressScenesWithProtagonist(G, ctx.currentPlayer).length > 0) {
            return false;
        }
        return true;
    }
    if (ctx.activePlayers[ctx.currentPlayer] === "action_phase") {
        return G.countPlayedCardsInActionPhase === 0;
    }
    return false;
}
exports.canDraw = canDraw;
function drawAndEnd(G, ctx) {
    G.script = { scenes: [] };
    G.hand[ctx.currentPlayer].push(_.first(G.drawPile));
    G.drawPile = _.rest(G.drawPile, 1);
    G.countPlayedCardsInActionPhase = G.countPlayedCardsInActionPhase + 1;
}
function end(G, ctx, protagonist) {
    var _a, _b;
    if (G.playerEffects[protagonist].find(function (o) { return o.effect.key === "change_of_luck"; })) {
        G.playerEffects[protagonist] = G.playerEffects[protagonist].filter(function (o) { return o.effect.key !== "change_of_luck"; });
        if (G.hand[protagonist].length > 7) {
            var newScene = {
                id: _.uniqueId(),
                mandatory: true,
                endTurnImmediately: false,
                actions: [{
                        type: "action",
                        instructions: [{
                                id: _.uniqueId(),
                                protagonist: protagonist,
                                state: "open",
                                do: {
                                    key: "discard",
                                    info: { count: G.hand[protagonist].length - 7, type: "any" }
                                },
                                ui: { type: "click_on_own_card_in_hand" }
                            }]
                    }]
            };
            G.script.scenes = __spreadArray(__spreadArray([], G.script.scenes, true), [newScene], false);
        }
        else {
            (_a = ctx.events) === null || _a === void 0 ? void 0 : _a.endTurn({ next: protagonist });
        }
    }
    else {
        if (G.hand[protagonist].length > 7) {
            var newScene = {
                id: _.uniqueId(),
                mandatory: true,
                endTurnImmediately: false,
                actions: [{
                        type: "action",
                        instructions: [{
                                id: _.uniqueId(),
                                protagonist: protagonist,
                                state: "open",
                                do: {
                                    key: "discard",
                                    info: { count: G.hand[protagonist].length - 7, type: "any" }
                                },
                                ui: { type: "click_on_own_card_in_hand" }
                            }]
                    }]
            };
            G.script.scenes = __spreadArray(__spreadArray([], G.script.scenes, true), [newScene], false);
        }
        else {
            (_b = ctx.events) === null || _b === void 0 ? void 0 : _b.endTurn();
        }
    }
}
function commit(G, ctx, sceneID) {
    G.script.scenes.find(function (sc) { return sc.id === sceneID; }).mandatory = true;
}
function skipExecuteDo(G, ctx, protagonist, instructionID) {
    if ((0, do_1._findInstructionWithID)(G, instructionID) !== null) {
        var _a = (0, do_1._findInstructionWithID)(G, instructionID), scene = _a[0], action = _a[1], instruction = _a[2];
        console.log("cc");
        action.instructions.filter(function (ins) { return ins.protagonist === protagonist; }).forEach(function (ins) { return ins.state = "executed"; });
    }
}
//
function setUIHoverHandIndex(G, ctx, index) {
    if (index === undefined || G.hand[ctx.currentPlayer].length > index) {
        G.uiHoverHandIndex = index;
    }
}
function setUICardToCard(G, ctx, param) {
    if (param !== undefined) {
        G.uiCardToCard = __assign(__assign({}, param), { id: _.uniqueId() });
    }
    else {
        G.uiCardToCard = undefined;
    }
}
exports.default = UnstableUnicorns;
// Helper
function _addSceneFromDo(G, ctx, cardID, owner, trigger) {
    var card = G.deck[cardID];
    if (!card.on) {
        return;
    }
    // all unicorns are basic
    // trigger no effect
    if (G.playerEffects[owner].find(function (s) { return s.effect.key === "my_unicorns_are_basic"; })) {
        if (G.playerEffects[owner].find(function (s) { return s.effect.key === "pandamonium"; }) === undefined) {
            if (card.type === "narwhal" || card.type === "unicorn") {
                return;
            }
        }
    }
    card.on.forEach(function (on) {
        if (on.do.type === "add_scene" && (on.trigger === trigger || trigger === "any")) {
            var newScene = {
                id: _.uniqueId(),
                mandatory: on.do.info.mandatory,
                endTurnImmediately: on.do.info.endTurnImmediately,
                actions: on.do.info.actions.map(function (ac) {
                    var instructions = [];
                    ac.instructions.forEach(function (c) {
                        var protagonists = [];
                        if (c.protagonist === "owner") {
                            protagonists.push(owner);
                        }
                        else if (c.protagonist === "all") {
                            protagonists = G.players.map(function (pl) { return pl.id; });
                        }
                        protagonists.forEach(function (pid) {
                            instructions.push({
                                id: _.uniqueId(),
                                protagonist: pid,
                                state: "open",
                                do: c.do,
                                ui: __assign(__assign({}, c.ui), { info: __assign({ source: card.id }, c.ui.info) }),
                            });
                        });
                    });
                    var action = {
                        type: "action",
                        instructions: instructions
                    };
                    return action;
                })
            };
            G.script.scenes = __spreadArray(__spreadArray([], G.script.scenes, true), [newScene], false);
        }
    });
}
exports._addSceneFromDo = _addSceneFromDo;
// find all scenes that have already started and are not finished
// or all scenes that have not started yet
function _findOpenScenesWithProtagonist(G, protagonist) {
    var scenes = [];
    var stop = false;
    G.script.scenes.forEach(function (scene) {
        scene.actions.forEach(function (action) {
            if (stop) {
                return;
            }
            // find most recent action
            if (action.instructions.filter(function (ins) { return ins.state === "open" || ins.state === "in_progress"; }).length > 0) {
                stop = true;
                var inst = action.instructions.filter(function (ins) { return ins.protagonist === protagonist && (ins.state === "open" || ins.state === "in_progress"); });
                inst.forEach(function (i) { return scenes.push([i, scene]); });
            }
        });
        stop = false;
    });
    return scenes;
}
exports._findOpenScenesWithProtagonist = _findOpenScenesWithProtagonist;
// a scene is in progress if its first action is finished
function _findInProgressScenesWithProtagonist(G, protagonist) {
    var scenes = [];
    var stop = false;
    G.script.scenes.forEach(function (scene) {
        if (scene.mandatory) {
            var action = _.first(scene.actions);
            if (action.instructions.filter(function (ins) { return ins.state === "open" || ins.state === "in_progress"; }).length > 0) {
                stop = true;
                var inst = action.instructions.filter(function (ins) { return ins.protagonist === protagonist && (ins.state === "open" || ins.state === "in_progress"); });
                inst.forEach(function (i) { return scenes.push([i, scene]); });
            }
        }
        scene.actions.forEach(function (action, idx) {
            if (stop || idx === 0) {
                return;
            }
            // find most recent open action excluding the first action
            if (action.instructions.filter(function (ins) { return ins.state === "open" || ins.state === "in_progress"; }).length > 0) {
                // check if the prior action was completed
                if (scene.actions[idx - 1].instructions.filter(function (ins) { return ins.state === "executed"; }).length === scene.actions[idx - 1].instructions.length) {
                    stop = true;
                    var inst = action.instructions.filter(function (ins) { return ins.protagonist === protagonist && (ins.state === "open" || ins.state === "in_progress"); });
                    inst.forEach(function (i) { return scenes.push([i, scene]); });
                }
            }
        });
        stop = false;
    });
    return scenes;
}
exports._findInProgressScenesWithProtagonist = _findInProgressScenesWithProtagonist;
function _findInstruction(G, instructionID) {
    var instruction, action, scene = undefined;
    G.script.scenes.forEach(function (sc) {
        sc.actions.forEach(function (ac) {
            ac.instructions.forEach(function (ic) {
                if (ic.id === instructionID) {
                    instruction = ic;
                    action = ac;
                    scene = sc;
                }
            });
        });
    });
    if (instruction === undefined || action === undefined || scene === undefined) {
        return undefined;
    }
    return [instruction, action, scene];
}
exports._findInstruction = _findInstruction;
