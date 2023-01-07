
const { cssom, install } = require('../lib/index.js')
// Do not import CSSOM implementations before the above import
const {
    ACCESS_THIRD_PARTY_STYLESHEET_ERROR,
    INSERT_INVALID_IMPORT_ERROR,
    UPDATE_LOCKED_STYLESHEET_ERROR,
} = require('../lib/cssom/CSSStyleSheet-impl.js')
const { SET_INVALID_KEY_TEXT_ERROR } = require('../lib/cssom/CSSKeyframeRule-impl.js')
const {
    INSERT_RULE_INVALID_GRAMMAR_ERROR,
    INSERT_RULE_INVALID_INDEX_ERROR,
    INSERT_RULE_INVALID_POSITION_ERROR,
    INVALID_NAMESPACE_STATE_ERROR,
    INVALID_RULE_SYNTAX_ERROR,
} = require('../lib/parse/syntax.js')
const createError = require('../lib/error.js')

const {
    // CSSColorProfile,
    // CSSContainerRule,
    // CSSCounterStyleRule,
    CSSFontFaceRule,
    // CSSFontFeatureValuesRule,
    // CSSFontPaletteValuesRule,
    CSSImportRule,
    CSSKeyframeRule,
    CSSKeyframesRule,
    // CSSLayerBlockRule,
    // CSSLayerStatementRule,
    CSSMarginRule,
    CSSMediaRule,
    CSSNamespaceRule,
    CSSPageRule,
    // CSSPropertyRule,
    CSSRuleList,
    CSSStyleDeclaration,
    CSSStyleRule,
    CSSStyleSheet,
    CSSSupportsRule,
    MediaList,
} = cssom

/**
 * @param {string} [rules]
 * @param {object} [properties]
 * @returns {CSSStyleSheet}
 *
 * It returns a non-constructed CSSStyleSheet by using default values for the
 * required arguments.
 */
function createStyleSheet(rules = '', properties = {}) {
    properties = {
        location: 'https://github.com/cdoublev/stylesheet.css',
        media: '',
        originClean: true,
        rules,
        ...properties,
    }
    return CSSStyleSheet.create(globalThis, undefined, properties)
}

beforeAll(() => {
    install()
    globalThis.document = {
        href: 'https://github.com/cdoublev/',
    }
})

