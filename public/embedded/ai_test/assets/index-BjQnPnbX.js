(function() {
    let e = document.createElement(`link`).relList;
    if (e && e.supports && e.supports(`modulepreload`)) return;
    for (let e of document.querySelectorAll(`link[rel="modulepreload"]`)) n(e);
    new MutationObserver(e => {
        for (let t of e)
            if (t.type === `childList`)
                for (let e of t.addedNodes) e.tagName === `LINK` && e.rel === `modulepreload` && n(e)
    }).observe(document, {
        childList: !0,
        subtree: !0
    });

    function t(e) {
        let t = {};
        return e.integrity && (t.integrity = e.integrity), e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy), e.crossOrigin === `use-credentials` ? t.credentials = `include` : e.crossOrigin === `anonymous` ? t.credentials = `omit` : t.credentials = `same-origin`, t
    }

    function n(e) {
        if (e.ep) return;
        e.ep = !0;
        let n = t(e);
        fetch(e.href, n)
    }
})();

function e(e) {
    let t = Object.create(null);
    for (let n of e.split(`,`)) t[n] = 1;
    return e => e in t
}
var t = {},
    n = [],
    r = () => {},
    i = () => !1,
    a = e => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && (e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97),
    o = e => e.startsWith(`onUpdate:`),
    s = Object.assign,
    c = (e, t) => {
        let n = e.indexOf(t);
        n > -1 && e.splice(n, 1)
    },
    l = Object.prototype.hasOwnProperty,
    u = (e, t) => l.call(e, t),
    d = Array.isArray,
    f = e => x(e) === `[object Map]`,
    p = e => x(e) === `[object Set]`,
    m = e => x(e) === `[object Date]`,
    h = e => typeof e == `function`,
    g = e => typeof e == `string`,
    _ = e => typeof e == `symbol`,
    v = e => typeof e == `object` && !!e,
    y = e => (v(e) || h(e)) && h(e.then) && h(e.catch),
    b = Object.prototype.toString,
    x = e => b.call(e),
    S = e => x(e).slice(8, -1),
    C = e => x(e) === `[object Object]`,
    w = e => g(e) && e !== `NaN` && e[0] !== `-` && `` + parseInt(e, 10) === e,
    ee = e(`,key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted`),
    T = e => {
        let t = Object.create(null);
        return (n => t[n] || (t[n] = e(n)))
    },
    te = /-\w/g,
    E = T(e => e.replace(te, e => e.slice(1).toUpperCase())),
    ne = /\B([A-Z])/g,
    D = T(e => e.replace(ne, `-$1`).toLowerCase()),
    re = T(e => e.charAt(0).toUpperCase() + e.slice(1)),
    ie = T(e => e ? `on${re(e)}` : ``),
    O = (e, t) => !Object.is(e, t),
    ae = (e, ...t) => {
        for (let n = 0; n < e.length; n++) e[n](...t)
    },
    k = (e, t, n, r = !1) => {
        Object.defineProperty(e, t, {
            configurable: !0,
            enumerable: !1,
            writable: r,
            value: n
        })
    },
    oe = e => {
        let t = parseFloat(e);
        return isNaN(t) ? e : t
    },
    se, ce = () => se ||= typeof globalThis < `u` ? globalThis : typeof self < `u` ? self : typeof window < `u` ? window : typeof global < `u` ? global : {};

function le(e) {
    if (d(e)) {
        let t = {};
        for (let n = 0; n < e.length; n++) {
            let r = e[n],
                i = g(r) ? pe(r) : le(r);
            if (i)
                for (let e in i) t[e] = i[e]
        }
        return t
    } else if (g(e) || v(e)) return e
}
var ue = /;(?![^(]*\))/g,
    de = /:([^]+)/,
    fe = /\/\*[^]*?\*\//g;

function pe(e) {
    let t = {};
    return e.replace(fe, ``).split(ue).forEach(e => {
        if (e) {
            let n = e.split(de);
            n.length > 1 && (t[n[0].trim()] = n[1].trim())
        }
    }), t
}

function A(e) {
    let t = ``;
    if (g(e)) t = e;
    else if (d(e))
        for (let n = 0; n < e.length; n++) {
            let r = A(e[n]);
            r && (t += r + ` `)
        } else if (v(e))
            for (let n in e) e[n] && (t += n + ` `);
    return t.trim()
}
var me = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`,
    he = e(me);
me + ``;

function ge(e) {
    return !!e || e === ``
}

function _e(e, t) {
    if (e.length !== t.length) return !1;
    let n = !0;
    for (let r = 0; n && r < e.length; r++) n = ve(e[r], t[r]);
    return n
}

function ve(e, t) {
    if (e === t) return !0;
    let n = m(e),
        r = m(t);
    if (n || r) return n && r ? e.getTime() === t.getTime() : !1;
    if (n = _(e), r = _(t), n || r) return e === t;
    if (n = d(e), r = d(t), n || r) return n && r ? _e(e, t) : !1;
    if (n = v(e), r = v(t), n || r) {
        if (!n || !r || Object.keys(e).length !== Object.keys(t).length) return !1;
        for (let n in e) {
            let r = e.hasOwnProperty(n),
                i = t.hasOwnProperty(n);
            if (r && !i || !r && i || !ve(e[n], t[n])) return !1
        }
    }
    return String(e) === String(t)
}

function ye(e, t) {
    return e.findIndex(e => ve(e, t))
}
var be = e => !!(e && e.__v_isRef === !0),
    j = e => g(e) ? e : e == null ? `` : d(e) || v(e) && (e.toString === b || !h(e.toString)) ? be(e) ? j(e.value) : JSON.stringify(e, xe, 2) : String(e),
    xe = (e, t) => be(t) ? xe(e, t.value) : f(t) ? {
        [`Map(${t.size})`]: [...t.entries()].reduce((e, [t, n], r) => (e[Se(t, r) + ` =>`] = n, e), {})
    } : p(t) ? {
        [`Set(${t.size})`]: [...t.values()].map(e => Se(e))
    } : _(t) ? Se(t) : v(t) && !d(t) && !C(t) ? String(t) : t,
    Se = (e, t = ``) => _(e) ? `Symbol(${e.description??t})` : e,
    M, Ce = class {
        constructor(e = !1) {
            this.detached = e, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this.__v_skip = !0, this.parent = M, !e && M && (this.index = (M.scopes ||= []).push(this) - 1)
        }
        get active() {
            return this._active
        }
        pause() {
            if (this._active) {
                this._isPaused = !0;
                let e, t;
                if (this.scopes)
                    for (e = 0, t = this.scopes.length; e < t; e++) this.scopes[e].pause();
                for (e = 0, t = this.effects.length; e < t; e++) this.effects[e].pause()
            }
        }
        resume() {
            if (this._active && this._isPaused) {
                this._isPaused = !1;
                let e, t;
                if (this.scopes)
                    for (e = 0, t = this.scopes.length; e < t; e++) this.scopes[e].resume();
                for (e = 0, t = this.effects.length; e < t; e++) this.effects[e].resume()
            }
        }
        run(e) {
            if (this._active) {
                let t = M;
                try {
                    return M = this, e()
                } finally {
                    M = t
                }
            }
        }
        on() {
            ++this._on === 1 && (this.prevScope = M, M = this)
        }
        off() {
            this._on > 0 && --this._on === 0 && (M = this.prevScope, this.prevScope = void 0)
        }
        stop(e) {
            if (this._active) {
                this._active = !1;
                let t, n;
                for (t = 0, n = this.effects.length; t < n; t++) this.effects[t].stop();
                for (this.effects.length = 0, t = 0, n = this.cleanups.length; t < n; t++) this.cleanups[t]();
                if (this.cleanups.length = 0, this.scopes) {
                    for (t = 0, n = this.scopes.length; t < n; t++) this.scopes[t].stop(!0);
                    this.scopes.length = 0
                }
                if (!this.detached && this.parent && !e) {
                    let e = this.parent.scopes.pop();
                    e && e !== this && (this.parent.scopes[this.index] = e, e.index = this.index)
                }
                this.parent = void 0
            }
        }
    };

function we() {
    return M
}
var N, Te = new WeakSet,
    Ee = class {
        constructor(e) {
            this.fn = e, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, M && M.active && M.effects.push(this)
        }
        pause() {
            this.flags |= 64
        }
        resume() {
            this.flags & 64 && (this.flags &= -65, Te.has(this) && (Te.delete(this), this.trigger()))
        }
        notify() {
            this.flags & 2 && !(this.flags & 32) || this.flags & 8 || Ae(this)
        }
        run() {
            if (!(this.flags & 1)) return this.fn();
            this.flags |= 2, Ve(this), Ne(this);
            let e = N,
                t = P;
            N = this, P = !0;
            try {
                return this.fn()
            } finally {
                Pe(this), N = e, P = t, this.flags &= -3
            }
        }
        stop() {
            if (this.flags & 1) {
                for (let e = this.deps; e; e = e.nextDep) Le(e);
                this.deps = this.depsTail = void 0, Ve(this), this.onStop && this.onStop(), this.flags &= -2
            }
        }
        trigger() {
            this.flags & 64 ? Te.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty()
        }
        runIfDirty() {
            Fe(this) && this.run()
        }
        get dirty() {
            return Fe(this)
        }
    },
    De = 0,
    Oe, ke;

function Ae(e, t = !1) {
    if (e.flags |= 8, t) {
        e.next = ke, ke = e;
        return
    }
    e.next = Oe, Oe = e
}

function je() {
    De++
}

function Me() {
    if (--De > 0) return;
    if (ke) {
        let e = ke;
        for (ke = void 0; e;) {
            let t = e.next;
            e.next = void 0, e.flags &= -9, e = t
        }
    }
    let e;
    for (; Oe;) {
        let t = Oe;
        for (Oe = void 0; t;) {
            let n = t.next;
            if (t.next = void 0, t.flags &= -9, t.flags & 1) try {
                t.trigger()
            } catch (t) {
                e ||= t
            }
            t = n
        }
    }
    if (e) throw e
}

function Ne(e) {
    for (let t = e.deps; t; t = t.nextDep) t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t
}

function Pe(e) {
    let t, n = e.depsTail,
        r = n;
    for (; r;) {
        let e = r.prevDep;
        r.version === -1 ? (r === n && (n = e), Le(r), Re(r)) : t = r, r.dep.activeLink = r.prevActiveLink, r.prevActiveLink = void 0, r = e
    }
    e.deps = t, e.depsTail = n
}

function Fe(e) {
    for (let t = e.deps; t; t = t.nextDep)
        if (t.dep.version !== t.version || t.dep.computed && (Ie(t.dep.computed) || t.dep.version !== t.version)) return !0;
    return !!e._dirty
}

function Ie(e) {
    if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === He) || (e.globalVersion = He, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Fe(e)))) return;
    e.flags |= 2;
    let t = e.dep,
        n = N,
        r = P;
    N = e, P = !0;
    try {
        Ne(e);
        let n = e.fn(e._value);
        (t.version === 0 || O(n, e._value)) && (e.flags |= 128, e._value = n, t.version++)
    } catch (e) {
        throw t.version++, e
    } finally {
        N = n, P = r, Pe(e), e.flags &= -3
    }
}

function Le(e, t = !1) {
    let {
        dep: n,
        prevSub: r,
        nextSub: i
    } = e;
    if (r && (r.nextSub = i, e.prevSub = void 0), i && (i.prevSub = r, e.nextSub = void 0), n.subs === e && (n.subs = r, !r && n.computed)) {
        n.computed.flags &= -5;
        for (let e = n.computed.deps; e; e = e.nextDep) Le(e, !0)
    }!t && !--n.sc && n.map && n.map.delete(n.key)
}

function Re(e) {
    let {
        prevDep: t,
        nextDep: n
    } = e;
    t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0)
}
var P = !0,
    ze = [];

function F() {
    ze.push(P), P = !1
}

function Be() {
    let e = ze.pop();
    P = e === void 0 ? !0 : e
}

function Ve(e) {
    let {
        cleanup: t
    } = e;
    if (e.cleanup = void 0, t) {
        let e = N;
        N = void 0;
        try {
            t()
        } finally {
            N = e
        }
    }
}
var He = 0,
    Ue = class {
        constructor(e, t) {
            this.sub = e, this.dep = t, this.version = t.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0
        }
    },
    We = class {
        constructor(e) {
            this.computed = e, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0
        }
        track(e) {
            if (!N || !P || N === this.computed) return;
            let t = this.activeLink;
            if (t === void 0 || t.sub !== N) t = this.activeLink = new Ue(N, this), N.deps ? (t.prevDep = N.depsTail, N.depsTail.nextDep = t, N.depsTail = t) : N.deps = N.depsTail = t, Ge(t);
            else if (t.version === -1 && (t.version = this.version, t.nextDep)) {
                let e = t.nextDep;
                e.prevDep = t.prevDep, t.prevDep && (t.prevDep.nextDep = e), t.prevDep = N.depsTail, t.nextDep = void 0, N.depsTail.nextDep = t, N.depsTail = t, N.deps === t && (N.deps = e)
            }
            return t
        }
        trigger(e) {
            this.version++, He++, this.notify(e)
        }
        notify(e) {
            je();
            try {
                for (let e = this.subs; e; e = e.prevSub) e.sub.notify() && e.sub.dep.notify()
            } finally {
                Me()
            }
        }
    };

function Ge(e) {
    if (e.dep.sc++, e.sub.flags & 4) {
        let t = e.dep.computed;
        if (t && !e.dep.subs) {
            t.flags |= 20;
            for (let e = t.deps; e; e = e.nextDep) Ge(e)
        }
        let n = e.dep.subs;
        n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e
    }
}
var Ke = new WeakMap,
    qe = Symbol(``),
    Je = Symbol(``),
    Ye = Symbol(``);

function I(e, t, n) {
    if (P && N) {
        let t = Ke.get(e);
        t || Ke.set(e, t = new Map);
        let r = t.get(n);
        r || (t.set(n, r = new We), r.map = t, r.key = n), r.track()
    }
}

function Xe(e, t, n, r, i, a) {
    let o = Ke.get(e);
    if (!o) {
        He++;
        return
    }
    let s = e => {
        e && e.trigger()
    };
    if (je(), t === `clear`) o.forEach(s);
    else {
        let i = d(e),
            a = i && w(n);
        if (i && n === `length`) {
            let e = Number(r);
            o.forEach((t, n) => {
                (n === `length` || n === Ye || !_(n) && n >= e) && s(t)
            })
        } else switch ((n !== void 0 || o.has(void 0)) && s(o.get(n)), a && s(o.get(Ye)), t) {
            case `add`:
                i ? a && s(o.get(`length`)) : (s(o.get(qe)), f(e) && s(o.get(Je)));
                break;
            case `delete`:
                i || (s(o.get(qe)), f(e) && s(o.get(Je)));
                break;
            case `set`:
                f(e) && s(o.get(qe));
                break
        }
    }
    Me()
}

function Ze(e) {
    let t = R(e);
    return t === e ? t : (I(t, `iterate`, Ye), L(e) ? t : t.map(zt))
}

function Qe(e) {
    return I(e = R(e), `iterate`, Ye), e
}

function $e(e, t) {
    return It(e) ? Bt(Ft(e) ? zt(t) : t) : zt(t)
}
var et = {
    __proto__: null,
    [Symbol.iterator]() {
        return tt(this, Symbol.iterator, e => $e(this, e))
    },
    concat(...e) {
        return Ze(this).concat(...e.map(e => d(e) ? Ze(e) : e))
    },
    entries() {
        return tt(this, `entries`, e => (e[1] = $e(this, e[1]), e))
    },
    every(e, t) {
        return rt(this, `every`, e, t, void 0, arguments)
    },
    filter(e, t) {
        return rt(this, `filter`, e, t, e => e.map(e => $e(this, e)), arguments)
    },
    find(e, t) {
        return rt(this, `find`, e, t, e => $e(this, e), arguments)
    },
    findIndex(e, t) {
        return rt(this, `findIndex`, e, t, void 0, arguments)
    },
    findLast(e, t) {
        return rt(this, `findLast`, e, t, e => $e(this, e), arguments)
    },
    findLastIndex(e, t) {
        return rt(this, `findLastIndex`, e, t, void 0, arguments)
    },
    forEach(e, t) {
        return rt(this, `forEach`, e, t, void 0, arguments)
    },
    includes(...e) {
        return at(this, `includes`, e)
    },
    indexOf(...e) {
        return at(this, `indexOf`, e)
    },
    join(e) {
        return Ze(this).join(e)
    },
    lastIndexOf(...e) {
        return at(this, `lastIndexOf`, e)
    },
    map(e, t) {
        return rt(this, `map`, e, t, void 0, arguments)
    },
    pop() {
        return ot(this, `pop`)
    },
    push(...e) {
        return ot(this, `push`, e)
    },
    reduce(e, ...t) {
        return it(this, `reduce`, e, t)
    },
    reduceRight(e, ...t) {
        return it(this, `reduceRight`, e, t)
    },
    shift() {
        return ot(this, `shift`)
    },
    some(e, t) {
        return rt(this, `some`, e, t, void 0, arguments)
    },
    splice(...e) {
        return ot(this, `splice`, e)
    },
    toReversed() {
        return Ze(this).toReversed()
    },
    toSorted(e) {
        return Ze(this).toSorted(e)
    },
    toSpliced(...e) {
        return Ze(this).toSpliced(...e)
    },
    unshift(...e) {
        return ot(this, `unshift`, e)
    },
    values() {
        return tt(this, `values`, e => $e(this, e))
    }
};

function tt(e, t, n) {
    let r = Qe(e),
        i = r[t]();
    return r !== e && !L(e) && (i._next = i.next, i.next = () => {
        let e = i._next();
        return e.done || (e.value = n(e.value)), e
    }), i
}
var nt = Array.prototype;

function rt(e, t, n, r, i, a) {
    let o = Qe(e),
        s = o !== e && !L(e),
        c = o[t];
    if (c !== nt[t]) {
        let t = c.apply(e, a);
        return s ? zt(t) : t
    }
    let l = n;
    o !== e && (s ? l = function(t, r) {
        return n.call(this, $e(e, t), r, e)
    } : n.length > 2 && (l = function(t, r) {
        return n.call(this, t, r, e)
    }));
    let u = c.call(o, l, r);
    return s && i ? i(u) : u
}

function it(e, t, n, r) {
    let i = Qe(e),
        a = i !== e && !L(e),
        o = n,
        s = !1;
    i !== e && (a ? (s = r.length === 0, o = function(t, r, i) {
        return s && (s = !1, t = $e(e, t)), n.call(this, t, $e(e, r), i, e)
    }) : n.length > 3 && (o = function(t, r, i) {
        return n.call(this, t, r, i, e)
    }));
    let c = i[t](o, ...r);
    return s ? $e(e, c) : c
}

function at(e, t, n) {
    let r = R(e);
    I(r, `iterate`, Ye);
    let i = r[t](...n);
    return (i === -1 || i === !1) && Lt(n[0]) ? (n[0] = R(n[0]), r[t](...n)) : i
}

function ot(e, t, n = []) {
    F(), je();
    let r = R(e)[t].apply(e, n);
    return Me(), Be(), r
}
var st = e(`__proto__,__v_isRef,__isVue`),
    ct = new Set(Object.getOwnPropertyNames(Symbol).filter(e => e !== `arguments` && e !== `caller`).map(e => Symbol[e]).filter(_));

function lt(e) {
    _(e) || (e = String(e));
    let t = R(this);
    return I(t, `has`, e), t.hasOwnProperty(e)
}
var ut = class {
        constructor(e = !1, t = !1) {
            this._isReadonly = e, this._isShallow = t
        }
        get(e, t, n) {
            if (t === `__v_skip`) return e.__v_skip;
            let r = this._isReadonly,
                i = this._isShallow;
            if (t === `__v_isReactive`) return !r;
            if (t === `__v_isReadonly`) return r;
            if (t === `__v_isShallow`) return i;
            if (t === `__v_raw`) return n === (r ? i ? Ot : Dt : i ? Et : Tt).get(e) || Object.getPrototypeOf(e) === Object.getPrototypeOf(n) ? e : void 0;
            let a = d(e);
            if (!r) {
                let e;
                if (a && (e = et[t])) return e;
                if (t === `hasOwnProperty`) return lt
            }
            let o = Reflect.get(e, t, z(e) ? e : n);
            if ((_(t) ? ct.has(t) : st(t)) || (r || I(e, `get`, t), i)) return o;
            if (z(o)) {
                let e = a && w(t) ? o : o.value;
                return r && v(e) ? Nt(e) : e
            }
            return v(o) ? r ? Nt(o) : jt(o) : o
        }
    },
    dt = class extends ut {
        constructor(e = !1) {
            super(!1, e)
        }
        set(e, t, n, r) {
            let i = e[t],
                a = d(e) && w(t);
            if (!this._isShallow) {
                let e = It(i);
                if (!L(n) && !It(n) && (i = R(i), n = R(n)), !a && z(i) && !z(n)) return e || (i.value = n), !0
            }
            let o = a ? Number(t) < e.length : u(e, t),
                s = Reflect.set(e, t, n, z(e) ? e : r);
            return e === R(r) && (o ? O(n, i) && Xe(e, `set`, t, n, i) : Xe(e, `add`, t, n)), s
        }
        deleteProperty(e, t) {
            let n = u(e, t),
                r = e[t],
                i = Reflect.deleteProperty(e, t);
            return i && n && Xe(e, `delete`, t, void 0, r), i
        }
        has(e, t) {
            let n = Reflect.has(e, t);
            return (!_(t) || !ct.has(t)) && I(e, `has`, t), n
        }
        ownKeys(e) {
            return I(e, `iterate`, d(e) ? `length` : qe), Reflect.ownKeys(e)
        }
    },
    ft = class extends ut {
        constructor(e = !1) {
            super(!0, e)
        }
        set(e, t) {
            return !0
        }
        deleteProperty(e, t) {
            return !0
        }
    },
    pt = new dt,
    mt = new ft,
    ht = new dt(!0),
    gt = e => e,
    _t = e => Reflect.getPrototypeOf(e);

function vt(e, t, n) {
    return function(...r) {
        let i = this.__v_raw,
            a = R(i),
            o = f(a),
            c = e === `entries` || e === Symbol.iterator && o,
            l = e === `keys` && o,
            u = i[e](...r),
            d = n ? gt : t ? Bt : zt;
        return !t && I(a, `iterate`, l ? Je : qe), s(Object.create(u), {
            next() {
                let {
                    value: e,
                    done: t
                } = u.next();
                return t ? {
                    value: e,
                    done: t
                } : {
                    value: c ? [d(e[0]), d(e[1])] : d(e),
                    done: t
                }
            }
        })
    }
}

function yt(e) {
    return function(...t) {
        return e === `delete` ? !1 : e === `clear` ? void 0 : this
    }
}

function bt(e, t) {
    let n = {
        get(n) {
            let r = this.__v_raw,
                i = R(r),
                a = R(n);
            e || (O(n, a) && I(i, `get`, n), I(i, `get`, a));
            let {
                has: o
            } = _t(i), s = t ? gt : e ? Bt : zt;
            if (o.call(i, n)) return s(r.get(n));
            if (o.call(i, a)) return s(r.get(a));
            r !== i && r.get(n)
        },
        get size() {
            let t = this.__v_raw;
            return !e && I(R(t), `iterate`, qe), t.size
        },
        has(t) {
            let n = this.__v_raw,
                r = R(n),
                i = R(t);
            return e || (O(t, i) && I(r, `has`, t), I(r, `has`, i)), t === i ? n.has(t) : n.has(t) || n.has(i)
        },
        forEach(n, r) {
            let i = this,
                a = i.__v_raw,
                o = R(a),
                s = t ? gt : e ? Bt : zt;
            return !e && I(o, `iterate`, qe), a.forEach((e, t) => n.call(r, s(e), s(t), i))
        }
    };
    return s(n, e ? {
        add: yt(`add`),
        set: yt(`set`),
        delete: yt(`delete`),
        clear: yt(`clear`)
    } : {
        add(e) {
            let n = R(this),
                r = _t(n),
                i = R(e),
                a = !t && !L(e) && !It(e) ? i : e;
            return r.has.call(n, a) || O(e, a) && r.has.call(n, e) || O(i, a) && r.has.call(n, i) || (n.add(a), Xe(n, `add`, a, a)), this
        },
        set(e, n) {
            !t && !L(n) && !It(n) && (n = R(n));
            let r = R(this),
                {
                    has: i,
                    get: a
                } = _t(r),
                o = i.call(r, e);
            o ||= (e = R(e), i.call(r, e));
            let s = a.call(r, e);
            return r.set(e, n), o ? O(n, s) && Xe(r, `set`, e, n, s) : Xe(r, `add`, e, n), this
        },
        delete(e) {
            let t = R(this),
                {
                    has: n,
                    get: r
                } = _t(t),
                i = n.call(t, e);
            i ||= (e = R(e), n.call(t, e));
            let a = r ? r.call(t, e) : void 0,
                o = t.delete(e);
            return i && Xe(t, `delete`, e, void 0, a), o
        },
        clear() {
            let e = R(this),
                t = e.size !== 0,
                n = e.clear();
            return t && Xe(e, `clear`, void 0, void 0, void 0), n
        }
    }), [`keys`, `values`, `entries`, Symbol.iterator].forEach(r => {
        n[r] = vt(r, e, t)
    }), n
}

function xt(e, t) {
    let n = bt(e, t);
    return (t, r, i) => r === `__v_isReactive` ? !e : r === `__v_isReadonly` ? e : r === `__v_raw` ? t : Reflect.get(u(n, r) && r in t ? n : t, r, i)
}
var St = {
        get: xt(!1, !1)
    },
    Ct = {
        get: xt(!1, !0)
    },
    wt = {
        get: xt(!0, !1)
    },
    Tt = new WeakMap,
    Et = new WeakMap,
    Dt = new WeakMap,
    Ot = new WeakMap;

function kt(e) {
    switch (e) {
        case `Object`:
        case `Array`:
            return 1;
        case `Map`:
        case `Set`:
        case `WeakMap`:
        case `WeakSet`:
            return 2;
        default:
            return 0
    }
}

function At(e) {
    return e.__v_skip || !Object.isExtensible(e) ? 0 : kt(S(e))
}

function jt(e) {
    return It(e) ? e : Pt(e, !1, pt, St, Tt)
}

function Mt(e) {
    return Pt(e, !1, ht, Ct, Et)
}

function Nt(e) {
    return Pt(e, !0, mt, wt, Dt)
}

function Pt(e, t, n, r, i) {
    if (!v(e) || e.__v_raw && !(t && e.__v_isReactive)) return e;
    let a = At(e);
    if (a === 0) return e;
    let o = i.get(e);
    if (o) return o;
    let s = new Proxy(e, a === 2 ? r : n);
    return i.set(e, s), s
}

function Ft(e) {
    return It(e) ? Ft(e.__v_raw) : !!(e && e.__v_isReactive)
}

function It(e) {
    return !!(e && e.__v_isReadonly)
}

function L(e) {
    return !!(e && e.__v_isShallow)
}

function Lt(e) {
    return e ? !!e.__v_raw : !1
}

function R(e) {
    let t = e && e.__v_raw;
    return t ? R(t) : e
}

function Rt(e) {
    return !u(e, `__v_skip`) && Object.isExtensible(e) && k(e, `__v_skip`, !0), e
}
var zt = e => v(e) ? jt(e) : e,
    Bt = e => v(e) ? Nt(e) : e;

function z(e) {
    return e ? e.__v_isRef === !0 : !1
}

function B(e) {
    return Vt(e, !1)
}

function Vt(e, t) {
    return z(e) ? e : new Ht(e, t)
}
var Ht = class {
    constructor(e, t) {
        this.dep = new We, this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = t ? e : R(e), this._value = t ? e : zt(e), this.__v_isShallow = t
    }
    get value() {
        return this.dep.track(), this._value
    }
    set value(e) {
        let t = this._rawValue,
            n = this.__v_isShallow || L(e) || It(e);
        e = n ? e : R(e), O(e, t) && (this._rawValue = e, this._value = n ? e : zt(e), this.dep.trigger())
    }
};

function Ut(e) {
    return z(e) ? e.value : e
}
var Wt = {
    get: (e, t, n) => t === `__v_raw` ? e : Ut(Reflect.get(e, t, n)),
    set: (e, t, n, r) => {
        let i = e[t];
        return z(i) && !z(n) ? (i.value = n, !0) : Reflect.set(e, t, n, r)
    }
};

function Gt(e) {
    return Ft(e) ? e : new Proxy(e, Wt)
}
var Kt = class {
    constructor(e, t, n) {
        this.fn = e, this.setter = t, this._value = void 0, this.dep = new We(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = He - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !t, this.isSSR = n
    }
    notify() {
        if (this.flags |= 16, !(this.flags & 8) && N !== this) return Ae(this, !0), !0
    }
    get value() {
        let e = this.dep.track();
        return Ie(this), e && (e.version = this.dep.version), this._value
    }
    set value(e) {
        this.setter && this.setter(e)
    }
};

function qt(e, t, n = !1) {
    let r, i;
    return h(e) ? r = e : (r = e.get, i = e.set), new Kt(r, i, n)
}
var Jt = {},
    Yt = new WeakMap,
    Xt = void 0;

function Zt(e, t = !1, n = Xt) {
    if (n) {
        let t = Yt.get(n);
        t || Yt.set(n, t = []), t.push(e)
    }
}

function Qt(e, n, i = t) {
    let {
        immediate: a,
        deep: o,
        once: s,
        scheduler: l,
        augmentJob: u,
        call: f
    } = i, p = e => o ? e : L(e) || o === !1 || o === 0 ? $t(e, 1) : $t(e), m, g, _, v, y = !1, b = !1;
    if (z(e) ? (g = () => e.value, y = L(e)) : Ft(e) ? (g = () => p(e), y = !0) : d(e) ? (b = !0, y = e.some(e => Ft(e) || L(e)), g = () => e.map(e => {
            if (z(e)) return e.value;
            if (Ft(e)) return p(e);
            if (h(e)) return f ? f(e, 2) : e()
        })) : g = h(e) ? n ? f ? () => f(e, 2) : e : () => {
            if (_) {
                F();
                try {
                    _()
                } finally {
                    Be()
                }
            }
            let t = Xt;
            Xt = m;
            try {
                return f ? f(e, 3, [v]) : e(v)
            } finally {
                Xt = t
            }
        } : r, n && o) {
        let e = g,
            t = o === !0 ? 1 / 0 : o;
        g = () => $t(e(), t)
    }
    let x = we(),
        S = () => {
            m.stop(), x && x.active && c(x.effects, m)
        };
    if (s && n) {
        let e = n;
        n = (...t) => {
            e(...t), S()
        }
    }
    let C = b ? Array(e.length).fill(Jt) : Jt,
        w = e => {
            if (!(!(m.flags & 1) || !m.dirty && !e))
                if (n) {
                    let e = m.run();
                    if (o || y || (b ? e.some((e, t) => O(e, C[t])) : O(e, C))) {
                        _ && _();
                        let t = Xt;
                        Xt = m;
                        try {
                            let t = [e, C === Jt ? void 0 : b && C[0] === Jt ? [] : C, v];
                            C = e, f ? f(n, 3, t) : n(...t)
                        } finally {
                            Xt = t
                        }
                    }
                } else m.run()
        };
    return u && u(w), m = new Ee(g), m.scheduler = l ? () => l(w, !1) : w, v = e => Zt(e, !1, m), _ = m.onStop = () => {
        let e = Yt.get(m);
        if (e) {
            if (f) f(e, 4);
            else
                for (let t of e) t();
            Yt.delete(m)
        }
    }, n ? a ? w(!0) : C = m.run() : l ? l(w.bind(null, !0), !0) : m.run(), S.pause = m.pause.bind(m), S.resume = m.resume.bind(m), S.stop = S, S
}

function $t(e, t = 1 / 0, n) {
    if (t <= 0 || !v(e) || e.__v_skip || (n ||= new Map, (n.get(e) || 0) >= t)) return e;
    if (n.set(e, t), t--, z(e)) $t(e.value, t, n);
    else if (d(e))
        for (let r = 0; r < e.length; r++) $t(e[r], t, n);
    else if (p(e) || f(e)) e.forEach(e => {
        $t(e, t, n)
    });
    else if (C(e)) {
        for (let r in e) $t(e[r], t, n);
        for (let r of Object.getOwnPropertySymbols(e)) Object.prototype.propertyIsEnumerable.call(e, r) && $t(e[r], t, n)
    }
    return e
}

function en(e, t, n, r) {
    try {
        return r ? e(...r) : e()
    } catch (e) {
        nn(e, t, n)
    }
}

function tn(e, t, n, r) {
    if (h(e)) {
        let i = en(e, t, n, r);
        return i && y(i) && i.catch(e => {
            nn(e, t, n)
        }), i
    }
    if (d(e)) {
        let i = [];
        for (let a = 0; a < e.length; a++) i.push(tn(e[a], t, n, r));
        return i
    }
}

function nn(e, n, r, i = !0) {
    let a = n ? n.vnode : null,
        {
            errorHandler: o,
            throwUnhandledErrorInProduction: s
        } = n && n.appContext.config || t;
    if (n) {
        let t = n.parent,
            i = n.proxy,
            a = `https://vuejs.org/error-reference/#runtime-${r}`;
        for (; t;) {
            let n = t.ec;
            if (n) {
                for (let t = 0; t < n.length; t++)
                    if (n[t](e, i, a) === !1) return
            }
            t = t.parent
        }
        if (o) {
            F(), en(o, null, 10, [e, i, a]), Be();
            return
        }
    }
    rn(e, r, a, i, s)
}

