//
// Board Game Score Sheet
//

var bgss = (function () {

    "use strict";

    var Data = [];
    var Game = {
        "185343": {
            "en": "Anachrony",
            "fr": "Anachrony",
            "min": 1,
            "max": 4,
        },
        "216132": {
            "en": "Clans of Caledonia",
            "fr": "Clans of Caledonia",
            "min": 1,
            "max": 4,
        },
        "124361": {
            "en": "Concordia",
            "fr": "Concordia",
            "min": 2,
            "max": 5,
        },
        "193738": {
            "en": "Great Western Trail",
            "fr": "Great Western",
            "min": 2,
            "max": 4,
        },
        "164928": {
            "en": "Orl&eacute;ans",
            "fr": "Orl&eacute;ans",
            "min": 2,
            "max": 5,
        },
    };
    var State = {};
    var Sum = {};

    //
    // update a majority bonus (summed across ranks, rounded down)
    //
    function update_majority (name, bonuses) {
        var seen = {};
        for (var n=1; n<=State.players; n++) {
            if (!seen[Data[n][name]]) seen[Data[n][name]] = [];
            seen[Data[n][name]].push(n);
        }
        var values = Object.keys(seen);
        values.sort(function (a, b) {
            if (parseInt(a) > parseInt(b)) return(-1);
            if (parseInt(a) < parseInt(b)) return(+1);
            return(0);
        });
        var rank = 0;
        $.each(values, function (_, value) {
            var players = seen[value];
            var bonus = 0;
            for (var p=0; p<players.length; p++) {
                bonus += bonuses[rank++];
            }
            bonus = Math.floor(bonus / players.length);
            for (var p=0; p<players.length; p++) {
                Data[players[p]][name + "_bonus"] = bonus;
            }
        });
    }

    //
    // update a sum across all players
    //
    function update_sum (name, sum=0) {
        for (var n=1; n<=State.players; n++) {
            sum += Data[n][name];
        }
        if (name in Sum && Sum[name] == sum)
            return(0);
        Sum[name] = sum;
        return(1);
    }

    //
    // get the value of an <input> element
    //
    function get_value (input) {
        // boolean
        if (input.attr("type") == "checkbox")
            return(input.prop("checked"));
        var value = input.val();
        // empty is 0
        if (!value)
            return(0);
        var valint = parseInt(value);
        // forced to be an integer
        if (valint.toString() != value)
            input.val(valint);
        // so far so good
        return(valint);
    }

    //
    // build the list of games for a given language
    //
    function build_games (lang) {
        var options = [];
        $.each(Game, function (id, game) {
            if (!game[lang]) return;
            options.push([id, game[lang]]);
        });
        options.sort(function (a, b) {
            if (a[1] > b[1]) return(+1);
            if (a[1] < b[1]) return(-1);
            return(0);
        });
        $("#game").data(lang, options);
    }

    //
    // build the player tabs
    //
    function build_tabs (score) {
        // general and per-player data
        for (var n=0; n<=State.players; n++) {
            Data.push({});
        }
        // tabs title
        var elt = $("#tabs").children("li").last();
        for (var n=State.players; n>=1; n--) {
            var href = $("<a>").attr("href", "#player" + n).text(n);
            var tab = $("<li>").addClass("tabs-title").append(href);
            elt.before(tab);
            elt = tab;
        }
        // tabs content
        elt = $("#_player_");
        for (var n=1; n<=State.players; n++) {
            var tab = elt.clone().attr("id", "player" + n);
            tab.find("*").each(function (_) {
                var attr = $(this).attr("id");
                if (attr)  $(this).attr("id", attr + "-" + n);
                attr =     $(this).attr("for");
                if (attr)  $(this).attr("for", attr + "-" + n);
                attr =     $(this).attr("data-index");
                if (attr)  $(this).attr("data-index", n + attr);
            });
            $("#tabs-content").append(tab);
        }
        elt.remove();
        // tabs callback
        $("#tabs").on("change.zf.tabs", function () {
            var id = $("#tabs-content").find(".tabs-panel.is-active").attr("id");
            var name = Game[State.game][State.language];
            if (id && id.startsWith("player")) {
                var n = parseInt(id.substr(6));
                $("#title").html(name + " - " + State.player[n-1]);
            } else {
                $("#title").html(name);
            }
        });
        // bind <input> elements to Data
        $("#tabs-content").find("input,select").each(function (_) {
            var id = $(this).attr("id");
            if (id) {
                var name = id.substr(0, id.length - 2);
                var n = parseInt(id.substr(-1));
                Data[n][name] = get_value($(this));
                if (name == "score") return;
                $(this).change(function () {
                    Data[n][name] = get_value($(this));
                    score(n);
                });
            }
        });
        // update Foundation
        Foundation.reInit($("#tabs"));
    }

    //
    // build the results table
    //
    function build_results () {
        var tbody = $("#results table tbody");
        for (var n=1; n<=State.players; n++) {
            var tr = $("<tr>");
            tr.append($("<td>").html(State.player[n-1]));
            tr.append($("<td>").attr("id", "result-" + n).text("0"));
            tbody.append(tr);
        }
    }

    //
    // setup the <form> elements
    //
    function setup_form () {
        $("form").on("keydown", "input", function (event) {
            if (event.which == 13) {
                event.preventDefault();
                var input = $(event.target);
                var index = input.attr("data-index");
                if (index) {
                    // move focus to next <input>
                    var next = parseInt(index) + 1;
                    $("[data-index=" + next + "]").focus();
                }
            }
        });
    }

    //
    // update the language in the UI
    //
    function update_language () {
        // hide or show simple elements based on the "lang" attribute
        var selector = "[lang=" + State.language + "]";
        $("body").find("[lang]").not(selector).hide();
        $("body").find(selector).show();
        // also update all the language aware <select> elements
        $("#container").find("select.langaware").each(function (_) {
            var select = $(this);
            var value = select.val();
            var options = select.data(State.language);
            select.empty();
            $.each(options, function (_, game) {
                select.append($("<option>").attr("value", game[0]).html(game[1]));
            });
            if (value) select.val(value);
        });
    }

    //
    // update the game in the UI
    //
    function update_game () {
        var game = Game[State.game];
        $("#players").children("option").each(function (_) {
            var n = $(this).attr("value");
            if (game.min <= n && n <= game.max) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    }

    //
    // update the number of players in the UI
    //
    function update_players () {
        $("#container").children("div").each(function (_) {
            var id = $(this).attr("id");
            if (id && id.startsWith("player")) {
                var n = parseInt(id.substr(6));
                if (n <= State.players) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            }
        });
    }

    //
    // update a player in the UI
    //
    function update_player (n) {
        // nothing to do yet...
    }

    //
    // select the first tab
    //
    function select_first_tab () {
        $("#tabs").children("li").first().click();
    }

    //
    // update the UI from the current state
    //
    function state2ui () {
        // language
        $("#language").val(State.language);
        update_language();
        // game
        $("#game").val(State.game);
        update_game();
        // players
        $("#players").val(State.players);
        update_players();
        // player names
        $.each(State.player, function (i, name) {
            var n = i + 1;
            $("input#player" + n).val(name);
            update_player(n);
        });
    }

    //
    // update the local storage from the current state
    //
    function state2storage () {
        if (typeof(Storage) !== "undefined") {
            console.log("store", State);
            localStorage.setItem("bgss", JSON.stringify(State));
        }
    }

    //
    // update the current state from the local storage
    //
    function storage2state () {
        if (typeof(Storage) !== "undefined") {
            var json = localStorage.getItem("bgss");
            if (json) {
                State = JSON.parse(json);
                console.log("fetch", State);
                return;
            }
        }
        // no (good) stored state
        State = {
            "language": "en",
            "game": "164928", // Orleans
            "players": 4,
            "player": ["", "", "", "", "", "", ""],
        };
    }

    //
    // update the current state from the URL
    //
    function url2state () {
        State = {
            "language": "en",
            "players": 4,
            "player": ["1", "2", "3", "4", "5", "6", "7"],
        };
        // note: using the hash since query strings do not work with appcache!
        var hash = window.location.hash;
        if (hash.length) {
            $.each(hash.substr(1).split("&"), function (_, value) {
                var t = value.split("=");
                if (t.length === 2 && (t[0] == "language" || t[0] == "players")) {
                    State[t[0]] = t[1];
                } else if (t.length === 2 && t[0] == "names") {
                    State.player = t[1].split(",").map(decodeURI);
                } else {
                    throw("unexpected query: " + value);
                }
            });
        }
        var match = window.location.pathname.match(/(\d+)\.html$/);
        if (match) {
            var game = Game[match[1]];
            if (game) {
                State.game = match[1];
                $("#title").html(game[State.language]);
                document.title = "BGSS - " + $("#title").text();
            } else {
                throw("unexpected game: " + match[1]);
            }
        } else {
            throw("unexpected pathname: " + window.location.pathname);
        }
        console.log("search", State);
    }

    //
    // there can be only one!
    //
    function highlander (name, n) {
        var data = Data[n];
        if (!data[name]) return;
        for (var p=1; p<=State.players; p++) {
            if (p != n && Data[p][name])
                $("#" + name + "-" + p).click();
        }
    }

    //
    // update a score (Anachrony)
    //
    function score_185343 (n) {
        var data = Data[n];
        data.score = 0;
        data.score += data.buildings;
        data.score += data.projects;
        data.score += data.anomalies * -3;
        data.score += data.travel;
        data.score += data.morale;
        data.score += data.breakthroughs1;
        data.score += data.breakthroughs2;
        data.score += data.breakthroughs3;
        data.score += Math.min(data.breakthroughs1, data.breakthroughs2, data.breakthroughs3) * 2;
        data.score += data.tokens;
        data.score += data.warps * -2;
        if (data.endgame1) data.score += 3;
        if (data.endgame2) data.score += 3;
        if (data.endgame3) data.score += 3;
        if (data.endgame4) data.score += 3;
        if (data.endgame5) data.score += 3;
        console.log("player " + n + " score:", data.score, data);
        $("#score-" + n).val(data.score);
        $("#result-" + n).text(data.score);
    }

    //
    // wrapper to compute global information (Clans of Caledonia)
    //
    function wrapper_216132 (n) {
        var changed = 0;
        // check the imported goods
        changed += update_sum("cotton", 0.1);
        changed += update_sum("tobacco", 0.2);
        changed += update_sum("sugar", 0.3);
        if (changed) {
            var imported = ["cotton", "tobacco", "sugar"];
            imported.sort(function (a, b) {
                if (Sum[a] > Sum[b]) return(+1);
                if (Sum[a] < Sum[b]) return(-1);
                return(0);
            });
            Data[0][imported[0]] = 5;
            Data[0][imported[1]] = 4;
            Data[0][imported[2]] = 3;
        }
        // check the majorities
        changed += update_sum("contracts");
        changed += update_sum("settlements");
        if (State.players >= 3) {
            update_majority("contracts", [12, 6, 0, 0]);
            update_majority("settlements", [18, 12, 6, 0]);
        } else {
            update_majority("contracts", [8, 0]);
            update_majority("contracts", [12, 0]);
        }
        // call the scoring function
        if (changed) {
            console.log("general", Data[0]);
            for (var p=1; p<=State.players; p++) {
                score_216132(p);
            }
        } else {
            score_216132(n);
        }
    }

    //
    // update a score (Clans of Caledonia)
    //
    function score_216132 (n) {
        var data = Data[n];
        data.score = 0;
        data.score += data.glory;
        data.score += data.basic;
        data.score += data.processed * 2;
        data.score += Math.floor(data.money / 10);
        // leftover money breaks ties...
        data.score += (data.money % 10) / 10;
        data.score += data.hops;
        data.score += data.cotton * Data[0].cotton;
        data.score += data.tobacco * Data[0].tobacco;
        data.score += data.sugar * Data[0].sugar;
        data.score += data.contracts_bonus;
        data.score += data.settlements_bonus;
        console.log("player " + n + " score:", data.score, data);
        $("#score-" + n).val(data.score);
        $("#result-" + n).text(data.score);
    }

    //
    // update a score (Concordia)
    //
    function score_124361 (n) {
        var data = Data[n];
        // consistency check: only one player can be first to finish!
        highlander("first", n);
        data.score = 0;
        data.score += Math.floor(data.money / 10);
        data.score += data.jupiter * data.houses;
        data.score += data.saturnus * data.provinces;
        data.score += data.mercurius * data.types;
        data.score += data.mars * data.colonists;
        data.score += data.brick * 3;
        data.score += data.food * 3;
        data.score += data.tool * 3;
        data.score += data.wine * 4;
        data.score += data.cloth * 5;
        if (data.first) data.score += 7;
        console.log("player " + n + " score:", data.score, data);
        $("#score-" + n).val(data.score);
        $("#result-" + n).text(data.score);
    }

    //
    // update a score (Great Western Trail)
    //
    function score_193738 (n) {
        var data = Data[n];
        // consistency check: only one player can have the "job market" token!
        highlander("job", n);
        data.score = 0;
        data.score += Math.floor(data.money / 5);
        data.score += data.buildings;
        data.score += data.cities;
        data.score += data.stations;
        data.score += data.hazard;
        data.score += data.cattle;
        data.score += data.objective;
        data.score += data.master;
        data.score += data.workers * 4;
        if (data.disc) data.score += 3;
        if (data.job) data.score += 2;
        console.log("player " + n + " score:", data.score, data);
        $("#score-" + n).val(data.score);
        $("#result-" + n).text(data.score);
    }

    //
    // update a score (Orleans)
    //
    function score_164928 (n) {
        var data = Data[n];
        data.score = 0;
        data.score += data.coins;
        data.score += data.grain;
        data.score += data.cheese * 2;
        data.score += data.wine * 3;
        data.score += data.wool * 4;
        data.score += data.brocade * 5;
        data.score += (data.citizens + data.stations) * data.development;
        console.log("player " + n + " score:", data.score, data);
        $("#score-" + n).val(data.score);
        $("#result-" + n).text(data.score);
    }

    //
    // public API
    //
    return({

        "init_main": function () {
            build_games("en");
            build_games("fr");
            setup_form();
            $("#language").change(function () {
                State.language = $(this).val();
                console.log("language changed:", State.language);
                update_language();
                state2storage();
            });
            $("#game").change(function () {
                State.game = $(this).val();
                console.log("game changed:", State.game);
                update_game();
                state2storage();
            });
            $("#players").change(function () {
                State.players = $(this).val();
                console.log("players changed:", State.players);
                update_players();
                state2storage();
            });
            $("#container").find("input").each(function (_) {
                var id = $(this).attr("id");
                if (id && id.startsWith("player")) {
                    var n = parseInt(id.substr(6));
                    $(this).change(function () {
                        State.player[n-1] = $(this).val().trim();
                        console.log("player " + n + " changed:", State.player[n-1]);
                        update_player(n);
                        state2storage();
                    });
                }
            });
            $("#clear").click(function () {
                for (var n=1; n<=7; n++) {
                    State.player[n-1] = "";
                    $("input#player" + n).val("");
                    update_player(n);
                }
                state2storage();
            });
            $("#next").click(function () {
                var names = [];
                for (var n=1; n<=State.players; n++) {
                    names.push(State.player[n-1] || n);
                }
                var url = State.game + ".html" +
                    "#language=" + State.language +
                    "&players=" + State.players +
                    "&names=" + names.map(encodeURI).join(",");
                window.location.href = url;
            });
            storage2state();
            state2ui();
        },

        "init_124361": function () {
            url2state();
            build_results();
            build_tabs(score_124361);
            setup_form();
            update_language();
            select_first_tab();
        },

        "init_164928": function () {
            url2state();
            build_results();
            build_tabs(score_164928);
            setup_form();
            update_language();
            select_first_tab();
        },

        "init_185343": function () {
            url2state();
            build_results();
            build_tabs(score_185343);
            setup_form();
            update_language();
            select_first_tab();
        },

        "init_193738": function () {
            url2state();
            build_results();
            build_tabs(score_193738);
            setup_form();
            update_language();
            select_first_tab();
        },

        "init_216132": function () {
            url2state();
            build_results();
            build_tabs(wrapper_216132);
            setup_form();
            update_language();
            select_first_tab();
            wrapper_216132(0);
        },

    });

})();
