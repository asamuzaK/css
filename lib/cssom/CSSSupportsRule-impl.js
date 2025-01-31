
const { implementation: CSSConditionRuleImpl } = require('./CSSConditionRule-impl')

/**
 * @see {@link https://drafts.csswg.org/css-conditional-3/#csssupportsrule}
 */
class CSSSupportsRuleImpl extends CSSConditionRuleImpl {

    /**
     * @returns {string}
     * @see {@link https://drafts.csswg.org/cssom-1/#dom-cssrule-csstext}
     */
    get cssText() {
        const { cssRules, conditionText } = this
        const rules = cssRules._rules.map(rule => rule.cssText).join(' ')
        return rules
            ? `@supports ${conditionText} { ${rules} }`
            : `@supports ${conditionText} {}`
    }
}

module.exports = {
    implementation: CSSSupportsRuleImpl,
}