function rn(e, t, n, r = !0, i = !1) {
    if (i) throw e;
    console.error(e)
}
var V = [],
    an = -1,
    on = [],
    sn = null,
    cn = 0,
    ln = Promise.resolve(),
    un = null;

function dn(e) {
    let t = un || ln;
    return e ? t.then(this ? e.bind(this) : e) : t
}

function fn(e) {
    let t = an + 1,
        n = V.length;
    for (; t < n;) {
        let r = t + n >>> 1,
            i = V[r],
            a = vn(i);
        a < e || a === e && i.flags & 2 ? t = r + 1 : n = r
    }
    return t
}

function pn(e) {
    if (!(e.flags & 1)) {
        let t = vn(e),
            n = V[V.length - 1];
        !n || !(e.flags & 2) && t >= vn(n) ? V.push(e) : V.splice(fn(t), 0, e), e.flags |= 1, mn()
    }
}

function mn() {
    un ||= ln.then(yn)
}

function hn(e) {
    d(e) ? on.push(...e) : sn && e.id === -1 ? sn.splice(cn + 1, 0, e) : e.flags & 1 || (on.push(e), e.flags |= 1), mn()
}

function gn(e, t, n = an + 1) {
    for (; n < V.length; n++) {
        let t = V[n];
        if (t && t.flags & 2) {
            if (e && t.id !== e.uid) continue;
            V.splice(n, 1), n--, t.flags & 4 && (t.flags &= -2), t(), t.flags & 4 || (t.flags &= -2)
        }
    }
}

function _n(e) {
    if (on.length) {
        let e = [...new Set(on)].sort((e, t) => vn(e) - vn(t));
        if (on.length = 0, sn) {
            sn.push(...e);
            return
        }
        for (sn = e, cn = 0; cn < sn.length; cn++) {
            let e = sn[cn];
            e.flags & 4 && (e.flags &= -2), e.flags & 8 || e(), e.flags &= -2
        }
        sn = null, cn = 0
    }
}
var vn = e => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;

function yn(e) {
    try {
        for (an = 0; an < V.length; an++) {
            let e = V[an];
            e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), en(e, e.i, e.i ? 15 : 14), e.flags & 4 || (e.flags &= -2))
        }
    } finally {
        for (; an < V.length; an++) {
            let e = V[an];
            e && (e.flags &= -2)
        }
        an = -1, V.length = 0, _n(e), un = null, (V.length || on.length) && yn(e)
    }
}
var H = null,
    bn = null;

function xn(e) {
    let t = H;
    return H = e, bn = e && e.type.__scopeId || null, t
}

function Sn(e, t = H, n) {
    if (!t || e._n) return e;
    let r = (...n) => {
        r._d && Ri(-1);
        let i = xn(t),
            a;
        try {
            a = e(...n)
        } finally {
            xn(i), r._d && Ri(1)
        }
        return a
    };
    return r._n = !0, r._c = !0, r._d = !0, r
}

function Cn(e, n) {
    if (H === null) return e;
    let r = ya(H),
        i = e.dirs ||= [];
    for (let e = 0; e < n.length; e++) {
        let [a, o, s, c = t] = n[e];
        a && (h(a) && (a = {
            mounted: a,
            updated: a
        }), a.deep && $t(o), i.push({
            dir: a,
            instance: r,
            value: o,
            oldValue: void 0,
            arg: s,
            modifiers: c
        }))
    }
    return e
}

function wn(e, t, n, r) {
    let i = e.dirs,
        a = t && t.dirs;
    for (let o = 0; o < i.length; o++) {
        let s = i[o];
        a && (s.oldValue = a[o].value);
        let c = s.dir[r];
        c && (F(), tn(c, n, 8, [e.el, s, e, t]), Be())
    }
}

function Tn(e, t) {
    if (Z) {
        let n = Z.provides,
            r = Z.parent && Z.parent.provides;
        r === n && (n = Z.provides = Object.create(r)), n[e] = t
    }
}

function En(e, t, n = !1) {
    let r = ia();
    if (r || Ur) {
        let i = Ur ? Ur._context.provides : r ? r.parent == null || r.ce ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides : void 0;
        if (i && e in i) return i[e];
        if (arguments.length > 1) return n && h(t) ? t.call(r && r.proxy) : t
    }
}
var Dn = Symbol.for(`v-scx`),
    On = () => En(Dn);

function kn(e, t, n) {
    return An(e, t, n)
}

function An(e, n, i = t) {
    let {
        immediate: a,
        deep: o,
        flush: c,
        once: l
    } = i, u = s({}, i), d = n && a || !n && c !== `post`, f;
    if (ua) {
        if (c === `sync`) {
            let e = On();
            f = e.__watcherHandles ||= []
        } else if (!d) {
            let e = () => {};
            return e.stop = r, e.resume = r, e.pause = r, e
        }
    }
    let p = Z;
    u.call = (e, t, n) => tn(e, p, t, n);
    let m = !1;
    c === `post` ? u.scheduler = e => {
        W(e, p && p.suspense)
    } : c !== `sync` && (m = !0, u.scheduler = (e, t) => {
        t ? e() : pn(e)
    }), u.augmentJob = e => {
        n && (e.flags |= 4), m && (e.flags |= 2, p && (e.id = p.uid, e.i = p))
    };
    let h = Qt(e, n, u);
    return ua && (f ? f.push(h) : d && h()), h
}

function jn(e, t, n) {
    let r = this.proxy,
        i = g(e) ? e.includes(`.`) ? Mn(r, e) : () => r[e] : e.bind(r, r),
        a;
    h(t) ? a = t : (a = t.handler, n = t);
    let o = sa(this),
        s = An(i, a.bind(r), n);
    return o(), s
}

function Mn(e, t) {
    let n = t.split(`.`);
    return () => {
        let t = e;
        for (let e = 0; e < n.length && t; e++) t = t[n[e]];
        return t
    }
}
var Nn = new WeakMap,
    Pn = Symbol(`_vte`),
    Fn = e => e.__isTeleport,
    In = e => e && (e.disabled || e.disabled === ``),
    Ln = e => e && (e.defer || e.defer === ``),
    Rn = e => typeof SVGElement < `u` && e instanceof SVGElement,
    zn = e => typeof MathMLElement == `function` && e instanceof MathMLElement,
    Bn = (e, t) => {
        let n = e && e.to;
        return g(n) ? t ? t(n) : null : n
    },
    Vn = {
        name: `Teleport`,
        __isTeleport: !0,
        process(e, t, n, r, i, a, o, s, c, l) {
            let {
                mc: u,
                pc: d,
                pbc: f,
                o: {
                    insert: p,
                    querySelector: m,
                    createText: h,
                    createComment: g
                }
            } = l, _ = In(t.props), {
                dynamicChildren: v
            } = t, y = (e, t, n) => {
                e.shapeFlag & 16 && u(e.children, t, n, i, a, o, s, c)
            }, b = (e = t) => {
                let n = In(e.props),
                    r = e.target = Bn(e.props, m),
                    a = Kn(r, e, h, p);
                r && (o !== `svg` && Rn(r) ? o = `svg` : o !== `mathml` && zn(r) && (o = `mathml`), i && i.isCE && (i.ce._teleportTargets || (i.ce._teleportTargets = new Set)).add(r), n || (y(e, r, a), Gn(e, !1)))
            }, x = e => {
                let t = () => {
                    Nn.get(e) === t && (Nn.delete(e), In(e.props) && (y(e, n, e.anchor), Gn(e, !0)), b(e))
                };
                Nn.set(e, t), W(t, a)
            };
            if (e == null) {
                let e = t.el = h(``),
                    i = t.anchor = h(``);
                if (p(e, n, r), p(i, n, r), Ln(t.props) || a && a.pendingBranch) {
                    x(t);
                    return
                }
                _ && (y(t, n, i), Gn(t, !0)), b()
            } else {
                t.el = e.el;
                let r = t.anchor = e.anchor,
                    u = Nn.get(e);
                if (u) {
                    u.flags |= 8, Nn.delete(e), x(t);
                    return
                }
                t.targetStart = e.targetStart;
                let p = t.target = e.target,
                    h = t.targetAnchor = e.targetAnchor,
                    g = In(e.props),
                    y = g ? n : p,
                    b = g ? r : h;
                if (o === `svg` || Rn(p) ? o = `svg`
                    : (o === `mathml` || zn(p)) && (o = `mathml`),
                    v ? (f(e.dynamicChildren, v, y, i, a, o, s), Ti(e, t, !0))
                    : c || d(e, t, y, b, i, a, o, s, !1),
                    _)
                    g ? t.props && e.props && t.props.to !== e.props.to &&
                        (t.props.to = e.props.to)
                    : Hn(t, n, r, l, 1);
                else if ((t.props && t.props.to) !== (e.props && e.props.to)) {
                    let e = t.target = Bn(t.props, m);
                    e && Hn(t, e, null, l, 0)
                } else g && Hn(t, p, h, l, 1);
                Gn(t, _)
            }
        },
        remove(e, t, n, {
            um: r,
            o: {
                remove: i
            }
        }, a) {
            let {
                shapeFlag: o,
                children: s,
                anchor: c,
                targetStart: l,
                targetAnchor: u,
                target: d,
                props: f
            } = e, p = a || !In(f), m = Nn.get(e);
            if (m && (m.flags |= 8, Nn.delete(e), p = !1), d && (i(l), i(u)), a && i(c), o & 16)
                for (let e = 0; e < s.length; e++) {
                    let i = s[e];
                    r(i, t, n, p, !!i.dynamicChildren)
                }
        },
        move: Hn,
        hydrate: Un
    };

