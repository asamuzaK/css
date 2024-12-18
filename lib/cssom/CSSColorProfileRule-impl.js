
const { serializeCSSComponentValue, serializeCSSValue } = require('../serialize.js')
const { implementation: CSSRuleImpl } = require('./CSSRule-impl.js')
const { cssPropertyToIDLAttribute } = require('../utils/string.js')
const descriptors = require('../descriptors/definitions.js')['@color-profile']

const descriptorNames = Object.keys(descriptors)

/**
 * @see {@link https://drafts.csswg.org/css-color-5/#csscolorprofilerule}
 */
class CSSColorProfileRuleImpl extends CSSRuleImpl {

    /**
     * @param {DocumentOrShadowRoot} globalObject
     * @param {*[]} args
     * @param {object} privateData
     */
    constructor(globalObject, args, privateData) {
        super(globalObject, args, privateData)
        this.name = serializeCSSComponentValue(privateData.prelude)
        descriptorNames.forEach(name => {
            const declaration = this._declarations.find(declaration => declaration.name === name)
            this[cssPropertyToIDLAttribute(name)] = declaration ? serializeCSSValue(declaration) : ''
        })
    }

    /**
     * @returns {string}
     * @see {@link https://drafts.csswg.org/cssom-1/#dom-cssrule-csstext}
     */
    get cssText() {
        const declarations = []
        descriptorNames.forEach(name => {
            const { [cssPropertyToIDLAttribute(name)]: value } = this
            if (value) {
                declarations.push(`${name}: ${value}`)
            }
        })
        return 0 < declarations.length
            ? `@color-profile ${this.name} { ${declarations.join('; ')}; }`
            : `@color-profile ${this.name} {}`
    }
}

module.exports = {
    implementation: CSSColorProfileRuleImpl,
}
