
const CSSPositionTryDescriptors = require('./CSSPositionTryDescriptors.js')
const { implementation: CSSRuleImpl } = require('./CSSRule-impl.js')
const { serializeCSSComponentValue } = require('../serialize.js')

/**
 * @see {@link https://drafts.csswg.org/css-anchor-position-1/#csspositiontryrule}
 */
class CSSPositionTryRuleImpl extends CSSRuleImpl {

    /**
     * @param {DocumentOrShadowRoot} globalObject
     * @param {*[]} args
     * @param {object} privateData
     */
    constructor(globalObject, args, privateData) {
        super(globalObject, args, privateData)
        this.name = serializeCSSComponentValue(privateData.prelude)
        this.style = CSSPositionTryDescriptors.createImpl(globalObject, undefined, {
            declarations: this._declarations,
            parentRule: this,
        })
    }

    /**
     * @returns {string}
     * @see {@link https://drafts.csswg.org/cssom-1/#dom-cssrule-csstext}
     */
    get cssText() {
        const { name, style: { cssText } } = this
        return cssText
            ? `@position-try ${name} { ${cssText} }`
            : `@position-try ${name} {}`
    }
}

module.exports = {
    implementation: CSSPositionTryRuleImpl,
}