function Hn(e, t, n, {
    o: {
        insert: r
    },
    m: i
}, a = 2) {
    a === 0 && r(e.targetAnchor, t, n);
    let {
        el: o,
        anchor: s,
        shapeFlag: c,
        children: l,
        props: u
    } = e, d = a === 2;
    if (d && r(o, t, n), (!d || In(u)) && c & 16)
        for (let e = 0; e < l.length; e++) i(l[e], t, n, 2);
    d && r(s, t, n)
}

function Un(e, t, n, r, i, a, {
    o: {
        nextSibling: o,
        parentNode: s,
        querySelector: c,
        insert: l,
        createText: u
    }
}, d) {
    function f(e, n) {
        let r = n;
        for (; r;) {
            if (r && r.nodeType === 8) {
                if (r.data === `teleport start anchor`) t.targetStart = r;
                else if (r.data === `teleport anchor`) {
                    t.targetAnchor = r, e._lpa = t.targetAnchor && o(t.targetAnchor);
                    break
                }
            }
            r = o(r)
        }
    }

    function p(e, t) {
        t.anchor = d(o(e), t, s(e), n, r, i, a)
    }
    let m = t.target = Bn(t.props, c),
        h = In(t.props);
    if (m) {
        let c = m._lpa || m.firstChild;
        t.shapeFlag & 16 && (h ? (p(e, t), f(m, c), t.targetAnchor || Kn(m, t, u, l, s(e) === m ? e : null)) : (t.anchor = o(e), f(m, c), t.targetAnchor || Kn(m, t, u, l), d(c && o(c), t, m, n, r, i, a))), Gn(t, h)
    } else h && t.shapeFlag & 16 && (p(e, t), t.targetStart = e, t.targetAnchor = o(e));
    return t.anchor && o(t.anchor)
}
var Wn = Vn;

function Gn(e, t) {
    let n = e.ctx;
    if (n && n.ut) {
        let r, i;
        for (t ? (r = e.el, i = e.anchor) : (r = e.targetStart, i = e.targetAnchor); r && r !== i;) r.nodeType === 1 && r.setAttribute(`data-v-owner`, n.uid), r = r.nextSibling;
        n.ut()
    }
}

function Kn(e, t, n, r, i = null) {
    let a = t.targetStart = n(``),
        o = t.targetAnchor = n(``);
    return a[Pn] = o, e && (r(a, e, i), r(o, e, i)), o
}
var qn = Symbol(`_leaveCb`);