describe('CSSStyleSheet', () => {
    it('creates a constructed CSSStyleSheet', () => {

        const media = 'all'
        const options = { baseURL: 'css', disabled: true, media }
        const styleSheet = new globalThis.CSSStyleSheet(options)

        // StyleSheet properties
        expect(styleSheet.disabled).toBeTruthy()
        expect(styleSheet.href).toBe(globalThis.document.href)
        expect(MediaList.is(styleSheet.media)).toBeTruthy()
        expect(styleSheet.media.mediaText).toBe(media)
        expect(styleSheet.ownerNode).toBeNull()
        expect(styleSheet.parentStyleSheet).toBeNull()
        expect(styleSheet.title).toBe('')
        expect(styleSheet.type).toBe('text/css')

        // CSSStyleSheet properties
        expect(styleSheet.ownerRule).toBeNull()
    })
    it('creates a non-constructed CSSStyleSheet', () => {

        const input = `
            @import "./stylesheet.css";
            .selector {}
        `
        const location = 'http://github.com/cdoublev/css/'
        const media = 'all'
        const ownerNode = { type: 'HTMLLinkElement' }
        const title = 'Main CSS'
        const properties = {
            location,
            media,
            originClean: true,
            ownerNode,
            title,
        }
        const styleSheet = createStyleSheet(input, properties)

        expect(CSSStyleSheet.is(styleSheet)).toBeTruthy()

        // StyleSheet properties
        expect(styleSheet.disabled).toBeFalsy()
        expect(styleSheet.href).toBe(location)
        expect(MediaList.is(styleSheet.media)).toBeTruthy()
        expect(styleSheet.media.mediaText).toBe(media)
        expect(styleSheet.ownerNode).toBe(ownerNode)
        expect(styleSheet.parentStyleSheet).toBeNull()
        expect(styleSheet.title).toBe(title)
        expect(styleSheet.type).toBe('text/css')

        // CSSStyleSheet properties
        expect(CSSRuleList.is(styleSheet.cssRules)).toBeTruthy()
        expect(CSSImportRule.is(styleSheet.cssRules[0])).toBeTruthy()
        expect(CSSStyleRule.is(styleSheet.cssRules[1])).toBeTruthy()
        expect(styleSheet.ownerRule).toBeNull()
    })
})
describe('CSSStyleSheet.insertRule(), CSSStyleSheet.deleteRule()', () => {
    it('inserts and deletes a rule', () => {

        const styleSheet = new globalThis.CSSStyleSheet()
        const { cssRules } = styleSheet

        styleSheet.insertRule('.selector { color: red }', 0)

        expect(cssRules).toHaveLength(1)

        const [styleRule] = cssRules

        expect(CSSStyleRule.is(styleRule)).toBeTruthy()

        styleSheet.insertRule('.selector { color: green }', 0)

        expect(cssRules[1]).toBe(styleRule)

        styleSheet.deleteRule(1)

        expect(cssRules).toHaveLength(1)
        expect(styleRule.parentStyleSheet).toBeNull()
    })
    it('returns a syntax error when trying to insert a statement that is not a rule', () => {

        const styleSheet = new globalThis.CSSStyleSheet()
        const error = createError(INVALID_RULE_SYNTAX_ERROR, true)

        expect(styleSheet.insertRule('color: red')).toEqual(error)
    })
    it('throws an error when trying to insert/delete a rule in a stylesheet whose origin is not clean', () => {

        const styleSheet = createStyleSheet('.selector { color: red }', { originClean: false })
        const error = createError(ACCESS_THIRD_PARTY_STYLESHEET_ERROR)

        expect(() => styleSheet.insertRule('.selector { color: green }')).toThrow(error)
        expect(() => styleSheet.deleteRule(0)).toThrow(error)
    })
    it('throws an error when trying to insert/delete a rule while modifications on the stylesheet are not allowed', () => {

        const styleSheet = new globalThis.CSSStyleSheet()
        const error = createError(UPDATE_LOCKED_STYLESHEET_ERROR)

        styleSheet.insertRule('.selector { color: green }')
        styleSheet.replace('.selector { color: orange }')

        expect(() => styleSheet.insertRule('.selector { color: red }')).toThrow(error)
        expect(() => styleSheet.deleteRule(0)).toThrow(error)
    })
    it('throws an error when trying to insert @import in a constructed style sheet', () => {

        const styleSheet = new globalThis.CSSStyleSheet()
        const error = createError(INSERT_INVALID_IMPORT_ERROR)

        expect(() => styleSheet.insertRule('@import "./stylesheet.css";')).toThrow(error)
    })
    it('throws an error when trying to insert/delete a rule at an index greater than the length of the list of rules', () => {

        const styleSheet = new globalThis.CSSStyleSheet()
        const error = createError(INSERT_RULE_INVALID_INDEX_ERROR)

        expect(() => styleSheet.insertRule('.selector { color: red }', 1)).toThrow(error)
        expect(() => styleSheet.deleteRule(0)).toThrow(error)
    })
    it('throws an error when trying to insert an invalid rule', () => {

        const styleSheet = new globalThis.CSSStyleSheet()
        const error = createError(INSERT_RULE_INVALID_GRAMMAR_ERROR)

        expect(() => styleSheet.insertRule('@namespace <bad-string-or-url>;', 0)).toThrow(error)
    })
    it('throws an error when trying to insert a rule at an invalid position', () => {

        // Use a non-constructed style sheet in order to be allowed to insert @import
        const styleSheet = createStyleSheet()
        const error = createError(INSERT_RULE_INVALID_POSITION_ERROR)

        styleSheet.insertRule('@import "./stylesheet.css";')

        expect(() => styleSheet.insertRule('@namespace svg "http://www.w3.org/2000/svg";')).toThrow(error)
        expect(() => styleSheet.insertRule('.selector { color: red }')).toThrow(error)

        styleSheet.insertRule('@namespace svg "http://www.w3.org/2000/svg";', 1)

        expect(() => styleSheet.insertRule('.selector { color: red }', 1)).toThrow(error)
        expect(() => styleSheet.insertRule('@import "./stylesheet.css";', 2)).toThrow(error)

        styleSheet.insertRule('.selector { color: red }', 2)

        expect(() => styleSheet.insertRule('@import "./stylesheet.css";', 3)).toThrow(error)
        expect(() => styleSheet.insertRule('@namespace svg "http://www.w3.org/2000/svg";', 3)).toThrow(error)
    })
    it('throws an error when trying to insert @namespace if any rule that is not @namespace or @import rule exists', () => {

        const styleSheet = new globalThis.CSSStyleSheet()

        styleSheet.insertRule('.selector { color: red }')

        expect(() => styleSheet.insertRule('@namespace svg "http://www.w3.org/2000/svg";'))
            .toThrow(INVALID_NAMESPACE_STATE_ERROR)
    })
})
describe('CSSStyleSheet.replace(), CSSStyleSheet.replaceSync()', () => {
    it('replaces a rule asynchronously/synchronously', async () => {

        const styleSheet = new globalThis.CSSStyleSheet()
        const { cssRules } = styleSheet

        expect(await styleSheet.replace('.selector { color: orange }')).toBe(styleSheet)
        expect(cssRules).toHaveLength(1)
        expect(cssRules[0].style.color).toBe('orange')

        styleSheet.replaceSync('.selector { color: green }')

        expect(cssRules).toHaveLength(1)
        expect(cssRules[0].style.color).toBe('green')
    })
    it('throws an error when trying to replace rules of a non-constructed stylesheet', () => {
        expect(() => createStyleSheet('.selector { color: red }').replaceSync(''))
            .toThrow(UPDATE_LOCKED_STYLESHEET_ERROR)
    })
    it('throws an error when trying to replace rules concurrently', async () => {

        const styleSheet = new globalThis.CSSStyleSheet()
        const error = createError(UPDATE_LOCKED_STYLESHEET_ERROR)

        styleSheet.replace('')

        return expect(styleSheet.replace('')).rejects.toMatchObject(error)
    })
    it('ignores import rules and invalid statements', () => {

        const styleSheet = new globalThis.CSSStyleSheet()
        const { cssRules } = styleSheet
        const rules = `
            @import "./stylesheet.css";
            @namespace <bad-string-or-url>;
            .selector { color: green }
            color: red
        `

        styleSheet.replaceSync(rules)

        expect(cssRules).toHaveLength(1)

        const [styleRule] = cssRules

        expect(CSSStyleRule.is(styleRule)).toBeTruthy()
        expect(styleRule.style.color).toBe('green')
    })
})

