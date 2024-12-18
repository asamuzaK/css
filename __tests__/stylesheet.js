
const { cssom, install } = require('../lib/index.js')
// Do not import CSSOM implementations before the above import
const { ACCESS_THIRD_PARTY_STYLESHEET_ERROR, UPDATE_LOCKED_STYLESHEET_ERROR } = require('../lib/cssom/CSSStyleSheet-impl.js')
const {
    EXTRA_RULE_ERROR,
    INSERT_INVALID_IMPORT_ERROR,
    INVALID_NAMESPACE_STATE_ERROR,
    INVALID_RULE_INDEX_ERROR,
    INVALID_RULE_POSITION_ERROR,
    INVALID_RULE_SYNTAX_ERROR,
    MISSING_RULE_ERROR,
} = require('../lib/parse/parser.js')
const { SET_INVALID_KEY_TEXT_ERROR } = require('../lib/cssom/CSSKeyframeRule-impl.js')
const { SET_INVALID_NAME_ERROR } = require('../lib/cssom/CSSKeyframesRule-impl.js')
const { INVALID_FONT_FEATURE_VALUE_ERROR } = require('../lib/cssom/CSSFontFeatureValuesMap-impl.js')

const {
    CSSImportRule,
    CSSFontFaceDescriptors,
    CSSKeyframeProperties,
    CSSKeyframesRule,
    CSSLayerStatementRule,
    CSSMarginDescriptors,
    CSSNamespaceRule,
    CSSPageDescriptors,
    CSSPositionTryDescriptors,
    CSSRuleList,
    CSSStyleProperties,
    CSSStyleRule,
    CSSStyleSheet,
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

install()
globalThis.document = { href: 'https://github.com/cdoublev/' }

describe('CSSStyleSheet', () => {
    it('creates a constructed CSSStyleSheet', () => {

        const media = 'all'
        const options = { baseURL: 'css', disabled: true, media }
        const styleSheet = new globalThis.CSSStyleSheet(options)

        // StyleSheet properties
        expect(styleSheet.disabled).toBeTruthy()
        expect(styleSheet.href).toBe(document.href)
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
        const styleSheet = createStyleSheet('', properties)

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
        expect(styleSheet.ownerRule).toBeNull()
    })
})
describe('CSSStyleSheet.insertRule(), CSSStyleSheet.deleteRule()', () => {
    it('throws an error when trying to insert/delete a rule in a style sheet whose origin is not clean', () => {
        const styleSheet = createStyleSheet('', { originClean: false })
        expect(() => styleSheet.insertRule('style {}')).toThrow(ACCESS_THIRD_PARTY_STYLESHEET_ERROR)
        expect(() => styleSheet.deleteRule(0)).toThrow(ACCESS_THIRD_PARTY_STYLESHEET_ERROR)
    })
    it('throws an error when trying to insert/delete a rule while modifications on the style sheet are not allowed', () => {
        const styleSheet = new globalThis.CSSStyleSheet()
        styleSheet.replace('')
        expect(() => styleSheet.insertRule('style {}')).toThrow(UPDATE_LOCKED_STYLESHEET_ERROR)
        expect(() => styleSheet.deleteRule(0)).toThrow(UPDATE_LOCKED_STYLESHEET_ERROR)
    })
    it('throws an error when trying to insert an invalid rule according to the CSS syntax', () => {
        const styleSheet = createStyleSheet()
        expect(() => styleSheet.insertRule(' ')).toThrow(MISSING_RULE_ERROR)
        expect(() => styleSheet.insertRule('style;')).toThrow(INVALID_RULE_SYNTAX_ERROR)
        expect(() => styleSheet.insertRule('style {};')).toThrow(EXTRA_RULE_ERROR)
    })
    it('throws an error when trying to insert @import in a constructed style sheet', () => {
        const styleSheet = new globalThis.CSSStyleSheet()
        expect(() => styleSheet.insertRule('@import "./global.css";')).toThrow(INSERT_INVALID_IMPORT_ERROR)
    })
    it('throws an error when trying to insert/delete a rule at an index greater than the length of rules', () => {
        const styleSheet = createStyleSheet()
        expect(() => styleSheet.insertRule('style {}', 1)).toThrow(INVALID_RULE_INDEX_ERROR)
        expect(() => styleSheet.deleteRule(0)).toThrow(INVALID_RULE_INDEX_ERROR)
    })
    it('throws an error when trying to insert an invalid rule according to the CSS grammar', () => {
        const styleSheet = createStyleSheet()
        expect(() => styleSheet.insertRule('@charset "utf-8";')).toThrow(INVALID_RULE_SYNTAX_ERROR)
        expect(() => styleSheet.insertRule('@top-left {}')).toThrow(INVALID_RULE_SYNTAX_ERROR)
        expect(() => styleSheet.insertRule('@media;')).toThrow(INVALID_RULE_SYNTAX_ERROR)
    })
    it('throws an error when trying to insert any other rule than @import or @layer before @import', () => {
        const styleSheet = createStyleSheet('@import "./global.css";')
        expect(() => styleSheet.insertRule('@namespace svg "http://www.w3.org/2000/svg";'))
            .toThrow(INVALID_RULE_POSITION_ERROR)
        expect(() => styleSheet.insertRule('style {}'))
            .toThrow(INVALID_RULE_POSITION_ERROR)
    })
    it('throws an error when trying to insert any other rule than @import, @layer, @namespace, before @namespace', () => {
        const styleSheet = createStyleSheet('@namespace svg "http://www.w3.org/2000/svg";')
        expect(() => styleSheet.insertRule('style {}')).toThrow(INVALID_RULE_POSITION_ERROR)
    })
    it('throws an error when trying to insert @import after any other rule than @import or @layer', () => {
        const styleSheet = createStyleSheet('@namespace svg "http://www.w3.org/2000/svg";')
        expect(() => styleSheet.insertRule('@import "./global.css";', 1)).toThrow(INVALID_RULE_POSITION_ERROR)
    })
    it('throws an error when trying to insert @layer between @import and @import', () => {
        const styleSheet = createStyleSheet(`
            @import "./global.css";
            @import "./page.css";
        `)
        expect(() => styleSheet.insertRule('@layer base;', 1)).toThrow(INVALID_RULE_POSITION_ERROR)
    })
    it('throws an error when trying to insert @layer between @import and @namespace', () => {
        const styleSheet = createStyleSheet(`
            @import "./global.css";
            @namespace svg "http://www.w3.org/2000/svg";
        `)
        expect(() => styleSheet.insertRule('@layer base;', 1)).toThrow(INVALID_RULE_POSITION_ERROR)
    })
    it('throws an error when trying to insert @layer between @namespace and @namespace', () => {
        const styleSheet = createStyleSheet(`
            @namespace html "https://www.w3.org/1999/xhtml/";
            @namespace svg "http://www.w3.org/2000/svg";
        `)
        expect(() => styleSheet.insertRule('@layer base;', 1)).toThrow(INVALID_RULE_POSITION_ERROR)
    })
    it('throws an error when trying to insert @namespace if any other rule than @import, @layer, @namespace, exists', () => {
        const styleSheet = createStyleSheet('style {}')
        expect(() => styleSheet.insertRule('@namespace svg "http://www.w3.org/2000/svg";'))
            .toThrow(INVALID_NAMESPACE_STATE_ERROR)
    })
    it('inserts and deletes a rule', () => {

        const styleSheet = createStyleSheet()
        const { cssRules } = styleSheet

        styleSheet.insertRule('@namespace svg "http://www.w3.org/2000/svg";', 0)

        expect(cssRules).toHaveLength(1)

        const [namespaceRule] = cssRules

        expect(CSSNamespaceRule.is(namespaceRule)).toBeTruthy()

        styleSheet.insertRule('@namespace html "https://www.w3.org/1999/xhtml/";')

        expect(cssRules[1]).toBe(namespaceRule)

        styleSheet.deleteRule(1)

        expect(cssRules).toHaveLength(1)
        expect(namespaceRule.parentStyleSheet).toBeNull()

        styleSheet.insertRule('@import "./page.css";')
        styleSheet.insertRule('@layer reset;')
        styleSheet.insertRule('@namespace svg "http://www.w3.org/2000/svg";', 3)
        styleSheet.insertRule('@layer base;', 4)
        styleSheet.insertRule('svg|rect {}', 5)

        expect(cssRules).toHaveLength(6)
    })
})
describe('CSSStyleSheet.replace(), CSSStyleSheet.replaceSync()', () => {
    it('throws an error when trying to replace rules of a non-constructed style sheet', () => {
        const styleSheet = createStyleSheet()
        expect(() => styleSheet.replaceSync('')).toThrow(UPDATE_LOCKED_STYLESHEET_ERROR)
    })
    it('throws an error when trying to replace rules concurrently', async () => {
        const styleSheet = new globalThis.CSSStyleSheet()
        styleSheet.replace('')
        return expect(styleSheet.replace('')).rejects.toMatchObject(UPDATE_LOCKED_STYLESHEET_ERROR)
    })
    it('replaces a rule asynchronously/synchronously', async () => {

        const styleSheet = new globalThis.CSSStyleSheet()
        const { cssRules } = styleSheet

        expect(await styleSheet.replace('style { color: orange }')).toBe(styleSheet)
        expect(cssRules).toHaveLength(1)
        expect(cssRules[0].style.color).toBe('orange')

        styleSheet.replaceSync('style { color: green }')

        expect(cssRules).toHaveLength(1)
        expect(cssRules[0].style.color).toBe('green')
    })
    it('ignores opening and ending HTML comment tokens', () => {

        const styleSheet = new globalThis.CSSStyleSheet()

        styleSheet.replaceSync('<!-- style {} -->')

        expect(styleSheet.cssRules).toHaveLength(1)
    })
    it('ignores import rules and invalid statements', () => {

        const styleSheet = new globalThis.CSSStyleSheet()

        styleSheet.replaceSync(`
            @import "./global.css";
            @namespace <bad-string-or-url>;
            style { color: green }
            color: red
        `)

        expect(CSSStyleRule.is(styleSheet.cssRules[0])).toBeTruthy()
    })
})

describe('CSSRuleList.item()', () => {
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

describe('CSSColorProfileRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@color-profile --name { src: url("profile.icc") }')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@color-profile --name { src: url("profile.icc"); }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSColorProfileRule
        expect(rule.components).toBe('')
        expect(rule.name).toBe('--name')
        expect(rule.src).toBe('url("profile.icc")')
        expect(rule.renderingIntent).toBe('')
    })
})
describe('CSSContainerRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@container name { style {} }')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@container name { style {} }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSGroupingRule
        expect(CSSRuleList.is(rule.cssRules)).toBeTruthy()

        // CSSConditionRule
        expect(rule.conditionText).toBe('name')
    })
})
describe('CSSCounterStyleRule', () => {
    test('properties', () => {

        let styleSheet = createStyleSheet('@counter-style name { system: fixed 1; speak-as: auto }')
        let rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@counter-style name { speak-as: auto; system: fixed; }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSCounterStyleRule
        expect(rule.name).toBe('name')
        rule.name = 'decimal'
        expect(rule.name).toBe('name')
        rule.name = ''
        expect(rule.name).toBe('name')
        rule.name = '\n'
        expect(rule.name).toBe('\\a')
        rule.speakAs = 'none'
        expect(rule.speakAs).toBe('auto')

        // Fixed
        rule.system = 'fixed 2'
        expect(rule.system).toBe('fixed')
        rule.symbols = 'one two'
        expect(rule.symbols).toBe('one two')
        rule.system = 'fixed 2'
        expect(rule.system).toBe('fixed 2')
        rule.symbols = 'one two'
        expect(rule.symbols).toBe('one two')
        rule.additiveSymbols = '1 one'
        expect(rule.additiveSymbols).toBe('')
        rule.system = 'numeric'
        rule.system = 'additive'
        rule.system = 'extends decimal'
        expect(rule.system).toBe('fixed 2')

        // Cyclic (or symbolic)
        styleSheet = createStyleSheet('@counter-style name {}')
        rule = styleSheet.cssRules[0]
        rule.system = 'cyclic'
        expect(rule.system).toBe('')
        rule.symbols = 'one'
        expect(rule.symbols).toBe('one')
        rule.system = 'cyclic'
        expect(rule.system).toBe('cyclic')
        rule.symbols = 'one two'
        expect(rule.symbols).toBe('one two')
        rule.system = 'numeric'
        rule.system = 'fixed'
        rule.system = 'extends decimal'
        expect(rule.system).toBe('cyclic')

        // Numeric (or alphabetic)
        styleSheet = createStyleSheet('@counter-style name {}')
        rule = styleSheet.cssRules[0]
        rule.system = 'numeric'
        expect(rule.system).toBe('')
        rule.symbols = 'one'
        expect(rule.symbols).toBe('one')
        rule.system = 'numeric'
        expect(rule.system).toBe('')
        rule.symbols = 'one two'
        expect(rule.symbols).toBe('one two')
        rule.system = 'numeric'
        expect(rule.system).toBe('numeric')
        rule.symbols = 'one'
        expect(rule.symbols).toBe('one two')
        rule.symbols = 'one two three'
        expect(rule.symbols).toBe('one two three')
        rule.system = 'cyclic'
        rule.system = 'fixed'
        rule.system = 'extends decimal'
        expect(rule.system).toBe('numeric')

        // Additive
        styleSheet = createStyleSheet('@counter-style name {}')
        rule = styleSheet.cssRules[0]
        rule.system = 'additive'
        expect(rule.system).toBe('')
        rule.additiveSymbols = '1 one'
        expect(rule.additiveSymbols).toBe('1 one')
        rule.system = 'additive'
        expect(rule.system).toBe('additive')
        rule.additiveSymbols = '2 two, 1 one'
        expect(rule.additiveSymbols).toBe('2 two, 1 one')
        rule.symbols = 'one two'
        expect(rule.symbols).toBe('')
        rule.system = 'cyclic'
        rule.system = 'fixed'
        rule.system = 'extends decimal'
        expect(rule.system).toBe('additive')

        // Extended counter style
        styleSheet = createStyleSheet('@counter-style name { symbols: one; additive-symbols: 1 one }')
        rule = styleSheet.cssRules[0]
        rule.system = 'extends decimal'
        expect(rule.system).toBe('')
        styleSheet = createStyleSheet('@counter-style name {}')
        rule = styleSheet.cssRules[0]
        rule.system = 'extends decimal'
        expect(rule.system).toBe('extends decimal')
        rule.symbols = 'one'
        expect(rule.symbols).toBe('')
        rule.additiveSymbols = '1 one'
        expect(rule.additiveSymbols).toBe('')
        rule.system = 'extends circle'
        expect(rule.system).toBe('extends circle')
        rule.system = 'extends none'
        rule.system = 'cyclic'
        rule.system = 'additive'
        rule.system = 'fixed'
        expect(rule.system).toBe('extends circle')
    })
})
describe('CSSFontFaceRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@font-face { src: url(serif.woff2) }')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@font-face { src: url("serif.woff2"); }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSFontFaceRule
        expect(CSSFontFaceDescriptors.is(rule.style)).toBeTruthy()
        expect(rule.style).toHaveLength(1)
        rule.style.removeProperty('src')
        expect(rule.cssText).toBe('@font-face {}')
    })
})
describe('CSSFontFeatureValuesRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@font-feature-values name { font-display: block }')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@font-feature-values name { font-display: block; }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSFontFeatureValuesRule
        expect(rule.fontFamily).toBe('name')

        // CSSFontFeatureValuesMap
        rule.styleset.set('double-W', 0)
        expect(rule.styleset.get('double-W')).toEqual([0])
        expect(rule.cssText).toBe('@font-feature-values name { font-display: block; @styleset { double-W: 0; } }')
        rule.styleset.set('double-W', [0, 1])
        expect(rule.styleset.get('double-W')).toEqual([0, 1])
        expect(rule.cssText).toBe('@font-feature-values name { font-display: block; @styleset { double-W: 0 1; } }')
        rule.styleset.delete('double-W')
        expect(rule.cssText).toBe('@font-feature-values name { font-display: block; }')
        expect(() => rule.annotation.set('boxed', [0, 1])).toThrow(INVALID_FONT_FEATURE_VALUE_ERROR)
        expect(() => rule.annotation.set('boxed', [-1])).toThrow(INVALID_FONT_FEATURE_VALUE_ERROR)
        expect(() => rule.characterVariant.set('alpha-2', [0, 1, 2])).toThrow(INVALID_FONT_FEATURE_VALUE_ERROR)
        expect(() => rule.characterVariant.set('alpha-2', [-1, 0])).toThrow(INVALID_FONT_FEATURE_VALUE_ERROR)
        expect(() => rule.characterVariant.set('alpha-2', [100, 0])).toThrow(INVALID_FONT_FEATURE_VALUE_ERROR)
        expect(() => rule.ornaments.set('bullet', [0, 1])).toThrow(INVALID_FONT_FEATURE_VALUE_ERROR)
        expect(() => rule.ornaments.set('bullet', [-1])).toThrow(INVALID_FONT_FEATURE_VALUE_ERROR)
        expect(() => rule.styleset.set('double-W', [-1, 0])).toThrow(INVALID_FONT_FEATURE_VALUE_ERROR)
        expect(() => rule.styleset.set('double-W', [21, 0])).toThrow(INVALID_FONT_FEATURE_VALUE_ERROR)
        expect(() => rule.stylistic.set('alt-g', [0, 1])).toThrow(INVALID_FONT_FEATURE_VALUE_ERROR)
        expect(() => rule.stylistic.set('alt-g', [-1])).toThrow(INVALID_FONT_FEATURE_VALUE_ERROR)
        expect(() => rule.swash.set('cool', [0, 1])).toThrow(INVALID_FONT_FEATURE_VALUE_ERROR)
        expect(() => rule.swash.set('cool', [-1])).toThrow(INVALID_FONT_FEATURE_VALUE_ERROR)
    })
})
describe('CSSFontPaletteValuesRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet(`
            @font-palette-values --name {
                font-family: name;
                base-palette: light;
                override-colors: 0 green;
            }
        `)
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@font-palette-values --name { base-palette: light; font-family: name; override-colors: 0 green; }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSFontPaletteValuesRule
        expect(rule.fontFamily).toBe('name')
        expect(rule.basePalette).toBe('light')
        expect(rule.overrideColors).toBe('0 green')
    })
})
describe('CSSImportRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@import "./global.css";', { media: 'all' })
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@import url("./global.css");')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSImportRule
        expect(rule.href).toBe('./global.css')
        // TODO: implement fetching a style sheet referenced by `@import`
        // expect(CSSStyleSheet.is(rule.styleSheet)).toBeTruthy()
        // expect(rule.styleSheet.ownerRule).toBe(rule)
        // expect(rule.styleSheet.media).toBe(rule.media)
        // expect(rule.styleSheet.parentStyleSheet).toBe(rule.parentStyleSheet)
    })
})
describe('CSSKeyframeRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@keyframes name { to { color: green } }')
        const parentRule = styleSheet.cssRules[0]
        const rule = parentRule.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('100% { color: green; }')
        expect(rule.parentRule).toBe(parentRule)
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSKeyframeRule
        expect(rule.keyText).toBe('100%')
        rule.keyText = 'from'
        expect(rule.keyText).toBe('0%')
        expect(rule.cssText).toBe('0% { color: green; }')
        expect(() => rule.keyText = '101%').toThrow(SET_INVALID_KEY_TEXT_ERROR)
        expect(CSSKeyframeProperties.is(rule.style)).toBeTruthy()
        rule.style.color = ''
        expect(rule.cssText).toBe('0% {}')
    })
})
describe('CSSKeyframesRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@keyframes name { 100% {} }')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@keyframes name { 100% {} }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSKeyframesRule
        expect(CSSRuleList.is(rule.cssRules)).toBeTruthy()
        expect(rule).toHaveLength(1)
        expect(rule[0]).toBe(rule.cssRules[0])
        expect(rule.name).toBe('name')
        rule.name = '\n'
        expect(rule.name).toBe('\\a')
        expect(rule.cssText).toBe('@keyframes \\a { 100% {} }')
        expect(() => rule.name = '').toThrow(SET_INVALID_NAME_ERROR)
    })
    test('methods', () => {

        const { cssRules: [rule] } = createStyleSheet('@keyframes name {}')
        const keyframes = rule.cssRules

        expect(keyframes).toHaveLength(0)

        rule.appendRule('to { color: orange }')

        expect(rule.findRule('to')).toBe(keyframes[0])
        expect(rule.findRule('100%')).toBe(keyframes[0])
        expect(keyframes).toHaveLength(1)
        expect(keyframes[0].style.color).toBe('orange')
        expect(() => rule.appendRule('invalid')).toThrow(INVALID_RULE_SYNTAX_ERROR)

        rule.appendRule('to { color: green }')
        const [, to] = keyframes

        expect(keyframes).toHaveLength(2)
        expect(to.style.color).toBe('green')
        expect(rule.findRule('to')).toBe(to)

        rule.deleteRule('to')

        expect(keyframes).toHaveLength(1)
        expect(to.parentRule).toBeNull()
        expect(rule.findRule('to')).toBe(keyframes[0])

        rule.appendRule('50%, 100% {}')

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
describe('CSSLayerBlockRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@layer name { style {} }')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@layer name { style {} }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSGroupingRule
        expect(CSSRuleList.is(rule.cssRules)).toBeTruthy()

        // CSSLayerBlockRule
        expect(rule.name).toBe('name')
    })
})
describe('CSSLayerStatementRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@layer name;')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@layer name;')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSLayerStatementRule
        expect(rule.nameList).toBe('name')
    })
})
describe('CSSMarginRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@page { @top-left { color: green } }')
        const parentRule = styleSheet.cssRules[0]
        const rule = parentRule.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@top-left { color: green; }')
        expect(rule.parentRule).toBe(parentRule)
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSMarginRule
        expect(rule.name).toBe('top-left')
        expect(CSSMarginDescriptors.is(rule.style)).toBeTruthy()
        rule.style.color = ''
        expect(rule.cssText).toBe('@top-left {}')
    })
})
describe('CSSMediaRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@media all { style {} }')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@media all { style {} }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSGroupingRule
        expect(CSSRuleList.is(rule.cssRules)).toBeTruthy()

        // CSSConditionRule
        expect(rule.conditionText).toBe('all')

        // CSSMediaRule
        expect(MediaList.is(rule.media)).toBeTruthy()
    })
})
describe('CSSNamespaceRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@namespace svg "http://www.w3.org/2000/svg";')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@namespace svg url("http://www.w3.org/2000/svg");')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSNamespaceRule
        expect(rule.namespaceURI).toBe('http://www.w3.org/2000/svg')
        expect(rule.prefix).toBe('svg')
    })
})
describe('CSSPageRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@page intro { color: green; @top-left {} }')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@page intro { color: green; @top-left {} }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSGroupingRule
        expect(CSSRuleList.is(rule.cssRules)).toBeTruthy()

        // CSSPageRule
        expect(rule.selectorText).toBe('intro')
        rule.selectorText = 'outro'
        expect(rule.selectorText).toBe('outro')
        expect(CSSPageDescriptors.is(rule.style)).toBeTruthy()
    })
})
describe('CSSPositionTryRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@position-try --name { top: 1px } }')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@position-try --name { top: 1px; }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSPositionTryRule
        expect(rule.name).toBe('--name')
        expect(CSSPositionTryDescriptors.is(rule.style)).toBeTruthy()
        rule.style.top = ''
        expect(rule.cssText).toBe('@position-try --name {}')
    })
})
describe('CSSPropertyRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@property --name { syntax: "*"; inherits: true }')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@property --name { syntax: "*"; inherits: true; }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSPropertyRule
        expect(rule.name).toBe('--name')
        expect(rule.syntax).toBe('"*"')
        expect(rule.inherits).toBe('true')
        expect(rule.initialValue).toBe('')
    })
})
describe('CSSScopeRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@scope (start) to (end) { color: green; style { child {} } }')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@scope (start) to (end) { :scope { color: green; } style { & child {} } }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSGroupingRule
        expect(CSSRuleList.is(rule.cssRules)).toBeTruthy()

        // CSSLayerBlockRule
        expect(rule.end).toBe('end')
        expect(rule.start).toBe('start')
    })
})
describe('CSSStartingStyleRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@starting-style { style {} }')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@starting-style { style {} }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSGroupingRule
        expect(CSSRuleList.is(rule.cssRules)).toBeTruthy()
    })
})
describe('CSSStyleRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet(`
            style {
                color: red;
                @media {
                    color: green;
                }
            }
        `)
        const styleRule = styleSheet.cssRules[0]
        const mediaRule = styleRule.cssRules[0]
        const nestedStyleRule = mediaRule.cssRules[0]

        // CSSRule
        expect(styleRule.cssText).toBe('style { color: red; @media { & { color: green; } } }')
        expect(nestedStyleRule.cssText).toBe('& { color: green; }')
        expect(styleRule.parentRule).toBeNull()
        expect(nestedStyleRule.parentRule).toBe(mediaRule)
        expect(styleRule.parentStyleSheet).toBe(styleSheet)
        expect(nestedStyleRule.parentStyleSheet).toBe(styleSheet)

        // CSSGroupingRule
        expect(CSSRuleList.is(styleRule.cssRules)).toBeTruthy()
        expect(CSSRuleList.is(nestedStyleRule.cssRules)).toBeTruthy()

        // CSSStyleRule
        expect(styleRule.selectorText).toBe('style')
        expect(nestedStyleRule.selectorText).toBe('&')
        expect(CSSStyleProperties.is(styleRule.style)).toBeTruthy()
        expect(CSSStyleProperties.is(nestedStyleRule.style)).toBeTruthy()
        expect(styleRule.style).toHaveLength(1)
        expect(nestedStyleRule.style).toHaveLength(1)

        styleRule.selectorText = 'parent'
        nestedStyleRule.selectorText = 'child'

        expect(styleRule.selectorText).toBe('parent')
        expect(nestedStyleRule.selectorText).toBe('& child')

        styleRule.style.color = ''
        nestedStyleRule.style.color = ''

        expect(styleRule.cssText).toBe('parent { @media { & child {} } }')
    })
    test('methods', () => {

        const { cssRules: [rule] } = createStyleSheet('style {}')
        const { cssRules } = rule

        expect(cssRules).toHaveLength(0)

        rule.insertRule('@media screen {}')

        expect(() => rule.insertRule('style {}', -1)).toThrow(INVALID_RULE_INDEX_ERROR)
        expect(() => rule.insertRule(' ')).toThrow(MISSING_RULE_ERROR)
        expect(() => rule.insertRule('style {};')).toThrow(EXTRA_RULE_ERROR)
        expect(() => rule.insertRule('style;')).toThrow(INVALID_RULE_SYNTAX_ERROR)
        expect(() => rule.insertRule('@charset "utf-8";')).toThrow(INVALID_RULE_SYNTAX_ERROR)
        expect(() => rule.insertRule('@import "./global.css";')).toThrow(INVALID_RULE_SYNTAX_ERROR)
        expect(() => rule.insertRule('@media screen;')).toThrow(INVALID_RULE_SYNTAX_ERROR)

        rule.insertRule('@media print {}')

        expect(cssRules).toHaveLength(2)

        rule.insertRule('@media all {}', 2)
        const [mediaRule] = cssRules

        expect(cssRules).toHaveLength(3)
        expect(mediaRule.conditionText).toBe('print')
        expect(cssRules[1].conditionText).toBe('screen')
        expect(cssRules[2].conditionText).toBe('all')

        rule.deleteRule(0)

        expect(cssRules).toHaveLength(2)
        expect(mediaRule.parentRule).toBeNull()
        expect(cssRules[0].conditionText).toBe('screen')
        expect(cssRules[1].conditionText).toBe('all')
    })
    test('nested in nested group rules ', () => {

        const nestedGroupRules = [
            '@container name',
            '@layer',
            '@media',
            '@scope',
            '@starting-style',
            '@supports (color: green)',
        ]
        const styleSheet = createStyleSheet(`style { ${nestedGroupRules.map(rule => `${rule} { color: green }`).join(' ')}`)
        const styleRule = styleSheet.cssRules[0]

        expect(styleRule.cssText).toBe(`style { ${nestedGroupRules.map(rule => `${rule} { ${rule === '@scope' ? ':scope' : '&'} { color: green; } }`).join(' ')} }`)

        styleRule.selectorText = 'parent'
        for (const { cssRules: [nestedStyleRule] } of styleRule.cssRules) {
            nestedStyleRule.selectorText = 'child'
            nestedStyleRule.style.color = ''
        }

        expect(styleRule.cssText).toBe(`parent { ${nestedGroupRules.map(rule => `${rule} { ${rule === '@scope' ? 'child' : '& child'} {} }`).join(' ')} }`)
    })
})
describe('CSSSupportsRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@supports (color: green) { style {} }')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@supports (color: green) { style {} }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSGroupingRule
        expect(CSSRuleList.is(rule.cssRules)).toBeTruthy()

        // CSSConditionRule
        expect(rule.conditionText).toBe('(color: green)')
    })
})
describe('CSSViewTransitionRule', () => {
    test('properties', () => {

        const styleSheet = createStyleSheet('@view-transition { navigation: none; types: type-1 type-2 }')
        const rule = styleSheet.cssRules[0]

        // CSSRule
        expect(rule.cssText).toBe('@view-transition { navigation: none; types: type-1 type-2; }')
        expect(rule.parentRule).toBeNull()
        expect(rule.parentStyleSheet).toBe(styleSheet)

        // CSSViewTransitionRule
        expect(rule.navigation).toBe('none')
        expect(rule.types).toEqual(['type-1', 'type-2'])
        expect(() => rule.types.push('type-3')).toThrow(TypeError)
    })
})

/**
 * @see {@link https://github.com/w3c/csswg-drafts/issues/8778}
 *
 * The specification wants the setter of CSSRule.cssText to do nothing, which
 * requires implementing it in every CSSRule subclass, since a property cannot
 * be set when its setter is defined on the parent class and its getter on the
 * subclass: in strict mode, this throws an error.
 *
 * Instead, CSSRule.cssText is defined as read-only, which produces the expected
 * behavior, but throw an error in strict mode.
 */
test('Setting CSSRule.cssText does nothing', () => {
    const { cssRules: [rule] } = createStyleSheet('style {}')
    rule.cssText = 'override {}'
    expect(rule.cssText).toBe('style {}')
})

describe('CSS grammar', () => {
    // Style sheet contents
    test('top-level - invalid contents', () => {

        const { cssRules } = createStyleSheet(`
            @charset "utf-8";

            @namespace svg "http://www.w3.org/2000/svg" {}
            @media;
            style; {}

            color: red; {}
            --custom:hover {}

            @annotation {}
            @top-left {}
            0% {}

            @invalid } style {}
            style-1 { @layer name }
            @invalid } @layer name;
            style-2 { style }
            invalid } style {}
            style-3 { --custom:
        `)

        expect(cssRules).toHaveLength(3)
        expect(cssRules[0].cssText).toBe('style-1 {}')
        expect(cssRules[1].cssText).toBe('style-2 {}')
        expect(cssRules[2].cssText).toBe('style-3 { --custom: ; }')
    })
    test('top-level - opening and ending HTML comment tokens', () => {

        const { cssRules } = createStyleSheet(`
            <!-- style {} -->
            style {
                <!-- color: red; -->;
                color: green;
                <!-- color: red; -->
            }
        `)

        expect(cssRules).toHaveLength(2)
        expect(cssRules[1].style.color).toBe('green')
    })
    test('top-level - ignored @import following any other non-ignored rule than @layer', () => {

        const { cssRules } = createStyleSheet(`
            @namespace svg "http://www.w3.org/2000/svg";
            @import "./global.css";
        `)

        expect(cssRules).toHaveLength(1)
        expect(CSSNamespaceRule.is(cssRules[0])).toBeTruthy()
    })
    test('top-level - ignored @import following @layer interleaved after another @import', () => {

        const { cssRules } = createStyleSheet(`
            @import "./global.css";
            @layer name;
            @import "./page.css";
        `)

        expect(cssRules).toHaveLength(2)
        expect(CSSLayerStatementRule.is(cssRules[1])).toBeTruthy()
    })
    test('top-level - @import following @layer or ignored rules', () => {

        const { cssRules } = createStyleSheet(`
            @layer name;
            @charset "utf-8";
            @namespace <bad-string-or-url>;
            @import "./global.css";
        `)

        expect(cssRules).toHaveLength(2)
        expect(CSSImportRule.is(cssRules[1])).toBeTruthy()
    })
    test('top-level - @import following ignored rules interleaved after another @import', () => {

        const { cssRules } = createStyleSheet(`
            @import "./global.css";
            @charset "utf-8";
            @namespace <bad-string-or-url>;
            @layer <bad-ident>;
            @import "./page.css";
        `)

        expect(cssRules).toHaveLength(2)
        expect(CSSImportRule.is(cssRules[1])).toBeTruthy()
    })
    test('top-level - ignored @namespace following any other non-ignored rule than @import or @layer', () => {

        const { cssRules } = createStyleSheet(`
            style {}
            @namespace svg "http://www.w3.org/2000/svg";
        `)

        expect(cssRules).toHaveLength(1)
        expect(CSSStyleRule.is(cssRules[0])).toBeTruthy()
    })
    test('top-level - ignored @namespace following @layer interleaved after another @namespace', () => {

        const { cssRules } = createStyleSheet(`
            @namespace html "https://www.w3.org/1999/xhtml/";
            @layer name;
            @namespace svg "http://www.w3.org/2000/svg";
        `)

        expect(cssRules).toHaveLength(2)
        expect(CSSLayerStatementRule.is(cssRules[1])).toBeTruthy()
    })
    test('top-level - ignored @namespace following @layer interleaved after @import', () => {

        const { cssRules } = createStyleSheet(`
            @import "./global.css";
            @layer name;
            @namespace svg "http://www.w3.org/2000/svg";
        `)

        expect(cssRules).toHaveLength(2)
        expect(CSSLayerStatementRule.is(cssRules[1])).toBeTruthy()
    })
    test('top-level - @namespace following @import, @layer, or ignored rule(s)', () => {

        const { cssRules } = createStyleSheet(`
            @layer name;
            @import "./global.css";
            @charset "utf-8";
            @namespace svg "http://www.w3.org/2000/svg";
        `)

        expect(cssRules).toHaveLength(3)
        expect(CSSNamespaceRule.is(cssRules[2])).toBeTruthy()
    })
    test('top-level - @namespace following ignored rules interleaved after another @namespace', () => {

        const { cssRules } = createStyleSheet(`
            @namespace html "https://www.w3.org/1999/xhtml/";
            @charset "utf-8";
            @import <bad-string-or-url>;
            @layer <bad-string-or-url>;
            @namespace svg "http://www.w3.org/2000/svg";
        `)

        expect(cssRules).toHaveLength(2)
        expect(CSSNamespaceRule.is(cssRules[1])).toBeTruthy()
    })
    // Rule contents
    test('@color-profile - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @color-profile --name {

                style {}
                color: red;
                --custom:hover {};

                components: env(name) {};
                components: {} env(name);
                components: none;
                components: inherit(--custom);
                components: var(--custom);
                components: attr(name);
                components: toggle(name);
                components: name !important;

                src: url("profile.icc");
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@color-profile --name { src: url("profile.icc"); }')
    })
    test('@color-profile - valid block contents', () => {
        const input = '@COLOR-PROFILE --name { COMPONENTS: { env(name) }; src: first-valid(url("profile.icc")); }'
        const sheet = createStyleSheet(input)
        expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
    })
    test('@container - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @container name {

                @media;
                style;

                @charset "utf-8";
                @import "./global.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @annotation {}
                @top-left {}
                0% {}

                color: red;
                --custom:hover {};

                @media {}
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@container name { @media {} }')
    })
    test('@container - valid block contents', () => {
        const rules = [
            '@color-profile --name {}',
            '@container name {}',
            '@counter-style name {}',
            '@font-face {}',
            '@font-feature-values name {}',
            '@font-palette-values --name { font-family: name; }',
            '@function --name {}',
            '@keyframes name {}',
            '@layer name;',
            '@media {}',
            '@page {}',
            '@position-try --name {}',
            '@property --name { syntax: "*"; inherits: false; }',
            '@scope {}',
            '@starting-style {}',
            '@supports (color: green) {}',
            '@view-transition {}',
            'style:hover {}',
        ]
        const input = `@CONTAINER name { ${rules.join(' ')} }`
        const sheet = createStyleSheet(input)
        expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
    })
    test('@counter-style - invalid block contents', () => {
        const { cssRules: [rule1, rule2] } = createStyleSheet(`
            @counter-style name-one {

                style {}
                color: red;
                --custom:hover {};

                pad: env(name) {};
                pad: {} env(name);
                pad: initial;
                pad: inherit(--custom);
                pad: var(--custom);
                pad: attr(name);
                pad: toggle(symbolic);
                pad: calc-mix(0, 1, 1) ' ';
                pad: container-progress(aspect-ratio, 1, 1) ' ';
                pad: 1 ' ' !important;
                range: 1 0;

                system: numeric;
            }
            @counter-style name-two {
                system: numeric;
                additive-symbols: 1 one, 2 two;
            }
        `)
        expect(rule1.cssText).toBe('@counter-style name-one { system: numeric; }')
        expect(rule2.cssText).toBe('@counter-style name-two { system: numeric; }')
    })
    test('@counter-style - valid block contents', () => {
        const input = '@COUNTER-STYLE name { PAD: { env(name) }; system: first-valid(numeric); }'
        const sheet = createStyleSheet(input)
        expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
    })
    test('@font-face - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @font-face {

                style {}
                color: red;
                --custom:hover {};

                font-weight: env(name) {};
                size-adjust: {} env(name);
                font-weight: initial;
                size-adjust: initial;
                font-weight: inherit(--custom);
                size-adjust: inherit(--custom);
                font-weight: var(--custom);
                size-adjust: var(--custom);
                font-weight: attr(name);
                size-adjust: attr(name);
                font-weight: toggle(1);
                size-adjust: toggle(1%);
                font-weight: calc-mix(0, 1, 1);
                size-adjust: calc-mix(0, 1%, 1%);
                font-weight: container-progress(aspect-ratio, 1, 1);
                size-adjust: calc(1% * container-progress(aspect-ratio, 1, 1));
                font-weight: 1 !important;
                size-adjust: 1px !important;

                font-family: name;
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@font-face { font-family: name; }')
    })
    test('@font-face - valid block contents', () => {
        const declarations = [
            'FONT-WEIGHT: { env(name) }',
            'SIZE-ADJUST: { env(name) }',
            'font-weight: first-valid(1)',
            'size-adjust: first-valid(1%)',
        ]
        declarations.forEach(declaration => {
            const input = `@FONT-FACE { ${declaration}; }`
            const sheet = createStyleSheet(input)
            expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
        })
    })
    test('@font-feature-values - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @font-feature-values name {

                @media;
                style;

                @charset "utf-8";
                @import "./global.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @annotation {}
                @color-profile --name {}
                @container name {}
                @counter-style name {}
                @font-face {}
                @font-feature-values name {}
                @font-palette-values --name { font-family: name; }
                @function --name {}
                @keyframes name {}
                @layer name;
                @media {}
                @page {}
                @position-try --name {}
                @property --name { syntax: "*"; inherits: false; }
                @scope {}
                @starting-style {}
                @supports (color: green) {}
                @top-left {}
                @view-transition {}
                style:hover {}
                0% {}

                color: red;
                --custom:hover {};

                font-display: env(name) {};
                font-display: {} env(name);
                font-display: initial;
                font-display: inherit(--custom);
                font-display: var(--custom);
                font-display: attr(name);
                font-display: toggle(name);
                font-display: swap !important;

                font-display: block;
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@font-feature-values name { font-display: block; }')
    })
    test('@font-feature-values - valid block contents', () => {
        const declarations = [
            'FONT-DISPLAY: { env(name) }',
            'font-display: first-valid(block)',
        ]
        declarations.forEach(declaration => {
            const input = `@FONT-FEATURE-VALUES name { ${declaration}; }`
            const sheet = createStyleSheet(input)
            expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
        })
    })
    test('@font-palette-values - missing declaration for font-family', () => {
        expect(createStyleSheet('@font-palette-values --name {}').cssRules).toHaveLength(0)
    })
    test('@font-palette-values - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @font-palette-values --name {

                style {}
                color: red;
                --custom:hover {};

                base-palette: env(name) {};
                base-palette: {} env(name);
                base-palette: initial;
                base-palette: inherit(--custom);
                base-palette: var(--custom);
                base-palette: attr(name);
                base-palette: toggle(1);
                base-palette: calc-mix(0, 1, 1);
                base-palette: container-progress(aspect-ratio, 1, 1);
                base-palette: 1 !important;

                font-family: name;
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@font-palette-values --name { font-family: name; }')
    })
    test('@font-palette-values - valid block contents', () => {
        const input = '@FONT-PALETTE-VALUES --name { BASE-PALETTE: { env(name) }; font-family: first-valid(name); }'
        const sheet = createStyleSheet(input)
        expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
    })
    test('@function - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @function --name {

                @media;
                style;

                @charset "utf-8";
                @import "./global.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @annotation {}
                @color-profile --name {}
                @counter-style name {}
                @font-face {}
                @font-feature-values name {}
                @font-palette-values --name { font-family: name }
                @function --name {}
                @keyframes name {}
                @layer name;
                @page {}
                @position-try --name {}
                @property --name { syntax: "*"; inherits: false }
                @top-left {}
                @scope {}
                @starting-style {}
                @view-transition {}
                0% {}
                style {}

                color: red;

                result: env(name) {};
                result: {} env(name);
                result: 1 !important;

                @media {}
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@function --name { @media {} }')
    })
    test('@function - valid block contents', () => {
        const contents = [
            '@container name {}',
            '@media {}',
            '@supports (color: green) {}',
            // TODO: add support for CSSNestedDeclarationsRule
            // '--custom: {} var(--custom);',
            // 'RESULT: { env(name) };',
        ]
        const input = `@FUNCTION --name { ${contents.join(' ')} }`
        const sheet = createStyleSheet(input)
        expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
    })
    test('@keyframes - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @keyframes name {

                @media;
                style;

                @charset "utf-8";
                @import "./global.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @annotation {}
                @color-profile --name {}
                @container name {}
                @counter-style name {}
                @font-face {}
                @font-feature-values name {}
                @font-palette-values --name { font-family: name }
                @function --name {}
                @keyframes name {}
                @layer name;
                @media {}
                @page {}
                @position-try --name {}
                @property --name { syntax: "*"; inherits: false }
                @top-left {}
                @scope {}
                @starting-style {}
                @supports (color: red) {}
                @view-transition {}
                style {}

                color: red;
                --custom:hover {};

                0% {}
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@keyframes name { 0% {} }')
    })
    test('@keyframes - valid block contents', () => {
        const sheet = createStyleSheet('@KEYFRAMES name { FROM {} }')
        expect(sheet.cssRules[0].cssText).toBe('@keyframes name { 0% {} }')
    })
    test('@layer - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @layer {

                @media;
                style;

                @charset "utf-8";
                @import "./global.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @annotation {}
                @top-left {}
                0% {}

                color: red;
                --custom:hover {};

                @media {}
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@layer { @media {} }')
    })
    test('@layer - valid block contents', () => {
        const rules = [
            '@color-profile --name {}',
            '@container name {}',
            '@counter-style name {}',
            '@font-face {}',
            '@font-feature-values name {}',
            '@font-palette-values --name { font-family: name; }',
            '@function --name {}',
            '@keyframes name {}',
            '@layer name;',
            '@media {}',
            '@page {}',
            '@position-try --name {}',
            '@property --name { syntax: "*"; inherits: false; }',
            '@scope {}',
            '@starting-style {}',
            '@supports (color: green) {}',
            '@view-transition {}',
            'style:hover {}',
        ]
        const input = `@LAYER { ${rules.join(' ')} }`
        const sheet = createStyleSheet(input)
        expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
    })
    test('@media - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @media {

                @media;
                style;

                @charset "utf-8";
                @import "./global.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @annotation {}
                @top-left {}
                0% {}

                color: red;
                --custom:hover {};

                @media {}
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@media { @media {} }')
    })
    test('@media - valid block contents', () => {
        const rules = [
            '@color-profile --name {}',
            '@container name {}',
            '@counter-style name {}',
            '@font-face {}',
            '@font-feature-values name {}',
            '@font-palette-values --name { font-family: name; }',
            '@function --name {}',
            '@keyframes name {}',
            '@layer name;',
            '@media {}',
            '@page {}',
            '@position-try --name {}',
            '@property --name { syntax: "*"; inherits: false; }',
            '@scope {}',
            '@starting-style {}',
            '@supports (color: green) {}',
            '@view-transition {}',
            'style:hover {}',
        ]
        const input = `@MEDIA { ${rules.join(' ')} }`
        const sheet = createStyleSheet(input)
        expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
    })
    test('@page - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @page {

                @media;
                style;

                @charset "utf-8";
                @import "./global.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @annotation {}
                @color-profile --name {}
                @container name {}
                @counter-style name {}
                @font-face {}
                @font-feature-values name {}
                @font-palette-values --name { font-family: name }
                @function --name {}
                @keyframes name {}
                @layer name;
                @media {}
                @page {}
                @position-try --name {}
                @property --name { syntax: "*"; inherits: false }
                @scope {}
                @starting-style {}
                @supports (color: red) {}
                @view-transition {}
                0% {}
                style:hover {}

                top: 1px;

                margin-top: env(name) {};
                margin-top: {} env(name);
                margin-top: attr(name);
                margin-top: toggle(1px);
                margin-top: calc-mix(0, 1px, 1px);
                margin-top: calc(1px * container-progress(aspect-ratio, 1, 1));

                @top-left {}
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@page { @top-left {} }')
    })
    test('@page - valid block contents', () => {
        const contents = [
            '@top-left {}',
            '--custom: {} var(--custom);',
            'MARGIN-TOP: { env(name) };',
            'SIZE: { env(name) };',
            'margin-top: first-valid(1px);',
            'size: first-valid(1px);',
            'margin-top: initial;',
            'size: initial;',
            'margin-top: inherit(--custom);',
            'size: inherit(--custom);',
            'margin-top: var(--custom);',
            'size: var(--custom);',
            'margin-top: 1px !important;',
            'size: 1px !important;',
        ]
        contents.forEach(content => {
            const input = `@PAGE { ${content} }`
            const sheet = createStyleSheet(input)
            expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
        })
    })
    test('@position-try - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @position-try --name {

                style {}
                color: red;
                --custom:hover {};

                top: env(name) {};
                top: {} env(name);
                top: 1px !important;

                bottom: 1px;
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@position-try --name { bottom: 1px; }')
    })
    test('@position-try - valid block contents', () => {
        const declarations = [
            'TOP: { env(name) }',
            'top: first-valid(1px)',
            'top: initial',
            'top: inherit(--custom)',
            'top: var(--custom)',
            'top: attr(name)',
            'top: toggle(1px)',
            'top: calc-mix(0, 1px, 1px)',
            'top: calc(1px * container-progress(aspect-ratio, 1, 1))',
        ]
        declarations.forEach(declaration => {
            const input = `@POSITION-TRY --name { ${declaration}; }`
            const sheet = createStyleSheet(input)
            expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
        })
    })
    test('@property - missing declaration for inherits', () => {
        expect(createStyleSheet('@property --name { syntax: "*"; initial-value: 1; }').cssRules).toHaveLength(0)
    })
    test('@property - missing declaration for syntax', () => {
        expect(createStyleSheet('@property --name { inherits: true; initial-value: 1; }').cssRules).toHaveLength(0)
    })
    test('@property - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @property --name {

                syntax: "*";
                inherits: true;

                style {}
                color: red;
                --custom:hover {};

                inherits: env(name) {};
                inherits: {} env(name);
                inherits: initial;
                inherits: inherit(--custom);
                inherits: var(--custom);
                inherits: attr(name);
                inherits: false !important;
                syntax: "initial";
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@property --name { syntax: "*"; inherits: true; }')
    })
    test('@property - valid block contents', () => {
        const declarations = [
            'INHERITS: { env(name) }',
            'inherits: first-valid(false)',
        ]
        declarations.forEach(declaration => {
            const input = `@PROPERTY --name { syntax: "*"; ${declaration}; }`
            const sheet = createStyleSheet(input)
            expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
        })
    })
    test('@property - invalid and valid initial-value', () => {

        const invalid = [
            // Invalid syntax
            ['', '<length>'],
            ['1', '<length>'],
            ['initial', '<length>'],
            ['attr(name)', '<length>'],
            ['env(name)', '<length>'],
            ['random-item(--key, 1px)', '<length>'],
            ['var(--custom)', '<length>'],
            ['first-valid(1px)', '<length>'],
            ['mix(0, 1px, 1px)', '<length>'],
            ['toggle(1px)', '<length>'],
            // Computationally dependent
            ['1em', '<length>'],
            ['calc(1em + 1px)', '<length>'],
            ['translate(1em)', '<transform-function>'],
            ['rgb(calc(1em / 1px) 0 0)', '<color>'],
            // https://github.com/w3c/css-houdini-drafts/issues/1076
            ['initial', '*'],
        ]
        const valid = [
            // Empty value
            ['', '*'],
            [' ', '*'],
            // Computationally independent
            ['1in', '<length>'],
            ['1%', '<length-percentage>'],
            ['calc(1% + 1px)', '<length-percentage>'],
            ['calc-mix(0, 1px, 1px)', '<length>'],
            ['random(1px, 1px)', '<length>'],
            ['calc(1px * sibling-index())', '<length>'],
            ['translate(1px)', '<transform-function>'],
            // Substitutions
            ['env(name)', '*'],
            ['var(--custom)', '*'],
            ['first-valid(1px)', '*'],
        ]
        const cases = [invalid, valid]

        cases.forEach((group, index) =>
            group.forEach(([value, syntax]) => {
                const styleSheet = createStyleSheet(`
                    @property --name {
                        syntax: "${syntax}";
                        initial-value: 1px;
                        initial-value: ${value};
                        inherits: true;
                    }
                `)
                expect(styleSheet.cssRules).toHaveLength(index)
            }))
    })
    test('@scope - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @scope {

                @media;
                style;

                @charset "utf-8";
                @import "./global.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @annotation {}
                @top-left {}
                0% {}

                top: env(name) {};
                top: {} env(name);

                @media {}
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@scope { @media {} }')
    })
    test('@scope - valid block contents', () => {

        const rules = [
            '@color-profile --name {}',
            '@container name {}',
            '@counter-style name {}',
            '@font-face {}',
            '@font-feature-values name {}',
            '@font-palette-values --name { font-family: name; }',
            '@function --name {}',
            '@keyframes name {}',
            '@layer name;',
            '@media {}',
            '@page {}',
            '@position-try --name {}',
            '@property --name { syntax: "*"; inherits: false; }',
            '@scope {}',
            '@starting-style {}',
            '@supports (color: green) {}',
            '@view-transition {}',
            'style:hover {}',
        ]
        const input = `@SCOPE { ${rules.join(' ')} }`
        const sheet = createStyleSheet(input)

        expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())

        const declarations = [
            '--custom: hover {}',
            'TOP: { env(name) }',
            'top: first-valid(1px)',
            'top: initial',
            'top: inherit(--custom)',
            'top: var(--custom)',
            'top: attr(name)',
            'top: toggle(1px)',
            'top: calc-mix(0, 1px, 1px)',
            'top: calc(1px * container-progress(aspect-ratio, 1, 1))',
            'top: 1px !important',
        ]
        declarations.forEach(declaration => {
            // TODO: add support for CSSNestedDeclarationsRule
            const input = `@SCOPE { :scope { ${declaration}; } }`
            const sheet = createStyleSheet(input)
            expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
        })
    })
    test('@starting-style - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @starting-style {

                @media;
                style;

                @charset "utf-8";
                @import "./global.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @annotation {}
                @top-left {}
                0% {}

                color: red;
                --custom:hover {};

                @media {}
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@starting-style { @media {} }')
    })
    test('@starting-style - valid block contents', () => {
        const rules = [
            '@color-profile --name {}',
            '@container name {}',
            '@counter-style name {}',
            '@font-face {}',
            '@font-feature-values name {}',
            '@font-palette-values --name { font-family: name; }',
            '@function --name {}',
            '@keyframes name {}',
            '@layer name;',
            '@media {}',
            '@page {}',
            '@position-try --name {}',
            '@property --name { syntax: "*"; inherits: false; }',
            '@scope {}',
            '@starting-style {}',
            '@supports (color: green) {}',
            '@view-transition {}',
            'style:hover {}',
        ]
        const input = `@STARTING-STYLE { ${rules.join(' ')} }`
        const sheet = createStyleSheet(input)
        expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
    })
    test('@supports - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @supports (color: green) {

                @media;
                style;

                @charset "utf-8";
                @import "./global.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @annotation {}
                @top-left {}
                0% {}

                color: red;
                --custom:hover {};

                @media {}
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@supports (color: green) { @media {} }')
    })
    test('@supports - valid block contents', () => {
        const rules = [
            '@color-profile --name {}',
            '@container name {}',
            '@counter-style name {}',
            '@font-face {}',
            '@font-feature-values name {}',
            '@font-palette-values --name { font-family: name; }',
            '@function --name {}',
            '@keyframes name {}',
            '@layer name;',
            '@media {}',
            '@page {}',
            '@position-try --name {}',
            '@property --name { syntax: "*"; inherits: false; }',
            '@scope {}',
            '@starting-style {}',
            '@supports (color: green) {}',
            '@view-transition {}',
            'style:hover {}',
        ]
        const input = `@SUPPORTS (color: green) { ${rules.join(' ')} }`
        const sheet = createStyleSheet(input)
        expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
    })
    test('@view-transition - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @view-transition {

                style {}
                color: red;
                --custom:hover {};

                types: env(name) {};
                types: {} env(name);
                types: initial;
                types: inherit(--custom);
                types: var(--custom);
                types: attr(name);
                types: toggle(name);
                types: name !important;

                navigation: auto;
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@view-transition { navigation: auto; }')
    })
    test('@view-transition - valid block contents', () => {
        const declarations = [
            'NAVIGATION: { env(name) }',
            'navigation: first-valid(auto)',
        ]
        declarations.forEach(declaration => {
            const input = `@VIEW-TRANSITION { ${declaration}; }`
            const sheet = createStyleSheet(input)
            expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
        })
    })
    test('font feature value type rule - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @font-feature-values name {
                @ANNOTATION {

                    style {}
                    color: red;
                    --custom:hover {};

                    name: env(name) {};
                    name: {} env(name);
                    name: initial;
                    name: inherit(--custom);
                    name: var(--custom);
                    name: attr(name);
                    name: toggle(name);
                    name: calc-mix(0, 1, 1) 1;
                    name: container-progress(aspect-ratio, 1, 1) 1;
                    name: 0 !important;

                    name: -1;
                    name: 1 2;
                }
                @character-variant {
                    name:  -1 2;
                    name: 100 1;
                    name: 1 2 3;
                }
                @ornaments {
                    name: -1;
                    name:  1 2;
                }
                @styleset {
                    name: -1 2 3 4 5;
                    name: 21 2 3 4 5;
                }
                @stylistic {
                    name: -1;
                    name:  1 2;
                }
                @swash {
                    name: -1;
                    name:  1 2;
                }
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@font-feature-values name {}')
    })
    test('font feature value type rule - valid block contents', () => {
        const contents = [
            '@ANNOTATION { name: 1; }',
            '@character-variant { name: 1 2; }',
            '@ornaments { name: 1; }',
            '@styleset { name: 1 2 3 4 5; }',
            '@stylistic { name: 1; }',
            '@swash { name: 1; }',
        ]
        const input = `@font-feature-values name { ${contents.join(' ')} }`
        const sheet = createStyleSheet(input)
        expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
    })
    test('keyframe rule - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @keyframes name {
                0% {

                    style {}
                    animation-delay: 1s;

                    top: env(name) {};
                    top: {} env(name);
                    top: 1px !important;

                    animation-timing-function: linear;
                }
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@keyframes name { 0% { animation-timing-function: linear; } }')
    })
    test('keyframes rule - valid block contents', () => {
        const declarations = [
            '--custom: {} var(--custom)',
            'TOP: { env(name) }',
            'top: first-valid(1px)',
            'top: initial',
            'top: inherit(--custom)',
            'top: var(--custom)',
            'top: attr(name)',
            'top: toggle(1px)',
            'top: calc-mix(0, 1px, 1px)',
            'top: calc(1px * container-progress(aspect-ratio, 1, 1))',
        ]
        declarations.forEach(declaration => {
            const input = `@keyframes name { 0% { ${declaration}; } }`
            const sheet = createStyleSheet(input)
            expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
        })
    })
    test('margin rule - invalid block contents', () => {
        const sheet = createStyleSheet(`
            @page {
                @top-left {

                    style {}
                    top: 1px;

                    margin-top: env(name) {};
                    margin-top: {} env(name);
                    margin-top: attr(name);
                    margin-top: toggle(1px);
                    margin-top: calc-mix(0, 1px, 1px);
                    margin-top: calc(1px * container-progress(aspect-ratio, 1px, 1px));

                    margin-bottom: 1px;
                }
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('@page { @top-left { margin-bottom: 1px; } }')
    })
    test('margin rule - valid block contents', () => {
        const declarations = [
            '--custom: {} var(--custom)',
            'MARGIN-TOP: { env(name) }',
            'margin-top: first-valid(1px)',
            'margin-top: initial',
            'margin-top: inherit(--custom)',
            'margin-top: var(--custom)',
        ]
        declarations.forEach(declaration => {
            const input = `@page { @TOP-LEFT { ${declaration}; } }`
            const sheet = createStyleSheet(input)
            expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
        })
    })
    test('nested group rule - invalid block contents', () => {
        const sheet = createStyleSheet(`
            style {
                @media {

                    @media;
                    style;

                    @charset "utf-8";
                    @import "./global.css";
                    @namespace svg "http://www.w3.org/2000/svg";
                    @annotation {}
                    @color-profile --name {}
                    @counter-style name {}
                    @font-face {}
                    @font-feature-values name {}
                    @font-palette-values --name { font-family: name }
                    @function --name {}
                    @keyframes name {}
                    @layer name;
                    @page {}
                    @position-try --name {}
                    @property --name { syntax: "*"; inherits: false }
                    @top-left {}
                    @view-transition {}
                    0% {}

                    top: env(name) {};
                    top: {} env(name);

                    @media {}
                }
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('style { @media { @media {} } }')
    })
    test('nested group rule - valid block contents', () => {

        const rules = [
            '@container name {}',
            '@layer {}',
            '@media {}',
            '@scope {}',
            '@starting-style {}',
            '@supports (color: green) {}',
            '& style:hover {}',
        ]
        const input = `style { @media { ${rules.join(' ')} } }`
        const sheet = createStyleSheet(input)

        expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())

        const declarations = [
            '--custom: hover {}',
            'TOP: { env(name) }',
            'top: first-valid(1px)',
            'top: initial',
            'top: inherit(--custom)',
            'top: var(--custom)',
            'top: attr(name)',
            'top: toggle(1px)',
            'top: calc-mix(0, 1px, 1px)',
            'top: calc(1px * container-progress(aspect-ratio, 1, 1))',
            'top: 1px !important',
        ]
        declarations.forEach(declaration => {
            const input = `style { @MEDIA { & { ${declaration}; } } }`
            const sheet = createStyleSheet(input)
            expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
        })
    })
    test('nested style rule - invalid block contents', () => {

        const sheet = createStyleSheet(`
            style {
                & {

                    @media;
                    style;

                    @charset "utf-8";
                    @import "./global.css";
                    @namespace svg "http://www.w3.org/2000/svg";
                    @annotation {}
                    @color-profile --name {}
                    @counter-style name {}
                    @font-face {}
                    @font-feature-values name {}
                    @font-palette-values --name { font-family: name }
                    @function --name {}
                    @keyframes name {}
                    @layer name;
                    @page {}
                    @position-try --name {}
                    @property --name { syntax: "*"; inherits: false }
                    @top-left {}
                    @view-transition {}
                    0% {}

                    top: env(name) {};
                    top: {} env(name);

                    @media {}
                }
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('style { & { @media {} } }')
    })
    test('nested style rule - valid block contents', () => {

        const rules = [
            '@container name {}',
            '@layer {}',
            '@media {}',
            '@scope {}',
            '@starting-style {}',
            '@supports (color: green) {}',
            '& style:hover {}',
        ]
        const input = `style { & { ${rules.join(' ')} } }`
        const sheet = createStyleSheet(input)

        expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())

        const declarations = [
            '--custom: hover {}',
            'TOP: { env(name) }',
            'top: first-valid(1px)',
            'top: initial',
            'top: inherit(--custom)',
            'top: var(--custom)',
            'top: attr(name)',
            'top: toggle(1px)',
            'top: calc-mix(0, 1px, 1px)',
            'top: calc(1px * container-progress(aspect-ratio, 1, 1))',
            'top: 1px !important',
        ]
        declarations.forEach(declaration => {
            const input = `style { & { ${declaration}; } }`
            const sheet = createStyleSheet(input)
            expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
        })
    })
    test('style rule - invalid prelude containing an undeclared namespace prefix', () => {

        const input = `
            @namespace svg "http://www.w3.org/2000/svg";
            svg|rect { fill: green }
            SVG|rect { fill: red }
            @namespace html "https://www.w3.org/1999/xhtml/";
            html|type {}
        `
        const { cssRules } = createStyleSheet(input)

        expect(cssRules).toHaveLength(2)

        const [, styleRule] = cssRules

        expect(CSSStyleRule.is(styleRule)).toBeTruthy()

        const { selectorText, style } = styleRule

        expect(selectorText).toBe('svg|rect')
        expect(style.fill).toBe('green')
    })
    test('style rule - invalid block contents', () => {

        const sheet = createStyleSheet(`
            style {

                @media;
                style;

                @charset "utf-8";
                @import "./global.css";
                @namespace svg "http://www.w3.org/2000/svg";
                @annotation {}
                @color-profile --name {}
                @counter-style name {}
                @font-face {}
                @font-feature-values name {}
                @font-palette-values --name { font-family: name }
                @function --name {}
                @keyframes name {}
                @layer name;
                @page {}
                @position-try --name {}
                @property --name { syntax: "*"; inherits: false }
                @top-left {}
                @view-transition {}
                0% {}

                top: env(name) {};
                top: {} env(name);

                @media {}
            }
        `)
        expect(sheet.cssRules[0].cssText).toBe('style { @media {} }')
    })
    test('style rule - valid block contents', () => {

        const rules = [
            '@container name {}',
            '@layer {}',
            '@media {}',
            '@scope {}',
            '@starting-style {}',
            '@supports (color: green) {}',
            '& style:hover {}',
        ]
        const input = `style { ${rules.join(' ')} }`
        const sheet = createStyleSheet(input)

        expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())

        const declarations = [
            '--custom: hover {}',
            'TOP: { env(name) }',
            'top: first-valid(1px)',
            'top: initial',
            'top: inherit(--custom)',
            'top: var(--custom)',
            'top: attr(name)',
            'top: toggle(1px)',
            'top: calc-mix(0, 1px, 1px)',
            'top: calc(1px * container-progress(aspect-ratio, 1, 1))',
            'top: 1px !important',
        ]
        declarations.forEach(declaration => {
            const input = `style { ${declaration}; }`
            const sheet = createStyleSheet(input)
            expect(sheet.cssRules[0].cssText).toBe(input.toLowerCase())
        })
    })
    // Legacy rules
    test('vendor prefixed rules', () => {
        const { cssRules: [keyframesRule] } = createStyleSheet('@-webkit-keyframes name {}')
        expect(CSSKeyframesRule.is(keyframesRule)).toBeTruthy()
        expect(keyframesRule.cssText).toBe('@keyframes name {}')
    })
})