function Jn(e, t) {
    e.shapeFlag & 6 && e.component ? (e.transition = t, Jn(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t
}

function Yn(e, t) {
    return h(e) ? s({
        name: e.name
    }, t, {
        setup: e
    }) : e
}

function Xn(e) {
    e.ids = [e.ids[0] + e.ids[2]++ + `-`, 0, 0]
}

function Zn(e, t) {
    let n;
    return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable)
}
var Qn = new WeakMap;

function $n(e, n, r, a, o = !1) {
    if (d(e)) {
        e.forEach((e, t) => $n(e, n && (d(n) ? n[t] : n), r, a, o));
        return
    }
    if (tr(a) && !o) {
        a.shapeFlag & 512 && a.type.__asyncResolved && a.component.subTree.component && $n(e, n, r, a.component.subTree);
        return
    }
    let s = a.shapeFlag & 4 ? ya(a.component) : a.el,
        l = o ? null : s,
        {
            i: f,
            r: p
        } = e,
        m = n && n.r,
        _ = f.refs === t ? f.refs = {} : f.refs,
        v = f.setupState,
        y = R(v),
        b = v === t ? i : e => Zn(_, e) ? !1 : u(y, e),
        x = (e, t) => !(t && Zn(_, t));
    if (m != null && m !== p) {
        if (er(n), g(m)) _[m] = null, b(m) && (v[m] = null);
        else if (z(m)) {
            let e = n;
            x(m, e.k) && (m.value = null), e.k && (_[e.k] = null)
        }
    }
    if (h(p)) en(p, f, 12, [l, _]);
    else {
        let t = g(p),
            n = z(p);
        if (t || n) {
            let i = () => {
                if (e.f) {
                    let n = t ? b(p) ? v[p] : _[p] : x(p) || !e.k ? p.value : _[e.k];
                    if (o) d(n) && c(n, s);
                    else if (d(n)) n.includes(s) || n.push(s);
                    else if (t) _[p] = [s], b(p) && (v[p] = _[p]);
                    else {
                        let t = [s];
                        x(p, e.k) && (p.value = t), e.k && (_[e.k] = t)
                    }
                } else t ? (_[p] = l, b(p) && (v[p] = l)) : n && (x(p, e.k) && (p.value = l), e.k && (_[e.k] = l))
            };
            if (l) {
                let t = () => {
                    i(), Qn.delete(e)
                };
                t.id = -1, Qn.set(e, t), W(t, r)
            } else er(e), i()
        }
    }
}

function er(e) {
    let t = Qn.get(e);
    t && (t.flags |= 8, Qn.delete(e))
}
ce().requestIdleCallback, ce().cancelIdleCallback;
var tr = e => !!e.type.__asyncLoader,
    nr = e => e.type.__isKeepAlive;

function rr(e, t) {
    ar(e, `a`, t)
}

function ir(e, t) {
    ar(e, `da`, t)
}

function ar(e, t, n = Z) {
    let r = e.__wdc ||= () => {
        let t = n;
        for (; t;) {
            if (t.isDeactivated) return;
            t = t.parent
        }
        return e()
    };
    if (sr(t, r, n), n) {
        let e = n.parent;
        for (; e && e.parent;) nr(e.parent.vnode) && or(r, t, n, e), e = e.parent
    }
}

function or(e, t, n, r) {
    let i = sr(t, e, r, !0);
    mr(() => {
        c(r[t], i)
    }, n)
}

function sr(e, t, n = Z, r = !1) {
    if (n) {
        let i = n[e] || (n[e] = []),
            a = t.__weh ||= (...r) => {
                F();
                let i = sa(n),
                    a = tn(t, n, e, r);
                return i(), Be(), a
            };
        return r ? i.unshift(a) : i.push(a), a
    }
}
var cr = e => (t, n = Z) => {
        (!ua || e === `sp`) && sr(e, (...e) => t(...e), n)
    },
    lr = cr(`bm`),
    ur = cr(`m`),
    dr = cr(`bu`),
    fr = cr(`u`),
    pr = cr(`bum`),
    mr = cr(`um`),
    hr = cr(`sp`),
    gr = cr(`rtg`),
    _r = cr(`rtc`);

function vr(e, t = Z) {
    sr(`ec`, e, t)
}
var yr = Symbol.for(`v-ndc`);

function br(e, t, n, r) {
    let i, a = n && n[r],
        o = d(e);
    if (o || g(e)) {
        let n = o && Ft(e),
            r = !1,
            s = !1;
        n && (r = !L(e), s = It(e), e = Qe(e)), i = Array(e.length);
        for (let n = 0, o = e.length; n < o; n++) i[n] = t(r ? s ? Bt(zt(e[n])) : zt(e[n]) : e[n], n, void 0, a && a[n])
    } else if (typeof e == `number`) {
        i = Array(e);
        for (let n = 0; n < e; n++) i[n] = t(n + 1, n, void 0, a && a[n])
    } else if (v(e))
        if (e[Symbol.iterator]) i = Array.from(e, (e, n) => t(e, n, void 0, a && a[n]));
        else {
            let n = Object.keys(e);
            i = Array(n.length);
            for (let r = 0, o = n.length; r < o; r++) {
                let o = n[r];
                i[r] = t(e[o], o, r, a && a[r])
            }
        }
    else i = [];
    return n && (n[r] = i), i
}
var xr = e => e ? la(e) ? ya(e) : xr(e.parent) : null,
    Sr = s(Object.create(null), {
        $: e => e,
        $el: e => e.vnode.el,
        $data: e => e.data,
        $props: e => e.props,
        $attrs: e => e.attrs,
        $slots: e => e.slots,
        $refs: e => e.refs,
        $parent: e => xr(e.parent),
        $root: e => xr(e.root),
        $host: e => e.ce,
        $emit: e => e.emit,
        $options: e => jr(e),
        $forceUpdate: e => e.f ||= () => {
            pn(e.update)
        },
        $nextTick: e => e.n ||= dn.bind(e.proxy),
        $watch: e => jn.bind(e)
    }),
    Cr = (e, n) => e !== t && !e.__isScriptSetup && u(e, n),
    wr = {
        get({
            _: e
        }, n) {
            if (n === `__v_skip`) return !0;
            let {
                ctx: r,
                setupState: i,
                data: a,
                props: o,
                accessCache: s,
                type: c,
                appContext: l
            } = e;
            if (n[0] !== `$`) {
                let e = s[n];
                if (e !== void 0) switch (e) {
                        case 1:
                            return i[n];
                        case 2:
                            return a[n];
                        case 4:
                            return r[n];
                        case 3:
                            return o[n]
                    } else if (Cr(i, n)) return s[n] = 1, i[n];
                    else if (a !== t && u(a, n)) return s[n] = 2, a[n];
                else if (u(o, n)) return s[n] = 3, o[n];
                else if (r !== t && u(r, n)) return s[n] = 4, r[n];
                else Er && (s[n] = 0)
            }
            let d = Sr[n],
                f, p;
            if (d) return n === `$attrs` && I(e.attrs, `get`, ``), d(e);
            if ((f = c.__cssModules) && (f = f[n])) return f;
            if (r !== t && u(r, n)) return s[n] = 4, r[n];
            if (p = l.config.globalProperties, u(p, n)) return p[n]
        },
        set({
            _: e
        }, n, r) {
            let {
                data: i,
                setupState: a,
                ctx: o
            } = e;
            return Cr(a, n) ? (a[n] = r, !0) : i !== t && u(i, n) ? (i[n] = r, !0) : u(e.props, n) || n[0] === `$` && n.slice(1) in e ? !1 : (o[n] = r, !0)
        },
        has({
            _: {
                data: e,
                setupState: n,
                accessCache: r,
                ctx: i,
                appContext: a,
                props: o,
                type: s
            }
        }, c) {
            let l;
            return !!(r[c] || e !== t && c[0] !== `$` && u(e, c) || Cr(n, c) || u(o, c) || u(i, c) || u(Sr, c) || u(a.config.globalProperties, c) || (l = s.__cssModules) && l[c])
        },
        defineProperty(e, t, n) {
            return n.get == null ? u(n, `value`) && this.set(e, t, n.value, null) : e._.accessCache[t] = 0, Reflect.defineProperty(e, t, n)
        }
    };

function Tr(e) {
    return d(e) ? e.reduce((e, t) => (e[t] = null, e), {}) : e
}
var Er = !0;

function Dr(e) {
    let t = jr(e),
        n = e.proxy,
        i = e.ctx;
    Er = !1, t.beforeCreate && kr(t.beforeCreate, e, `bc`);
    let {
        data: a,
        computed: o,
        methods: s,
        watch: c,
        provide: l,
        inject: u,
        created: f,
        beforeMount: p,
        mounted: m,
        beforeUpdate: g,
        updated: _,
        activated: y,
        deactivated: b,
        beforeDestroy: x,
        beforeUnmount: S,
        destroyed: C,
        unmounted: w,
        render: ee,
        renderTracked: T,
        renderTriggered: te,
        errorCaptured: E,
        serverPrefetch: ne,
        expose: D,
        inheritAttrs: re,
        components: ie,
        directives: O,
        filters: ae
    } = t;
    if (u && Or(u, i, null), s)
        for (let e in s) {
            let t = s[e];
            h(t) && (i[e] = t.bind(n))
        }
    if (a) {
        let t = a.call(n, n);
        v(t) && (e.data = jt(t))
    }
    if (Er = !0, o)
        for (let e in o) {
            let t = o[e],
                a = Q({
                    get: h(t) ? t.bind(n, n) : h(t.get) ? t.get.bind(n, n) : r,
                    set: !h(t) && h(t.set) ? t.set.bind(n) : r
                });
            Object.defineProperty(i, e, {
                enumerable: !0,
                configurable: !0,
                get: () => a.value,
                set: e => a.value = e
            })
        }
    if (c)
        for (let e in c) Ar(c[e], i, n, e);
    if (l) {
        let e = h(l) ? l.call(n) : l;
        Reflect.ownKeys(e).forEach(t => {
            Tn(t, e[t])
        })
    }
    f && kr(f, e, `c`);

    function k(e, t) {
        d(t) ? t.forEach(t => e(t.bind(n))) : t && e(t.bind(n))
    }
    if (k(lr, p), k(ur, m), k(dr, g), k(fr, _), k(rr, y), k(ir, b), k(vr, E), k(_r, T), k(gr, te), k(pr, S), k(mr, w), k(hr, ne), d(D))
        if (D.length) {
            let t = e.exposed ||= {};
            D.forEach(e => {
                Object.defineProperty(t, e, {
                    get: () => n[e],
                    set: t => n[e] = t,
                    enumerable: !0
                })
            })
        } else e.exposed ||= {};
    ee && e.render === r && (e.render = ee), re != null && (e.inheritAttrs = re), ie && (e.components = ie), O && (e.directives = O), ne && Xn(e)
}

function Or(e, t, n = r) {
    d(e) && (e = Ir(e));
    for (let n in e) {
        let r = e[n],
            i;
        i = v(r) ? `default` in r ? En(r.from || n, r.default, !0) : En(r.from || n) : En(r), z(i) ? Object.defineProperty(t, n, {
            enumerable: !0,
            configurable: !0,
            get: () => i.value,
            set: e => i.value = e
        }) : t[n] = i
    }
}

function kr(e, t, n) {
    tn(d(e) ? e.map(e => e.bind(t.proxy)) : e.bind(t.proxy), t, n)
}

function Ar(e, t, n, r) {
    let i = r.includes(`.`) ? Mn(n, r) : () => n[r];
    if (g(e)) {
        let n = t[e];
        h(n) && kn(i, n)
    } else if (h(e)) kn(i, e.bind(n));
    else if (v(e))
        if (d(e)) e.forEach(e => Ar(e, t, n, r));
        else {
            let r = h(e.handler) ? e.handler.bind(n) : t[e.handler];
            h(r) && kn(i, r, e)
        }
}

function jr(e) {
    let t = e.type,
        {
            mixins: n,
            extends: r
        } = t,
        {
            mixins: i,
            optionsCache: a,
            config: {
                optionMergeStrategies: o
            }
        } = e.appContext,
        s = a.get(t),
        c;
    return s ? c = s : !i.length && !n && !r ? c = t : (c = {}, i.length && i.forEach(e => Mr(c, e, o, !0)), Mr(c, t, o)), v(t) && a.set(t, c), c
}

function Mr(e, t, n, r = !1) {
    let {
        mixins: i,
        extends: a
    } = t;
    a && Mr(e, a, n, !0), i && i.forEach(t => Mr(e, t, n, !0));
    for (let i in t)
        if (!(r && i === `expose`)) {
            let r = Nr[i] || n && n[i];
            e[i] = r ? r(e[i], t[i]) : t[i]
        } return e
}
var Nr = {
    data: Pr,
    props: Rr,
    emits: Rr,
    methods: Lr,
    computed: Lr,
    beforeCreate: U,
    created: U,
    beforeMount: U,
    mounted: U,
    beforeUpdate: U,
    updated: U,
    beforeDestroy: U,
    beforeUnmount: U,
    destroyed: U,
    unmounted: U,
    activated: U,
    deactivated: U,
    errorCaptured: U,
    serverPrefetch: U,
    components: Lr,
    directives: Lr,
    watch: zr,
    provide: Pr,
    inject: Fr
};

function Pr(e, t) {
    return t ? e ? function() {
        return s(h(e) ? e.call(this, this) : e, h(t) ? t.call(this, this) : t)
    } : t : e
}

function Fr(e, t) {
    return Lr(Ir(e), Ir(t))
}

function Ir(e) {
    if (d(e)) {
        let t = {};
        for (let n = 0; n < e.length; n++) t[e[n]] = e[n];
        return t
    }
    return e
}

function U(e, t) {
    return e ? [...new Set([].concat(e, t))] : t
}

function Lr(e, t) {
    return e ? s(Object.create(null), e, t) : t
}

function Rr(e, t) {
    return e ? d(e) && d(t) ? [...new Set([...e, ...t])] : s(Object.create(null), Tr(e), Tr(t ?? {})) : t
}

function zr(e, t) {
    if (!e) return t;
    if (!t) return e;
    let n = s(Object.create(null), e);
    for (let r in t) n[r] = U(e[r], t[r]);
    return n
}

function Br() {
    return {
        app: null,
        config: {
            isNativeTag: i,
            performance: !1,
            globalProperties: {},
            optionMergeStrategies: {},
            errorHandler: void 0,
            warnHandler: void 0,
            compilerOptions: {}
        },
        mixins: [],
        components: {},
        directives: {},
        provides: Object.create(null),
        optionsCache: new WeakMap,
        propsCache: new WeakMap,
        emitsCache: new WeakMap
    }
}
var Vr = 0;

function Hr(e, t) {
    return function(n, r = null) {
        h(n) || (n = s({}, n)), r != null && !v(r) && (r = null);
        let i = Br(),
            a = new WeakSet,
            o = [],
            c = !1,
            l = i.app = {
                _uid: Vr++,
                _component: n,
                _props: r,
                _container: null,
                _context: i,
                _instance: null,
                version: xa,
                get config() {
                    return i.config
                },
                set config(e) {},
                use(e, ...t) {
                    return a.has(e) || (e && h(e.install) ? (a.add(e), e.install(l, ...t)) : h(e) && (a.add(e), e(l, ...t))), l
                },
                mixin(e) {
                    return i.mixins.includes(e) || i.mixins.push(e), l
                },
                component(e, t) {
                    return t ? (i.components[e] = t, l) : i.components[e]
                },
                directive(e, t) {
                    return t ? (i.directives[e] = t, l) : i.directives[e]
                },
                mount(a, o, s) {
                    if (!c) {
                        let u = l._ceVNode || Gi(n, r);
                        return u.appContext = i, s === !0 ? s = `svg` : s === !1 && (s = void 0), o && t ? t(u, a) : e(u, a, s), c = !0, l._container = a, a.__vue_app__ = l, ya(u.component)
                    }
                },
                onUnmount(e) {
                    o.push(e)
                },
                unmount() {
                    c && (tn(o, l._instance, 16), e(null, l._container), delete l._container.__vue_app__)
                },
                provide(e, t) {
                    return i.provides[e] = t, l
                },
                runWithContext(e) {
                    let t = Ur;
                    Ur = l;
                    try {
                        return e()
                    } finally {
                        Ur = t
                    }
                }
            };
        return l
    }
}
var Ur = null,
    Wr = (e, t) => t === `modelValue` || t === `model-value` ? e.modelModifiers : e[`${t}Modifiers`] || e[`${E(t)}Modifiers`] || e[`${D(t)}Modifiers`];

function Gr(e, n, ...r) {
    if (e.isUnmounted) return;
    let i = e.vnode.props || t,
        a = r,
        o = n.startsWith(`update:`),
        s = o && Wr(i, n.slice(7));
    s && (s.trim && (a = r.map(e => g(e) ? e.trim() : e)), s.number && (a = r.map(oe)));
    let c, l = i[c = ie(n)] || i[c = ie(E(n))];
    !l && o && (l = i[c = ie(D(n))]), l && tn(l, e, 6, a);
    let u = i[c + `Once`];
    if (u) {
        if (!e.emitted) e.emitted = {};
        else if (e.emitted[c]) return;
        e.emitted[c] = !0, tn(u, e, 6, a)
    }
}
var Kr = new WeakMap;

function qr(e, t, n = !1) {
    let r = n ? Kr : t.emitsCache,
        i = r.get(e);
    if (i !== void 0) return i;
    let a = e.emits,
        o = {},
        c = !1;
    if (!h(e)) {
        let r = e => {
            let n = qr(e, t, !0);
            n && (c = !0, s(o, n))
        };
        !n && t.mixins.length && t.mixins.forEach(r), e.extends && r(e.extends), e.mixins && e.mixins.forEach(r)
    }
    return !a && !c ? (v(e) && r.set(e, null), null) : (d(a) ? a.forEach(e => o[e] = null) : s(o, a), v(e) && r.set(e, o), o)
}

function Jr(e, t) {
    return !e || !a(t) ? !1 : (t = t.slice(2).replace(/Once$/, ``), u(e, t[0].toLowerCase() + t.slice(1)) || u(e, D(t)) || u(e, t))
}

function Yr(e) {
    let {
        type: t,
        vnode: n,
        proxy: r,
        withProxy: i,
        propsOptions: [a],
        slots: s,
        attrs: c,
        emit: l,
        render: u,
        renderCache: d,
        props: f,
        data: p,
        setupState: m,
        ctx: h,
        inheritAttrs: g
    } = e, _ = xn(e), v, y;
    try {
        if (n.shapeFlag & 4) {
            let e = i || r,
                t = e;
            v = Xi(u.call(t, e, d, f, m, p, h)), y = c
        } else {
            let e = t;
            v = Xi(e.length > 1 ? e(f, {
                attrs: c,
                slots: s,
                emit: l
            }) : e(f, null)), y = t.props ? c : Xr(c)
        }
    } catch (t) {
        Fi.length = 0, nn(t, e, 1), v = Gi(Ni)
    }
    let b = v;
    if (y && g !== !1) {
        let e = Object.keys(y),
            {
                shapeFlag: t
            } = b;
        e.length && t & 7 && (a && e.some(o) && (y = Zr(y, a)), b = Ji(b, y, !1, !0))
    }
    return n.dirs && (b = Ji(b, null, !1, !0), b.dirs = b.dirs ? b.dirs.concat(n.dirs) : n.dirs), n.transition && Jn(b, n.transition), v = b, xn(_), v
}
var Xr = e => {
        let t;
        for (let n in e)(n === `class` || n === `style` || a(n)) && ((t ||= {})[n] = e[n]);
        return t
    },
    Zr = (e, t) => {
        let n = {};
        for (let r in e)(!o(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
        return n
    };

function Qr(e, t, n) {
    let {
        props: r,
        children: i,
        component: a
    } = e, {
        props: o,
        children: s,
        patchFlag: c
    } = t, l = a.emitsOptions;
    if (t.dirs || t.transition) return !0;
    if (n && c >= 0) {
        if (c & 1024) return !0;
        if (c & 16) return r ? $r(r, o, l) : !!o;
        if (c & 8) {
            let e = t.dynamicProps;
            for (let t = 0; t < e.length; t++) {
                let n = e[t];
                if (ei(o, r, n) && !Jr(l, n)) return !0
            }
        }
    } else return (i || s) && (!s || !s.$stable) ? !0 : r === o ? !1 : r ? o ? $r(r, o, l) : !0 : !!o;
    return !1
}

function $r(e, t, n) {
    let r = Object.keys(t);
    if (r.length !== Object.keys(e).length) return !0;
    for (let i = 0; i < r.length; i++) {
        let a = r[i];
        if (ei(t, e, a) && !Jr(n, a)) return !0
    }
    return !1
}

function ei(e, t, n) {
    let r = e[n],
        i = t[n];
    return n === `style` && v(r) && v(i) ? !ve(r, i) : r !== i
}

function ti({
    vnode: e,
    parent: t,
    suspense: n
}, r) {
    for (; t;) {
        let n = t.subTree;
        if (n.suspense && n.suspense.activeBranch === e && (n.suspense.vnode.el = n.el = r, e = n), n === e)(e = t.vnode).el = r, t = t.parent;
        else break
    }
    n && n.activeBranch === e && (n.vnode.el = r)
}
var ni = {},
    ri = () => Object.create(ni),
    ii = e => Object.getPrototypeOf(e) === ni;

function ai(e, t, n, r = !1) {
    let i = {},
        a = ri();
    e.propsDefaults = Object.create(null), si(e, t, i, a);
    for (let t in e.propsOptions[0]) t in i || (i[t] = void 0);
    n ? e.props = r ? i : Mt(i) : e.type.props ? e.props = i : e.props = a, e.attrs = a
}

function oi(e, t, n, r) {
    let {
        props: i,
        attrs: a,
        vnode: {
            patchFlag: o
        }
    } = e, s = R(i), [c] = e.propsOptions, l = !1;
    if ((r || o > 0) && !(o & 16)) {
        if (o & 8) {
            let n = e.vnode.dynamicProps;
            for (let r = 0; r < n.length; r++) {
                let o = n[r];
                if (Jr(e.emitsOptions, o)) continue;
                let d = t[o];
                if (c)
                    if (u(a, o)) d !== a[o] && (a[o] = d, l = !0);
                    else {
                        let t = E(o);
                        i[t] = ci(c, s, t, d, e, !1)
                    }
                else d !== a[o] && (a[o] = d, l = !0)
            }
        }
    } else {
        si(e, t, i, a) && (l = !0);
        let r;
        for (let a in s)(!t || !u(t, a) && ((r = D(a)) === a || !u(t, r))) && (c ? n && (n[a] !== void 0 || n[r] !== void 0) && (i[a] = ci(c, s, a, void 0, e, !0)) : delete i[a]);
        if (a !== s)
            for (let e in a)(!t || !u(t, e)) && (delete a[e], l = !0)
    }
    l && Xe(e.attrs, `set`, ``)
}

function si(e, n, r, i) {
    let [a, o] = e.propsOptions, s = !1, c;
    if (n)
        for (let t in n) {
            if (ee(t)) continue;
            let l = n[t],
                d;
            a && u(a, d = E(t)) ? !o || !o.includes(d) ? r[d] = l : (c ||= {})[d] = l : Jr(e.emitsOptions, t) || (!(t in i) || l !== i[t]) && (i[t] = l, s = !0)
        }
    if (o) {
        let n = R(r),
            i = c || t;
        for (let t = 0; t < o.length; t++) {
            let s = o[t];
            r[s] = ci(a, n, s, i[s], e, !u(i, s))
        }
    }
    return s
}

function ci(e, t, n, r, i, a) {
    let o = e[n];
    if (o != null) {
        let e = u(o, `default`);
        if (e && r === void 0) {
            let e = o.default;
            if (o.type !== Function && !o.skipFactory && h(e)) {
                let {
                    propsDefaults: a
                } = i;
                if (n in a) r = a[n];
                else {
                    let o = sa(i);
                    r = a[n] = e.call(null, t), o()
                }
            } else r = e;
            i.ce && i.ce._setProp(n, r)
        }
        o[0] && (a && !e ? r = !1 : o[1] && (r === `` || r === D(n)) && (r = !0))
    }
    return r
}
var li = new WeakMap;

function ui(e, r, i = !1) {
    let a = i ? li : r.propsCache,
        o = a.get(e);
    if (o) return o;
    let c = e.props,
        l = {},
        f = [],
        p = !1;
    if (!h(e)) {
        let t = e => {
            p = !0;
            let [t, n] = ui(e, r, !0);
            s(l, t), n && f.push(...n)
        };
        !i && r.mixins.length && r.mixins.forEach(t), e.extends && t(e.extends), e.mixins && e.mixins.forEach(t)
    }
    if (!c && !p) return v(e) && a.set(e, n), n;
    if (d(c))
        for (let e = 0; e < c.length; e++) {
            let n = E(c[e]);
            di(n) && (l[n] = t)
        } else if (c)
            for (let e in c) {
                let t = E(e);
                if (di(t)) {
                    let n = c[e],
                        r = l[t] = d(n) || h(n) ? {
                            type: n
                        } : s({}, n),
                        i = r.type,
                        a = !1,
                        o = !0;
                    if (d(i))
                        for (let e = 0; e < i.length; ++e) {
                            let t = i[e],
                                n = h(t) && t.name;
                            if (n === `Boolean`) {
                                a = !0;
                                break
                            } else n === `String` && (o = !1)
                        } else a = h(i) && i.name === `Boolean`;
                    r[0] = a, r[1] = o, (a || u(r, `default`)) && f.push(t)
                }
            }
    let m = [l, f];
    return v(e) && a.set(e, m), m
}

function di(e) {
    return e[0] !== `$` && !ee(e)
}
var fi = e => e === `_` || e === `_ctx` || e === `$stable`,
    pi = e => d(e) ? e.map(Xi) : [Xi(e)],
    mi = (e, t, n) => {
        if (t._n) return t;
        let r = Sn((...e) => pi(t(...e)), n);
        return r._c = !1, r
    },
    hi = (e, t, n) => {
        let r = e._ctx;
        for (let n in e) {
            if (fi(n)) continue;
            let i = e[n];
            if (h(i)) t[n] = mi(n, i, r);
            else if (i != null) {
                let e = pi(i);
                t[n] = () => e
            }
        }
    },
    gi = (e, t) => {
        let n = pi(t);
        e.slots.default = () => n
    },
    _i = (e, t, n) => {
        for (let r in t)(n || !fi(r)) && (e[r] = t[r])
    },
    vi = (e, t, n) => {
        let r = e.slots = ri();
        if (e.vnode.shapeFlag & 32) {
            let e = t._;
            e ? (_i(r, t, n), n && k(r, `_`, e, !0)) : hi(t, r)
        } else t && gi(e, t)
    },
    yi = (e, n, r) => {
        let {
            vnode: i,
            slots: a
        } = e, o = !0, s = t;
        if (i.shapeFlag & 32) {
            let e = n._;
            e ? r && e === 1 ? o = !1 : _i(a, n, r) : (o = !n.$stable, hi(n, a)), s = n
        } else n && (gi(e, n), s = {
            default: 1
        });
        if (o)
            for (let e in a) !fi(e) && s[e] == null && delete a[e]
    },
    W = ji;

function bi(e) {
    return xi(e)
}

function xi(e, i) {
    let a = ce();
    a.__VUE__ = !0;
    let {
        insert: o,
        remove: s,
        patchProp: c,
        createElement: l,
        createText: u,
        createComment: d,
        setText: f,
        setElementText: p,
        parentNode: m,
        nextSibling: h,
        setScopeId: g = r,
        insertStaticContent: _
    } = e, v = (e, t, n, r = null, i = null, a = null, o = void 0, s = null, c = !!t.dynamicChildren) => {
        if (e === t) return;
        e && !Hi(e, t) && (r = ve(e), A(e, i, a, !0), e = null), t.patchFlag === -2 && (c = !1, t.dynamicChildren = null);
        let {
            type: l,
            ref: u,
            shapeFlag: d
        } = t;
        switch (l) {
            case Mi:
                y(e, t, n, r);
                break;
            case Ni:
                b(e, t, n, r);
                break;
            case Pi:
                e ?? x(t, n, r, o);
                break;
            case G:
                ie(e, t, n, r, i, a, o, s, c);
                break;
            default:
                d & 1 ? w(e, t, n, r, i, a, o, s, c) : d & 6 ? O(e, t, n, r, i, a, o, s, c) : (d & 64 || d & 128) && l.process(e, t, n, r, i, a, o, s, c, j)
        }
        u != null && i ? $n(u, e && e.ref, a, t || e, !t) : u == null && e && e.ref != null && $n(e.ref, null, a, e, !0)
    }, y = (e, t, n, r) => {
        if (e == null) o(t.el = u(t.children), n, r);
        else {
            let n = t.el = e.el;
            t.children !== e.children && f(n, t.children)
        }
    }, b = (e, t, n, r) => {
        e == null ? o(t.el = d(t.children || ``), n, r) : t.el = e.el
    }, x = (e, t, n, r) => {
        [e.el, e.anchor] = _(e.children, t, n, r, e.el, e.anchor)
    }, S = ({
        el: e,
        anchor: t
    }, n, r) => {
        let i;
        for (; e && e !== t;) i = h(e), o(e, n, r), e = i;
        o(t, n, r)
    }, C = ({
        el: e,
        anchor: t
    }) => {
        let n;
        for (; e && e !== t;) n = h(e), s(e), e = n;
        s(t)
    }, w = (e, t, n, r, i, a, o, s, c) => {
        if (t.type === `svg` ? o = `svg` : t.type === `math` && (o = `mathml`), e == null) T(t, n, r, i, a, o, s, c);
        else {
            let n = e.el && e.el._isVueCE ? e.el : null;
            try {
                n && n._beginPatch(), ne(e, t, i, a, o, s, c)
            } finally {
                n && n._endPatch()
            }
        }
    }, T = (e, t, n, r, i, a, s, u) => {
        let d, f, {
            props: m,
            shapeFlag: h,
            transition: g,
            dirs: _
        } = e;
        if (d = e.el = l(e.type, a, m && m.is, m), h & 8 ? p(d, e.children) : h & 16 && E(e.children, d, null, r, i, Si(e, a), s, u), _ && wn(e, null, r, `created`), te(d, e, e.scopeId, s, r), m) {
            for (let e in m) e !== `value` && !ee(e) && c(d, e, null, m[e], a, r);
            `value` in m && c(d, `value`, null, m.value, a), (f = m.onVnodeBeforeMount) && ea(f, r, e)
        }
        _ && wn(e, null, r, `beforeMount`);
        let v = wi(i, g);
        v && g.beforeEnter(d), o(d, t, n), ((f = m && m.onVnodeMounted) || v || _) && W(() => {
            try {
                f && ea(f, r, e), v && g.enter(d), _ && wn(e, null, r, `mounted`)
            } finally {}
        }, i)
    }, te = (e, t, n, r, i) => {
        if (n && g(e, n), r)
            for (let t = 0; t < r.length; t++) g(e, r[t]);
        if (i) {
            let n = i.subTree;
            if (t === n || Ai(n.type) && (n.ssContent === t || n.ssFallback === t)) {
                let t = i.vnode;
                te(e, t, t.scopeId, t.slotScopeIds, i.parent)
            }
        }
    }, E = (e, t, n, r, i, a, o, s, c = 0) => {
        for (let l = c; l < e.length; l++) v(null, e[l] = s ? Zi(e[l]) : Xi(e[l]), t, n, r, i, a, o, s)
    }, ne = (e, n, r, i, a, o, s) => {
        let l = n.el = e.el,
            {
                patchFlag: u,
                dynamicChildren: d,
                dirs: f
            } = n;
        u |= e.patchFlag & 16;
        let m = e.props || t,
            h = n.props || t,
            g;
        if (r && Ci(r, !1),
            (g = h.onVnodeBeforeUpdate) && ea(g, r, n, e),
            f && wn(n, e, r, `beforeUpdate`),
            r && Ci(r, !0),
            (m.innerHTML && h.innerHTML == null || m.textContent && h.textContent == null) && p(l, ``),
            d ? D(e.dynamicChildren, d, l, r, i, Si(n, a), o)
                : s || ue(e, n, l, null, r, i, Si(n, a), o, !1),
            u > 0) {
            if (u & 16) re(l, m, h, r, a);
            else if (u & 2 && m.class !== h.class && c(l, `class`, null, h.class, a), u & 4 && c(l, `style`, m.style, h.style, a), u & 8) {
                let e = n.dynamicProps;
                for (let t = 0; t < e.length; t++) {
                    let n = e[t],
                        i = m[n],
                        o = h[n];
                    (o !== i || n === `value`) && c(l, n, i, o, a, r)
                }
            }
            u & 1 && e.children !== n.children && p(l, n.children)
        } else !s && d == null && re(l, m, h, r, a);
        ((g = h.onVnodeUpdated) || f) && W(() => {
            g && ea(g, r, n, e), f && wn(n, e, r, `updated`)
        }, i)
    }, D = (e, t, n, r, i, a, o) => {
        for (let s = 0; s < t.length; s++) {
            let c = e[s],
                l = t[s];
            v(c, l, c.el && (c.type === G || !Hi(c, l) || c.shapeFlag & 198) ? m(c.el) : n, null, r, i, a, o, !0)
        }
    }, re = (e, n, r, i, a) => {
        if (n !== r) {
            if (n !== t)
                for (let t in n) !ee(t) && !(t in r) && c(e, t, n[t], null, a, i);
            for (let t in r) {
                if (ee(t)) continue;
                let o = r[t],
                    s = n[t];
                o !== s && t !== `value` && c(e, t, s, o, a, i)
            }
            `value` in r && c(e, `value`, n.value, r.value, a)
        }
    }, ie = (e, t, n, r, i, a, s, c, l) => {
        let d = t.el = e ? e.el : u(``),
            f = t.anchor = e ? e.anchor : u(``),
            {
                patchFlag: p,
                dynamicChildren: m,
                slotScopeIds: h
            } = t;
        h && (c = c ? c.concat(h) : h),
            e == null ? (o(d, n, r), o(f, n, r),
                E(t.children || [], n, f, i, a, s, c, l))
            : p > 0 && p & 64 && m && e.dynamicChildren &&
                e.dynamicChildren.length === m.length
                ? (D(e.dynamicChildren, m, n, i, a, s, c),
                    (t.key != null || i && t === i.subTree) && Ti(e, t, !0))
            : ue(e, t, n, f, i, a, s, c, l)
    }, O = (e, t, n, r, i, a, o, s, c) => {
        t.slotScopeIds = s, e == null ? t.shapeFlag & 512 ? i.ctx.activate(t, n, r, o, c) : k(t, n, r, i, a, o, c) : oe(e, t, c)
    }, k = (e, t, n, r, i, a, o) => {
        let s = e.component = ra(e, r, i);
        if (nr(e) && (s.ctx.renderer = j), da(s, !1, o), s.asyncDep) {
            if (i && i.registerDep(s, se, o), !e.el) {
                let r = s.subTree = Gi(Ni);
                b(null, r, t, n), e.placeholder = r.el
            }
        } else se(s, e, t, n, i, a, o)
    }, oe = (e, t, n) => {
        let r = t.component = e.component;
        if (Qr(e, t, n))
            if (r.asyncDep && !r.asyncResolved) {
                le(r, t, n);
                return
            } else r.next = t, r.update();
        else t.el = e.el, r.vnode = t
    }, se = (e, t, n, r, i, a, o) => {
        let s = () => {
            if (e.isMounted) {
                let {
                    next: t,
                    bu: n,
                    u: r,
                    parent: s,
                    vnode: c
                } = e;
                {
                    let n = Di(e);
                    if (n) {
                        t && (t.el = c.el, le(e, t, o)), n.asyncDep.then(() => {
                            W(() => {
                                e.isUnmounted || l()
                            }, i)
                        });
                        return
                    }
                }
                let u = t,
                    d;
                Ci(e, !1), t ? (t.el = c.el, le(e, t, o)) : t = c, n && ae(n), (d = t.props && t.props.onVnodeBeforeUpdate) && ea(d, s, t, c), Ci(e, !0);
                let f = Yr(e),
                    p = e.subTree;
                e.subTree = f, v(p, f, m(p.el), ve(p), e, i, a), t.el = f.el, u === null && ti(e, f.el), r && W(r, i), (d = t.props && t.props.onVnodeUpdated) && W(() => ea(d, s, t, c), i)
            } else {
                let o, {
                        el: s,
                        props: c
                    } = t,
                    {
                        bm: l,
                        m: u,
                        parent: d,
                        root: f,
                        type: p
                    } = e,
                    m = tr(t);
                if (Ci(e, !1), l && ae(l), !m && (o = c && c.onVnodeBeforeMount) && ea(o, d, t), Ci(e, !0), s && Se) {
                    let t = () => {
                        e.subTree = Yr(e), Se(s, e.subTree, e, i, null)
                    };
                    m && p.__asyncHydrate ? p.__asyncHydrate(s, e, t) : t()
                } else {
                    f.ce && f.ce._hasShadowRoot() && f.ce._injectChildStyle(p, e.parent ? e.parent.type : void 0);
                    let o = e.subTree = Yr(e);
                    v(null, o, n, r, e, i, a), t.el = o.el
                }
                if (u && W(u, i), !m && (o = c && c.onVnodeMounted)) {
                    let e = t;
                    W(() => ea(o, d, e), i)
                }(t.shapeFlag & 256 || d && tr(d.vnode) && d.vnode.shapeFlag & 256) && e.a && W(e.a, i), e.isMounted = !0, t = n = r = null
            }
        };
        e.scope.on();
        let c = e.effect = new Ee(s);
        e.scope.off();
        let l = e.update = c.run.bind(c),
            u = e.job = c.runIfDirty.bind(c);
        u.i = e, u.id = e.uid, c.scheduler = () => pn(u), Ci(e, !0), l()
    }, le = (e, t, n) => {
        t.component = e;
        let r = e.vnode.props;
        e.vnode = t, e.next = null, oi(e, t.props, r, n), yi(e, t.children, n), F(), gn(e), Be()
    }, ue = (e, t, n, r, i, a, o, s, c = !1) => {
        let l = e && e.children,
            u = e ? e.shapeFlag : 0,
            d = t.children,
            {
                patchFlag: f,
                shapeFlag: m
            } = t;
        if (f > 0) {
            if (f & 128) {
                fe(l, d, n, r, i, a, o, s, c);
                return
            } else if (f & 256) {
                de(l, d, n, r, i, a, o, s, c);
                return
            }
        }
        m & 8 ? (u & 16 && _e(l, i, a), d !== l && p(n, d)) : u & 16 ? m & 16 ? fe(l, d, n, r, i, a, o, s, c) : _e(l, i, a, !0) : (u & 8 && p(n, ``), m & 16 && E(d, n, r, i, a, o, s, c))
    }, de = (e, t, r, i, a, o, s, c, l) => {
        e ||= n, t ||= n;
        let u = e.length,
            d = t.length,
            f = Math.min(u, d),
            p;
        for (p = 0; p < f; p++) {
            let n = t[p] = l ? Zi(t[p]) : Xi(t[p]);
            v(e[p], n, r, null, a, o, s, c, l)
        }
        u > d ? _e(e, a, o, !0, !1, f) : E(t, r, i, a, o, s, c, l, f)
    }, fe = (e, t, r, i, a, o, s, c, l) => {
        let u = 0,
            d = t.length,
            f = e.length - 1,
            p = d - 1;
        for (; u <= f && u <= p;) {
            let n = e[u],
                i = t[u] = l ? Zi(t[u]) : Xi(t[u]);
            if (Hi(n, i)) v(n, i, r, null, a, o, s, c, l);
            else break;
            u++
        }
        for (; u <= f && u <= p;) {
            let n = e[f],
                i = t[p] = l ? Zi(t[p]) : Xi(t[p]);
            if (Hi(n, i)) v(n, i, r, null, a, o, s, c, l);
            else break;
            f--, p--
        }
        if (u > f) {
            if (u <= p) {
                let e = p + 1,
                    n = e < d ? t[e].el : i;
                for (; u <= p;) v(null, t[u] = l ? Zi(t[u]) : Xi(t[u]), r, n, a, o, s, c, l), u++
            }
        } else if (u > p)
            for (; u <= f;) A(e[u], a, o, !0), u++;
        else {
            let m = u,
                h = u,
                g = new Map;
            for (u = h; u <= p; u++) {
                let e = t[u] = l ? Zi(t[u]) : Xi(t[u]);
                e.key != null && g.set(e.key, u)
            }
            let _, y = 0,
                b = p - h + 1,
                x = !1,
                S = 0,
                C = Array(b);
            for (u = 0; u < b; u++) C[u] = 0;
            for (u = m; u <= f; u++) {
                let n = e[u];
                if (y >= b) {
                    A(n, a, o, !0);
                    continue
                }
                let i;
                if (n.key != null) i = g.get(n.key);
                else
                    for (_ = h; _ <= p; _++)
                        if (C[_ - h] === 0 && Hi(n, t[_])) {
                            i = _;
                            break
                        } i === void 0 ? A(n, a, o, !0) : (C[i - h] = u + 1, i >= S ? S = i : x = !0, v(n, t[i], r, null, a, o, s, c, l), y++)
            }
            let w = x ? Ei(C) : n;
            for (_ = w.length - 1, u = b - 1; u >= 0; u--) {
                let e = h + u,
                    n = t[e],
                    f = t[e + 1],
                    p = e + 1 < d ? f.el || ki(f) : i;
                C[u] === 0 ? v(null, n, r, p, a, o, s, c, l) : x && (_ < 0 || u !== w[_] ? pe(n, r, p, 2) : _--)
            }
        }
    }, pe = (e, t, n, r, i = null) => {
        let {
            el: a,
            type: c,
            transition: l,
            children: u,
            shapeFlag: d
        } = e;
        if (d & 6) {
            pe(e.component.subTree, t, n, r);
            return
        }
        if (d & 128) {
            e.suspense.move(t, n, r);
            return
        }
        if (d & 64) {
            c.move(e, t, n, j);
            return
        }
        if (c === G) {
            o(a, t, n);
            for (let e = 0; e < u.length; e++) pe(u[e], t, n, r);
            o(e.anchor, t, n);
            return
        }
        if (c === Pi) {
            S(e, t, n);
            return
        }
        if (r !== 2 && d & 1 && l)
            if (r === 0) l.beforeEnter(a), o(a, t, n), W(() => l.enter(a), i);
            else {
                let {
                    leave: r,
                    delayLeave: i,
                    afterLeave: c
                } = l, u = () => {
                    e.ctx.isUnmounted ? s(a) : o(a, t, n)
                }, d = () => {
                    a._isLeaving && a[qn](!0), r(a, () => {
                        u(), c && c()
                    })
                };
                i ? i(a, u, d) : d()
            }
        else o(a, t, n)
    }, A = (e, t, n, r = !1, i = !1) => {
        let {
            type: a,
            props: o,
            ref: s,
            children: c,
            dynamicChildren: l,
            shapeFlag: u,
            patchFlag: d,
            dirs: f,
            cacheIndex: p,
            memo: m
        } = e;
        if (d === -2 && (i = !1), s != null && (F(), $n(s, null, n, e, !0), Be()), p != null && (t.renderCache[p] = void 0), u & 256) {
            t.ctx.deactivate(e);
            return
        }
        let h = u & 1 && f,
            g = !tr(e),
            _;
        if (g && (_ = o && o.onVnodeBeforeUnmount) && ea(_, t, e), u & 6) ge(e.component, n, r);
        else {
            if (u & 128) {
                e.suspense.unmount(n, r);
                return
            }
            h && wn(e, null, t, `beforeUnmount`), u & 64 ? e.type.remove(e, t, n, j, r) : l && !l.hasOnce && (a !== G || d > 0 && d & 64) ? _e(l, t, n, !1, !0) : (a === G && d & 384 || !i && u & 16) && _e(c, t, n), r && me(e)
        }
        let v = m != null && p == null;
        (g && (_ = o && o.onVnodeUnmounted) || h || v) && W(() => {
            _ && ea(_, t, e), h && wn(e, null, t, `unmounted`), v && (e.el = null)
        }, n)
    }, me = e => {
        let {
            type: t,
            el: n,
            anchor: r,
            transition: i
        } = e;
        if (t === G) {
            he(n, r);
            return
        }
        if (t === Pi) {
            C(e);
            return
        }
        let a = () => {
            s(n), i && !i.persisted && i.afterLeave && i.afterLeave()
        };
        if (e.shapeFlag & 1 && i && !i.persisted) {
            let {
                leave: t,
                delayLeave: r
            } = i, o = () => t(n, a);
            r ? r(e.el, a, o) : o()
        } else a()
    }, he = (e, t) => {
        let n;
        for (; e !== t;) n = h(e), s(e), e = n;
        s(t)
    }, ge = (e, t, n) => {
        let {
            bum: r,
            scope: i,
            job: a,
            subTree: o,
            um: s,
            m: c,
            a: l
        } = e;
        Oi(c), Oi(l), r && ae(r), i.stop(), a && (a.flags |= 8, A(o, e, t, n)), s && W(s, t), W(() => {
            e.isUnmounted = !0
        }, t)
    }, _e = (e, t, n, r = !1, i = !1, a = 0) => {
        for (let o = a; o < e.length; o++) A(e[o], t, n, r, i)
    }, ve = e => {
        if (e.shapeFlag & 6) return ve(e.component.subTree);
        if (e.shapeFlag & 128) return e.suspense.next();
        let t = h(e.anchor || e.el),
            n = t && t[Pn];
        return n ? h(n) : t
    }, ye = !1, be = (e, t, n) => {
        let r;
        e == null ? t._vnode && (A(t._vnode, null, null, !0), r = t._vnode.component) : v(t._vnode || null, e, t, null, null, null, n), t._vnode = e, ye ||= (ye = !0, gn(r), _n(), !1)
    }, j = {
        p: v,
        um: A,
        m: pe,
        r: me,
        mt: k,
        mc: E,
        pc: ue,
        pbc: D,
        n: ve,
        o: e
    }, xe, Se;
    return i && ([xe, Se] = i(j)), {
        render: be,
        hydrate: xe,
        createApp: Hr(be, xe)
    }
}

function Si({
    type: e,
    props: t
}, n) {
    return n === `svg` && e === `foreignObject` || n === `mathml` && e === `annotation-xml` && t && t.encoding && t.encoding.includes(`html`) ? void 0 : n
}

function Ci({
    effect: e,
    job: t
}, n) {
    n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5)
}

function wi(e, t) {
    return (!e || e && !e.pendingBranch) && t && !t.persisted
}

function Ti(e, t, n = !1) {
    let r = e.children,
        i = t.children;
    if (d(r) && d(i))
        for (let e = 0; e < r.length; e++) {
            let t = r[e],
                a = i[e];
            a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[e] = Zi(i[e]), a.el = t.el), !n && a.patchFlag !== -2 && Ti(t, a)), a.type === Mi && (a.patchFlag === -1 && (a = i[e] = Zi(a)), a.el = t.el), a.type === Ni && !a.el && (a.el = t.el)
        }
}

