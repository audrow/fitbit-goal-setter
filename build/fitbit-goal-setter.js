const { Deno: Deno6  } = globalThis;
const noColor = typeof Deno6?.noColor === "boolean" ? Deno6.noColor : true;
let enabled = !noColor;
function code(open, close) {
    return {
        open: `\x1b[${open.join(";")}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g")
    };
}
function run(str1, code1) {
    return enabled ? `${code1.open}${str1.replace(code1.regexp, code1.open)}${code1.close}` : str1;
}
function bold(str2) {
    return run(str2, code([
        1
    ], 22));
}
function red(str3) {
    return run(str3, code([
        31
    ], 39));
}
function green(str4) {
    return run(str4, code([
        32
    ], 39));
}
function white(str5) {
    return run(str5, code([
        37
    ], 39));
}
function gray(str6) {
    return brightBlack(str6);
}
function brightBlack(str7) {
    return run(str7, code([
        90
    ], 39));
}
function bgRed(str8) {
    return run(str8, code([
        41
    ], 49));
}
function bgGreen(str9) {
    return run(str9, code([
        42
    ], 49));
}
new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))", 
].join("|"), "g");
var DiffType;
(function(DiffType2) {
    DiffType2["removed"] = "removed";
    DiffType2["common"] = "common";
    DiffType2["added"] = "added";
})(DiffType || (DiffType = {}));
const REMOVED = 1;
const COMMON = 2;
const ADDED = 3;
function createCommon(A, B, reverse) {
    const common = [];
    if (A.length === 0 || B.length === 0) return [];
    for(let i1 = 0; i1 < Math.min(A.length, B.length); i1 += 1){
        if (A[reverse ? A.length - i1 - 1 : i1] === B[reverse ? B.length - i1 - 1 : i1]) {
            common.push(A[reverse ? A.length - i1 - 1 : i1]);
        } else {
            return common;
        }
    }
    return common;
}
function diff(A1, B1) {
    const prefixCommon = createCommon(A1, B1);
    const suffixCommon = createCommon(A1.slice(prefixCommon.length), B1.slice(prefixCommon.length), true).reverse();
    A1 = suffixCommon.length ? A1.slice(prefixCommon.length, -suffixCommon.length) : A1.slice(prefixCommon.length);
    B1 = suffixCommon.length ? B1.slice(prefixCommon.length, -suffixCommon.length) : B1.slice(prefixCommon.length);
    const swapped1 = B1.length > A1.length;
    [A1, B1] = swapped1 ? [
        B1,
        A1
    ] : [
        A1,
        B1
    ];
    const M1 = A1.length;
    const N1 = B1.length;
    if (!M1 && !N1 && !suffixCommon.length && !prefixCommon.length) return [];
    if (!N1) {
        return [
            ...prefixCommon.map((c)=>({
                    type: DiffType.common,
                    value: c
                })
            ),
            ...A1.map((a)=>({
                    type: swapped1 ? DiffType.added : DiffType.removed,
                    value: a
                })
            ),
            ...suffixCommon.map((c)=>({
                    type: DiffType.common,
                    value: c
                })
            ), 
        ];
    }
    const offset = N1;
    const delta = M1 - N1;
    const size = M1 + N1 + 1;
    const fp1 = Array.from({
        length: size
    }, ()=>({
            y: -1,
            id: -1
        })
    );
    const routes = new Uint32Array((M1 * N1 + size + 1) * 2);
    const diffTypesPtrOffset = routes.length / 2;
    let ptr = 0;
    let p = -1;
    function backTrace(A, B, current, swapped) {
        const M = A.length;
        const N = B.length;
        const result = [];
        let a = M - 1;
        let b = N - 1;
        let j = routes[current.id];
        let type = routes[current.id + diffTypesPtrOffset];
        while(true){
            if (!j && !type) break;
            const prev = j;
            if (type === 1) {
                result.unshift({
                    type: swapped ? DiffType.removed : DiffType.added,
                    value: B[b]
                });
                b -= 1;
            } else if (type === 3) {
                result.unshift({
                    type: swapped ? DiffType.added : DiffType.removed,
                    value: A[a]
                });
                a -= 1;
            } else {
                result.unshift({
                    type: DiffType.common,
                    value: A[a]
                });
                a -= 1;
                b -= 1;
            }
            j = routes[prev];
            type = routes[prev + diffTypesPtrOffset];
        }
        return result;
    }
    function createFP(slide, down, k, M) {
        if (slide && slide.y === -1 && down && down.y === -1) {
            return {
                y: 0,
                id: 0
            };
        }
        if (down && down.y === -1 || k === M || (slide && slide.y) > (down && down.y) + 1) {
            const prev = slide.id;
            ptr++;
            routes[ptr] = prev;
            routes[ptr + diffTypesPtrOffset] = ADDED;
            return {
                y: slide.y,
                id: ptr
            };
        } else {
            const prev = down.id;
            ptr++;
            routes[ptr] = prev;
            routes[ptr + diffTypesPtrOffset] = REMOVED;
            return {
                y: down.y + 1,
                id: ptr
            };
        }
    }
    function snake(k, slide, down, _offset, A, B) {
        const M = A.length;
        const N = B.length;
        if (k < -N || M < k) return {
            y: -1,
            id: -1
        };
        const fp = createFP(slide, down, k, M);
        while(fp.y + k < M && fp.y < N && A[fp.y + k] === B[fp.y]){
            const prev = fp.id;
            ptr++;
            fp.id = ptr;
            fp.y += 1;
            routes[ptr] = prev;
            routes[ptr + diffTypesPtrOffset] = COMMON;
        }
        return fp;
    }
    while(fp1[delta + offset].y < N1){
        p = p + 1;
        for(let k = -p; k < delta; ++k){
            fp1[k + offset] = snake(k, fp1[k - 1 + offset], fp1[k + 1 + offset], offset, A1, B1);
        }
        for(let k1 = delta + p; k1 > delta; --k1){
            fp1[k1 + offset] = snake(k1, fp1[k1 - 1 + offset], fp1[k1 + 1 + offset], offset, A1, B1);
        }
        fp1[delta + offset] = snake(delta, fp1[delta - 1 + offset], fp1[delta + 1 + offset], offset, A1, B1);
    }
    return [
        ...prefixCommon.map((c)=>({
                type: DiffType.common,
                value: c
            })
        ),
        ...backTrace(A1, B1, fp1[delta + offset], swapped1),
        ...suffixCommon.map((c)=>({
                type: DiffType.common,
                value: c
            })
        ), 
    ];
}
function diffstr(A, B) {
    function unescape(string) {
        return string.replaceAll("\b", "\\b").replaceAll("\f", "\\f").replaceAll("\t", "\\t").replaceAll("\v", "\\v").replaceAll(/\r\n|\r|\n/g, (str10)=>str10 === "\r" ? "\\r" : str10 === "\n" ? "\\n\n" : "\\r\\n\r\n"
        );
    }
    function tokenize(string, { wordDiff =false  } = {}) {
        if (wordDiff) {
            const tokens = string.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/);
            const words = /^[a-zA-Z\u{C0}-\u{FF}\u{D8}-\u{F6}\u{F8}-\u{2C6}\u{2C8}-\u{2D7}\u{2DE}-\u{2FF}\u{1E00}-\u{1EFF}]+$/u;
            for(let i2 = 0; i2 < tokens.length - 1; i2++){
                if (!tokens[i2 + 1] && tokens[i2 + 2] && words.test(tokens[i2]) && words.test(tokens[i2 + 2])) {
                    tokens[i2] += tokens[i2 + 2];
                    tokens.splice(i2 + 1, 2);
                    i2--;
                }
            }
            return tokens.filter((token)=>token
            );
        } else {
            const tokens = [], lines = string.split(/(\n|\r\n)/);
            if (!lines[lines.length - 1]) {
                lines.pop();
            }
            for(let i3 = 0; i3 < lines.length; i3++){
                if (i3 % 2) {
                    tokens[tokens.length - 1] += lines[i3];
                } else {
                    tokens.push(lines[i3]);
                }
            }
            return tokens;
        }
    }
    function createDetails(line, tokens) {
        return tokens.filter(({ type  })=>type === line.type || type === DiffType.common
        ).map((result, i, t)=>{
            if (result.type === DiffType.common && t[i - 1] && t[i - 1]?.type === t[i + 1]?.type && /\s+/.test(result.value)) {
                result.type = t[i - 1].type;
            }
            return result;
        });
    }
    const diffResult = diff(tokenize(`${unescape(A)}\n`), tokenize(`${unescape(B)}\n`));
    const added = [], removed = [];
    for (const result1 of diffResult){
        if (result1.type === DiffType.added) {
            added.push(result1);
        }
        if (result1.type === DiffType.removed) {
            removed.push(result1);
        }
    }
    const aLines = added.length < removed.length ? added : removed;
    const bLines = aLines === removed ? added : removed;
    for (const a of aLines){
        let tokens = [], b;
        while(bLines.length){
            b = bLines.shift();
            tokens = diff(tokenize(a.value, {
                wordDiff: true
            }), tokenize(b?.value ?? "", {
                wordDiff: true
            }));
            if (tokens.some(({ type , value  })=>type === DiffType.common && value.trim().length
            )) {
                break;
            }
        }
        a.details = createDetails(a, tokens);
        if (b) {
            b.details = createDetails(b, tokens);
        }
    }
    return diffResult;
}
const CAN_NOT_DISPLAY = "[Cannot display]";
class AssertionError extends Error {
    name = "AssertionError";
    constructor(message){
        super(message);
    }
}
function _format(v) {
    const { Deno: Deno2  } = globalThis;
    return typeof Deno2?.inspect === "function" ? Deno2.inspect(v, {
        depth: Infinity,
        sorted: true,
        trailingComma: true,
        compact: false,
        iterableLimit: Infinity
    }) : `"${String(v).replace(/(?=["\\])/g, "\\")}"`;
}
function createColor(diffType, { background =false  } = {}) {
    switch(diffType){
        case DiffType.added:
            return (s)=>background ? bgGreen(white(s)) : green(bold(s))
            ;
        case DiffType.removed:
            return (s)=>background ? bgRed(white(s)) : red(bold(s))
            ;
        default:
            return white;
    }
}
function createSign(diffType) {
    switch(diffType){
        case DiffType.added:
            return "+   ";
        case DiffType.removed:
            return "-   ";
        default:
            return "    ";
    }
}
function buildMessage(diffResult, { stringDiff =false  } = {}) {
    const messages = [], diffMessages = [];
    messages.push("");
    messages.push("");
    messages.push(`    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${green(bold("Expected"))}`);
    messages.push("");
    messages.push("");
    diffResult.forEach((result)=>{
        const c = createColor(result.type);
        const line = result.details?.map((detail)=>detail.type !== DiffType.common ? createColor(detail.type, {
                background: true
            })(detail.value) : detail.value
        ).join("") ?? result.value;
        diffMessages.push(c(`${createSign(result.type)}${line}`));
    });
    messages.push(...stringDiff ? [
        diffMessages.join("")
    ] : diffMessages);
    messages.push("");
    return messages;
}
function isKeyedCollection(x) {
    return [
        Symbol.iterator,
        "size"
    ].every((k)=>k in x
    );
}
function equal(c, d) {
    const seen = new Map();
    return (function compare(a, b) {
        if (a && b && (a instanceof RegExp && b instanceof RegExp || a instanceof URL && b instanceof URL)) {
            return String(a) === String(b);
        }
        if (a instanceof Date && b instanceof Date) {
            const aTime = a.getTime();
            const bTime = b.getTime();
            if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
                return true;
            }
            return a.getTime() === b.getTime();
        }
        if (typeof a === "number" && typeof b === "number") {
            return Number.isNaN(a) && Number.isNaN(b) || a === b;
        }
        if (Object.is(a, b)) {
            return true;
        }
        if (a && typeof a === "object" && b && typeof b === "object") {
            if (a && b && !constructorsEqual(a, b)) {
                return false;
            }
            if (a instanceof WeakMap || b instanceof WeakMap) {
                if (!(a instanceof WeakMap && b instanceof WeakMap)) return false;
                throw new TypeError("cannot compare WeakMap instances");
            }
            if (a instanceof WeakSet || b instanceof WeakSet) {
                if (!(a instanceof WeakSet && b instanceof WeakSet)) return false;
                throw new TypeError("cannot compare WeakSet instances");
            }
            if (seen.get(a) === b) {
                return true;
            }
            if (Object.keys(a || {}).length !== Object.keys(b || {}).length) {
                return false;
            }
            if (isKeyedCollection(a) && isKeyedCollection(b)) {
                if (a.size !== b.size) {
                    return false;
                }
                let unmatchedEntries = a.size;
                for (const [aKey, aValue] of a.entries()){
                    for (const [bKey, bValue] of b.entries()){
                        if (aKey === aValue && bKey === bValue && compare(aKey, bKey) || compare(aKey, bKey) && compare(aValue, bValue)) {
                            unmatchedEntries--;
                        }
                    }
                }
                return unmatchedEntries === 0;
            }
            const merged = {
                ...a,
                ...b
            };
            for (const key of [
                ...Object.getOwnPropertyNames(merged),
                ...Object.getOwnPropertySymbols(merged), 
            ]){
                if (!compare(a && a[key], b && b[key])) {
                    return false;
                }
                if (key in a && !(key in b) || key in b && !(key in a)) {
                    return false;
                }
            }
            seen.set(a, b);
            if (a instanceof WeakRef || b instanceof WeakRef) {
                if (!(a instanceof WeakRef && b instanceof WeakRef)) return false;
                return compare(a.deref(), b.deref());
            }
            return true;
        }
        return false;
    })(c, d);
}
function constructorsEqual(a, b) {
    return a.constructor === b.constructor || a.constructor === Object && !b.constructor || !a.constructor && b.constructor === Object;
}
function assertNotEquals(actual, expected, msg) {
    if (!equal(actual, expected)) {
        return;
    }
    let actualString;
    let expectedString;
    try {
        actualString = String(actual);
    } catch  {
        actualString = "[Cannot display]";
    }
    try {
        expectedString = String(expected);
    } catch  {
        expectedString = "[Cannot display]";
    }
    if (!msg) {
        msg = `actual: ${actualString} expected: ${expectedString}`;
    }
    throw new AssertionError(msg);
}
function assertStrictEquals(actual, expected, msg) {
    if (actual === expected) {
        return;
    }
    let message;
    if (msg) {
        message = msg;
    } else {
        const actualString = _format(actual);
        const expectedString = _format(expected);
        if (actualString === expectedString) {
            const withOffset = actualString.split("\n").map((l)=>`    ${l}`
            ).join("\n");
            message = `Values have the same structure but are not reference-equal:\n\n${red(withOffset)}\n`;
        } else {
            try {
                const stringDiff = typeof actual === "string" && typeof expected === "string";
                const diffResult = stringDiff ? diffstr(actual, expected) : diff(actualString.split("\n"), expectedString.split("\n"));
                const diffMsg = buildMessage(diffResult, {
                    stringDiff
                }).join("\n");
                message = `Values are not strictly equal:\n${diffMsg}`;
            } catch  {
                message = `\n${red(CAN_NOT_DISPLAY)} + \n\n`;
            }
        }
    }
    throw new AssertionError(message);
}
const osType = (()=>{
    const { Deno: Deno3  } = globalThis;
    if (typeof Deno3?.build?.os === "string") {
        return Deno3.build.os;
    }
    const { navigator  } = globalThis;
    if (navigator?.appVersion?.includes?.("Win") ?? false) {
        return "windows";
    }
    return "linux";
})();
const isWindows = osType === "windows";
const CHAR_FORWARD_SLASH = 47;
function assertPath(path5) {
    if (typeof path5 !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path5)}`);
    }
}
function isPosixPathSeparator(code2) {
    return code2 === 47;
}
function isPathSeparator(code3) {
    return isPosixPathSeparator(code3) || code3 === 92;
}
function isWindowsDeviceRoot(code4) {
    return code4 >= 97 && code4 <= 122 || code4 >= 65 && code4 <= 90;
}
function normalizeString(path6, allowAboveRoot, separator, isPathSeparator1) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code5;
    for(let i4 = 0, len = path6.length; i4 <= len; ++i4){
        if (i4 < len) code5 = path6.charCodeAt(i4);
        else if (isPathSeparator1(code5)) break;
        else code5 = CHAR_FORWARD_SLASH;
        if (isPathSeparator1(code5)) {
            if (lastSlash === i4 - 1 || dots === 1) {} else if (lastSlash !== i4 - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i4;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i4;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path6.slice(lastSlash + 1, i4);
                else res = path6.slice(lastSlash + 1, i4);
                lastSegmentLength = i4 - lastSlash - 1;
            }
            lastSlash = i4;
            dots = 0;
        } else if (code5 === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format1(sep6, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (dir === pathObject.root) return dir + base;
    return dir + sep6 + base;
}
const WHITESPACE_ENCODINGS = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS[c] ?? c;
    });
}
class DenoStdInternalError extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError(msg);
    }
}
const sep = "\\";
const delimiter = ";";
function resolve(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i5 = pathSegments.length - 1; i5 >= -1; i5--){
        let path7;
        const { Deno: Deno4  } = globalThis;
        if (i5 >= 0) {
            path7 = pathSegments[i5];
        } else if (!resolvedDevice) {
            if (typeof Deno4?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path7 = Deno4.cwd();
        } else {
            if (typeof Deno4?.env?.get !== "function" || typeof Deno4?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path7 = Deno4.cwd();
            if (path7 === undefined || path7.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path7 = `${resolvedDevice}\\`;
            }
        }
        assertPath(path7);
        const len = path7.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute1 = false;
        const code6 = path7.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator(code6)) {
                isAbsolute1 = true;
                if (isPathSeparator(path7.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator(path7.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path7.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator(path7.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator(path7.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path7.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path7.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot(code6)) {
                if (path7.charCodeAt(1) === 58) {
                    device = path7.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator(path7.charCodeAt(2))) {
                            isAbsolute1 = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator(code6)) {
            rootEnd = 1;
            isAbsolute1 = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path7.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute1;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize(path8) {
    assertPath(path8);
    const len = path8.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute2 = false;
    const code7 = path8.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code7)) {
            isAbsolute2 = true;
            if (isPathSeparator(path8.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path8.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path8.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path8.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path8.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path8.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path8.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot(code7)) {
            if (path8.charCodeAt(1) === 58) {
                device = path8.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path8.charCodeAt(2))) {
                        isAbsolute2 = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator(code7)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString(path8.slice(rootEnd), !isAbsolute2, "\\", isPathSeparator);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute2) tail = ".";
    if (tail.length > 0 && isPathSeparator(path8.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute2) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute2) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute(path9) {
    assertPath(path9);
    const len = path9.length;
    if (len === 0) return false;
    const code8 = path9.charCodeAt(0);
    if (isPathSeparator(code8)) {
        return true;
    } else if (isWindowsDeviceRoot(code8)) {
        if (len > 2 && path9.charCodeAt(1) === 58) {
            if (isPathSeparator(path9.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i6 = 0; i6 < pathsCount; ++i6){
        const path10 = paths[i6];
        assertPath(path10);
        if (path10.length > 0) {
            if (joined === undefined) joined = firstPart = path10;
            else joined += `\\${path10}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert(firstPart != null);
    if (isPathSeparator(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize(joined);
}
function relative(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    const fromOrig = resolve(from);
    const toOrig = resolve(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i7 = 0;
    for(; i7 <= length; ++i7){
        if (i7 === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i7) === 92) {
                    return toOrig.slice(toStart + i7 + 1);
                } else if (i7 === 2) {
                    return toOrig.slice(toStart + i7);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i7) === 92) {
                    lastCommonSep = i7;
                } else if (i7 === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i7);
        const toCode = to.charCodeAt(toStart + i7);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i7;
    }
    if (i7 !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i7 = fromStart + lastCommonSep + 1; i7 <= fromEnd; ++i7){
        if (i7 === fromEnd || from.charCodeAt(i7) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath(path11) {
    if (typeof path11 !== "string") return path11;
    if (path11.length === 0) return "";
    const resolvedPath = resolve(path11);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code9 = resolvedPath.charCodeAt(2);
                if (code9 !== 63 && code9 !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path11;
}
function dirname(path12) {
    assertPath(path12);
    const len = path12.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code10 = path12.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code10)) {
            rootEnd = offset = 1;
            if (isPathSeparator(path12.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path12.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path12.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path12.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path12;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code10)) {
            if (path12.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator(path12.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator(code10)) {
        return path12;
    }
    for(let i8 = len - 1; i8 >= offset; --i8){
        if (isPathSeparator(path12.charCodeAt(i8))) {
            if (!matchedSlash) {
                end = i8;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return path12.slice(0, end);
}
function basename(path13, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path13);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i9;
    if (path13.length >= 2) {
        const drive = path13.charCodeAt(0);
        if (isWindowsDeviceRoot(drive)) {
            if (path13.charCodeAt(1) === 58) start = 2;
        }
    }
    if (ext !== undefined && ext.length > 0 && ext.length <= path13.length) {
        if (ext.length === path13.length && ext === path13) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i9 = path13.length - 1; i9 >= start; --i9){
            const code11 = path13.charCodeAt(i9);
            if (isPathSeparator(code11)) {
                if (!matchedSlash) {
                    start = i9 + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i9 + 1;
                }
                if (extIdx >= 0) {
                    if (code11 === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i9;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path13.length;
        return path13.slice(start, end);
    } else {
        for(i9 = path13.length - 1; i9 >= start; --i9){
            if (isPathSeparator(path13.charCodeAt(i9))) {
                if (!matchedSlash) {
                    start = i9 + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i9 + 1;
            }
        }
        if (end === -1) return "";
        return path13.slice(start, end);
    }
}
function extname(path14) {
    assertPath(path14);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path14.length >= 2 && path14.charCodeAt(1) === 58 && isWindowsDeviceRoot(path14.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i10 = path14.length - 1; i10 >= start; --i10){
        const code12 = path14.charCodeAt(i10);
        if (isPathSeparator(code12)) {
            if (!matchedSlash) {
                startPart = i10 + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i10 + 1;
        }
        if (code12 === 46) {
            if (startDot === -1) startDot = i10;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path14.slice(startDot, end);
}
function format(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format1("\\", pathObject);
}
function parse(path15) {
    assertPath(path15);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path15.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code13 = path15.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code13)) {
            rootEnd = 1;
            if (isPathSeparator(path15.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path15.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path15.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path15.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code13)) {
            if (path15.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path15.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path15;
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path15;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator(code13)) {
        ret.root = ret.dir = path15;
        return ret;
    }
    if (rootEnd > 0) ret.root = path15.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i11 = path15.length - 1;
    let preDotState = 0;
    for(; i11 >= rootEnd; --i11){
        code13 = path15.charCodeAt(i11);
        if (isPathSeparator(code13)) {
            if (!matchedSlash) {
                startPart = i11 + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i11 + 1;
        }
        if (code13 === 46) {
            if (startDot === -1) startDot = i11;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path15.slice(startPart, end);
        }
    } else {
        ret.name = path15.slice(startPart, startDot);
        ret.base = path15.slice(startPart, end);
        ret.ext = path15.slice(startDot, end);
    }
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path15.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path16 = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path16 = `\\\\${url.hostname}${path16}`;
    }
    return path16;
}
function toFileUrl(path17) {
    if (!isAbsolute(path17)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path17.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod = {
    sep: sep,
    delimiter: delimiter,
    resolve: resolve,
    normalize: normalize,
    isAbsolute: isAbsolute,
    join: join,
    relative: relative,
    toNamespacedPath: toNamespacedPath,
    dirname: dirname,
    basename: basename,
    extname: extname,
    format: format,
    parse: parse,
    fromFileUrl: fromFileUrl,
    toFileUrl: toFileUrl
};
const sep1 = "/";
const delimiter1 = ":";
function resolve1(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i12 = pathSegments.length - 1; i12 >= -1 && !resolvedAbsolute; i12--){
        let path18;
        if (i12 >= 0) path18 = pathSegments[i12];
        else {
            const { Deno: Deno5  } = globalThis;
            if (typeof Deno5?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path18 = Deno5.cwd();
        }
        assertPath(path18);
        if (path18.length === 0) {
            continue;
        }
        resolvedPath = `${path18}/${resolvedPath}`;
        resolvedAbsolute = path18.charCodeAt(0) === CHAR_FORWARD_SLASH;
    }
    resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize1(path19) {
    assertPath(path19);
    if (path19.length === 0) return ".";
    const isAbsolute1 = path19.charCodeAt(0) === 47;
    const trailingSeparator = path19.charCodeAt(path19.length - 1) === 47;
    path19 = normalizeString(path19, !isAbsolute1, "/", isPosixPathSeparator);
    if (path19.length === 0 && !isAbsolute1) path19 = ".";
    if (path19.length > 0 && trailingSeparator) path19 += "/";
    if (isAbsolute1) return `/${path19}`;
    return path19;
}
function isAbsolute1(path20) {
    assertPath(path20);
    return path20.length > 0 && path20.charCodeAt(0) === 47;
}
function join1(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i13 = 0, len = paths.length; i13 < len; ++i13){
        const path21 = paths[i13];
        assertPath(path21);
        if (path21.length > 0) {
            if (!joined) joined = path21;
            else joined += `/${path21}`;
        }
    }
    if (!joined) return ".";
    return normalize1(joined);
}
function relative1(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    from = resolve1(from);
    to = resolve1(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 47) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 47) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i14 = 0;
    for(; i14 <= length; ++i14){
        if (i14 === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i14) === 47) {
                    return to.slice(toStart + i14 + 1);
                } else if (i14 === 0) {
                    return to.slice(toStart + i14);
                }
            } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i14) === 47) {
                    lastCommonSep = i14;
                } else if (i14 === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i14);
        const toCode = to.charCodeAt(toStart + i14);
        if (fromCode !== toCode) break;
        else if (fromCode === 47) lastCommonSep = i14;
    }
    let out = "";
    for(i14 = fromStart + lastCommonSep + 1; i14 <= fromEnd; ++i14){
        if (i14 === fromEnd || from.charCodeAt(i14) === 47) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (to.charCodeAt(toStart) === 47) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath1(path22) {
    return path22;
}
function dirname1(path23) {
    assertPath(path23);
    if (path23.length === 0) return ".";
    const hasRoot = path23.charCodeAt(0) === 47;
    let end = -1;
    let matchedSlash = true;
    for(let i15 = path23.length - 1; i15 >= 1; --i15){
        if (path23.charCodeAt(i15) === 47) {
            if (!matchedSlash) {
                end = i15;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end === 1) return "//";
    return path23.slice(0, end);
}
function basename1(path24, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path24);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i16;
    if (ext !== undefined && ext.length > 0 && ext.length <= path24.length) {
        if (ext.length === path24.length && ext === path24) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i16 = path24.length - 1; i16 >= 0; --i16){
            const code14 = path24.charCodeAt(i16);
            if (code14 === 47) {
                if (!matchedSlash) {
                    start = i16 + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i16 + 1;
                }
                if (extIdx >= 0) {
                    if (code14 === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i16;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path24.length;
        return path24.slice(start, end);
    } else {
        for(i16 = path24.length - 1; i16 >= 0; --i16){
            if (path24.charCodeAt(i16) === 47) {
                if (!matchedSlash) {
                    start = i16 + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i16 + 1;
            }
        }
        if (end === -1) return "";
        return path24.slice(start, end);
    }
}
function extname1(path25) {
    assertPath(path25);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i17 = path25.length - 1; i17 >= 0; --i17){
        const code15 = path25.charCodeAt(i17);
        if (code15 === 47) {
            if (!matchedSlash) {
                startPart = i17 + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i17 + 1;
        }
        if (code15 === 46) {
            if (startDot === -1) startDot = i17;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path25.slice(startDot, end);
}
function format1(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format1("/", pathObject);
}
function parse1(path26) {
    assertPath(path26);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path26.length === 0) return ret;
    const isAbsolute2 = path26.charCodeAt(0) === 47;
    let start;
    if (isAbsolute2) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i18 = path26.length - 1;
    let preDotState = 0;
    for(; i18 >= start; --i18){
        const code16 = path26.charCodeAt(i18);
        if (code16 === 47) {
            if (!matchedSlash) {
                startPart = i18 + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i18 + 1;
        }
        if (code16 === 46) {
            if (startDot === -1) startDot = i18;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute2) {
                ret.base = ret.name = path26.slice(1, end);
            } else {
                ret.base = ret.name = path26.slice(startPart, end);
            }
        }
    } else {
        if (startPart === 0 && isAbsolute2) {
            ret.name = path26.slice(1, startDot);
            ret.base = path26.slice(1, end);
        } else {
            ret.name = path26.slice(startPart, startDot);
            ret.base = path26.slice(startPart, end);
        }
        ret.ext = path26.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path26.slice(0, startPart - 1);
    else if (isAbsolute2) ret.dir = "/";
    return ret;
}
function fromFileUrl1(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl1(path27) {
    if (!isAbsolute1(path27)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(path27.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod1 = {
    sep: sep1,
    delimiter: delimiter1,
    resolve: resolve1,
    normalize: normalize1,
    isAbsolute: isAbsolute1,
    join: join1,
    relative: relative1,
    toNamespacedPath: toNamespacedPath1,
    dirname: dirname1,
    basename: basename1,
    extname: extname1,
    format: format1,
    parse: parse1,
    fromFileUrl: fromFileUrl1,
    toFileUrl: toFileUrl1
};
const path = isWindows ? mod : mod1;
const { join: join2 , normalize: normalize2  } = path;
const path1 = isWindows ? mod : mod1;
const { basename: basename2 , delimiter: delimiter2 , dirname: dirname2 , extname: extname2 , format: format2 , fromFileUrl: fromFileUrl2 , isAbsolute: isAbsolute2 , join: join3 , normalize: normalize3 , parse: parse2 , relative: relative2 , resolve: resolve2 , sep: sep2 , toFileUrl: toFileUrl2 , toNamespacedPath: toNamespacedPath2 ,  } = path1;
'use strict';
const align = {
    right: alignRight,
    center: alignCenter
};
const right = 1;
const left = 3;
class UI {
    constructor(opts){
        var _a;
        this.width = opts.width;
        this.wrap = (_a = opts.wrap) !== null && _a !== void 0 ? _a : true;
        this.rows = [];
    }
    span(...args) {
        const cols = this.div(...args);
        cols.span = true;
    }
    resetOutput() {
        this.rows = [];
    }
    div(...args) {
        if (args.length === 0) {
            this.div('');
        }
        if (this.wrap && this.shouldApplyLayoutDSL(...args) && typeof args[0] === 'string') {
            return this.applyLayoutDSL(args[0]);
        }
        const cols = args.map((arg)=>{
            if (typeof arg === 'string') {
                return this.colFromString(arg);
            }
            return arg;
        });
        this.rows.push(cols);
        return cols;
    }
    shouldApplyLayoutDSL(...args) {
        return args.length === 1 && typeof args[0] === 'string' && /[\t\n]/.test(args[0]);
    }
    applyLayoutDSL(str11) {
        const rows = str11.split('\n').map((row)=>row.split('\t')
        );
        let leftColumnWidth = 0;
        rows.forEach((columns)=>{
            if (columns.length > 1 && mixin.stringWidth(columns[0]) > leftColumnWidth) {
                leftColumnWidth = Math.min(Math.floor(this.width * 0.5), mixin.stringWidth(columns[0]));
            }
        });
        rows.forEach((columns)=>{
            this.div(...columns.map((r, i19)=>{
                return {
                    text: r.trim(),
                    padding: this.measurePadding(r),
                    width: i19 === 0 && columns.length > 1 ? leftColumnWidth : undefined
                };
            }));
        });
        return this.rows[this.rows.length - 1];
    }
    colFromString(text) {
        return {
            text,
            padding: this.measurePadding(text)
        };
    }
    measurePadding(str12) {
        const noAnsi = mixin.stripAnsi(str12);
        return [
            0,
            noAnsi.match(/\s*$/)[0].length,
            0,
            noAnsi.match(/^\s*/)[0].length
        ];
    }
    toString() {
        const lines = [];
        this.rows.forEach((row)=>{
            this.rowToString(row, lines);
        });
        return lines.filter((line)=>!line.hidden
        ).map((line)=>line.text
        ).join('\n');
    }
    rowToString(row, lines) {
        this.rasterize(row).forEach((rrow, r)=>{
            let str13 = '';
            rrow.forEach((col, c)=>{
                const { width  } = row[c];
                const wrapWidth = this.negatePadding(row[c]);
                let ts = col;
                if (wrapWidth > mixin.stringWidth(col)) {
                    ts += ' '.repeat(wrapWidth - mixin.stringWidth(col));
                }
                if (row[c].align && row[c].align !== 'left' && this.wrap) {
                    const fn = align[row[c].align];
                    ts = fn(ts, wrapWidth);
                    if (mixin.stringWidth(ts) < wrapWidth) {
                        ts += ' '.repeat((width || 0) - mixin.stringWidth(ts) - 1);
                    }
                }
                const padding = row[c].padding || [
                    0,
                    0,
                    0,
                    0
                ];
                if (padding[3]) {
                    str13 += ' '.repeat(padding[left]);
                }
                str13 += addBorder(row[c], ts, '| ');
                str13 += ts;
                str13 += addBorder(row[c], ts, ' |');
                if (padding[1]) {
                    str13 += ' '.repeat(padding[right]);
                }
                if (r === 0 && lines.length > 0) {
                    str13 = this.renderInline(str13, lines[lines.length - 1]);
                }
            });
            lines.push({
                text: str13.replace(/ +$/, ''),
                span: row.span
            });
        });
        return lines;
    }
    renderInline(source, previousLine) {
        const match = source.match(/^ */);
        const leadingWhitespace = match ? match[0].length : 0;
        const target = previousLine.text;
        const targetTextWidth = mixin.stringWidth(target.trimRight());
        if (!previousLine.span) {
            return source;
        }
        if (!this.wrap) {
            previousLine.hidden = true;
            return target + source;
        }
        if (leadingWhitespace < targetTextWidth) {
            return source;
        }
        previousLine.hidden = true;
        return target.trimRight() + ' '.repeat(leadingWhitespace - targetTextWidth) + source.trimLeft();
    }
    rasterize(row) {
        const rrows = [];
        const widths = this.columnWidths(row);
        let wrapped;
        row.forEach((col, c)=>{
            col.width = widths[c];
            if (this.wrap) {
                wrapped = mixin.wrap(col.text, this.negatePadding(col), {
                    hard: true
                }).split('\n');
            } else {
                wrapped = col.text.split('\n');
            }
            if (col.border) {
                wrapped.unshift('.' + '-'.repeat(this.negatePadding(col) + 2) + '.');
                wrapped.push("'" + '-'.repeat(this.negatePadding(col) + 2) + "'");
            }
            if (col.padding) {
                wrapped.unshift(...new Array(col.padding[0] || 0).fill(''));
                wrapped.push(...new Array(col.padding[2] || 0).fill(''));
            }
            wrapped.forEach((str14, r)=>{
                if (!rrows[r]) {
                    rrows.push([]);
                }
                const rrow = rrows[r];
                for(let i20 = 0; i20 < c; i20++){
                    if (rrow[i20] === undefined) {
                        rrow.push('');
                    }
                }
                rrow.push(str14);
            });
        });
        return rrows;
    }
    negatePadding(col) {
        let wrapWidth = col.width || 0;
        if (col.padding) {
            wrapWidth -= (col.padding[left] || 0) + (col.padding[right] || 0);
        }
        if (col.border) {
            wrapWidth -= 4;
        }
        return wrapWidth;
    }
    columnWidths(row) {
        if (!this.wrap) {
            return row.map((col)=>{
                return col.width || mixin.stringWidth(col.text);
            });
        }
        let unset = row.length;
        let remainingWidth = this.width;
        const widths = row.map((col)=>{
            if (col.width) {
                unset--;
                remainingWidth -= col.width;
                return col.width;
            }
            return undefined;
        });
        const unsetWidth = unset ? Math.floor(remainingWidth / unset) : 0;
        return widths.map((w, i)=>{
            if (w === undefined) {
                return Math.max(unsetWidth, _minWidth(row[i]));
            }
            return w;
        });
    }
}
function addBorder(col, ts, style) {
    if (col.border) {
        if (/[.']-+[.']/.test(ts)) {
            return '';
        }
        if (ts.trim().length !== 0) {
            return style;
        }
        return '  ';
    }
    return '';
}
function _minWidth(col) {
    const padding = col.padding || [];
    const minWidth = 1 + (padding[3] || 0) + (padding[1] || 0);
    if (col.border) {
        return minWidth + 4;
    }
    return minWidth;
}
function getWindowWidth() {
    if (typeof process === 'object' && process.stdout && process.stdout.columns) {
        return process.stdout.columns;
    }
    return 80;
}
function alignRight(str15, width) {
    str15 = str15.trim();
    const strWidth = mixin.stringWidth(str15);
    if (strWidth < width) {
        return ' '.repeat(width - strWidth) + str15;
    }
    return str15;
}
function alignCenter(str16, width) {
    str16 = str16.trim();
    const strWidth = mixin.stringWidth(str16);
    if (strWidth >= width) {
        return str16;
    }
    return ' '.repeat(width - strWidth >> 1) + str16;
}
let mixin;
function cliui(opts, _mixin) {
    mixin = _mixin;
    return new UI({
        width: (opts === null || opts === void 0 ? void 0 : opts.width) || getWindowWidth(),
        wrap: opts === null || opts === void 0 ? void 0 : opts.wrap
    });
}
const ansi = new RegExp('\x1b(?:\\[(?:\\d+[ABCDEFGJKSTm]|\\d+;\\d+[Hfm]|' + '\\d+;\\d+;\\d+m|6n|s|u|\\?25[lh])|\\w)', 'g');
function stripAnsi(str17) {
    return str17.replace(ansi, '');
}
function wrap(str18, width) {
    const [start, end] = str18.match(ansi) || [
        '',
        ''
    ];
    str18 = stripAnsi(str18);
    let wrapped = '';
    for(let i21 = 0; i21 < str18.length; i21++){
        if (i21 !== 0 && i21 % width === 0) {
            wrapped += '\n';
        }
        wrapped += str18.charAt(i21);
    }
    if (start && end) {
        wrapped = `${start}${wrapped}${end}`;
    }
    return wrapped;
}
function ui(opts) {
    return cliui(opts, {
        stringWidth: (str19)=>{
            return [
                ...str19
            ].length;
        },
        stripAnsi,
        wrap
    });
}
function toItems(dir) {
    let list = [];
    for (let tmp of Deno.readDirSync(dir)){
        list.push(tmp.name);
    }
    return list;
}
function __default(start, callback) {
    let dir = resolve2('.', start);
    let stats = Deno.statSync(dir);
    if (!stats.isDirectory) {
        dir = dirname2(dir);
    }
    while(true){
        let tmp = callback(dir, toItems(dir));
        if (tmp) return resolve2(dir, tmp);
        dir = dirname2(tmp = dir);
        if (tmp === dir) break;
    }
}
function camelCase(str20) {
    str20 = str20.toLocaleLowerCase();
    if (str20.indexOf('-') === -1 && str20.indexOf('_') === -1) {
        return str20;
    } else {
        let camelcase = '';
        let nextChrUpper = false;
        const leadingHyphens = str20.match(/^-+/);
        for(let i22 = leadingHyphens ? leadingHyphens[0].length : 0; i22 < str20.length; i22++){
            let chr = str20.charAt(i22);
            if (nextChrUpper) {
                nextChrUpper = false;
                chr = chr.toLocaleUpperCase();
            }
            if (i22 !== 0 && (chr === '-' || chr === '_')) {
                nextChrUpper = true;
                continue;
            } else if (chr !== '-' && chr !== '_') {
                camelcase += chr;
            }
        }
        return camelcase;
    }
}
function decamelize(str21, joinString) {
    const lowercase = str21.toLocaleLowerCase();
    joinString = joinString || '-';
    let notCamelcase = '';
    for(let i23 = 0; i23 < str21.length; i23++){
        const chrLower = lowercase.charAt(i23);
        const chrString = str21.charAt(i23);
        if (chrLower !== chrString && i23 > 0) {
            notCamelcase += `${joinString}${lowercase.charAt(i23)}`;
        } else {
            notCamelcase += chrString;
        }
    }
    return notCamelcase;
}
function looksLikeNumber(x) {
    if (x === null || x === undefined) return false;
    if (typeof x === 'number') return true;
    if (/^0x[0-9a-f]+$/i.test(x)) return true;
    if (x.length > 1 && x[0] === '0') return false;
    return /^[-]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}
function tokenizeArgString(argString) {
    if (Array.isArray(argString)) {
        return argString.map((e)=>typeof e !== 'string' ? e + '' : e
        );
    }
    argString = argString.trim();
    let i24 = 0;
    let prevC = null;
    let c = null;
    let opening = null;
    const args = [];
    for(let ii = 0; ii < argString.length; ii++){
        prevC = c;
        c = argString.charAt(ii);
        if (c === ' ' && !opening) {
            if (!(prevC === ' ')) {
                i24++;
            }
            continue;
        }
        if (c === opening) {
            opening = null;
        } else if ((c === "'" || c === '"') && !opening) {
            opening = c;
        }
        if (!args[i24]) args[i24] = '';
        args[i24] += c;
    }
    return args;
}
let mixin1;
class YargsParser {
    constructor(_mixin){
        mixin1 = _mixin;
    }
    parse(argsInput, options) {
        const opts = Object.assign({
            alias: undefined,
            array: undefined,
            boolean: undefined,
            config: undefined,
            configObjects: undefined,
            configuration: undefined,
            coerce: undefined,
            count: undefined,
            default: undefined,
            envPrefix: undefined,
            narg: undefined,
            normalize: undefined,
            string: undefined,
            number: undefined,
            __: undefined,
            key: undefined
        }, options);
        const args1 = tokenizeArgString(argsInput);
        const aliases1 = combineAliases(Object.assign(Object.create(null), opts.alias));
        const configuration = Object.assign({
            'boolean-negation': true,
            'camel-case-expansion': true,
            'combine-arrays': false,
            'dot-notation': true,
            'duplicate-arguments-array': true,
            'flatten-duplicate-arrays': true,
            'greedy-arrays': true,
            'halt-at-non-option': false,
            'nargs-eats-options': false,
            'negation-prefix': 'no-',
            'parse-numbers': true,
            'parse-positional-numbers': true,
            'populate--': false,
            'set-placeholder-key': false,
            'short-option-groups': true,
            'strip-aliased': false,
            'strip-dashed': false,
            'unknown-options-as-args': false
        }, opts.configuration);
        const defaults1 = Object.assign(Object.create(null), opts.default);
        const configObjects = opts.configObjects || [];
        const envPrefix = opts.envPrefix;
        const notFlagsOption = configuration['populate--'];
        const notFlagsArgv = notFlagsOption ? '--' : '_';
        const newAliases = Object.create(null);
        const defaulted = Object.create(null);
        const __ = opts.__ || mixin1.format;
        const flags = {
            aliases: Object.create(null),
            arrays: Object.create(null),
            bools: Object.create(null),
            strings: Object.create(null),
            numbers: Object.create(null),
            counts: Object.create(null),
            normalize: Object.create(null),
            configs: Object.create(null),
            nargs: Object.create(null),
            coercions: Object.create(null),
            keys: []
        };
        const negative = /^-([0-9]+(\.[0-9]+)?|\.[0-9]+)$/;
        const negatedBoolean = new RegExp('^--' + configuration['negation-prefix'] + '(.+)');
        [].concat(opts.array || []).filter(Boolean).forEach(function(opt) {
            const key = typeof opt === 'object' ? opt.key : opt;
            const assignment = Object.keys(opt).map(function(key) {
                const arrayFlagKeys = {
                    boolean: 'bools',
                    string: 'strings',
                    number: 'numbers'
                };
                return arrayFlagKeys[key];
            }).filter(Boolean).pop();
            if (assignment) {
                flags[assignment][key] = true;
            }
            flags.arrays[key] = true;
            flags.keys.push(key);
        });
        [].concat(opts.boolean || []).filter(Boolean).forEach(function(key) {
            flags.bools[key] = true;
            flags.keys.push(key);
        });
        [].concat(opts.string || []).filter(Boolean).forEach(function(key) {
            flags.strings[key] = true;
            flags.keys.push(key);
        });
        [].concat(opts.number || []).filter(Boolean).forEach(function(key) {
            flags.numbers[key] = true;
            flags.keys.push(key);
        });
        [].concat(opts.count || []).filter(Boolean).forEach(function(key) {
            flags.counts[key] = true;
            flags.keys.push(key);
        });
        [].concat(opts.normalize || []).filter(Boolean).forEach(function(key) {
            flags.normalize[key] = true;
            flags.keys.push(key);
        });
        if (typeof opts.narg === 'object') {
            Object.entries(opts.narg).forEach(([key, value])=>{
                if (typeof value === 'number') {
                    flags.nargs[key] = value;
                    flags.keys.push(key);
                }
            });
        }
        if (typeof opts.coerce === 'object') {
            Object.entries(opts.coerce).forEach(([key, value])=>{
                if (typeof value === 'function') {
                    flags.coercions[key] = value;
                    flags.keys.push(key);
                }
            });
        }
        if (typeof opts.config !== 'undefined') {
            if (Array.isArray(opts.config) || typeof opts.config === 'string') {
                [].concat(opts.config).filter(Boolean).forEach(function(key) {
                    flags.configs[key] = true;
                });
            } else if (typeof opts.config === 'object') {
                Object.entries(opts.config).forEach(([key, value])=>{
                    if (typeof value === 'boolean' || typeof value === 'function') {
                        flags.configs[key] = value;
                    }
                });
            }
        }
        extendAliases(opts.key, aliases1, opts.default, flags.arrays);
        Object.keys(defaults1).forEach(function(key) {
            (flags.aliases[key] || []).forEach(function(alias) {
                defaults1[alias] = defaults1[key];
            });
        });
        let error = null;
        checkConfiguration();
        let notFlags = [];
        const argv1 = Object.assign(Object.create(null), {
            _: []
        });
        const argvReturn = {};
        for(let i1 = 0; i1 < args1.length; i1++){
            const arg = args1[i1];
            let broken;
            let key;
            let letters;
            let m;
            let next;
            let value;
            if (arg !== '--' && isUnknownOptionAsArg(arg)) {
                pushPositional(arg);
            } else if (arg.match(/^--.+=/) || !configuration['short-option-groups'] && arg.match(/^-.+=/)) {
                m = arg.match(/^--?([^=]+)=([\s\S]*)$/);
                if (m !== null && Array.isArray(m) && m.length >= 3) {
                    if (checkAllAliases(m[1], flags.arrays)) {
                        i1 = eatArray(i1, m[1], args1, m[2]);
                    } else if (checkAllAliases(m[1], flags.nargs) !== false) {
                        i1 = eatNargs(i1, m[1], args1, m[2]);
                    } else {
                        setArg(m[1], m[2]);
                    }
                }
            } else if (arg.match(negatedBoolean) && configuration['boolean-negation']) {
                m = arg.match(negatedBoolean);
                if (m !== null && Array.isArray(m) && m.length >= 2) {
                    key = m[1];
                    setArg(key, checkAllAliases(key, flags.arrays) ? [
                        false
                    ] : false);
                }
            } else if (arg.match(/^--.+/) || !configuration['short-option-groups'] && arg.match(/^-[^-]+/)) {
                m = arg.match(/^--?(.+)/);
                if (m !== null && Array.isArray(m) && m.length >= 2) {
                    key = m[1];
                    if (checkAllAliases(key, flags.arrays)) {
                        i1 = eatArray(i1, key, args1);
                    } else if (checkAllAliases(key, flags.nargs) !== false) {
                        i1 = eatNargs(i1, key, args1);
                    } else {
                        next = args1[i1 + 1];
                        if (next !== undefined && (!next.match(/^-/) || next.match(negative)) && !checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts)) {
                            setArg(key, next);
                            i1++;
                        } else if (/^(true|false)$/.test(next)) {
                            setArg(key, next);
                            i1++;
                        } else {
                            setArg(key, defaultValue(key));
                        }
                    }
                }
            } else if (arg.match(/^-.\..+=/)) {
                m = arg.match(/^-([^=]+)=([\s\S]*)$/);
                if (m !== null && Array.isArray(m) && m.length >= 3) {
                    setArg(m[1], m[2]);
                }
            } else if (arg.match(/^-.\..+/) && !arg.match(negative)) {
                next = args1[i1 + 1];
                m = arg.match(/^-(.\..+)/);
                if (m !== null && Array.isArray(m) && m.length >= 2) {
                    key = m[1];
                    if (next !== undefined && !next.match(/^-/) && !checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts)) {
                        setArg(key, next);
                        i1++;
                    } else {
                        setArg(key, defaultValue(key));
                    }
                }
            } else if (arg.match(/^-[^-]+/) && !arg.match(negative)) {
                letters = arg.slice(1, -1).split('');
                broken = false;
                for(let j = 0; j < letters.length; j++){
                    next = arg.slice(j + 2);
                    if (letters[j + 1] && letters[j + 1] === '=') {
                        value = arg.slice(j + 3);
                        key = letters[j];
                        if (checkAllAliases(key, flags.arrays)) {
                            i1 = eatArray(i1, key, args1, value);
                        } else if (checkAllAliases(key, flags.nargs) !== false) {
                            i1 = eatNargs(i1, key, args1, value);
                        } else {
                            setArg(key, value);
                        }
                        broken = true;
                        break;
                    }
                    if (next === '-') {
                        setArg(letters[j], next);
                        continue;
                    }
                    if (/[A-Za-z]/.test(letters[j]) && /^-?\d+(\.\d*)?(e-?\d+)?$/.test(next) && checkAllAliases(next, flags.bools) === false) {
                        setArg(letters[j], next);
                        broken = true;
                        break;
                    }
                    if (letters[j + 1] && letters[j + 1].match(/\W/)) {
                        setArg(letters[j], next);
                        broken = true;
                        break;
                    } else {
                        setArg(letters[j], defaultValue(letters[j]));
                    }
                }
                key = arg.slice(-1)[0];
                if (!broken && key !== '-') {
                    if (checkAllAliases(key, flags.arrays)) {
                        i1 = eatArray(i1, key, args1);
                    } else if (checkAllAliases(key, flags.nargs) !== false) {
                        i1 = eatNargs(i1, key, args1);
                    } else {
                        next = args1[i1 + 1];
                        if (next !== undefined && (!/^(-|--)[^-]/.test(next) || next.match(negative)) && !checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts)) {
                            setArg(key, next);
                            i1++;
                        } else if (/^(true|false)$/.test(next)) {
                            setArg(key, next);
                            i1++;
                        } else {
                            setArg(key, defaultValue(key));
                        }
                    }
                }
            } else if (arg.match(/^-[0-9]$/) && arg.match(negative) && checkAllAliases(arg.slice(1), flags.bools)) {
                key = arg.slice(1);
                setArg(key, defaultValue(key));
            } else if (arg === '--') {
                notFlags = args1.slice(i1 + 1);
                break;
            } else if (configuration['halt-at-non-option']) {
                notFlags = args1.slice(i1);
                break;
            } else {
                pushPositional(arg);
            }
        }
        applyEnvVars(argv1, true);
        applyEnvVars(argv1, false);
        setConfig(argv1);
        setConfigObjects();
        applyDefaultsAndAliases(argv1, flags.aliases, defaults1, true);
        applyCoercions(argv1);
        if (configuration['set-placeholder-key']) setPlaceholderKeys(argv1);
        Object.keys(flags.counts).forEach(function(key) {
            if (!hasKey(argv1, key.split('.'))) setArg(key, 0);
        });
        if (notFlagsOption && notFlags.length) argv1[notFlagsArgv] = [];
        notFlags.forEach(function(key) {
            argv1[notFlagsArgv].push(key);
        });
        if (configuration['camel-case-expansion'] && configuration['strip-dashed']) {
            Object.keys(argv1).filter((key)=>key !== '--' && key.includes('-')
            ).forEach((key)=>{
                delete argv1[key];
            });
        }
        if (configuration['strip-aliased']) {
            [].concat(...Object.keys(aliases1).map((k)=>aliases1[k]
            )).forEach((alias)=>{
                if (configuration['camel-case-expansion'] && alias.includes('-')) {
                    delete argv1[alias.split('.').map((prop)=>camelCase(prop)
                    ).join('.')];
                }
                delete argv1[alias];
            });
        }
        function pushPositional(arg) {
            const maybeCoercedNumber = maybeCoerceNumber('_', arg);
            if (typeof maybeCoercedNumber === 'string' || typeof maybeCoercedNumber === 'number') {
                argv1._.push(maybeCoercedNumber);
            }
        }
        function eatNargs(i25, key, args, argAfterEqualSign) {
            let ii;
            let toEat = checkAllAliases(key, flags.nargs);
            toEat = typeof toEat !== 'number' || isNaN(toEat) ? 1 : toEat;
            if (toEat === 0) {
                if (!isUndefined(argAfterEqualSign)) {
                    error = Error(__('Argument unexpected for: %s', key));
                }
                setArg(key, defaultValue(key));
                return i25;
            }
            let available = isUndefined(argAfterEqualSign) ? 0 : 1;
            if (configuration['nargs-eats-options']) {
                if (args.length - (i25 + 1) + available < toEat) {
                    error = Error(__('Not enough arguments following: %s', key));
                }
                available = toEat;
            } else {
                for(ii = i25 + 1; ii < args.length; ii++){
                    if (!args[ii].match(/^-[^0-9]/) || args[ii].match(negative) || isUnknownOptionAsArg(args[ii])) available++;
                    else break;
                }
                if (available < toEat) error = Error(__('Not enough arguments following: %s', key));
            }
            let consumed = Math.min(available, toEat);
            if (!isUndefined(argAfterEqualSign) && consumed > 0) {
                setArg(key, argAfterEqualSign);
                consumed--;
            }
            for(ii = i25 + 1; ii < consumed + i25 + 1; ii++){
                setArg(key, args[ii]);
            }
            return i25 + consumed;
        }
        function eatArray(i26, key, args, argAfterEqualSign) {
            let argsToSet = [];
            let next = argAfterEqualSign || args[i26 + 1];
            const nargsCount = checkAllAliases(key, flags.nargs);
            if (checkAllAliases(key, flags.bools) && !/^(true|false)$/.test(next)) {
                argsToSet.push(true);
            } else if (isUndefined(next) || isUndefined(argAfterEqualSign) && /^-/.test(next) && !negative.test(next) && !isUnknownOptionAsArg(next)) {
                if (defaults1[key] !== undefined) {
                    const defVal = defaults1[key];
                    argsToSet = Array.isArray(defVal) ? defVal : [
                        defVal
                    ];
                }
            } else {
                if (!isUndefined(argAfterEqualSign)) {
                    argsToSet.push(processValue(key, argAfterEqualSign));
                }
                for(let ii = i26 + 1; ii < args.length; ii++){
                    if (!configuration['greedy-arrays'] && argsToSet.length > 0 || nargsCount && typeof nargsCount === 'number' && argsToSet.length >= nargsCount) break;
                    next = args[ii];
                    if (/^-/.test(next) && !negative.test(next) && !isUnknownOptionAsArg(next)) break;
                    i26 = ii;
                    argsToSet.push(processValue(key, next));
                }
            }
            if (typeof nargsCount === 'number' && (nargsCount && argsToSet.length < nargsCount || isNaN(nargsCount) && argsToSet.length === 0)) {
                error = Error(__('Not enough arguments following: %s', key));
            }
            setArg(key, argsToSet);
            return i26;
        }
        function setArg(key1, val) {
            if (/-/.test(key1) && configuration['camel-case-expansion']) {
                const alias = key1.split('.').map(function(prop) {
                    return camelCase(prop);
                }).join('.');
                addNewAlias(key1, alias);
            }
            const value1 = processValue(key1, val);
            const splitKey = key1.split('.');
            setKey(argv1, splitKey, value1);
            if (flags.aliases[key1]) {
                flags.aliases[key1].forEach(function(x) {
                    const keyProperties = x.split('.');
                    setKey(argv1, keyProperties, value1);
                });
            }
            if (splitKey.length > 1 && configuration['dot-notation']) {
                (flags.aliases[splitKey[0]] || []).forEach(function(x) {
                    let keyProperties = x.split('.');
                    const a = [].concat(splitKey);
                    a.shift();
                    keyProperties = keyProperties.concat(a);
                    if (!(flags.aliases[key1] || []).includes(keyProperties.join('.'))) {
                        setKey(argv1, keyProperties, value1);
                    }
                });
            }
            if (checkAllAliases(key1, flags.normalize) && !checkAllAliases(key1, flags.arrays)) {
                const keys = [
                    key1
                ].concat(flags.aliases[key1] || []);
                keys.forEach(function(key) {
                    Object.defineProperty(argvReturn, key, {
                        enumerable: true,
                        get () {
                            return val;
                        },
                        set (value) {
                            val = typeof value === 'string' ? mixin1.normalize(value) : value;
                        }
                    });
                });
            }
        }
        function addNewAlias(key, alias) {
            if (!(flags.aliases[key] && flags.aliases[key].length)) {
                flags.aliases[key] = [
                    alias
                ];
                newAliases[alias] = true;
            }
            if (!(flags.aliases[alias] && flags.aliases[alias].length)) {
                addNewAlias(alias, key);
            }
        }
        function processValue(key, val1) {
            if (typeof val1 === 'string' && (val1[0] === "'" || val1[0] === '"') && val1[val1.length - 1] === val1[0]) {
                val1 = val1.substring(1, val1.length - 1);
            }
            if (checkAllAliases(key, flags.bools) || checkAllAliases(key, flags.counts)) {
                if (typeof val1 === 'string') val1 = val1 === 'true';
            }
            let value = Array.isArray(val1) ? val1.map(function(v) {
                return maybeCoerceNumber(key, v);
            }) : maybeCoerceNumber(key, val1);
            if (checkAllAliases(key, flags.counts) && (isUndefined(value) || typeof value === 'boolean')) {
                value = increment();
            }
            if (checkAllAliases(key, flags.normalize) && checkAllAliases(key, flags.arrays)) {
                if (Array.isArray(val1)) value = val1.map((val)=>{
                    return mixin1.normalize(val);
                });
                else value = mixin1.normalize(val1);
            }
            return value;
        }
        function maybeCoerceNumber(key, value) {
            if (!configuration['parse-positional-numbers'] && key === '_') return value;
            if (!checkAllAliases(key, flags.strings) && !checkAllAliases(key, flags.bools) && !Array.isArray(value)) {
                const shouldCoerceNumber = looksLikeNumber(value) && configuration['parse-numbers'] && Number.isSafeInteger(Math.floor(parseFloat(`${value}`)));
                if (shouldCoerceNumber || !isUndefined(value) && checkAllAliases(key, flags.numbers)) {
                    value = Number(value);
                }
            }
            return value;
        }
        function setConfig(argv2) {
            const configLookup = Object.create(null);
            applyDefaultsAndAliases(configLookup, flags.aliases, defaults1);
            Object.keys(flags.configs).forEach(function(configKey) {
                const configPath = argv2[configKey] || configLookup[configKey];
                if (configPath) {
                    try {
                        let config = null;
                        const resolvedConfigPath = mixin1.resolve(mixin1.cwd(), configPath);
                        const resolveConfig = flags.configs[configKey];
                        if (typeof resolveConfig === 'function') {
                            try {
                                config = resolveConfig(resolvedConfigPath);
                            } catch (e) {
                                config = e;
                            }
                            if (config instanceof Error) {
                                error = config;
                                return;
                            }
                        } else {
                            config = mixin1.require(resolvedConfigPath);
                        }
                        setConfigObject(config);
                    } catch (ex) {
                        if (ex.name === 'PermissionDenied') error = ex;
                        else if (argv2[configKey]) error = Error(__('Invalid JSON config file: %s', configPath));
                    }
                }
            });
        }
        function setConfigObject(config, prev) {
            Object.keys(config).forEach(function(key) {
                const value = config[key];
                const fullKey = prev ? prev + '.' + key : key;
                if (typeof value === 'object' && value !== null && !Array.isArray(value) && configuration['dot-notation']) {
                    setConfigObject(value, fullKey);
                } else {
                    if (!hasKey(argv1, fullKey.split('.')) || checkAllAliases(fullKey, flags.arrays) && configuration['combine-arrays']) {
                        setArg(fullKey, value);
                    }
                }
            });
        }
        function setConfigObjects() {
            if (typeof configObjects !== 'undefined') {
                configObjects.forEach(function(configObject) {
                    setConfigObject(configObject);
                });
            }
        }
        function applyEnvVars(argv3, configOnly) {
            if (typeof envPrefix === 'undefined') return;
            const prefix = typeof envPrefix === 'string' ? envPrefix : '';
            const env1 = mixin1.env();
            Object.keys(env1).forEach(function(envVar) {
                if (prefix === '' || envVar.lastIndexOf(prefix, 0) === 0) {
                    const keys = envVar.split('__').map(function(key, i27) {
                        if (i27 === 0) {
                            key = key.substring(prefix.length);
                        }
                        return camelCase(key);
                    });
                    if ((configOnly && flags.configs[keys.join('.')] || !configOnly) && !hasKey(argv3, keys)) {
                        setArg(keys.join('.'), env1[envVar]);
                    }
                }
            });
        }
        function applyCoercions(argv4) {
            let coerce;
            const applied = new Set();
            Object.keys(argv4).forEach(function(key) {
                if (!applied.has(key)) {
                    coerce = checkAllAliases(key, flags.coercions);
                    if (typeof coerce === 'function') {
                        try {
                            const value = maybeCoerceNumber(key, coerce(argv4[key]));
                            [].concat(flags.aliases[key] || [], key).forEach((ali)=>{
                                applied.add(ali);
                                argv4[ali] = value;
                            });
                        } catch (err) {
                            error = err;
                        }
                    }
                }
            });
        }
        function setPlaceholderKeys(argv5) {
            flags.keys.forEach((key)=>{
                if (~key.indexOf('.')) return;
                if (typeof argv5[key] === 'undefined') argv5[key] = undefined;
            });
            return argv5;
        }
        function applyDefaultsAndAliases(obj, aliases, defaults, canLog = false) {
            Object.keys(defaults).forEach(function(key) {
                if (!hasKey(obj, key.split('.'))) {
                    setKey(obj, key.split('.'), defaults[key]);
                    if (canLog) defaulted[key] = true;
                    (aliases[key] || []).forEach(function(x) {
                        if (hasKey(obj, x.split('.'))) return;
                        setKey(obj, x.split('.'), defaults[key]);
                    });
                }
            });
        }
        function hasKey(obj, keys) {
            let o = obj;
            if (!configuration['dot-notation']) keys = [
                keys.join('.')
            ];
            keys.slice(0, -1).forEach(function(key) {
                o = o[key] || {};
            });
            const key = keys[keys.length - 1];
            if (typeof o !== 'object') return false;
            else return key in o;
        }
        function setKey(obj, keys, value) {
            let o = obj;
            if (!configuration['dot-notation']) keys = [
                keys.join('.')
            ];
            keys.slice(0, -1).forEach(function(key) {
                key = sanitizeKey(key);
                if (typeof o === 'object' && o[key] === undefined) {
                    o[key] = {};
                }
                if (typeof o[key] !== 'object' || Array.isArray(o[key])) {
                    if (Array.isArray(o[key])) {
                        o[key].push({});
                    } else {
                        o[key] = [
                            o[key],
                            {}
                        ];
                    }
                    o = o[key][o[key].length - 1];
                } else {
                    o = o[key];
                }
            });
            const key2 = sanitizeKey(keys[keys.length - 1]);
            const isTypeArray = checkAllAliases(keys.join('.'), flags.arrays);
            const isValueArray = Array.isArray(value);
            let duplicate = configuration['duplicate-arguments-array'];
            if (!duplicate && checkAllAliases(key2, flags.nargs)) {
                duplicate = true;
                if (!isUndefined(o[key2]) && flags.nargs[key2] === 1 || Array.isArray(o[key2]) && o[key2].length === flags.nargs[key2]) {
                    o[key2] = undefined;
                }
            }
            if (value === increment()) {
                o[key2] = increment(o[key2]);
            } else if (Array.isArray(o[key2])) {
                if (duplicate && isTypeArray && isValueArray) {
                    o[key2] = configuration['flatten-duplicate-arrays'] ? o[key2].concat(value) : (Array.isArray(o[key2][0]) ? o[key2] : [
                        o[key2]
                    ]).concat([
                        value
                    ]);
                } else if (!duplicate && Boolean(isTypeArray) === Boolean(isValueArray)) {
                    o[key2] = value;
                } else {
                    o[key2] = o[key2].concat([
                        value
                    ]);
                }
            } else if (o[key2] === undefined && isTypeArray) {
                o[key2] = isValueArray ? value : [
                    value
                ];
            } else if (duplicate && !(o[key2] === undefined || checkAllAliases(key2, flags.counts) || checkAllAliases(key2, flags.bools))) {
                o[key2] = [
                    o[key2],
                    value
                ];
            } else {
                o[key2] = value;
            }
        }
        function extendAliases(...args) {
            args.forEach(function(obj) {
                Object.keys(obj || {}).forEach(function(key) {
                    if (flags.aliases[key]) return;
                    flags.aliases[key] = [].concat(aliases1[key] || []);
                    flags.aliases[key].concat(key).forEach(function(x) {
                        if (/-/.test(x) && configuration['camel-case-expansion']) {
                            const c = camelCase(x);
                            if (c !== key && flags.aliases[key].indexOf(c) === -1) {
                                flags.aliases[key].push(c);
                                newAliases[c] = true;
                            }
                        }
                    });
                    flags.aliases[key].concat(key).forEach(function(x) {
                        if (x.length > 1 && /[A-Z]/.test(x) && configuration['camel-case-expansion']) {
                            const c = decamelize(x, '-');
                            if (c !== key && flags.aliases[key].indexOf(c) === -1) {
                                flags.aliases[key].push(c);
                                newAliases[c] = true;
                            }
                        }
                    });
                    flags.aliases[key].forEach(function(x) {
                        flags.aliases[x] = [
                            key
                        ].concat(flags.aliases[key].filter(function(y) {
                            return x !== y;
                        }));
                    });
                });
            });
        }
        function checkAllAliases(key3, flag) {
            const toCheck = [].concat(flags.aliases[key3] || [], key3);
            const keys = Object.keys(flag);
            const setAlias = toCheck.find((key)=>keys.includes(key)
            );
            return setAlias ? flag[setAlias] : false;
        }
        function hasAnyFlag(key) {
            const flagsKeys = Object.keys(flags);
            const toCheck = [].concat(flagsKeys.map((k)=>flags[k]
            ));
            return toCheck.some(function(flag) {
                return Array.isArray(flag) ? flag.includes(key) : flag[key];
            });
        }
        function hasFlagsMatching(arg, ...patterns) {
            const toCheck = [].concat(...patterns);
            return toCheck.some(function(pattern) {
                const match = arg.match(pattern);
                return match && hasAnyFlag(match[1]);
            });
        }
        function hasAllShortFlags(arg) {
            if (arg.match(negative) || !arg.match(/^-[^-]+/)) {
                return false;
            }
            let hasAllFlags = true;
            let next;
            const letters = arg.slice(1).split('');
            for(let j = 0; j < letters.length; j++){
                next = arg.slice(j + 2);
                if (!hasAnyFlag(letters[j])) {
                    hasAllFlags = false;
                    break;
                }
                if (letters[j + 1] && letters[j + 1] === '=' || next === '-' || /[A-Za-z]/.test(letters[j]) && /^-?\d+(\.\d*)?(e-?\d+)?$/.test(next) || letters[j + 1] && letters[j + 1].match(/\W/)) {
                    break;
                }
            }
            return hasAllFlags;
        }
        function isUnknownOptionAsArg(arg) {
            return configuration['unknown-options-as-args'] && isUnknownOption(arg);
        }
        function isUnknownOption(arg) {
            if (arg.match(negative)) {
                return false;
            }
            if (hasAllShortFlags(arg)) {
                return false;
            }
            const flagWithEquals = /^-+([^=]+?)=[\s\S]*$/;
            const normalFlag = /^-+([^=]+?)$/;
            const flagEndingInHyphen = /^-+([^=]+?)-$/;
            const flagEndingInDigits = /^-+([^=]+?\d+)$/;
            const flagEndingInNonWordCharacters = /^-+([^=]+?)\W+.*$/;
            return !hasFlagsMatching(arg, flagWithEquals, negatedBoolean, normalFlag, flagEndingInHyphen, flagEndingInDigits, flagEndingInNonWordCharacters);
        }
        function defaultValue(key) {
            if (!checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts) && `${key}` in defaults1) {
                return defaults1[key];
            } else {
                return defaultForType(guessType1(key));
            }
        }
        function defaultForType(type) {
            const def1 = {
                boolean: true,
                string: '',
                number: undefined,
                array: []
            };
            return def1[type];
        }
        function guessType1(key) {
            let type = 'boolean';
            if (checkAllAliases(key, flags.strings)) type = 'string';
            else if (checkAllAliases(key, flags.numbers)) type = 'number';
            else if (checkAllAliases(key, flags.bools)) type = 'boolean';
            else if (checkAllAliases(key, flags.arrays)) type = 'array';
            return type;
        }
        function isUndefined(num) {
            return num === undefined;
        }
        function checkConfiguration() {
            Object.keys(flags.counts).find((key)=>{
                if (checkAllAliases(key, flags.arrays)) {
                    error = Error(__('Invalid configuration: %s, opts.count excludes opts.array.', key));
                    return true;
                } else if (checkAllAliases(key, flags.nargs)) {
                    error = Error(__('Invalid configuration: %s, opts.count excludes opts.narg.', key));
                    return true;
                }
                return false;
            });
        }
        return {
            aliases: Object.assign({}, flags.aliases),
            argv: Object.assign(argvReturn, argv1),
            configuration: configuration,
            defaulted: Object.assign({}, defaulted),
            error: error,
            newAliases: Object.assign({}, newAliases)
        };
    }
}
function combineAliases(aliases) {
    const aliasArrays = [];
    const combined = Object.create(null);
    let change = true;
    Object.keys(aliases).forEach(function(key) {
        aliasArrays.push([].concat(aliases[key], key));
    });
    while(change){
        change = false;
        for(let i28 = 0; i28 < aliasArrays.length; i28++){
            for(let ii = i28 + 1; ii < aliasArrays.length; ii++){
                const intersect = aliasArrays[i28].filter(function(v) {
                    return aliasArrays[ii].indexOf(v) !== -1;
                });
                if (intersect.length) {
                    aliasArrays[i28] = aliasArrays[i28].concat(aliasArrays[ii]);
                    aliasArrays.splice(ii, 1);
                    change = true;
                    break;
                }
            }
        }
    }
    aliasArrays.forEach(function(aliasArray) {
        aliasArray = aliasArray.filter(function(v, i29, self) {
            return self.indexOf(v) === i29;
        });
        const lastAlias = aliasArray.pop();
        if (lastAlias !== undefined && typeof lastAlias === 'string') {
            combined[lastAlias] = aliasArray;
        }
    });
    return combined;
}
function increment(orig) {
    return orig !== undefined ? orig + 1 : 1;
}
function sanitizeKey(key) {
    if (key === '__proto__') return '___proto___';
    return key;
}
const parser = new YargsParser({
    cwd: Deno.cwd,
    env: ()=>{
        Deno.env.toObject();
    },
    format: (str22, arg)=>{
        return str22.replace('%s', arg);
    },
    normalize: mod1.normalize,
    resolve: mod1.resolve,
    require: (path110)=>{
        if (!path110.match(/\.json$/)) {
            throw Error('only .json config files are supported in Deno');
        } else {
            return JSON.parse(Deno.readTextFileSync(path110));
        }
    }
});
const yargsParser = function Parser(args, opts) {
    const result = parser.parse(args.slice(), opts);
    return result.argv;
};
yargsParser.detailed = function(args, opts) {
    return parser.parse(args.slice(), opts);
};
yargsParser.camelCase = camelCase;
yargsParser.decamelize = decamelize;
yargsParser.looksLikeNumber = looksLikeNumber;
let shim;
class Y18N {
    constructor(opts){
        opts = opts || {};
        this.directory = opts.directory || './locales';
        this.updateFiles = typeof opts.updateFiles === 'boolean' ? opts.updateFiles : true;
        this.locale = opts.locale || 'en';
        this.fallbackToLanguage = typeof opts.fallbackToLanguage === 'boolean' ? opts.fallbackToLanguage : true;
        this.cache = {};
        this.writeQueue = [];
    }
    __(...args) {
        if (typeof arguments[0] !== 'string') {
            return this._taggedLiteral(arguments[0], ...arguments);
        }
        const str23 = args.shift();
        let cb = function() {};
        if (typeof args[args.length - 1] === 'function') cb = args.pop();
        cb = cb || function() {};
        if (!this.cache[this.locale]) this._readLocaleFile();
        if (!this.cache[this.locale][str23] && this.updateFiles) {
            this.cache[this.locale][str23] = str23;
            this._enqueueWrite({
                directory: this.directory,
                locale: this.locale,
                cb
            });
        } else {
            cb();
        }
        return shim.format.apply(shim.format, [
            this.cache[this.locale][str23] || str23
        ].concat(args));
    }
    __n() {
        const args = Array.prototype.slice.call(arguments);
        const singular = args.shift();
        const plural = args.shift();
        const quantity = args.shift();
        let cb = function() {};
        if (typeof args[args.length - 1] === 'function') cb = args.pop();
        if (!this.cache[this.locale]) this._readLocaleFile();
        let str24 = quantity === 1 ? singular : plural;
        if (this.cache[this.locale][singular]) {
            const entry = this.cache[this.locale][singular];
            str24 = entry[quantity === 1 ? 'one' : 'other'];
        }
        if (!this.cache[this.locale][singular] && this.updateFiles) {
            this.cache[this.locale][singular] = {
                one: singular,
                other: plural
            };
            this._enqueueWrite({
                directory: this.directory,
                locale: this.locale,
                cb
            });
        } else {
            cb();
        }
        var values = [
            str24
        ];
        if (~str24.indexOf('%d')) values.push(quantity);
        return shim.format.apply(shim.format, values.concat(args));
    }
    setLocale(locale) {
        this.locale = locale;
    }
    getLocale() {
        return this.locale;
    }
    updateLocale(obj) {
        if (!this.cache[this.locale]) this._readLocaleFile();
        for(const key in obj){
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                this.cache[this.locale][key] = obj[key];
            }
        }
    }
    _taggedLiteral(parts, ...args) {
        let str25 = '';
        parts.forEach(function(part, i) {
            var arg = args[i + 1];
            str25 += part;
            if (typeof arg !== 'undefined') {
                str25 += '%s';
            }
        });
        return this.__.apply(this, [
            str25
        ].concat([].slice.call(args, 1)));
    }
    _enqueueWrite(work) {
        this.writeQueue.push(work);
        if (this.writeQueue.length === 1) this._processWriteQueue();
    }
    _processWriteQueue() {
        var _this = this;
        var work = this.writeQueue[0];
        var directory = work.directory;
        var locale = work.locale;
        var cb = work.cb;
        var languageFile = this._resolveLocaleFile(directory, locale);
        var serializedLocale = JSON.stringify(this.cache[locale], null, 2);
        shim.fs.writeFile(languageFile, serializedLocale, 'utf-8', function(err) {
            _this.writeQueue.shift();
            if (_this.writeQueue.length > 0) _this._processWriteQueue();
            cb(err);
        });
    }
    _readLocaleFile() {
        var localeLookup = {};
        var languageFile = this._resolveLocaleFile(this.directory, this.locale);
        try {
            localeLookup = JSON.parse(shim.fs.readFileSync(languageFile, 'utf-8'));
        } catch (err) {
            if (err instanceof SyntaxError) {
                err.message = 'syntax error in ' + languageFile;
            }
            if (err.code === 'ENOENT') localeLookup = {};
            else throw err;
        }
        this.cache[this.locale] = localeLookup;
    }
    _resolveLocaleFile(directory, locale) {
        var file = shim.resolve(directory, './', locale + '.json');
        if (this.fallbackToLanguage && !this._fileExistsSync(file) && ~locale.lastIndexOf('_')) {
            var languageFile = shim.resolve(directory, './', locale.split('_')[0] + '.json');
            if (this._fileExistsSync(languageFile)) file = languageFile;
        }
        return file;
    }
    _fileExistsSync(file) {
        return shim.exists(file);
    }
}
function y18n(opts, _shim) {
    shim = _shim;
    const y18n1 = new Y18N(opts);
    return {
        __: y18n1.__.bind(y18n1),
        __n: y18n1.__n.bind(y18n1),
        setLocale: y18n1.setLocale.bind(y18n1),
        getLocale: y18n1.getLocale.bind(y18n1),
        updateLocale: y18n1.updateLocale.bind(y18n1),
        locale: y18n1.locale
    };
}
var State;
(function(State2) {
    State2[State2["PASSTHROUGH"] = 0] = "PASSTHROUGH";
    State2[State2["PERCENT"] = 1] = "PERCENT";
    State2[State2["POSITIONAL"] = 2] = "POSITIONAL";
    State2[State2["PRECISION"] = 3] = "PRECISION";
    State2[State2["WIDTH"] = 4] = "WIDTH";
})(State || (State = {}));
var WorP;
(function(WorP1) {
    WorP1[WorP1["WIDTH"] = 0] = "WIDTH";
    WorP1[WorP1["PRECISION"] = 1] = "PRECISION";
})(WorP || (WorP = {}));
class Flags {
    plus;
    dash;
    sharp;
    space;
    zero;
    lessthan;
    width = -1;
    precision = -1;
}
const min = Math.min;
const UNICODE_REPLACEMENT_CHARACTER = "\ufffd";
const FLOAT_REGEXP = /(-?)(\d)\.?(\d*)e([+-])(\d+)/;
var F;
(function(F1) {
    F1[F1["sign"] = 1] = "sign";
    F1[F1["mantissa"] = 2] = "mantissa";
    F1[F1["fractional"] = 3] = "fractional";
    F1[F1["esign"] = 4] = "esign";
    F1[F1["exponent"] = 5] = "exponent";
})(F || (F = {}));
class Printf {
    format;
    args;
    i;
    state = State.PASSTHROUGH;
    verb = "";
    buf = "";
    argNum = 0;
    flags = new Flags();
    haveSeen;
    tmpError;
    constructor(format7, ...args){
        this.format = format7;
        this.args = args;
        this.haveSeen = Array.from({
            length: args.length
        });
        this.i = 0;
    }
    doPrintf() {
        for(; this.i < this.format.length; ++this.i){
            const c = this.format[this.i];
            switch(this.state){
                case State.PASSTHROUGH:
                    if (c === "%") {
                        this.state = State.PERCENT;
                    } else {
                        this.buf += c;
                    }
                    break;
                case State.PERCENT:
                    if (c === "%") {
                        this.buf += c;
                        this.state = State.PASSTHROUGH;
                    } else {
                        this.handleFormat();
                    }
                    break;
                default:
                    throw Error("Should be unreachable, certainly a bug in the lib.");
            }
        }
        let extras = false;
        let err = "%!(EXTRA";
        for(let i30 = 0; i30 !== this.haveSeen.length; ++i30){
            if (!this.haveSeen[i30]) {
                extras = true;
                err += ` '${Deno.inspect(this.args[i30])}'`;
            }
        }
        err += ")";
        if (extras) {
            this.buf += err;
        }
        return this.buf;
    }
    handleFormat() {
        this.flags = new Flags();
        const flags = this.flags;
        for(; this.i < this.format.length; ++this.i){
            const c = this.format[this.i];
            switch(this.state){
                case State.PERCENT:
                    switch(c){
                        case "[":
                            this.handlePositional();
                            this.state = State.POSITIONAL;
                            break;
                        case "+":
                            flags.plus = true;
                            break;
                        case "<":
                            flags.lessthan = true;
                            break;
                        case "-":
                            flags.dash = true;
                            flags.zero = false;
                            break;
                        case "#":
                            flags.sharp = true;
                            break;
                        case " ":
                            flags.space = true;
                            break;
                        case "0":
                            flags.zero = !flags.dash;
                            break;
                        default:
                            if ("1" <= c && c <= "9" || c === "." || c === "*") {
                                if (c === ".") {
                                    this.flags.precision = 0;
                                    this.state = State.PRECISION;
                                    this.i++;
                                } else {
                                    this.state = State.WIDTH;
                                }
                                this.handleWidthAndPrecision(flags);
                            } else {
                                this.handleVerb();
                                return;
                            }
                    }
                    break;
                case State.POSITIONAL:
                    if (c === "*") {
                        const worp = this.flags.precision === -1 ? WorP.WIDTH : WorP.PRECISION;
                        this.handleWidthOrPrecisionRef(worp);
                        this.state = State.PERCENT;
                        break;
                    } else {
                        this.handleVerb();
                        return;
                    }
                default:
                    throw new Error(`Should not be here ${this.state}, library bug!`);
            }
        }
    }
    handleWidthOrPrecisionRef(wOrP) {
        if (this.argNum >= this.args.length) {
            return;
        }
        const arg = this.args[this.argNum];
        this.haveSeen[this.argNum] = true;
        if (typeof arg === "number") {
            switch(wOrP){
                case WorP.WIDTH:
                    this.flags.width = arg;
                    break;
                default:
                    this.flags.precision = arg;
            }
        } else {
            const tmp = wOrP === WorP.WIDTH ? "WIDTH" : "PREC";
            this.tmpError = `%!(BAD ${tmp} '${this.args[this.argNum]}')`;
        }
        this.argNum++;
    }
    handleWidthAndPrecision(flags) {
        const fmt = this.format;
        for(; this.i !== this.format.length; ++this.i){
            const c = fmt[this.i];
            switch(this.state){
                case State.WIDTH:
                    switch(c){
                        case ".":
                            this.flags.precision = 0;
                            this.state = State.PRECISION;
                            break;
                        case "*":
                            this.handleWidthOrPrecisionRef(WorP.WIDTH);
                            break;
                        default:
                            {
                                const val = parseInt(c);
                                if (isNaN(val)) {
                                    this.i--;
                                    this.state = State.PERCENT;
                                    return;
                                }
                                flags.width = flags.width == -1 ? 0 : flags.width;
                                flags.width *= 10;
                                flags.width += val;
                            }
                    }
                    break;
                case State.PRECISION:
                    {
                        if (c === "*") {
                            this.handleWidthOrPrecisionRef(WorP.PRECISION);
                            break;
                        }
                        const val = parseInt(c);
                        if (isNaN(val)) {
                            this.i--;
                            this.state = State.PERCENT;
                            return;
                        }
                        flags.precision *= 10;
                        flags.precision += val;
                        break;
                    }
                default:
                    throw new Error("can't be here. bug.");
            }
        }
    }
    handlePositional() {
        if (this.format[this.i] !== "[") {
            throw new Error("Can't happen? Bug.");
        }
        let positional = 0;
        const format8 = this.format;
        this.i++;
        let err = false;
        for(; this.i !== this.format.length; ++this.i){
            if (format8[this.i] === "]") {
                break;
            }
            positional *= 10;
            const val = parseInt(format8[this.i]);
            if (isNaN(val)) {
                this.tmpError = "%!(BAD INDEX)";
                err = true;
            }
            positional += val;
        }
        if (positional - 1 >= this.args.length) {
            this.tmpError = "%!(BAD INDEX)";
            err = true;
        }
        this.argNum = err ? this.argNum : positional - 1;
        return;
    }
    handleLessThan() {
        const arg = this.args[this.argNum];
        if ((arg || {}).constructor.name !== "Array") {
            throw new Error(`arg ${arg} is not an array. Todo better error handling`);
        }
        let str26 = "[ ";
        for(let i31 = 0; i31 !== arg.length; ++i31){
            if (i31 !== 0) str26 += ", ";
            str26 += this._handleVerb(arg[i31]);
        }
        return str26 + " ]";
    }
    handleVerb() {
        const verb = this.format[this.i];
        this.verb = verb;
        if (this.tmpError) {
            this.buf += this.tmpError;
            this.tmpError = undefined;
            if (this.argNum < this.haveSeen.length) {
                this.haveSeen[this.argNum] = true;
            }
        } else if (this.args.length <= this.argNum) {
            this.buf += `%!(MISSING '${verb}')`;
        } else {
            const arg = this.args[this.argNum];
            this.haveSeen[this.argNum] = true;
            if (this.flags.lessthan) {
                this.buf += this.handleLessThan();
            } else {
                this.buf += this._handleVerb(arg);
            }
        }
        this.argNum++;
        this.state = State.PASSTHROUGH;
    }
    _handleVerb(arg) {
        switch(this.verb){
            case "t":
                return this.pad(arg.toString());
            case "b":
                return this.fmtNumber(arg, 2);
            case "c":
                return this.fmtNumberCodePoint(arg);
            case "d":
                return this.fmtNumber(arg, 10);
            case "o":
                return this.fmtNumber(arg, 8);
            case "x":
                return this.fmtHex(arg);
            case "X":
                return this.fmtHex(arg, true);
            case "e":
                return this.fmtFloatE(arg);
            case "E":
                return this.fmtFloatE(arg, true);
            case "f":
            case "F":
                return this.fmtFloatF(arg);
            case "g":
                return this.fmtFloatG(arg);
            case "G":
                return this.fmtFloatG(arg, true);
            case "s":
                return this.fmtString(arg);
            case "T":
                return this.fmtString(typeof arg);
            case "v":
                return this.fmtV(arg);
            case "j":
                return this.fmtJ(arg);
            default:
                return `%!(BAD VERB '${this.verb}')`;
        }
    }
    pad(s) {
        const padding = this.flags.zero ? "0" : " ";
        if (this.flags.dash) {
            return s.padEnd(this.flags.width, padding);
        }
        return s.padStart(this.flags.width, padding);
    }
    padNum(nStr, neg) {
        let sign;
        if (neg) {
            sign = "-";
        } else if (this.flags.plus || this.flags.space) {
            sign = this.flags.plus ? "+" : " ";
        } else {
            sign = "";
        }
        const zero = this.flags.zero;
        if (!zero) {
            nStr = sign + nStr;
        }
        const pad = zero ? "0" : " ";
        const len = zero ? this.flags.width - sign.length : this.flags.width;
        if (this.flags.dash) {
            nStr = nStr.padEnd(len, pad);
        } else {
            nStr = nStr.padStart(len, pad);
        }
        if (zero) {
            nStr = sign + nStr;
        }
        return nStr;
    }
    fmtNumber(n, radix, upcase = false) {
        let num = Math.abs(n).toString(radix);
        const prec = this.flags.precision;
        if (prec !== -1) {
            this.flags.zero = false;
            num = n === 0 && prec === 0 ? "" : num;
            while(num.length < prec){
                num = "0" + num;
            }
        }
        let prefix = "";
        if (this.flags.sharp) {
            switch(radix){
                case 2:
                    prefix += "0b";
                    break;
                case 8:
                    prefix += num.startsWith("0") ? "" : "0";
                    break;
                case 16:
                    prefix += "0x";
                    break;
                default:
                    throw new Error("cannot handle base: " + radix);
            }
        }
        num = num.length === 0 ? num : prefix + num;
        if (upcase) {
            num = num.toUpperCase();
        }
        return this.padNum(num, n < 0);
    }
    fmtNumberCodePoint(n) {
        let s = "";
        try {
            s = String.fromCodePoint(n);
        } catch  {
            s = UNICODE_REPLACEMENT_CHARACTER;
        }
        return this.pad(s);
    }
    fmtFloatSpecial(n) {
        if (isNaN(n)) {
            this.flags.zero = false;
            return this.padNum("NaN", false);
        }
        if (n === Number.POSITIVE_INFINITY) {
            this.flags.zero = false;
            this.flags.plus = true;
            return this.padNum("Inf", false);
        }
        if (n === Number.NEGATIVE_INFINITY) {
            this.flags.zero = false;
            return this.padNum("Inf", true);
        }
        return "";
    }
    roundFractionToPrecision(fractional, precision) {
        let round = false;
        if (fractional.length > precision) {
            fractional = "1" + fractional;
            let tmp = parseInt(fractional.substr(0, precision + 2)) / 10;
            tmp = Math.round(tmp);
            fractional = Math.floor(tmp).toString();
            round = fractional[0] === "2";
            fractional = fractional.substr(1);
        } else {
            while(fractional.length < precision){
                fractional += "0";
            }
        }
        return [
            fractional,
            round
        ];
    }
    fmtFloatE(n, upcase = false) {
        const special = this.fmtFloatSpecial(n);
        if (special !== "") {
            return special;
        }
        const m = n.toExponential().match(FLOAT_REGEXP);
        if (!m) {
            throw Error("can't happen, bug");
        }
        let fractional = m[F.fractional];
        const precision = this.flags.precision !== -1 ? this.flags.precision : 6;
        let rounding = false;
        [fractional, rounding] = this.roundFractionToPrecision(fractional, precision);
        let e = m[F.exponent];
        let esign = m[F.esign];
        let mantissa = parseInt(m[F.mantissa]);
        if (rounding) {
            mantissa += 1;
            if (10 <= mantissa) {
                mantissa = 1;
                const r = parseInt(esign + e) + 1;
                e = r.toString();
                esign = r < 0 ? "-" : "+";
            }
        }
        e = e.length == 1 ? "0" + e : e;
        const val = `${mantissa}.${fractional}${upcase ? "E" : "e"}${esign}${e}`;
        return this.padNum(val, n < 0);
    }
    fmtFloatF(n1) {
        const special = this.fmtFloatSpecial(n1);
        if (special !== "") {
            return special;
        }
        function expandNumber(n) {
            if (Number.isSafeInteger(n)) {
                return n.toString() + ".";
            }
            const t = n.toExponential().split("e");
            let m = t[0].replace(".", "");
            const e = parseInt(t[1]);
            if (e < 0) {
                let nStr = "0.";
                for(let i32 = 0; i32 !== Math.abs(e) - 1; ++i32){
                    nStr += "0";
                }
                return nStr += m;
            } else {
                const splIdx = e + 1;
                while(m.length < splIdx){
                    m += "0";
                }
                return m.substr(0, splIdx) + "." + m.substr(splIdx);
            }
        }
        const val = expandNumber(Math.abs(n1));
        const arr = val.split(".");
        let dig = arr[0];
        let fractional = arr[1];
        const precision = this.flags.precision !== -1 ? this.flags.precision : 6;
        let round = false;
        [fractional, round] = this.roundFractionToPrecision(fractional, precision);
        if (round) {
            dig = (parseInt(dig) + 1).toString();
        }
        return this.padNum(`${dig}.${fractional}`, n1 < 0);
    }
    fmtFloatG(n, upcase = false) {
        const special = this.fmtFloatSpecial(n);
        if (special !== "") {
            return special;
        }
        let P = this.flags.precision !== -1 ? this.flags.precision : 6;
        P = P === 0 ? 1 : P;
        const m = n.toExponential().match(FLOAT_REGEXP);
        if (!m) {
            throw Error("can't happen");
        }
        const X = parseInt(m[F.exponent]) * (m[F.esign] === "-" ? -1 : 1);
        let nStr = "";
        if (P > X && X >= -4) {
            this.flags.precision = P - (X + 1);
            nStr = this.fmtFloatF(n);
            if (!this.flags.sharp) {
                nStr = nStr.replace(/\.?0*$/, "");
            }
        } else {
            this.flags.precision = P - 1;
            nStr = this.fmtFloatE(n);
            if (!this.flags.sharp) {
                nStr = nStr.replace(/\.?0*e/, upcase ? "E" : "e");
            }
        }
        return nStr;
    }
    fmtString(s) {
        if (this.flags.precision !== -1) {
            s = s.substr(0, this.flags.precision);
        }
        return this.pad(s);
    }
    fmtHex(val, upper = false) {
        switch(typeof val){
            case "number":
                return this.fmtNumber(val, 16, upper);
            case "string":
                {
                    const sharp = this.flags.sharp && val.length !== 0;
                    let hex = sharp ? "0x" : "";
                    const prec = this.flags.precision;
                    const end = prec !== -1 ? min(prec, val.length) : val.length;
                    for(let i33 = 0; i33 !== end; ++i33){
                        if (i33 !== 0 && this.flags.space) {
                            hex += sharp ? " 0x" : " ";
                        }
                        const c = (val.charCodeAt(i33) & 255).toString(16);
                        hex += c.length === 1 ? `0${c}` : c;
                    }
                    if (upper) {
                        hex = hex.toUpperCase();
                    }
                    return this.pad(hex);
                }
            default:
                throw new Error("currently only number and string are implemented for hex");
        }
    }
    fmtV(val) {
        if (this.flags.sharp) {
            const options = this.flags.precision !== -1 ? {
                depth: this.flags.precision
            } : {};
            return this.pad(Deno.inspect(val, options));
        } else {
            const p = this.flags.precision;
            return p === -1 ? val.toString() : val.toString().substr(0, p);
        }
    }
    fmtJ(val) {
        return JSON.stringify(val);
    }
}
function sprintf(format9, ...args) {
    const printf1 = new Printf(format9, ...args);
    return printf1.doPrintf();
}
const __default1 = {
    fs: {
        readFileSync: (path28)=>{
            try {
                return Deno.readTextFileSync(path28);
            } catch (err) {
                err.code = 'ENOENT';
                throw err;
            }
        },
        writeFile: Deno.writeFile
    },
    format: sprintf,
    resolve: (base, p1, p2)=>{
        try {
            return mod1.resolve(base, p1, p2);
        } catch (err) {}
    },
    exists: (file)=>{
        try {
            return Deno.statSync(file).isFile;
        } catch (err) {
            return false;
        }
    }
};
const y18n1 = (opts)=>{
    return y18n(opts, __default1);
};
class YError extends Error {
    constructor(msg){
        super(msg || 'yargs error');
        this.name = 'YError';
        Error.captureStackTrace(this, YError);
    }
}
const importMeta = {
    url: "https://deno.land/x/yargs@v17.2.1-deno/lib/platform-shims/deno.ts",
    main: false
};
const REQUIRE_ERROR = 'require is not supported by ESM';
const REQUIRE_DIRECTORY_ERROR = 'loading a directory of commands is not supported yet for ESM';
const argv = [
    'deno run',
    ...Deno.args
];
const __dirname = new URL('.', importMeta.url).pathname;
let cwd = '';
let env = {};
try {
    env = Deno.env.toObject();
    cwd = Deno.cwd();
} catch (err) {
    if (err.name !== 'PermissionDenied') {
        throw err;
    }
}
const path2 = {
    basename: basename2,
    dirname: dirname2,
    extname: extname2,
    relative: (p1, p2)=>{
        try {
            return mod1.relative(p1, p2);
        } catch (err1) {
            if (err1.name !== 'PermissionDenied') {
                throw err1;
            }
            return p1;
        }
    },
    resolve: mod1.resolve
};
const __default2 = {
    assert: {
        notStrictEqual: assertNotEquals,
        strictEqual: assertStrictEquals
    },
    cliui: ui,
    findUp: __default,
    getEnv: (key)=>{
        return env[key];
    },
    inspect: Deno.inspect,
    getCallerFile: ()=>undefined
    ,
    getProcessArgvBin: ()=>{
        return 'deno';
    },
    mainFilename: cwd,
    Parser: yargsParser,
    path: path2,
    process: {
        argv: ()=>argv
        ,
        cwd: ()=>cwd
        ,
        emitWarning: (warning, type)=>{},
        execPath: ()=>{
            try {
                return Deno.execPath();
            } catch (_err) {
                return 'deno';
            }
        },
        exit: Deno.exit,
        nextTick: window.queueMicrotask,
        stdColumns: 80 ?? null
    },
    readFileSync: Deno.readTextFileSync,
    require: ()=>{
        throw new YError(REQUIRE_ERROR);
    },
    requireDirectory: ()=>{
        throw new YError(REQUIRE_DIRECTORY_ERROR);
    },
    stringWidth: (str27)=>{
        return [
            ...str27
        ].length;
    },
    y18n: y18n1({
        directory: mod1.resolve(__dirname, '../../locales'),
        updateFiles: false
    })
};
function assertNotStrictEqual(actual, expected, shim2, message) {
    shim2.assert.notStrictEqual(actual, expected, message);
}
function assertSingleKey(actual, shim3) {
    shim3.assert.strictEqual(typeof actual, 'string');
}
function objectKeys(object) {
    return Object.keys(object);
}
const completionShTemplate = `###-begin-{{app_name}}-completions-###
#
# yargs command completion script
#
# Installation: {{app_path}} {{completion_command}} >> ~/.bashrc
#    or {{app_path}} {{completion_command}} >> ~/.bash_profile on OSX.
#
_{{app_name}}_yargs_completions()
{
    local cur_word args type_list

    cur_word="\${COMP_WORDS[COMP_CWORD]}"
    args=("\${COMP_WORDS[@]}")

    # ask yargs to generate completions.
    type_list=$({{app_path}} --get-yargs-completions "\${args[@]}")

    COMPREPLY=( $(compgen -W "\${type_list}" -- \${cur_word}) )

    # if no match was found, fall back to filename completion
    if [ \${#COMPREPLY[@]} -eq 0 ]; then
      COMPREPLY=()
    fi

    return 0
}
complete -o default -F _{{app_name}}_yargs_completions {{app_name}}
###-end-{{app_name}}-completions-###
`;
const completionZshTemplate = `#compdef {{app_name}}
###-begin-{{app_name}}-completions-###
#
# yargs command completion script
#
# Installation: {{app_path}} {{completion_command}} >> ~/.zshrc
#    or {{app_path}} {{completion_command}} >> ~/.zsh_profile on OSX.
#
_{{app_name}}_yargs_completions()
{
  local reply
  local si=$IFS
  IFS=$'\n' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" {{app_path}} --get-yargs-completions "\${words[@]}"))
  IFS=$si
  _describe 'values' reply
}
compdef _{{app_name}}_yargs_completions {{app_name}}
###-end-{{app_name}}-completions-###
`;
function isPromise(maybePromise) {
    return !!maybePromise && !!maybePromise.then && typeof maybePromise.then === 'function';
}
function parseCommand(cmd1) {
    const extraSpacesStrippedCommand = cmd1.replace(/\s{2,}/g, ' ');
    const splitCommand = extraSpacesStrippedCommand.split(/\s+(?![^[]*]|[^<]*>)/);
    const bregex = /\.*[\][<>]/g;
    const firstCommand = splitCommand.shift();
    if (!firstCommand) throw new Error(`No command found in: ${cmd1}`);
    const parsedCommand = {
        cmd: firstCommand.replace(bregex, ''),
        demanded: [],
        optional: []
    };
    splitCommand.forEach((cmd, i34)=>{
        let variadic = false;
        cmd = cmd.replace(/\s/g, '');
        if (/\.+[\]>]/.test(cmd) && i34 === splitCommand.length - 1) variadic = true;
        if (/^\[/.test(cmd)) {
            parsedCommand.optional.push({
                cmd: cmd.replace(bregex, '').split('|'),
                variadic
            });
        } else {
            parsedCommand.demanded.push({
                cmd: cmd.replace(bregex, '').split('|'),
                variadic
            });
        }
    });
    return parsedCommand;
}
const positionName = [
    'first',
    'second',
    'third',
    'fourth',
    'fifth',
    'sixth'
];
function argsert(arg1, arg2, arg3) {
    function parseArgs() {
        return typeof arg1 === 'object' ? [
            {
                demanded: [],
                optional: []
            },
            arg1,
            arg2
        ] : [
            parseCommand(`cmd ${arg1}`),
            arg2,
            arg3, 
        ];
    }
    try {
        let position = 0;
        const [parsed, callerArguments, _length] = parseArgs();
        const args = [].slice.call(callerArguments);
        while(args.length && args[args.length - 1] === undefined)args.pop();
        const length = _length || args.length;
        if (length < parsed.demanded.length) {
            throw new YError(`Not enough arguments provided. Expected ${parsed.demanded.length} but received ${args.length}.`);
        }
        const totalCommands = parsed.demanded.length + parsed.optional.length;
        if (length > totalCommands) {
            throw new YError(`Too many arguments provided. Expected max ${totalCommands} but received ${length}.`);
        }
        parsed.demanded.forEach((demanded)=>{
            const arg = args.shift();
            const observedType = guessType(arg);
            const matchingTypes = demanded.cmd.filter((type)=>type === observedType || type === '*'
            );
            if (matchingTypes.length === 0) argumentTypeError(observedType, demanded.cmd, position);
            position += 1;
        });
        parsed.optional.forEach((optional)=>{
            if (args.length === 0) return;
            const arg = args.shift();
            const observedType = guessType(arg);
            const matchingTypes = optional.cmd.filter((type)=>type === observedType || type === '*'
            );
            if (matchingTypes.length === 0) argumentTypeError(observedType, optional.cmd, position);
            position += 1;
        });
    } catch (err1) {
        console.warn(err1.stack);
    }
}
function guessType(arg) {
    if (Array.isArray(arg)) {
        return 'array';
    } else if (arg === null) {
        return 'null';
    }
    return typeof arg;
}
function argumentTypeError(observedType, allowedTypes, position) {
    throw new YError(`Invalid ${positionName[position] || 'manyith'} argument. Expected ${allowedTypes.join(' or ')} but received ${observedType}.`);
}
class GlobalMiddleware {
    constructor(yargs){
        this.globalMiddleware = [];
        this.frozens = [];
        this.yargs = yargs;
    }
    addMiddleware(callback, applyBeforeValidation, global = true, mutates = false) {
        argsert('<array|function> [boolean] [boolean] [boolean]', [
            callback,
            applyBeforeValidation,
            global
        ], arguments.length);
        if (Array.isArray(callback)) {
            for(let i35 = 0; i35 < callback.length; i35++){
                if (typeof callback[i35] !== 'function') {
                    throw Error('middleware must be a function');
                }
                const m = callback[i35];
                m.applyBeforeValidation = applyBeforeValidation;
                m.global = global;
            }
            Array.prototype.push.apply(this.globalMiddleware, callback);
        } else if (typeof callback === 'function') {
            const m = callback;
            m.applyBeforeValidation = applyBeforeValidation;
            m.global = global;
            m.mutates = mutates;
            this.globalMiddleware.push(callback);
        }
        return this.yargs;
    }
    addCoerceMiddleware(callback, option) {
        const aliases = this.yargs.getAliases();
        this.globalMiddleware = this.globalMiddleware.filter((m)=>{
            const toCheck = [
                ...aliases[option] || [],
                option
            ];
            if (!m.option) return true;
            else return !toCheck.includes(m.option);
        });
        callback.option = option;
        return this.addMiddleware(callback, true, true, true);
    }
    getMiddleware() {
        return this.globalMiddleware;
    }
    freeze() {
        this.frozens.push([
            ...this.globalMiddleware
        ]);
    }
    unfreeze() {
        const frozen = this.frozens.pop();
        if (frozen !== undefined) this.globalMiddleware = frozen;
    }
    reset() {
        this.globalMiddleware = this.globalMiddleware.filter((m)=>m.global
        );
    }
}
function commandMiddlewareFactory(commandMiddleware) {
    if (!commandMiddleware) return [];
    return commandMiddleware.map((middleware)=>{
        middleware.applyBeforeValidation = false;
        return middleware;
    });
}
function applyMiddleware(argv6, yargs, middlewares, beforeValidation) {
    return middlewares.reduce((acc, middleware)=>{
        if (middleware.applyBeforeValidation !== beforeValidation) {
            return acc;
        }
        if (middleware.mutates) {
            if (middleware.applied) return acc;
            middleware.applied = true;
        }
        if (isPromise(acc)) {
            return acc.then((initialObj)=>Promise.all([
                    initialObj,
                    middleware(initialObj, yargs), 
                ])
            ).then(([initialObj, middlewareObj])=>Object.assign(initialObj, middlewareObj)
            );
        } else {
            const result = middleware(acc, yargs);
            return isPromise(result) ? result.then((middlewareObj)=>Object.assign(acc, middlewareObj)
            ) : Object.assign(acc, result);
        }
    }, argv6);
}
function maybeAsyncResult(getResult, resultHandler, errorHandler = (err2)=>{
    throw err2;
}) {
    try {
        const result1 = isFunction(getResult) ? getResult() : getResult;
        return isPromise(result1) ? result1.then((result)=>resultHandler(result)
        ) : resultHandler(result1);
    } catch (err3) {
        return errorHandler(err3);
    }
}
function isFunction(arg) {
    return typeof arg === 'function';
}
function whichModule(exported) {
    if (typeof require === 'undefined') return null;
    for(let i36 = 0, files = Object.keys(require.cache), mod4; i36 < files.length; i36++){
        mod4 = require.cache[files[i36]];
        if (mod4.exports === exported) return mod4;
    }
    return null;
}
function objFilter(original = {}, filter = ()=>true
) {
    const obj = {};
    objectKeys(original).forEach((key)=>{
        if (filter(key, original[key])) {
            obj[key] = original[key];
        }
    });
    return obj;
}
function setBlocking(blocking) {
    if (typeof process === 'undefined') return;
    [
        process.stdout,
        process.stderr
    ].forEach((_stream)=>{
        const stream = _stream;
        if (stream._handle && stream.isTTY && typeof stream._handle.setBlocking === 'function') {
            stream._handle.setBlocking(blocking);
        }
    });
}
function isBoolean(fail) {
    return typeof fail === 'boolean';
}
function usage(yargs, shim4) {
    const __ = shim4.y18n.__;
    const self = {};
    const fails = [];
    self.failFn = function failFn(f) {
        fails.push(f);
    };
    let failMessage = null;
    let showHelpOnFail = true;
    self.showHelpOnFail = function showHelpOnFailFn(arg1 = true, arg2) {
        function parseFunctionArgs() {
            return typeof arg1 === 'string' ? [
                true,
                arg1
            ] : [
                arg1,
                arg2
            ];
        }
        const [enabled2, message] = parseFunctionArgs();
        failMessage = message;
        showHelpOnFail = enabled2;
        return self;
    };
    let failureOutput = false;
    self.fail = function fail(msg, err4) {
        const logger = yargs.getInternalMethods().getLoggerInstance();
        if (fails.length) {
            for(let i37 = fails.length - 1; i37 >= 0; --i37){
                const fail = fails[i37];
                if (isBoolean(fail)) {
                    if (err4) throw err4;
                    else if (msg) throw Error(msg);
                } else {
                    fail(msg, err4, self);
                }
            }
        } else {
            if (yargs.getExitProcess()) setBlocking(true);
            if (!failureOutput) {
                failureOutput = true;
                if (showHelpOnFail) {
                    yargs.showHelp('error');
                    logger.error();
                }
                if (msg || err4) logger.error(msg || err4);
                if (failMessage) {
                    if (msg || err4) logger.error('');
                    logger.error(failMessage);
                }
            }
            err4 = err4 || new YError(msg);
            if (yargs.getExitProcess()) {
                return yargs.exit(1);
            } else if (yargs.getInternalMethods().hasParseCallback()) {
                return yargs.exit(1, err4);
            } else {
                throw err4;
            }
        }
    };
    let usages = [];
    let usageDisabled = false;
    self.usage = (msg, description)=>{
        if (msg === null) {
            usageDisabled = true;
            usages = [];
            return self;
        }
        usageDisabled = false;
        usages.push([
            msg,
            description || ''
        ]);
        return self;
    };
    self.getUsage = ()=>{
        return usages;
    };
    self.getUsageDisabled = ()=>{
        return usageDisabled;
    };
    self.getPositionalGroupName = ()=>{
        return __('Positionals:');
    };
    let examples = [];
    self.example = (cmd, description)=>{
        examples.push([
            cmd,
            description || ''
        ]);
    };
    let commands = [];
    self.command = function command(cmd, description, isDefault, aliases, deprecated = false) {
        if (isDefault) {
            commands = commands.map((cmdArray)=>{
                cmdArray[2] = false;
                return cmdArray;
            });
        }
        commands.push([
            cmd,
            description || '',
            isDefault,
            aliases,
            deprecated
        ]);
    };
    self.getCommands = ()=>commands
    ;
    let descriptions = {};
    self.describe = function describe(keyOrKeys, desc) {
        if (Array.isArray(keyOrKeys)) {
            keyOrKeys.forEach((k)=>{
                self.describe(k, desc);
            });
        } else if (typeof keyOrKeys === 'object') {
            Object.keys(keyOrKeys).forEach((k)=>{
                self.describe(k, keyOrKeys[k]);
            });
        } else {
            descriptions[keyOrKeys] = desc;
        }
    };
    self.getDescriptions = ()=>descriptions
    ;
    let epilogs = [];
    self.epilog = (msg)=>{
        epilogs.push(msg);
    };
    let wrapSet = false;
    let wrap1;
    self.wrap = (cols)=>{
        wrapSet = true;
        wrap1 = cols;
    };
    function getWrap() {
        if (!wrapSet) {
            wrap1 = windowWidth();
            wrapSet = true;
        }
        return wrap1;
    }
    const deferY18nLookupPrefix = '__yargsString__:';
    self.deferY18nLookup = (str28)=>deferY18nLookupPrefix + str28
    ;
    self.help = function help() {
        if (cachedHelpMessage) return cachedHelpMessage;
        normalizeAliases();
        const base$0 = yargs.customScriptName ? yargs.$0 : shim4.path.basename(yargs.$0);
        const demandedOptions = yargs.getDemandedOptions();
        const demandedCommands = yargs.getDemandedCommands();
        const deprecatedOptions = yargs.getDeprecatedOptions();
        const groups = yargs.getGroups();
        const options = yargs.getOptions();
        let keys = [];
        keys = keys.concat(Object.keys(descriptions));
        keys = keys.concat(Object.keys(demandedOptions));
        keys = keys.concat(Object.keys(demandedCommands));
        keys = keys.concat(Object.keys(options.default));
        keys = keys.filter(filterHiddenOptions);
        keys = Object.keys(keys.reduce((acc, key)=>{
            if (key !== '_') acc[key] = true;
            return acc;
        }, {}));
        const theWrap = getWrap();
        const ui1 = shim4.cliui({
            width: theWrap,
            wrap: !!theWrap
        });
        if (!usageDisabled) {
            if (usages.length) {
                usages.forEach((usage1)=>{
                    ui1.div({
                        text: `${usage1[0].replace(/\$0/g, base$0)}`
                    });
                    if (usage1[1]) {
                        ui1.div({
                            text: `${usage1[1]}`,
                            padding: [
                                1,
                                0,
                                0,
                                0
                            ]
                        });
                    }
                });
                ui1.div();
            } else if (commands.length) {
                let u = null;
                if (demandedCommands._) {
                    u = `${base$0} <${__('command')}>\n`;
                } else {
                    u = `${base$0} [${__('command')}]\n`;
                }
                ui1.div(`${u}`);
            }
        }
        if (commands.length > 1 || commands.length === 1 && !commands[0][2]) {
            ui1.div(__('Commands:'));
            const context = yargs.getInternalMethods().getContext();
            const parentCommands = context.commands.length ? `${context.commands.join(' ')} ` : '';
            if (yargs.getInternalMethods().getParserConfiguration()['sort-commands'] === true) {
                commands = commands.sort((a, b)=>a[0].localeCompare(b[0])
                );
            }
            const prefix = base$0 ? `${base$0} ` : '';
            commands.forEach((command1)=>{
                const commandString = `${prefix}${parentCommands}${command1[0].replace(/^\$0 ?/, '')}`;
                ui1.span({
                    text: commandString,
                    padding: [
                        0,
                        2,
                        0,
                        2
                    ],
                    width: maxWidth1(commands, theWrap, `${base$0}${parentCommands}`) + 4
                }, {
                    text: command1[1]
                });
                const hints = [];
                if (command1[2]) hints.push(`[${__('default')}]`);
                if (command1[3] && command1[3].length) {
                    hints.push(`[${__('aliases:')} ${command1[3].join(', ')}]`);
                }
                if (command1[4]) {
                    if (typeof command1[4] === 'string') {
                        hints.push(`[${__('deprecated: %s', command1[4])}]`);
                    } else {
                        hints.push(`[${__('deprecated')}]`);
                    }
                }
                if (hints.length) {
                    ui1.div({
                        text: hints.join(' '),
                        padding: [
                            0,
                            0,
                            0,
                            2
                        ],
                        align: 'right'
                    });
                } else {
                    ui1.div();
                }
            });
            ui1.div();
        }
        const aliasKeys = (Object.keys(options.alias) || []).concat(Object.keys(yargs.parsed.newAliases) || []);
        keys = keys.filter((key)=>!yargs.parsed.newAliases[key] && aliasKeys.every((alias)=>(options.alias[alias] || []).indexOf(key) === -1
            )
        );
        const defaultGroup = __('Options:');
        if (!groups[defaultGroup]) groups[defaultGroup] = [];
        addUngroupedKeys(keys, options.alias, groups, defaultGroup);
        const isLongSwitch = (sw)=>/^--/.test(getText(sw))
        ;
        const displayedGroups = Object.keys(groups).filter((groupName)=>groups[groupName].length > 0
        ).map((groupName)=>{
            const normalizedKeys = groups[groupName].filter(filterHiddenOptions).map((key)=>{
                if (aliasKeys.includes(key)) return key;
                for(let i38 = 0, aliasKey; (aliasKey = aliasKeys[i38]) !== undefined; i38++){
                    if ((options.alias[aliasKey] || []).includes(key)) return aliasKey;
                }
                return key;
            });
            return {
                groupName,
                normalizedKeys
            };
        }).filter(({ normalizedKeys  })=>normalizedKeys.length > 0
        ).map(({ groupName , normalizedKeys  })=>{
            const switches = normalizedKeys.reduce((acc, key)=>{
                acc[key] = [
                    key
                ].concat(options.alias[key] || []).map((sw)=>{
                    if (groupName === self.getPositionalGroupName()) return sw;
                    else {
                        return (/^[0-9]$/.test(sw) ? options.boolean.includes(key) ? '-' : '--' : sw.length > 1 ? '--' : '-') + sw;
                    }
                }).sort((sw1, sw2)=>isLongSwitch(sw1) === isLongSwitch(sw2) ? 0 : isLongSwitch(sw1) ? 1 : -1
                ).join(', ');
                return acc;
            }, {});
            return {
                groupName,
                normalizedKeys,
                switches
            };
        });
        const shortSwitchesUsed = displayedGroups.filter(({ groupName  })=>groupName !== self.getPositionalGroupName()
        ).some(({ normalizedKeys , switches  })=>!normalizedKeys.every((key)=>isLongSwitch(switches[key])
            )
        );
        if (shortSwitchesUsed) {
            displayedGroups.filter(({ groupName  })=>groupName !== self.getPositionalGroupName()
            ).forEach(({ normalizedKeys , switches  })=>{
                normalizedKeys.forEach((key)=>{
                    if (isLongSwitch(switches[key])) {
                        switches[key] = addIndentation(switches[key], '-x, '.length);
                    }
                });
            });
        }
        displayedGroups.forEach(({ groupName , normalizedKeys , switches  })=>{
            ui1.div(groupName);
            normalizedKeys.forEach((key)=>{
                const kswitch = switches[key];
                let desc = descriptions[key] || '';
                let type = null;
                if (desc.includes(deferY18nLookupPrefix)) desc = __(desc.substring(deferY18nLookupPrefix.length));
                if (options.boolean.includes(key)) type = `[${__('boolean')}]`;
                if (options.count.includes(key)) type = `[${__('count')}]`;
                if (options.string.includes(key)) type = `[${__('string')}]`;
                if (options.normalize.includes(key)) type = `[${__('string')}]`;
                if (options.array.includes(key)) type = `[${__('array')}]`;
                if (options.number.includes(key)) type = `[${__('number')}]`;
                const deprecatedExtra = (deprecated)=>typeof deprecated === 'string' ? `[${__('deprecated: %s', deprecated)}]` : `[${__('deprecated')}]`
                ;
                const extra = [
                    key in deprecatedOptions ? deprecatedExtra(deprecatedOptions[key]) : null,
                    type,
                    key in demandedOptions ? `[${__('required')}]` : null,
                    options.choices && options.choices[key] ? `[${__('choices:')} ${self.stringifiedValues(options.choices[key])}]` : null,
                    defaultString(options.default[key], options.defaultDescription[key]), 
                ].filter(Boolean).join(' ');
                ui1.span({
                    text: getText(kswitch),
                    padding: [
                        0,
                        2,
                        0,
                        2 + getIndentation(kswitch)
                    ],
                    width: maxWidth1(switches, theWrap) + 4
                }, desc);
                if (extra) ui1.div({
                    text: extra,
                    padding: [
                        0,
                        0,
                        0,
                        2
                    ],
                    align: 'right'
                });
                else ui1.div();
            });
            ui1.div();
        });
        if (examples.length) {
            ui1.div(__('Examples:'));
            examples.forEach((example)=>{
                example[0] = example[0].replace(/\$0/g, base$0);
            });
            examples.forEach((example)=>{
                if (example[1] === '') {
                    ui1.div({
                        text: example[0],
                        padding: [
                            0,
                            2,
                            0,
                            2
                        ]
                    });
                } else {
                    ui1.div({
                        text: example[0],
                        padding: [
                            0,
                            2,
                            0,
                            2
                        ],
                        width: maxWidth1(examples, theWrap) + 4
                    }, {
                        text: example[1]
                    });
                }
            });
            ui1.div();
        }
        if (epilogs.length > 0) {
            const e = epilogs.map((epilog)=>epilog.replace(/\$0/g, base$0)
            ).join('\n');
            ui1.div(`${e}\n`);
        }
        return ui1.toString().replace(/\s*$/, '');
    };
    function maxWidth1(table, theWrap, modifier) {
        let width = 0;
        if (!Array.isArray(table)) {
            table = Object.values(table).map((v)=>[
                    v
                ]
            );
        }
        table.forEach((v)=>{
            width = Math.max(shim4.stringWidth(modifier ? `${modifier} ${getText(v[0])}` : getText(v[0])) + getIndentation(v[0]), width);
        });
        if (theWrap) width = Math.min(width, parseInt((theWrap * 0.5).toString(), 10));
        return width;
    }
    function normalizeAliases() {
        const demandedOptions = yargs.getDemandedOptions();
        const options = yargs.getOptions();
        (Object.keys(options.alias) || []).forEach((key)=>{
            options.alias[key].forEach((alias)=>{
                if (descriptions[alias]) self.describe(key, descriptions[alias]);
                if (alias in demandedOptions) yargs.demandOption(key, demandedOptions[alias]);
                if (options.boolean.includes(alias)) yargs.boolean(key);
                if (options.count.includes(alias)) yargs.count(key);
                if (options.string.includes(alias)) yargs.string(key);
                if (options.normalize.includes(alias)) yargs.normalize(key);
                if (options.array.includes(alias)) yargs.array(key);
                if (options.number.includes(alias)) yargs.number(key);
            });
        });
    }
    let cachedHelpMessage;
    self.cacheHelpMessage = function() {
        cachedHelpMessage = this.help();
    };
    self.clearCachedHelpMessage = function() {
        cachedHelpMessage = undefined;
    };
    self.hasCachedHelpMessage = function() {
        return !!cachedHelpMessage;
    };
    function addUngroupedKeys(keys, aliases, groups, defaultGroup) {
        let groupedKeys = [];
        let toCheck = null;
        Object.keys(groups).forEach((group)=>{
            groupedKeys = groupedKeys.concat(groups[group]);
        });
        keys.forEach((key)=>{
            toCheck = [
                key
            ].concat(aliases[key]);
            if (!toCheck.some((k)=>groupedKeys.indexOf(k) !== -1
            )) {
                groups[defaultGroup].push(key);
            }
        });
        return groupedKeys;
    }
    function filterHiddenOptions(key) {
        return yargs.getOptions().hiddenOptions.indexOf(key) < 0 || yargs.parsed.argv[yargs.getOptions().showHiddenOpt];
    }
    self.showHelp = (level)=>{
        const logger = yargs.getInternalMethods().getLoggerInstance();
        if (!level) level = 'error';
        const emit = typeof level === 'function' ? level : logger[level];
        emit(self.help());
    };
    self.functionDescription = (fn)=>{
        const description = fn.name ? shim4.Parser.decamelize(fn.name, '-') : __('generated-value');
        return [
            '(',
            description,
            ')'
        ].join('');
    };
    self.stringifiedValues = function stringifiedValues(values, separator) {
        let string = '';
        const sep7 = separator || ', ';
        const array = [].concat(values);
        if (!values || !array.length) return string;
        array.forEach((value)=>{
            if (string.length) string += sep7;
            string += JSON.stringify(value);
        });
        return string;
    };
    function defaultString(value, defaultDescription) {
        let string = `[${__('default:')} `;
        if (value === undefined && !defaultDescription) return null;
        if (defaultDescription) {
            string += defaultDescription;
        } else {
            switch(typeof value){
                case 'string':
                    string += `"${value}"`;
                    break;
                case 'object':
                    string += JSON.stringify(value);
                    break;
                default:
                    string += value;
            }
        }
        return `${string}]`;
    }
    function windowWidth() {
        if (shim4.process.stdColumns) {
            return Math.min(80, shim4.process.stdColumns);
        } else {
            return 80;
        }
    }
    let version = null;
    self.version = (ver)=>{
        version = ver;
    };
    self.showVersion = (level)=>{
        const logger = yargs.getInternalMethods().getLoggerInstance();
        if (!level) level = 'error';
        const emit = typeof level === 'function' ? level : logger[level];
        emit(version);
    };
    self.reset = function reset(localLookup) {
        failMessage = null;
        failureOutput = false;
        usages = [];
        usageDisabled = false;
        epilogs = [];
        examples = [];
        commands = [];
        descriptions = objFilter(descriptions, (k)=>!localLookup[k]
        );
        return self;
    };
    const frozens = [];
    self.freeze = function freeze() {
        frozens.push({
            failMessage,
            failureOutput,
            usages,
            usageDisabled,
            epilogs,
            examples,
            commands,
            descriptions
        });
    };
    self.unfreeze = function unfreeze() {
        const frozen = frozens.pop();
        if (!frozen) return;
        ({ failMessage , failureOutput , usages , usageDisabled , epilogs , examples , commands , descriptions ,  } = frozen);
    };
    return self;
}
function isIndentedText(text) {
    return typeof text === 'object';
}
function addIndentation(text, indent) {
    return isIndentedText(text) ? {
        text: text.text,
        indentation: text.indentation + indent
    } : {
        text,
        indentation: indent
    };
}
function getIndentation(text) {
    return isIndentedText(text) ? text.indentation : 0;
}
function getText(text) {
    return isIndentedText(text) ? text.text : text;
}
function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    let i39;
    for(i39 = 0; i39 <= b.length; i39++){
        matrix[i39] = [
            i39
        ];
    }
    let j;
    for(j = 0; j <= a.length; j++){
        matrix[0][j] = j;
    }
    for(i39 = 1; i39 <= b.length; i39++){
        for(j = 1; j <= a.length; j++){
            if (b.charAt(i39 - 1) === a.charAt(j - 1)) {
                matrix[i39][j] = matrix[i39 - 1][j - 1];
            } else {
                if (i39 > 1 && j > 1 && b.charAt(i39 - 2) === a.charAt(j - 1) && b.charAt(i39 - 1) === a.charAt(j - 2)) {
                    matrix[i39][j] = matrix[i39 - 2][j - 2] + 1;
                } else {
                    matrix[i39][j] = Math.min(matrix[i39 - 1][j - 1] + 1, Math.min(matrix[i39][j - 1] + 1, matrix[i39 - 1][j] + 1));
                }
            }
        }
    }
    return matrix[b.length][a.length];
}
const specialKeys = [
    '$0',
    '--',
    '_'
];
function validation(yargs, usage1, shim5) {
    const __ = shim5.y18n.__;
    const __n = shim5.y18n.__n;
    const self = {};
    self.nonOptionCount = function nonOptionCount(argv7) {
        const demandedCommands = yargs.getDemandedCommands();
        const positionalCount = argv7._.length + (argv7['--'] ? argv7['--'].length : 0);
        const _s = positionalCount - yargs.getInternalMethods().getContext().commands.length;
        if (demandedCommands._ && (_s < demandedCommands._.min || _s > demandedCommands._.max)) {
            if (_s < demandedCommands._.min) {
                if (demandedCommands._.minMsg !== undefined) {
                    usage1.fail(demandedCommands._.minMsg ? demandedCommands._.minMsg.replace(/\$0/g, _s.toString()).replace(/\$1/, demandedCommands._.min.toString()) : null);
                } else {
                    usage1.fail(__n('Not enough non-option arguments: got %s, need at least %s', 'Not enough non-option arguments: got %s, need at least %s', _s, _s.toString(), demandedCommands._.min.toString()));
                }
            } else if (_s > demandedCommands._.max) {
                if (demandedCommands._.maxMsg !== undefined) {
                    usage1.fail(demandedCommands._.maxMsg ? demandedCommands._.maxMsg.replace(/\$0/g, _s.toString()).replace(/\$1/, demandedCommands._.max.toString()) : null);
                } else {
                    usage1.fail(__n('Too many non-option arguments: got %s, maximum of %s', 'Too many non-option arguments: got %s, maximum of %s', _s, _s.toString(), demandedCommands._.max.toString()));
                }
            }
        }
    };
    self.positionalCount = function positionalCount(required, observed) {
        if (observed < required) {
            usage1.fail(__n('Not enough non-option arguments: got %s, need at least %s', 'Not enough non-option arguments: got %s, need at least %s', observed, observed + '', required + ''));
        }
    };
    self.requiredArguments = function requiredArguments(argv8, demandedOptions) {
        let missing = null;
        for (const key of Object.keys(demandedOptions)){
            if (!Object.prototype.hasOwnProperty.call(argv8, key) || typeof argv8[key] === 'undefined') {
                missing = missing || {};
                missing[key] = demandedOptions[key];
            }
        }
        if (missing) {
            const customMsgs = [];
            for (const key of Object.keys(missing)){
                const msg = missing[key];
                if (msg && customMsgs.indexOf(msg) < 0) {
                    customMsgs.push(msg);
                }
            }
            const customMsg = customMsgs.length ? `\n${customMsgs.join('\n')}` : '';
            usage1.fail(__n('Missing required argument: %s', 'Missing required arguments: %s', Object.keys(missing).length, Object.keys(missing).join(', ') + customMsg));
        }
    };
    self.unknownArguments = function unknownArguments(argv9, aliases, positionalMap, isDefaultCommand, checkPositionals = true) {
        var _a;
        const commandKeys = yargs.getInternalMethods().getCommandInstance().getCommands();
        const unknown = [];
        const currentContext = yargs.getInternalMethods().getContext();
        Object.keys(argv9).forEach((key)=>{
            if (!specialKeys.includes(key) && !Object.prototype.hasOwnProperty.call(positionalMap, key) && !Object.prototype.hasOwnProperty.call(yargs.getInternalMethods().getParseContext(), key) && !self.isValidAndSomeAliasIsNotNew(key, aliases)) {
                unknown.push(key);
            }
        });
        if (checkPositionals && (currentContext.commands.length > 0 || commandKeys.length > 0 || isDefaultCommand)) {
            argv9._.slice(currentContext.commands.length).forEach((key)=>{
                if (!commandKeys.includes('' + key)) {
                    unknown.push('' + key);
                }
            });
        }
        if (checkPositionals) {
            const demandedCommands = yargs.getDemandedCommands();
            const maxNonOptDemanded = ((_a = demandedCommands._) === null || _a === void 0 ? void 0 : _a.max) || 0;
            const expected = currentContext.commands.length + maxNonOptDemanded;
            if (expected < argv9._.length) {
                argv9._.slice(expected).forEach((key)=>{
                    key = String(key);
                    if (!currentContext.commands.includes(key) && !unknown.includes(key)) {
                        unknown.push(key);
                    }
                });
            }
        }
        if (unknown.length) {
            usage1.fail(__n('Unknown argument: %s', 'Unknown arguments: %s', unknown.length, unknown.join(', ')));
        }
    };
    self.unknownCommands = function unknownCommands(argv10) {
        const commandKeys = yargs.getInternalMethods().getCommandInstance().getCommands();
        const unknown = [];
        const currentContext = yargs.getInternalMethods().getContext();
        if (currentContext.commands.length > 0 || commandKeys.length > 0) {
            argv10._.slice(currentContext.commands.length).forEach((key)=>{
                if (!commandKeys.includes('' + key)) {
                    unknown.push('' + key);
                }
            });
        }
        if (unknown.length > 0) {
            usage1.fail(__n('Unknown command: %s', 'Unknown commands: %s', unknown.length, unknown.join(', ')));
            return true;
        } else {
            return false;
        }
    };
    self.isValidAndSomeAliasIsNotNew = function isValidAndSomeAliasIsNotNew(key, aliases) {
        if (!Object.prototype.hasOwnProperty.call(aliases, key)) {
            return false;
        }
        const newAliases = yargs.parsed.newAliases;
        return [
            key,
            ...aliases[key]
        ].some((a)=>!Object.prototype.hasOwnProperty.call(newAliases, a) || !newAliases[key]
        );
    };
    self.limitedChoices = function limitedChoices(argv11) {
        const options = yargs.getOptions();
        const invalid = {};
        if (!Object.keys(options.choices).length) return;
        Object.keys(argv11).forEach((key)=>{
            if (specialKeys.indexOf(key) === -1 && Object.prototype.hasOwnProperty.call(options.choices, key)) {
                [].concat(argv11[key]).forEach((value)=>{
                    if (options.choices[key].indexOf(value) === -1 && value !== undefined) {
                        invalid[key] = (invalid[key] || []).concat(value);
                    }
                });
            }
        });
        const invalidKeys = Object.keys(invalid);
        if (!invalidKeys.length) return;
        let msg = __('Invalid values:');
        invalidKeys.forEach((key)=>{
            msg += `\n  ${__('Argument: %s, Given: %s, Choices: %s', key, usage1.stringifiedValues(invalid[key]), usage1.stringifiedValues(options.choices[key]))}`;
        });
        usage1.fail(msg);
    };
    let implied = {};
    self.implies = function implies(key, value) {
        argsert('<string|object> [array|number|string]', [
            key,
            value
        ], arguments.length);
        if (typeof key === 'object') {
            Object.keys(key).forEach((k)=>{
                self.implies(k, key[k]);
            });
        } else {
            yargs.global(key);
            if (!implied[key]) {
                implied[key] = [];
            }
            if (Array.isArray(value)) {
                value.forEach((i40)=>self.implies(key, i40)
                );
            } else {
                assertNotStrictEqual(value, undefined, shim5);
                implied[key].push(value);
            }
        }
    };
    self.getImplied = function getImplied() {
        return implied;
    };
    function keyExists(argv12, val) {
        const num = Number(val);
        val = isNaN(num) ? val : num;
        if (typeof val === 'number') {
            val = argv12._.length >= val;
        } else if (val.match(/^--no-.+/)) {
            val = val.match(/^--no-(.+)/)[1];
            val = !Object.prototype.hasOwnProperty.call(argv12, val);
        } else {
            val = Object.prototype.hasOwnProperty.call(argv12, val);
        }
        return val;
    }
    self.implications = function implications(argv13) {
        const implyFail = [];
        Object.keys(implied).forEach((key1)=>{
            const origKey = key1;
            (implied[key1] || []).forEach((value)=>{
                let key = origKey;
                const origValue = value;
                key = keyExists(argv13, key);
                value = keyExists(argv13, value);
                if (key && !value) {
                    implyFail.push(` ${origKey} -> ${origValue}`);
                }
            });
        });
        if (implyFail.length) {
            let msg = `${__('Implications failed:')}\n`;
            implyFail.forEach((value)=>{
                msg += value;
            });
            usage1.fail(msg);
        }
    };
    let conflicting = {};
    self.conflicts = function conflicts(key, value) {
        argsert('<string|object> [array|string]', [
            key,
            value
        ], arguments.length);
        if (typeof key === 'object') {
            Object.keys(key).forEach((k)=>{
                self.conflicts(k, key[k]);
            });
        } else {
            yargs.global(key);
            if (!conflicting[key]) {
                conflicting[key] = [];
            }
            if (Array.isArray(value)) {
                value.forEach((i41)=>self.conflicts(key, i41)
                );
            } else {
                conflicting[key].push(value);
            }
        }
    };
    self.getConflicting = ()=>conflicting
    ;
    self.conflicting = function conflictingFn(argv14) {
        Object.keys(argv14).forEach((key)=>{
            if (conflicting[key]) {
                conflicting[key].forEach((value)=>{
                    if (value && argv14[key] !== undefined && argv14[value] !== undefined) {
                        usage1.fail(__('Arguments %s and %s are mutually exclusive', key, value));
                    }
                });
            }
        });
        if (yargs.getInternalMethods().getParserConfiguration()['strip-dashed']) {
            Object.keys(conflicting).forEach((key)=>{
                conflicting[key].forEach((value)=>{
                    if (value && argv14[shim5.Parser.camelCase(key)] !== undefined && argv14[shim5.Parser.camelCase(value)] !== undefined) {
                        usage1.fail(__('Arguments %s and %s are mutually exclusive', key, value));
                    }
                });
            });
        }
    };
    self.recommendCommands = function recommendCommands(cmd, potentialCommands) {
        const threshold = 3;
        potentialCommands = potentialCommands.sort((a, b)=>b.length - a.length
        );
        let recommended = null;
        let bestDistance = Infinity;
        for(let i42 = 0, candidate; (candidate = potentialCommands[i42]) !== undefined; i42++){
            const d = levenshtein(cmd, candidate);
            if (d <= threshold && d < bestDistance) {
                bestDistance = d;
                recommended = candidate;
            }
        }
        if (recommended) usage1.fail(__('Did you mean %s?', recommended));
    };
    self.reset = function reset(localLookup) {
        implied = objFilter(implied, (k)=>!localLookup[k]
        );
        conflicting = objFilter(conflicting, (k)=>!localLookup[k]
        );
        return self;
    };
    const frozens = [];
    self.freeze = function freeze() {
        frozens.push({
            implied,
            conflicting
        });
    };
    self.unfreeze = function unfreeze() {
        const frozen = frozens.pop();
        assertNotStrictEqual(frozen, undefined, shim5);
        ({ implied , conflicting  } = frozen);
    };
    return self;
}
let previouslyVisitedConfigs = [];
let shim1;
function applyExtends(config, cwd1, mergeExtends, _shim) {
    shim1 = _shim;
    let defaultConfig = {};
    if (Object.prototype.hasOwnProperty.call(config, 'extends')) {
        if (typeof config.extends !== 'string') return defaultConfig;
        const isPath = /\.json|\..*rc$/.test(config.extends);
        let pathToDefault = null;
        if (!isPath) {
            try {
                pathToDefault = require.resolve(config.extends);
            } catch (_err) {
                return config;
            }
        } else {
            pathToDefault = getPathToDefaultConfig(cwd1, config.extends);
        }
        checkForCircularExtends(pathToDefault);
        previouslyVisitedConfigs.push(pathToDefault);
        defaultConfig = isPath ? JSON.parse(shim1.readFileSync(pathToDefault, 'utf8')) : require(config.extends);
        delete config.extends;
        defaultConfig = applyExtends(defaultConfig, shim1.path.dirname(pathToDefault), mergeExtends, shim1);
    }
    previouslyVisitedConfigs = [];
    return mergeExtends ? mergeDeep(defaultConfig, config) : Object.assign({}, defaultConfig, config);
}
function checkForCircularExtends(cfgPath) {
    if (previouslyVisitedConfigs.indexOf(cfgPath) > -1) {
        throw new YError(`Circular extended configurations: '${cfgPath}'.`);
    }
}
function getPathToDefaultConfig(cwd2, pathToExtend) {
    return shim1.path.resolve(cwd2, pathToExtend);
}
function mergeDeep(config1, config2) {
    const target = {};
    function isObject1(obj) {
        return obj && typeof obj === 'object' && !Array.isArray(obj);
    }
    Object.assign(target, config1);
    for (const key of Object.keys(config2)){
        if (isObject1(config2[key]) && isObject1(target[key])) {
            target[key] = mergeDeep(config1[key], config2[key]);
        } else {
            target[key] = config2[key];
        }
    }
    return target;
}
var __classPrivateFieldSet = this && this.__classPrivateFieldSet || function(receiver, state1, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state1 === "function" ? receiver !== state1 || !f : !state1.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state1.set(receiver, value), value;
};
const DEFAULT_MARKER = /(^\*)|(^\$0)/;
var __classPrivateFieldGet = this && this.__classPrivateFieldGet || function(receiver, state2, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state2 === "function" ? receiver !== state2 || !f : !state2.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state2.get(receiver);
};
var _YargsInstance_command, _YargsInstance_cwd, _YargsInstance_context, _YargsInstance_completion, _YargsInstance_completionCommand, _YargsInstance_defaultShowHiddenOpt, _YargsInstance_exitError, _YargsInstance_detectLocale, _YargsInstance_emittedWarnings, _YargsInstance_exitProcess, _YargsInstance_frozens, _YargsInstance_globalMiddleware, _YargsInstance_groups, _YargsInstance_hasOutput, _YargsInstance_helpOpt, _YargsInstance_logger, _YargsInstance_output, _YargsInstance_options, _YargsInstance_parentRequire, _YargsInstance_parserConfig, _YargsInstance_parseFn, _YargsInstance_parseContext, _YargsInstance_pkgs, _YargsInstance_preservedGroups, _YargsInstance_processArgs, _YargsInstance_recommendCommands, _YargsInstance_shim, _YargsInstance_strict, _YargsInstance_strictCommands, _YargsInstance_strictOptions, _YargsInstance_usage, _YargsInstance_versionOpt, _YargsInstance_validation;
function YargsFactory(_shim) {
    return (processArgs = [], cwd3 = _shim.process.cwd(), parentRequire)=>{
        const yargs = new YargsInstance(processArgs, cwd3, parentRequire, _shim);
        Object.defineProperty(yargs, 'argv', {
            get: ()=>{
                return yargs.parse();
            },
            enumerable: true
        });
        yargs.help();
        yargs.version();
        return yargs;
    };
}
const kCopyDoubleDash = Symbol('copyDoubleDash');
const kCreateLogger = Symbol('copyDoubleDash');
const kDeleteFromParserHintObject = Symbol('deleteFromParserHintObject');
const kEmitWarning = Symbol('emitWarning');
const kFreeze = Symbol('freeze');
const kGetDollarZero = Symbol('getDollarZero');
const kGetParserConfiguration = Symbol('getParserConfiguration');
const kGuessLocale = Symbol('guessLocale');
const kGuessVersion = Symbol('guessVersion');
const kParsePositionalNumbers = Symbol('parsePositionalNumbers');
const kPkgUp = Symbol('pkgUp');
const kPopulateParserHintArray = Symbol('populateParserHintArray');
const kPopulateParserHintSingleValueDictionary = Symbol('populateParserHintSingleValueDictionary');
const kPopulateParserHintArrayDictionary = Symbol('populateParserHintArrayDictionary');
const kPopulateParserHintDictionary = Symbol('populateParserHintDictionary');
const kSanitizeKey = Symbol('sanitizeKey');
const kSetKey = Symbol('setKey');
const kUnfreeze = Symbol('unfreeze');
const kValidateAsync = Symbol('validateAsync');
const kGetCommandInstance = Symbol('getCommandInstance');
const kGetContext = Symbol('getContext');
const kGetHasOutput = Symbol('getHasOutput');
const kGetLoggerInstance = Symbol('getLoggerInstance');
const kGetParseContext = Symbol('getParseContext');
const kGetUsageInstance = Symbol('getUsageInstance');
const kGetValidationInstance = Symbol('getValidationInstance');
const kHasParseCallback = Symbol('hasParseCallback');
const kPostProcess = Symbol('postProcess');
const kRebase = Symbol('rebase');
const kReset = Symbol('reset');
const kRunYargsParserAndExecuteCommands = Symbol('runYargsParserAndExecuteCommands');
const kRunValidation = Symbol('runValidation');
const kSetHasOutput = Symbol('setHasOutput');
const kTrackManuallySetKeys = Symbol('kTrackManuallySetKeys');
function isYargsInstance(y) {
    return !!y && typeof y.getInternalMethods === 'function';
}
class CommandInstance {
    constructor(usage2, validation1, globalMiddleware, shim6){
        this.requireCache = new Set();
        this.handlers = {};
        this.aliasMap = {};
        this.frozens = [];
        this.shim = shim6;
        this.usage = usage2;
        this.globalMiddleware = globalMiddleware;
        this.validation = validation1;
    }
    addDirectory(dir, req, callerFile, opts) {
        opts = opts || {};
        if (typeof opts.recurse !== 'boolean') opts.recurse = false;
        if (!Array.isArray(opts.extensions)) opts.extensions = [
            'js'
        ];
        const parentVisit = typeof opts.visit === 'function' ? opts.visit : (o)=>o
        ;
        opts.visit = (obj, joined, filename)=>{
            const visited = parentVisit(obj, joined, filename);
            if (visited) {
                if (this.requireCache.has(joined)) return visited;
                else this.requireCache.add(joined);
                this.addHandler(visited);
            }
            return visited;
        };
        this.shim.requireDirectory({
            require: req,
            filename: callerFile
        }, dir, opts);
    }
    addHandler(cmd, description, builder, handler, commandMiddleware, deprecated) {
        let aliases = [];
        const middlewares = commandMiddlewareFactory(commandMiddleware);
        handler = handler || (()=>{});
        if (Array.isArray(cmd)) {
            if (isCommandAndAliases(cmd)) {
                [cmd, ...aliases] = cmd;
            } else {
                for (const command1 of cmd){
                    this.addHandler(command1);
                }
            }
        } else if (isCommandHandlerDefinition(cmd)) {
            let command2 = Array.isArray(cmd.command) || typeof cmd.command === 'string' ? cmd.command : this.moduleName(cmd);
            if (cmd.aliases) command2 = [].concat(command2).concat(cmd.aliases);
            this.addHandler(command2, this.extractDesc(cmd), cmd.builder, cmd.handler, cmd.middlewares, cmd.deprecated);
            return;
        } else if (isCommandBuilderDefinition(builder)) {
            this.addHandler([
                cmd
            ].concat(aliases), description, builder.builder, builder.handler, builder.middlewares, builder.deprecated);
            return;
        }
        if (typeof cmd === 'string') {
            const parsedCommand = parseCommand(cmd);
            aliases = aliases.map((alias)=>parseCommand(alias).cmd
            );
            let isDefault = false;
            const parsedAliases = [
                parsedCommand.cmd
            ].concat(aliases).filter((c)=>{
                if (DEFAULT_MARKER.test(c)) {
                    isDefault = true;
                    return false;
                }
                return true;
            });
            if (parsedAliases.length === 0 && isDefault) parsedAliases.push('$0');
            if (isDefault) {
                parsedCommand.cmd = parsedAliases[0];
                aliases = parsedAliases.slice(1);
                cmd = cmd.replace(DEFAULT_MARKER, parsedCommand.cmd);
            }
            aliases.forEach((alias)=>{
                this.aliasMap[alias] = parsedCommand.cmd;
            });
            if (description !== false) {
                this.usage.command(cmd, description, isDefault, aliases, deprecated);
            }
            this.handlers[parsedCommand.cmd] = {
                original: cmd,
                description,
                handler,
                builder: builder || {},
                middlewares,
                deprecated,
                demanded: parsedCommand.demanded,
                optional: parsedCommand.optional
            };
            if (isDefault) this.defaultCommand = this.handlers[parsedCommand.cmd];
        }
    }
    getCommandHandlers() {
        return this.handlers;
    }
    getCommands() {
        return Object.keys(this.handlers).concat(Object.keys(this.aliasMap));
    }
    hasDefaultCommand() {
        return !!this.defaultCommand;
    }
    runCommand(command3, yargs, parsed, commandIndex, helpOnly, helpOrVersionSet) {
        const commandHandler = this.handlers[command3] || this.handlers[this.aliasMap[command3]] || this.defaultCommand;
        const currentContext = yargs.getInternalMethods().getContext();
        const parentCommands = currentContext.commands.slice();
        const isDefaultCommand = !command3;
        if (command3) {
            currentContext.commands.push(command3);
            currentContext.fullCommands.push(commandHandler.original);
        }
        const builderResult = this.applyBuilderUpdateUsageAndParse(isDefaultCommand, commandHandler, yargs, parsed.aliases, parentCommands, commandIndex, helpOnly, helpOrVersionSet);
        return isPromise(builderResult) ? builderResult.then((result)=>this.applyMiddlewareAndGetResult(isDefaultCommand, commandHandler, result.innerArgv, currentContext, helpOnly, result.aliases, yargs)
        ) : this.applyMiddlewareAndGetResult(isDefaultCommand, commandHandler, builderResult.innerArgv, currentContext, helpOnly, builderResult.aliases, yargs);
    }
    applyBuilderUpdateUsageAndParse(isDefaultCommand, commandHandler, yargs, aliases, parentCommands, commandIndex, helpOnly, helpOrVersionSet) {
        const builder = commandHandler.builder;
        let innerYargs = yargs;
        if (isCommandBuilderCallback(builder)) {
            const builderOutput = builder(yargs.getInternalMethods().reset(aliases), helpOrVersionSet);
            if (isPromise(builderOutput)) {
                return builderOutput.then((output)=>{
                    innerYargs = isYargsInstance(output) ? output : yargs;
                    return this.parseAndUpdateUsage(isDefaultCommand, commandHandler, innerYargs, parentCommands, commandIndex, helpOnly);
                });
            }
        } else if (isCommandBuilderOptionDefinitions(builder)) {
            innerYargs = yargs.getInternalMethods().reset(aliases);
            Object.keys(commandHandler.builder).forEach((key)=>{
                innerYargs.option(key, builder[key]);
            });
        }
        return this.parseAndUpdateUsage(isDefaultCommand, commandHandler, innerYargs, parentCommands, commandIndex, helpOnly);
    }
    parseAndUpdateUsage(isDefaultCommand, commandHandler, innerYargs, parentCommands, commandIndex, helpOnly) {
        if (isDefaultCommand) innerYargs.getInternalMethods().getUsageInstance().unfreeze();
        if (this.shouldUpdateUsage(innerYargs)) {
            innerYargs.getInternalMethods().getUsageInstance().usage(this.usageFromParentCommandsCommandHandler(parentCommands, commandHandler), commandHandler.description);
        }
        const innerArgv = innerYargs.getInternalMethods().runYargsParserAndExecuteCommands(null, undefined, true, commandIndex, helpOnly);
        return isPromise(innerArgv) ? innerArgv.then((argv15)=>({
                aliases: innerYargs.parsed.aliases,
                innerArgv: argv15
            })
        ) : {
            aliases: innerYargs.parsed.aliases,
            innerArgv: innerArgv
        };
    }
    shouldUpdateUsage(yargs) {
        return !yargs.getInternalMethods().getUsageInstance().getUsageDisabled() && yargs.getInternalMethods().getUsageInstance().getUsage().length === 0;
    }
    usageFromParentCommandsCommandHandler(parentCommands, commandHandler) {
        const c1 = DEFAULT_MARKER.test(commandHandler.original) ? commandHandler.original.replace(DEFAULT_MARKER, '').trim() : commandHandler.original;
        const pc = parentCommands.filter((c)=>{
            return !DEFAULT_MARKER.test(c);
        });
        pc.push(c1);
        return `$0 ${pc.join(' ')}`;
    }
    applyMiddlewareAndGetResult(isDefaultCommand, commandHandler, innerArgv, currentContext, helpOnly, aliases, yargs) {
        let positionalMap = {};
        if (helpOnly) return innerArgv;
        if (!yargs.getInternalMethods().getHasOutput()) {
            positionalMap = this.populatePositionals(commandHandler, innerArgv, currentContext, yargs);
        }
        const middlewares = this.globalMiddleware.getMiddleware().slice(0).concat(commandHandler.middlewares);
        innerArgv = applyMiddleware(innerArgv, yargs, middlewares, true);
        if (!yargs.getInternalMethods().getHasOutput()) {
            const validation2 = yargs.getInternalMethods().runValidation(aliases, positionalMap, yargs.parsed.error, isDefaultCommand);
            innerArgv = maybeAsyncResult(innerArgv, (result)=>{
                validation2(result);
                return result;
            });
        }
        if (commandHandler.handler && !yargs.getInternalMethods().getHasOutput()) {
            yargs.getInternalMethods().setHasOutput();
            const populateDoubleDash = !!yargs.getOptions().configuration['populate--'];
            yargs.getInternalMethods().postProcess(innerArgv, populateDoubleDash, false, false);
            innerArgv = applyMiddleware(innerArgv, yargs, middlewares, false);
            innerArgv = maybeAsyncResult(innerArgv, (result)=>{
                const handlerResult = commandHandler.handler(result);
                return isPromise(handlerResult) ? handlerResult.then(()=>result
                ) : result;
            });
            if (!isDefaultCommand) {
                yargs.getInternalMethods().getUsageInstance().cacheHelpMessage();
            }
            if (isPromise(innerArgv) && !yargs.getInternalMethods().hasParseCallback()) {
                innerArgv.catch((error)=>{
                    try {
                        yargs.getInternalMethods().getUsageInstance().fail(null, error);
                    } catch (_err) {}
                });
            }
        }
        if (!isDefaultCommand) {
            currentContext.commands.pop();
            currentContext.fullCommands.pop();
        }
        return innerArgv;
    }
    populatePositionals(commandHandler, argv16, context, yargs) {
        argv16._ = argv16._.slice(context.commands.length);
        const demanded = commandHandler.demanded.slice(0);
        const optional = commandHandler.optional.slice(0);
        const positionalMap = {};
        this.validation.positionalCount(demanded.length, argv16._.length);
        while(demanded.length){
            const demand = demanded.shift();
            this.populatePositional(demand, argv16, positionalMap);
        }
        while(optional.length){
            const maybe = optional.shift();
            this.populatePositional(maybe, argv16, positionalMap);
        }
        argv16._ = context.commands.concat(argv16._.map((a)=>'' + a
        ));
        this.postProcessPositionals(argv16, positionalMap, this.cmdToParseOptions(commandHandler.original), yargs);
        return positionalMap;
    }
    populatePositional(positional, argv17, positionalMap) {
        const cmd = positional.cmd[0];
        if (positional.variadic) {
            positionalMap[cmd] = argv17._.splice(0).map(String);
        } else {
            if (argv17._.length) positionalMap[cmd] = [
                String(argv17._.shift())
            ];
        }
    }
    cmdToParseOptions(cmdString) {
        const parseOptions = {
            array: [],
            default: {},
            alias: {},
            demand: {}
        };
        const parsed = parseCommand(cmdString);
        parsed.demanded.forEach((d)=>{
            const [cmd, ...aliases] = d.cmd;
            if (d.variadic) {
                parseOptions.array.push(cmd);
                parseOptions.default[cmd] = [];
            }
            parseOptions.alias[cmd] = aliases;
            parseOptions.demand[cmd] = true;
        });
        parsed.optional.forEach((o)=>{
            const [cmd, ...aliases] = o.cmd;
            if (o.variadic) {
                parseOptions.array.push(cmd);
                parseOptions.default[cmd] = [];
            }
            parseOptions.alias[cmd] = aliases;
        });
        return parseOptions;
    }
    postProcessPositionals(argv18, positionalMap, parseOptions, yargs) {
        const options = Object.assign({}, yargs.getOptions());
        options.default = Object.assign(parseOptions.default, options.default);
        for (const key1 of Object.keys(parseOptions.alias)){
            options.alias[key1] = (options.alias[key1] || []).concat(parseOptions.alias[key1]);
        }
        options.array = options.array.concat(parseOptions.array);
        options.config = {};
        const unparsed = [];
        Object.keys(positionalMap).forEach((key)=>{
            positionalMap[key].map((value)=>{
                if (options.configuration['unknown-options-as-args']) options.key[key] = true;
                unparsed.push(`--${key}`);
                unparsed.push(value);
            });
        });
        if (!unparsed.length) return;
        const config = Object.assign({}, options.configuration, {
            'populate--': false
        });
        const parsed = this.shim.Parser.detailed(unparsed, Object.assign({}, options, {
            configuration: config
        }));
        if (parsed.error) {
            yargs.getInternalMethods().getUsageInstance().fail(parsed.error.message, parsed.error);
        } else {
            const positionalKeys = Object.keys(positionalMap);
            Object.keys(positionalMap).forEach((key)=>{
                positionalKeys.push(...parsed.aliases[key]);
            });
            const defaults = yargs.getOptions().default;
            Object.keys(parsed.argv).forEach((key)=>{
                if (positionalKeys.includes(key)) {
                    if (!positionalMap[key]) positionalMap[key] = parsed.argv[key];
                    if (!Object.prototype.hasOwnProperty.call(defaults, key) && Object.prototype.hasOwnProperty.call(argv18, key) && Object.prototype.hasOwnProperty.call(parsed.argv, key) && (Array.isArray(argv18[key]) || Array.isArray(parsed.argv[key]))) {
                        argv18[key] = [].concat(argv18[key], parsed.argv[key]);
                    } else {
                        argv18[key] = parsed.argv[key];
                    }
                }
            });
        }
    }
    runDefaultBuilderOn(yargs) {
        if (!this.defaultCommand) return;
        if (this.shouldUpdateUsage(yargs)) {
            const commandString = DEFAULT_MARKER.test(this.defaultCommand.original) ? this.defaultCommand.original : this.defaultCommand.original.replace(/^[^[\]<>]*/, '$0 ');
            yargs.getInternalMethods().getUsageInstance().usage(commandString, this.defaultCommand.description);
        }
        const builder = this.defaultCommand.builder;
        if (isCommandBuilderCallback(builder)) {
            return builder(yargs, true);
        } else if (!isCommandBuilderDefinition(builder)) {
            Object.keys(builder).forEach((key)=>{
                yargs.option(key, builder[key]);
            });
        }
        return undefined;
    }
    moduleName(obj) {
        const mod5 = whichModule(obj);
        if (!mod5) throw new Error(`No command name given for module: ${this.shim.inspect(obj)}`);
        return this.commandFromFilename(mod5.filename);
    }
    commandFromFilename(filename) {
        return this.shim.path.basename(filename, this.shim.path.extname(filename));
    }
    extractDesc({ describe , description , desc  }) {
        for (const test of [
            describe,
            description,
            desc
        ]){
            if (typeof test === 'string' || test === false) return test;
            assertNotStrictEqual(test, true, this.shim);
        }
        return false;
    }
    freeze() {
        this.frozens.push({
            handlers: this.handlers,
            aliasMap: this.aliasMap,
            defaultCommand: this.defaultCommand
        });
    }
    unfreeze() {
        const frozen = this.frozens.pop();
        assertNotStrictEqual(frozen, undefined, this.shim);
        ({ handlers: this.handlers , aliasMap: this.aliasMap , defaultCommand: this.defaultCommand ,  } = frozen);
    }
    reset() {
        this.handlers = {};
        this.aliasMap = {};
        this.defaultCommand = undefined;
        this.requireCache = new Set();
        return this;
    }
}
function command(usage3, validation3, globalMiddleware, shim7) {
    return new CommandInstance(usage3, validation3, globalMiddleware, shim7);
}
function isCommandBuilderDefinition(builder) {
    return typeof builder === 'object' && !!builder.builder && typeof builder.handler === 'function';
}
function isCommandAndAliases(cmd) {
    return cmd.every((c)=>typeof c === 'string'
    );
}
function isCommandBuilderCallback(builder) {
    return typeof builder === 'function';
}
class Completion {
    constructor(yargs, usage4, command2, shim8){
        var _a, _b, _c;
        this.yargs = yargs;
        this.usage = usage4;
        this.command = command2;
        this.shim = shim8;
        this.completionKey = 'get-yargs-completions';
        this.aliases = null;
        this.customCompletionFunction = null;
        this.zshShell = (_c = ((_a = this.shim.getEnv('SHELL')) === null || _a === void 0 ? void 0 : _a.includes('zsh')) || ((_b = this.shim.getEnv('ZSH_NAME')) === null || _b === void 0 ? void 0 : _b.includes('zsh'))) !== null && _c !== void 0 ? _c : false;
    }
    defaultCompletion(args, argv19, current, done) {
        const handlers = this.command.getCommandHandlers();
        for(let i43 = 0, ii = args.length; i43 < ii; ++i43){
            if (handlers[args[i43]] && handlers[args[i43]].builder) {
                const builder = handlers[args[i43]].builder;
                if (isCommandBuilderCallback(builder)) {
                    const y = this.yargs.getInternalMethods().reset();
                    builder(y, true);
                    return y.argv;
                }
            }
        }
        const completions = [];
        this.commandCompletions(completions, args, current);
        this.optionCompletions(completions, args, argv19, current);
        this.choicesCompletions(completions, args, argv19, current);
        done(null, completions);
    }
    commandCompletions(completions, args, current) {
        const parentCommands = this.yargs.getInternalMethods().getContext().commands;
        if (!current.match(/^-/) && parentCommands[parentCommands.length - 1] !== current && !this.previousArgHasChoices(args)) {
            this.usage.getCommands().forEach((usageCommand)=>{
                const commandName = parseCommand(usageCommand[0]).cmd;
                if (args.indexOf(commandName) === -1) {
                    if (!this.zshShell) {
                        completions.push(commandName);
                    } else {
                        const desc = usageCommand[1] || '';
                        completions.push(commandName.replace(/:/g, '\\:') + ':' + desc);
                    }
                }
            });
        }
    }
    optionCompletions(completions, args, argv20, current) {
        if ((current.match(/^-/) || current === '' && completions.length === 0) && !this.previousArgHasChoices(args)) {
            const options = this.yargs.getOptions();
            const positionalKeys = this.yargs.getGroups()[this.usage.getPositionalGroupName()] || [];
            Object.keys(options.key).forEach((key)=>{
                const negable = !!options.configuration['boolean-negation'] && options.boolean.includes(key);
                const isPositionalKey = positionalKeys.includes(key);
                if (!isPositionalKey && !this.argsContainKey(args, argv20, key, negable)) {
                    this.completeOptionKey(key, completions, current);
                    if (negable && !!options.default[key]) this.completeOptionKey(`no-${key}`, completions, current);
                }
            });
        }
    }
    choicesCompletions(completions, args, argv, current) {
        if (this.previousArgHasChoices(args)) {
            const choices = this.getPreviousArgChoices(args);
            if (choices && choices.length > 0) {
                completions.push(...choices);
            }
        }
    }
    getPreviousArgChoices(args) {
        if (args.length < 1) return;
        let previousArg = args[args.length - 1];
        let filter = '';
        if (!previousArg.startsWith('--') && args.length > 1) {
            filter = previousArg;
            previousArg = args[args.length - 2];
        }
        if (!previousArg.startsWith('--')) return;
        const previousArgKey = previousArg.replace(/-/g, '');
        const options = this.yargs.getOptions();
        if (Object.keys(options.key).some((key)=>key === previousArgKey
        ) && Array.isArray(options.choices[previousArgKey])) {
            return options.choices[previousArgKey].filter((choice)=>!filter || choice.startsWith(filter)
            );
        }
    }
    previousArgHasChoices(args) {
        const choices = this.getPreviousArgChoices(args);
        return choices !== undefined && choices.length > 0;
    }
    argsContainKey(args, argv21, key, negable) {
        if (args.indexOf(`--${key}`) !== -1) return true;
        if (negable && args.indexOf(`--no-${key}`) !== -1) return true;
        if (this.aliases) {
            for (const alias of this.aliases[key]){
                if (argv21[alias] !== undefined) return true;
            }
        }
        return false;
    }
    completeOptionKey(key, completions, current) {
        const descs = this.usage.getDescriptions();
        const startsByTwoDashes = (s)=>/^--/.test(s)
        ;
        const isShortOption = (s)=>/^[^0-9]$/.test(s)
        ;
        const dashes = !startsByTwoDashes(current) && isShortOption(key) ? '-' : '--';
        if (!this.zshShell) {
            completions.push(dashes + key);
        } else {
            const desc = descs[key] || '';
            completions.push(dashes + `${key.replace(/:/g, '\\:')}:${desc.replace('__yargsString__:', '')}`);
        }
    }
    customCompletion(args, argv22, current, done) {
        assertNotStrictEqual(this.customCompletionFunction, null, this.shim);
        if (isSyncCompletionFunction(this.customCompletionFunction)) {
            const result = this.customCompletionFunction(current, argv22);
            if (isPromise(result)) {
                return result.then((list)=>{
                    this.shim.process.nextTick(()=>{
                        done(null, list);
                    });
                }).catch((err5)=>{
                    this.shim.process.nextTick(()=>{
                        done(err5, undefined);
                    });
                });
            }
            return done(null, result);
        } else if (isFallbackCompletionFunction(this.customCompletionFunction)) {
            return this.customCompletionFunction(current, argv22, (onCompleted = done)=>this.defaultCompletion(args, argv22, current, onCompleted)
            , (completions)=>{
                done(null, completions);
            });
        } else {
            return this.customCompletionFunction(current, argv22, (completions)=>{
                done(null, completions);
            });
        }
    }
    getCompletion(args, done) {
        const current = args.length ? args[args.length - 1] : '';
        const argv1 = this.yargs.parse(args, true);
        const completionFunction = this.customCompletionFunction ? (argv23)=>this.customCompletion(args, argv23, current, done)
         : (argv24)=>this.defaultCompletion(args, argv24, current, done)
        ;
        return isPromise(argv1) ? argv1.then(completionFunction) : completionFunction(argv1);
    }
    generateCompletionScript($0, cmd) {
        let script = this.zshShell ? completionZshTemplate : completionShTemplate;
        const name = this.shim.path.basename($0);
        if ($0.match(/\.js$/)) $0 = `./${$0}`;
        script = script.replace(/{{app_name}}/g, name);
        script = script.replace(/{{completion_command}}/g, cmd);
        return script.replace(/{{app_path}}/g, $0);
    }
    registerFunction(fn) {
        this.customCompletionFunction = fn;
    }
    setParsed(parsed) {
        this.aliases = parsed.aliases;
    }
}
function completion(yargs, usage5, command3, shim9) {
    return new Completion(yargs, usage5, command3, shim9);
}
class YargsInstance {
    constructor(processArgs = [], cwd4, parentRequire, shim10){
        this.customScriptName = false;
        this.parsed = false;
        _YargsInstance_command.set(this, void 0);
        _YargsInstance_cwd.set(this, void 0);
        _YargsInstance_context.set(this, {
            commands: [],
            fullCommands: []
        });
        _YargsInstance_completion.set(this, null);
        _YargsInstance_completionCommand.set(this, null);
        _YargsInstance_defaultShowHiddenOpt.set(this, 'show-hidden');
        _YargsInstance_exitError.set(this, null);
        _YargsInstance_detectLocale.set(this, true);
        _YargsInstance_emittedWarnings.set(this, {});
        _YargsInstance_exitProcess.set(this, true);
        _YargsInstance_frozens.set(this, []);
        _YargsInstance_globalMiddleware.set(this, void 0);
        _YargsInstance_groups.set(this, {});
        _YargsInstance_hasOutput.set(this, false);
        _YargsInstance_helpOpt.set(this, null);
        _YargsInstance_logger.set(this, void 0);
        _YargsInstance_output.set(this, '');
        _YargsInstance_options.set(this, void 0);
        _YargsInstance_parentRequire.set(this, void 0);
        _YargsInstance_parserConfig.set(this, {});
        _YargsInstance_parseFn.set(this, null);
        _YargsInstance_parseContext.set(this, null);
        _YargsInstance_pkgs.set(this, {});
        _YargsInstance_preservedGroups.set(this, {});
        _YargsInstance_processArgs.set(this, void 0);
        _YargsInstance_recommendCommands.set(this, false);
        _YargsInstance_shim.set(this, void 0);
        _YargsInstance_strict.set(this, false);
        _YargsInstance_strictCommands.set(this, false);
        _YargsInstance_strictOptions.set(this, false);
        _YargsInstance_usage.set(this, void 0);
        _YargsInstance_versionOpt.set(this, null);
        _YargsInstance_validation.set(this, void 0);
        __classPrivateFieldSet(this, _YargsInstance_shim, shim10, "f");
        __classPrivateFieldSet(this, _YargsInstance_processArgs, processArgs, "f");
        __classPrivateFieldSet(this, _YargsInstance_cwd, cwd4, "f");
        __classPrivateFieldSet(this, _YargsInstance_parentRequire, parentRequire, "f");
        __classPrivateFieldSet(this, _YargsInstance_globalMiddleware, new GlobalMiddleware(this), "f");
        this.$0 = this[kGetDollarZero]();
        this[kReset]();
        __classPrivateFieldSet(this, _YargsInstance_command, __classPrivateFieldGet(this, _YargsInstance_command, "f"), "f");
        __classPrivateFieldSet(this, _YargsInstance_usage, __classPrivateFieldGet(this, _YargsInstance_usage, "f"), "f");
        __classPrivateFieldSet(this, _YargsInstance_validation, __classPrivateFieldGet(this, _YargsInstance_validation, "f"), "f");
        __classPrivateFieldSet(this, _YargsInstance_options, __classPrivateFieldGet(this, _YargsInstance_options, "f"), "f");
        __classPrivateFieldGet(this, _YargsInstance_options, "f").showHiddenOpt = __classPrivateFieldGet(this, _YargsInstance_defaultShowHiddenOpt, "f");
        __classPrivateFieldSet(this, _YargsInstance_logger, this[kCreateLogger](), "f");
    }
    addHelpOpt(opt, msg) {
        const defaultHelpOpt = 'help';
        argsert('[string|boolean] [string]', [
            opt,
            msg
        ], arguments.length);
        if (__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")) {
            this[kDeleteFromParserHintObject](__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f"));
            __classPrivateFieldSet(this, _YargsInstance_helpOpt, null, "f");
        }
        if (opt === false && msg === undefined) return this;
        __classPrivateFieldSet(this, _YargsInstance_helpOpt, typeof opt === 'string' ? opt : defaultHelpOpt, "f");
        this.boolean(__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f"));
        this.describe(__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f"), msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup('Show help'));
        return this;
    }
    help(opt, msg) {
        return this.addHelpOpt(opt, msg);
    }
    addShowHiddenOpt(opt, msg) {
        argsert('[string|boolean] [string]', [
            opt,
            msg
        ], arguments.length);
        if (opt === false && msg === undefined) return this;
        const showHiddenOpt = typeof opt === 'string' ? opt : __classPrivateFieldGet(this, _YargsInstance_defaultShowHiddenOpt, "f");
        this.boolean(showHiddenOpt);
        this.describe(showHiddenOpt, msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup('Show hidden options'));
        __classPrivateFieldGet(this, _YargsInstance_options, "f").showHiddenOpt = showHiddenOpt;
        return this;
    }
    showHidden(opt, msg) {
        return this.addShowHiddenOpt(opt, msg);
    }
    alias(key, value) {
        argsert('<object|string|array> [string|array]', [
            key,
            value
        ], arguments.length);
        this[kPopulateParserHintArrayDictionary](this.alias.bind(this), 'alias', key, value);
        return this;
    }
    array(keys) {
        argsert('<array|string>', [
            keys
        ], arguments.length);
        this[kPopulateParserHintArray]('array', keys);
        this[kTrackManuallySetKeys](keys);
        return this;
    }
    boolean(keys) {
        argsert('<array|string>', [
            keys
        ], arguments.length);
        this[kPopulateParserHintArray]('boolean', keys);
        this[kTrackManuallySetKeys](keys);
        return this;
    }
    check(f, global) {
        argsert('<function> [boolean]', [
            f,
            global
        ], arguments.length);
        this.middleware((argv25, _yargs)=>{
            return maybeAsyncResult(()=>{
                return f(argv25);
            }, (result)=>{
                if (!result) {
                    __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(__classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.__('Argument check failed: %s', f.toString()));
                } else if (typeof result === 'string' || result instanceof Error) {
                    __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(result.toString(), result);
                }
                return argv25;
            }, (err6)=>{
                __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(err6.message ? err6.message : err6.toString(), err6);
                return argv25;
            });
        }, false, global);
        return this;
    }
    choices(key, value) {
        argsert('<object|string|array> [string|array]', [
            key,
            value
        ], arguments.length);
        this[kPopulateParserHintArrayDictionary](this.choices.bind(this), 'choices', key, value);
        return this;
    }
    coerce(keys, value) {
        argsert('<object|string|array> [function]', [
            keys,
            value
        ], arguments.length);
        if (Array.isArray(keys)) {
            if (!value) {
                throw new YError('coerce callback must be provided');
            }
            for (const key of keys){
                this.coerce(key, value);
            }
            return this;
        } else if (typeof keys === 'object') {
            for (const key of Object.keys(keys)){
                this.coerce(key, keys[key]);
            }
            return this;
        }
        if (!value) {
            throw new YError('coerce callback must be provided');
        }
        __classPrivateFieldGet(this, _YargsInstance_options, "f").key[keys] = true;
        __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").addCoerceMiddleware((argv26, yargs)=>{
            let aliases;
            return maybeAsyncResult(()=>{
                aliases = yargs.getAliases();
                return value(argv26[keys]);
            }, (result)=>{
                argv26[keys] = result;
                if (aliases[keys]) {
                    for (const alias of aliases[keys]){
                        argv26[alias] = result;
                    }
                }
                return argv26;
            }, (err7)=>{
                throw new YError(err7.message);
            });
        }, keys);
        return this;
    }
    conflicts(key1, key2) {
        argsert('<string|object> [string|array]', [
            key1,
            key2
        ], arguments.length);
        __classPrivateFieldGet(this, _YargsInstance_validation, "f").conflicts(key1, key2);
        return this;
    }
    config(key = 'config', msg, parseFn) {
        argsert('[object|string] [string|function] [function]', [
            key,
            msg,
            parseFn
        ], arguments.length);
        if (typeof key === 'object' && !Array.isArray(key)) {
            key = applyExtends(key, __classPrivateFieldGet(this, _YargsInstance_cwd, "f"), this[kGetParserConfiguration]()['deep-merge-config'] || false, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
            __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects = (__classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects || []).concat(key);
            return this;
        }
        if (typeof msg === 'function') {
            parseFn = msg;
            msg = undefined;
        }
        this.describe(key, msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup('Path to JSON config file'));
        (Array.isArray(key) ? key : [
            key
        ]).forEach((k)=>{
            __classPrivateFieldGet(this, _YargsInstance_options, "f").config[k] = parseFn || true;
        });
        return this;
    }
    completion(cmd, desc, fn) {
        argsert('[string] [string|boolean|function] [function]', [
            cmd,
            desc,
            fn
        ], arguments.length);
        if (typeof desc === 'function') {
            fn = desc;
            desc = undefined;
        }
        __classPrivateFieldSet(this, _YargsInstance_completionCommand, cmd || __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f") || 'completion', "f");
        if (!desc && desc !== false) {
            desc = 'generate completion script';
        }
        this.command(__classPrivateFieldGet(this, _YargsInstance_completionCommand, "f"), desc);
        if (fn) __classPrivateFieldGet(this, _YargsInstance_completion, "f").registerFunction(fn);
        return this;
    }
    command(cmd, description, builder, handler, middlewares, deprecated) {
        argsert('<string|array|object> [string|boolean] [function|object] [function] [array] [boolean|string]', [
            cmd,
            description,
            builder,
            handler,
            middlewares,
            deprecated
        ], arguments.length);
        __classPrivateFieldGet(this, _YargsInstance_command, "f").addHandler(cmd, description, builder, handler, middlewares, deprecated);
        return this;
    }
    commands(cmd, description, builder, handler, middlewares, deprecated) {
        return this.command(cmd, description, builder, handler, middlewares, deprecated);
    }
    commandDir(dir, opts) {
        argsert('<string> [object]', [
            dir,
            opts
        ], arguments.length);
        const req = __classPrivateFieldGet(this, _YargsInstance_parentRequire, "f") || __classPrivateFieldGet(this, _YargsInstance_shim, "f").require;
        __classPrivateFieldGet(this, _YargsInstance_command, "f").addDirectory(dir, req, __classPrivateFieldGet(this, _YargsInstance_shim, "f").getCallerFile(), opts);
        return this;
    }
    count(keys) {
        argsert('<array|string>', [
            keys
        ], arguments.length);
        this[kPopulateParserHintArray]('count', keys);
        this[kTrackManuallySetKeys](keys);
        return this;
    }
    default(key, value, defaultDescription) {
        argsert('<object|string|array> [*] [string]', [
            key,
            value,
            defaultDescription
        ], arguments.length);
        if (defaultDescription) {
            assertSingleKey(key, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
            __classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key] = defaultDescription;
        }
        if (typeof value === 'function') {
            assertSingleKey(key, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
            if (!__classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key]) __classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key] = __classPrivateFieldGet(this, _YargsInstance_usage, "f").functionDescription(value);
            value = value.call();
        }
        this[kPopulateParserHintSingleValueDictionary](this.default.bind(this), 'default', key, value);
        return this;
    }
    defaults(key, value, defaultDescription) {
        return this.default(key, value, defaultDescription);
    }
    demandCommand(min1 = 1, max, minMsg, maxMsg) {
        argsert('[number] [number|string] [string|null|undefined] [string|null|undefined]', [
            min1,
            max,
            minMsg,
            maxMsg
        ], arguments.length);
        if (typeof max !== 'number') {
            minMsg = max;
            max = Infinity;
        }
        this.global('_', false);
        __classPrivateFieldGet(this, _YargsInstance_options, "f").demandedCommands._ = {
            min: min1,
            max,
            minMsg,
            maxMsg
        };
        return this;
    }
    demand(keys, max, msg) {
        if (Array.isArray(max)) {
            max.forEach((key)=>{
                assertNotStrictEqual(msg, true, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
                this.demandOption(key, msg);
            });
            max = Infinity;
        } else if (typeof max !== 'number') {
            msg = max;
            max = Infinity;
        }
        if (typeof keys === 'number') {
            assertNotStrictEqual(msg, true, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
            this.demandCommand(keys, max, msg, msg);
        } else if (Array.isArray(keys)) {
            keys.forEach((key)=>{
                assertNotStrictEqual(msg, true, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
                this.demandOption(key, msg);
            });
        } else {
            if (typeof msg === 'string') {
                this.demandOption(keys, msg);
            } else if (msg === true || typeof msg === 'undefined') {
                this.demandOption(keys);
            }
        }
        return this;
    }
    demandOption(keys, msg) {
        argsert('<object|string|array> [string]', [
            keys,
            msg
        ], arguments.length);
        this[kPopulateParserHintSingleValueDictionary](this.demandOption.bind(this), 'demandedOptions', keys, msg);
        return this;
    }
    deprecateOption(option, message) {
        argsert('<string> [string|boolean]', [
            option,
            message
        ], arguments.length);
        __classPrivateFieldGet(this, _YargsInstance_options, "f").deprecatedOptions[option] = message;
        return this;
    }
    describe(keys, description) {
        argsert('<object|string|array> [string]', [
            keys,
            description
        ], arguments.length);
        this[kSetKey](keys, true);
        __classPrivateFieldGet(this, _YargsInstance_usage, "f").describe(keys, description);
        return this;
    }
    detectLocale(detect) {
        argsert('<boolean>', [
            detect
        ], arguments.length);
        __classPrivateFieldSet(this, _YargsInstance_detectLocale, detect, "f");
        return this;
    }
    env(prefix) {
        argsert('[string|boolean]', [
            prefix
        ], arguments.length);
        if (prefix === false) delete __classPrivateFieldGet(this, _YargsInstance_options, "f").envPrefix;
        else __classPrivateFieldGet(this, _YargsInstance_options, "f").envPrefix = prefix || '';
        return this;
    }
    epilogue(msg) {
        argsert('<string>', [
            msg
        ], arguments.length);
        __classPrivateFieldGet(this, _YargsInstance_usage, "f").epilog(msg);
        return this;
    }
    epilog(msg) {
        return this.epilogue(msg);
    }
    example(cmd, description) {
        argsert('<string|array> [string]', [
            cmd,
            description
        ], arguments.length);
        if (Array.isArray(cmd)) {
            cmd.forEach((exampleParams)=>this.example(...exampleParams)
            );
        } else {
            __classPrivateFieldGet(this, _YargsInstance_usage, "f").example(cmd, description);
        }
        return this;
    }
    exit(code17, err8) {
        __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
        __classPrivateFieldSet(this, _YargsInstance_exitError, err8, "f");
        if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f")) __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.exit(code17);
    }
    exitProcess(enabled3 = true) {
        argsert('[boolean]', [
            enabled3
        ], arguments.length);
        __classPrivateFieldSet(this, _YargsInstance_exitProcess, enabled3, "f");
        return this;
    }
    fail(f) {
        argsert('<function|boolean>', [
            f
        ], arguments.length);
        if (typeof f === 'boolean' && f !== false) {
            throw new YError("Invalid first argument. Expected function or boolean 'false'");
        }
        __classPrivateFieldGet(this, _YargsInstance_usage, "f").failFn(f);
        return this;
    }
    getAliases() {
        return this.parsed ? this.parsed.aliases : {};
    }
    async getCompletion(args, done) {
        argsert('<array> [function]', [
            args,
            done
        ], arguments.length);
        if (!done) {
            return new Promise((resolve6, reject)=>{
                __classPrivateFieldGet(this, _YargsInstance_completion, "f").getCompletion(args, (err9, completions)=>{
                    if (err9) reject(err9);
                    else resolve6(completions);
                });
            });
        } else {
            return __classPrivateFieldGet(this, _YargsInstance_completion, "f").getCompletion(args, done);
        }
    }
    getDemandedOptions() {
        argsert([], 0);
        return __classPrivateFieldGet(this, _YargsInstance_options, "f").demandedOptions;
    }
    getDemandedCommands() {
        argsert([], 0);
        return __classPrivateFieldGet(this, _YargsInstance_options, "f").demandedCommands;
    }
    getDeprecatedOptions() {
        argsert([], 0);
        return __classPrivateFieldGet(this, _YargsInstance_options, "f").deprecatedOptions;
    }
    getDetectLocale() {
        return __classPrivateFieldGet(this, _YargsInstance_detectLocale, "f");
    }
    getExitProcess() {
        return __classPrivateFieldGet(this, _YargsInstance_exitProcess, "f");
    }
    getGroups() {
        return Object.assign({}, __classPrivateFieldGet(this, _YargsInstance_groups, "f"), __classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f"));
    }
    getHelp() {
        __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
        if (!__classPrivateFieldGet(this, _YargsInstance_usage, "f").hasCachedHelpMessage()) {
            if (!this.parsed) {
                const parse7 = this[kRunYargsParserAndExecuteCommands](__classPrivateFieldGet(this, _YargsInstance_processArgs, "f"), undefined, undefined, 0, true);
                if (isPromise(parse7)) {
                    return parse7.then(()=>{
                        return __classPrivateFieldGet(this, _YargsInstance_usage, "f").help();
                    });
                }
            }
            const builderResponse = __classPrivateFieldGet(this, _YargsInstance_command, "f").runDefaultBuilderOn(this);
            if (isPromise(builderResponse)) {
                return builderResponse.then(()=>{
                    return __classPrivateFieldGet(this, _YargsInstance_usage, "f").help();
                });
            }
        }
        return Promise.resolve(__classPrivateFieldGet(this, _YargsInstance_usage, "f").help());
    }
    getOptions() {
        return __classPrivateFieldGet(this, _YargsInstance_options, "f");
    }
    getStrict() {
        return __classPrivateFieldGet(this, _YargsInstance_strict, "f");
    }
    getStrictCommands() {
        return __classPrivateFieldGet(this, _YargsInstance_strictCommands, "f");
    }
    getStrictOptions() {
        return __classPrivateFieldGet(this, _YargsInstance_strictOptions, "f");
    }
    global(globals, global) {
        argsert('<string|array> [boolean]', [
            globals,
            global
        ], arguments.length);
        globals = [].concat(globals);
        if (global !== false) {
            __classPrivateFieldGet(this, _YargsInstance_options, "f").local = __classPrivateFieldGet(this, _YargsInstance_options, "f").local.filter((l)=>globals.indexOf(l) === -1
            );
        } else {
            globals.forEach((g)=>{
                if (!__classPrivateFieldGet(this, _YargsInstance_options, "f").local.includes(g)) __classPrivateFieldGet(this, _YargsInstance_options, "f").local.push(g);
            });
        }
        return this;
    }
    group(opts, groupName) {
        argsert('<string|array> <string>', [
            opts,
            groupName
        ], arguments.length);
        const existing = __classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f")[groupName] || __classPrivateFieldGet(this, _YargsInstance_groups, "f")[groupName];
        if (__classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f")[groupName]) {
            delete __classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f")[groupName];
        }
        const seen = {};
        __classPrivateFieldGet(this, _YargsInstance_groups, "f")[groupName] = (existing || []).concat(opts).filter((key)=>{
            if (seen[key]) return false;
            return seen[key] = true;
        });
        return this;
    }
    hide(key) {
        argsert('<string>', [
            key
        ], arguments.length);
        __classPrivateFieldGet(this, _YargsInstance_options, "f").hiddenOptions.push(key);
        return this;
    }
    implies(key, value) {
        argsert('<string|object> [number|string|array]', [
            key,
            value
        ], arguments.length);
        __classPrivateFieldGet(this, _YargsInstance_validation, "f").implies(key, value);
        return this;
    }
    locale(locale) {
        argsert('[string]', [
            locale
        ], arguments.length);
        if (!locale) {
            this[kGuessLocale]();
            return __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.getLocale();
        }
        __classPrivateFieldSet(this, _YargsInstance_detectLocale, false, "f");
        __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.setLocale(locale);
        return this;
    }
    middleware(callback, applyBeforeValidation, global) {
        return __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").addMiddleware(callback, !!applyBeforeValidation, global);
    }
    nargs(key, value) {
        argsert('<string|object|array> [number]', [
            key,
            value
        ], arguments.length);
        this[kPopulateParserHintSingleValueDictionary](this.nargs.bind(this), 'narg', key, value);
        return this;
    }
    normalize(keys) {
        argsert('<array|string>', [
            keys
        ], arguments.length);
        this[kPopulateParserHintArray]('normalize', keys);
        return this;
    }
    number(keys) {
        argsert('<array|string>', [
            keys
        ], arguments.length);
        this[kPopulateParserHintArray]('number', keys);
        this[kTrackManuallySetKeys](keys);
        return this;
    }
    option(key, opt) {
        argsert('<string|object> [object]', [
            key,
            opt
        ], arguments.length);
        if (typeof key === 'object') {
            Object.keys(key).forEach((k)=>{
                this.options(k, key[k]);
            });
        } else {
            if (typeof opt !== 'object') {
                opt = {};
            }
            this[kTrackManuallySetKeys](key);
            if (__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f") && (key === 'version' || (opt === null || opt === void 0 ? void 0 : opt.alias) === 'version')) {
                this[kEmitWarning]([
                    '"version" is a reserved word.',
                    'Please do one of the following:',
                    '- Disable version with `yargs.version(false)` if using "version" as an option',
                    '- Use the built-in `yargs.version` method instead (if applicable)',
                    '- Use a different option key',
                    'https://yargs.js.org/docs/#api-reference-version', 
                ].join('\n'), undefined, 'versionWarning');
            }
            __classPrivateFieldGet(this, _YargsInstance_options, "f").key[key] = true;
            if (opt.alias) this.alias(key, opt.alias);
            const deprecate = opt.deprecate || opt.deprecated;
            if (deprecate) {
                this.deprecateOption(key, deprecate);
            }
            const demand = opt.demand || opt.required || opt.require;
            if (demand) {
                this.demand(key, demand);
            }
            if (opt.demandOption) {
                this.demandOption(key, typeof opt.demandOption === 'string' ? opt.demandOption : undefined);
            }
            if (opt.conflicts) {
                this.conflicts(key, opt.conflicts);
            }
            if ('default' in opt) {
                this.default(key, opt.default);
            }
            if (opt.implies !== undefined) {
                this.implies(key, opt.implies);
            }
            if (opt.nargs !== undefined) {
                this.nargs(key, opt.nargs);
            }
            if (opt.config) {
                this.config(key, opt.configParser);
            }
            if (opt.normalize) {
                this.normalize(key);
            }
            if (opt.choices) {
                this.choices(key, opt.choices);
            }
            if (opt.coerce) {
                this.coerce(key, opt.coerce);
            }
            if (opt.group) {
                this.group(key, opt.group);
            }
            if (opt.boolean || opt.type === 'boolean') {
                this.boolean(key);
                if (opt.alias) this.boolean(opt.alias);
            }
            if (opt.array || opt.type === 'array') {
                this.array(key);
                if (opt.alias) this.array(opt.alias);
            }
            if (opt.number || opt.type === 'number') {
                this.number(key);
                if (opt.alias) this.number(opt.alias);
            }
            if (opt.string || opt.type === 'string') {
                this.string(key);
                if (opt.alias) this.string(opt.alias);
            }
            if (opt.count || opt.type === 'count') {
                this.count(key);
            }
            if (typeof opt.global === 'boolean') {
                this.global(key, opt.global);
            }
            if (opt.defaultDescription) {
                __classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key] = opt.defaultDescription;
            }
            if (opt.skipValidation) {
                this.skipValidation(key);
            }
            const desc = opt.describe || opt.description || opt.desc;
            this.describe(key, desc);
            if (opt.hidden) {
                this.hide(key);
            }
            if (opt.requiresArg) {
                this.requiresArg(key);
            }
        }
        return this;
    }
    options(key, opt) {
        return this.option(key, opt);
    }
    parse(args, shortCircuit, _parseFn) {
        argsert('[string|array] [function|boolean|object] [function]', [
            args,
            shortCircuit,
            _parseFn
        ], arguments.length);
        this[kFreeze]();
        if (typeof args === 'undefined') {
            args = __classPrivateFieldGet(this, _YargsInstance_processArgs, "f");
        }
        if (typeof shortCircuit === 'object') {
            __classPrivateFieldSet(this, _YargsInstance_parseContext, shortCircuit, "f");
            shortCircuit = _parseFn;
        }
        if (typeof shortCircuit === 'function') {
            __classPrivateFieldSet(this, _YargsInstance_parseFn, shortCircuit, "f");
            shortCircuit = false;
        }
        if (!shortCircuit) __classPrivateFieldSet(this, _YargsInstance_processArgs, args, "f");
        if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f")) __classPrivateFieldSet(this, _YargsInstance_exitProcess, false, "f");
        const parsed = this[kRunYargsParserAndExecuteCommands](args, !!shortCircuit);
        const tmpParsed = this.parsed;
        __classPrivateFieldGet(this, _YargsInstance_completion, "f").setParsed(this.parsed);
        if (isPromise(parsed)) {
            return parsed.then((argv27)=>{
                if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f")) __classPrivateFieldGet(this, _YargsInstance_parseFn, "f").call(this, __classPrivateFieldGet(this, _YargsInstance_exitError, "f"), argv27, __classPrivateFieldGet(this, _YargsInstance_output, "f"));
                return argv27;
            }).catch((err10)=>{
                if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f")) {
                    __classPrivateFieldGet(this, _YargsInstance_parseFn, "f")(err10, this.parsed.argv, __classPrivateFieldGet(this, _YargsInstance_output, "f"));
                }
                throw err10;
            }).finally(()=>{
                this[kUnfreeze]();
                this.parsed = tmpParsed;
            });
        } else {
            if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f")) __classPrivateFieldGet(this, _YargsInstance_parseFn, "f").call(this, __classPrivateFieldGet(this, _YargsInstance_exitError, "f"), parsed, __classPrivateFieldGet(this, _YargsInstance_output, "f"));
            this[kUnfreeze]();
            this.parsed = tmpParsed;
        }
        return parsed;
    }
    parseAsync(args, shortCircuit, _parseFn) {
        const maybePromise = this.parse(args, shortCircuit, _parseFn);
        return !isPromise(maybePromise) ? Promise.resolve(maybePromise) : maybePromise;
    }
    parseSync(args, shortCircuit, _parseFn) {
        const maybePromise = this.parse(args, shortCircuit, _parseFn);
        if (isPromise(maybePromise)) {
            throw new YError('.parseSync() must not be used with asynchronous builders, handlers, or middleware');
        }
        return maybePromise;
    }
    parserConfiguration(config) {
        argsert('<object>', [
            config
        ], arguments.length);
        __classPrivateFieldSet(this, _YargsInstance_parserConfig, config, "f");
        return this;
    }
    pkgConf(key, rootPath) {
        argsert('<string> [string]', [
            key,
            rootPath
        ], arguments.length);
        let conf = null;
        const obj = this[kPkgUp](rootPath || __classPrivateFieldGet(this, _YargsInstance_cwd, "f"));
        if (obj[key] && typeof obj[key] === 'object') {
            conf = applyExtends(obj[key], rootPath || __classPrivateFieldGet(this, _YargsInstance_cwd, "f"), this[kGetParserConfiguration]()['deep-merge-config'] || false, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
            __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects = (__classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects || []).concat(conf);
        }
        return this;
    }
    positional(key, opts) {
        argsert('<string> <object>', [
            key,
            opts
        ], arguments.length);
        const supportedOpts = [
            'default',
            'defaultDescription',
            'implies',
            'normalize',
            'choices',
            'conflicts',
            'coerce',
            'type',
            'describe',
            'desc',
            'description',
            'alias', 
        ];
        opts = objFilter(opts, (k, v)=>{
            if (k === 'type' && ![
                'string',
                'number',
                'boolean'
            ].includes(v)) return false;
            return supportedOpts.includes(k);
        });
        const fullCommand = __classPrivateFieldGet(this, _YargsInstance_context, "f").fullCommands[__classPrivateFieldGet(this, _YargsInstance_context, "f").fullCommands.length - 1];
        const parseOptions = fullCommand ? __classPrivateFieldGet(this, _YargsInstance_command, "f").cmdToParseOptions(fullCommand) : {
            array: [],
            alias: {},
            default: {},
            demand: {}
        };
        objectKeys(parseOptions).forEach((pk)=>{
            const parseOption = parseOptions[pk];
            if (Array.isArray(parseOption)) {
                if (parseOption.indexOf(key) !== -1) opts[pk] = true;
            } else {
                if (parseOption[key] && !(pk in opts)) opts[pk] = parseOption[key];
            }
        });
        this.group(key, __classPrivateFieldGet(this, _YargsInstance_usage, "f").getPositionalGroupName());
        return this.option(key, opts);
    }
    recommendCommands(recommend = true) {
        argsert('[boolean]', [
            recommend
        ], arguments.length);
        __classPrivateFieldSet(this, _YargsInstance_recommendCommands, recommend, "f");
        return this;
    }
    required(keys, max, msg) {
        return this.demand(keys, max, msg);
    }
    require(keys, max, msg) {
        return this.demand(keys, max, msg);
    }
    requiresArg(keys) {
        argsert('<array|string|object> [number]', [
            keys
        ], arguments.length);
        if (typeof keys === 'string' && __classPrivateFieldGet(this, _YargsInstance_options, "f").narg[keys]) {
            return this;
        } else {
            this[kPopulateParserHintSingleValueDictionary](this.requiresArg.bind(this), 'narg', keys, NaN);
        }
        return this;
    }
    showCompletionScript($0, cmd) {
        argsert('[string] [string]', [
            $0,
            cmd
        ], arguments.length);
        $0 = $0 || this.$0;
        __classPrivateFieldGet(this, _YargsInstance_logger, "f").log(__classPrivateFieldGet(this, _YargsInstance_completion, "f").generateCompletionScript($0, cmd || __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f") || 'completion'));
        return this;
    }
    showHelp(level) {
        argsert('[string|function]', [
            level
        ], arguments.length);
        __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
        if (!__classPrivateFieldGet(this, _YargsInstance_usage, "f").hasCachedHelpMessage()) {
            if (!this.parsed) {
                const parse8 = this[kRunYargsParserAndExecuteCommands](__classPrivateFieldGet(this, _YargsInstance_processArgs, "f"), undefined, undefined, 0, true);
                if (isPromise(parse8)) {
                    parse8.then(()=>{
                        __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelp(level);
                    });
                    return this;
                }
            }
            const builderResponse = __classPrivateFieldGet(this, _YargsInstance_command, "f").runDefaultBuilderOn(this);
            if (isPromise(builderResponse)) {
                builderResponse.then(()=>{
                    __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelp(level);
                });
                return this;
            }
        }
        __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelp(level);
        return this;
    }
    scriptName(scriptName) {
        this.customScriptName = true;
        this.$0 = scriptName;
        return this;
    }
    showHelpOnFail(enabled4, message) {
        argsert('[boolean|string] [string]', [
            enabled4,
            message
        ], arguments.length);
        __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelpOnFail(enabled4, message);
        return this;
    }
    showVersion(level) {
        argsert('[string|function]', [
            level
        ], arguments.length);
        __classPrivateFieldGet(this, _YargsInstance_usage, "f").showVersion(level);
        return this;
    }
    skipValidation(keys) {
        argsert('<array|string>', [
            keys
        ], arguments.length);
        this[kPopulateParserHintArray]('skipValidation', keys);
        return this;
    }
    strict(enabled5) {
        argsert('[boolean]', [
            enabled5
        ], arguments.length);
        __classPrivateFieldSet(this, _YargsInstance_strict, enabled5 !== false, "f");
        return this;
    }
    strictCommands(enabled6) {
        argsert('[boolean]', [
            enabled6
        ], arguments.length);
        __classPrivateFieldSet(this, _YargsInstance_strictCommands, enabled6 !== false, "f");
        return this;
    }
    strictOptions(enabled7) {
        argsert('[boolean]', [
            enabled7
        ], arguments.length);
        __classPrivateFieldSet(this, _YargsInstance_strictOptions, enabled7 !== false, "f");
        return this;
    }
    string(keys) {
        argsert('<array|string>', [
            keys
        ], arguments.length);
        this[kPopulateParserHintArray]('string', keys);
        this[kTrackManuallySetKeys](keys);
        return this;
    }
    terminalWidth() {
        argsert([], 0);
        return __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.stdColumns;
    }
    updateLocale(obj) {
        return this.updateStrings(obj);
    }
    updateStrings(obj) {
        argsert('<object>', [
            obj
        ], arguments.length);
        __classPrivateFieldSet(this, _YargsInstance_detectLocale, false, "f");
        __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.updateLocale(obj);
        return this;
    }
    usage(msg, description, builder, handler) {
        argsert('<string|null|undefined> [string|boolean] [function|object] [function]', [
            msg,
            description,
            builder,
            handler
        ], arguments.length);
        if (description !== undefined) {
            assertNotStrictEqual(msg, null, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
            if ((msg || '').match(/^\$0( |$)/)) {
                return this.command(msg, description, builder, handler);
            } else {
                throw new YError('.usage() description must start with $0 if being used as alias for .command()');
            }
        } else {
            __classPrivateFieldGet(this, _YargsInstance_usage, "f").usage(msg);
            return this;
        }
    }
    version(opt, msg, ver) {
        const defaultVersionOpt = 'version';
        argsert('[boolean|string] [string] [string]', [
            opt,
            msg,
            ver
        ], arguments.length);
        if (__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f")) {
            this[kDeleteFromParserHintObject](__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f"));
            __classPrivateFieldGet(this, _YargsInstance_usage, "f").version(undefined);
            __classPrivateFieldSet(this, _YargsInstance_versionOpt, null, "f");
        }
        if (arguments.length === 0) {
            ver = this[kGuessVersion]();
            opt = defaultVersionOpt;
        } else if (arguments.length === 1) {
            if (opt === false) {
                return this;
            }
            ver = opt;
            opt = defaultVersionOpt;
        } else if (arguments.length === 2) {
            ver = msg;
            msg = undefined;
        }
        __classPrivateFieldSet(this, _YargsInstance_versionOpt, typeof opt === 'string' ? opt : defaultVersionOpt, "f");
        msg = msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup('Show version number');
        __classPrivateFieldGet(this, _YargsInstance_usage, "f").version(ver || undefined);
        this.boolean(__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f"));
        this.describe(__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f"), msg);
        return this;
    }
    wrap(cols) {
        argsert('<number|null|undefined>', [
            cols
        ], arguments.length);
        __classPrivateFieldGet(this, _YargsInstance_usage, "f").wrap(cols);
        return this;
    }
    [(_YargsInstance_command = new WeakMap(), _YargsInstance_cwd = new WeakMap(), _YargsInstance_context = new WeakMap(), _YargsInstance_completion = new WeakMap(), _YargsInstance_completionCommand = new WeakMap(), _YargsInstance_defaultShowHiddenOpt = new WeakMap(), _YargsInstance_exitError = new WeakMap(), _YargsInstance_detectLocale = new WeakMap(), _YargsInstance_emittedWarnings = new WeakMap(), _YargsInstance_exitProcess = new WeakMap(), _YargsInstance_frozens = new WeakMap(), _YargsInstance_globalMiddleware = new WeakMap(), _YargsInstance_groups = new WeakMap(), _YargsInstance_hasOutput = new WeakMap(), _YargsInstance_helpOpt = new WeakMap(), _YargsInstance_logger = new WeakMap(), _YargsInstance_output = new WeakMap(), _YargsInstance_options = new WeakMap(), _YargsInstance_parentRequire = new WeakMap(), _YargsInstance_parserConfig = new WeakMap(), _YargsInstance_parseFn = new WeakMap(), _YargsInstance_parseContext = new WeakMap(), _YargsInstance_pkgs = new WeakMap(), _YargsInstance_preservedGroups = new WeakMap(), _YargsInstance_processArgs = new WeakMap(), _YargsInstance_recommendCommands = new WeakMap(), _YargsInstance_shim = new WeakMap(), _YargsInstance_strict = new WeakMap(), _YargsInstance_strictCommands = new WeakMap(), _YargsInstance_strictOptions = new WeakMap(), _YargsInstance_usage = new WeakMap(), _YargsInstance_versionOpt = new WeakMap(), _YargsInstance_validation = new WeakMap(), kCopyDoubleDash)](argv28) {
        if (!argv28._ || !argv28['--']) return argv28;
        argv28._.push.apply(argv28._, argv28['--']);
        try {
            delete argv28['--'];
        } catch (_err) {}
        return argv28;
    }
    [kCreateLogger]() {
        return {
            log: (...args)=>{
                if (!this[kHasParseCallback]()) console.log(...args);
                __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
                if (__classPrivateFieldGet(this, _YargsInstance_output, "f").length) __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + '\n', "f");
                __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + args.join(' '), "f");
            },
            error: (...args)=>{
                if (!this[kHasParseCallback]()) console.error(...args);
                __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
                if (__classPrivateFieldGet(this, _YargsInstance_output, "f").length) __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + '\n', "f");
                __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + args.join(' '), "f");
            }
        };
    }
    [kDeleteFromParserHintObject](optionKey) {
        objectKeys(__classPrivateFieldGet(this, _YargsInstance_options, "f")).forEach((hintKey)=>{
            if (((key)=>key === 'configObjects'
            )(hintKey)) return;
            const hint = __classPrivateFieldGet(this, _YargsInstance_options, "f")[hintKey];
            if (Array.isArray(hint)) {
                if (hint.includes(optionKey)) hint.splice(hint.indexOf(optionKey), 1);
            } else if (typeof hint === 'object') {
                delete hint[optionKey];
            }
        });
        delete __classPrivateFieldGet(this, _YargsInstance_usage, "f").getDescriptions()[optionKey];
    }
    [kEmitWarning](warning, type, deduplicationId) {
        if (!__classPrivateFieldGet(this, _YargsInstance_emittedWarnings, "f")[deduplicationId]) {
            __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.emitWarning(warning, type);
            __classPrivateFieldGet(this, _YargsInstance_emittedWarnings, "f")[deduplicationId] = true;
        }
    }
    [kFreeze]() {
        __classPrivateFieldGet(this, _YargsInstance_frozens, "f").push({
            options: __classPrivateFieldGet(this, _YargsInstance_options, "f"),
            configObjects: __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects.slice(0),
            exitProcess: __classPrivateFieldGet(this, _YargsInstance_exitProcess, "f"),
            groups: __classPrivateFieldGet(this, _YargsInstance_groups, "f"),
            strict: __classPrivateFieldGet(this, _YargsInstance_strict, "f"),
            strictCommands: __classPrivateFieldGet(this, _YargsInstance_strictCommands, "f"),
            strictOptions: __classPrivateFieldGet(this, _YargsInstance_strictOptions, "f"),
            completionCommand: __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f"),
            output: __classPrivateFieldGet(this, _YargsInstance_output, "f"),
            exitError: __classPrivateFieldGet(this, _YargsInstance_exitError, "f"),
            hasOutput: __classPrivateFieldGet(this, _YargsInstance_hasOutput, "f"),
            parsed: this.parsed,
            parseFn: __classPrivateFieldGet(this, _YargsInstance_parseFn, "f"),
            parseContext: __classPrivateFieldGet(this, _YargsInstance_parseContext, "f")
        });
        __classPrivateFieldGet(this, _YargsInstance_usage, "f").freeze();
        __classPrivateFieldGet(this, _YargsInstance_validation, "f").freeze();
        __classPrivateFieldGet(this, _YargsInstance_command, "f").freeze();
        __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").freeze();
    }
    [kGetDollarZero]() {
        let $0 = '';
        let default$0;
        if (/\b(node|iojs|electron)(\.exe)?$/.test(__classPrivateFieldGet(this, _YargsInstance_shim, "f").process.argv()[0])) {
            default$0 = __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.argv().slice(1, 2);
        } else {
            default$0 = __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.argv().slice(0, 1);
        }
        $0 = default$0.map((x)=>{
            const b = this[kRebase](__classPrivateFieldGet(this, _YargsInstance_cwd, "f"), x);
            return x.match(/^(\/|([a-zA-Z]:)?\\)/) && b.length < x.length ? b : x;
        }).join(' ').trim();
        if (__classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv('_') && __classPrivateFieldGet(this, _YargsInstance_shim, "f").getProcessArgvBin() === __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv('_')) {
            $0 = __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv('_').replace(`${__classPrivateFieldGet(this, _YargsInstance_shim, "f").path.dirname(__classPrivateFieldGet(this, _YargsInstance_shim, "f").process.execPath())}/`, '');
        }
        return $0;
    }
    [kGetParserConfiguration]() {
        return __classPrivateFieldGet(this, _YargsInstance_parserConfig, "f");
    }
    [kGuessLocale]() {
        if (!__classPrivateFieldGet(this, _YargsInstance_detectLocale, "f")) return;
        const locale = __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv('LC_ALL') || __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv('LC_MESSAGES') || __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv('LANG') || __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv('LANGUAGE') || 'en_US';
        this.locale(locale.replace(/[.:].*/, ''));
    }
    [kGuessVersion]() {
        const obj = this[kPkgUp]();
        return obj.version || 'unknown';
    }
    [kParsePositionalNumbers](argv29) {
        const args = argv29['--'] ? argv29['--'] : argv29._;
        for(let i44 = 0, arg; (arg = args[i44]) !== undefined; i44++){
            if (__classPrivateFieldGet(this, _YargsInstance_shim, "f").Parser.looksLikeNumber(arg) && Number.isSafeInteger(Math.floor(parseFloat(`${arg}`)))) {
                args[i44] = Number(arg);
            }
        }
        return argv29;
    }
    [kPkgUp](rootPath) {
        const npath = rootPath || '*';
        if (__classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath]) return __classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath];
        let obj = {};
        try {
            let startDir = rootPath || __classPrivateFieldGet(this, _YargsInstance_shim, "f").mainFilename;
            if (!rootPath && __classPrivateFieldGet(this, _YargsInstance_shim, "f").path.extname(startDir)) {
                startDir = __classPrivateFieldGet(this, _YargsInstance_shim, "f").path.dirname(startDir);
            }
            const pkgJsonPath = __classPrivateFieldGet(this, _YargsInstance_shim, "f").findUp(startDir, (dir, names)=>{
                if (names.includes('package.json')) {
                    return 'package.json';
                } else {
                    return undefined;
                }
            });
            assertNotStrictEqual(pkgJsonPath, undefined, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
            obj = JSON.parse(__classPrivateFieldGet(this, _YargsInstance_shim, "f").readFileSync(pkgJsonPath, 'utf8'));
        } catch (_noop) {}
        __classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath] = obj || {};
        return __classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath];
    }
    [kPopulateParserHintArray](type, keys) {
        keys = [].concat(keys);
        keys.forEach((key)=>{
            key = this[kSanitizeKey](key);
            __classPrivateFieldGet(this, _YargsInstance_options, "f")[type].push(key);
        });
    }
    [kPopulateParserHintSingleValueDictionary](builder, type, key, value1) {
        this[kPopulateParserHintDictionary](builder, type, key, value1, (type, key, value)=>{
            __classPrivateFieldGet(this, _YargsInstance_options, "f")[type][key] = value;
        });
    }
    [kPopulateParserHintArrayDictionary](builder, type, key, value2) {
        this[kPopulateParserHintDictionary](builder, type, key, value2, (type, key, value)=>{
            __classPrivateFieldGet(this, _YargsInstance_options, "f")[type][key] = (__classPrivateFieldGet(this, _YargsInstance_options, "f")[type][key] || []).concat(value);
        });
    }
    [kPopulateParserHintDictionary](builder, type, key1, value, singleKeyHandler) {
        if (Array.isArray(key1)) {
            key1.forEach((k)=>{
                builder(k, value);
            });
        } else if (((key)=>typeof key === 'object'
        )(key1)) {
            for (const k of objectKeys(key1)){
                builder(k, key1[k]);
            }
        } else {
            singleKeyHandler(type, this[kSanitizeKey](key1), value);
        }
    }
    [kSanitizeKey](key) {
        if (key === '__proto__') return '___proto___';
        return key;
    }
    [kSetKey](key, set1) {
        this[kPopulateParserHintSingleValueDictionary](this[kSetKey].bind(this), 'key', key, set1);
        return this;
    }
    [kUnfreeze]() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const frozen = __classPrivateFieldGet(this, _YargsInstance_frozens, "f").pop();
        assertNotStrictEqual(frozen, undefined, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
        let configObjects;
        _a = this, _b = this, _c = this, _d = this, _e = this, _f = this, _g = this, _h = this, _j = this, _k = this, _l = this, _m = this, { options: ({
            set value (_o){
                __classPrivateFieldSet(_a, _YargsInstance_options, _o, "f");
            }
        }).value , configObjects , exitProcess: ({
            set value (_o){
                __classPrivateFieldSet(_b, _YargsInstance_exitProcess, _o, "f");
            }
        }).value , groups: ({
            set value (_o){
                __classPrivateFieldSet(_c, _YargsInstance_groups, _o, "f");
            }
        }).value , output: ({
            set value (_o){
                __classPrivateFieldSet(_d, _YargsInstance_output, _o, "f");
            }
        }).value , exitError: ({
            set value (_o){
                __classPrivateFieldSet(_e, _YargsInstance_exitError, _o, "f");
            }
        }).value , hasOutput: ({
            set value (_o){
                __classPrivateFieldSet(_f, _YargsInstance_hasOutput, _o, "f");
            }
        }).value , parsed: this.parsed , strict: ({
            set value (_o){
                __classPrivateFieldSet(_g, _YargsInstance_strict, _o, "f");
            }
        }).value , strictCommands: ({
            set value (_o){
                __classPrivateFieldSet(_h, _YargsInstance_strictCommands, _o, "f");
            }
        }).value , strictOptions: ({
            set value (_o){
                __classPrivateFieldSet(_j, _YargsInstance_strictOptions, _o, "f");
            }
        }).value , completionCommand: ({
            set value (_o){
                __classPrivateFieldSet(_k, _YargsInstance_completionCommand, _o, "f");
            }
        }).value , parseFn: ({
            set value (_o){
                __classPrivateFieldSet(_l, _YargsInstance_parseFn, _o, "f");
            }
        }).value , parseContext: ({
            set value (_o){
                __classPrivateFieldSet(_m, _YargsInstance_parseContext, _o, "f");
            }
        }).value ,  } = frozen;
        __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects = configObjects;
        __classPrivateFieldGet(this, _YargsInstance_usage, "f").unfreeze();
        __classPrivateFieldGet(this, _YargsInstance_validation, "f").unfreeze();
        __classPrivateFieldGet(this, _YargsInstance_command, "f").unfreeze();
        __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").unfreeze();
    }
    [kValidateAsync](validation4, argv30) {
        return maybeAsyncResult(argv30, (result)=>{
            validation4(result);
            return result;
        });
    }
    getInternalMethods() {
        return {
            getCommandInstance: this[kGetCommandInstance].bind(this),
            getContext: this[kGetContext].bind(this),
            getHasOutput: this[kGetHasOutput].bind(this),
            getLoggerInstance: this[kGetLoggerInstance].bind(this),
            getParseContext: this[kGetParseContext].bind(this),
            getParserConfiguration: this[kGetParserConfiguration].bind(this),
            getUsageInstance: this[kGetUsageInstance].bind(this),
            getValidationInstance: this[kGetValidationInstance].bind(this),
            hasParseCallback: this[kHasParseCallback].bind(this),
            postProcess: this[kPostProcess].bind(this),
            reset: this[kReset].bind(this),
            runValidation: this[kRunValidation].bind(this),
            runYargsParserAndExecuteCommands: this[kRunYargsParserAndExecuteCommands].bind(this),
            setHasOutput: this[kSetHasOutput].bind(this)
        };
    }
    [kGetCommandInstance]() {
        return __classPrivateFieldGet(this, _YargsInstance_command, "f");
    }
    [kGetContext]() {
        return __classPrivateFieldGet(this, _YargsInstance_context, "f");
    }
    [kGetHasOutput]() {
        return __classPrivateFieldGet(this, _YargsInstance_hasOutput, "f");
    }
    [kGetLoggerInstance]() {
        return __classPrivateFieldGet(this, _YargsInstance_logger, "f");
    }
    [kGetParseContext]() {
        return __classPrivateFieldGet(this, _YargsInstance_parseContext, "f") || {};
    }
    [kGetUsageInstance]() {
        return __classPrivateFieldGet(this, _YargsInstance_usage, "f");
    }
    [kGetValidationInstance]() {
        return __classPrivateFieldGet(this, _YargsInstance_validation, "f");
    }
    [kHasParseCallback]() {
        return !!__classPrivateFieldGet(this, _YargsInstance_parseFn, "f");
    }
    [kPostProcess](argv31, populateDoubleDash, calledFromCommand, runGlobalMiddleware) {
        if (calledFromCommand) return argv31;
        if (isPromise(argv31)) return argv31;
        if (!populateDoubleDash) {
            argv31 = this[kCopyDoubleDash](argv31);
        }
        const parsePositionalNumbers = this[kGetParserConfiguration]()['parse-positional-numbers'] || this[kGetParserConfiguration]()['parse-positional-numbers'] === undefined;
        if (parsePositionalNumbers) {
            argv31 = this[kParsePositionalNumbers](argv31);
        }
        if (runGlobalMiddleware) {
            argv31 = applyMiddleware(argv31, this, __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").getMiddleware(), false);
        }
        return argv31;
    }
    [kReset](aliases = {}) {
        __classPrivateFieldSet(this, _YargsInstance_options, __classPrivateFieldGet(this, _YargsInstance_options, "f") || {}, "f");
        const tmpOptions = {};
        tmpOptions.local = __classPrivateFieldGet(this, _YargsInstance_options, "f").local || [];
        tmpOptions.configObjects = __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects || [];
        const localLookup = {};
        tmpOptions.local.forEach((l)=>{
            localLookup[l] = true;
            (aliases[l] || []).forEach((a)=>{
                localLookup[a] = true;
            });
        });
        Object.assign(__classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f"), Object.keys(__classPrivateFieldGet(this, _YargsInstance_groups, "f")).reduce((acc, groupName)=>{
            const keys = __classPrivateFieldGet(this, _YargsInstance_groups, "f")[groupName].filter((key)=>!(key in localLookup)
            );
            if (keys.length > 0) {
                acc[groupName] = keys;
            }
            return acc;
        }, {}));
        __classPrivateFieldSet(this, _YargsInstance_groups, {}, "f");
        const arrayOptions = [
            'array',
            'boolean',
            'string',
            'skipValidation',
            'count',
            'normalize',
            'number',
            'hiddenOptions', 
        ];
        const objectOptions = [
            'narg',
            'key',
            'alias',
            'default',
            'defaultDescription',
            'config',
            'choices',
            'demandedOptions',
            'demandedCommands',
            'deprecatedOptions', 
        ];
        arrayOptions.forEach((k)=>{
            tmpOptions[k] = (__classPrivateFieldGet(this, _YargsInstance_options, "f")[k] || []).filter((k)=>!localLookup[k]
            );
        });
        objectOptions.forEach((k)=>{
            tmpOptions[k] = objFilter(__classPrivateFieldGet(this, _YargsInstance_options, "f")[k], (k)=>!localLookup[k]
            );
        });
        tmpOptions.envPrefix = __classPrivateFieldGet(this, _YargsInstance_options, "f").envPrefix;
        __classPrivateFieldSet(this, _YargsInstance_options, tmpOptions, "f");
        __classPrivateFieldSet(this, _YargsInstance_usage, __classPrivateFieldGet(this, _YargsInstance_usage, "f") ? __classPrivateFieldGet(this, _YargsInstance_usage, "f").reset(localLookup) : usage(this, __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
        __classPrivateFieldSet(this, _YargsInstance_validation, __classPrivateFieldGet(this, _YargsInstance_validation, "f") ? __classPrivateFieldGet(this, _YargsInstance_validation, "f").reset(localLookup) : validation(this, __classPrivateFieldGet(this, _YargsInstance_usage, "f"), __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
        __classPrivateFieldSet(this, _YargsInstance_command, __classPrivateFieldGet(this, _YargsInstance_command, "f") ? __classPrivateFieldGet(this, _YargsInstance_command, "f").reset() : command(__classPrivateFieldGet(this, _YargsInstance_usage, "f"), __classPrivateFieldGet(this, _YargsInstance_validation, "f"), __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f"), __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
        if (!__classPrivateFieldGet(this, _YargsInstance_completion, "f")) __classPrivateFieldSet(this, _YargsInstance_completion, completion(this, __classPrivateFieldGet(this, _YargsInstance_usage, "f"), __classPrivateFieldGet(this, _YargsInstance_command, "f"), __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
        __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").reset();
        __classPrivateFieldSet(this, _YargsInstance_completionCommand, null, "f");
        __classPrivateFieldSet(this, _YargsInstance_output, '', "f");
        __classPrivateFieldSet(this, _YargsInstance_exitError, null, "f");
        __classPrivateFieldSet(this, _YargsInstance_hasOutput, false, "f");
        this.parsed = false;
        return this;
    }
    [kRebase](base, dir) {
        return __classPrivateFieldGet(this, _YargsInstance_shim, "f").path.relative(base, dir);
    }
    [kRunYargsParserAndExecuteCommands](args, shortCircuit, calledFromCommand, commandIndex = 0, helpOnly = false) {
        let skipValidation = !!calledFromCommand || helpOnly;
        args = args || __classPrivateFieldGet(this, _YargsInstance_processArgs, "f");
        __classPrivateFieldGet(this, _YargsInstance_options, "f").__ = __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.__;
        __classPrivateFieldGet(this, _YargsInstance_options, "f").configuration = this[kGetParserConfiguration]();
        const populateDoubleDash = !!__classPrivateFieldGet(this, _YargsInstance_options, "f").configuration['populate--'];
        const config = Object.assign({}, __classPrivateFieldGet(this, _YargsInstance_options, "f").configuration, {
            'populate--': true
        });
        const parsed = __classPrivateFieldGet(this, _YargsInstance_shim, "f").Parser.detailed(args, Object.assign({}, __classPrivateFieldGet(this, _YargsInstance_options, "f"), {
            configuration: {
                'parse-positional-numbers': false,
                ...config
            }
        }));
        const argv32 = Object.assign(parsed.argv, __classPrivateFieldGet(this, _YargsInstance_parseContext, "f"));
        let argvPromise = undefined;
        const aliases = parsed.aliases;
        let helpOptSet = false;
        let versionOptSet = false;
        Object.keys(argv32).forEach((key)=>{
            if (key === __classPrivateFieldGet(this, _YargsInstance_helpOpt, "f") && argv32[key]) {
                helpOptSet = true;
            } else if (key === __classPrivateFieldGet(this, _YargsInstance_versionOpt, "f") && argv32[key]) {
                versionOptSet = true;
            }
        });
        argv32.$0 = this.$0;
        this.parsed = parsed;
        if (commandIndex === 0) {
            __classPrivateFieldGet(this, _YargsInstance_usage, "f").clearCachedHelpMessage();
        }
        try {
            this[kGuessLocale]();
            if (shortCircuit) {
                return this[kPostProcess](argv32, populateDoubleDash, !!calledFromCommand, false);
            }
            if (__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")) {
                const helpCmds = [
                    __classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")
                ].concat(aliases[__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")] || []).filter((k)=>k.length > 1
                );
                if (helpCmds.includes('' + argv32._[argv32._.length - 1])) {
                    argv32._.pop();
                    helpOptSet = true;
                }
            }
            const handlerKeys = __classPrivateFieldGet(this, _YargsInstance_command, "f").getCommands();
            const requestCompletions = __classPrivateFieldGet(this, _YargsInstance_completion, "f").completionKey in argv32;
            const skipRecommendation = helpOptSet || requestCompletions || helpOnly;
            if (argv32._.length) {
                if (handlerKeys.length) {
                    let firstUnknownCommand;
                    for(let i45 = commandIndex || 0, cmd; argv32._[i45] !== undefined; i45++){
                        cmd = String(argv32._[i45]);
                        if (handlerKeys.includes(cmd) && cmd !== __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f")) {
                            const innerArgv = __classPrivateFieldGet(this, _YargsInstance_command, "f").runCommand(cmd, this, parsed, i45 + 1, helpOnly, helpOptSet || versionOptSet || helpOnly);
                            return this[kPostProcess](innerArgv, populateDoubleDash, !!calledFromCommand, false);
                        } else if (!firstUnknownCommand && cmd !== __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f")) {
                            firstUnknownCommand = cmd;
                            break;
                        }
                    }
                    if (!__classPrivateFieldGet(this, _YargsInstance_command, "f").hasDefaultCommand() && __classPrivateFieldGet(this, _YargsInstance_recommendCommands, "f") && firstUnknownCommand && !skipRecommendation) {
                        __classPrivateFieldGet(this, _YargsInstance_validation, "f").recommendCommands(firstUnknownCommand, handlerKeys);
                    }
                }
                if (__classPrivateFieldGet(this, _YargsInstance_completionCommand, "f") && argv32._.includes(__classPrivateFieldGet(this, _YargsInstance_completionCommand, "f")) && !requestCompletions) {
                    if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f")) setBlocking(true);
                    this.showCompletionScript();
                    this.exit(0);
                }
            }
            if (__classPrivateFieldGet(this, _YargsInstance_command, "f").hasDefaultCommand() && !skipRecommendation) {
                const innerArgv = __classPrivateFieldGet(this, _YargsInstance_command, "f").runCommand(null, this, parsed, 0, helpOnly, helpOptSet || versionOptSet || helpOnly);
                return this[kPostProcess](innerArgv, populateDoubleDash, !!calledFromCommand, false);
            }
            if (requestCompletions) {
                if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f")) setBlocking(true);
                args = [].concat(args);
                const completionArgs = args.slice(args.indexOf(`--${__classPrivateFieldGet(this, _YargsInstance_completion, "f").completionKey}`) + 1);
                __classPrivateFieldGet(this, _YargsInstance_completion, "f").getCompletion(completionArgs, (err11, completions)=>{
                    if (err11) throw new YError(err11.message);
                    (completions || []).forEach((completion1)=>{
                        __classPrivateFieldGet(this, _YargsInstance_logger, "f").log(completion1);
                    });
                    this.exit(0);
                });
                return this[kPostProcess](argv32, !populateDoubleDash, !!calledFromCommand, false);
            }
            if (!__classPrivateFieldGet(this, _YargsInstance_hasOutput, "f")) {
                if (helpOptSet) {
                    if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f")) setBlocking(true);
                    skipValidation = true;
                    this.showHelp('log');
                    this.exit(0);
                } else if (versionOptSet) {
                    if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f")) setBlocking(true);
                    skipValidation = true;
                    __classPrivateFieldGet(this, _YargsInstance_usage, "f").showVersion('log');
                    this.exit(0);
                }
            }
            if (!skipValidation && __classPrivateFieldGet(this, _YargsInstance_options, "f").skipValidation.length > 0) {
                skipValidation = Object.keys(argv32).some((key)=>__classPrivateFieldGet(this, _YargsInstance_options, "f").skipValidation.indexOf(key) >= 0 && argv32[key] === true
                );
            }
            if (!skipValidation) {
                if (parsed.error) throw new YError(parsed.error.message);
                if (!requestCompletions) {
                    const validation5 = this[kRunValidation](aliases, {}, parsed.error);
                    if (!calledFromCommand) {
                        argvPromise = applyMiddleware(argv32, this, __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").getMiddleware(), true);
                    }
                    argvPromise = this[kValidateAsync](validation5, argvPromise !== null && argvPromise !== void 0 ? argvPromise : argv32);
                    if (isPromise(argvPromise) && !calledFromCommand) {
                        argvPromise = argvPromise.then(()=>{
                            return applyMiddleware(argv32, this, __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").getMiddleware(), false);
                        });
                    }
                }
            }
        } catch (err12) {
            if (err12 instanceof YError) __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(err12.message, err12);
            else throw err12;
        }
        return this[kPostProcess](argvPromise !== null && argvPromise !== void 0 ? argvPromise : argv32, populateDoubleDash, !!calledFromCommand, true);
    }
    [kRunValidation](aliases, positionalMap, parseErrors, isDefaultCommand) {
        const demandedOptions = {
            ...this.getDemandedOptions()
        };
        return (argv33)=>{
            if (parseErrors) throw new YError(parseErrors.message);
            __classPrivateFieldGet(this, _YargsInstance_validation, "f").nonOptionCount(argv33);
            __classPrivateFieldGet(this, _YargsInstance_validation, "f").requiredArguments(argv33, demandedOptions);
            let failedStrictCommands = false;
            if (__classPrivateFieldGet(this, _YargsInstance_strictCommands, "f")) {
                failedStrictCommands = __classPrivateFieldGet(this, _YargsInstance_validation, "f").unknownCommands(argv33);
            }
            if (__classPrivateFieldGet(this, _YargsInstance_strict, "f") && !failedStrictCommands) {
                __classPrivateFieldGet(this, _YargsInstance_validation, "f").unknownArguments(argv33, aliases, positionalMap, !!isDefaultCommand);
            } else if (__classPrivateFieldGet(this, _YargsInstance_strictOptions, "f")) {
                __classPrivateFieldGet(this, _YargsInstance_validation, "f").unknownArguments(argv33, aliases, {}, false, false);
            }
            __classPrivateFieldGet(this, _YargsInstance_validation, "f").limitedChoices(argv33);
            __classPrivateFieldGet(this, _YargsInstance_validation, "f").implications(argv33);
            __classPrivateFieldGet(this, _YargsInstance_validation, "f").conflicting(argv33);
        };
    }
    [kSetHasOutput]() {
        __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
    }
    [kTrackManuallySetKeys](keys) {
        if (typeof keys === 'string') {
            __classPrivateFieldGet(this, _YargsInstance_options, "f").key[keys] = true;
        } else {
            for (const k of keys){
                __classPrivateFieldGet(this, _YargsInstance_options, "f").key[k] = true;
            }
        }
    }
}
function isCommandBuilderOptionDefinitions(builder) {
    return typeof builder === 'object';
}
function isCommandHandlerDefinition(cmd) {
    return typeof cmd === 'object' && !Array.isArray(cmd);
}
function isSyncCompletionFunction(completionFunction) {
    return completionFunction.length < 3;
}
function isFallbackCompletionFunction(completionFunction) {
    return completionFunction.length > 3;
}
const Yargs = YargsFactory(__default2);
function indexOf(source, pattern, fromIndex = 0) {
    if (fromIndex >= source.length) {
        return -1;
    }
    if (fromIndex < 0) {
        fromIndex = Math.max(0, source.length + fromIndex);
    }
    const s = pattern[0];
    for(let i46 = fromIndex; i46 < source.length; i46++){
        if (source[i46] !== s) continue;
        const pin = i46;
        let matched = 1;
        let j = i46;
        while(matched < pattern.length){
            j++;
            if (source[j] !== pattern[j - pin]) {
                break;
            }
            matched++;
        }
        if (matched === pattern.length) {
            return pin;
        }
    }
    return -1;
}
function repeat(origin, count) {
    if (count === 0) {
        return new Uint8Array();
    }
    if (count < 0) {
        throw new RangeError("bytes: negative repeat count");
    } else if (origin.length * count / count !== origin.length) {
        throw new Error("bytes: repeat count causes overflow");
    }
    const __int1 = Math.floor(count);
    if (__int1 !== count) {
        throw new Error("bytes: repeat count must be an integer");
    }
    const nb = new Uint8Array(origin.length * count);
    let bp = copy(origin, nb);
    for(; bp < nb.length; bp *= 2){
        copy(nb.slice(0, bp), nb, bp);
    }
    return nb;
}
function concat(...buf) {
    let length = 0;
    for (const b of buf){
        length += b.length;
    }
    const output = new Uint8Array(length);
    let index = 0;
    for (const b1 of buf){
        output.set(b1, index);
        index += b1.length;
    }
    return output;
}
function copy(src, dst, off = 0) {
    off = Math.max(0, Math.min(off, dst.byteLength));
    const dstBytesAvailable = dst.byteLength - off;
    if (src.byteLength > dstBytesAvailable) {
        src = src.subarray(0, dstBytesAvailable);
    }
    dst.set(src, off);
    return src.byteLength;
}
var LogLevels;
(function(LogLevels1) {
    LogLevels1[LogLevels1["NOTSET"] = 0] = "NOTSET";
    LogLevels1[LogLevels1["DEBUG"] = 10] = "DEBUG";
    LogLevels1[LogLevels1["INFO"] = 20] = "INFO";
    LogLevels1[LogLevels1["WARNING"] = 30] = "WARNING";
    LogLevels1[LogLevels1["ERROR"] = 40] = "ERROR";
    LogLevels1[LogLevels1["CRITICAL"] = 50] = "CRITICAL";
})(LogLevels || (LogLevels = {}));
Object.keys(LogLevels).filter((key)=>isNaN(Number(key))
);
const byLevel = {
    [String(LogLevels.NOTSET)]: "NOTSET",
    [String(LogLevels.DEBUG)]: "DEBUG",
    [String(LogLevels.INFO)]: "INFO",
    [String(LogLevels.WARNING)]: "WARNING",
    [String(LogLevels.ERROR)]: "ERROR",
    [String(LogLevels.CRITICAL)]: "CRITICAL"
};
function getLevelByName(name) {
    switch(name){
        case "NOTSET":
            return LogLevels.NOTSET;
        case "DEBUG":
            return LogLevels.DEBUG;
        case "INFO":
            return LogLevels.INFO;
        case "WARNING":
            return LogLevels.WARNING;
        case "ERROR":
            return LogLevels.ERROR;
        case "CRITICAL":
            return LogLevels.CRITICAL;
        default:
            throw new Error(`no log level found for "${name}"`);
    }
}
function getLevelName(level) {
    const levelName = byLevel[level];
    if (levelName) {
        return levelName;
    }
    throw new Error(`no level name found for level: ${level}`);
}
class LogRecord {
    msg;
    #args;
    #datetime;
    level;
    levelName;
    loggerName;
    constructor(options){
        this.msg = options.msg;
        this.#args = [
            ...options.args
        ];
        this.level = options.level;
        this.loggerName = options.loggerName;
        this.#datetime = new Date();
        this.levelName = getLevelName(options.level);
    }
    get args() {
        return [
            ...this.#args
        ];
    }
    get datetime() {
        return new Date(this.#datetime.getTime());
    }
}
class Logger {
    #level;
    #handlers;
    #loggerName;
    constructor(loggerName, levelName, options = {}){
        this.#loggerName = loggerName;
        this.#level = getLevelByName(levelName);
        this.#handlers = options.handlers || [];
    }
    get level() {
        return this.#level;
    }
    set level(level) {
        this.#level = level;
    }
    get levelName() {
        return getLevelName(this.#level);
    }
    set levelName(levelName) {
        this.#level = getLevelByName(levelName);
    }
    get loggerName() {
        return this.#loggerName;
    }
    set handlers(hndls) {
        this.#handlers = hndls;
    }
    get handlers() {
        return this.#handlers;
    }
    _log(level, msg, ...args) {
        if (this.level > level) {
            return msg instanceof Function ? undefined : msg;
        }
        let fnResult;
        let logMessage;
        if (msg instanceof Function) {
            fnResult = msg();
            logMessage = this.asString(fnResult);
        } else {
            logMessage = this.asString(msg);
        }
        const record = new LogRecord({
            msg: logMessage,
            args: args,
            level: level,
            loggerName: this.loggerName
        });
        this.#handlers.forEach((handler)=>{
            handler.handle(record);
        });
        return msg instanceof Function ? fnResult : msg;
    }
    asString(data) {
        if (typeof data === "string") {
            return data;
        } else if (data === null || typeof data === "number" || typeof data === "bigint" || typeof data === "boolean" || typeof data === "undefined" || typeof data === "symbol") {
            return String(data);
        } else if (data instanceof Error) {
            return data.stack;
        } else if (typeof data === "object") {
            return JSON.stringify(data);
        }
        return "undefined";
    }
    debug(msg, ...args) {
        return this._log(LogLevels.DEBUG, msg, ...args);
    }
    info(msg, ...args) {
        return this._log(LogLevels.INFO, msg, ...args);
    }
    warning(msg, ...args) {
        return this._log(LogLevels.WARNING, msg, ...args);
    }
    error(msg, ...args) {
        return this._log(LogLevels.ERROR, msg, ...args);
    }
    critical(msg, ...args) {
        return this._log(LogLevels.CRITICAL, msg, ...args);
    }
}
const { Deno: Deno1  } = globalThis;
const noColor1 = typeof Deno1?.noColor === "boolean" ? Deno1.noColor : true;
let enabled1 = !noColor1;
function code1(open, close) {
    return {
        open: `\x1b[${open.join(";")}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g")
    };
}
function run1(str29, code18) {
    return enabled1 ? `${code18.open}${str29.replace(code18.regexp, code18.open)}${code18.close}` : str29;
}
function bold1(str30) {
    return run1(str30, code1([
        1
    ], 22));
}
function red1(str31) {
    return run1(str31, code1([
        31
    ], 39));
}
function yellow(str32) {
    return run1(str32, code1([
        33
    ], 39));
}
function blue(str33) {
    return run1(str33, code1([
        34
    ], 39));
}
new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))", 
].join("|"), "g");
class DenoStdInternalError1 extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert1(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError1(msg);
    }
}
const DEFAULT_BUF_SIZE = 4096;
const MIN_BUF_SIZE = 16;
const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);
class BufferFullError extends Error {
    partial;
    name = "BufferFullError";
    constructor(partial){
        super("Buffer full");
        this.partial = partial;
    }
}
class PartialReadError extends Error {
    name = "PartialReadError";
    partial;
    constructor(){
        super("Encountered UnexpectedEof, data only partially read");
    }
}
class BufReader {
    buf;
    rd;
    r = 0;
    w = 0;
    eof = false;
    static create(r, size = 4096) {
        return r instanceof BufReader ? r : new BufReader(r, size);
    }
    constructor(rd, size = 4096){
        if (size < 16) {
            size = MIN_BUF_SIZE;
        }
        this._reset(new Uint8Array(size), rd);
    }
    size() {
        return this.buf.byteLength;
    }
    buffered() {
        return this.w - this.r;
    }
    async _fill() {
        if (this.r > 0) {
            this.buf.copyWithin(0, this.r, this.w);
            this.w -= this.r;
            this.r = 0;
        }
        if (this.w >= this.buf.byteLength) {
            throw Error("bufio: tried to fill full buffer");
        }
        for(let i47 = 100; i47 > 0; i47--){
            const rr = await this.rd.read(this.buf.subarray(this.w));
            if (rr === null) {
                this.eof = true;
                return;
            }
            assert1(rr >= 0, "negative read");
            this.w += rr;
            if (rr > 0) {
                return;
            }
        }
        throw new Error(`No progress after ${100} read() calls`);
    }
    reset(r) {
        this._reset(this.buf, r);
    }
    _reset(buf, rd) {
        this.buf = buf;
        this.rd = rd;
        this.eof = false;
    }
    async read(p) {
        let rr = p.byteLength;
        if (p.byteLength === 0) return rr;
        if (this.r === this.w) {
            if (p.byteLength >= this.buf.byteLength) {
                const rr = await this.rd.read(p);
                const nread = rr ?? 0;
                assert1(nread >= 0, "negative read");
                return rr;
            }
            this.r = 0;
            this.w = 0;
            rr = await this.rd.read(this.buf);
            if (rr === 0 || rr === null) return rr;
            assert1(rr >= 0, "negative read");
            this.w += rr;
        }
        const copied = copy(this.buf.subarray(this.r, this.w), p, 0);
        this.r += copied;
        return copied;
    }
    async readFull(p) {
        let bytesRead = 0;
        while(bytesRead < p.length){
            try {
                const rr = await this.read(p.subarray(bytesRead));
                if (rr === null) {
                    if (bytesRead === 0) {
                        return null;
                    } else {
                        throw new PartialReadError();
                    }
                }
                bytesRead += rr;
            } catch (err13) {
                if (err13 instanceof PartialReadError) {
                    err13.partial = p.subarray(0, bytesRead);
                } else if (err13 instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = p.subarray(0, bytesRead);
                    e.stack = err13.stack;
                    e.message = err13.message;
                    e.cause = err13.cause;
                    throw err13;
                }
                throw err13;
            }
        }
        return p;
    }
    async readByte() {
        while(this.r === this.w){
            if (this.eof) return null;
            await this._fill();
        }
        const c = this.buf[this.r];
        this.r++;
        return c;
    }
    async readString(delim) {
        if (delim.length !== 1) {
            throw new Error("Delimiter should be a single character");
        }
        const buffer = await this.readSlice(delim.charCodeAt(0));
        if (buffer === null) return null;
        return new TextDecoder().decode(buffer);
    }
    async readLine() {
        let line = null;
        try {
            line = await this.readSlice(LF);
        } catch (err14) {
            if (err14 instanceof Deno.errors.BadResource) {
                throw err14;
            }
            let partial;
            if (err14 instanceof PartialReadError) {
                partial = err14.partial;
                assert1(partial instanceof Uint8Array, "bufio: caught error from `readSlice()` without `partial` property");
            }
            if (!(err14 instanceof BufferFullError)) {
                throw err14;
            }
            partial = err14.partial;
            if (!this.eof && partial && partial.byteLength > 0 && partial[partial.byteLength - 1] === CR) {
                assert1(this.r > 0, "bufio: tried to rewind past start of buffer");
                this.r--;
                partial = partial.subarray(0, partial.byteLength - 1);
            }
            if (partial) {
                return {
                    line: partial,
                    more: !this.eof
                };
            }
        }
        if (line === null) {
            return null;
        }
        if (line.byteLength === 0) {
            return {
                line,
                more: false
            };
        }
        if (line[line.byteLength - 1] == LF) {
            let drop = 1;
            if (line.byteLength > 1 && line[line.byteLength - 2] === CR) {
                drop = 2;
            }
            line = line.subarray(0, line.byteLength - drop);
        }
        return {
            line,
            more: false
        };
    }
    async readSlice(delim) {
        let s = 0;
        let slice;
        while(true){
            let i48 = this.buf.subarray(this.r + s, this.w).indexOf(delim);
            if (i48 >= 0) {
                i48 += s;
                slice = this.buf.subarray(this.r, this.r + i48 + 1);
                this.r += i48 + 1;
                break;
            }
            if (this.eof) {
                if (this.r === this.w) {
                    return null;
                }
                slice = this.buf.subarray(this.r, this.w);
                this.r = this.w;
                break;
            }
            if (this.buffered() >= this.buf.byteLength) {
                this.r = this.w;
                const oldbuf = this.buf;
                const newbuf = this.buf.slice(0);
                this.buf = newbuf;
                throw new BufferFullError(oldbuf);
            }
            s = this.w - this.r;
            try {
                await this._fill();
            } catch (err15) {
                if (err15 instanceof PartialReadError) {
                    err15.partial = slice;
                } else if (err15 instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = slice;
                    e.stack = err15.stack;
                    e.message = err15.message;
                    e.cause = err15.cause;
                    throw err15;
                }
                throw err15;
            }
        }
        return slice;
    }
    async peek(n6) {
        if (n6 < 0) {
            throw Error("negative count");
        }
        let avail = this.w - this.r;
        while(avail < n6 && avail < this.buf.byteLength && !this.eof){
            try {
                await this._fill();
            } catch (err16) {
                if (err16 instanceof PartialReadError) {
                    err16.partial = this.buf.subarray(this.r, this.w);
                } else if (err16 instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = this.buf.subarray(this.r, this.w);
                    e.stack = err16.stack;
                    e.message = err16.message;
                    e.cause = err16.cause;
                    throw err16;
                }
                throw err16;
            }
            avail = this.w - this.r;
        }
        if (avail === 0 && this.eof) {
            return null;
        } else if (avail < n6 && this.eof) {
            return this.buf.subarray(this.r, this.r + avail);
        } else if (avail < n6) {
            throw new BufferFullError(this.buf.subarray(this.r, this.w));
        }
        return this.buf.subarray(this.r, this.r + n6);
    }
}
class AbstractBufBase {
    buf;
    usedBufferBytes = 0;
    err = null;
    size() {
        return this.buf.byteLength;
    }
    available() {
        return this.buf.byteLength - this.usedBufferBytes;
    }
    buffered() {
        return this.usedBufferBytes;
    }
}
class BufWriter extends AbstractBufBase {
    writer;
    static create(writer, size = 4096) {
        return writer instanceof BufWriter ? writer : new BufWriter(writer, size);
    }
    constructor(writer, size = 4096){
        super();
        this.writer = writer;
        if (size <= 0) {
            size = DEFAULT_BUF_SIZE;
        }
        this.buf = new Uint8Array(size);
    }
    reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.writer = w;
    }
    async flush() {
        if (this.err !== null) throw this.err;
        if (this.usedBufferBytes === 0) return;
        try {
            const p = this.buf.subarray(0, this.usedBufferBytes);
            let nwritten = 0;
            while(nwritten < p.length){
                nwritten += await this.writer.write(p.subarray(nwritten));
            }
        } catch (e) {
            if (e instanceof Error) {
                this.err = e;
            }
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    async write(data) {
        if (this.err !== null) throw this.err;
        if (data.length === 0) return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while(data.byteLength > this.available()){
            if (this.buffered() === 0) {
                try {
                    numBytesWritten = await this.writer.write(data);
                } catch (e) {
                    if (e instanceof Error) {
                        this.err = e;
                    }
                    throw e;
                }
            } else {
                numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                await this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
}
class BufWriterSync extends AbstractBufBase {
    writer;
    static create(writer, size = 4096) {
        return writer instanceof BufWriterSync ? writer : new BufWriterSync(writer, size);
    }
    constructor(writer, size = 4096){
        super();
        this.writer = writer;
        if (size <= 0) {
            size = DEFAULT_BUF_SIZE;
        }
        this.buf = new Uint8Array(size);
    }
    reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.writer = w;
    }
    flush() {
        if (this.err !== null) throw this.err;
        if (this.usedBufferBytes === 0) return;
        try {
            const p = this.buf.subarray(0, this.usedBufferBytes);
            let nwritten = 0;
            while(nwritten < p.length){
                nwritten += this.writer.writeSync(p.subarray(nwritten));
            }
        } catch (e) {
            if (e instanceof Error) {
                this.err = e;
            }
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    writeSync(data) {
        if (this.err !== null) throw this.err;
        if (data.length === 0) return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while(data.byteLength > this.available()){
            if (this.buffered() === 0) {
                try {
                    numBytesWritten = this.writer.writeSync(data);
                } catch (e) {
                    if (e instanceof Error) {
                        this.err = e;
                    }
                    throw e;
                }
            } else {
                numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
}
const DEFAULT_FORMATTER = "{levelName} {msg}";
class BaseHandler {
    level;
    levelName;
    formatter;
    constructor(levelName, options = {}){
        this.level = getLevelByName(levelName);
        this.levelName = levelName;
        this.formatter = options.formatter || DEFAULT_FORMATTER;
    }
    handle(logRecord) {
        if (this.level > logRecord.level) return;
        const msg = this.format(logRecord);
        return this.log(msg);
    }
    format(logRecord) {
        if (this.formatter instanceof Function) {
            return this.formatter(logRecord);
        }
        return this.formatter.replace(/{(\S+)}/g, (match, p1)=>{
            const value = logRecord[p1];
            if (value == null) {
                return match;
            }
            return String(value);
        });
    }
    log(_msg) {}
    async setup() {}
    async destroy() {}
}
class ConsoleHandler extends BaseHandler {
    format(logRecord) {
        let msg = super.format(logRecord);
        switch(logRecord.level){
            case LogLevels.INFO:
                msg = blue(msg);
                break;
            case LogLevels.WARNING:
                msg = yellow(msg);
                break;
            case LogLevels.ERROR:
                msg = red1(msg);
                break;
            case LogLevels.CRITICAL:
                msg = bold1(red1(msg));
                break;
            default:
                break;
        }
        return msg;
    }
    log(msg) {
        console.log(msg);
    }
}
const DEFAULT_LEVEL = "INFO";
const DEFAULT_CONFIG = {
    handlers: {
        default: new ConsoleHandler(DEFAULT_LEVEL)
    },
    loggers: {
        default: {
            level: DEFAULT_LEVEL,
            handlers: [
                "default"
            ]
        }
    }
};
const state = {
    handlers: new Map(),
    loggers: new Map(),
    config: DEFAULT_CONFIG
};
function getLogger(name) {
    if (!name) {
        const d = state.loggers.get("default");
        assert1(d != null, `"default" logger must be set for getting logger without name`);
        return d;
    }
    const result = state.loggers.get(name);
    if (!result) {
        const logger = new Logger(name, "NOTSET", {
            handlers: []
        });
        state.loggers.set(name, logger);
        return logger;
    }
    return result;
}
async function setup(config) {
    state.config = {
        handlers: {
            ...DEFAULT_CONFIG.handlers,
            ...config.handlers
        },
        loggers: {
            ...DEFAULT_CONFIG.loggers,
            ...config.loggers
        }
    };
    state.handlers.forEach((handler)=>{
        handler.destroy();
    });
    state.handlers.clear();
    const handlers1 = state.config.handlers || {};
    for(const handlerName1 in handlers1){
        const handler = handlers1[handlerName1];
        await handler.setup();
        state.handlers.set(handlerName1, handler);
    }
    state.loggers.clear();
    const loggers = state.config.loggers || {};
    for(const loggerName in loggers){
        const loggerConfig = loggers[loggerName];
        const handlerNames = loggerConfig.handlers || [];
        const handlers2 = [];
        handlerNames.forEach((handlerName)=>{
            const handler = state.handlers.get(handlerName);
            if (handler) {
                handlers2.push(handler);
            }
        });
        const levelName = loggerConfig.level || DEFAULT_LEVEL;
        const logger = new Logger(loggerName, levelName, {
            handlers: handlers2
        });
        state.loggers.set(loggerName, logger);
    }
}
await setup(DEFAULT_CONFIG);
const DEFAULT_BUFFER_SIZE = 32 * 1024;
async function* iterateReader(r, options) {
    const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
    const b = new Uint8Array(bufSize);
    while(true){
        const result = await r.read(b);
        if (result === null) {
            break;
        }
        yield b.subarray(0, result);
    }
}
var DiffType1;
(function(DiffType3) {
    DiffType3["removed"] = "removed";
    DiffType3["common"] = "common";
    DiffType3["added"] = "added";
})(DiffType1 || (DiffType1 = {}));
BigInt(Number.MAX_SAFE_INTEGER);
const iter = iterateReader;
const enc = new TextEncoder();
function getUint8Array(str34) {
    return str34 instanceof Uint8Array ? str34 : enc.encode(str34);
}
function hasPrefixFrom(a, prefix, offset) {
    for(let i49 = 0, max = prefix.length; i49 < max; i49++){
        if (a[i49 + offset] !== prefix[i49]) return false;
    }
    return true;
}
async function* dummyAsyncIterable(str35) {
    yield str35;
}
function isAsyncIterable(iter1) {
    return !!iter1[Symbol.asyncIterator];
}
async function* makeAsyncIterable(iter2) {
    const i50 = isAsyncIterable(iter2) ? iter2[Symbol.asyncIterator]() : iter2[Symbol.iterator]();
    while(true){
        const { done , value  } = await i50.next();
        if (done) {
            return;
        } else {
            yield value;
        }
    }
}
function noop(a) {}
const defaultCSVReaderOptions = {
    columnSeparator: ",",
    lineSeparator: "\n",
    quote: '"',
    onCell: noop,
    onRowEnd: noop,
    onEnd: noop,
    onError: noop,
    _readerIteratorBufferSize: 1024 * 1024,
    _columnBufferMinStepSize: 1024,
    _inputBufferIndexLimit: 1024,
    _columnBufferReserve: 64,
    _stats: {
        reads: 0,
        inputBufferShrinks: 0,
        columnBufferExpands: 0
    }
};
class CSVReader {
    decoder;
    onCell;
    onRowEnd;
    onEnd;
    onError;
    inputBufferIndexLimit;
    stats;
    columnSeparator;
    lineSeparator;
    quote;
    doubleQuote;
    minPossibleBufferReserve;
    columnBufferReserve;
    columnBufferStepSize;
    readerIterator;
    inputBuffer;
    inputBufferIndex;
    columnBuffer;
    columnBufferIndex;
    readerEmpty;
    emptyLine;
    inQuote;
    inColumn;
    inputBufferUnprocessed;
    paused;
    debug;
    currentPos;
    linesProcessed;
    lastLineStartPos;
    constructor(reader, options){
        this.decoder = new TextDecoder();
        const mergedOptions = {
            ...defaultCSVReaderOptions,
            ...options
        };
        this.onCell = mergedOptions.onCell || noop;
        this.onRowEnd = mergedOptions.onRowEnd || noop;
        this.onEnd = mergedOptions.onEnd || noop;
        this.onError = mergedOptions.onError || noop;
        this.inputBufferIndexLimit = mergedOptions._inputBufferIndexLimit;
        this.stats = mergedOptions._stats;
        this.quote = getUint8Array(mergedOptions.quote);
        this.columnSeparator = getUint8Array(mergedOptions.columnSeparator);
        this.lineSeparator = getUint8Array(mergedOptions.lineSeparator);
        this.doubleQuote = repeat(this.quote, 2);
        this.minPossibleBufferReserve = Math.max(this.columnSeparator.length, this.lineSeparator.length, this.doubleQuote.length, 1);
        this.columnBufferStepSize = Math.max(mergedOptions._columnBufferMinStepSize, this.minPossibleBufferReserve);
        this.columnBufferReserve = Math.max(mergedOptions._columnBufferReserve, this.minPossibleBufferReserve);
        this.readerIterator = iter(reader, {
            bufSize: mergedOptions._readerIteratorBufferSize
        });
        this.inputBuffer = new Uint8Array();
        this.inputBufferIndex = 0;
        this.columnBuffer = new Uint8Array(this.columnBufferStepSize);
        this.columnBufferIndex = 0;
        this.readerEmpty = false;
        this.emptyLine = true;
        this.inQuote = false;
        this.inColumn = false;
        this.inputBufferUnprocessed = 0;
        this.paused = true;
        this.currentPos = 0;
        this.linesProcessed = 0;
        this.lastLineStartPos = 0;
        const logger = getLogger("csv");
        if (logger.levelName === "DEBUG") {
            this.debug = (msg)=>logger.debug(msg)
            ;
        } else {
            this.debug = noop;
        }
    }
    read() {
        if (this.paused) {
            this.paused = false;
            this.parseCycle();
        }
    }
    pause() {
        this.paused = true;
    }
    processColumn() {
        const result = this.decoder.decode(this.columnBuffer.subarray(0, this.columnBufferIndex));
        this.columnBufferIndex = 0;
        this.onCell(result);
    }
    processRow() {
        this.onRowEnd();
    }
    hasNext(chars) {
        return hasPrefixFrom(this.inputBuffer, chars, this.inputBufferIndex);
    }
    skip(chars) {
        this.debug(`skip: ${chars.length}`);
        this.inputBufferIndex += chars.length;
        this.inputBufferUnprocessed -= chars.length;
        this.currentPos += chars.length;
    }
    shrinkInputBuffer() {
        this.stats.inputBufferShrinks++;
        this.debug("shrink input buffer");
        this.inputBuffer = this.inputBuffer.slice(this.inputBufferIndex);
        this.inputBufferIndex = 0;
        this.inputBufferUnprocessed = this.inputBuffer.length;
    }
    readChars(n) {
        this.columnBuffer.set(this.inputBuffer.subarray(this.inputBufferIndex, this.inputBufferIndex + n), this.columnBufferIndex);
        this.columnBufferIndex += n;
        this.inputBufferIndex += n;
        this.inputBufferUnprocessed -= n;
        this.currentPos += n;
    }
    async readMoreData() {
        this.stats.reads++;
        this.debug("read more data");
        const { done , value  } = await this.readerIterator.next();
        if (done) {
            this.readerEmpty = true;
        } else {
            this.inputBuffer = concat(this.inputBuffer, value);
            this.inputBufferUnprocessed += value.length;
        }
    }
    expandColumnBuffer() {
        this.stats.columnBufferExpands++;
        const newColumn = new Uint8Array(this.columnBuffer.length + this.columnBufferStepSize);
        this.debug(`expand column buffer from ${this.columnBuffer.length} to ${newColumn.length}`);
        newColumn.set(this.columnBuffer);
        this.columnBuffer = newColumn;
    }
    countLine() {
        this.countLines(1, this.currentPos);
    }
    countLines(newLines, lastLineStartPos) {
        this.debug(`count lines: newLines=${newLines} lastLineStartPos=${lastLineStartPos}`);
        this.linesProcessed += newLines;
        this.lastLineStartPos = lastLineStartPos;
    }
    getCurrentPos() {
        const line = this.linesProcessed + 1;
        const ch = this.currentPos - this.lastLineStartPos + 1;
        return `line ${line}, character ${ch}`;
    }
    async parseCycle() {
        while(true){
            if (this.paused) {
                return;
            }
            if (!this.readerEmpty && this.inputBufferUnprocessed < this.minPossibleBufferReserve) {
                await this.readMoreData();
                continue;
            }
            if (this.inputBufferIndex >= this.inputBufferIndexLimit) {
                this.shrinkInputBuffer();
                continue;
            }
            if (this.columnBuffer.length - this.columnBufferIndex < this.columnBufferReserve) {
                this.expandColumnBuffer();
                continue;
            }
            if (!this.inColumn && this.inputBufferUnprocessed === 0) {
                this.debug("eof");
                if (!this.emptyLine) {
                    this.processColumn();
                    this.processRow();
                }
                this.onEnd();
                return;
            }
            if (!this.inColumn && this.hasNext(this.lineSeparator)) {
                this.debug("lineSeparator");
                if (!this.emptyLine) {
                    this.processColumn();
                    this.processRow();
                }
                this.skip(this.lineSeparator);
                this.countLine();
                this.emptyLine = true;
                continue;
            }
            if (!this.inColumn && this.hasNext(this.columnSeparator)) {
                this.debug("columnSeparator");
                this.processColumn();
                this.skip(this.columnSeparator);
                continue;
            }
            if (!this.inColumn) {
                this.inColumn = true;
                this.emptyLine = false;
                if (this.hasNext(this.quote)) {
                    this.debug("start quoted column");
                    this.inQuote = true;
                    this.skip(this.quote);
                } else {
                    this.debug("start unquoted column");
                }
                continue;
            }
            if (this.inColumn && this.inQuote && this.hasNext(this.doubleQuote)) {
                this.debug("double quote");
                this.columnBuffer.set(this.quote, this.columnBufferIndex);
                this.columnBufferIndex += this.quote.length;
                this.skip(this.doubleQuote);
                continue;
            }
            if (this.inColumn && this.inQuote && this.hasNext(this.quote)) {
                this.debug("end quoted column");
                this.inQuote = false;
                this.inColumn = false;
                this.skip(this.quote);
                if (this.inputBufferUnprocessed > 0 && !this.hasNext(this.lineSeparator) && !this.hasNext(this.columnSeparator)) {
                    const __char = String.fromCharCode(this.inputBuffer[this.inputBufferIndex]);
                    this.onError(new Error(`Expected EOF, COLUMN_SEPARATOR, LINE_SEPARATOR; received ${__char} (${this.getCurrentPos()})`));
                    return;
                }
                continue;
            }
            if (this.inColumn && !this.inQuote && (this.inputBufferUnprocessed === 0 || this.hasNext(this.lineSeparator) || this.hasNext(this.columnSeparator))) {
                this.debug("end unquoted column");
                this.inColumn = false;
                continue;
            }
            if (this.inColumn && this.inputBufferUnprocessed > 0) {
                const slice = this.inputBuffer.subarray(this.inputBufferIndex);
                const limit = Math.min(slice.length - this.minPossibleBufferReserve, this.columnBuffer.length - this.columnBufferIndex);
                let readTillIndex = 1;
                let newLines = 0;
                let lastLineStartPos = -1;
                if (limit > 1) {
                    if (this.inQuote) {
                        const { till , lineSeparatorsFound , lastLineSeparatorEndIndex  } = findReadTillIndexQuoted(slice, limit, this.quote, this.lineSeparator);
                        readTillIndex = till;
                        newLines = lineSeparatorsFound;
                        lastLineStartPos = this.currentPos + lastLineSeparatorEndIndex;
                    } else {
                        readTillIndex = findReadTillIndex(slice, limit, this.lineSeparator, this.columnSeparator, this.quote);
                    }
                }
                if (readTillIndex > 0) {
                    this.debug(`read char: ${readTillIndex}`);
                    this.readChars(readTillIndex);
                }
                if (newLines > 0) {
                    this.countLines(newLines, lastLineStartPos);
                }
                continue;
            }
            if (this.inQuote && this.inputBufferUnprocessed === 0) {
                this.onError(new Error(`Expected quote, received EOF (${this.getCurrentPos()})`));
                return;
            }
            this.onError(new Error(`unexpected (${this.getCurrentPos()})`));
            return;
        }
    }
}
Symbol("newLine");
class CSVRowReader {
    reader;
    done;
    row;
    buffer;
    nextPromise;
    nextPromiseResolve;
    nextPromiseReject;
    constructor(reader, options){
        this.buffer = [];
        this.done = false;
        this.row = [];
        this.reader = new CSVReader(reader, {
            ...options,
            onCell: (value)=>this.onCell(value)
            ,
            onRowEnd: ()=>this.onRowEnd()
            ,
            onEnd: ()=>this.onEnd()
            ,
            onError: (err17)=>this.process(err17)
        });
    }
    onCell(cell) {
        this.row.push(cell);
    }
    onRowEnd() {
        const row = this.row;
        this.row = [];
        this.process({
            done: false,
            value: row
        });
    }
    onEnd() {
        this.done = true;
        this.process({
            done: true,
            value: undefined
        });
    }
    process(result) {
        const cb = result instanceof Error ? this.nextPromiseReject : this.nextPromiseResolve;
        if (cb) {
            this.nextPromise = undefined;
            this.nextPromiseResolve = undefined;
            this.nextPromiseReject = undefined;
            cb(result);
        } else {
            this.buffer.push(result);
        }
        this.reader.pause();
    }
    next() {
        if (this.done && this.buffer.length === 0) {
            return Promise.resolve({
                done: true,
                value: undefined
            });
        }
        let promise = this.nextPromise;
        if (!promise) {
            if (this.buffer.length > 0) {
                const res = this.buffer.shift();
                if (res instanceof Error) {
                    return Promise.reject(res);
                } else {
                    return Promise.resolve(res);
                }
            }
            promise = new Promise((resolve7, reject)=>{
                this.nextPromiseResolve = resolve7;
                this.nextPromiseReject = reject;
                this.reader.read();
            });
        }
        if (this.nextPromiseResolve) {
            this.nextPromise = promise;
        }
        return promise;
    }
    [Symbol.asyncIterator]() {
        return this;
    }
}
async function* readCSVObjects(reader, options) {
    let header;
    for await (const row of new CSVRowReader(reader, options)){
        if (!header) {
            header = row;
            continue;
        }
        const obj = {};
        for(let i51 = 0; i51 < header.length; i51++){
            obj[header[i51]] = row[i51];
        }
        yield obj;
    }
}
function findReadTillIndexQuoted(a, limit, quote, lineSeparator) {
    const s1 = quote[0];
    const s2 = lineSeparator[0];
    let result = limit;
    let lineSeparatorsFound = 0;
    let lastLineSeparatorEndIndex = -1;
    for(let i52 = 0; i52 < a.length; i52++){
        if (i52 >= limit) {
            result = limit;
            break;
        }
        if (a[i52] === s1) {
            let matched = 1;
            let j = i52;
            while(matched < quote.length){
                j++;
                if (a[j] !== quote[j - i52]) {
                    break;
                }
                matched++;
            }
            if (matched === quote.length) {
                result = i52;
                break;
            }
        }
        if (a[i52] === s2) {
            let matched = 1;
            let j = i52;
            while(matched < lineSeparator.length){
                j++;
                if (a[j] !== lineSeparator[j - i52]) {
                    break;
                }
                matched++;
            }
            if (matched === lineSeparator.length) {
                lineSeparatorsFound++;
                lastLineSeparatorEndIndex = i52 + lineSeparator.length;
                i52 += lineSeparator.length - 1;
            }
        }
    }
    return {
        till: result,
        lineSeparatorsFound,
        lastLineSeparatorEndIndex
    };
}
function findReadTillIndex(a, limit, lineSeparator, columnSeparator, quote) {
    const s1 = lineSeparator[0];
    const s2 = columnSeparator[0];
    const s3 = quote[0];
    for(let i53 = 0; i53 < a.length; i53++){
        if (i53 >= limit) {
            return limit;
        }
        if (a[i53] === s1) {
            let matched = 1;
            let j = i53;
            while(matched < lineSeparator.length){
                j++;
                if (a[j] !== lineSeparator[j - i53]) {
                    break;
                }
                matched++;
            }
            if (matched === lineSeparator.length) {
                return i53;
            }
        }
        if (a[i53] === s2) {
            let matched = 1;
            let j = i53;
            while(matched < columnSeparator.length){
                j++;
                if (a[j] !== columnSeparator[j - i53]) {
                    break;
                }
                matched++;
            }
            if (matched === columnSeparator.length) {
                return i53;
            }
        }
        if (a[i53] === s3) {
            let matched = 1;
            let j = i53;
            while(matched < quote.length){
                j++;
                if (a[j] !== quote[j - i53]) {
                    break;
                }
                matched++;
            }
            if (matched === quote.length) {
                return i53;
            }
        }
    }
    return limit;
}
const defaultCSVWriterOptions = {
    columnSeparator: ",",
    lineSeparator: "\n",
    quote: '"'
};
class CSVWriter {
    writer;
    columnSeparator;
    lineSeparator;
    quote;
    firstColumn;
    constructor(writer, options){
        this.writer = writer;
        this.columnSeparator = getUint8Array(options && options.columnSeparator || defaultCSVWriterOptions.columnSeparator);
        this.lineSeparator = getUint8Array(options && options.lineSeparator || defaultCSVWriterOptions.lineSeparator);
        this.quote = getUint8Array(options && options.quote || defaultCSVWriterOptions.quote);
        this.firstColumn = true;
    }
    async writeCell(str36, options) {
        if (isAsyncIterable(str36)) {
            return this._writeCellAsyncIterable(str36, {
                wrap: true
            });
        }
        const arr = getUint8Array(str36);
        const wrap2 = options?.forceQuotes || indexOf(arr, this.quote) >= 0 || indexOf(arr, this.columnSeparator) >= 0 || indexOf(arr, this.lineSeparator) >= 0;
        return this._writeCellAsyncIterable(dummyAsyncIterable(arr), {
            wrap: wrap2
        });
    }
    async _writeCellAsyncIterable(iterable, options) {
        const { quote  } = this;
        const { wrap: wrap3  } = options;
        const iterator = iterable[Symbol.asyncIterator]();
        let inputBuffer = new Uint8Array();
        let inputBufferEmpty = false;
        let inputBufferIndex = 0;
        if (this.firstColumn) {
            this.firstColumn = false;
        } else {
            await this.writer.write(this.columnSeparator);
        }
        if (wrap3) {
            await this.writer.write(this.quote);
        }
        while(true){
            const inputBufferUnprocessed = inputBuffer.length - inputBufferIndex;
            if (inputBufferEmpty && inputBufferUnprocessed === 0) {
                break;
            }
            if (!inputBufferEmpty && inputBufferUnprocessed < quote.length) {
                const { done , value  } = await iterator.next();
                if (done) {
                    inputBufferEmpty = true;
                } else {
                    inputBuffer = concat(inputBuffer, value);
                }
                continue;
            }
            if (wrap3 && hasPrefixFrom(inputBuffer, quote, inputBufferIndex)) {
                await this.writer.write(quote);
                await this.writer.write(quote);
                inputBufferIndex += quote.length;
                continue;
            }
            if (inputBufferUnprocessed > 0) {
                await this.writer.write(inputBuffer.subarray(inputBufferIndex, inputBufferIndex + 1));
                inputBufferIndex++;
                continue;
            }
            throw new Error("unexpected");
        }
        if (wrap3) {
            await this.writer.write(this.quote);
        }
    }
    async nextLine() {
        this.firstColumn = true;
        await this.writer.write(this.lineSeparator);
    }
}
async function writeCSV(writer, iter3, options) {
    const csv = new CSVWriter(writer, options);
    let firstLine = true;
    for await (const row of makeAsyncIterable(iter3)){
        if (firstLine) {
            firstLine = false;
        } else {
            await csv.nextLine();
        }
        for await (const cell of makeAsyncIterable(row)){
            await csv.writeCell(cell, options);
        }
    }
}
const osType1 = (()=>{
    const { Deno  } = globalThis;
    if (typeof Deno?.build?.os === "string") {
        return Deno.build.os;
    }
    const { navigator  } = globalThis;
    if (navigator?.appVersion?.includes?.("Win") ?? false) {
        return "windows";
    }
    return "linux";
})();
const isWindows1 = osType1 === "windows";
const CHAR_FORWARD_SLASH1 = 47;
function assertPath1(path29) {
    if (typeof path29 !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path29)}`);
    }
}
function isPosixPathSeparator1(code19) {
    return code19 === 47;
}
function isPathSeparator1(code20) {
    return isPosixPathSeparator1(code20) || code20 === 92;
}
function isWindowsDeviceRoot1(code21) {
    return code21 >= 97 && code21 <= 122 || code21 >= 65 && code21 <= 90;
}
function normalizeString1(path30, allowAboveRoot, separator, isPathSeparator11) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code22;
    for(let i54 = 0, len = path30.length; i54 <= len; ++i54){
        if (i54 < len) code22 = path30.charCodeAt(i54);
        else if (isPathSeparator11(code22)) break;
        else code22 = CHAR_FORWARD_SLASH1;
        if (isPathSeparator11(code22)) {
            if (lastSlash === i54 - 1 || dots === 1) {} else if (lastSlash !== i54 - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i54;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i54;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path30.slice(lastSlash + 1, i54);
                else res = path30.slice(lastSlash + 1, i54);
                lastSegmentLength = i54 - lastSlash - 1;
            }
            lastSlash = i54;
            dots = 0;
        } else if (code22 === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format2(sep8, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (dir === pathObject.root) return dir + base;
    return dir + sep8 + base;
}
const WHITESPACE_ENCODINGS1 = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace1(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS1[c] ?? c;
    });
}
class DenoStdInternalError2 extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert2(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError2(msg);
    }
}
const sep3 = "\\";
const delimiter3 = ";";
function resolve3(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i55 = pathSegments.length - 1; i55 >= -1; i55--){
        let path31;
        const { Deno  } = globalThis;
        if (i55 >= 0) {
            path31 = pathSegments[i55];
        } else if (!resolvedDevice) {
            if (typeof Deno?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path31 = Deno.cwd();
        } else {
            if (typeof Deno?.env?.get !== "function" || typeof Deno?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path31 = Deno.cwd();
            if (path31 === undefined || path31.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path31 = `${resolvedDevice}\\`;
            }
        }
        assertPath1(path31);
        const len = path31.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute11 = false;
        const code23 = path31.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator1(code23)) {
                isAbsolute11 = true;
                if (isPathSeparator1(path31.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator1(path31.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path31.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator1(path31.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator1(path31.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path31.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path31.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot1(code23)) {
                if (path31.charCodeAt(1) === 58) {
                    device = path31.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator1(path31.charCodeAt(2))) {
                            isAbsolute11 = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator1(code23)) {
            rootEnd = 1;
            isAbsolute11 = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path31.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute11;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString1(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator1);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize4(path32) {
    assertPath1(path32);
    const len = path32.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute21 = false;
    const code24 = path32.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator1(code24)) {
            isAbsolute21 = true;
            if (isPathSeparator1(path32.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator1(path32.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path32.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator1(path32.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator1(path32.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path32.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path32.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot1(code24)) {
            if (path32.charCodeAt(1) === 58) {
                device = path32.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator1(path32.charCodeAt(2))) {
                        isAbsolute21 = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator1(code24)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString1(path32.slice(rootEnd), !isAbsolute21, "\\", isPathSeparator1);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute21) tail = ".";
    if (tail.length > 0 && isPathSeparator1(path32.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute21) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute21) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute3(path33) {
    assertPath1(path33);
    const len = path33.length;
    if (len === 0) return false;
    const code25 = path33.charCodeAt(0);
    if (isPathSeparator1(code25)) {
        return true;
    } else if (isWindowsDeviceRoot1(code25)) {
        if (len > 2 && path33.charCodeAt(1) === 58) {
            if (isPathSeparator1(path33.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join4(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i56 = 0; i56 < pathsCount; ++i56){
        const path34 = paths[i56];
        assertPath1(path34);
        if (path34.length > 0) {
            if (joined === undefined) joined = firstPart = path34;
            else joined += `\\${path34}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert2(firstPart != null);
    if (isPathSeparator1(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator1(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator1(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator1(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize4(joined);
}
function relative3(from, to) {
    assertPath1(from);
    assertPath1(to);
    if (from === to) return "";
    const fromOrig = resolve3(from);
    const toOrig = resolve3(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i57 = 0;
    for(; i57 <= length; ++i57){
        if (i57 === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i57) === 92) {
                    return toOrig.slice(toStart + i57 + 1);
                } else if (i57 === 2) {
                    return toOrig.slice(toStart + i57);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i57) === 92) {
                    lastCommonSep = i57;
                } else if (i57 === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i57);
        const toCode = to.charCodeAt(toStart + i57);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i57;
    }
    if (i57 !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i57 = fromStart + lastCommonSep + 1; i57 <= fromEnd; ++i57){
        if (i57 === fromEnd || from.charCodeAt(i57) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath3(path35) {
    if (typeof path35 !== "string") return path35;
    if (path35.length === 0) return "";
    const resolvedPath = resolve3(path35);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code26 = resolvedPath.charCodeAt(2);
                if (code26 !== 63 && code26 !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot1(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path35;
}
function dirname3(path36) {
    assertPath1(path36);
    const len = path36.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code27 = path36.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator1(code27)) {
            rootEnd = offset = 1;
            if (isPathSeparator1(path36.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator1(path36.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator1(path36.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator1(path36.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path36;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot1(code27)) {
            if (path36.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator1(path36.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator1(code27)) {
        return path36;
    }
    for(let i58 = len - 1; i58 >= offset; --i58){
        if (isPathSeparator1(path36.charCodeAt(i58))) {
            if (!matchedSlash) {
                end = i58;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return path36.slice(0, end);
}
function basename3(path37, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath1(path37);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i59;
    if (path37.length >= 2) {
        const drive = path37.charCodeAt(0);
        if (isWindowsDeviceRoot1(drive)) {
            if (path37.charCodeAt(1) === 58) start = 2;
        }
    }
    if (ext !== undefined && ext.length > 0 && ext.length <= path37.length) {
        if (ext.length === path37.length && ext === path37) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i59 = path37.length - 1; i59 >= start; --i59){
            const code28 = path37.charCodeAt(i59);
            if (isPathSeparator1(code28)) {
                if (!matchedSlash) {
                    start = i59 + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i59 + 1;
                }
                if (extIdx >= 0) {
                    if (code28 === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i59;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path37.length;
        return path37.slice(start, end);
    } else {
        for(i59 = path37.length - 1; i59 >= start; --i59){
            if (isPathSeparator1(path37.charCodeAt(i59))) {
                if (!matchedSlash) {
                    start = i59 + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i59 + 1;
            }
        }
        if (end === -1) return "";
        return path37.slice(start, end);
    }
}
function extname3(path38) {
    assertPath1(path38);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path38.length >= 2 && path38.charCodeAt(1) === 58 && isWindowsDeviceRoot1(path38.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i60 = path38.length - 1; i60 >= start; --i60){
        const code29 = path38.charCodeAt(i60);
        if (isPathSeparator1(code29)) {
            if (!matchedSlash) {
                startPart = i60 + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i60 + 1;
        }
        if (code29 === 46) {
            if (startDot === -1) startDot = i60;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path38.slice(startDot, end);
}
function format3(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format2("\\", pathObject);
}
function parse3(path39) {
    assertPath1(path39);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path39.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code30 = path39.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator1(code30)) {
            rootEnd = 1;
            if (isPathSeparator1(path39.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator1(path39.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator1(path39.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator1(path39.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot1(code30)) {
            if (path39.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator1(path39.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path39;
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path39;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator1(code30)) {
        ret.root = ret.dir = path39;
        return ret;
    }
    if (rootEnd > 0) ret.root = path39.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i61 = path39.length - 1;
    let preDotState = 0;
    for(; i61 >= rootEnd; --i61){
        code30 = path39.charCodeAt(i61);
        if (isPathSeparator1(code30)) {
            if (!matchedSlash) {
                startPart = i61 + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i61 + 1;
        }
        if (code30 === 46) {
            if (startDot === -1) startDot = i61;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path39.slice(startPart, end);
        }
    } else {
        ret.name = path39.slice(startPart, startDot);
        ret.base = path39.slice(startPart, end);
        ret.ext = path39.slice(startDot, end);
    }
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path39.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl3(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path40 = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path40 = `\\\\${url.hostname}${path40}`;
    }
    return path40;
}
function toFileUrl3(path41) {
    if (!isAbsolute3(path41)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path41.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace1(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod2 = {
    sep: sep3,
    delimiter: delimiter3,
    resolve: resolve3,
    normalize: normalize4,
    isAbsolute: isAbsolute3,
    join: join4,
    relative: relative3,
    toNamespacedPath: toNamespacedPath3,
    dirname: dirname3,
    basename: basename3,
    extname: extname3,
    format: format3,
    parse: parse3,
    fromFileUrl: fromFileUrl3,
    toFileUrl: toFileUrl3
};
const sep4 = "/";
const delimiter4 = ":";
function resolve4(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i62 = pathSegments.length - 1; i62 >= -1 && !resolvedAbsolute; i62--){
        let path42;
        if (i62 >= 0) path42 = pathSegments[i62];
        else {
            const { Deno  } = globalThis;
            if (typeof Deno?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path42 = Deno.cwd();
        }
        assertPath1(path42);
        if (path42.length === 0) {
            continue;
        }
        resolvedPath = `${path42}/${resolvedPath}`;
        resolvedAbsolute = path42.charCodeAt(0) === CHAR_FORWARD_SLASH1;
    }
    resolvedPath = normalizeString1(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator1);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize5(path43) {
    assertPath1(path43);
    if (path43.length === 0) return ".";
    const isAbsolute12 = path43.charCodeAt(0) === 47;
    const trailingSeparator = path43.charCodeAt(path43.length - 1) === 47;
    path43 = normalizeString1(path43, !isAbsolute12, "/", isPosixPathSeparator1);
    if (path43.length === 0 && !isAbsolute12) path43 = ".";
    if (path43.length > 0 && trailingSeparator) path43 += "/";
    if (isAbsolute12) return `/${path43}`;
    return path43;
}
function isAbsolute4(path44) {
    assertPath1(path44);
    return path44.length > 0 && path44.charCodeAt(0) === 47;
}
function join5(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i63 = 0, len = paths.length; i63 < len; ++i63){
        const path45 = paths[i63];
        assertPath1(path45);
        if (path45.length > 0) {
            if (!joined) joined = path45;
            else joined += `/${path45}`;
        }
    }
    if (!joined) return ".";
    return normalize5(joined);
}
function relative4(from, to) {
    assertPath1(from);
    assertPath1(to);
    if (from === to) return "";
    from = resolve4(from);
    to = resolve4(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 47) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 47) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i64 = 0;
    for(; i64 <= length; ++i64){
        if (i64 === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i64) === 47) {
                    return to.slice(toStart + i64 + 1);
                } else if (i64 === 0) {
                    return to.slice(toStart + i64);
                }
            } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i64) === 47) {
                    lastCommonSep = i64;
                } else if (i64 === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i64);
        const toCode = to.charCodeAt(toStart + i64);
        if (fromCode !== toCode) break;
        else if (fromCode === 47) lastCommonSep = i64;
    }
    let out = "";
    for(i64 = fromStart + lastCommonSep + 1; i64 <= fromEnd; ++i64){
        if (i64 === fromEnd || from.charCodeAt(i64) === 47) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (to.charCodeAt(toStart) === 47) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath4(path46) {
    return path46;
}
function dirname4(path47) {
    assertPath1(path47);
    if (path47.length === 0) return ".";
    const hasRoot = path47.charCodeAt(0) === 47;
    let end = -1;
    let matchedSlash = true;
    for(let i65 = path47.length - 1; i65 >= 1; --i65){
        if (path47.charCodeAt(i65) === 47) {
            if (!matchedSlash) {
                end = i65;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end === 1) return "//";
    return path47.slice(0, end);
}
function basename4(path48, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath1(path48);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i66;
    if (ext !== undefined && ext.length > 0 && ext.length <= path48.length) {
        if (ext.length === path48.length && ext === path48) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i66 = path48.length - 1; i66 >= 0; --i66){
            const code31 = path48.charCodeAt(i66);
            if (code31 === 47) {
                if (!matchedSlash) {
                    start = i66 + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i66 + 1;
                }
                if (extIdx >= 0) {
                    if (code31 === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i66;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path48.length;
        return path48.slice(start, end);
    } else {
        for(i66 = path48.length - 1; i66 >= 0; --i66){
            if (path48.charCodeAt(i66) === 47) {
                if (!matchedSlash) {
                    start = i66 + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i66 + 1;
            }
        }
        if (end === -1) return "";
        return path48.slice(start, end);
    }
}
function extname4(path49) {
    assertPath1(path49);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i67 = path49.length - 1; i67 >= 0; --i67){
        const code32 = path49.charCodeAt(i67);
        if (code32 === 47) {
            if (!matchedSlash) {
                startPart = i67 + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i67 + 1;
        }
        if (code32 === 46) {
            if (startDot === -1) startDot = i67;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path49.slice(startDot, end);
}
function format4(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format2("/", pathObject);
}
function parse4(path50) {
    assertPath1(path50);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path50.length === 0) return ret;
    const isAbsolute22 = path50.charCodeAt(0) === 47;
    let start;
    if (isAbsolute22) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i68 = path50.length - 1;
    let preDotState = 0;
    for(; i68 >= start; --i68){
        const code33 = path50.charCodeAt(i68);
        if (code33 === 47) {
            if (!matchedSlash) {
                startPart = i68 + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i68 + 1;
        }
        if (code33 === 46) {
            if (startDot === -1) startDot = i68;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute22) {
                ret.base = ret.name = path50.slice(1, end);
            } else {
                ret.base = ret.name = path50.slice(startPart, end);
            }
        }
    } else {
        if (startPart === 0 && isAbsolute22) {
            ret.name = path50.slice(1, startDot);
            ret.base = path50.slice(1, end);
        } else {
            ret.name = path50.slice(startPart, startDot);
            ret.base = path50.slice(startPart, end);
        }
        ret.ext = path50.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path50.slice(0, startPart - 1);
    else if (isAbsolute22) ret.dir = "/";
    return ret;
}
function fromFileUrl4(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl4(path51) {
    if (!isAbsolute4(path51)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace1(path51.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod3 = {
    sep: sep4,
    delimiter: delimiter4,
    resolve: resolve4,
    normalize: normalize5,
    isAbsolute: isAbsolute4,
    join: join5,
    relative: relative4,
    toNamespacedPath: toNamespacedPath4,
    dirname: dirname4,
    basename: basename4,
    extname: extname4,
    format: format4,
    parse: parse4,
    fromFileUrl: fromFileUrl4,
    toFileUrl: toFileUrl4
};
const path3 = isWindows1 ? mod2 : mod3;
const { join: join6 , normalize: normalize6  } = path3;
const path4 = isWindows1 ? mod2 : mod3;
const { basename: basename5 , delimiter: delimiter5 , dirname: dirname5 , extname: extname5 , format: format5 , fromFileUrl: fromFileUrl5 , isAbsolute: isAbsolute5 , join: join7 , normalize: normalize7 , parse: parse5 , relative: relative5 , resolve: resolve5 , sep: sep5 , toFileUrl: toFileUrl5 , toNamespacedPath: toNamespacedPath5 ,  } = path4;
function getFileInfoType(fileInfo) {
    return fileInfo.isFile ? "file" : fileInfo.isDirectory ? "dir" : fileInfo.isSymlink ? "symlink" : undefined;
}
async function ensureDir(dir) {
    try {
        const fileInfo = await Deno.lstat(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
    } catch (err18) {
        if (err18 instanceof Deno.errors.NotFound) {
            await Deno.mkdir(dir, {
                recursive: true
            });
            return;
        }
        throw err18;
    }
}
async function exists(filePath) {
    try {
        await Deno.lstat(filePath);
        return true;
    } catch (err19) {
        if (err19 instanceof Deno.errors.NotFound) {
            return false;
        }
        throw err19;
    }
}
class Tokenizer {
    rules;
    constructor(rules = []){
        this.rules = rules;
    }
    addRule(test, fn) {
        this.rules.push({
            test,
            fn
        });
        return this;
    }
    tokenize(string, receiver = (token)=>token
    ) {
        function* generator(rules) {
            let index = 0;
            for (const rule of rules){
                const result = rule.test(string);
                if (result) {
                    const { value , length  } = result;
                    index += length;
                    string = string.slice(length);
                    const token = {
                        ...rule.fn(value),
                        index
                    };
                    yield receiver(token);
                    yield* generator(rules);
                }
            }
        }
        const tokenGenerator = generator(this.rules);
        const tokens = [];
        for (const token1 of tokenGenerator){
            tokens.push(token1);
        }
        if (string.length) {
            throw new Error(`parser error: string not fully parsed! ${string.slice(0, 25)}`);
        }
        return tokens;
    }
}
function digits(value, count = 2) {
    return String(value).padStart(count, "0");
}
function createLiteralTestFunction(value) {
    return (string)=>{
        return string.startsWith(value) ? {
            value,
            length: value.length
        } : undefined;
    };
}
function createMatchTestFunction(match) {
    return (string)=>{
        const result = match.exec(string);
        if (result) return {
            value: result,
            length: result[0].length
        };
    };
}
const defaultRules = [
    {
        test: createLiteralTestFunction("yyyy"),
        fn: ()=>({
                type: "year",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("yy"),
        fn: ()=>({
                type: "year",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("MM"),
        fn: ()=>({
                type: "month",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("M"),
        fn: ()=>({
                type: "month",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("dd"),
        fn: ()=>({
                type: "day",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("d"),
        fn: ()=>({
                type: "day",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("HH"),
        fn: ()=>({
                type: "hour",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("H"),
        fn: ()=>({
                type: "hour",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("hh"),
        fn: ()=>({
                type: "hour",
                value: "2-digit",
                hour12: true
            })
    },
    {
        test: createLiteralTestFunction("h"),
        fn: ()=>({
                type: "hour",
                value: "numeric",
                hour12: true
            })
    },
    {
        test: createLiteralTestFunction("mm"),
        fn: ()=>({
                type: "minute",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("m"),
        fn: ()=>({
                type: "minute",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("ss"),
        fn: ()=>({
                type: "second",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("s"),
        fn: ()=>({
                type: "second",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("SSS"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 3
            })
    },
    {
        test: createLiteralTestFunction("SS"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 2
            })
    },
    {
        test: createLiteralTestFunction("S"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 1
            })
    },
    {
        test: createLiteralTestFunction("a"),
        fn: (value)=>({
                type: "dayPeriod",
                value: value
            })
    },
    {
        test: createMatchTestFunction(/^(')(?<value>\\.|[^\']*)\1/),
        fn: (match)=>({
                type: "literal",
                value: match.groups.value
            })
    },
    {
        test: createMatchTestFunction(/^.+?\s*/),
        fn: (match)=>({
                type: "literal",
                value: match[0]
            })
    }, 
];
class DateTimeFormatter {
    #format;
    constructor(formatString, rules = defaultRules){
        const tokenizer = new Tokenizer(rules);
        this.#format = tokenizer.tokenize(formatString, ({ type , value , hour12  })=>{
            const result = {
                type,
                value
            };
            if (hour12) result.hour12 = hour12;
            return result;
        });
    }
    format(date, options = {}) {
        let string = "";
        const utc = options.timeZone === "UTC";
        for (const token of this.#format){
            const type = token.type;
            switch(type){
                case "year":
                    {
                        const value = utc ? date.getUTCFullYear() : date.getFullYear();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2).slice(-2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "month":
                    {
                        const value = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "day":
                    {
                        const value = utc ? date.getUTCDate() : date.getDate();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "hour":
                    {
                        let value = utc ? date.getUTCHours() : date.getHours();
                        value -= token.hour12 && date.getHours() > 12 ? 12 : 0;
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "minute":
                    {
                        const value = utc ? date.getUTCMinutes() : date.getMinutes();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "second":
                    {
                        const value = utc ? date.getUTCSeconds() : date.getSeconds();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "fractionalSecond":
                    {
                        const value = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
                        string += digits(value, Number(token.value));
                        break;
                    }
                case "timeZoneName":
                    {
                        break;
                    }
                case "dayPeriod":
                    {
                        string += token.value ? date.getHours() >= 12 ? "PM" : "AM" : "";
                        break;
                    }
                case "literal":
                    {
                        string += token.value;
                        break;
                    }
                default:
                    throw Error(`FormatterError: { ${token.type} ${token.value} }`);
            }
        }
        return string;
    }
    parseToParts(string) {
        const parts = [];
        for (const token of this.#format){
            const type = token.type;
            let value = "";
            switch(token.type){
                case "year":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,4}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                        }
                        break;
                    }
                case "month":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            case "narrow":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            case "short":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            case "long":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "day":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "hour":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    if (token.hour12 && parseInt(value) > 12) {
                                        console.error(`Trying to parse hour greater than 12. Use 'H' instead of 'h'.`);
                                    }
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    if (token.hour12 && parseInt(value) > 12) {
                                        console.error(`Trying to parse hour greater than 12. Use 'HH' instead of 'hh'.`);
                                    }
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "minute":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "second":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "fractionalSecond":
                    {
                        value = new RegExp(`^\\d{${token.value}}`).exec(string)?.[0];
                        break;
                    }
                case "timeZoneName":
                    {
                        value = token.value;
                        break;
                    }
                case "dayPeriod":
                    {
                        value = /^(A|P)M/.exec(string)?.[0];
                        break;
                    }
                case "literal":
                    {
                        if (!string.startsWith(token.value)) {
                            throw Error(`Literal "${token.value}" not found "${string.slice(0, 25)}"`);
                        }
                        value = token.value;
                        break;
                    }
                default:
                    throw Error(`${token.type} ${token.value}`);
            }
            if (!value) {
                throw Error(`value not valid for token { ${type} ${value} } ${string.slice(0, 25)}`);
            }
            parts.push({
                type,
                value
            });
            string = string.slice(value.length);
        }
        if (string.length) {
            throw Error(`datetime string was not fully parsed! ${string.slice(0, 25)}`);
        }
        return parts;
    }
    sortDateTimeFormatPart(parts) {
        let result = [];
        const typeArray = [
            "year",
            "month",
            "day",
            "hour",
            "minute",
            "second",
            "fractionalSecond", 
        ];
        for (const type of typeArray){
            const current = parts.findIndex((el)=>el.type === type
            );
            if (current !== -1) {
                result = result.concat(parts.splice(current, 1));
            }
        }
        result = result.concat(parts);
        return result;
    }
    partsToDate(parts) {
        const date = new Date();
        const utc = parts.find((part)=>part.type === "timeZoneName" && part.value === "UTC"
        );
        utc ? date.setUTCHours(0, 0, 0, 0) : date.setHours(0, 0, 0, 0);
        for (const part1 of parts){
            switch(part1.type){
                case "year":
                    {
                        const value = Number(part1.value.padStart(4, "20"));
                        utc ? date.setUTCFullYear(value) : date.setFullYear(value);
                        break;
                    }
                case "month":
                    {
                        const value = Number(part1.value) - 1;
                        utc ? date.setUTCMonth(value) : date.setMonth(value);
                        break;
                    }
                case "day":
                    {
                        const value = Number(part1.value);
                        utc ? date.setUTCDate(value) : date.setDate(value);
                        break;
                    }
                case "hour":
                    {
                        let value = Number(part1.value);
                        const dayPeriod = parts.find((part)=>part.type === "dayPeriod"
                        );
                        if (dayPeriod?.value === "PM") value += 12;
                        utc ? date.setUTCHours(value) : date.setHours(value);
                        break;
                    }
                case "minute":
                    {
                        const value = Number(part1.value);
                        utc ? date.setUTCMinutes(value) : date.setMinutes(value);
                        break;
                    }
                case "second":
                    {
                        const value = Number(part1.value);
                        utc ? date.setUTCSeconds(value) : date.setSeconds(value);
                        break;
                    }
                case "fractionalSecond":
                    {
                        const value = Number(part1.value);
                        utc ? date.setUTCMilliseconds(value) : date.setMilliseconds(value);
                        break;
                    }
            }
        }
        return date;
    }
    parse(string) {
        const parts = this.parseToParts(string);
        const sortParts = this.sortDateTimeFormatPart(parts);
        return this.partsToDate(sortParts);
    }
}
var Day;
(function(Day1) {
    Day1[Day1["Sun"] = 0] = "Sun";
    Day1[Day1["Mon"] = 1] = "Mon";
    Day1[Day1["Tue"] = 2] = "Tue";
    Day1[Day1["Wed"] = 3] = "Wed";
    Day1[Day1["Thu"] = 4] = "Thu";
    Day1[Day1["Fri"] = 5] = "Fri";
    Day1[Day1["Sat"] = 6] = "Sat";
})(Day || (Day = {}));
function format6(date, formatString) {
    const formatter = new DateTimeFormatter(formatString);
    return formatter.format(date);
}
class YAMLError extends Error {
    mark;
    constructor(message = "(unknown reason)", mark = ""){
        super(`${message} ${mark}`);
        this.mark = mark;
        this.name = this.constructor.name;
    }
    toString(_compact) {
        return `${this.name}: ${this.message} ${this.mark}`;
    }
}
function isBoolean1(value) {
    return typeof value === "boolean" || value instanceof Boolean;
}
function isObject(value) {
    return value !== null && typeof value === "object";
}
function repeat1(str37, count) {
    let result = "";
    for(let cycle = 0; cycle < count; cycle++){
        result += str37;
    }
    return result;
}
function isNegativeZero(i69) {
    return i69 === 0 && Number.NEGATIVE_INFINITY === 1 / i69;
}
class Mark {
    name;
    buffer;
    position;
    line;
    column;
    constructor(name, buffer, position, line, column){
        this.name = name;
        this.buffer = buffer;
        this.position = position;
        this.line = line;
        this.column = column;
    }
    getSnippet(indent = 4, maxLength = 75) {
        if (!this.buffer) return null;
        let head = "";
        let start = this.position;
        while(start > 0 && "\x00\r\n\x85\u2028\u2029".indexOf(this.buffer.charAt(start - 1)) === -1){
            start -= 1;
            if (this.position - start > maxLength / 2 - 1) {
                head = " ... ";
                start += 5;
                break;
            }
        }
        let tail = "";
        let end = this.position;
        while(end < this.buffer.length && "\x00\r\n\x85\u2028\u2029".indexOf(this.buffer.charAt(end)) === -1){
            end += 1;
            if (end - this.position > maxLength / 2 - 1) {
                tail = " ... ";
                end -= 5;
                break;
            }
        }
        const snippet = this.buffer.slice(start, end);
        return `${repeat1(" ", indent)}${head}${snippet}${tail}\n${repeat1(" ", indent + this.position - start + head.length)}^`;
    }
    toString(compact) {
        let snippet, where = "";
        if (this.name) {
            where += `in "${this.name}" `;
        }
        where += `at line ${this.line + 1}, column ${this.column + 1}`;
        if (!compact) {
            snippet = this.getSnippet();
            if (snippet) {
                where += `:\n${snippet}`;
            }
        }
        return where;
    }
}
function compileList(schema, name, result) {
    const exclude = [];
    for (const includedSchema of schema.include){
        result = compileList(includedSchema, name, result);
    }
    for (const currentType of schema[name]){
        for(let previousIndex = 0; previousIndex < result.length; previousIndex++){
            const previousType = result[previousIndex];
            if (previousType.tag === currentType.tag && previousType.kind === currentType.kind) {
                exclude.push(previousIndex);
            }
        }
        result.push(currentType);
    }
    return result.filter((_type, index)=>!exclude.includes(index)
    );
}
function compileMap(...typesList) {
    const result = {
        fallback: {},
        mapping: {},
        scalar: {},
        sequence: {}
    };
    for (const types of typesList){
        for (const type of types){
            if (type.kind !== null) {
                result[type.kind][type.tag] = result["fallback"][type.tag] = type;
            }
        }
    }
    return result;
}
class Schema {
    static SCHEMA_DEFAULT;
    implicit;
    explicit;
    include;
    compiledImplicit;
    compiledExplicit;
    compiledTypeMap;
    constructor(definition){
        this.explicit = definition.explicit || [];
        this.implicit = definition.implicit || [];
        this.include = definition.include || [];
        for (const type of this.implicit){
            if (type.loadKind && type.loadKind !== "scalar") {
                throw new YAMLError("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
            }
        }
        this.compiledImplicit = compileList(this, "implicit", []);
        this.compiledExplicit = compileList(this, "explicit", []);
        this.compiledTypeMap = compileMap(this.compiledImplicit, this.compiledExplicit);
    }
    extend(definition) {
        return new Schema({
            implicit: [
                ...new Set([
                    ...this.implicit,
                    ...definition?.implicit ?? []
                ]), 
            ],
            explicit: [
                ...new Set([
                    ...this.explicit,
                    ...definition?.explicit ?? []
                ]), 
            ],
            include: [
                ...new Set([
                    ...this.include,
                    ...definition?.include ?? []
                ])
            ]
        });
    }
    static create() {}
}
const DEFAULT_RESOLVE = ()=>true
;
const DEFAULT_CONSTRUCT = (data)=>data
;
function checkTagFormat(tag) {
    return tag;
}
class Type {
    tag;
    kind = null;
    instanceOf;
    predicate;
    represent;
    defaultStyle;
    styleAliases;
    loadKind;
    constructor(tag, options){
        this.tag = checkTagFormat(tag);
        if (options) {
            this.kind = options.kind;
            this.resolve = options.resolve || DEFAULT_RESOLVE;
            this.construct = options.construct || DEFAULT_CONSTRUCT;
            this.instanceOf = options.instanceOf;
            this.predicate = options.predicate;
            this.represent = options.represent;
            this.defaultStyle = options.defaultStyle;
            this.styleAliases = options.styleAliases;
        }
    }
    resolve = ()=>true
    ;
    construct = (data)=>data
    ;
}
function copy1(src, dst, off = 0) {
    off = Math.max(0, Math.min(off, dst.byteLength));
    const dstBytesAvailable = dst.byteLength - off;
    if (src.byteLength > dstBytesAvailable) {
        src = src.subarray(0, dstBytesAvailable);
    }
    dst.set(src, off);
    return src.byteLength;
}
const MIN_READ = 32 * 1024;
const MAX_SIZE = 2 ** 32 - 2;
class Buffer {
    #buf;
    #off = 0;
    constructor(ab){
        this.#buf = ab === undefined ? new Uint8Array(0) : new Uint8Array(ab);
    }
    bytes(options = {
        copy: true
    }) {
        if (options.copy === false) return this.#buf.subarray(this.#off);
        return this.#buf.slice(this.#off);
    }
    empty() {
        return this.#buf.byteLength <= this.#off;
    }
    get length() {
        return this.#buf.byteLength - this.#off;
    }
    get capacity() {
        return this.#buf.buffer.byteLength;
    }
    truncate(n) {
        if (n === 0) {
            this.reset();
            return;
        }
        if (n < 0 || n > this.length) {
            throw Error("bytes.Buffer: truncation out of range");
        }
        this.#reslice(this.#off + n);
    }
    reset() {
        this.#reslice(0);
        this.#off = 0;
    }
     #tryGrowByReslice(n) {
        const l = this.#buf.byteLength;
        if (n <= this.capacity - l) {
            this.#reslice(l + n);
            return l;
        }
        return -1;
    }
     #reslice(len) {
        assert2(len <= this.#buf.buffer.byteLength);
        this.#buf = new Uint8Array(this.#buf.buffer, 0, len);
    }
    readSync(p) {
        if (this.empty()) {
            this.reset();
            if (p.byteLength === 0) {
                return 0;
            }
            return null;
        }
        const nread = copy1(this.#buf.subarray(this.#off), p);
        this.#off += nread;
        return nread;
    }
    read(p) {
        const rr = this.readSync(p);
        return Promise.resolve(rr);
    }
    writeSync(p) {
        const m = this.#grow(p.byteLength);
        return copy1(p, this.#buf, m);
    }
    write(p) {
        const n1 = this.writeSync(p);
        return Promise.resolve(n1);
    }
     #grow(n2) {
        const m = this.length;
        if (m === 0 && this.#off !== 0) {
            this.reset();
        }
        const i = this.#tryGrowByReslice(n2);
        if (i >= 0) {
            return i;
        }
        const c = this.capacity;
        if (n2 <= Math.floor(c / 2) - m) {
            copy1(this.#buf.subarray(this.#off), this.#buf);
        } else if (c + n2 > MAX_SIZE) {
            throw new Error("The buffer cannot be grown beyond the maximum size.");
        } else {
            const buf = new Uint8Array(Math.min(2 * c + n2, MAX_SIZE));
            copy1(this.#buf.subarray(this.#off), buf);
            this.#buf = buf;
        }
        this.#off = 0;
        this.#reslice(Math.min(m + n2, MAX_SIZE));
        return m;
    }
    grow(n3) {
        if (n3 < 0) {
            throw Error("Buffer.grow: negative count");
        }
        const m = this.#grow(n3);
        this.#reslice(m);
    }
    async readFrom(r) {
        let n4 = 0;
        const tmp = new Uint8Array(MIN_READ);
        while(true){
            const shouldGrow = this.capacity - this.length < MIN_READ;
            const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
            const nread = await r.read(buf);
            if (nread === null) {
                return n4;
            }
            if (shouldGrow) this.writeSync(buf.subarray(0, nread));
            else this.#reslice(this.length + nread);
            n4 += nread;
        }
    }
    readFromSync(r) {
        let n5 = 0;
        const tmp = new Uint8Array(MIN_READ);
        while(true){
            const shouldGrow = this.capacity - this.length < MIN_READ;
            const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
            const nread = r.readSync(buf);
            if (nread === null) {
                return n5;
            }
            if (shouldGrow) this.writeSync(buf.subarray(0, nread));
            else this.#reslice(this.length + nread);
            n5 += nread;
        }
    }
}
const DEFAULT_BUF_SIZE1 = 4096;
const MIN_BUF_SIZE1 = 16;
const CR1 = "\r".charCodeAt(0);
const LF1 = "\n".charCodeAt(0);
class BufferFullError1 extends Error {
    partial;
    name = "BufferFullError";
    constructor(partial){
        super("Buffer full");
        this.partial = partial;
    }
}
class PartialReadError1 extends Error {
    name = "PartialReadError";
    partial;
    constructor(){
        super("Encountered UnexpectedEof, data only partially read");
    }
}
class BufReader1 {
    buf;
    rd;
    r = 0;
    w = 0;
    eof = false;
    static create(r, size = 4096) {
        return r instanceof BufReader1 ? r : new BufReader1(r, size);
    }
    constructor(rd, size = 4096){
        if (size < 16) {
            size = MIN_BUF_SIZE1;
        }
        this._reset(new Uint8Array(size), rd);
    }
    size() {
        return this.buf.byteLength;
    }
    buffered() {
        return this.w - this.r;
    }
    async _fill() {
        if (this.r > 0) {
            this.buf.copyWithin(0, this.r, this.w);
            this.w -= this.r;
            this.r = 0;
        }
        if (this.w >= this.buf.byteLength) {
            throw Error("bufio: tried to fill full buffer");
        }
        for(let i70 = 100; i70 > 0; i70--){
            const rr = await this.rd.read(this.buf.subarray(this.w));
            if (rr === null) {
                this.eof = true;
                return;
            }
            assert2(rr >= 0, "negative read");
            this.w += rr;
            if (rr > 0) {
                return;
            }
        }
        throw new Error(`No progress after ${100} read() calls`);
    }
    reset(r) {
        this._reset(this.buf, r);
    }
    _reset(buf, rd) {
        this.buf = buf;
        this.rd = rd;
        this.eof = false;
    }
    async read(p) {
        let rr = p.byteLength;
        if (p.byteLength === 0) return rr;
        if (this.r === this.w) {
            if (p.byteLength >= this.buf.byteLength) {
                const rr = await this.rd.read(p);
                const nread = rr ?? 0;
                assert2(nread >= 0, "negative read");
                return rr;
            }
            this.r = 0;
            this.w = 0;
            rr = await this.rd.read(this.buf);
            if (rr === 0 || rr === null) return rr;
            assert2(rr >= 0, "negative read");
            this.w += rr;
        }
        const copied = copy1(this.buf.subarray(this.r, this.w), p, 0);
        this.r += copied;
        return copied;
    }
    async readFull(p) {
        let bytesRead = 0;
        while(bytesRead < p.length){
            try {
                const rr = await this.read(p.subarray(bytesRead));
                if (rr === null) {
                    if (bytesRead === 0) {
                        return null;
                    } else {
                        throw new PartialReadError1();
                    }
                }
                bytesRead += rr;
            } catch (err20) {
                if (err20 instanceof PartialReadError1) {
                    err20.partial = p.subarray(0, bytesRead);
                } else if (err20 instanceof Error) {
                    const e = new PartialReadError1();
                    e.partial = p.subarray(0, bytesRead);
                    e.stack = err20.stack;
                    e.message = err20.message;
                    e.cause = err20.cause;
                    throw err20;
                }
                throw err20;
            }
        }
        return p;
    }
    async readByte() {
        while(this.r === this.w){
            if (this.eof) return null;
            await this._fill();
        }
        const c = this.buf[this.r];
        this.r++;
        return c;
    }
    async readString(delim) {
        if (delim.length !== 1) {
            throw new Error("Delimiter should be a single character");
        }
        const buffer = await this.readSlice(delim.charCodeAt(0));
        if (buffer === null) return null;
        return new TextDecoder().decode(buffer);
    }
    async readLine() {
        let line = null;
        try {
            line = await this.readSlice(LF1);
        } catch (err21) {
            if (err21 instanceof Deno.errors.BadResource) {
                throw err21;
            }
            let partial;
            if (err21 instanceof PartialReadError1) {
                partial = err21.partial;
                assert2(partial instanceof Uint8Array, "bufio: caught error from `readSlice()` without `partial` property");
            }
            if (!(err21 instanceof BufferFullError1)) {
                throw err21;
            }
            partial = err21.partial;
            if (!this.eof && partial && partial.byteLength > 0 && partial[partial.byteLength - 1] === CR1) {
                assert2(this.r > 0, "bufio: tried to rewind past start of buffer");
                this.r--;
                partial = partial.subarray(0, partial.byteLength - 1);
            }
            if (partial) {
                return {
                    line: partial,
                    more: !this.eof
                };
            }
        }
        if (line === null) {
            return null;
        }
        if (line.byteLength === 0) {
            return {
                line,
                more: false
            };
        }
        if (line[line.byteLength - 1] == LF1) {
            let drop = 1;
            if (line.byteLength > 1 && line[line.byteLength - 2] === CR1) {
                drop = 2;
            }
            line = line.subarray(0, line.byteLength - drop);
        }
        return {
            line,
            more: false
        };
    }
    async readSlice(delim) {
        let s = 0;
        let slice;
        while(true){
            let i71 = this.buf.subarray(this.r + s, this.w).indexOf(delim);
            if (i71 >= 0) {
                i71 += s;
                slice = this.buf.subarray(this.r, this.r + i71 + 1);
                this.r += i71 + 1;
                break;
            }
            if (this.eof) {
                if (this.r === this.w) {
                    return null;
                }
                slice = this.buf.subarray(this.r, this.w);
                this.r = this.w;
                break;
            }
            if (this.buffered() >= this.buf.byteLength) {
                this.r = this.w;
                const oldbuf = this.buf;
                const newbuf = this.buf.slice(0);
                this.buf = newbuf;
                throw new BufferFullError1(oldbuf);
            }
            s = this.w - this.r;
            try {
                await this._fill();
            } catch (err22) {
                if (err22 instanceof PartialReadError1) {
                    err22.partial = slice;
                } else if (err22 instanceof Error) {
                    const e = new PartialReadError1();
                    e.partial = slice;
                    e.stack = err22.stack;
                    e.message = err22.message;
                    e.cause = err22.cause;
                    throw err22;
                }
                throw err22;
            }
        }
        return slice;
    }
    async peek(n6) {
        if (n6 < 0) {
            throw Error("negative count");
        }
        let avail = this.w - this.r;
        while(avail < n6 && avail < this.buf.byteLength && !this.eof){
            try {
                await this._fill();
            } catch (err23) {
                if (err23 instanceof PartialReadError1) {
                    err23.partial = this.buf.subarray(this.r, this.w);
                } else if (err23 instanceof Error) {
                    const e = new PartialReadError1();
                    e.partial = this.buf.subarray(this.r, this.w);
                    e.stack = err23.stack;
                    e.message = err23.message;
                    e.cause = err23.cause;
                    throw err23;
                }
                throw err23;
            }
            avail = this.w - this.r;
        }
        if (avail === 0 && this.eof) {
            return null;
        } else if (avail < n6 && this.eof) {
            return this.buf.subarray(this.r, this.r + avail);
        } else if (avail < n6) {
            throw new BufferFullError1(this.buf.subarray(this.r, this.w));
        }
        return this.buf.subarray(this.r, this.r + n6);
    }
}
class AbstractBufBase1 {
    buf;
    usedBufferBytes = 0;
    err = null;
    size() {
        return this.buf.byteLength;
    }
    available() {
        return this.buf.byteLength - this.usedBufferBytes;
    }
    buffered() {
        return this.usedBufferBytes;
    }
}
class BufWriter1 extends AbstractBufBase1 {
    writer;
    static create(writer, size = 4096) {
        return writer instanceof BufWriter1 ? writer : new BufWriter1(writer, size);
    }
    constructor(writer, size = 4096){
        super();
        this.writer = writer;
        if (size <= 0) {
            size = DEFAULT_BUF_SIZE1;
        }
        this.buf = new Uint8Array(size);
    }
    reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.writer = w;
    }
    async flush() {
        if (this.err !== null) throw this.err;
        if (this.usedBufferBytes === 0) return;
        try {
            const p = this.buf.subarray(0, this.usedBufferBytes);
            let nwritten = 0;
            while(nwritten < p.length){
                nwritten += await this.writer.write(p.subarray(nwritten));
            }
        } catch (e) {
            if (e instanceof Error) {
                this.err = e;
            }
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    async write(data) {
        if (this.err !== null) throw this.err;
        if (data.length === 0) return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while(data.byteLength > this.available()){
            if (this.buffered() === 0) {
                try {
                    numBytesWritten = await this.writer.write(data);
                } catch (e) {
                    if (e instanceof Error) {
                        this.err = e;
                    }
                    throw e;
                }
            } else {
                numBytesWritten = copy1(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                await this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copy1(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
}
class BufWriterSync1 extends AbstractBufBase1 {
    writer;
    static create(writer, size = 4096) {
        return writer instanceof BufWriterSync1 ? writer : new BufWriterSync1(writer, size);
    }
    constructor(writer, size = 4096){
        super();
        this.writer = writer;
        if (size <= 0) {
            size = DEFAULT_BUF_SIZE1;
        }
        this.buf = new Uint8Array(size);
    }
    reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.writer = w;
    }
    flush() {
        if (this.err !== null) throw this.err;
        if (this.usedBufferBytes === 0) return;
        try {
            const p = this.buf.subarray(0, this.usedBufferBytes);
            let nwritten = 0;
            while(nwritten < p.length){
                nwritten += this.writer.writeSync(p.subarray(nwritten));
            }
        } catch (e) {
            if (e instanceof Error) {
                this.err = e;
            }
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    writeSync(data) {
        if (this.err !== null) throw this.err;
        if (data.length === 0) return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while(data.byteLength > this.available()){
            if (this.buffered() === 0) {
                try {
                    numBytesWritten = this.writer.writeSync(data);
                } catch (e) {
                    if (e instanceof Error) {
                        this.err = e;
                    }
                    throw e;
                }
            } else {
                numBytesWritten = copy1(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copy1(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
}
const BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
function resolveYamlBinary(data) {
    if (data === null) return false;
    let code34;
    let bitlen = 0;
    const max = data.length;
    const map1 = BASE64_MAP;
    for(let idx = 0; idx < max; idx++){
        code34 = map1.indexOf(data.charAt(idx));
        if (code34 > 64) continue;
        if (code34 < 0) return false;
        bitlen += 6;
    }
    return bitlen % 8 === 0;
}
function constructYamlBinary(data) {
    const input = data.replace(/[\r\n=]/g, "");
    const max = input.length;
    const map2 = BASE64_MAP;
    const result = [];
    let bits = 0;
    for(let idx = 0; idx < max; idx++){
        if (idx % 4 === 0 && idx) {
            result.push(bits >> 16 & 255);
            result.push(bits >> 8 & 255);
            result.push(bits & 255);
        }
        bits = bits << 6 | map2.indexOf(input.charAt(idx));
    }
    const tailbits = max % 4 * 6;
    if (tailbits === 0) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
    } else if (tailbits === 18) {
        result.push(bits >> 10 & 255);
        result.push(bits >> 2 & 255);
    } else if (tailbits === 12) {
        result.push(bits >> 4 & 255);
    }
    return new Buffer(new Uint8Array(result));
}
function representYamlBinary(object) {
    const max = object.length;
    const map3 = BASE64_MAP;
    let result = "";
    let bits = 0;
    for(let idx = 0; idx < max; idx++){
        if (idx % 3 === 0 && idx) {
            result += map3[bits >> 18 & 63];
            result += map3[bits >> 12 & 63];
            result += map3[bits >> 6 & 63];
            result += map3[bits & 63];
        }
        bits = (bits << 8) + object[idx];
    }
    const tail = max % 3;
    if (tail === 0) {
        result += map3[bits >> 18 & 63];
        result += map3[bits >> 12 & 63];
        result += map3[bits >> 6 & 63];
        result += map3[bits & 63];
    } else if (tail === 2) {
        result += map3[bits >> 10 & 63];
        result += map3[bits >> 4 & 63];
        result += map3[bits << 2 & 63];
        result += map3[64];
    } else if (tail === 1) {
        result += map3[bits >> 2 & 63];
        result += map3[bits << 4 & 63];
        result += map3[64];
        result += map3[64];
    }
    return result;
}
function isBinary(obj) {
    const buf = new Buffer();
    try {
        if (0 > buf.readFromSync(obj)) return true;
        return false;
    } catch  {
        return false;
    } finally{
        buf.reset();
    }
}
const binary = new Type("tag:yaml.org,2002:binary", {
    construct: constructYamlBinary,
    kind: "scalar",
    predicate: isBinary,
    represent: representYamlBinary,
    resolve: resolveYamlBinary
});
function resolveYamlBoolean(data) {
    const max = data.length;
    return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
}
function constructYamlBoolean(data) {
    return data === "true" || data === "True" || data === "TRUE";
}
const bool = new Type("tag:yaml.org,2002:bool", {
    construct: constructYamlBoolean,
    defaultStyle: "lowercase",
    kind: "scalar",
    predicate: isBoolean1,
    represent: {
        lowercase (object) {
            return object ? "true" : "false";
        },
        uppercase (object) {
            return object ? "TRUE" : "FALSE";
        },
        camelcase (object) {
            return object ? "True" : "False";
        }
    },
    resolve: resolveYamlBoolean
});
const YAML_FLOAT_PATTERN = new RegExp("^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?" + "|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?" + "|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*" + "|[-+]?\\.(?:inf|Inf|INF)" + "|\\.(?:nan|NaN|NAN))$");
function resolveYamlFloat(data) {
    if (!YAML_FLOAT_PATTERN.test(data) || data[data.length - 1] === "_") {
        return false;
    }
    return true;
}
function constructYamlFloat(data) {
    let value = data.replace(/_/g, "").toLowerCase();
    const sign = value[0] === "-" ? -1 : 1;
    const digits1 = [];
    if ("+-".indexOf(value[0]) >= 0) {
        value = value.slice(1);
    }
    if (value === ".inf") {
        return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    }
    if (value === ".nan") {
        return NaN;
    }
    if (value.indexOf(":") >= 0) {
        value.split(":").forEach((v)=>{
            digits1.unshift(parseFloat(v));
        });
        let valueNb = 0;
        let base = 1;
        digits1.forEach((d)=>{
            valueNb += d * base;
            base *= 60;
        });
        return sign * valueNb;
    }
    return sign * parseFloat(value);
}
const SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
function representYamlFloat(object, style) {
    if (isNaN(object)) {
        switch(style){
            case "lowercase":
                return ".nan";
            case "uppercase":
                return ".NAN";
            case "camelcase":
                return ".NaN";
        }
    } else if (Number.POSITIVE_INFINITY === object) {
        switch(style){
            case "lowercase":
                return ".inf";
            case "uppercase":
                return ".INF";
            case "camelcase":
                return ".Inf";
        }
    } else if (Number.NEGATIVE_INFINITY === object) {
        switch(style){
            case "lowercase":
                return "-.inf";
            case "uppercase":
                return "-.INF";
            case "camelcase":
                return "-.Inf";
        }
    } else if (isNegativeZero(object)) {
        return "-0.0";
    }
    const res = object.toString(10);
    return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
}
function isFloat(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || isNegativeZero(object));
}
const __float = new Type("tag:yaml.org,2002:float", {
    construct: constructYamlFloat,
    defaultStyle: "lowercase",
    kind: "scalar",
    predicate: isFloat,
    represent: representYamlFloat,
    resolve: resolveYamlFloat
});
function reconstructFunction(code35) {
    const func1 = new Function(`return ${code35}`)();
    if (!(func1 instanceof Function)) {
        throw new TypeError(`Expected function but got ${typeof func1}: ${code35}`);
    }
    return func1;
}
new Type("tag:yaml.org,2002:js/function", {
    kind: "scalar",
    resolve (data) {
        if (data === null) {
            return false;
        }
        try {
            reconstructFunction(`${data}`);
            return true;
        } catch (_err) {
            return false;
        }
    },
    construct (data) {
        return reconstructFunction(data);
    },
    predicate (object) {
        return object instanceof Function;
    },
    represent (object) {
        return object.toString();
    }
});
function isHexCode(c) {
    return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
}
function isOctCode(c) {
    return 48 <= c && c <= 55;
}
function isDecCode(c) {
    return 48 <= c && c <= 57;
}
function resolveYamlInteger(data) {
    const max = data.length;
    let index = 0;
    let hasDigits = false;
    if (!max) return false;
    let ch = data[index];
    if (ch === "-" || ch === "+") {
        ch = data[++index];
    }
    if (ch === "0") {
        if (index + 1 === max) return true;
        ch = data[++index];
        if (ch === "b") {
            index++;
            for(; index < max; index++){
                ch = data[index];
                if (ch === "_") continue;
                if (ch !== "0" && ch !== "1") return false;
                hasDigits = true;
            }
            return hasDigits && ch !== "_";
        }
        if (ch === "x") {
            index++;
            for(; index < max; index++){
                ch = data[index];
                if (ch === "_") continue;
                if (!isHexCode(data.charCodeAt(index))) return false;
                hasDigits = true;
            }
            return hasDigits && ch !== "_";
        }
        for(; index < max; index++){
            ch = data[index];
            if (ch === "_") continue;
            if (!isOctCode(data.charCodeAt(index))) return false;
            hasDigits = true;
        }
        return hasDigits && ch !== "_";
    }
    if (ch === "_") return false;
    for(; index < max; index++){
        ch = data[index];
        if (ch === "_") continue;
        if (ch === ":") break;
        if (!isDecCode(data.charCodeAt(index))) {
            return false;
        }
        hasDigits = true;
    }
    if (!hasDigits || ch === "_") return false;
    if (ch !== ":") return true;
    return /^(:[0-5]?[0-9])+$/.test(data.slice(index));
}
function constructYamlInteger(data) {
    let value = data;
    const digits2 = [];
    if (value.indexOf("_") !== -1) {
        value = value.replace(/_/g, "");
    }
    let sign = 1;
    let ch = value[0];
    if (ch === "-" || ch === "+") {
        if (ch === "-") sign = -1;
        value = value.slice(1);
        ch = value[0];
    }
    if (value === "0") return 0;
    if (ch === "0") {
        if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
        if (value[1] === "x") return sign * parseInt(value, 16);
        return sign * parseInt(value, 8);
    }
    if (value.indexOf(":") !== -1) {
        value.split(":").forEach((v)=>{
            digits2.unshift(parseInt(v, 10));
        });
        let valueInt = 0;
        let base = 1;
        digits2.forEach((d)=>{
            valueInt += d * base;
            base *= 60;
        });
        return sign * valueInt;
    }
    return sign * parseInt(value, 10);
}
function isInteger(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && object % 1 === 0 && !isNegativeZero(object);
}
const __int = new Type("tag:yaml.org,2002:int", {
    construct: constructYamlInteger,
    defaultStyle: "decimal",
    kind: "scalar",
    predicate: isInteger,
    represent: {
        binary (obj) {
            return obj >= 0 ? `0b${obj.toString(2)}` : `-0b${obj.toString(2).slice(1)}`;
        },
        octal (obj) {
            return obj >= 0 ? `0${obj.toString(8)}` : `-0${obj.toString(8).slice(1)}`;
        },
        decimal (obj) {
            return obj.toString(10);
        },
        hexadecimal (obj) {
            return obj >= 0 ? `0x${obj.toString(16).toUpperCase()}` : `-0x${obj.toString(16).toUpperCase().slice(1)}`;
        }
    },
    resolve: resolveYamlInteger,
    styleAliases: {
        binary: [
            2,
            "bin"
        ],
        decimal: [
            10,
            "dec"
        ],
        hexadecimal: [
            16,
            "hex"
        ],
        octal: [
            8,
            "oct"
        ]
    }
});
const map = new Type("tag:yaml.org,2002:map", {
    construct (data) {
        return data !== null ? data : {};
    },
    kind: "mapping"
});
function resolveYamlMerge(data) {
    return data === "<<" || data === null;
}
const merge = new Type("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: resolveYamlMerge
});
function resolveYamlNull(data) {
    const max = data.length;
    return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
}
function constructYamlNull() {
    return null;
}
function isNull(object) {
    return object === null;
}
const nil = new Type("tag:yaml.org,2002:null", {
    construct: constructYamlNull,
    defaultStyle: "lowercase",
    kind: "scalar",
    predicate: isNull,
    represent: {
        canonical () {
            return "~";
        },
        lowercase () {
            return "null";
        },
        uppercase () {
            return "NULL";
        },
        camelcase () {
            return "Null";
        }
    },
    resolve: resolveYamlNull
});
const { hasOwn  } = Object;
const _toString = Object.prototype.toString;
function resolveYamlOmap(data) {
    const objectKeys1 = [];
    let pairKey = "";
    let pairHasKey = false;
    for (const pair of data){
        pairHasKey = false;
        if (_toString.call(pair) !== "[object Object]") return false;
        for(pairKey in pair){
            if (hasOwn(pair, pairKey)) {
                if (!pairHasKey) pairHasKey = true;
                else return false;
            }
        }
        if (!pairHasKey) return false;
        if (objectKeys1.indexOf(pairKey) === -1) objectKeys1.push(pairKey);
        else return false;
    }
    return true;
}
function constructYamlOmap(data) {
    return data !== null ? data : [];
}
const omap = new Type("tag:yaml.org,2002:omap", {
    construct: constructYamlOmap,
    kind: "sequence",
    resolve: resolveYamlOmap
});
const _toString1 = Object.prototype.toString;
function resolveYamlPairs(data) {
    const result = new Array(data.length);
    for(let index = 0; index < data.length; index++){
        const pair = data[index];
        if (_toString1.call(pair) !== "[object Object]") return false;
        const keys = Object.keys(pair);
        if (keys.length !== 1) return false;
        result[index] = [
            keys[0],
            pair[keys[0]]
        ];
    }
    return true;
}
function constructYamlPairs(data) {
    if (data === null) return [];
    const result = new Array(data.length);
    for(let index = 0; index < data.length; index += 1){
        const pair = data[index];
        const keys = Object.keys(pair);
        result[index] = [
            keys[0],
            pair[keys[0]]
        ];
    }
    return result;
}
const pairs = new Type("tag:yaml.org,2002:pairs", {
    construct: constructYamlPairs,
    kind: "sequence",
    resolve: resolveYamlPairs
});
const REGEXP = /^\/(?<regexp>[\s\S]+)\/(?<modifiers>[gismuy]*)$/;
const regexp = new Type("tag:yaml.org,2002:js/regexp", {
    kind: "scalar",
    resolve (data) {
        if (data === null || !data.length) {
            return false;
        }
        const regexp1 = `${data}`;
        if (regexp1.charAt(0) === "/") {
            if (!REGEXP.test(data)) {
                return false;
            }
            const modifiers = [
                ...regexp1.match(REGEXP)?.groups?.modifiers ?? ""
            ];
            if (new Set(modifiers).size < modifiers.length) {
                return false;
            }
        }
        return true;
    },
    construct (data) {
        const { regexp: regexp2 = `${data}` , modifiers =""  } = `${data}`.match(REGEXP)?.groups ?? {};
        return new RegExp(regexp2, modifiers);
    },
    predicate (object) {
        return object instanceof RegExp;
    },
    represent (object) {
        return object.toString();
    }
});
const seq = new Type("tag:yaml.org,2002:seq", {
    construct (data) {
        return data !== null ? data : [];
    },
    kind: "sequence"
});
const { hasOwn: hasOwn1  } = Object;
function resolveYamlSet(data) {
    if (data === null) return true;
    for(const key in data){
        if (hasOwn1(data, key)) {
            if (data[key] !== null) return false;
        }
    }
    return true;
}
function constructYamlSet(data) {
    return data !== null ? data : {};
}
const set = new Type("tag:yaml.org,2002:set", {
    construct: constructYamlSet,
    kind: "mapping",
    resolve: resolveYamlSet
});
const str = new Type("tag:yaml.org,2002:str", {
    construct (data) {
        return data !== null ? data : "";
    },
    kind: "scalar"
});
const YAML_DATE_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])" + "-([0-9][0-9])" + "-([0-9][0-9])$");
const YAML_TIMESTAMP_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])" + "-([0-9][0-9]?)" + "-([0-9][0-9]?)" + "(?:[Tt]|[ \\t]+)" + "([0-9][0-9]?)" + ":([0-9][0-9])" + ":([0-9][0-9])" + "(?:\\.([0-9]*))?" + "(?:[ \\t]*(Z|([-+])([0-9][0-9]?)" + "(?::([0-9][0-9]))?))?$");
function resolveYamlTimestamp(data) {
    if (data === null) return false;
    if (YAML_DATE_REGEXP.exec(data) !== null) return true;
    if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
    return false;
}
function constructYamlTimestamp(data) {
    let match = YAML_DATE_REGEXP.exec(data);
    if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
    if (match === null) throw new Error("Date resolve error");
    const year = +match[1];
    const month = +match[2] - 1;
    const day = +match[3];
    if (!match[4]) {
        return new Date(Date.UTC(year, month, day));
    }
    const hour = +match[4];
    const minute = +match[5];
    const second = +match[6];
    let fraction = 0;
    if (match[7]) {
        let partFraction = match[7].slice(0, 3);
        while(partFraction.length < 3){
            partFraction += "0";
        }
        fraction = +partFraction;
    }
    let delta = null;
    if (match[9]) {
        const tzHour = +match[10];
        const tzMinute = +(match[11] || 0);
        delta = (tzHour * 60 + tzMinute) * 60000;
        if (match[9] === "-") delta = -delta;
    }
    const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
    if (delta) date.setTime(date.getTime() - delta);
    return date;
}
function representYamlTimestamp(date) {
    return date.toISOString();
}
const timestamp = new Type("tag:yaml.org,2002:timestamp", {
    construct: constructYamlTimestamp,
    instanceOf: Date,
    kind: "scalar",
    represent: representYamlTimestamp,
    resolve: resolveYamlTimestamp
});
const undefinedType = new Type("tag:yaml.org,2002:js/undefined", {
    kind: "scalar",
    resolve () {
        return true;
    },
    construct () {
        return undefined;
    },
    predicate (object) {
        return typeof object === "undefined";
    },
    represent () {
        return "";
    }
});
const failsafe = new Schema({
    explicit: [
        str,
        seq,
        map
    ]
});
const json = new Schema({
    implicit: [
        nil,
        bool,
        __int,
        __float
    ],
    include: [
        failsafe
    ]
});
const core = new Schema({
    include: [
        json
    ]
});
const def = new Schema({
    explicit: [
        binary,
        omap,
        pairs,
        set
    ],
    implicit: [
        timestamp,
        merge
    ],
    include: [
        core
    ]
});
new Schema({
    explicit: [
        regexp,
        undefinedType
    ],
    include: [
        def
    ]
});
class State1 {
    schema;
    constructor(schema = def){
        this.schema = schema;
    }
}
class LoaderState extends State1 {
    input;
    documents = [];
    length;
    lineIndent = 0;
    lineStart = 0;
    position = 0;
    line = 0;
    filename;
    onWarning;
    legacy;
    json;
    listener;
    implicitTypes;
    typeMap;
    version;
    checkLineBreaks;
    tagMap;
    anchorMap;
    tag;
    anchor;
    kind;
    result = "";
    constructor(input, { filename , schema , onWarning , legacy =false , json: json1 = false , listener =null  }){
        super(schema);
        this.input = input;
        this.filename = filename;
        this.onWarning = onWarning;
        this.legacy = legacy;
        this.json = json1;
        this.listener = listener;
        this.implicitTypes = this.schema.compiledImplicit;
        this.typeMap = this.schema.compiledTypeMap;
        this.length = input.length;
    }
}
const { hasOwn: hasOwn2  } = Object;
const CONTEXT_BLOCK_IN = 3;
const CONTEXT_BLOCK_OUT = 4;
const CHOMPING_STRIP = 2;
const CHOMPING_KEEP = 3;
const PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
const PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
const PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
const PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
const PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function _class(obj) {
    return Object.prototype.toString.call(obj);
}
function isEOL(c) {
    return c === 10 || c === 13;
}
function isWhiteSpace(c) {
    return c === 9 || c === 32;
}
function isWsOrEol(c) {
    return c === 9 || c === 32 || c === 10 || c === 13;
}
function isFlowIndicator(c) {
    return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
}
function fromHexCode(c) {
    if (48 <= c && c <= 57) {
        return c - 48;
    }
    const lc = c | 32;
    if (97 <= lc && lc <= 102) {
        return lc - 97 + 10;
    }
    return -1;
}
function escapedHexLen(c) {
    if (c === 120) {
        return 2;
    }
    if (c === 117) {
        return 4;
    }
    if (c === 85) {
        return 8;
    }
    return 0;
}
function fromDecimalCode(c) {
    if (48 <= c && c <= 57) {
        return c - 48;
    }
    return -1;
}
function simpleEscapeSequence(c) {
    return c === 48 ? "\x00" : c === 97 ? "\x07" : c === 98 ? "\x08" : c === 116 ? "\x09" : c === 9 ? "\x09" : c === 110 ? "\x0A" : c === 118 ? "\x0B" : c === 102 ? "\x0C" : c === 114 ? "\x0D" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? "\x22" : c === 47 ? "/" : c === 92 ? "\x5C" : c === 78 ? "\x85" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
}
function charFromCodepoint(c) {
    if (c <= 65535) {
        return String.fromCharCode(c);
    }
    return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
}
const simpleEscapeCheck = new Array(256);
const simpleEscapeMap = new Array(256);
for(let i = 0; i < 256; i++){
    simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
    simpleEscapeMap[i] = simpleEscapeSequence(i);
}
function generateError(state3, message) {
    return new YAMLError(message, new Mark(state3.filename, state3.input, state3.position, state3.line, state3.position - state3.lineStart));
}
function throwError(state4, message) {
    throw generateError(state4, message);
}
function throwWarning(state5, message) {
    if (state5.onWarning) {
        state5.onWarning.call(null, generateError(state5, message));
    }
}
const directiveHandlers = {
    YAML (state6, _name, ...args) {
        if (state6.version !== null) {
            return throwError(state6, "duplication of %YAML directive");
        }
        if (args.length !== 1) {
            return throwError(state6, "YAML directive accepts exactly one argument");
        }
        const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
        if (match === null) {
            return throwError(state6, "ill-formed argument of the YAML directive");
        }
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        if (major !== 1) {
            return throwError(state6, "unacceptable YAML version of the document");
        }
        state6.version = args[0];
        state6.checkLineBreaks = minor < 2;
        if (minor !== 1 && minor !== 2) {
            return throwWarning(state6, "unsupported YAML version of the document");
        }
    },
    TAG (state7, _name, ...args) {
        if (args.length !== 2) {
            return throwError(state7, "TAG directive accepts exactly two arguments");
        }
        const handle = args[0];
        const prefix = args[1];
        if (!PATTERN_TAG_HANDLE.test(handle)) {
            return throwError(state7, "ill-formed tag handle (first argument) of the TAG directive");
        }
        if (state7.tagMap && hasOwn2(state7.tagMap, handle)) {
            return throwError(state7, `there is a previously declared suffix for "${handle}" tag handle`);
        }
        if (!PATTERN_TAG_URI.test(prefix)) {
            return throwError(state7, "ill-formed tag prefix (second argument) of the TAG directive");
        }
        if (typeof state7.tagMap === "undefined") {
            state7.tagMap = {};
        }
        state7.tagMap[handle] = prefix;
    }
};
function captureSegment(state8, start, end, checkJson) {
    let result;
    if (start < end) {
        result = state8.input.slice(start, end);
        if (checkJson) {
            for(let position = 0, length = result.length; position < length; position++){
                const character = result.charCodeAt(position);
                if (!(character === 9 || 32 <= character && character <= 1114111)) {
                    return throwError(state8, "expected valid JSON character");
                }
            }
        } else if (PATTERN_NON_PRINTABLE.test(result)) {
            return throwError(state8, "the stream contains non-printable characters");
        }
        state8.result += result;
    }
}
function mergeMappings(state9, destination, source, overridableKeys) {
    if (!isObject(source)) {
        return throwError(state9, "cannot merge mappings; the provided source object is unacceptable");
    }
    const keys = Object.keys(source);
    for(let i1 = 0, len1 = keys.length; i1 < len1; i1++){
        const key = keys[i1];
        if (!hasOwn2(destination, key)) {
            destination[key] = source[key];
            overridableKeys[key] = true;
        }
    }
}
function storeMappingPair(state10, result, overridableKeys, keyTag, keyNode, valueNode, startLine, startPos) {
    if (Array.isArray(keyNode)) {
        keyNode = Array.prototype.slice.call(keyNode);
        for(let index = 0, quantity = keyNode.length; index < quantity; index++){
            if (Array.isArray(keyNode[index])) {
                return throwError(state10, "nested arrays are not supported inside keys");
            }
            if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
                keyNode[index] = "[object Object]";
            }
        }
    }
    if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
        keyNode = "[object Object]";
    }
    keyNode = String(keyNode);
    if (result === null) {
        result = {};
    }
    if (keyTag === "tag:yaml.org,2002:merge") {
        if (Array.isArray(valueNode)) {
            for(let index = 0, quantity = valueNode.length; index < quantity; index++){
                mergeMappings(state10, result, valueNode[index], overridableKeys);
            }
        } else {
            mergeMappings(state10, result, valueNode, overridableKeys);
        }
    } else {
        if (!state10.json && !hasOwn2(overridableKeys, keyNode) && hasOwn2(result, keyNode)) {
            state10.line = startLine || state10.line;
            state10.position = startPos || state10.position;
            return throwError(state10, "duplicated mapping key");
        }
        result[keyNode] = valueNode;
        delete overridableKeys[keyNode];
    }
    return result;
}
function readLineBreak(state11) {
    const ch = state11.input.charCodeAt(state11.position);
    if (ch === 10) {
        state11.position++;
    } else if (ch === 13) {
        state11.position++;
        if (state11.input.charCodeAt(state11.position) === 10) {
            state11.position++;
        }
    } else {
        return throwError(state11, "a line break is expected");
    }
    state11.line += 1;
    state11.lineStart = state11.position;
}
function skipSeparationSpace(state12, allowComments, checkIndent) {
    let lineBreaks = 0, ch = state12.input.charCodeAt(state12.position);
    while(ch !== 0){
        while(isWhiteSpace(ch)){
            ch = state12.input.charCodeAt(++state12.position);
        }
        if (allowComments && ch === 35) {
            do {
                ch = state12.input.charCodeAt(++state12.position);
            }while (ch !== 10 && ch !== 13 && ch !== 0)
        }
        if (isEOL(ch)) {
            readLineBreak(state12);
            ch = state12.input.charCodeAt(state12.position);
            lineBreaks++;
            state12.lineIndent = 0;
            while(ch === 32){
                state12.lineIndent++;
                ch = state12.input.charCodeAt(++state12.position);
            }
        } else {
            break;
        }
    }
    if (checkIndent !== -1 && lineBreaks !== 0 && state12.lineIndent < checkIndent) {
        throwWarning(state12, "deficient indentation");
    }
    return lineBreaks;
}
function testDocumentSeparator(state13) {
    let _position = state13.position;
    let ch = state13.input.charCodeAt(_position);
    if ((ch === 45 || ch === 46) && ch === state13.input.charCodeAt(_position + 1) && ch === state13.input.charCodeAt(_position + 2)) {
        _position += 3;
        ch = state13.input.charCodeAt(_position);
        if (ch === 0 || isWsOrEol(ch)) {
            return true;
        }
    }
    return false;
}
function writeFoldedLines(state14, count) {
    if (count === 1) {
        state14.result += " ";
    } else if (count > 1) {
        state14.result += repeat1("\n", count - 1);
    }
}
function readPlainScalar(state15, nodeIndent, withinFlowCollection) {
    const kind = state15.kind;
    const result = state15.result;
    let ch = state15.input.charCodeAt(state15.position);
    if (isWsOrEol(ch) || isFlowIndicator(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
        return false;
    }
    let following;
    if (ch === 63 || ch === 45) {
        following = state15.input.charCodeAt(state15.position + 1);
        if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
            return false;
        }
    }
    state15.kind = "scalar";
    state15.result = "";
    let captureEnd, captureStart = captureEnd = state15.position;
    let hasPendingContent = false;
    let line = 0;
    while(ch !== 0){
        if (ch === 58) {
            following = state15.input.charCodeAt(state15.position + 1);
            if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
                break;
            }
        } else if (ch === 35) {
            const preceding = state15.input.charCodeAt(state15.position - 1);
            if (isWsOrEol(preceding)) {
                break;
            }
        } else if (state15.position === state15.lineStart && testDocumentSeparator(state15) || withinFlowCollection && isFlowIndicator(ch)) {
            break;
        } else if (isEOL(ch)) {
            line = state15.line;
            const lineStart = state15.lineStart;
            const lineIndent = state15.lineIndent;
            skipSeparationSpace(state15, false, -1);
            if (state15.lineIndent >= nodeIndent) {
                hasPendingContent = true;
                ch = state15.input.charCodeAt(state15.position);
                continue;
            } else {
                state15.position = captureEnd;
                state15.line = line;
                state15.lineStart = lineStart;
                state15.lineIndent = lineIndent;
                break;
            }
        }
        if (hasPendingContent) {
            captureSegment(state15, captureStart, captureEnd, false);
            writeFoldedLines(state15, state15.line - line);
            captureStart = captureEnd = state15.position;
            hasPendingContent = false;
        }
        if (!isWhiteSpace(ch)) {
            captureEnd = state15.position + 1;
        }
        ch = state15.input.charCodeAt(++state15.position);
    }
    captureSegment(state15, captureStart, captureEnd, false);
    if (state15.result) {
        return true;
    }
    state15.kind = kind;
    state15.result = result;
    return false;
}
function readSingleQuotedScalar(state16, nodeIndent) {
    let ch, captureStart, captureEnd;
    ch = state16.input.charCodeAt(state16.position);
    if (ch !== 39) {
        return false;
    }
    state16.kind = "scalar";
    state16.result = "";
    state16.position++;
    captureStart = captureEnd = state16.position;
    while((ch = state16.input.charCodeAt(state16.position)) !== 0){
        if (ch === 39) {
            captureSegment(state16, captureStart, state16.position, true);
            ch = state16.input.charCodeAt(++state16.position);
            if (ch === 39) {
                captureStart = state16.position;
                state16.position++;
                captureEnd = state16.position;
            } else {
                return true;
            }
        } else if (isEOL(ch)) {
            captureSegment(state16, captureStart, captureEnd, true);
            writeFoldedLines(state16, skipSeparationSpace(state16, false, nodeIndent));
            captureStart = captureEnd = state16.position;
        } else if (state16.position === state16.lineStart && testDocumentSeparator(state16)) {
            return throwError(state16, "unexpected end of the document within a single quoted scalar");
        } else {
            state16.position++;
            captureEnd = state16.position;
        }
    }
    return throwError(state16, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar(state17, nodeIndent) {
    let ch = state17.input.charCodeAt(state17.position);
    if (ch !== 34) {
        return false;
    }
    state17.kind = "scalar";
    state17.result = "";
    state17.position++;
    let captureEnd, captureStart = captureEnd = state17.position;
    let tmp;
    while((ch = state17.input.charCodeAt(state17.position)) !== 0){
        if (ch === 34) {
            captureSegment(state17, captureStart, state17.position, true);
            state17.position++;
            return true;
        }
        if (ch === 92) {
            captureSegment(state17, captureStart, state17.position, true);
            ch = state17.input.charCodeAt(++state17.position);
            if (isEOL(ch)) {
                skipSeparationSpace(state17, false, nodeIndent);
            } else if (ch < 256 && simpleEscapeCheck[ch]) {
                state17.result += simpleEscapeMap[ch];
                state17.position++;
            } else if ((tmp = escapedHexLen(ch)) > 0) {
                let hexLength = tmp;
                let hexResult = 0;
                for(; hexLength > 0; hexLength--){
                    ch = state17.input.charCodeAt(++state17.position);
                    if ((tmp = fromHexCode(ch)) >= 0) {
                        hexResult = (hexResult << 4) + tmp;
                    } else {
                        return throwError(state17, "expected hexadecimal character");
                    }
                }
                state17.result += charFromCodepoint(hexResult);
                state17.position++;
            } else {
                return throwError(state17, "unknown escape sequence");
            }
            captureStart = captureEnd = state17.position;
        } else if (isEOL(ch)) {
            captureSegment(state17, captureStart, captureEnd, true);
            writeFoldedLines(state17, skipSeparationSpace(state17, false, nodeIndent));
            captureStart = captureEnd = state17.position;
        } else if (state17.position === state17.lineStart && testDocumentSeparator(state17)) {
            return throwError(state17, "unexpected end of the document within a double quoted scalar");
        } else {
            state17.position++;
            captureEnd = state17.position;
        }
    }
    return throwError(state17, "unexpected end of the stream within a double quoted scalar");
}
function readFlowCollection(state18, nodeIndent) {
    let ch = state18.input.charCodeAt(state18.position);
    let terminator;
    let isMapping = true;
    let result = {};
    if (ch === 91) {
        terminator = 93;
        isMapping = false;
        result = [];
    } else if (ch === 123) {
        terminator = 125;
    } else {
        return false;
    }
    if (state18.anchor !== null && typeof state18.anchor != "undefined" && typeof state18.anchorMap != "undefined") {
        state18.anchorMap[state18.anchor] = result;
    }
    ch = state18.input.charCodeAt(++state18.position);
    const tag = state18.tag, anchor = state18.anchor;
    let readNext = true;
    let valueNode, keyNode, keyTag = keyNode = valueNode = null, isExplicitPair, isPair = isExplicitPair = false;
    let following = 0, line = 0;
    const overridableKeys = {};
    while(ch !== 0){
        skipSeparationSpace(state18, true, nodeIndent);
        ch = state18.input.charCodeAt(state18.position);
        if (ch === terminator) {
            state18.position++;
            state18.tag = tag;
            state18.anchor = anchor;
            state18.kind = isMapping ? "mapping" : "sequence";
            state18.result = result;
            return true;
        }
        if (!readNext) {
            return throwError(state18, "missed comma between flow collection entries");
        }
        keyTag = keyNode = valueNode = null;
        isPair = isExplicitPair = false;
        if (ch === 63) {
            following = state18.input.charCodeAt(state18.position + 1);
            if (isWsOrEol(following)) {
                isPair = isExplicitPair = true;
                state18.position++;
                skipSeparationSpace(state18, true, nodeIndent);
            }
        }
        line = state18.line;
        composeNode(state18, nodeIndent, 1, false, true);
        keyTag = state18.tag || null;
        keyNode = state18.result;
        skipSeparationSpace(state18, true, nodeIndent);
        ch = state18.input.charCodeAt(state18.position);
        if ((isExplicitPair || state18.line === line) && ch === 58) {
            isPair = true;
            ch = state18.input.charCodeAt(++state18.position);
            skipSeparationSpace(state18, true, nodeIndent);
            composeNode(state18, nodeIndent, 1, false, true);
            valueNode = state18.result;
        }
        if (isMapping) {
            storeMappingPair(state18, result, overridableKeys, keyTag, keyNode, valueNode);
        } else if (isPair) {
            result.push(storeMappingPair(state18, null, overridableKeys, keyTag, keyNode, valueNode));
        } else {
            result.push(keyNode);
        }
        skipSeparationSpace(state18, true, nodeIndent);
        ch = state18.input.charCodeAt(state18.position);
        if (ch === 44) {
            readNext = true;
            ch = state18.input.charCodeAt(++state18.position);
        } else {
            readNext = false;
        }
    }
    return throwError(state18, "unexpected end of the stream within a flow collection");
}
function readBlockScalar(state19, nodeIndent) {
    let chomping = 1, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false;
    let ch = state19.input.charCodeAt(state19.position);
    let folding = false;
    if (ch === 124) {
        folding = false;
    } else if (ch === 62) {
        folding = true;
    } else {
        return false;
    }
    state19.kind = "scalar";
    state19.result = "";
    let tmp = 0;
    while(ch !== 0){
        ch = state19.input.charCodeAt(++state19.position);
        if (ch === 43 || ch === 45) {
            if (1 === chomping) {
                chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
            } else {
                return throwError(state19, "repeat of a chomping mode identifier");
            }
        } else if ((tmp = fromDecimalCode(ch)) >= 0) {
            if (tmp === 0) {
                return throwError(state19, "bad explicit indentation width of a block scalar; it cannot be less than one");
            } else if (!detectedIndent) {
                textIndent = nodeIndent + tmp - 1;
                detectedIndent = true;
            } else {
                return throwError(state19, "repeat of an indentation width identifier");
            }
        } else {
            break;
        }
    }
    if (isWhiteSpace(ch)) {
        do {
            ch = state19.input.charCodeAt(++state19.position);
        }while (isWhiteSpace(ch))
        if (ch === 35) {
            do {
                ch = state19.input.charCodeAt(++state19.position);
            }while (!isEOL(ch) && ch !== 0)
        }
    }
    while(ch !== 0){
        readLineBreak(state19);
        state19.lineIndent = 0;
        ch = state19.input.charCodeAt(state19.position);
        while((!detectedIndent || state19.lineIndent < textIndent) && ch === 32){
            state19.lineIndent++;
            ch = state19.input.charCodeAt(++state19.position);
        }
        if (!detectedIndent && state19.lineIndent > textIndent) {
            textIndent = state19.lineIndent;
        }
        if (isEOL(ch)) {
            emptyLines++;
            continue;
        }
        if (state19.lineIndent < textIndent) {
            if (chomping === 3) {
                state19.result += repeat1("\n", didReadContent ? 1 + emptyLines : emptyLines);
            } else if (chomping === 1) {
                if (didReadContent) {
                    state19.result += "\n";
                }
            }
            break;
        }
        if (folding) {
            if (isWhiteSpace(ch)) {
                atMoreIndented = true;
                state19.result += repeat1("\n", didReadContent ? 1 + emptyLines : emptyLines);
            } else if (atMoreIndented) {
                atMoreIndented = false;
                state19.result += repeat1("\n", emptyLines + 1);
            } else if (emptyLines === 0) {
                if (didReadContent) {
                    state19.result += " ";
                }
            } else {
                state19.result += repeat1("\n", emptyLines);
            }
        } else {
            state19.result += repeat1("\n", didReadContent ? 1 + emptyLines : emptyLines);
        }
        didReadContent = true;
        detectedIndent = true;
        emptyLines = 0;
        const captureStart = state19.position;
        while(!isEOL(ch) && ch !== 0){
            ch = state19.input.charCodeAt(++state19.position);
        }
        captureSegment(state19, captureStart, state19.position, false);
    }
    return true;
}
function readBlockSequence(state20, nodeIndent) {
    let line, following, detected = false, ch;
    const tag = state20.tag, anchor = state20.anchor, result = [];
    if (state20.anchor !== null && typeof state20.anchor !== "undefined" && typeof state20.anchorMap !== "undefined") {
        state20.anchorMap[state20.anchor] = result;
    }
    ch = state20.input.charCodeAt(state20.position);
    while(ch !== 0){
        if (ch !== 45) {
            break;
        }
        following = state20.input.charCodeAt(state20.position + 1);
        if (!isWsOrEol(following)) {
            break;
        }
        detected = true;
        state20.position++;
        if (skipSeparationSpace(state20, true, -1)) {
            if (state20.lineIndent <= nodeIndent) {
                result.push(null);
                ch = state20.input.charCodeAt(state20.position);
                continue;
            }
        }
        line = state20.line;
        composeNode(state20, nodeIndent, 3, false, true);
        result.push(state20.result);
        skipSeparationSpace(state20, true, -1);
        ch = state20.input.charCodeAt(state20.position);
        if ((state20.line === line || state20.lineIndent > nodeIndent) && ch !== 0) {
            return throwError(state20, "bad indentation of a sequence entry");
        } else if (state20.lineIndent < nodeIndent) {
            break;
        }
    }
    if (detected) {
        state20.tag = tag;
        state20.anchor = anchor;
        state20.kind = "sequence";
        state20.result = result;
        return true;
    }
    return false;
}
function readBlockMapping(state21, nodeIndent, flowIndent) {
    const tag = state21.tag, anchor = state21.anchor, result = {}, overridableKeys = {};
    let following, allowCompact = false, line, pos, keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
    if (state21.anchor !== null && typeof state21.anchor !== "undefined" && typeof state21.anchorMap !== "undefined") {
        state21.anchorMap[state21.anchor] = result;
    }
    ch = state21.input.charCodeAt(state21.position);
    while(ch !== 0){
        following = state21.input.charCodeAt(state21.position + 1);
        line = state21.line;
        pos = state21.position;
        if ((ch === 63 || ch === 58) && isWsOrEol(following)) {
            if (ch === 63) {
                if (atExplicitKey) {
                    storeMappingPair(state21, result, overridableKeys, keyTag, keyNode, null);
                    keyTag = keyNode = valueNode = null;
                }
                detected = true;
                atExplicitKey = true;
                allowCompact = true;
            } else if (atExplicitKey) {
                atExplicitKey = false;
                allowCompact = true;
            } else {
                return throwError(state21, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
            }
            state21.position += 1;
            ch = following;
        } else if (composeNode(state21, flowIndent, 2, false, true)) {
            if (state21.line === line) {
                ch = state21.input.charCodeAt(state21.position);
                while(isWhiteSpace(ch)){
                    ch = state21.input.charCodeAt(++state21.position);
                }
                if (ch === 58) {
                    ch = state21.input.charCodeAt(++state21.position);
                    if (!isWsOrEol(ch)) {
                        return throwError(state21, "a whitespace character is expected after the key-value separator within a block mapping");
                    }
                    if (atExplicitKey) {
                        storeMappingPair(state21, result, overridableKeys, keyTag, keyNode, null);
                        keyTag = keyNode = valueNode = null;
                    }
                    detected = true;
                    atExplicitKey = false;
                    allowCompact = false;
                    keyTag = state21.tag;
                    keyNode = state21.result;
                } else if (detected) {
                    return throwError(state21, "can not read an implicit mapping pair; a colon is missed");
                } else {
                    state21.tag = tag;
                    state21.anchor = anchor;
                    return true;
                }
            } else if (detected) {
                return throwError(state21, "can not read a block mapping entry; a multiline key may not be an implicit key");
            } else {
                state21.tag = tag;
                state21.anchor = anchor;
                return true;
            }
        } else {
            break;
        }
        if (state21.line === line || state21.lineIndent > nodeIndent) {
            if (composeNode(state21, nodeIndent, 4, true, allowCompact)) {
                if (atExplicitKey) {
                    keyNode = state21.result;
                } else {
                    valueNode = state21.result;
                }
            }
            if (!atExplicitKey) {
                storeMappingPair(state21, result, overridableKeys, keyTag, keyNode, valueNode, line, pos);
                keyTag = keyNode = valueNode = null;
            }
            skipSeparationSpace(state21, true, -1);
            ch = state21.input.charCodeAt(state21.position);
        }
        if (state21.lineIndent > nodeIndent && ch !== 0) {
            return throwError(state21, "bad indentation of a mapping entry");
        } else if (state21.lineIndent < nodeIndent) {
            break;
        }
    }
    if (atExplicitKey) {
        storeMappingPair(state21, result, overridableKeys, keyTag, keyNode, null);
    }
    if (detected) {
        state21.tag = tag;
        state21.anchor = anchor;
        state21.kind = "mapping";
        state21.result = result;
    }
    return detected;
}
function readTagProperty(state22) {
    let position, isVerbatim = false, isNamed = false, tagHandle = "", tagName, ch;
    ch = state22.input.charCodeAt(state22.position);
    if (ch !== 33) return false;
    if (state22.tag !== null) {
        return throwError(state22, "duplication of a tag property");
    }
    ch = state22.input.charCodeAt(++state22.position);
    if (ch === 60) {
        isVerbatim = true;
        ch = state22.input.charCodeAt(++state22.position);
    } else if (ch === 33) {
        isNamed = true;
        tagHandle = "!!";
        ch = state22.input.charCodeAt(++state22.position);
    } else {
        tagHandle = "!";
    }
    position = state22.position;
    if (isVerbatim) {
        do {
            ch = state22.input.charCodeAt(++state22.position);
        }while (ch !== 0 && ch !== 62)
        if (state22.position < state22.length) {
            tagName = state22.input.slice(position, state22.position);
            ch = state22.input.charCodeAt(++state22.position);
        } else {
            return throwError(state22, "unexpected end of the stream within a verbatim tag");
        }
    } else {
        while(ch !== 0 && !isWsOrEol(ch)){
            if (ch === 33) {
                if (!isNamed) {
                    tagHandle = state22.input.slice(position - 1, state22.position + 1);
                    if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
                        return throwError(state22, "named tag handle cannot contain such characters");
                    }
                    isNamed = true;
                    position = state22.position + 1;
                } else {
                    return throwError(state22, "tag suffix cannot contain exclamation marks");
                }
            }
            ch = state22.input.charCodeAt(++state22.position);
        }
        tagName = state22.input.slice(position, state22.position);
        if (PATTERN_FLOW_INDICATORS.test(tagName)) {
            return throwError(state22, "tag suffix cannot contain flow indicator characters");
        }
    }
    if (tagName && !PATTERN_TAG_URI.test(tagName)) {
        return throwError(state22, `tag name cannot contain such characters: ${tagName}`);
    }
    if (isVerbatim) {
        state22.tag = tagName;
    } else if (typeof state22.tagMap !== "undefined" && hasOwn2(state22.tagMap, tagHandle)) {
        state22.tag = state22.tagMap[tagHandle] + tagName;
    } else if (tagHandle === "!") {
        state22.tag = `!${tagName}`;
    } else if (tagHandle === "!!") {
        state22.tag = `tag:yaml.org,2002:${tagName}`;
    } else {
        return throwError(state22, `undeclared tag handle "${tagHandle}"`);
    }
    return true;
}
function readAnchorProperty(state23) {
    let ch = state23.input.charCodeAt(state23.position);
    if (ch !== 38) return false;
    if (state23.anchor !== null) {
        return throwError(state23, "duplication of an anchor property");
    }
    ch = state23.input.charCodeAt(++state23.position);
    const position = state23.position;
    while(ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)){
        ch = state23.input.charCodeAt(++state23.position);
    }
    if (state23.position === position) {
        return throwError(state23, "name of an anchor node must contain at least one character");
    }
    state23.anchor = state23.input.slice(position, state23.position);
    return true;
}
function readAlias(state24) {
    let ch = state24.input.charCodeAt(state24.position);
    if (ch !== 42) return false;
    ch = state24.input.charCodeAt(++state24.position);
    const _position = state24.position;
    while(ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)){
        ch = state24.input.charCodeAt(++state24.position);
    }
    if (state24.position === _position) {
        return throwError(state24, "name of an alias node must contain at least one character");
    }
    const alias = state24.input.slice(_position, state24.position);
    if (typeof state24.anchorMap !== "undefined" && !hasOwn2(state24.anchorMap, alias)) {
        return throwError(state24, `unidentified alias "${alias}"`);
    }
    if (typeof state24.anchorMap !== "undefined") {
        state24.result = state24.anchorMap[alias];
    }
    skipSeparationSpace(state24, true, -1);
    return true;
}
function composeNode(state25, parentIndent, nodeContext, allowToSeek, allowCompact) {
    let allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, type, flowIndent, blockIndent;
    if (state25.listener && state25.listener !== null) {
        state25.listener("open", state25);
    }
    state25.tag = null;
    state25.anchor = null;
    state25.kind = null;
    state25.result = null;
    const allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
    if (allowToSeek) {
        if (skipSeparationSpace(state25, true, -1)) {
            atNewLine = true;
            if (state25.lineIndent > parentIndent) {
                indentStatus = 1;
            } else if (state25.lineIndent === parentIndent) {
                indentStatus = 0;
            } else if (state25.lineIndent < parentIndent) {
                indentStatus = -1;
            }
        }
    }
    if (indentStatus === 1) {
        while(readTagProperty(state25) || readAnchorProperty(state25)){
            if (skipSeparationSpace(state25, true, -1)) {
                atNewLine = true;
                allowBlockCollections = allowBlockStyles;
                if (state25.lineIndent > parentIndent) {
                    indentStatus = 1;
                } else if (state25.lineIndent === parentIndent) {
                    indentStatus = 0;
                } else if (state25.lineIndent < parentIndent) {
                    indentStatus = -1;
                }
            } else {
                allowBlockCollections = false;
            }
        }
    }
    if (allowBlockCollections) {
        allowBlockCollections = atNewLine || allowCompact;
    }
    if (indentStatus === 1 || 4 === nodeContext) {
        const cond = 1 === nodeContext || 2 === nodeContext;
        flowIndent = cond ? parentIndent : parentIndent + 1;
        blockIndent = state25.position - state25.lineStart;
        if (indentStatus === 1) {
            if (allowBlockCollections && (readBlockSequence(state25, blockIndent) || readBlockMapping(state25, blockIndent, flowIndent)) || readFlowCollection(state25, flowIndent)) {
                hasContent = true;
            } else {
                if (allowBlockScalars && readBlockScalar(state25, flowIndent) || readSingleQuotedScalar(state25, flowIndent) || readDoubleQuotedScalar(state25, flowIndent)) {
                    hasContent = true;
                } else if (readAlias(state25)) {
                    hasContent = true;
                    if (state25.tag !== null || state25.anchor !== null) {
                        return throwError(state25, "alias node should not have Any properties");
                    }
                } else if (readPlainScalar(state25, flowIndent, 1 === nodeContext)) {
                    hasContent = true;
                    if (state25.tag === null) {
                        state25.tag = "?";
                    }
                }
                if (state25.anchor !== null && typeof state25.anchorMap !== "undefined") {
                    state25.anchorMap[state25.anchor] = state25.result;
                }
            }
        } else if (indentStatus === 0) {
            hasContent = allowBlockCollections && readBlockSequence(state25, blockIndent);
        }
    }
    if (state25.tag !== null && state25.tag !== "!") {
        if (state25.tag === "?") {
            for(let typeIndex = 0, typeQuantity = state25.implicitTypes.length; typeIndex < typeQuantity; typeIndex++){
                type = state25.implicitTypes[typeIndex];
                if (type.resolve(state25.result)) {
                    state25.result = type.construct(state25.result);
                    state25.tag = type.tag;
                    if (state25.anchor !== null && typeof state25.anchorMap !== "undefined") {
                        state25.anchorMap[state25.anchor] = state25.result;
                    }
                    break;
                }
            }
        } else if (hasOwn2(state25.typeMap[state25.kind || "fallback"], state25.tag)) {
            type = state25.typeMap[state25.kind || "fallback"][state25.tag];
            if (state25.result !== null && type.kind !== state25.kind) {
                return throwError(state25, `unacceptable node kind for !<${state25.tag}> tag; it should be "${type.kind}", not "${state25.kind}"`);
            }
            if (!type.resolve(state25.result)) {
                return throwError(state25, `cannot resolve a node with !<${state25.tag}> explicit tag`);
            } else {
                state25.result = type.construct(state25.result);
                if (state25.anchor !== null && typeof state25.anchorMap !== "undefined") {
                    state25.anchorMap[state25.anchor] = state25.result;
                }
            }
        } else {
            return throwError(state25, `unknown tag !<${state25.tag}>`);
        }
    }
    if (state25.listener && state25.listener !== null) {
        state25.listener("close", state25);
    }
    return state25.tag !== null || state25.anchor !== null || hasContent;
}
function readDocument(state26) {
    const documentStart = state26.position;
    let position, directiveName, directiveArgs, hasDirectives = false, ch;
    state26.version = null;
    state26.checkLineBreaks = state26.legacy;
    state26.tagMap = {};
    state26.anchorMap = {};
    while((ch = state26.input.charCodeAt(state26.position)) !== 0){
        skipSeparationSpace(state26, true, -1);
        ch = state26.input.charCodeAt(state26.position);
        if (state26.lineIndent > 0 || ch !== 37) {
            break;
        }
        hasDirectives = true;
        ch = state26.input.charCodeAt(++state26.position);
        position = state26.position;
        while(ch !== 0 && !isWsOrEol(ch)){
            ch = state26.input.charCodeAt(++state26.position);
        }
        directiveName = state26.input.slice(position, state26.position);
        directiveArgs = [];
        if (directiveName.length < 1) {
            return throwError(state26, "directive name must not be less than one character in length");
        }
        while(ch !== 0){
            while(isWhiteSpace(ch)){
                ch = state26.input.charCodeAt(++state26.position);
            }
            if (ch === 35) {
                do {
                    ch = state26.input.charCodeAt(++state26.position);
                }while (ch !== 0 && !isEOL(ch))
                break;
            }
            if (isEOL(ch)) break;
            position = state26.position;
            while(ch !== 0 && !isWsOrEol(ch)){
                ch = state26.input.charCodeAt(++state26.position);
            }
            directiveArgs.push(state26.input.slice(position, state26.position));
        }
        if (ch !== 0) readLineBreak(state26);
        if (hasOwn2(directiveHandlers, directiveName)) {
            directiveHandlers[directiveName](state26, directiveName, ...directiveArgs);
        } else {
            throwWarning(state26, `unknown document directive "${directiveName}"`);
        }
    }
    skipSeparationSpace(state26, true, -1);
    if (state26.lineIndent === 0 && state26.input.charCodeAt(state26.position) === 45 && state26.input.charCodeAt(state26.position + 1) === 45 && state26.input.charCodeAt(state26.position + 2) === 45) {
        state26.position += 3;
        skipSeparationSpace(state26, true, -1);
    } else if (hasDirectives) {
        return throwError(state26, "directives end mark is expected");
    }
    composeNode(state26, state26.lineIndent - 1, 4, false, true);
    skipSeparationSpace(state26, true, -1);
    if (state26.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state26.input.slice(documentStart, state26.position))) {
        throwWarning(state26, "non-ASCII line breaks are interpreted as content");
    }
    state26.documents.push(state26.result);
    if (state26.position === state26.lineStart && testDocumentSeparator(state26)) {
        if (state26.input.charCodeAt(state26.position) === 46) {
            state26.position += 3;
            skipSeparationSpace(state26, true, -1);
        }
        return;
    }
    if (state26.position < state26.length - 1) {
        return throwError(state26, "end of the stream or a document separator is expected");
    } else {
        return;
    }
}
function loadDocuments(input, options) {
    input = String(input);
    options = options || {};
    if (input.length !== 0) {
        if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
            input += "\n";
        }
        if (input.charCodeAt(0) === 65279) {
            input = input.slice(1);
        }
    }
    const state27 = new LoaderState(input, options);
    state27.input += "\0";
    while(state27.input.charCodeAt(state27.position) === 32){
        state27.lineIndent += 1;
        state27.position += 1;
    }
    while(state27.position < state27.length - 1){
        readDocument(state27);
    }
    return state27.documents;
}
function load(input, options) {
    const documents = loadDocuments(input, options);
    if (documents.length === 0) {
        return;
    }
    if (documents.length === 1) {
        return documents[0];
    }
    throw new YAMLError("expected a single document in the stream, but found more");
}
function parse6(content, options) {
    return load(content, options);
}
const { hasOwn: hasOwn3  } = Object;
const _toString2 = Object.prototype.toString;
const { hasOwn: hasOwn4  } = Object;
const ESCAPE_SEQUENCES = {};
ESCAPE_SEQUENCES[0] = "\\0";
ESCAPE_SEQUENCES[7] = "\\a";
ESCAPE_SEQUENCES[8] = "\\b";
ESCAPE_SEQUENCES[9] = "\\t";
ESCAPE_SEQUENCES[10] = "\\n";
ESCAPE_SEQUENCES[11] = "\\v";
ESCAPE_SEQUENCES[12] = "\\f";
ESCAPE_SEQUENCES[13] = "\\r";
ESCAPE_SEQUENCES[27] = "\\e";
ESCAPE_SEQUENCES[34] = '\\"';
ESCAPE_SEQUENCES[92] = "\\\\";
ESCAPE_SEQUENCES[133] = "\\N";
ESCAPE_SEQUENCES[160] = "\\_";
ESCAPE_SEQUENCES[8232] = "\\L";
ESCAPE_SEQUENCES[8233] = "\\P";
const DEPRECATED_BOOLEANS_SYNTAX = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF", 
];
function encodeHex(character) {
    const string = character.toString(16).toUpperCase();
    let handle;
    let length;
    if (character <= 255) {
        handle = "x";
        length = 2;
    } else if (character <= 65535) {
        handle = "u";
        length = 4;
    } else if (character <= 4294967295) {
        handle = "U";
        length = 8;
    } else {
        throw new YAMLError("code point within a string may not be greater than 0xFFFFFFFF");
    }
    return `\\${handle}${repeat1("0", length - string.length)}${string}`;
}
function indentString(string, spaces) {
    const ind = repeat1(" ", spaces), length = string.length;
    let position = 0, next = -1, result = "", line;
    while(position < length){
        next = string.indexOf("\n", position);
        if (next === -1) {
            line = string.slice(position);
            position = length;
        } else {
            line = string.slice(position, next + 1);
            position = next + 1;
        }
        if (line.length && line !== "\n") result += ind;
        result += line;
    }
    return result;
}
function generateNextLine(state28, level) {
    return `\n${repeat1(" ", state28.indent * level)}`;
}
function testImplicitResolving(state29, str38) {
    let type;
    for(let index = 0, length = state29.implicitTypes.length; index < length; index += 1){
        type = state29.implicitTypes[index];
        if (type.resolve(str38)) {
            return true;
        }
    }
    return false;
}
function isWhitespace(c) {
    return c === 32 || c === 9;
}
function isPrintable(c) {
    return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== 65279 || 65536 <= c && c <= 1114111;
}
function isPlainSafe(c) {
    return isPrintable(c) && c !== 65279 && c !== 44 && c !== 91 && c !== 93 && c !== 123 && c !== 125 && c !== 58 && c !== 35;
}
function isPlainSafeFirst(c) {
    return isPrintable(c) && c !== 65279 && !isWhitespace(c) && c !== 45 && c !== 63 && c !== 58 && c !== 44 && c !== 91 && c !== 93 && c !== 123 && c !== 125 && c !== 35 && c !== 38 && c !== 42 && c !== 33 && c !== 124 && c !== 62 && c !== 39 && c !== 34 && c !== 37 && c !== 64 && c !== 96;
}
function needIndentIndicator(string) {
    const leadingSpaceRe = /^\n* /;
    return leadingSpaceRe.test(string);
}
const STYLE_PLAIN = 1, STYLE_SINGLE = 2, STYLE_LITERAL = 3, STYLE_FOLDED = 4, STYLE_DOUBLE = 5;
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType) {
    const shouldTrackWidth = lineWidth !== -1;
    let hasLineBreak = false, hasFoldableLine = false, previousLineBreak = -1, plain = isPlainSafeFirst(string.charCodeAt(0)) && !isWhitespace(string.charCodeAt(string.length - 1));
    let __char, i72;
    if (singleLineOnly) {
        for(i72 = 0; i72 < string.length; i72++){
            __char = string.charCodeAt(i72);
            if (!isPrintable(__char)) {
                return 5;
            }
            plain = plain && isPlainSafe(__char);
        }
    } else {
        for(i72 = 0; i72 < string.length; i72++){
            __char = string.charCodeAt(i72);
            if (__char === 10) {
                hasLineBreak = true;
                if (shouldTrackWidth) {
                    hasFoldableLine = hasFoldableLine || i72 - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
                    previousLineBreak = i72;
                }
            } else if (!isPrintable(__char)) {
                return 5;
            }
            plain = plain && isPlainSafe(__char);
        }
        hasFoldableLine = hasFoldableLine || shouldTrackWidth && i72 - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
    }
    if (!hasLineBreak && !hasFoldableLine) {
        return plain && !testAmbiguousType(string) ? 1 : 2;
    }
    if (indentPerLevel > 9 && needIndentIndicator(string)) {
        return 5;
    }
    return hasFoldableLine ? 4 : 3;
}
function foldLine(line, width) {
    if (line === "" || line[0] === " ") return line;
    const breakRe = / [^ ]/g;
    let match;
    let start = 0, end, curr = 0, next = 0;
    let result = "";
    while(match = breakRe.exec(line)){
        next = match.index;
        if (next - start > width) {
            end = curr > start ? curr : next;
            result += `\n${line.slice(start, end)}`;
            start = end + 1;
        }
        curr = next;
    }
    result += "\n";
    if (line.length - start > width && curr > start) {
        result += `${line.slice(start, curr)}\n${line.slice(curr + 1)}`;
    } else {
        result += line.slice(start);
    }
    return result.slice(1);
}
function dropEndingNewline(string) {
    return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
}
function foldString(string, width) {
    const lineRe = /(\n+)([^\n]*)/g;
    let result = (()=>{
        let nextLF = string.indexOf("\n");
        nextLF = nextLF !== -1 ? nextLF : string.length;
        lineRe.lastIndex = nextLF;
        return foldLine(string.slice(0, nextLF), width);
    })();
    let prevMoreIndented = string[0] === "\n" || string[0] === " ";
    let moreIndented;
    let match;
    while(match = lineRe.exec(string)){
        const prefix = match[1], line = match[2];
        moreIndented = line[0] === " ";
        result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
        prevMoreIndented = moreIndented;
    }
    return result;
}
function escapeString(string) {
    let result = "";
    let __char, nextChar;
    let escapeSeq;
    for(let i73 = 0; i73 < string.length; i73++){
        __char = string.charCodeAt(i73);
        if (__char >= 55296 && __char <= 56319) {
            nextChar = string.charCodeAt(i73 + 1);
            if (nextChar >= 56320 && nextChar <= 57343) {
                result += encodeHex((__char - 55296) * 1024 + nextChar - 56320 + 65536);
                i73++;
                continue;
            }
        }
        escapeSeq = ESCAPE_SEQUENCES[__char];
        result += !escapeSeq && isPrintable(__char) ? string[i73] : escapeSeq || encodeHex(__char);
    }
    return result;
}
function blockHeader(string, indentPerLevel) {
    const indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
    const clip = string[string.length - 1] === "\n";
    const keep = clip && (string[string.length - 2] === "\n" || string === "\n");
    const chomp = keep ? "+" : clip ? "" : "-";
    return `${indentIndicator}${chomp}\n`;
}
function writeScalar(state30, string, level, iskey) {
    state30.dump = (()=>{
        if (string.length === 0) {
            return "''";
        }
        if (!state30.noCompatMode && DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1) {
            return `'${string}'`;
        }
        const indent = state30.indent * Math.max(1, level);
        const lineWidth = state30.lineWidth === -1 ? -1 : Math.max(Math.min(state30.lineWidth, 40), state30.lineWidth - indent);
        const singleLineOnly = iskey || state30.flowLevel > -1 && level >= state30.flowLevel;
        function testAmbiguity(str39) {
            return testImplicitResolving(state30, str39);
        }
        switch(chooseScalarStyle(string, singleLineOnly, state30.indent, lineWidth, testAmbiguity)){
            case STYLE_PLAIN:
                return string;
            case STYLE_SINGLE:
                return `'${string.replace(/'/g, "''")}'`;
            case STYLE_LITERAL:
                return `|${blockHeader(string, state30.indent)}${dropEndingNewline(indentString(string, indent))}`;
            case STYLE_FOLDED:
                return `>${blockHeader(string, state30.indent)}${dropEndingNewline(indentString(foldString(string, lineWidth), indent))}`;
            case STYLE_DOUBLE:
                return `"${escapeString(string)}"`;
            default:
                throw new YAMLError("impossible error: invalid scalar style");
        }
    })();
}
function writeFlowSequence(state31, level, object) {
    let _result = "";
    const _tag = state31.tag;
    for(let index = 0, length = object.length; index < length; index += 1){
        if (writeNode(state31, level, object[index], false, false)) {
            if (index !== 0) _result += `,${!state31.condenseFlow ? " " : ""}`;
            _result += state31.dump;
        }
    }
    state31.tag = _tag;
    state31.dump = `[${_result}]`;
}
function writeBlockSequence(state32, level, object, compact = false) {
    let _result = "";
    const _tag = state32.tag;
    for(let index = 0, length = object.length; index < length; index += 1){
        if (writeNode(state32, level + 1, object[index], true, true)) {
            if (!compact || index !== 0) {
                _result += generateNextLine(state32, level);
            }
            if (state32.dump && 10 === state32.dump.charCodeAt(0)) {
                _result += "-";
            } else {
                _result += "- ";
            }
            _result += state32.dump;
        }
    }
    state32.tag = _tag;
    state32.dump = _result || "[]";
}
function writeFlowMapping(state33, level, object) {
    let _result = "";
    const _tag = state33.tag, objectKeyList = Object.keys(object);
    let pairBuffer, objectKey, objectValue;
    for(let index = 0, length = objectKeyList.length; index < length; index += 1){
        pairBuffer = state33.condenseFlow ? '"' : "";
        if (index !== 0) pairBuffer += ", ";
        objectKey = objectKeyList[index];
        objectValue = object[objectKey];
        if (!writeNode(state33, level, objectKey, false, false)) {
            continue;
        }
        if (state33.dump.length > 1024) pairBuffer += "? ";
        pairBuffer += `${state33.dump}${state33.condenseFlow ? '"' : ""}:${state33.condenseFlow ? "" : " "}`;
        if (!writeNode(state33, level, objectValue, false, false)) {
            continue;
        }
        pairBuffer += state33.dump;
        _result += pairBuffer;
    }
    state33.tag = _tag;
    state33.dump = `{${_result}}`;
}
function writeBlockMapping(state34, level, object, compact = false) {
    const _tag = state34.tag, objectKeyList = Object.keys(object);
    let _result = "";
    if (state34.sortKeys === true) {
        objectKeyList.sort();
    } else if (typeof state34.sortKeys === "function") {
        objectKeyList.sort(state34.sortKeys);
    } else if (state34.sortKeys) {
        throw new YAMLError("sortKeys must be a boolean or a function");
    }
    let pairBuffer = "", objectKey, objectValue, explicitPair;
    for(let index = 0, length = objectKeyList.length; index < length; index += 1){
        pairBuffer = "";
        if (!compact || index !== 0) {
            pairBuffer += generateNextLine(state34, level);
        }
        objectKey = objectKeyList[index];
        objectValue = object[objectKey];
        if (!writeNode(state34, level + 1, objectKey, true, true, true)) {
            continue;
        }
        explicitPair = state34.tag !== null && state34.tag !== "?" || state34.dump && state34.dump.length > 1024;
        if (explicitPair) {
            if (state34.dump && 10 === state34.dump.charCodeAt(0)) {
                pairBuffer += "?";
            } else {
                pairBuffer += "? ";
            }
        }
        pairBuffer += state34.dump;
        if (explicitPair) {
            pairBuffer += generateNextLine(state34, level);
        }
        if (!writeNode(state34, level + 1, objectValue, true, explicitPair)) {
            continue;
        }
        if (state34.dump && 10 === state34.dump.charCodeAt(0)) {
            pairBuffer += ":";
        } else {
            pairBuffer += ": ";
        }
        pairBuffer += state34.dump;
        _result += pairBuffer;
    }
    state34.tag = _tag;
    state34.dump = _result || "{}";
}
function detectType(state35, object, explicit = false) {
    const typeList = explicit ? state35.explicitTypes : state35.implicitTypes;
    let type;
    let style;
    let _result;
    for(let index = 0, length = typeList.length; index < length; index += 1){
        type = typeList[index];
        if ((type.instanceOf || type.predicate) && (!type.instanceOf || typeof object === "object" && object instanceof type.instanceOf) && (!type.predicate || type.predicate(object))) {
            state35.tag = explicit ? type.tag : "?";
            if (type.represent) {
                style = state35.styleMap[type.tag] || type.defaultStyle;
                if (_toString2.call(type.represent) === "[object Function]") {
                    _result = type.represent(object, style);
                } else if (hasOwn4(type.represent, style)) {
                    _result = type.represent[style](object, style);
                } else {
                    throw new YAMLError(`!<${type.tag}> tag resolver accepts not "${style}" style`);
                }
                state35.dump = _result;
            }
            return true;
        }
    }
    return false;
}
function writeNode(state36, level, object, block, compact, iskey = false) {
    state36.tag = null;
    state36.dump = object;
    if (!detectType(state36, object, false)) {
        detectType(state36, object, true);
    }
    const type = _toString2.call(state36.dump);
    if (block) {
        block = state36.flowLevel < 0 || state36.flowLevel > level;
    }
    const objectOrArray = type === "[object Object]" || type === "[object Array]";
    let duplicateIndex = -1;
    let duplicate = false;
    if (objectOrArray) {
        duplicateIndex = state36.duplicates.indexOf(object);
        duplicate = duplicateIndex !== -1;
    }
    if (state36.tag !== null && state36.tag !== "?" || duplicate || state36.indent !== 2 && level > 0) {
        compact = false;
    }
    if (duplicate && state36.usedDuplicates[duplicateIndex]) {
        state36.dump = `*ref_${duplicateIndex}`;
    } else {
        if (objectOrArray && duplicate && !state36.usedDuplicates[duplicateIndex]) {
            state36.usedDuplicates[duplicateIndex] = true;
        }
        if (type === "[object Object]") {
            if (block && Object.keys(state36.dump).length !== 0) {
                writeBlockMapping(state36, level, state36.dump, compact);
                if (duplicate) {
                    state36.dump = `&ref_${duplicateIndex}${state36.dump}`;
                }
            } else {
                writeFlowMapping(state36, level, state36.dump);
                if (duplicate) {
                    state36.dump = `&ref_${duplicateIndex} ${state36.dump}`;
                }
            }
        } else if (type === "[object Array]") {
            const arrayLevel = state36.noArrayIndent && level > 0 ? level - 1 : level;
            if (block && state36.dump.length !== 0) {
                writeBlockSequence(state36, arrayLevel, state36.dump, compact);
                if (duplicate) {
                    state36.dump = `&ref_${duplicateIndex}${state36.dump}`;
                }
            } else {
                writeFlowSequence(state36, arrayLevel, state36.dump);
                if (duplicate) {
                    state36.dump = `&ref_${duplicateIndex} ${state36.dump}`;
                }
            }
        } else if (type === "[object String]") {
            if (state36.tag !== "?") {
                writeScalar(state36, state36.dump, level, iskey);
            }
        } else {
            if (state36.skipInvalid) return false;
            throw new YAMLError(`unacceptable kind of an object to dump ${type}`);
        }
        if (state36.tag !== null && state36.tag !== "?") {
            state36.dump = `!<${state36.tag}> ${state36.dump}`;
        }
    }
    return true;
}
const MS_PER_MIN = 60 * 1000;
async function load1(file) {
    const configuration = parse6(await Deno.readTextFile(file));
    const tzOffset = new Date().getTimezoneOffset() * MS_PER_MIN;
    for (const device of configuration.fitbit.devices){
        device.startStudyDate.setTime(device.startStudyDate.getTime() + tzOffset);
        device.startInterventionDate.setTime(device.startInterventionDate.getTime() + tzOffset);
    }
    return {
        ...configuration
    };
}
const makeParser = (callbacks)=>{
    return (args)=>{
        return Yargs(args).command({
            command: "list-devices",
            describe: "List all devices",
            handler: callbacks["list-devices"]
        }).command({
            command: "test-api-keys",
            describe: "Test API keys",
            handler: callbacks["test-api-keys"]
        }).command({
            command: "goal-status",
            describe: "Get goal status",
            handler: callbacks["goal-status"]
        }).command({
            command: "pull-data",
            describe: "Pull data from the Fitbit API",
            handler: callbacks["pull-data"]
        }).command({
            command: "call-fitbit-api <request>",
            describe: "Make your own call to the fitbit API for all devices",
            handler: callbacks["call-fitbit-api"]
        }).command({
            command: "make-config-file [--minimal]",
            describe: "Make a config file. This doesn't overwrite existing config files, so if you want to make another config file, delete or rename the existing one.",
            builder: (yargs1)=>yargs1.option("minimal", {
                    default: false,
                    describe: "Removes comments from the config file",
                    type: "boolean"
                })
            ,
            handler: callbacks["make-config-file"]
        }).alias("h", "help").alias("v", "version").strict().demandCommand(1).parse();
    };
};
function getDayNumber(currentDate, startDate) {
    const msBetweenDates = currentDate.getTime() - startDate.getTime();
    return Math.floor(msBetweenDates / 86400000);
}
function getWeekNumber(currentDate, startDate) {
    return Math.floor(getDayNumber(currentDate, startDate) / 7) + 1;
}
function getDateRange(startDate, endDate) {
    if (startDate > endDate) {
        throw new Error("Start date must be before end date");
    }
    const dates = [];
    const currentDate = new Date(startDate);
    while(currentDate <= endDate){
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}
function getDateString(date) {
    return format6(date, "yyyy-MM-dd");
}
const INTRADAY_STEPS_KEY = "activities-steps-intraday";
const LAST_SYNC_KEY = "lastSyncTime";
async function getIntradaySteps(accessToken, date = "today") {
    const json2 = await fitbitRequest({
        requestUrl: `https://api.fitbit.com/1/user/-/activities/steps/date/${getFitbitDate(date)}/1d.json`,
        accessToken
    });
    if (!(INTRADAY_STEPS_KEY in json2)) {
        console.error(json2);
        throw new Error("Didn't see intraday step data - " + "make sure that the account you're using has access to intraday steps data " + "and that the Fitbit request you're sending provides intraday steps data");
    }
    return json2[INTRADAY_STEPS_KEY]["dataset"];
}
function getFitbitDate(date = "today") {
    let dateStr = "";
    if (typeof date === "string") {
        dateStr = date;
    } else {
        dateStr = getDateString(date);
    }
    return dateStr;
}
async function getLastSync(accessToken) {
    const json3 = await fitbitRequest({
        requestUrl: `https://api.fitbit.com/1/user/-/devices.json`,
        accessToken
    });
    if (json3.length !== 1) {
        console.error(json3);
        throw new Error(`There should be exactly one device, ${json3.length} found`);
    }
    const device = json3[0];
    if (!(LAST_SYNC_KEY in device)) {
        console.error(device);
        throw new Error("Didn't see last sync time in the returned data");
    }
    return device[LAST_SYNC_KEY];
}
async function fitbitRequest(options) {
    const response = await fetch(options.requestUrl, {
        headers: {
            Authorization: `Bearer ${options.accessToken}`
        }
    });
    if (!response.ok) {
        console.log(response);
        throw new Error(`Trouble connecting to Fitbit - make sure your credentials are correct: status ${response.status}`);
    }
    const json4 = await response.json();
    return json4;
}
function intradayToArray(intradaySteps) {
    const steps = intradaySteps.map((step)=>step.value
    );
    return steps;
}
function getActiveSteps(steps, config) {
    const activeSessions = processSteps(steps, config);
    const activeSessionTotals = activeSessions.map((session)=>session.reduce((acc, curr)=>acc + curr
        , 0)
    );
    return activeSessionTotals.reduce((acc, curr)=>acc + curr
    , 0);
}
function processSteps(steps, config) {
    const activeSessions = [];
    let activeSession = [];
    let consecutiveGap = 0;
    steps.forEach((step, _)=>{
        if (step >= config.minStepsPerMin) {
            consecutiveGap = 0;
            activeSession.push(step);
        } else {
            consecutiveGap++;
        }
        if (consecutiveGap > config.maxInactiveMin) {
            if (activeSession.length >= config.minDuration) {
                activeSessions.push(activeSession);
            }
            activeSession = [];
        }
    });
    if (activeSession.length >= config.minDuration) {
        activeSessions.push(activeSession);
    }
    return activeSessions;
}
function getDayGoal(weekGoal, stepsSoFar, startDate, currentDate, config) {
    const weekDayNumber = getDayNumber(currentDate, startDate) % 7;
    const daysRemaining = 7 - weekDayNumber;
    const stepsRemaining = weekGoal - stepsSoFar;
    if (config.daily.daysPerWeek < 1 || config.daily.daysPerWeek > 7) {
        throw new Error("Days per week must be between 1 and 7");
    }
    const averageStepsPerDay = weekGoal / config.daily.daysPerWeek;
    const maxStepsPerDay = Math.ceil(averageStepsPerDay * config.daily.maxImprovementRatio);
    const recommendedStepsPerDay = Math.ceil(stepsRemaining / Math.min(daysRemaining, config.daily.daysPerWeek));
    return Math.ceil(Math.min(Math.max(recommendedStepsPerDay, averageStepsPerDay), maxStepsPerDay));
}
function getWeekGoal(stepsLastWeek, startDate, currentDate = new Date(), config) {
    const weekNumber = getWeekNumber(currentDate, startDate);
    if (weekNumber < 1) {
        throw new Error(`Week number ${weekNumber} is less than 1, meaning you're trying a date before the start date of the study`);
    }
    if (weekNumber >= config.numOfWeeks + 1) {
        throw new Error(`Week number ${weekNumber} is greater than the number of weeks in the goal setting period (${config.numOfWeeks} weeks),` + ` meaning that you're trying a date after the study has completed`);
    }
    const minGoal = Math.round(stepsLastWeek * config.weekly.minImprovementRatio);
    if (minGoal < config.weekly.minSteps) {
        return Math.ceil(config.weekly.minSteps);
    } else if (minGoal > config.weekly.finalGoal) {
        return Math.ceil(minGoal);
    } else {
        const weeksRemaining = config.numOfWeeks - weekNumber + 1;
        if (weeksRemaining < 1) {
            throw new Error(`Weeks remaining is ${weeksRemaining} and should never be less than one here, if it is something is wrong with the program logic`);
        }
        const dGoal = Math.round((config.weekly.finalGoal - stepsLastWeek) / weeksRemaining);
        return Math.ceil(Math.max(minGoal, stepsLastWeek + dGoal));
    }
}
async function writeIntradayStepsToCsv(steps, file) {
    const f = await Deno.open(file, {
        write: true,
        createNew: true
    });
    const header = [
        "time",
        "value"
    ];
    const data = steps.map((d)=>[
            d.time,
            d.value.toString()
        ]
    ).map((d)=>Object.values(d)
    );
    await writeCSV(f, [
        header,
        ...data
    ]);
    f.close();
}
async function readIntradayStepsFromCsv(file) {
    if (!await exists(file)) {
        return [];
    }
    const f = await Deno.open(file, {
        read: true
    });
    const data = [];
    for await (const obj of readCSVObjects(f)){
        const time = obj.time;
        const value = Number(obj.value);
        data.push({
            time,
            value
        });
    }
    f.close();
    return data;
}
async function pullIntradaySteps(startDate, endDate, deviceName, accessToken, isDebug) {
    const dates = getDateRange(startDate, endDate);
    dates.pop();
    const dir = getIntradayStepsDir(deviceName);
    await ensureDir(dir);
    for (const date of dates){
        const dateStr = getDateString(date);
        const file = join7(dir, `${dateStr}.csv`);
        if (await exists(file)) {
            if (isDebug) {
                console.debug(`skipping ${dateStr} for '${deviceName}' because it already exists`);
            }
        } else {
            console.debug(`saving data for ${dateStr} for '${deviceName}'`);
            const steps = await getIntradaySteps(accessToken, date);
            await writeIntradayStepsToCsv(steps, file);
        }
    }
}
function getDeviceDir(deviceName) {
    return join7("data", deviceName);
}
function getIntradayStepsDir(deviceName) {
    return join7(getDeviceDir(deviceName), "intraday-steps");
}
async function getPreStudyActiveStepsFromFiles(startStudyDate, startInterventionDate, deviceName, activeStepsConfig) {
    if (startStudyDate.getTime() >= startInterventionDate.getTime()) {
        throw new Error(`For device '${deviceName}', the study start date (${startStudyDate.toLocaleDateString()}) must be before the date to start the intervention (${startInterventionDate.toLocaleDateString()})`);
    }
    if (isGreaterThanDate(startInterventionDate, new Date())) {
        throw new Error(`For device '${deviceName}', you are trying to look into the future since the pre study dates haven't finished`);
    }
    return await getActiveStepsFromFiles(startStudyDate, startInterventionDate, deviceName, activeStepsConfig);
}
async function getActiveStepsFromFiles(startDate, endDate, deviceName, activeStepsConfig) {
    if (startDate.getTime() >= endDate.getTime()) {
        throw new Error(`For device '${deviceName}', the start date (${startDate.toLocaleDateString()}) must be before the end date (${endDate.toLocaleDateString()})`);
    }
    if (isGreaterThanDate(endDate, new Date())) {
        throw new Error(`For device '${deviceName}', you are trying to look into the future with end date ${endDate.toLocaleDateString()}`);
    }
    const dates = getDateRange(startDate, endDate);
    dates.pop();
    const data = [];
    for (const date of dates){
        data.push({
            date,
            activeSteps: await getActiveStepsFromFile(date, deviceName, activeStepsConfig)
        });
    }
    return data;
}
async function getActiveStepsFromFile(date, deviceName, activeStepsConfig) {
    const dir = getIntradayStepsDir(deviceName);
    const dateStr = getDateString(date);
    const file = join7(dir, `${dateStr}.csv`);
    if (!await exists(file)) {
        throw new Error(`For device '${deviceName}', there is no data for ${dateStr}`);
    }
    const steps = await readIntradayStepsFromCsv(file);
    const stepsArr = intradayToArray(steps);
    return getActiveSteps(stepsArr, activeStepsConfig);
}
function isLessThanDate(date1, date2) {
    date1.setHours(0, 0, 0, 0);
    date2.setHours(0, 0, 0, 0);
    return date1.getTime() < date2.getTime();
}
function isGreaterThanDate(date1, date2) {
    return isLessThanDate(date2, date1);
}
async function pullData(config) {
    const deviceRecords = {};
    for (const device of config.fitbit.devices){
        const lastDayOfStudy = getLastDay(device.startInterventionDate, config.goalSetting.numOfWeeks);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        if (isGreaterThanDate(device.startStudyDate, currentDate)) {
            continue;
        }
        let endDate;
        if (isLessThanDate(lastDayOfStudy, currentDate)) {
            endDate = new Date(lastDayOfStudy);
        } else {
            endDate = new Date(currentDate);
        }
        await pullIntradaySteps(device.startStudyDate, endDate, device.name, device.accessToken, config.fitbit.debug);
        if (isGreaterThanDate(device.startInterventionDate, currentDate)) {
            continue;
        }
        const preStudyActiveSteps = await getPreStudyActiveStepsFromFiles(device.startStudyDate, device.startInterventionDate, device.name, config.activeSteps);
        const preStudyMeanDailyActiveSteps = getMean(preStudyActiveSteps.map((d)=>d.activeSteps
        ));
        const baseWeeklyStepsGoal = Math.floor(Math.max(preStudyMeanDailyActiveSteps * config.goalSetting.daily.daysPerWeek, config.goalSetting.weekly.minSteps));
        const interventionDatesSoFar = getDateRange(device.startInterventionDate, endDate);
        interventionDatesSoFar.pop();
        const records = [];
        if (interventionDatesSoFar.length === 0) {
            const date = new Date(device.startInterventionDate);
            const steps = await getIntradaySteps(device.accessToken, date);
            const stepsArr = intradayToArray(steps);
            const activeStepsSoFar = getActiveSteps(stepsArr, config.activeSteps);
            const dayGoal = getDayGoal(baseWeeklyStepsGoal, 0, date, date, config.goalSetting);
            records.push({
                date: device.startInterventionDate,
                weekNum: 1,
                dayNum: 0,
                weeklyStepsGoal: baseWeeklyStepsGoal,
                lowerDailyStepsGoal: dayGoal,
                upperDailyStepsGoal: Math.floor(dayGoal * config.goalSetting.daily.upperBoundToLowerBoundRatio),
                activeStepsThisDay: activeStepsSoFar,
                activeStepsThisWeek: activeStepsSoFar,
                isMet: dayGoal <= activeStepsSoFar
            });
        } else {
            const weekGoals = {
                1: baseWeeklyStepsGoal
            };
            const weekStepsRecord = {};
            let weekSteps = 0;
            for (const date of interventionDatesSoFar){
                const dayNum = getDayNumber(date, device.startInterventionDate);
                const weekNum = getWeekNumber(date, device.startInterventionDate);
                if (!(weekNum in weekGoals)) {
                    const weekGoal = getWeekGoal(weekSteps, device.startInterventionDate, date, config.goalSetting);
                    weekGoals[weekNum] = weekGoal;
                    weekStepsRecord[weekNum - 1] = weekSteps;
                    weekSteps = 0;
                }
                const dailySteps = await getActiveStepsFromFile(date, device.name, config.activeSteps);
                weekSteps += dailySteps;
                const dayGoal = getDayGoal(weekGoals[weekNum], weekSteps, device.startInterventionDate, date, config.goalSetting);
                records.push({
                    date,
                    weekNum,
                    dayNum,
                    weeklyStepsGoal: weekGoals[weekNum],
                    lowerDailyStepsGoal: dayGoal,
                    upperDailyStepsGoal: Math.floor(dayGoal * config.goalSetting.daily.upperBoundToLowerBoundRatio),
                    activeStepsThisDay: dailySteps,
                    activeStepsThisWeek: weekSteps,
                    isMet: dayGoal <= dailySteps
                });
            }
            writeSummaryToCSV(device.name, records);
        }
        deviceRecords[device.name] = records;
    }
    return deviceRecords;
}
async function writeSummaryToCSV(deviceName, records) {
    const dir = getDeviceDir(deviceName);
    const file = join7(dir, "summary.csv");
    const header = [
        "date",
        "weekNum",
        "dayNum",
        "weeklyStepsGoal",
        "lowerDailyStepsGoal",
        "upperDailyStepsGoal",
        "activeStepsThisDay",
        "activeStepsThisWeek",
        "isMet", 
    ];
    const data = records.map((r)=>{
        const arr = Object.values(r);
        return arr.map((v)=>{
            if (v instanceof Date) {
                return v.toLocaleDateString();
            } else {
                return v.toString();
            }
        });
    });
    if (await exists(file)) {
        await Deno.remove(file);
    }
    const f = await Deno.open(file, {
        write: true,
        create: true
    });
    await writeCSV(f, [
        header,
        ...data
    ]);
    f.close();
}
const MS_PER_DAY = 1000 * 60 * 60 * 24;
function getLastDay(startDate, numOfWeeks) {
    return new Date(startDate.getTime() + MS_PER_DAY * numOfWeeks * 7);
}
function getMean(arr) {
    return arr.reduce((a, b)=>a + b
    , 0) / arr.length;
}
async function getStatus(config) {
    const deviceStatus = {};
    const deviceRecords = await pullData(config);
    for (const device of config.fitbit.devices){
        const record = deviceRecords[device.name];
        const lastDayOfStudy = getLastDay(device.startInterventionDate, config.goalSetting.numOfWeeks);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        if (isGreaterThanDate(device.startStudyDate, currentDate)) {
            deviceStatus[device.name] = {
                comment: `Pre intervention period of getting steps baseline hasn't begun yet - it begins on ${device.startStudyDate.toLocaleDateString()}`
            };
        } else if (isGreaterThanDate(device.startInterventionDate, currentDate)) {
            deviceStatus[device.name] = {
                comment: `Pre intervention period of getting steps baseline has began on ${device.startStudyDate.toLocaleDateString()} - the first day of the study is ${device.startInterventionDate.toLocaleDateString()}`
            };
        } else if (currentDate.getTime() >= lastDayOfStudy.getTime()) {
            deviceStatus[device.name] = {
                comment: `Study with device ended on ${lastDayOfStudy.toLocaleDateString()}`
            };
        } else {
            const lastRecord = record[record.length - 1];
            const lastWeekNum = lastRecord.weekNum;
            const lastWeekGoal = lastRecord.weeklyStepsGoal;
            const currentWeekNum = getWeekNumber(currentDate, device.startInterventionDate);
            let weekGoal;
            if (currentWeekNum === lastWeekNum) {
                weekGoal = lastWeekGoal;
            } else {
                weekGoal = getWeekGoal(lastRecord.activeStepsThisWeek, device.startInterventionDate, currentDate, config.goalSetting);
            }
            const lowerDayGoal = getDayGoal(weekGoal, lastRecord.activeStepsThisWeek, device.startInterventionDate, currentDate, config.goalSetting);
            const intradaySteps = await getIntradaySteps(device.accessToken, currentDate);
            const intradayStepsArr = intradayToArray(intradaySteps);
            const activeSteps = getActiveSteps(intradayStepsArr, config.activeSteps);
            deviceStatus[device.name] = {
                lowerDayGoal: lowerDayGoal,
                upperDayGoal: Math.floor(lowerDayGoal * config.goalSetting.daily.upperBoundToLowerBoundRatio),
                activeStepsSoFar: activeSteps,
                isMet: activeSteps >= lowerDayGoal
            };
        }
    }
    return deviceStatus;
}
const CONFIG_FILE = "config.yaml";
const DAYS_IN_WEEK = 7;
const loadConfig = async ()=>{
    try {
        return await load1(CONFIG_FILE);
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
            console.error(`No config file '${CONFIG_FILE}' found - you can use the 'make-config-file' command to make a starter config file\n`, e);
        } else if (e instanceof YAMLError) {
            console.error(`Check that your config file '${CONFIG_FILE}' is valid YAML format\n`, e);
        } else {
            console.error(e);
        }
        Deno.exit(1);
    }
};
const listDevices = async (_args)=>{
    console.log("Devices\n-------");
    const config = await loadConfig();
    config.fitbit.devices.forEach((device)=>{
        console.log(`\t* ${device.name}`);
    });
    console.log("\nGo into your config file to adjust devices");
};
const testApiKeys = async (args)=>{
    const config = await loadConfig();
    console.log("Checking...\n");
    let isError = false;
    for (const device of config.fitbit.devices){
        try {
            await getLastSync(device.accessToken);
        } catch (e) {
            console.error(`Failed to access device '${device.name}': ${e}`);
            isError = true;
            continue;
        }
        try {
            await getActiveStepTotal(device.accessToken, args.date, config.activeSteps);
        } catch (e1) {
            console.error(`Failed to access intra day steps data for device '${device.name}': ${e1}`);
            isError = true;
            continue;
        }
        console.log(`\t* Device '${device.name}' syncs and has access to intraday steps data`);
    }
    if (isError) {
        console.error("\nPlease fix the errors above and try again");
    } else {
        console.log("\nAll devices are syncing and have access to intraday steps data");
    }
};
async function getActiveStepTotal(accessToken, dateStr = "today", config) {
    const steps = await getIntradaySteps(accessToken, dateStr);
    const stepsArray = intradayToArray(steps);
    return getActiveSteps(stepsArray, config);
}
const pullDataCallback = async (_args)=>{
    const config = await loadConfig();
    console.log("Pulling data...");
    await pullData(config);
    console.log("Done pulling data!");
};
const getStatusCallback = async (args)=>{
    await pullDataCallback(args);
    const config = await loadConfig();
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const status = await getStatus(config);
    for (const device of config.fitbit.devices){
        const deviceStatus = status[device.name];
        const dayNumber = getDayNumber(currentDate, device.startInterventionDate);
        let message = `
Device: ${device.name}`;
        if ("comment" in deviceStatus) {
            message += `
  Comment: ${deviceStatus.comment}`;
        } else {
            message += `
  ${deviceStatus.isMet ? "HAS MET DAILY GOAL" : "Haven't met daily goal yet"}
  Last sync: ${await getLastSync(device.accessToken)}
  Active Steps So Far: ${deviceStatus.activeStepsSoFar}
  Day goals:
    Lower bound: ${deviceStatus.lowerDayGoal}
    Upper bound: ${deviceStatus.upperDayGoal}
  Day number: ${dayNumber}
  Days remaining: ${DAYS_IN_WEEK * config.goalSetting.numOfWeeks - dayNumber}`;
        }
        message += `
  Study start: ${device.startStudyDate.toLocaleDateString()}
  Intervention start: ${device.startInterventionDate.toLocaleDateString()}
  Intervention end: ${getLastDay(device.startInterventionDate, config.goalSetting.numOfWeeks).toLocaleDateString()}`;
        console.log(message);
    }
};
const callFitbitApi = async (args)=>{
    const config = await loadConfig();
    for (const device of config.fitbit.devices){
        const response = await fitbitRequest({
            requestUrl: args.request,
            accessToken: device.accessToken
        });
        console.log(`\nDevice: ${device.name}`);
        console.log(response);
    }
};
const makeConfigFile = async (args)=>{
    if (await exists(CONFIG_FILE)) {
        console.error(`Config file '${CONFIG_FILE}' already exists - please delete it first`);
        Deno.exit(1);
    }
    const configMessage = `
# The configuration file for the fitbit-goal-setter tool. This file helps define many of the specifics
# of the behavior of this tool, such as what Fitbit devices should be used and how do we define active
# steps and calculate goals.
#
# This file is in YAML format, and can be edited using any text editor.
# Lines that start with # are comments and are ignored when the program reads the file.
# In other words, they are only for your information. Feel free to delete them once you
# feel like you understand this file.

# Settings that relate to the Fitbit API
fitbit:
  # A list of fitbit devices, as well as their name and start dates
  devices:
    # You can add multiple devices here
    - name: Example Device 1
      # Follow the instructions to get a valid access token
      accessToken: <Your access token>
      # Set the date that you want to begin measuring their activity data
      # the first goal will be set from the average active steps each day during this period
      startStudyDate: 2021-09-15
      # Set the date that you want to be getting goals for them
      startInterventionDate: 2021-09-24
    # You can add multiple devices here, but you'll need to change the name and accessToken
    # The Fitbit device below is commented out with the # characters - delete the # to use it
    # - name: Example Device 2
    #  accessToken: <Your access token>
    #  startStudyDate: 2021-09-15
    #  startInterventionDate: 2021-09-24
  # If debug is 'true', you will see print statements for each day's data that is pulled from Fitbit or if it
  # is skipped, because it is already saved in the 'data' folder
  debug: false
# Settings that apply to how active steps are calculated
activeSteps:
  # The minimum duration of active minutes before active steps are counted
  # If this value is 15, the participant must walk 15 or more minutes with more than a minimum number of steps
  minDuration: 15
  # The minimum number of steps in one minute for that minute to be counted as active
  minStepsPerMin: 60
  # The maximum gap in minutes allowed between minutes with active steps
  # For example if the participant walks actively for 13 minutes, then takes a 2 minute break at a cross walk,
  # and then walks another 2 active minutes, the participant will have 15 active minutes
  # If the participant stops for 3 minutes and the maxInactiveMin is set to 2, the participant will have 13 active minutes
  # and these 13 active minutes may not be counted towards their daily goal, depending on the value of minDuration
  maxInactiveMin: 2
# Setting that are used in the goal setting process
goalSetting:
  # Set the duration of the intervention in weeks - this goes from each devices startInterventionDate for the
  # specified number of weeks. Note that this doesn't include the dates included in between each devices startStudyDate
  # and startInterventionDate (not including the startInterventionDate), as these dates are used to get an idea of what
  # the first week of the intervention should use as an active steps goal.
  numOfWeeks: 6
  weekly:
    # The minimum active steps you would like to recommend in a week
    minSteps: 2000
    # The final goal of active steps in a week that you would like to work towards
    finalGoal: 10000
    # The minimum improvement in active steps you would like to recommend from their current number of steps
    # For example, they did 3000 active steps last week, the minimum number of steps recommended would be
    # 3750 = 3000 * 1.25
    minImprovementRatio: 1.25
  daily:
    # The number of days per week that you expect them to try to achieve their walking goal
    # For example, if this value is 5, they can take up to two days off a week and it will not affect
    # their goal recommendations
    daysPerWeek: 5
    # This number limits the number of steps that will be recommended for them on any given day
    # The reason is if they fall behind, they are not told to catchup all 10,000 steps on the last day
    # For example, if the maxImprovementRatio is set to 2.0 and they have walked 0 active steps this week
    # and have a goal of 10,000 steps, the minimum goal would be 2000 steps a day
    # the goal for the day will be 4000 = 2000 * 2.0
    maxImprovementRatio: 2.0
    # This number is used to set the upper bound on the daily goal. It is a little different than
    # algorithm given, since the minimum goal is calculated from the minimum weekly goal, which uses the
    # minImprovementRatio.
    # If in the algorithm, the lower bound is meant to be the minimum goal * 1.25 and the upper bound is meant to be
    # 2.0 as in the example, then the weekly minImprovementRatio should be 1.25 and the upperBoundToLowerBoundRatio
    # should be 1.6 (upper bound constant / lower bound constant = 2.0 / 1.25 = 1.6).
    upperBoundToLowerBoundRatio: 1.6
`;
    let out = "";
    if (args.minimal) {
        configMessage.split("\n").forEach((line)=>{
            if (!(line.trim().startsWith("#") || line.trim() === "")) {
                out += line + "\n";
            }
        });
    } else {
        out = configMessage;
    }
    await Deno.writeTextFile(CONFIG_FILE, out);
    console.log(`Created config file: ${CONFIG_FILE}`);
};
const parser1 = makeParser({
    "list-devices": listDevices,
    "test-api-keys": testApiKeys,
    "goal-status": getStatusCallback,
    "pull-data": pullDataCallback,
    "call-fitbit-api": callFitbitApi,
    "make-config-file": makeConfigFile
});
parser1(Deno.args);