describe('CSSRuleList.item(), CSSRuleList[', () => {
    it('returns the rule at the given index', () => {
        const { cssRules } = createStyleSheet(`
            #rule-1 {}
            #rule-2 {}
        `)
        expect(cssRules.item(1)).toBe(cssRules[1])
        expect(cssRules.item(2)).toBeNull()
    })
})
describe('CSSRuleList.length', () => {
    it('returns the length of the rule list', () => {
        const { cssRules } = createStyleSheet(`
            #rule-1 {}
            #rule-2 {}
        `)
        expect(cssRules).toHaveLength(2)
    })
})

describe('grammar rules', () => {
    it('does not ignore a rule wrapped in an HTML comment at the top-level of the style sheet', () => {

        // CSS Syntax throws invalid tokens away until reading `;`
        const { cssRules } = createStyleSheet(`
            <!-- .selector { color: green } -->
            .selector {
                <!-- color: red; -->;
                color: green;
                <!-- color: red; -->
            }
        `)

        expect(cssRules).toHaveLength(2)
        expect(cssRules[1].style.color).toBe('green')
    })
    it('ignores a rule whose name is unrecognized', () => {

        const { cssRules } = createStyleSheet(`
            @unknown {}
            @unknown;
        `)

        expect(cssRules).toHaveLength(0)
    })
    it('ignores a rule whose prelude or block value is invalid according to its production rule', () => {

        const { cssRules } = createStyleSheet(`
            @namespace ns {}
            @media all;
            .selector;
        `)

        expect(cssRules).toHaveLength(0)
    })
    it('ignores @charset', () => {

        const { cssRules: [styleRule1, styleRule2] } = createStyleSheet(`
            @charset "utf-8";
            .selector {
                color: green;
            }
            @charset "utf-8";
            .selector {
                color: green;
            }
        `)

        expect(CSSStyleRule.is(styleRule1)).toBeTruthy()
        expect(CSSStyleRule.is(styleRule2)).toBeTruthy()
    })
    it('ignores @import preceded by any other valid rule than @charset', () => {

        const { cssRules: [styleRule1, styleRule2] } = createStyleSheet(`
            .selector {
                color: green;
            }
            @import "./stylesheet.css";
            .selector {
                color: green;
            }
        `)

        expect(CSSStyleRule.is(styleRule1)).toBeTruthy()
        expect(CSSStyleRule.is(styleRule2)).toBeTruthy()
    })
    it('does not ignore @import preceded by invalid rule(s) or followed by @charset', () => {

        const { cssRules: [importRule] } = createStyleSheet(`
            @namespace <bad-string-or-url>;
            @import "./stylesheet.css";
            @charset "utf-8";
        `)

        expect(CSSImportRule.is(importRule)).toBeTruthy()
    })
    it('ignores @namespace preceded by any other valid rules than @import or @charset', () => {

        const { cssRules: [styleRule1, styleRule2] } = createStyleSheet(`
            .selector {
                color: green;
            }
            @namespace svg "http://www.w3.org/2000/svg";
            .selector {
                color: green;
            }
        `)

        expect(CSSStyleRule.is(styleRule1)).toBeTruthy()
        expect(CSSStyleRule.is(styleRule2)).toBeTruthy()
    })
    it('does not ignore @namespace preceded by invalid rule(s) or followed by @charset or invalid @import', () => {

        const { cssRules: [namespaceRule, ...otherRules] } = createStyleSheet(`
            @import <bad-string-or-url>;
            @namespace svg "http://www.w3.org/2000/svg";
            @charset "UTF-8";
            @import <bad-string-or-url>;
        `)

        expect(CSSNamespaceRule.is(namespaceRule)).toBeTruthy()
        expect(otherRules).toHaveLength(0)
    })
    it('ignores a rule not allowed at the top-level of the style sheet', () => {

        // The nesting selector is valid but matches no element
        const { cssRules } = createStyleSheet(`
            @top-left {}
            & {
                color: green;
            }
            0% {}
        `)

        expect(cssRules).toHaveLength(1)
        expect(CSSStyleRule.is(cssRules[0])).toBeTruthy()
    })
    it('ignores a rule not allowed in @media', () => {

        const { cssRules: [{ cssRules }] } = createStyleSheet(`
            @media all {
                @import "./stylesheet.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @top-left {}
                & {
                    color: green;
                }
                0% {}
            }
        `)

        expect(cssRules).toHaveLength(1)
        expect(CSSStyleRule.is(cssRules[0])).toBeTruthy()
    })
    it('ignores a rule not allowed in @supports', () => {

        const { cssRules: [{ cssRules }] } = createStyleSheet(`
            @supports (color: green) {
                @import "./stylesheet.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @top-left {}
                & {
                    color: green;
                }
                0% {}
            }
        `)

        expect(cssRules).toHaveLength(1)
        expect(CSSStyleRule.is(cssRules[0])).toBeTruthy()
    })
    it('ignores a rule not allowed in @keyframes', () => {

        // CSS Syntax throws invalid tokens away until reading `;`
        const { cssRules: [{ cssRules }] } = createStyleSheet(`
            @keyframes myAnimation {
                @import "./stylesheet.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @keyframes subAnimation {}
                @media all {}
                @top-left {}
                @supports (color: red) {}
                .selector {}
                0% {
                    color: green;
                }
                & {}
            }
        `)

        expect(cssRules).toHaveLength(1)
        expect(CSSKeyframeRule.is(cssRules[0])).toBeTruthy()
    })
    it('ignores a rule not allowed in @page', () => {

        // CSS Syntax throws invalid tokens away until reading `;`
        const { cssRules: [{ cssRules, style: { color } }] } = createStyleSheet(`
            @page {
                @import "./stylesheet.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @keyframes myAnimation {}
                @media all {}
                @supports (color: red) {}
                & {};
                @top-left {
                    color: green;
                }
                color: green;
                0% {}
            }
        `)

        expect(cssRules).toHaveLength(1)
        expect(CSSMarginRule.is(cssRules[0])).toBeTruthy()
        expect(color).toBe('green')
    })
    it('ignores a rule not allowed in a keyframe rule', () => {

        // CSS Syntax throws invalid tokens away until reading `;`
        const { cssRules: [{ cssRules: [{ style: { color } }] }] } = createStyleSheet(`
            @keyframes myAnimation {
                0% {
                    @import "./stylesheet.css";
                    @namespace svg "http://www.w3.org/2000/svg";
                    @keyframes myAnimation {}
                    @media all {}
                    @top-left {}
                    @supports (color: red) {}
                    & {};
                    color: green;
                    0% {}
                }
            }
        `)

        expect(color).toBe('green')
    })
    it('ignores a rule not allowed in a margin rule', () => {

        // CSS Syntax throws invalid tokens away until reading `;`
        const { cssRules: [{ cssRules: [{ style: { color } }] }] } = createStyleSheet(`
            @page {
                @top-left {
                    @import "./stylesheet.css";
                    @namespace svg "http://www.w3.org/2000/svg";
                    @keyframes myAnimation {}
                    @media all {}
                    @top-left {}
                    @supports (color: red) {}
                    & {};
                    color: green;
                    0% {}
                }
            }
        `)

        expect(color).toBe('green')
    })
    it('ignores a rule not allowed in a style rule', () => {

        // CSS Syntax throws invalid tokens away until reading `;`
        const { cssRules: [{ cssRules, style }] } = createStyleSheet(`
            .selector {
                top: 1px;
                @import "./stylesheet.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @keyframes myAnimation {}
                @top-left {}
                identifier {};
                & {
                    color: green;
                }
                @media all {
                    color: green;
                }
                @supports (color: green) {
                    color: green;
                }
                0% {};
                bottom: 1px;
            }
        `)

        expect(style.top).toBe('1px')
        expect(style.bottom).toBe('1px')
        expect(cssRules).toHaveLength(3)

        const [styleRule, mediaRule, supportsRule] = cssRules

        expect(CSSStyleRule.is(styleRule)).toBeTruthy()
        expect(CSSMediaRule.is(mediaRule)).toBeTruthy()
        expect(CSSSupportsRule.is(supportsRule)).toBeTruthy()
        expect(styleRule.style.color).toBe('green')
        // https://github.com/w3c/csswg-drafts/issues/7830
        // expect(mediaRule.style.color).toBe('green')
        // expect(supportsRule.style.color).toBe('green')
    })
    it('ignores a rule not allowed in a nested style rule', () => {

        // CSS Syntax throws invalid tokens away until reading `;`
        const { cssRules: [{ cssRules: [styleRule] }] } = createStyleSheet(`
            .selector {
                & {
                    top: 1px;
                    @import "./stylesheet.css";
                    @namespace svg "http://www.w3.org/2000/svg";
                    @keyframes myAnimation {}
                    @top-left {}
                    identifier {};
                    & {
                        color: green;
                    }
                    bottom: 2px;
                    0% {};
                    bottom: 1px;
                }
            }
        `)

        expect(CSSStyleRule.is(styleRule)).toBeTruthy()

        const { cssRules: [nestedStyleRule], style } = styleRule

        expect(style.top).toBe('1px')
        expect(style.bottom).toBe('1px')
        expect(CSSStyleRule.is(nestedStyleRule)).toBeTruthy()
        expect(nestedStyleRule.style.color).toBe('green')
    })
    it('ignores a rule not allowed in a conditional rule nested in a style rule', () => {

        // CSS Syntax throws invalid tokens away until reading `;`
        const { cssRules: [{ cssRules: [mediaRule] }] } = createStyleSheet(`
            .selector {
                @media all {
                    top: 1px;
                    @import "./stylesheet.css";
                    @namespace svg "http://www.w3.org/2000/svg";
                    @keyframes myAnimation {}
                    @top-left {}
                    identifier {};
                    @media all {
                        color: green;
                    }
                    0% {};
                    bottom: 1px;
                }
            }
        `)

        expect(CSSMediaRule.is(mediaRule)).toBeTruthy()

        const { cssRules: [nestedMediaRule], style } = mediaRule

        // https://github.com/w3c/csswg-drafts/issues/7830
        // expect(style.top).toBe('1px')
        // expect(style.bottom).toBe('2px')
        expect(CSSMediaRule.is(nestedMediaRule)).toBeTruthy()
        // expect(nestedMediaRule.style.color).toBe('green')
    })
    it('ignores a style rule whose prelude includes an undeclared namespace prefix', () => {

        const input = `
            @namespace svg url("http://www.w3.org/2000/svg");
            svg|rect { fill: green }
            SVG|rect { fill: red }
        `
        const styleSheet = createStyleSheet(input)
        const { cssRules } = styleSheet

        expect(cssRules).toHaveLength(2)

        const [, { selectorText, style: { fill } }] = cssRules

        expect(selectorText).toBe('svg|rect')
        expect(fill).toBe('green')
    })
    it('ignores a declaration at the top-level of the style sheet', () => {

        // CSS Syntax throws invalid tokens away until reading `{}`
        const { cssRules: [styleRule] } = createStyleSheet(`
            color: red; {}
            .selector { color: green }
            color: red;
        `)

        expect(CSSStyleRule.is(styleRule)).toBeTruthy()
    })
    it('ignores a declaration in <stylesheet>', () => {

        // CSS Syntax throws invalid tokens away until reading `{}`
        const { cssRules: [mediaRule] } = createStyleSheet(`
            @media all {
                color: red; {}
                @media all {
                    color: red;
                }
                .selector {
                    color: green;
                }
                @supports (color: green) {
                    color: red;
                }
            }
        `)

        expect(CSSMediaRule.is(mediaRule)).toBeTruthy()
        expect(mediaRule.cssRules).toHaveLength(3)

        const { cssRules: [nestedMediaRule, styleRule, supportsRule], style } = mediaRule

        expect(CSSStyleRule.is(styleRule)).toBeTruthy()
        // https://github.com/w3c/csswg-drafts/issues/7830
        // expect(style).toBeNull()
        // expect(nestedMediaRule.style).toBeNull()
        // expect(supportsRule.style).toBeNull()
    })
    it('ignores a declaration in <rule-list>', () => {

        // CSS Syntax throws invalid tokens away until reading `{}`
        const { cssRules: [keyframesRule] } = createStyleSheet(`
            @keyframes myAnimation {
                color: red; {}
                to {
                    color: green;
                }
                color: red;
            }
        `)

        expect(CSSKeyframesRule.is(keyframesRule)).toBeTruthy()

        const { cssRules: [keyframeRule] } = keyframesRule

        expect(CSSKeyframeRule.is(keyframeRule)).toBeTruthy()
    })
    it('ignores a declaration for an unknown property', () => {

        const { cssRules: [styleRule] } = createStyleSheet(`
            .selector {
                unknown-before: red;
                color: green;
                unknown-after: red;
            }
        `)

        expect(CSSStyleRule.is(styleRule)).toBeTruthy()
        expect(styleRule.style).toHaveLength(1)
        expect(styleRule.style.color).toBe('green')
    })
    it('ignores a declaration of an invalid value', () => {

        const { cssRules: [styleRule] } = createStyleSheet(`
            .selector {
                top: invalid;
                color: green;
                bottom: invalid;
            }
        `)

        expect(CSSStyleRule.is(styleRule)).toBeTruthy()
        expect(styleRule.style).toHaveLength(1)
        expect(styleRule.style.color).toBe('green')
    })
    it('ignores a declaration for a disallowed property or of an invalid value in a keyframe rule', () => {

        // `!important` is invalid in a keyframe rule
        const { cssRules: [{ cssRules: [keyframeRule] }] } = createStyleSheet(`
            @keyframes myAnimation {
                to {
                    animation-delay: 1s;
                    color: green;
                    animation-duration: 1s;
                    color: red !important;
                }
            }
        `)

        expect(CSSKeyframeRule.is(keyframeRule)).toBeTruthy()
        expect(keyframeRule.style).toHaveLength(1)
        expect(keyframeRule.style.color).toBe('green')
    })
    it('ignores a declaration for a disallowed property or of an invalid value in @page', () => {

        // `!important` is invalid in @page
        const { cssRules: [pageRule] } = createStyleSheet(`
            @page {
                top: 1px;
                font-size: 16px;
                bottom: 1px;
                invalid: value;
                font-size: 20px !important;
            }
        `)

        expect(CSSPageRule.is(pageRule)).toBeTruthy()
        expect(pageRule.style).toHaveLength(1)
        expect(pageRule.style.fontSize).toBe('20px')
    })
    it('ignores a declaration for a disallowed property or of an invalid value in margin at-rules', () => {

        const { cssRules: [{ cssRules: [marginRule] }] } = createStyleSheet(`
            @page {
                @top-left {
                    top: 1px;
                    content: "allowed";
                    bottom: 1px;
                    content: "important" !important;
                    invalid: value;
                }
            }
        `)

        expect(CSSMarginRule.is(marginRule)).toBeTruthy()
        expect(marginRule.style).toHaveLength(1)
        expect(marginRule.style.content).toBe('"important"')
    })
    it('parses a vendor prefixed rule', () => {
        const { cssRules: [keyframesRule] } = createStyleSheet('@-webkit-keyframes myAnimation {}')
        expect(CSSKeyframesRule.is(keyframesRule)).toBeTruthy()
        expect(keyframesRule.cssText).toBe('@keyframes myAnimation {}')
    })
})