function Ei(e) {
    let t = e.slice(),
        n = [0],
        r, i, a, o, s, c = e.length;
    for (r = 0; r < c; r++) {
        let c = e[r];
        if (c !== 0) {
            if (i = n[n.length - 1], e[i] < c) {
                t[r] = i, n.push(r);
                continue
            }
            for (a = 0, o = n.length - 1; a < o;) s = a + o >> 1, e[n[s]] < c ? a = s + 1 : o = s;
            c < e[n[a]] && (a > 0 && (t[r] = n[a - 1]), n[a] = r)
        }
    }
    for (a = n.length, o = n[a - 1]; a-- > 0;) n[a] = o, o = t[o];
    return n
}

function Di(e) {
    let t = e.subTree.component;
    if (t) return t.asyncDep && !t.asyncResolved ? t : Di(t)
}

function Oi(e) {
    if (e)
        for (let t = 0; t < e.length; t++) e[t].flags |= 8
}

function ki(e) {
    if (e.placeholder) return e.placeholder;
    let t = e.component;
    return t ? ki(t.subTree) : null
}
var Ai = e => e.__isSuspense;

function ji(e, t) {
    t && t.pendingBranch ? d(e) ? t.effects.push(...e) : t.effects.push(e) : hn(e)
}
var G = Symbol.for(`v-fgt`),
    Mi = Symbol.for(`v-txt`),
    Ni = Symbol.for(`v-cmt`),
    Pi = Symbol.for(`v-stc`),
    Fi = [],
    K = null;

function q(e = !1) {
    Fi.push(K = e ? null : [])
}

function Ii() {
    Fi.pop(), K = Fi[Fi.length - 1] || null
}
var Li = 1;

function Ri(e, t = !1) {
    Li += e, e < 0 && K && t && (K.hasOnce = !0)
}

function zi(e) {
    return e.dynamicChildren = Li > 0 ? K || n : null, Ii(), Li > 0 && K && K.push(e), e
}

function J(e, t, n, r, i, a) {
    return zi(Y(e, t, n, r, i, a, !0))
}

function Bi(e, t, n, r, i) {
    return zi(Gi(e, t, n, r, i, !0))
}

function Vi(e) {
    return e ? e.__v_isVNode === !0 : !1
}

function Hi(e, t) {
    return e.type === t.type && e.key === t.key
}
var Ui = ({
        key: e
    }) => e ?? null,
    Wi = ({
        ref: e,
        ref_key: t,
        ref_for: n
    }) => (typeof e == `number` && (e = `` + e), e == null ? null : g(e) || z(e) || h(e) ? {
        i: H,
        r: e,
        k: t,
        f: !!n
    } : e);

function Y(e, t = null, n = null, r = 0, i = null, a = e === G ? 0 : 1, o = !1, s = !1) {
    let c = {
        __v_isVNode: !0,
        __v_skip: !0,
        type: e,
        props: t,
        key: t && Ui(t),
        ref: t && Wi(t),
        scopeId: bn,
        slotScopeIds: null,
        children: n,
        component: null,
        suspense: null,
        ssContent: null,
        ssFallback: null,
        dirs: null,
        transition: null,
        el: null,
        anchor: null,
        target: null,
        targetStart: null,
        targetAnchor: null,
        staticCount: 0,
        shapeFlag: a,
        patchFlag: r,
        dynamicProps: i,
        dynamicChildren: null,
        appContext: null,
        ctx: H
    };
    return s ? (Qi(c, n), a & 128 && e.normalize(c)) : n && (c.shapeFlag |= g(n) ? 8 : 16), Li > 0 && !o && K && (c.patchFlag > 0 || a & 6) && c.patchFlag !== 32 && K.push(c), c
}
var Gi = Ki;

function Ki(e, t = null, n = null, r = 0, i = null, a = !1) {
    if ((!e || e === yr) && (e = Ni), Vi(e)) {
        let r = Ji(e, t, !0);
        return n && Qi(r, n), Li > 0 && !a && K && (r.shapeFlag & 6 ? K[K.indexOf(e)] = r : K.push(r)), r.patchFlag = -2, r
    }
    if (ba(e) && (e = e.__vccOpts), t) {
        t = qi(t);
        let {
            class: e,
            style: n
        } = t;
        e && !g(e) && (t.class = A(e)), v(n) && (Lt(n) && !d(n) && (n = s({}, n)), t.style = le(n))
    }
    let o = g(e) ? 1 : Ai(e) ? 128 : Fn(e) ? 64 : v(e) ? 4 : h(e) ? 2 : 0;
    return Y(e, t, n, r, i, o, a, !0)
}

function qi(e) {
    return e ? Lt(e) || ii(e) ? s({}, e) : e : null
}

function Ji(e, t, n = !1, r = !1) {
    let {
        props: i,
        ref: a,
        patchFlag: o,
        children: s,
        transition: c
    } = e, l = t ? $i(i || {}, t) : i, u = {
        __v_isVNode: !0,
        __v_skip: !0,
        type: e.type,
        props: l,
        key: l && Ui(l),
        ref: t && t.ref ? n && a ? d(a) ? a.concat(Wi(t)) : [a, Wi(t)] : Wi(t) : a,
        scopeId: e.scopeId,
        slotScopeIds: e.slotScopeIds,
        children: s,
        target: e.target,
        targetStart: e.targetStart,
        targetAnchor: e.targetAnchor,
        staticCount: e.staticCount,
        shapeFlag: e.shapeFlag,
        patchFlag: t && e.type !== G ? o === -1 ? 16 : o | 16 : o,
        dynamicProps: e.dynamicProps,
        dynamicChildren: e.dynamicChildren,
        appContext: e.appContext,
        dirs: e.dirs,
        transition: c,
        component: e.component,
        suspense: e.suspense,
        ssContent: e.ssContent && Ji(e.ssContent),
        ssFallback: e.ssFallback && Ji(e.ssFallback),
        placeholder: e.placeholder,
        el: e.el,
        anchor: e.anchor,
        ctx: e.ctx,
        ce: e.ce
    };
    return c && r && Jn(u, c.clone(u)), u
}

function Yi(e = ` `, t = 0) {
    return Gi(Mi, null, e, t)
}

function X(e = ``, t = !1) {
    return t ? (q(), Bi(Ni, null, e)) : Gi(Ni, null, e)
}

function Xi(e) {
    return e == null || typeof e == `boolean` ? Gi(Ni) : d(e) ? Gi(G, null, e.slice()) : Vi(e) ? Zi(e) : Gi(Mi, null, String(e))
}

function Zi(e) {
    return e.el === null && e.patchFlag !== -1 || e.memo ? e : Ji(e)
}

function Qi(e, t) {
    let n = 0,
        {
            shapeFlag: r
        } = e;
    if (t == null) t = null;
    else if (d(t)) n = 16;
    else if (typeof t == `object`)
        if (r & 65) {
            let n = t.default;
            n && (n._c && (n._d = !1), Qi(e, n()), n._c && (n._d = !0));
            return
        } else {
            n = 32;
            let r = t._;
            !r && !ii(t) ? t._ctx = H : r === 3 && H && (H.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024))
        }
    else h(t) ? (t = {
        default: t,
        _ctx: H
    }, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [Yi(t)]) : n = 8);
    e.children = t, e.shapeFlag |= n
}

function $i(...e) {
    let t = {};
    for (let n = 0; n < e.length; n++) {
        let r = e[n];
        for (let e in r)
            if (e === `class`) t.class !== r.class && (t.class = A([t.class, r.class]));
            else if (e === `style`) t.style = le([t.style, r.style]);
        else if (a(e)) {
            let n = t[e],
                i = r[e];
            i && n !== i && !(d(n) && n.includes(i)) ? t[e] = n ? [].concat(n, i) : i : i == null && n == null && !o(e) && (t[e] = i)
        } else e !== `` && (t[e] = r[e])
    }
    return t
}

function ea(e, t, n, r = null) {
    tn(e, t, 7, [n, r])
}
var ta = Br(),
    na = 0;

function ra(e, n, r) {
    let i = e.type,
        a = (n ? n.appContext : e.appContext) || ta,
        o = {
            uid: na++,
            vnode: e,
            type: i,
            parent: n,
            appContext: a,
            root: null,
            next: null,
            subTree: null,
            effect: null,
            update: null,
            job: null,
            scope: new Ce(!0),
            render: null,
            proxy: null,
            exposed: null,
            exposeProxy: null,
            withProxy: null,
            provides: n ? n.provides : Object.create(a.provides),
            ids: n ? n.ids : [``, 0, 0],
            accessCache: null,
            renderCache: [],
            components: null,
            directives: null,
            propsOptions: ui(i, a),
            emitsOptions: qr(i, a),
            emit: null,
            emitted: null,
            propsDefaults: t,
            inheritAttrs: i.inheritAttrs,
            ctx: t,
            data: t,
            props: t,
            attrs: t,
            slots: t,
            refs: t,
            setupState: t,
            setupContext: null,
            suspense: r,
            suspenseId: r ? r.pendingId : 0,
            asyncDep: null,
            asyncResolved: !1,
            isMounted: !1,
            isUnmounted: !1,
            isDeactivated: !1,
            bc: null,
            c: null,
            bm: null,
            m: null,
            bu: null,
            u: null,
            um: null,
            bum: null,
            da: null,
            a: null,
            rtg: null,
            rtc: null,
            ec: null,
            sp: null
        };
    return o.ctx = {
        _: o
    }, o.root = n ? n.root : o, o.emit = Gr.bind(null, o), e.ce && e.ce(o), o
}
var Z = null,
    ia = () => Z || H,
    aa, oa;
{
    let e = ce(),
        t = (t, n) => {
            let r;
            return (r = e[t]) || (r = e[t] = []), r.push(n), e => {
                r.length > 1 ? r.forEach(t => t(e)) : r[0](e)
            }
        };
    aa = t(`__VUE_INSTANCE_SETTERS__`, e => Z = e), oa = t(`__VUE_SSR_SETTERS__`, e => ua = e)
}
var sa = e => {
        let t = Z;
        return aa(e), e.scope.on(), () => {
            e.scope.off(), aa(t)
        }
    },
    ca = () => {
        Z && Z.scope.off(), aa(null)
    };

function la(e) {
    return e.vnode.shapeFlag & 4
}
var ua = !1;

function da(e, t = !1, n = !1) {
    t && oa(t);
    let {
        props: r,
        children: i
    } = e.vnode, a = la(e);
    ai(e, r, a, t), vi(e, i, n || t);
    let o = a ? fa(e, t) : void 0;
    return t && oa(!1), o
}

function fa(e, t) {
    let n = e.type;
    e.accessCache = Object.create(null), e.proxy = new Proxy(e.ctx, wr);
    let {
        setup: r
    } = n;
    if (r) {
        F();
        let n = e.setupContext = r.length > 1 ? va(e) : null,
            i = sa(e),
            a = en(r, e, 0, [e.props, n]),
            o = y(a);
        if (Be(), i(), (o || e.sp) && !tr(e) && Xn(e), o) {
            if (a.then(ca, ca), t) return a.then(n => {
                pa(e, n, t)
            }).catch(t => {
                nn(t, e, 0)
            });
            e.asyncDep = a
        } else pa(e, a, t)
    } else ga(e, t)
}

