define(['codemirror/addon/mode/simple', "base/js/namespace", 'codemirror/lib/codemirror'], function (cmsm, IPython, CodeMirror) {

    load_mode = function () {

        console.log("tlaplus kernel.js loaded");

        var re_join = function (arr) {
            return new RegExp('^' + arr.map(function (w) { return w.source }).join('|') + '$')
        };

        var reserwed_words_re = re_join([
            /ACTION/, /ASSUME/, /ASSUMPTION/, /AXIOM/, /BY/, /CASE/, /CHOOSE/, /CONSTANTS/,
            /CONSTANT/, /COROLLARY/, /DEF/, /DEFINE/, /DEFS/, /DOMAIN/, /ELSE/, /ENABLED/,
            /EXCEPT/, /EXTENDS/, /HAVE/, /HIDE/, /IF/, /IN/, /INSTANCE/, /LET/, /LAMBDA/,
            /LEMMA/, /LOCAL/, /MODULE/, /NEW/, /OBVIOUS/, /OMITTED/, /ONLY/, /OTHER/, /PICK/,
            /PROOF/, /PROPOSITION/, /PROVE/, /QED/, /RECURSIVE/, /SF_/, /STATE/, /SUFFICES/,
            /SUBSET/, /TAKE/, /TEMPORAL/, /THEN/, /THEOREM/, /UNCHANGED/, /UNION/, /USE/,
            /VARIABLES/, /VARIABLE/, /WF_/, /WITH/, /WITNESS/
        ]);

        // < IDENTIFIER : <CASE0> | <CASE1> | <CASE2> | <CASE3> |  <CASE6> | <CASEN> | "@" >
        //  < #CASE0 : "_" (<LETTER> | "_" | <DIGIT> )* <LETTER> (<LETTER> | "_" | <DIGIT> )*  >
        // | < #CASE1 : <DIGIT> (<LETTER> | "_" | <DIGIT> )* <LETTER> (<LETTER> | "_" | <DIGIT> )*  >
        // | < #CASE2 : ("W" | "S") ( (  ["a"-"z","A"-"E", "G"-"Z", "_"] | <DIGIT> ) (<LETTER> | "_" | <DIGIT> )* )? >
        // | < #CASE3 : ("WF" | "SF") ( ( <LETTER> | <DIGIT> ) (<LETTER> | "_" | <DIGIT> )* )? >
        // | < #CASE6 : ( ["a"-"z","A"-"R", "T"-"V", "X"-"Z"]) (<LETTER> | "_" | <DIGIT> )* >
        // | < #CASEN : (<DIGIT>)+ <LETTER> ( <LETTER> | <DIGIT> | "_" )* >
        var identifier_re = /(?!WF_|SF_)\w*[A-Za-z]\w*/;
        var function_re = /(?!WF_|SF_)\w*[A-Za-z]\w*\s*(?=\()/;
        var definition_re = /(?!WF_|SF_)\w*[A-Za-z]\w*\s*(?===)/;

        // (<DIGIT>)+
        // | "0"
        // | ("\\" ["o","O"] (["0"-"7"])+)
        // | ("\\" ["b","B"] (["0","1"])+)
        // | ("\\" ["h","H"] (["0"-"9","a"-"f","A"-"F"])+ )
        var number_re = /\d+|\\[oO][0-7]+|\\[bB][0-1]+|\\[bB][\da-fA-F]+/;

        // "\""
        // ( (~["\"", "`", "\n", "\r", "\\" ])
        // | ( "`" ( ~["'" ] )* "'")
        // | ( "\\" ["n","t","r","f","\\", "\""] )
        // )*
        // "\""
        var string_re = /"(?:[^\\"]|\\.)*"?/;

        var prefix_re = re_join([
            /\\lnot/, /\\neg/, /~/, /\[\]/, /<>/, /ENABLED/, /UNCHANGED/, /SUBSET/, /UNION/,
            /DOMAIN/
        ]);
        var infix_re = re_join([
            /\\approx/, /\\asymp/, /\\bigcirc/, /\\bullet/, /\\cap/, /\\cdot/,
            /\\circ/, /\\cong/, /\\cup/, /\\div/, /\\doteq/, /\\equiv/, /\\geq/, /\\gg/, /\\in/,
            /\\intersect/, /\\union/, /\\land/, /\\leq/, /\\ll/, /\\lor/, /\\o/, /\\odot/,
            /\\ominus/, /\\oplus/, /\\oslash/, /\\otimes/, /\\prec/, /\\preceq/, /\\propto/,
            /\\sim/, /\\simeq/, /\\sqcap/, /\\sqcup/, /\\sqsubset/, /\\sqsupset/, /\\sqsubseteq/,
            /\\sqsupseteq/, /\\star/, /\\subset/, /\\subseteq/, /\\succ/, /\\succeq/, /\\supset/,
            /\\supseteq/, /\\uplus/, /\\wr/, /\\/, /~>/, /=>/, /=</, /=\|/, /=/, /##/, /#/, /\^\^/,
            /\^/, /--/, /-/, /\*/, /\+\+/, /\+/, /&&/, /&/, /\/\//, /\/\\/, /\/=/, /\//, /\\\//,
            /-\|/, /-\+->/, /\*\*/, /<=>/, /<:/, /<=/, /</, />=/, />/, /\.\.\./, /\.\./, /\|\|/,
            /\|/, /\|-/, /\|=/, /\$\$/, /\$/, /\?\?/, /%%/, /%/, /@@/, /!!/, /:>/, /:=/, /::=/,
            /\(\+\)/, /\(-\)/, /\(.\)/, /\(\/\)/, /\(\\X\)/, /\\notin/, /\\times/, /\\X/
        ]);
        var postfix_re = re_join([/'/, /\^\+/, /\^\*/, /\^#/, /-\./]);

        CodeMirror.defineSimpleMode("tlaplus", {
            start: [
                { regex: reserwed_words_re, token: "keyword" },
                { regex: definition_re, token: "variable-2" },
                { regex: function_re, token: "variable-3" },
                { regex: identifier_re, token: "variable" },

                { regex: number_re, token: "number" },
                { regex: string_re, token: "string" },

                { regex: /\\\*.*/, token: "comment" },
                { regex: /\(\*/, token: "comment", next: "comment" },

                { regex: prefix_re, token: "atom" },
                { regex: infix_re, token: "atom" },
                { regex: postfix_re, token: "atom" },
            ],

            comment: [
                { regex: /.*?\*\)/, token: "comment", next: "start" },
                { regex: /.*/, token: "comment" }
            ],

            meta: {
                dontIndentStates: ["comment"],
                lineComment: '\*'
            }
        });

        CodeMirror.defineMIME("text/x-tlaplus", "tlaplus");

        // assorted kludges to deal with fact that all this stuff can be loaded
        // after full notebook init
        IPython.CodeCell.options_default["cm_config"]["mode"] = "tlaplus";
        [...document.querySelectorAll('.code_cell .CodeMirror')].forEach(c => {
          c.CodeMirror.setOption('mode', 'tlaplus');
        });
        Jupyter.notebook.get_cells().forEach(function(c) {
          c._options.cm_config['mode'] = 'tlaplus';
        });
    }

    return {
        onload: function () {
            load_mode();
            // Enforce buggy loading:
            // setTimeout(load_mode, 3000);
        }
    }
});