describe('CSSCounterStyleRule', () => {})
describe('CSSFontFaceRule', () => {
    it('has all properties', () => {

        const styleSheet = createStyleSheet('@font-face { src: url(serif.woff2); }')
        const { cssRules: [rule] } = styleSheet
        const { cssText, parentRule, parentStyleSheet, style } = rule

        // CSSRule properties
        expect(cssText).toBe('@font-face {\n  src: url("serif.woff2");\n}')
        expect(parentRule).toBeNull()
        expect(parentStyleSheet).toBe(styleSheet)

        // CSSFontFaceRule properties
        expect(CSSStyleDeclaration.is(style)).toBeTruthy()
        expect(style).toHaveLength(1)
    })
})
describe('CSSFontFeatureValuesRule', () => {})
describe('CSSImportRule', () => {
    it('has all properties', () => {

        const styleSheet = createStyleSheet('@import "./stylesheet.css";', { media: 'all' })
        const { cssRules: [rule] } = styleSheet
        const { cssText, href, media, parentRule, parentStyleSheet, styleSheet: importedStyleSheet } = rule

        // CSSRule properties
        expect(cssText).toBe('@import url("./stylesheet.css");')
        expect(parentRule).toBeNull()
        expect(parentStyleSheet).toBe(styleSheet)

        // CSSImportRule proeprties
        expect(href).toBe('./stylesheet.css')
        // expect(media).toBe(importedStyleSheet.media)
        // expect(CSSStyleSheet.is(importedStyleSheet)).toBeTruthy()

        // const { ownerRule, parentStyleSheet } = importedStyleSheet

        // expect(importedStyleSheet.ownerRule).toBe(rule)
        // expect(importedStyleSheet.parentStyleSheet).toBe(parentStyleSheet)
    })
})
describe('CSSKeyframeRule', () => {
    it('has all properties', () => {

        const styleSheet = createStyleSheet('@keyframes myAnimation { to { color: red; color: orange } }')
        const { cssRules: [keyframesRule] } = styleSheet
        const { cssRules: [rule] } = keyframesRule
        const { cssText, keyText, parentRule, parentStyleSheet, style } = rule

        // CSSRule properties
        expect(cssText).toBe('100% {\n  color: orange;\n}')
        expect(parentRule).toBe(keyframesRule)
        expect(parentStyleSheet).toBe(styleSheet)

        // CSSKeyframeRule properties
        expect(keyText).toBe('100%')
        expect(CSSStyleDeclaration.is(style)).toBeTruthy()
        expect(style).toHaveLength(1)

        style.color = 'green'

        // CSSKeyframeRule declarations must be shared with CSSStyleDeclaration
        expect(rule.cssText).toBe('100% {\n  color: green;\n}')

        rule.keyText = 'from'

        expect(rule.keyText).toBe('0%')
        expect(rule.cssText).toBe('0% {\n  color: green;\n}')
    })
    it('throws an error when trying to set an invalid keyframe selector', () => {

        const styleSheet = createStyleSheet('@keyframes myAnimation { to {} }')
        const { cssRules: [{ cssRules: [keyframeRule] }] } = styleSheet

        expect(() => keyframeRule.keyText = '101%').toThrow(createError(SET_INVALID_KEY_TEXT_ERROR))
    })
})
describe('CSSKeyframesRule', () => {
    it('has all properties', () => {

        const styleSheet = createStyleSheet('@keyframes myAnimation { to { color: green } }')
        const { cssRules: [rule] } = styleSheet
        const { cssRules, cssText, name, parentRule, parentStyleSheet } = rule

        // CSSRule properties
        expect(cssText).toBe('@keyframes myAnimation {\n  100% {\n  color: green;\n}\n}')
        expect(parentRule).toBeNull()
        expect(parentStyleSheet).toBe(styleSheet)

        // CSSKeyframesRule properties
        expect(CSSRuleList.is(cssRules)).toBeTruthy()
        expect(rule).toHaveLength(1)
        expect(rule[0]).toBe(cssRules[0])
        expect(cssRules).toHaveLength(1)
        expect(name).toBe('myAnimation')

        rule.name = 'myAnimationName'

        expect(rule.name).toBe('myAnimationName')
        expect(rule.cssText).toBe('@keyframes myAnimationName {\n  100% {\n  color: green;\n}\n}')
    })
    it('has all methods', () => {

        const { cssRules: [rule] } = createStyleSheet('@keyframes myAnimation {}')
        const { cssRules: keyframes } = rule
        const error = createError({ message: 'Failed to parse a rule', type: 'ParseError' })

        expect(keyframes).toHaveLength(0)

        rule.appendRule('to { color: orange }')

        expect(rule.findRule('to')).toBe(keyframes[0])
        expect(rule.findRule('100%')).toBe(keyframes[0])
        expect(keyframes).toHaveLength(1)
        expect(keyframes[0].style.color).toBe('orange')
        expect(() => rule.appendRule('invalid')).toThrow(error)

        rule.appendRule('to { color: green }')
        const [, to] = keyframes

        expect(keyframes).toHaveLength(2)
        expect(to.style.color).toBe('green')
        expect(rule.findRule('to')).toBe(to)

        rule.deleteRule('to')

        expect(keyframes).toHaveLength(1)
        expect(to.parentRule).toBeNull()
        expect(rule.findRule('to')).toBe(keyframes[0])

        rule.appendRule('50%, 100% { color: green }')

        expect(keyframes).toHaveLength(2)
        expect(rule.findRule('50%')).toBeNull()
        expect(rule.findRule('100%, 50%')).toBeNull()
        expect(rule.findRule('50%, 100%')).toBe(keyframes[1])
        expect(rule.findRule('50%,100%')).toBe(keyframes[1])

        rule.deleteRule('50%')

        expect(keyframes).toHaveLength(2)

        rule.deleteRule('50%, 100%')

        expect(keyframes).toHaveLength(1)
    })
})
describe('CSSMarginRule', () => {
    it('has all properties', () => {

        const styleSheet = createStyleSheet('@page { @top-left { color: red; color: orange } }')
        const { cssRules: [pageRule] } = styleSheet
        const { cssRules: [{ cssText, name, parentRule, parentStyleSheet, style }] } = pageRule

        // CSSRule properties
        expect(cssText).toBe('@top-left {\n  color: orange;\n}')
        expect(parentRule).toBe(pageRule)
        expect(parentStyleSheet).toBe(styleSheet)

        // CSSMarginRule properties
        expect(name).toBe('top-left')
        expect(CSSStyleDeclaration.is(style)).toBeTruthy()
        expect(style).toHaveLength(1)

        style.color = 'green'

        // CSSMarginRule declarations must be shared with CSSStyleDeclaration
        expect(style.color).toBe('green')
    })
})
describe('CSSMediaRule', () => {
    it('has all properties', () => {

        const styleSheet = createStyleSheet('@media all { .selector { color: green } }')
        const { cssRules: [{ conditionText, cssRules, cssText, media, parentRule, parentStyleSheet }] } = styleSheet

        // CSSRule properties
        expect(cssText).toBe('@media all {\n  .selector {\n  color: green;\n}\n}')
        expect(parentRule).toBeNull()
        expect(parentStyleSheet).toBe(styleSheet)

        // CSSGroupingRule properties
        expect(CSSRuleList.is(cssRules)).toBeTruthy()

        // CSSConditionRule properties
        expect(conditionText).toBe('all')

        // CSSMediaRule properties
        expect(MediaList.is(media)).toBeTruthy()
    })
    it('has all methods', () => {

        const { cssRules: [rule] } = createStyleSheet('@media all {}')
        const { cssRules } = rule
        const error = createError({ message: 'Failed to parse a rule', type: 'ParseError' })

        expect(cssRules).toHaveLength(0)

        rule.insertRule('.selector { color: orange }')

        expect(cssRules).toHaveLength(1)
        expect(() => rule.insertRule('invalid')).toThrow(error)

        rule.insertRule('.selector { color: red }')

        expect(cssRules).toHaveLength(2)

        rule.insertRule('.selector { color: green }', 2)
        const [styleRule] = cssRules

        expect(cssRules).toHaveLength(3)
        expect(styleRule.style.color).toBe('red')
        expect(cssRules[1].style.color).toBe('orange')
        expect(cssRules[2].style.color).toBe('green')

        rule.deleteRule(0)

        expect(cssRules).toHaveLength(2)
        expect(styleRule.parentRule).toBeNull()
        expect(cssRules[0].style.color).toBe('orange')
        expect(cssRules[1].style.color).toBe('green')
    })
})
describe('CSSNamespaceRule', () => {
    it('has all properties', () => {

        const styleSheet = createStyleSheet('@namespace svg "http://www.w3.org/2000/svg";')
        const { cssRules: [{ cssText, namespaceURI, prefix, parentRule, parentStyleSheet }] } = styleSheet

        // CSSRule properties
        expect(cssText).toBe('@namespace svg url("http://www.w3.org/2000/svg");')
        expect(parentRule).toBeNull()
        expect(parentStyleSheet).toBe(styleSheet)

        // CSSNamespaceRule
        expect(namespaceURI).toBe('http://www.w3.org/2000/svg')
        expect(prefix).toBe('svg')
    })
})
describe('CSSPageRule', () => {
    it('has all properties', () => {

        const styleSheet = createStyleSheet('@page intro { color: red; color: orange; @top-left {} }')
        const { cssRules: [rule] } = styleSheet
        const { cssRules, cssText, parentRule, parentStyleSheet, selectorText, style } = rule

        // CSSRule properties
        expect(cssText).toBe('@page intro {\n  color: orange;\n  @top-left {}\n}')
        expect(parentRule).toBeNull()
        expect(parentStyleSheet).toBe(styleSheet)

        // CSSGroupingRule properties
        expect(CSSRuleList.is(cssRules)).toBeTruthy()

        // CSSPageRule properties
        expect(selectorText).toBe('intro')
        expect(CSSStyleDeclaration.is(style)).toBeTruthy()
        expect(style).toHaveLength(1)

        style.color = 'green'

        // CSSPageRule declarations must be shared with CSSStyleDeclaration
        expect(rule.cssText).toBe('@page intro {\n  color: green;\n  @top-left {}\n}')

        rule.selectorText = 'outro'

        expect(rule.selectorText).toBe('outro')
        expect(rule.cssText).toBe('@page outro {\n  color: green;\n  @top-left {}\n}')
    })
    it('has all methods', () => {

        const { cssRules: [rule] } = createStyleSheet('@page {}')
        const { cssRules } = rule
        const error = createError({ message: 'Failed to parse a rule', type: 'ParseError' })

        expect(cssRules).toHaveLength(0)

        rule.insertRule('@top-left {}')

        expect(cssRules).toHaveLength(1)
        expect(() => rule.insertRule('invalid')).toThrow(error)

        rule.insertRule('@top-left-corner {}')

        expect(cssRules).toHaveLength(2)

        rule.insertRule('@top-center {}', 2)
        const [marginRule] = cssRules

        expect(cssRules).toHaveLength(3)
        expect(marginRule.name).toBe('top-left-corner')
        expect(cssRules[1].name).toBe('top-left')
        expect(cssRules[2].name).toBe('top-center')

        rule.deleteRule(0)

        expect(cssRules).toHaveLength(2)
        expect(marginRule.parentRule).toBeNull()
        expect(cssRules[0].name).toBe('top-left')
        expect(cssRules[1].name).toBe('top-center')
    })
})
describe('CSSPropertyRule', () => {})
describe('CSSStyleRule', () => {
    it('has all properties', () => {

        const styleSheet = createStyleSheet(`
            .selector {
                color: red;
                color: orange;
                & .child {
                    color: red;
                    color: orange
                }
            }
        `)
        const { cssRules: [styleRule] } = styleSheet
        const { cssRules: [nestedStyleRule] } = styleRule

        // CSSRule properties
        expect(styleRule.cssText).toBe('.selector {\n  color: orange;\n  & .child {\n  color: orange;\n}\n}')
        expect(nestedStyleRule.cssText).toBe('& .child {\n  color: orange;\n}')
        expect(styleRule.parentRule).toBeNull()
        expect(nestedStyleRule.parentRule).toBe(styleRule)
        expect(styleRule.parentStyleSheet).toBe(styleSheet)
        expect(nestedStyleRule.parentStyleSheet).toBe(styleSheet)

        // CSSStyleRule properties
        expect(CSSRuleList.is(styleRule.cssRules)).toBeTruthy()
        expect(CSSRuleList.is(nestedStyleRule.cssRules)).toBeTruthy()
        expect(styleRule.selectorText).toBe('.selector')
        expect(nestedStyleRule.selectorText).toBe('& .child')
        expect(CSSStyleDeclaration.is(styleRule.style)).toBeTruthy()
        expect(CSSStyleDeclaration.is(nestedStyleRule.style)).toBeTruthy()
        expect(styleRule.style).toHaveLength(1)
        expect(nestedStyleRule.style).toHaveLength(1)

        styleRule.style.color = 'green'
        nestedStyleRule.style.color = 'green'

        // CSSStyleRule declarations must be shared with CSSStyleDeclaration
        expect(styleRule.cssText).toBe('.selector {\n  color: green;\n  & .child {\n  color: green;\n}\n}')
        expect(nestedStyleRule.cssText).toBe('& .child {\n  color: green;\n}')

        styleRule.selectorText = '.selector-element'
        nestedStyleRule.selectorText = '& .child-element'

        expect(styleRule.selectorText).toBe('.selector-element')
        expect(nestedStyleRule.selectorText).toBe('& .child-element')
        expect(styleRule.cssText).toBe('.selector-element {\n  color: green;\n  & .child-element {\n  color: green;\n}\n}')
        expect(nestedStyleRule.cssText).toBe('& .child-element {\n  color: green;\n}')
    })
    it('has all methods', () => {

        const { cssRules: [rule] } = createStyleSheet('.selector {}')
        const { cssRules } = rule
        const error = createError({ message: 'Failed to parse a rule', type: 'ParseError' })

        expect(cssRules).toHaveLength(0)

        rule.insertRule('@media screen {}')

        expect(cssRules).toHaveLength(1)
        expect(() => rule.insertRule('invalid')).toThrow(error)

        rule.insertRule('@media print {}')

        expect(cssRules).toHaveLength(2)

        rule.insertRule('@media all {}', 2)
        const [styleRule] = cssRules

        expect(cssRules).toHaveLength(3)
        expect(styleRule.conditionText).toBe('print')
        expect(cssRules[1].conditionText).toBe('screen')
        expect(cssRules[2].conditionText).toBe('all')

        rule.deleteRule(0)

        expect(cssRules).toHaveLength(2)
        expect(styleRule.parentRule).toBeNull()
        expect(cssRules[0].conditionText).toBe('screen')
        expect(cssRules[1].conditionText).toBe('all')
    })
})
describe('CSSSupportsRule', () => {
    it('has all properties', () => {

        const styleSheet = createStyleSheet('@supports (color: green) { .selector { color: green } }')
        const { cssRules: [{ conditionText, cssRules, cssText, parentRule, parentStyleSheet }] } = styleSheet

        // CSSRule properties
        expect(cssText).toBe('@supports (color: green) {\n  .selector {\n  color: green;\n}\n}')
        expect(parentRule).toBeNull()
        expect(parentStyleSheet).toBe(styleSheet)

        // CSSGroupingRule properties
        expect(CSSRuleList.is(cssRules)).toBeTruthy()

        // CSSConditionRule properties
        expect(conditionText).toBe('(color: green)')
    })
    it('has all methods', () => {

        const { cssRules: [rule] } = createStyleSheet('@supports (color: green) {}')
        const { cssRules } = rule
        const error = createError({ message: 'Failed to parse a rule', type: 'ParseError' })

        expect(cssRules).toHaveLength(0)

        rule.insertRule('.selector { color: orange }')

        expect(cssRules).toHaveLength(1)
        expect(() => rule.insertRule('invalid')).toThrow(error)

        rule.insertRule('.selector { color: red }')

        expect(cssRules).toHaveLength(2)

        rule.insertRule('.selector { color: green }', 2)
        const [styleRule] = cssRules

        expect(cssRules).toHaveLength(3)
        expect(styleRule.style.color).toBe('red')
        expect(cssRules[1].style.color).toBe('orange')
        expect(cssRules[2].style.color).toBe('green')

        rule.deleteRule(0)

        expect(cssRules).toHaveLength(2)
        expect(styleRule.parentRule).toBeNull()
        expect(cssRules[0].style.color).toBe('orange')
        expect(cssRules[1].style.color).toBe('green')
    })
})