function pa(e, t, n) {
    h(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : v(t) && (e.setupState = Gt(t)), ga(e, n)
}
var ma, ha;

function ga(e, t, n) {
    let i = e.type;
    if (!e.render) {
        if (!t && ma && !i.render) {
            let t = i.template || jr(e).template;
            if (t) {
                let {
                    isCustomElement: n,
                    compilerOptions: r
                } = e.appContext.config, {
                    delimiters: a,
                    compilerOptions: o
                } = i;
                i.render = ma(t, s(s({
                    isCustomElement: n,
                    delimiters: a
                }, r), o))
            }
        }
        e.render = i.render || r, ha && ha(e)
    } {
        let t = sa(e);
        F();
        try {
            Dr(e)
        } finally {
            Be(), t()
        }
    }
}
var _a = {
    get(e, t) {
        return I(e, `get`, ``), e[t]
    }
};

function va(e) {
    return {
        attrs: new Proxy(e.attrs, _a),
        slots: e.slots,
        emit: e.emit,
        expose: t => {
            e.exposed = t || {}
        }
    }
}

function ya(e) {
    return e.exposed ? e.exposeProxy ||= new Proxy(Gt(Rt(e.exposed)), {
        get(t, n) {
            if (n in t) return t[n];
            if (n in Sr) return Sr[n](e)
        },
        has(e, t) {
            return t in e || t in Sr
        }
    }) : e.proxy
}

function ba(e) {
    return h(e) && `__vccOpts` in e
}
var Q = (e, t) => qt(e, t, ua),
    xa = `3.5.32`,
    Sa = void 0,
    Ca = typeof window < `u` && window.trustedTypes;
if (Ca) try {
    Sa = Ca.createPolicy(`vue`, {
        createHTML: e => e
    })
} catch {}
var wa = Sa ? e => Sa.createHTML(e) : e => e,
    Ta = `http://www.w3.org/2000/svg`,
    Ea = `http://www.w3.org/1998/Math/MathML`,
    Da = typeof document < `u` ? document : null,
    Oa = Da && Da.createElement(`template`),
    ka = {
        insert: (e, t, n) => {
            t.insertBefore(e, n || null)
        },
        remove: e => {
            let t = e.parentNode;
            t && t.removeChild(e)
        },
        createElement: (e, t, n, r) => {
            let i = t === `svg` ? Da.createElementNS(Ta, e) : t === `mathml` ? Da.createElementNS(Ea, e) : n ? Da.createElement(e, {
                is: n
            }) : Da.createElement(e);
            return e === `select` && r && r.multiple != null && i.setAttribute(`multiple`, r.multiple), i
        },
        createText: e => Da.createTextNode(e),
        createComment: e => Da.createComment(e),
        setText: (e, t) => {
            e.nodeValue = t
        },
        setElementText: (e, t) => {
            e.textContent = t
        },
        parentNode: e => e.parentNode,
        nextSibling: e => e.nextSibling,
        querySelector: e => Da.querySelector(e),
        setScopeId(e, t) {
            e.setAttribute(t, ``)
        },
        insertStaticContent(e, t, n, r, i, a) {
            let o = n ? n.previousSibling : t.lastChild;
            if (i && (i === a || i.nextSibling))
                for (; t.insertBefore(i.cloneNode(!0), n), !(i === a || !(i = i.nextSibling)););
            else {
                Oa.innerHTML = wa(r === `svg` ? `<svg>${e}</svg>` : r === `mathml` ? `<math>${e}</math>` : e);
                let i = Oa.content;
                if (r === `svg` || r === `mathml`) {
                    let e = i.firstChild;
                    for (; e.firstChild;) i.appendChild(e.firstChild);
                    i.removeChild(e)
                }
                t.insertBefore(i, n)
            }
            return [o ? o.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild]
        }
    },
    Aa = Symbol(`_vtc`);

function ja(e, t, n) {
    let r = e[Aa];
    r && (t = (t ? [t, ...r] : [...r]).join(` `)), t == null ? e.removeAttribute(`class`) : n ? e.setAttribute(`class`, t) : e.className = t
}
var Ma = Symbol(`_vod`),
    Na = Symbol(`_vsh`),
    Pa = Symbol(``),
    Fa = /(?:^|;)\s*display\s*:/;

function Ia(e, t, n) {
    let r = e.style,
        i = g(n),
        a = !1;
    if (n && !i) {
        if (t)
            if (g(t))
                for (let e of t.split(`;`)) {
                    let t = e.slice(0, e.indexOf(`:`)).trim();
                    n[t] ?? Ra(r, t, ``)
                } else
                    for (let e in t) n[e] ?? Ra(r, e, ``);
        for (let e in n) e === `display` && (a = !0), Ra(r, e, n[e])
    } else if (i) {
        if (t !== n) {
            let e = r[Pa];
            e && (n += `;` + e), r.cssText = n, a = Fa.test(n)
        }
    } else t && e.removeAttribute(`style`);
    Ma in e && (e[Ma] = a ? r.display : ``, e[Na] && (r.display = `none`))
}
var La = /\s*!important$/;

function Ra(e, t, n) {
    if (d(n)) n.forEach(n => Ra(e, t, n));
    else if (n ??= ``, t.startsWith(`--`)) e.setProperty(t, n);
    else {
        let r = Va(e, t);
        La.test(n) ? e.setProperty(D(r), n.replace(La, ``), `important`) : e[r] = n
    }
}
var za = [`Webkit`, `Moz`, `ms`],
    Ba = {};

function Va(e, t) {
    let n = Ba[t];
    if (n) return n;
    let r = E(t);
    if (r !== `filter` && r in e) return Ba[t] = r;
    r = re(r);
    for (let n = 0; n < za.length; n++) {
        let i = za[n] + r;
        if (i in e) return Ba[t] = i
    }
    return t
}
var Ha = `http://www.w3.org/1999/xlink`;

function Ua(e, t, n, r, i, a = he(t)) {
    r && t.startsWith(`xlink:`) ? n == null ? e.removeAttributeNS(Ha, t.slice(6, t.length)) : e.setAttributeNS(Ha, t, n) : n == null || a && !ge(n) ? e.removeAttribute(t) : e.setAttribute(t, a ? `` : _(n) ? String(n) : n)
}

function Wa(e, t, n, r, i) {
    if (t === `innerHTML` || t === `textContent`) {
        n != null && (e[t] = t === `innerHTML` ? wa(n) : n);
        return
    }
    let a = e.tagName;
    if (t === `value` && a !== `PROGRESS` && !a.includes(`-`)) {
        let r = a === `OPTION` ? e.getAttribute(`value`) || `` : e.value,
            i = n == null ? e.type === `checkbox` ? `on` : `` : String(n);
        (r !== i || !(`_value` in e)) && (e.value = i), n ?? e.removeAttribute(t), e._value = n;
        return
    }
    let o = !1;
    if (n === `` || n == null) {
        let r = typeof e[t];
        r === `boolean` ? n = ge(n) : n == null && r === `string` ? (n = ``, o = !0) : r === `number` && (n = 0, o = !0)
    }
    try {
        e[t] = n
    } catch {}
    o && e.removeAttribute(i || t)
}

function Ga(e, t, n, r) {
    e.addEventListener(t, n, r)
}

function Ka(e, t, n, r) {
    e.removeEventListener(t, n, r)
}
var qa = Symbol(`_vei`);

function Ja(e, t, n, r, i = null) {
    let a = e[qa] || (e[qa] = {}),
        o = a[t];
    if (r && o) o.value = r;
    else {
        let [n, s] = Xa(t);
        r ? Ga(e, n, a[t] = eo(r, i), s) : o && (Ka(e, n, o, s), a[t] = void 0)
    }
}
var Ya = /(?:Once|Passive|Capture)$/;

function Xa(e) {
    let t;
    if (Ya.test(e)) {
        t = {};
        let n;
        for (; n = e.match(Ya);) e = e.slice(0, e.length - n[0].length), t[n[0].toLowerCase()] = !0
    }
    return [e[2] === `:` ? e.slice(3) : D(e.slice(2)), t]
}
var Za = 0,
    Qa = Promise.resolve(),
    $a = () => Za ||= (Qa.then(() => Za = 0), Date.now());

function eo(e, t) {
    let n = e => {
        if (!e._vts) e._vts = Date.now();
        else if (e._vts <= n.attached) return;
        tn(to(e, n.value), t, 5, [e])
    };
    return n.value = e, n.attached = $a(), n
}

function to(e, t) {
    if (d(t)) {
        let n = e.stopImmediatePropagation;
        return e.stopImmediatePropagation = () => {
            n.call(e), e._stopped = !0
        }, t.map(e => t => !t._stopped && e && e(t))
    } else return t
}
var no = e => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123,
    ro = (e, t, n, r, i, s) => {
        let c = i === `svg`;
        t === `class` ? ja(e, r, c)
            : t === `style` ? Ia(e, n, r)
            : a(t) ? o(t) || Ja(e, t, n, r, s)
            : (t[0] === `.` ? (t = t.slice(1), !0)
                : t[0] === `^` ? (t = t.slice(1), !1)
                : io(e, t, r, c))
                ? (Wa(e, t, r),
                    !e.tagName.includes(`-`) &&
                    (t === `value` || t === `checked` || t === `selected`) &&
                    Ua(e, t, r, c, s, t !== `value`))
                : e._isVueCE &&
                    (ao(e, t) || e._def.__asyncLoader && (/[A-Z]/.test(t) || !g(r)))
                    ? Wa(e, E(t), r, s, t)
                    : (t === `true-value` ? e._trueValue = r
                        : t === `false-value` && (e._falseValue = r),
                        Ua(e, t, r, c))
    };

function io(e, t, n, r) {
    if (r) return !!(t === `innerHTML` || t === `textContent` || t in e && no(t) && h(n));
    if (t === `spellcheck` || t === `draggable` || t === `translate` || t === `autocorrect` || t === `sandbox` && e.tagName === `IFRAME` || t === `form` || t === `list` && e.tagName === `INPUT` || t === `type` && e.tagName === `TEXTAREA`) return !1;
    if (t === `width` || t === `height`) {
        let t = e.tagName;
        if (t === `IMG` || t === `VIDEO` || t === `CANVAS` || t === `SOURCE`) return !1
    }
    return no(t) && g(n) ? !1 : t in e
}

function ao(e, t) {
    let n = e._def.props;
    if (!n) return !1;
    let r = E(t);
    return Array.isArray(n) ? n.some(e => E(e) === r) : Object.keys(n).some(e => E(e) === r)
}
var oo = e => {
        let t = e.props[`onUpdate:modelValue`] || !1;
        return d(t) ? e => ae(t, e) : t
    },
    so = Symbol(`_assign`),
    co = {
        deep: !0,
        created(e, t, n) {
            e[so] = oo(n), Ga(e, `change`, () => {
                let t = e._modelValue,
                    n = uo(e),
                    r = e.checked,
                    i = e[so];
                if (d(t)) {
                    let e = ye(t, n),
                        a = e !== -1;
                    if (r && !a) i(t.concat(n));
                    else if (!r && a) {
                        let n = [...t];
                        n.splice(e, 1), i(n)
                    }
                } else if (p(t)) {
                    let e = new Set(t);
                    r ? e.add(n) : e.delete(n), i(e)
                } else i(fo(e, r))
            })
        },
        mounted: lo,
        beforeUpdate(e, t, n) {
            e[so] = oo(n), lo(e, t, n)
        }
    };

function lo(e, {
    value: t,
    oldValue: n
}, r) {
    e._modelValue = t;
    let i;
    if (d(t)) i = ye(t, r.props.value) > -1;
    else if (p(t)) i = t.has(r.props.value);
    else {
        if (t === n) return;
        i = ve(t, fo(e, !0))
    }
    e.checked !== i && (e.checked = i)
}

function uo(e) {
    return `_value` in e ? e._value : e.value
}

function fo(e, t) {
    let n = t ? `_trueValue` : `_falseValue`;
    return n in e ? e[n] : t
}
var po = [`ctrl`, `shift`, `alt`, `meta`],
    mo = {
        stop: e => e.stopPropagation(),
        prevent: e => e.preventDefault(),
        self: e => e.target !== e.currentTarget,
        ctrl: e => !e.ctrlKey,
        shift: e => !e.shiftKey,
        alt: e => !e.altKey,
        meta: e => !e.metaKey,
        left: e => `button` in e && e.button !== 0,
        middle: e => `button` in e && e.button !== 1,
        right: e => `button` in e && e.button !== 2,
        exact: (e, t) => po.some(n => e[`${n}Key`] && !t.includes(n))
    },
    ho = (e, t) => {
        if (!e) return e;
        let n = e._withMods ||= {},
            r = t.join(`.`);
        return n[r] || (n[r] = ((n, ...r) => {
            for (let e = 0; e < t.length; e++) {
                let r = mo[t[e]];
                if (r && r(n, t)) return
            }
            return e(n, ...r)
        }))
    },
    go = s({
        patchProp: ro
    }, ka),
    _o;

function vo() {
    return _o ||= bi(go)
}
var yo = ((...e) => {
    let t = vo().createApp(...e),
        {
            mount: n
        } = t;
    return t.mount = e => {
        let r = xo(e);
        if (!r) return;
        let i = t._component;
        !h(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = ``);
        let a = n(r, !1, bo(r));
        return r instanceof Element && (r.removeAttribute(`v-cloak`), r.setAttribute(`data-v-app`, ``)), a
    }, t
});

function bo(e) {
    if (e instanceof SVGElement) return `svg`;
    if (typeof MathMLElement == `function` && e instanceof MathMLElement) return `mathml`
}

function xo(e) {
    return g(e) ? document.querySelector(e) : e
}
var So = {
    "12df4816fe3d405e80159260e7fa45a9.jpg": `tamper`,
    "130520c15c1a41d4ab3b776782b66274.jpg": `normal`,
    "535097b1c60f4bf98e0e7d9a3b602018.jpg": `tamper`,
    "477314902cb5448292beda263800e681.jpg": `tamper`,
    "24917793050c4ea9ad764a106d106b4f.jpg": `tamper`,
    "b357d87ac82d443a86905c1fa1a21c03.jpg": `tamper`,
    "d1c3ccdf956f47c1b565a11414e9127a.jpg": `tamper`,
    "d9e387645a2d46d4964aeb8ef2d98c5.jpg": `tamper`,
    "de9ba710bd3e4182b347e9ce05fe6806.jpg": `tamper`,
    "d9e387645a2d46d4964aeb8eff2d98c5.jpg": `tamper`,
    "2d82b045397c45229d91a725f6240576.jpg": `normal`,
    "28a5084ddbea403ba557bf675dafdc71.jpg": `normal`,
    "75d12b6f9c264a988cfd7ce92bce18e5.jpg": `normal`,
    "85b7d05457c44d98bbebde78bd5b4c8b.jpg": `normal`,
    "402a30ac04af4f86ae570b6edbbce068 (1).jpg": `normal`,
    "402a30ac04af4f86ae570b6edbbce068.jpg": `normal`,
    "2385ce832b314e3db9ce9fbbc340f4ae.jpg": `normal`,
    "4307a7d727844179b0273646b37bcb44 (1).jpg": `normal`,
    "4307a7d727844179b0273646b37bcb44.jpg": `normal`,
    "8639d443deae43a1909df6ff448a4bd7.jpg": `normal`,
    "c3a6ed644bf8425c8f8873af4e8a49eb.jpg": `normal`,
    "f35fab053ee44fc7889d3b6dec1464de.jpg": `normal`
};

function Co(e) {
    return So[(e.trim().split(/[/\\]/).pop() ?? e.trim()).toLowerCase()] ?? null
}

function wo() {
    return ``
}

function To(e) {
    return `${wo()}${e}`
}

function Eo(e, t) {
    let n = t?.trim() ?? ``,
        r = !n.startsWith(`<`) && n.length > 0 ? n.slice(0, 300) : ``;
    if (e === 502 || e === 503 || e === 504) {
        let t = `检测服务暂时不可用或网络异常，请稍后重试；若多次失败请联系管理员确认服务是否在线。`;
        return r ? `${r}\n\n${t}` : `暂时无法连接检测服务（${e}）\n${t}`
    }
    return r || `HTTP ${e}`
}

function Do(e) {
    return typeof e == `object` && !!e && !Array.isArray(e)
}
var Oo = `ai_detection_mock_history_v1`;

function ko() {
    return new Date().toISOString()
}

function Ao(e, t) {
    return Math.floor(Math.random() * (t - e + 1)) + e
}
async function jo(e, t) {
    await new Promise((n, r) => {
        let i = window.setTimeout(n, e);
        if (!t) return;
        let a = () => {
            window.clearTimeout(i), r(new DOMException(`Aborted`, `AbortError`))
        };
        if (t.aborted) return a();
        t.addEventListener(`abort`, a, {
            once: !0
        })
    })
}

function Mo(e) {
    let t = Math.min(e[0], e[2]),
        n = Math.min(e[1], e[3]),
        r = Math.max(e[0], e[2]),
        i = Math.max(e[1], e[3]);
    return [t, n, Math.max(1, r - t), Math.max(1, i - n)]
}

function No() {
    if (typeof window > `u`) return [];
    try {
        let e = localStorage.getItem(Oo);
        if (!e) return [];
        let t = JSON.parse(e);
        if (!Array.isArray(t)) return [];
        let n = [];
        for (let e of t) {
            if (!Do(e)) continue;
            let t = ps(e);
            t && n.push(t)
        }
        return n
    } catch {
        return []
    }
}

function Po(e) {
    if (!(typeof window > `u`)) try {
        localStorage.setItem(Oo, JSON.stringify(e))
    } catch {}
}

function Fo(e) {
    let t = 2166136261;
    for (let n = 0; n < e.length; n++) t ^= e.charCodeAt(n), t = Math.imul(t, 16777619);
    return t >>> 0
}

function Io(e) {
    let t = e >>> 0;
    return () => {
        t |= 0, t = t + 1831565813 | 0;
        let e = Math.imul(t ^ t >>> 15, 1 | t);
        return e ^= e + Math.imul(e ^ e >>> 7, 61 | e), ((e ^ e >>> 14) >>> 0) / 4294967296
    }
}

function Lo(e, t) {
    return t[Math.min(t.length - 1, Math.floor(e() * t.length))]
}

function Ro(e, t, n, r, i, a) {
    let o = Math.ceil(Math.sqrt(i)),
        s = Math.ceil(i / o),
        c = n / o,
        l = r / s,
        u = [],
        d = 0;
    for (let n = 0; n < s && d < i; n++)
        for (let r = 0; r < o && d < i; r++, d++) {
            let i = e + r * c,
                o = t + n * l,
                s = .05 + a() * .04,
                d = .1 + a() * .06,
                f = c * $(a, s, d),
                p = l * $(a, s, d),
                m = Math.max(2, (c - 32) / 2 - .5),
                h = Math.max(2, (l - 32) / 2 - .5);
            f = Math.min(f, m), p = Math.min(p, h), c - 2 * f < 32 && (f = Math.max(0, (c - 32) / 2)), l - 2 * p < 32 && (p = Math.max(0, (l - 32) / 2));
            let g = Math.round(i + f),
                _ = Math.round(o + p),
                v = Math.max(32, Math.round(c - 2 * f)),
                y = Math.max(32, Math.round(l - 2 * p));
            u.push([g, _, v, y])
        }
    return u
}

function zo(e, t, n, r, i, a) {
    let o = [],
        s = (t, r) => Math.max(e + 2, Math.min(e + n - r - 2, Math.round(t))),
        c = (e, n) => Math.max(t + 2, Math.min(t + r - n - 2, Math.round(e)));

    function l() {
        let i = Math.max(88, Math.min(n - 8, Math.round(n * $(a, .54, .8)))),
            l = Math.max(26, Math.round(r * $(a, .065, .115))),
            u = s(e + n / 2 + n * $(a, -.05, .05) - i / 2, i),
            d = c(t + r * $(a, .045, .2), l);
        o.push([u, d, i, l])
    }

    function u(i, l) {
        let u = Math.min(i, l),
            d = Math.max(i, l),
            f = Math.max(46, Math.min(n - 8, Math.round(n * $(a, .28, .44)))),
            p = Math.max(20, Math.round(r * $(a, .038, .072))),
            m = n * $(a, .008, .038),
            h = s(e + n - f - m, f),
            g = c(t + r * (u + (d - u) * $(a, .15, .9)), p);
        o.push([h, g, f, p])
    }
    if (i <= 1) {
        let e = a();
        return e < .55 ? l() : e < .8500000000000001 ? u(.03, .22) : u(.2, .62), o
    }
    return a() < .78 ? (l(), u(.22, .68), o) : (u(.04, .2), u(.22, .58), o)
}

function Bo(e, t, n) {
    return t + Math.floor(e() * (n - t + 1))
}

function $(e, t, n) {
    return t + e() * (n - t)
}

function Vo(e, t) {
    return e === `正常` ? $(t, .855, .972) : e === `可疑` ? $(t, .598, .852) : $(t, .705, .938)
}

function Ho(e, t, n) {
    let r = n.reduce((e, t) => e + t, 0);
    if (r <= 0) return t[0];
    let i = e() * r;
    for (let e = 0; e < t.length; e++)
        if (i -= n[e], i <= 0) return t[e];
    return t[t.length - 1]
}
var Uo = [`和周围衔接自然，看不出裁剪、拼接的痕迹。`, `明暗、颜色过渡正常，更像一次性拍出来或正常保存的图。`, `没有明显「一块贴上去」或重复图案的感觉。`],
    Wo = [`这一块和周围亮度、颜色差得有点明显，不排除改过或补过。`, `边缘有点「接不上」，建议您对照手机里的原图或系统记录再看一下。`, `截图类图片有时会误判，请结合真实交易界面或官方凭证核实。`],
    Go = [`能看出局部被涂改或替换过，边界比较生硬。`, `有「复制粘贴」那种重复纹理，和常见造假手法接近。`, `这一块颜色和周围不搭，像后来叠上去的内容。`, `扣减金额数字一带和周围衔接不自然，常见于改数、改账。`];

function Ko(e, t, n) {
    let r = n;
    return t === `正常` ? `关注区域${r}：${Lo(e,Uo)}` : t === `篡改` ? `关注区域${r}：${Lo(e,Go)}` : `关注区域${r}：${Lo(e,Wo)}`
}
var qo = [`整体来看，没有发现明显的修图或拼接痕迹。`, `没有发现需要特别留意的局部问题。`],
    Jo = [`有少数地方看起来不太自然，建议您再结合原始凭证或源文件核对。`, `系统标出了可疑位置，但还不能当作最终结论，最好人工再看一眼。`],
    Yo = [`多处特征显示这张图可能经过比较明显的后期编辑，重要用途请务必人工确认。`, `篡改痕迹相对明显，本结果仅供辅助参考，不能单独作为法律依据。`];

function Xo(e, t) {
    let n = Lo(e, t === `正常` ? qo : t === `篡改` ? Yo : Jo);
    return t === `正常` ? `${n}若仍有疑问，可换一张更清晰的原图再检测一次。` : `${n}图上的编号与框一一对应，请从下栏说明里按序号查看。`
}

function Zo(e) {
    return Lo(e, [`本次检测未发现明显修图或拼接痕迹，图片整体表现正常。`, `整体看起来没有明显改动痕迹；若您不放心，可换更清晰的原图再检一次。`])
}

function Qo(e, t, n) {
    if (t === `normal`) return e() < .9 ? `正常` : `可疑`;
    if (t === `suspicious`) return e() < .72 ? `可疑` : `篡改`;
    if (t === `tamper`) return e() < .82 ? `篡改` : `可疑`;
    let r = n.some(e => e.result === `篡改`),
        i = n.some(e => e.result === `可疑`);
    return r ? `篡改` : i ? `可疑` : `正常`
}

function $o(e) {
    let t = e.toLowerCase(),
        n = e => e.some(e => t.includes(e));
    return n([`没有p图`, `未p图`, `无p图`, `未ps`, `no_ps`, `nop`]) ? `normal`
        : n([`p图`, `有p图`, `ps图`, `ps_`, `_ps`, `photoshop`]) ? `tamper`
        : n([`正常`, `normal`, `authentic`, `real`, `true`]) ? `normal`
        : n([`可疑`, `suspicious`, `suspect`, `疑似`]) ? `suspicious`
        : n([`篡改`, `tamper`, `forg`, `fake`, `ps`, `编辑`]) ? `tamper`
        : `mixed`
}

function es(e) {
    let t = Co(e);
    return t === `tamper` ? `tamper` : t === `normal` ? `normal` : t === `mixed` ? `mixed` : $o(e)
}

function ts(e) {
    let t = (e || ``).toLowerCase();
    return [`没有p图`, `未p图`, `无p图`, `未ps`, `no_ps`, `nop`].some(e => t.includes(e))
}

function ns(e) {
    let t = (e || ``).toLowerCase();
    return ts(e) ? !1 : [`p图`, `有p图`, `ps图`, `photoshop`].some(e => t.includes(e))
}

function rs(e) {
    let t = Co(e);
    return t === `tamper` ? !1 : t === `normal` ? !0 : ts(e)
}

function is(e) {
    let t = Co(e);
    return t === `normal` ? !1 : t === `tamper` ? !0 : ns(e)
}

function as(e, t) {
    let [n, r, i, a] = Mo(e);
    return {
        result: {
            result: `正常`,
            confidence: Number(Vo(`正常`, t).toFixed(4)),
            bbox: [0, 0, 0, 0],
            reason: Zo(t),
            original_bbox: [n, r, n + i, r + a]
        },
        multi: []
    }
}

function os(e, t) {
    let [n, r, i, a] = Mo(e), o = Bo(t, 1, 2), s = [`正常`, `可疑`, `篡改`], c = [.04, .32, .64], l = zo(n, r, i, a, o, t), u = [];
    for (let e = 0; e < o; e++) {
        let [n, r, i, a] = l[e], o = Ho(t, s, c);
        u.push({
            result: o,
            confidence: Number(Vo(o, t).toFixed(4)),
            bbox: [n, r, i, a],
            reason: Ko(t, o, e + 1),
            original_bbox: [n, r, n + i, r + a]
        })
    }
    let d = Ho(t, [`篡改`, `可疑`], [.88, .12]);
    return {
        result: {
            result: d,
            confidence: Number(Vo(d, t).toFixed(4)),
            bbox: [n, r, i, a],
            reason: Xo(t, d),
            original_bbox: [n, r, n + i, r + a]
        },
        multi: u
    }
}

function ss() {
    return typeof crypto < `u` && typeof crypto.randomUUID == `function` ? crypto.randomUUID() : `mock-${Date.now()}-${Math.random().toString(36).slice(2,9)}`
}

function cs(e, t) {
    let n = Io(Fo((t || `unnamed`).toLowerCase()) ^ (Date.now() ^ performance.now() * 1e6) >>> 0);
    if (rs(t)) return as(e, n);
    if (is(t)) return os(e, n);
    let [r, i, a, o] = Mo(e), s = Bo(n, 1, 2), c = [`正常`, `可疑`, `篡改`], l = es(t), u = {
        normal: [.82, .15, .03],
        suspicious: [.16, .66, .18],
        tamper: [.05, .28, .67],
        mixed: [.34, .38, .28]
    }, d = l === `normal` ? Ro(r, i, a, o, s, n) : zo(r, i, a, o, s, n), f = [];
    for (let e = 0; e < s; e++) {
        let [t, r, i, a] = d[e], o = Ho(n, c, u[l]);
        f.push({
            result: o,
            confidence: Number(Vo(o, n).toFixed(4)),
            bbox: [t, r, i, a],
            reason: Ko(n, o, e + 1),
            original_bbox: [t, r, t + i, r + a]
        })
    }
    let p = Qo(n, l, f);
    return {
        result: {
            result: p,
            confidence: Number(Vo(p, n).toFixed(4)),
            bbox: [r, i, a, o],
            reason: Xo(n, p),
            original_bbox: [r, i, r + a, i + o]
        },
        multi: f
    }
}
async function ls(e, t, n) {
    await jo(Ao(4700, 5600), n);
    let r = ss(),
        i = cs(t, e.name || ``);
    return Po([{
        id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        created_at: ko(),
        mode: `v1-sync-mock`,
        task_id: r,
        original_filename: e.name || `未命名图片`,
        bbox: t,
        status: `COMPLETED`,
        outcome: {
            result: i.result,
            multi_results: i.multi,
            error_msg: null
        }
    }, ...No()].slice(0, 200)), {
        status: `COMPLETED`,
        result: i.result,
        multi: i.multi,
        error_msg: null,
        task_id: r
    }
}
async function us(e, t, n) {
    let r = new FormData;
    r.append(`file`, e, e.name || `image`), r.append(`bbox`, JSON.stringify(t));
    let i = await fetch(To(`/ai-detection/api/v1/image-detection/detect`), {
        method: `POST`,
        body: r,
        signal: n?.signal
    });
    if (!i.ok) {
        let e = await i.text();
        throw Error(Eo(i.status, e))
    }
    let a = await i.text(),
        o = null;
    try {
        o = a ? JSON.parse(a) : null
    } catch {}
    let c = Do(o) && `data` in o ? o.data : o,
        l = Do(c) && Do(c.result) ? c.result : Do(c) ? c : null,
        u = Array.isArray(c?.multi) ? c.multi : Array.isArray(c?.multi_results) ? c.multi_results : Array.isArray(c?.results) ? c.results : [],
        d = typeof c?.task_id == `string` ? c.task_id : typeof c?.taskId == `string` ? c.taskId : ``,
        f = typeof c?.error_msg == `string` ? c.error_msg : typeof c?.errorMsg == `string` ? c.errorMsg : null;
    return {
        status: f ? `FAILED` : `COMPLETED`,
        result: l,
        multi: u,
        error_msg: f,
        task_id: d
    }
}
async function ds(e) {
    let t = await fetch(To(`/ai-detection/api/v1/history/${encodeURIComponent(e)}/image`));
    if (!t.ok) {
        let e = await t.text();
        try {
            let t = JSON.parse(e);
            if (typeof t.detail == `string` && t.detail.trim()) throw Error(t.detail)
        } catch (e) {
            if (!(e instanceof SyntaxError)) throw e
        }
        throw Error(Eo(t.status, e))
    }
    return t.blob()
}

function fs(e) {
    let t = e.created_at ?? e.createdAt;
    if (t == null) return ``;
    if (typeof t == `string`) return t.trim();
    if (typeof t == `number` && Number.isFinite(t)) {
        let e = t > 0xe8d4a51000 ? t : t * 1e3;
        try {
            return new Date(e).toISOString()
        } catch {
            return ``
        }
    }
    return String(t).trim()
}

function ps(e) {
    let t = e.id;
    if (t == null) return null;
    let n = fs(e) || `—`,
        r = typeof e.status == `string` ? e.status : `COMPLETED`,
        i = typeof e.mode == `string` ? e.mode : `unknown`,
        a = typeof e.task_id == `string` ? e.task_id : typeof e.taskId == `string` ? e.taskId : null,
        o = typeof e.original_filename == `string` ? e.original_filename : typeof e.originalFilename == `string` ? e.originalFilename : null,
        s = null,
        c = e.outcome;
    return Do(c) && (s = {
        result: c.result ?? null,
        multi_results: Array.isArray(c.multi_results) ? c.multi_results : Array.isArray(c.multiResults) ? c.multiResults : void 0,
        error_msg: typeof c.error_msg == `string` ? c.error_msg : typeof c.errorMsg == `string` ? c.errorMsg : null
    }), {
        id: t,
        created_at: n,
        mode: i,
        task_id: a,
        original_filename: o,
        bbox: e.bbox,
        status: r,
        outcome: s
    }
}
async function ms(e = 1, t = 20) {
    let n = Math.max(1, e),
        r = Math.min(200, Math.max(1, t)),
        i = await fetch(To(`/ai-detection/api/v1/history?page=${n}&page_size=${r}`));
    if (!i.ok) {
        let e = await i.text();
        throw Error(Eo(i.status, e))
    }
    let a = await i.text(),
        o = null;
    try {
        o = a ? JSON.parse(a) : null
    } catch {}
    let c = Do(o) && `data` in o ? o.data : o,
        l = Array.isArray(c) ? c : Array.isArray(c?.items) ? c.items : [],
        u = Number.isFinite(Number(c?.total)) ? Number(c.total) : l.length,
        d = Number.isFinite(Number(c?.page)) ? Number(c.page) : n,
        f = Number.isFinite(Number(c?.page_size)) ? Number(c.page_size) : r;
    return {
        items: l,
        total: u,
        page: d,
        pageSize: f
    }
}

function hs(e) {
    let t = e.outcome ?? {},
        n = {
            result: t.result ?? null,
            multi: t.multi_results,
            error_msg: t.error_msg ?? null
        },
        r = e.original_filename?.trim();
    return {
        id: String(e.id),
        savedAt: e.created_at,
        taskId: (e.task_id ?? ``).trim(),
        fileName: r || `未命名图片`,
        payload: n,
        status: e.status?.toUpperCase() === `FAILED` ? `FAILED` : `COMPLETED`,
        mode: e.mode
    }
}
var gs = {
        class: `shell`
    },
    _s = {
        class: `topbar`
    },
    vs = {
        class: `topbar-inner`
    },
    ys = {
        class: `topbar-meta`
    },
    bs = [`title`],
    xs = {
        class: `main`
    },
    Ss = {
        class: `sidebar`
    },
    Cs = {
        class: `card side-section`
    },
    ws = {
        class: `dz-name`
    },
    Ts = {
        class: `option-row`
    },
    Es = {
        class: `switch-label`
    },
    Ds = {
        key: 0,
        class: `bbox-hint`
    },
    Os = {
        key: 0,
        class: `bbox-coords`
    },
    ks = {
        class: `card side-section actions-card`
    },
    As = [`disabled`],
    js = {
        key: 0,
        class: `btn-spinner`
    },
    Ms = {
        key: 1,
        class: `status-line`
    },
    Ns = {
        key: 2,
        class: `alert`
    },
    Ps = {
        class: `workspace-wrap`
    },
    Fs = {
        class: `workspace`
    },
    Is = {
        class: `card workspace-card`
    },
    Ls = {
        class: `workspace-head`
    },
    Rs = {
        class: `workspace-head-tags`
    },
    zs = {
        key: 0,
        class: `workspace-tip workspace-tip-muted`
    },
    Bs = {
        key: 1,
        class: `workspace-tip`
    },
    Vs = [`src`],
    Hs = [`viewBox`],
    Us = {
        key: 0
    },
    Ws = [`x`, `y`, `width`, `height`, `stroke`, `stroke-width`, `stroke-dasharray`],
    Gs = [`cx`, `cy`, `r`, `stroke-width`],
    Ks = [`x`, `y`, `font-size`],
    qs = [`x`, `y`, `width`, `height`, `stroke-width`],
    Js = [`x`, `y`, `width`, `height`, `stroke-width`],
    Ys = {
        key: 1,
        class: `history-schematic-wrap`
    },
    Xs = [`viewBox`],
    Zs = [`x`, `y`, `width`, `height`, `stroke`, `stroke-dasharray`],
    Qs = [`cx`, `cy`, `r`],
    $s = [`x`, `y`, `font-size`],
    ec = {
        key: 2,
        class: `empty-preview history-preview-placeholder`
    },
    tc = {
        key: 3,
        class: `empty-preview history-preview-placeholder`
    },
    nc = {
        key: 4,
        class: `empty-preview`
    },
    rc = {
        class: `card workspace-card results-card`
    },
    ic = {
        key: 0,
        class: `report`
    },
    ac = {
        class: `report-head`
    },
    oc = {
        class: `meter-wrap`
    },
    sc = {
        class: `meter-label`
    },
    cc = {
        class: `meter`
    },
    lc = {
        class: `report-reason`
    },
    uc = {
        key: 1,
        class: `multi-block`
    },
    dc = {
        class: `multi-scroll`
    },
    fc = {
        class: `multi-list`
    },
    pc = {
        class: `multi-li-top`
    },
    mc = {
        class: `region-idx`
    },
    hc = {
        class: `multi-confidence`
    },
    gc = {
        class: `multi-reason`
    },
    _c = {
        key: 1,
        class: `viz-wrap`
    },
    vc = {
        class: `viz-frame`
    },
    yc = [`src`],
    bc = {
        key: 2,
        class: `viz-miss-hint`
    },
    xc = {
        key: 3,
        class: `empty-report`
    },
    Sc = {
        class: `history-aside`,
        "aria-label": `历史记录`
    },
    Cc = {
        class: `card side-section history-card`
    },
    wc = {
        class: `history-head`
    },
    Tc = [`disabled`],
    Ec = {
        key: 0,
        class: `history-error`
    },
    Dc = {
        key: 1,
        class: `history-empty`
    },
    Oc = {
        key: 2,
        class: `history-list`,
        "aria-label": `检测历史列表`
    },
    kc = [`onClick`],
    Ac = {
        class: `history-time`
    },
    jc = [`title`],
    Mc = {
        key: 3,
        class: `history-footer`
    },
    Nc = {
        class: `history-count`
    },
    Pc = {
        class: `history-pager`,
        role: `navigation`,
        "aria-label": `历史记录分页`
    },
    Fc = [`disabled`],
    Ic = [`disabled`],
    Lc = [`src`],
    Rc = 9;
yo(((e, t) => {
    let n = e.__vccOpts || e;
    for (let [e, r] of t) n[e] = r;
    return n
})(Yn({
    __name: `App`,
    setup(e) {
        let t = B(null),
            n = B(null),
            r = B(null),
            i = B({
                w: 0,
                h: 0
            }),
            a = B(!1),
            o = B(!1),
            s = B(null),
            c = B(null),
            l = B(null),
            u = B(!1),
            d = B(``),
            f = B(null),
            p = B(!1),
            m = B(null),
            h = B(null),
            g = B(null),
            _ = B(!1),
            v = B([]),
            y = B(!1),
            b = B(null),
            x = B(0),
            S = B(1),
            C = Q(() => x.value <= 0 ? 0 : Math.ceil(x.value / Rc)),
            w = Q(() => S.value > 1),
            ee = Q(() => C.value > 0 && S.value < C.value),
            T = B(null),
            te = B(null),
            E = Q(() => `http://111.229.25.160:8002`.replace(/\/$/, ``));

        function ne(e) {
            ae(), n.value &&= (URL.revokeObjectURL(n.value), null), l.value = null, t.value = e, i.value = {
                w: 0,
                h: 0
            }, e && (n.value = URL.createObjectURL(e))
        }

        function D(e) {
            let t = e.target;
            ne(t.files?.[0] ?? null)
        }

        function re(e) {
            e.preventDefault(), p.value = !0
        }

        function ie() {
            p.value = !1
        }

        function O(e) {
            e.preventDefault(), p.value = !1;
            let t = e.dataTransfer?.files?.[0];
            t && /^image\//.test(t.type) && ne(t)
        }

        function ae() {
            f.value = null, T.value = null, h.value = null, te.value?.abort(), te.value = null, _.value = !1, g.value &&= (URL.revokeObjectURL(g.value), null), m.value = null
        }

        function k() {
            let e = r.value;
            i.value = e ? {
                w: e.naturalWidth,
                h: e.naturalHeight
            } : {
                w: 0,
                h: 0
            }
        }
        let oe = Q(() => Math.max(2, (i.value.w || 0) * .003));

        function se() {
            let e = r.value;
            if (!e?.naturalWidth || !s.value || !c.value) return null;
            let t = s.value,
                n = c.value,
                i = Math.max(0, Math.min(t.x, n.x)),
                a = Math.max(0, Math.min(t.y, n.y)),
                o = Math.min(e.naturalWidth, Math.max(t.x, n.x)),
                l = Math.min(e.naturalHeight, Math.max(t.y, n.y));
            return o - i < 2 || l - a < 2 ? null : [Math.round(i), Math.round(a), Math.round(o), Math.round(l)]
        }

        function ce(e, t) {
            let n = t.getBoundingClientRect(),
                r = (e.clientX - n.left) / n.width * t.naturalWidth,
                i = (e.clientY - n.top) / n.height * t.naturalHeight;
            return {
                x: Math.max(0, Math.min(t.naturalWidth, r)),
                y: Math.max(0, Math.min(t.naturalHeight, i))
            }
        }

        function ue(e) {
            let t = r.value;
            !t?.naturalWidth || u.value || (o.value = !0, s.value = ce(e, t), c.value = {
                ...s.value
            })
        }

        function de(e) {
            let t = r.value;
            !o.value || !t?.naturalWidth || (c.value = ce(e, t))
        }

        function fe() {
            if (!o.value) return;
            o.value = !1;
            let e = se();
            s.value = null, c.value = null, e && (l.value = e)
        }

        function pe() {
            let e = r.value;
            return e?.naturalWidth ? [0, 0, e.naturalWidth, e.naturalHeight] : null
        }
        let me = Q(() => {
            if (!r.value?.naturalWidth || !s.value || !c.value) return null;
            let e = s.value,
                t = c.value;
            return {
                x1: Math.min(e.x, t.x),
                y1: Math.min(e.y, t.y),
                x2: Math.max(e.x, t.x),
                y2: Math.max(e.y, t.y)
            }
        });

        function he(e) {
            return Math.max(0, e[2]) * Math.max(0, e[3])
        }

        function ge(e) {
            if (!Array.isArray(e) || e.length < 4) return null;
            let t = e.slice(0, 4).map(e => Number(e));
            if (!t.every(e => Number.isFinite(e))) return null;
            let [n, r, i, a] = t;
            return i <= 0 || a <= 0 ? null : [n, r, i, a]
        }

        function _e(e) {
            if (e.multi?.length) {
                let t = [];
                for (let n = 0; n < e.multi.length; n++) {
                    let r = e.multi[n];
                    if ((r.result || ``).trim() === `正常`) continue;
                    let i = ge(r?.bbox);
                    i && t.push({
                        n: n + 1,
                        bbox: i
                    })
                }
                return t.length ? [...t].sort((e, t) => he(e.bbox) - he(t.bbox)) : []
            }
            if (e.result) {
                if ((e.result.result || ``).trim() === `正常`) return [];
                let t = ge(e.result.bbox);
                if (t) return [{
                    n: 1,
                    bbox: t
                }]
            }
            return []
        }
        let ve = Q(() => {
                if (!i.value.w) return [];
                let e = h.value;
                return e ? _e(e) : []
            }),
            ye = Q(() => {
                if (!T.value || !h.value || n.value || g.value || _.value) return null;
                let e = _e(h.value);
                if (!e.length) return null;
                let t = 1 / 0,
                    r = 1 / 0,
                    i = -1 / 0,
                    a = -1 / 0;
                for (let {
                        bbox: n
                    }
                    of e) t = Math.min(t, n[0]), r = Math.min(r, n[1]), i = Math.max(i, n[0] + n[2]), a = Math.max(a, n[1] + n[3]);
                let o = i - t,
                    s = a - r,
                    c = Math.max(16, Math.min(o || 1, s || 1) * .06),
                    l = t - c,
                    u = r - c,
                    d = o + 2 * c,
                    f = s + 2 * c;
                if (!Number.isFinite(d) || !Number.isFinite(f) || d <= 0 || f <= 0) return null;
                let p = Math.max(d, f);
                return {
                    viewBox: `${l} ${u} ${d} ${f}`,
                    span: p,
                    boxes: e
                }
            });

        function be(e, t) {
            let n = Math.max(8, Math.min(22, t * .022)),
                r = e[0],
                i = e[1],
                a = e[2],
                o = e[3],
                s = r + n + 3,
                c = i + n + 3,
                l = r + n + 1,
                u = r + a - n - 1,
                d = i + n + 1,
                f = i + o - n - 1;
            s = u >= l ? Math.min(u, Math.max(l, s)) : r + a / 2, c = f >= d ? Math.min(f, Math.max(d, c)) : i + o / 2;
            let p = Math.max(12, Math.min(22, t * .028));
            return {
                cx: s,
                cy: c,
                r: n,
                fs: p
            }
        }
        let xe = Q(() => {
                let e = ye.value;
                return e ? e.boxes.map(t => ({
                    ...t,
                    ...be(t.bbox, e.span)
                })) : []
            }),
            Se = Q(() => !!T.value && !!m.value && !!h.value && !g.value && !_.value && !ye.value && _e(h.value).length > 0),
            M = Q(() => {
                let e = h.value?.multi;
                if (!e?.length) return [];
                let t = [];
                for (let n = 0; n < e.length; n++) {
                    let r = e[n];
                    (r.result || ``).trim() !== `正常` && t.push({
                        item: r,
                        regionNo: n + 1
                    })
                }
                return t
            }),
            Ce = Q(() => {
                let e = i.value.w || 800,
                    t = Math.max(12, Math.min(24, e * .022));
                return {
                    fs: t,
                    r: t * .55
                }
            });

        function we(e) {
            let {
                r: t
            } = Ce.value, n = e[0], r = e[1], i = e[2], a = e[3], o = n + t + 3, s = r + t + 3, c = n + t + 1, l = n + i - t - 1, u = r + t + 1, d = r + a - t - 1;
            return o = l >= c ? Math.min(l, Math.max(c, o)) : n + i / 2, s = d >= u ? Math.min(d, Math.max(u, s)) : r + a / 2, {
                cx: o,
                cy: s
            }
        }
        let N = [`#1d4ed8`, `#0d9488`, `#7c3aed`, `#c2410c`];

        function Te(e) {
            return N[(e - 1) % N.length]
        }
        let Ee = [`7 5`, `4 4`, `10 4`, `3 3`];

        function De(e) {
            return Ee[(e - 1) % Ee.length]
        }
        let Oe = Q(() => ve.value.map(e => ({
                ...e,
                ...we(e.bbox)
            }))),
            ke = B(!1);

        function Ae() {
            n.value && (ke.value = !0, window.addEventListener(`keydown`, Me))
        }

        function je() {
            ke.value = !1, window.removeEventListener(`keydown`, Me)
        }

        function Me(e) {
            e.key === `Escape` && je()
        }

        function Ne() {
            a.value || u.value || Ae()
        }
        let Pe = Q(() => {
            if (!l.value) return null;
            let [e, t, n, r] = l.value;
            return [e, t, n - e, r - t]
        });

        function Fe(e) {
            if (!e || e === `—`) return `—`;
            try {
                let t = new Date(e.replace(` `, `T`));
                return Number.isNaN(t.getTime()) ? e : t.toLocaleString(`zh-CN`, {
                    month: `2-digit`,
                    day: `2-digit`,
                    hour: `2-digit`,
                    minute: `2-digit`
                })
            } catch {
                return e
            }
        }

        function Ie(e, t = 18) {
            return e.length <= t ? e : `${e.slice(0,t-1)}…`
        }

        function Le(e) {
            return e.status === `FAILED` ? `失败` : e.payload.result?.result || e.payload.multi?.[0]?.result || `已完成`
        }

        function Re(e) {
            if (e.status === `FAILED`) return `失败`;
            let t = Le(e);
            return t === `正常` || t === `可疑` || t === `篡改` || t === `错误` ? t : ``
        }

        function P(e) {
            return !!(T.value === e.id || !T.value && e.taskId && m.value === e.taskId && h.value)
        }
        async function ze(e) {
            if (!y.value && !(e < 1) && !(x.value > 0 && e > Math.ceil(x.value / Rc))) {
                y.value = !0, b.value = null;
                try {
                    let t = await ms(e, Rc);
                    v.value = t.items.map(hs), x.value = t.total, S.value = e
                } catch (e) {
                    b.value = e instanceof Error ? e.message : String(e)
                } finally {
                    y.value = !1
                }
            }
        }
        async function F() {
            await ze(1)
        }

        function Be(e) {
            return JSON.parse(JSON.stringify(R(e)))
        }
        async function Ve(e) {
            if (!u.value) {
                if (f.value = null, d.value = ``, T.value = e.id, g.value &&= (URL.revokeObjectURL(g.value), null), e.status === `FAILED`) {
                    m.value = e.taskId || null, h.value = null, f.value = e.payload.error_msg || `该条检测未成功完成`;
                    return
                }
                m.value = e.taskId || null, h.value = Be(e.payload), e.taskId && Ue(e.taskId)
            }
        }
        ur(() => {
            F()
        });
        async function He() {
            if (!t.value) {
                f.value = `请先选择一张图片`;
                return
            }
            u.value = !0, f.value = null, T.value = null, h.value = null, m.value = null, g.value &&= (URL.revokeObjectURL(g.value), null), te.value?.abort();
            let e = new AbortController;
            te.value = e, d.value = ``;
            try {
                let n = a.value ? l.value ?? pe() : pe();
                if (!n) {
                    f.value = a.value ? `请框选区域或等待图片在预览区加载完成` : `请等待图片在预览区加载完成后再分析（需读取尺寸以提交整图区域）`;
                    return
                }
                d.value = `正在分析（同步接口），请稍候…`;
                let r = await us(t.value, n, {
                    signal: e.signal
                });
                if ((r.status?.toUpperCase() ?? ``) === `FAILED`) throw Error(r.error_msg || `分析未能完成`);
                if (r.error_msg?.trim() && !r.result && !r.multi?.length) throw Error(r.error_msg);
                if (!r.result && !r.multi?.length) throw Error(r.error_msg || `未返回检测结果`);
                h.value = {
                    result: r.result ?? null,
                    multi: r.multi,
                    error_msg: r.error_msg ?? null
                }, m.value = r.task_id?.trim() || null, d.value = `分析完成`, T.value = null, F(), m.value && Ue(m.value)
            } catch (e) {
                if (e instanceof DOMException && e.name === `AbortError`) {
                    d.value = `已取消`;
                    return
                }
                f.value = e instanceof Error ? e.message : String(e), d.value = ``
            } finally {
                te.value = null, u.value = !1
            }
        }
        async function Ue(e) {
            _.value = !0;
            try {
                let t = await ds(e);
                return g.value && URL.revokeObjectURL(g.value), g.value = URL.createObjectURL(t), !0
            } catch {
                return g.value = null, !1
            } finally {
                _.value = !1
            }
        }

        function We() {
            te.value?.abort()
        }
        return mr(() => {
            te.value?.abort(), window.removeEventListener(`keydown`, Me), n.value && URL.revokeObjectURL(n.value), g.value && URL.revokeObjectURL(g.value)
        }), (e, s) => (q(), J(`div`, gs, [Y(`header`, _s, [Y(`div`, vs, [s[5] ||= Y(`div`, {
            class: `brand`
        }, [Y(`span`, {
            class: `brand-mark`,
            "aria-hidden": `true`
        }), Y(`div`, null, [Y(`h1`, {
            class: `brand-title`
        }, `图像真伪检测`), Y(`p`, {
            class: `brand-sub`
        }, `检测图像是否存在后期篡改风险`)])], -1), Y(`div`, ys, [s[4] ||= Y(`span`, {
            class: `meta-label`
        }, `检测服务`, -1), Y(`span`, {
            class: `meta-value`,
            title: E.value
        }, j(E.value), 9, bs)])])]), Y(`div`, xs, [Y(`aside`, Ss, [s[15] ||= Y(`section`, {
            class: `card side-section`
        }, [Y(`h2`, {
            class: `section-title`
        }, `检测方式`), Y(`div`, {
            class: `mode-grid`
        }, [Y(`div`, {
            class: `mode-panel`,
            role: `status`
        }, [Y(`span`, {
            class: `mode-tile-title`
        }, `智能全图分析`), Y(`span`, {
            class: `mode-tile-desc`
        }, `自动查找关键区域并汇总结论，适合证件、票据等复杂画面`)])])], -1), Y(`section`, Cs, [s[14] ||= Y(`h2`, {
            class: `section-title`
        }, `上传图片`, -1), Y(`label`, {
            class: A([`drop-zone`, {
                over: p.value,
                hasFile: !!t.value
            }]),
            onDragover: re,
            onDragleave: ie,
            onDrop: O
        }, [Y(`input`, {
            class: `sr-only`,
            type: `file`,
            accept: `image/*`,
            onChange: D
        }, null, 32), t.value ? (q(), J(G, {
            key: 1
        }, [Y(`span`, ws, j(t.value.name), 1), s[9] ||= Y(`span`, {
            class: `dz-change`
        }, `点击更换图片`, -1)], 64)) : (q(), J(G, {
            key: 0
        }, [s[6] ||= Y(`span`, {
            class: `dz-icon`,
            "aria-hidden": `true`
        }, `＋`, -1), s[7] ||= Y(`span`, {
            class: `dz-text`
        }, `点击选择或拖拽图片到此处`, -1), s[8] ||= Y(`span`, {
            class: `dz-hint`
        }, `支持常见图片格式`, -1)], 64))], 34), Y(`div`, Ts, [Y(`label`, Es, [Cn(Y(`input`, {
            "onUpdate:modelValue": s[0] ||= e => a.value = e,
            type: `checkbox`,
            class: `switch-input`
        }, null, 512), [
            [co, a.value]
        ]), s[10] ||= Y(`span`, {
            class: `switch-ui`
        }, null, -1), s[11] ||= Y(`span`, {
            class: `switch-text`
        }, `仅分析我框出的区域`, -1)]), s[12] ||= Y(`p`, {
            class: `option-hint`
        }, ` 关闭此项时，将由系统自动在图中选取多个关键位置分别判断。 `, -1)]),
            a.value ? (q(), J(`div`, Ds, [
                s[13] ||= Y(`p`, null,
                    ` 在右侧预览区按住拖拽即可框选。开启本模式后请先框选再开始分析；也可框选整张图范围。 `, -1),
                l.value ? (q(), J(`p`, Os,
                    ` 已选区域（像素）：` + j(l.value.join(`, `)), 1))
                    : X(``, !0)
            ])) : X(``, !0)]),
            Y(`section`, ks, [Y(`button`, {
            type: `button`,
            class: `btn btn-primary`,
            disabled: u.value || !t.value,
            onClick: He
        }, [u.value ? (q(), J(`span`, js)) : X(``, !0), Yi(` ` + j(u.value ? `分析中…` : `开始分析`), 1)], 8, As), u.value ? (q(), J(`button`, {
            key: 0,
            type: `button`,
            class: `btn btn-secondary`,
            onClick: We
        }, ` 取消分析 `)) : X(``, !0), d.value ? (q(), J(`div`, Ms, [Y(`span`, {
            class: A([`status-dot`, {
                pulse: u.value
            }])
        }, null, 2), Yi(` ` + j(d.value), 1)])) : X(``, !0), f.value ? (q(), J(`p`, Ns, j(f.value), 1)) : X(``, !0)])]), Y(`div`, Ps, [Y(`main`, Fs, [Y(`section`, Is, [Y(`div`, Ls, [s[16] ||= Y(`h2`, {
            class: `section-title tight`
        }, `预览`, -1), Y(`div`, Rs, [T.value ? (q(), J(`span`, zs, `历史记录（无本地原图预览）`)) : X(``, !0), a.value ? (q(), J(`span`, Bs, `框选模式已开启`)) : X(``, !0), n.value ? (q(), J(`button`, {
            key: 2,
            type: `button`,
            class: `btn-preview-zoom`,
            onClick: Ae
        }, ` 放大查看 `)) : X(``, !0)])]), n.value ? (q(), J(`div`, {
            key: 0,
            class: `stage`,
            onMouseleave: s[1] ||= e => o.value ? fe() : null
        }, [Y(`img`, {
            ref_key: `imgRef`,
            ref: r,
            src: n.value,
            alt: `待检测图片`,
            class: A([`preview-img`, {
                "preview-img-zoomin": !a.value && !u.value
            }]),
            draggable: `false`,
            onLoad: k,
            onClick: Ne
        }, null, 42, Vs), i.value.w ? (q(), J(`svg`, {
            key: 0,
            class: `overlay-svg`,
            viewBox: `0 0 ${i.value.w} ${i.value.h}`,
            preserveAspectRatio: `xMidYMid meet`
        }, [Oe.value.length ? (q(), J(`g`, Us, [(q(!0), J(G, null, br(Oe.value, e => (q(), J(`g`, {
            key: `rg` + e.n
        }, [Y(`rect`, {
            x: e.bbox[0],
            y: e.bbox[1],
            width: e.bbox[2],
            height: e.bbox[3],
            fill: `rgba(37, 99, 235, 0.06)`,
            stroke: Te(e.n),
            "stroke-width": Math.max(1.1, oe.value * .75),
            "stroke-dasharray": De(e.n)
        }, null, 8, Ws), Y(`circle`, {
            cx: e.cx,
            cy: e.cy,
            r: Ce.value.r,
            fill: `#1d4ed8`,
            stroke: `#fff`,
            "stroke-width": Math.max(1, oe.value * .35)
        }, null, 8, Gs), Y(`text`, {
            x: e.cx,
            y: e.cy,
            "text-anchor": `middle`,
            "dominant-baseline": `central`,
            "font-size": Ce.value.fs * .88,
            "font-weight": `700`,
            fill: `#fff`,
            style: {
                "font-family": `system-ui, -apple-system, sans-serif`
            }
        }, j(e.n), 9, Ks)]))), 128))])) : X(``, !0), Pe.value && !h.value ? (q(), J(`rect`, {
            key: 1,
            x: Pe.value[0],
            y: Pe.value[1],
            width: Pe.value[2],
            height: Pe.value[3],
            fill: `rgba(14, 165, 233, 0.12)`,
            stroke: `#0ea5e9`,
            "stroke-width": oe.value,
            "stroke-dasharray": `8 6`
        }, null, 8, qs)) : X(``, !0), me.value ? (q(), J(`rect`, {
            key: 2,
            x: me.value.x1,
            y: me.value.y1,
            width: me.value.x2 - me.value.x1,
            height: me.value.y2 - me.value.y1,
            fill: `rgba(14, 165, 233, 0.18)`,
            stroke: `#0284c7`,
            "stroke-width": oe.value
        }, null, 8, Js)) : X(``, !0)], 8, Hs)) : X(``, !0), a.value ? (q(), J(`div`, {
            key: 1,
            class: `draw-layer`,
            onMousedown: ho(ue, [`prevent`]),
            onMousemove: de,
            onMouseup: fe
        }, null, 32)) : X(``, !0)], 32)) : T.value && h.value && ye.value ? (q(), J(`div`, Ys, [s[17] ||= Y(`p`, {
            class: `history-schematic-title`
        }, `区域位置示意`, -1), s[18] ||= Y(`p`, {
            class: `history-schematic-note`
        }, ` 无本机原图且未从服务器取回标注照片时，仅根据检测坐标绘制框线（与接口像素坐标一致，非真实底图）。 `, -1), (q(), J(`svg`, {
            class: `history-schematic-svg`,
            viewBox: ye.value.viewBox,
            preserveAspectRatio: `xMidYMid meet`
        }, [(q(!0), J(G, null, br(xe.value, e => (q(), J(`g`, {
            key: `hs` + e.n
        }, [Y(`rect`, {
            x: e.bbox[0],
            y: e.bbox[1],
            width: e.bbox[2],
            height: e.bbox[3],
            fill: `rgba(37, 99, 235, 0.08)`,
            stroke: Te(e.n),
            "stroke-width": `2`,
            "stroke-dasharray": De(e.n)
        }, null, 8, Zs), Y(`circle`, {
            cx: e.cx,
            cy: e.cy,
            r: e.r,
            fill: `#1d4ed8`,
            stroke: `#fff`,
            "stroke-width": `1.5`
        }, null, 8, Qs), Y(`text`, {
            x: e.cx,
            y: e.cy,
            "text-anchor": `middle`,
            "dominant-baseline": `central`,
            "font-size": e.fs * .88,
            "font-weight": `700`,
            fill: `#fff`,
            style: {
                "font-family": `system-ui, -apple-system, sans-serif`
            }
        }, j(e.n), 9, $s)]))), 128))], 8, Xs))])) : T.value && h.value && _.value ? (q(), J(`div`, ec, [...s[19] ||= [Y(`p`, null, `正在加载标注示意图…`, -1)]])) : T.value && h.value ? (q(), J(`div`, tc, [...s[20] ||= [Y(`p`, null, `当前为历史记录`, -1), Y(`p`, {
            class: `history-preview-hint`
        }, ` 原图未保存在本机。下方可查看当时结论与标注示意图（若服务端仍保留任务）；若无坐标数据则仅显示文字结论。 `, -1)]]))
            : (q(), J(`div`, nc, [
                ...s[21] ||= [Y(`p`, null, `请先在左侧上传一张图片`, -1)]
            ]))]),
            Y(`section`, rc, [s[25] ||= Y(`h2`, {
            class: `section-title tight`
        }, `检测报告`, -1), h.value ? (q(), J(`div`, ic, [h.value.result ? (q(), J(G, {
            key: 0
        }, [Y(`div`, ac, [Y(`span`, {
            class: A([`pill`, h.value.result.result || void 0])
        }, j(h.value.result.result || `—`), 3), Y(`div`, oc, [Y(`div`, sc, [s[22] ||= Y(`span`, null, `风险倾向`, -1), Y(`span`, null, j(((h.value.result.confidence ?? 0) * 100).toFixed(1)) + `%`, 1)]), Y(`div`, cc, [Y(`div`, {
            class: `meter-fill`,
            style: le({
                width: `${Math.min(100,Math.max(0,(h.value.result.confidence??0)*100))}%`
            })
        }, null, 4)])])]), Y(`p`, lc, j(h.value.result.reason || `—`), 1)], 64)) : X(``, !0), M.value.length ? (q(), J(`div`, uc, [s[23] ||= Y(`h3`, {
            class: `multi-heading`
        }, `各区域明细`, -1), Y(`div`, dc, [Y(`ul`, fc, [(q(!0), J(G, null, br(M.value, e => (q(), J(`li`, {
            key: e.regionNo
        }, [Y(`div`, pc, [Y(`span`, mc, j(e.regionNo) + `号`, 1), Y(`span`, {
            class: A([`pill sm`, e.item.result || void 0])
        }, j(e.item.result || `—`), 3), Y(`span`, hc, j(((e.item.confidence ?? 0) * 100).toFixed(1)) + `%`, 1)]), Y(`p`, gc, j(e.item.reason), 1)]))), 128))])])])) : X(``, !0)])) : X(``, !0), g.value ? (q(), J(`div`, _c, [s[24] ||= Y(`h3`, {
            class: `viz-heading`
        }, `标注示意图`, -1), Y(`div`, vc, [Y(`img`, {
            src: g.value,
            alt: `检测标注示意`,
            class: `viz-img`
        }, null, 8, yc)])]))
            : X(``, !0),
            Se.value ? (q(), J(`p`, bc,
                ` 本条任务的标注图在服务端已过期或未生成，故无示意图；左侧「区域位置示意」或下方文字为当前可用信息。 `))
                : X(``, !0),
            !h.value && !f.value && !u.value
                ? (q(), J(`p`, xc,
                    ` 完成检测后，将在此展示结论、说明与示意图。 `))
                : X(``, !0)])])]),
            Y(`aside`, Sc, [Y(`section`, Cc, [Y(`div`, wc, [s[26] ||= Y(`h2`, {
            class: `section-title history-title-merged`
        }, `历史记录`, -1), Y(`button`, {
            type: `button`,
            class: `btn-text-refresh`,
            disabled: y.value,
            onClick: F
        }, j(y.value ? `加载中…` : `刷新`), 9, Tc)]), s[27] ||= Y(`p`, {
            class: `history-api-hint`
        }, `来自服务端近 7 日记录（分页）`, -1), b.value ? (q(), J(`p`, Ec, j(b.value), 1)) : X(``, !0), !y.value && !v.value.length && !b.value ? (q(), J(`p`, Dc, ` 暂无记录。 `)) : X(``, !0), v.value.length ? (q(), J(`ul`, Oc, [(q(!0), J(G, null, br(v.value, e => (q(), J(`li`, {
            key: e.id,
            class: A([`history-row`, {
                active: P(e)
            }])
        }, [Y(`button`, {
            type: `button`,
            class: `history-main`,
            onClick: t => Ve(e)
        }, [Y(`span`, Ac, j(Fe(e.savedAt)), 1), Y(`span`, {
            class: `history-file`,
            title: e.fileName
        }, j(Ie(e.fileName)), 9, jc), Y(`span`, {
            class: A([`pill sm history-pill`, Re(e)])
        }, j(Le(e)), 3)], 8, kc)], 2))), 128))])) : X(``, !0), x.value > 0 ? (q(), J(`div`, Mc, [Y(`span`, Nc, ` 共 ` + j(x.value) + ` 条，第 ` + j(S.value) + ` / ` + j(C.value || 1) + ` 页（每页最多 ` + j(Rc) + ` 条） `, 1), Y(`div`, Pc, [Y(`button`, {
            type: `button`,
            class: `btn-history-page`,
            disabled: y.value || !w.value,
            onClick: s[2] ||= e => ze(S.value - 1)
        }, ` 上一页 `, 8, Fc), Y(`button`, {
            type: `button`,
            class: `btn-history-page`,
            disabled: y.value || !ee.value,
            onClick: s[3] ||= e => ze(S.value + 1)
        }, ` 下一页 `, 8, Ic)])])) : X(``, !0)])])]), (q(), Bi(Wn, {
            to: `body`
        }, [ke.value && n.value ? (q(), J(`div`, {
            key: 0,
            class: `preview-lightbox`,
            role: `dialog`,
            "aria-modal": `true`,
            "aria-label": `图片放大预览`,
            onClick: ho(je, [`self`])
        }, [Y(`button`, {
            type: `button`,
            class: `preview-lightbox-close`,
            "aria-label": `关闭`,
            onClick: je
        }, ` × `), Y(`img`, {
            src: n.value,
            alt: ``,
            class: `preview-lightbox-img`
        }, null, 8, Lc), s[28] ||= Y(`p`, {
            class: `preview-lightbox-hint`
        }, `点击背景或 × 关闭，按 Esc 退出`, -1)])) : X(``, !0)]))]))
    }
}), [
    [`__scopeId`, `data-v-2905971b`]
])).mount(`#app`);