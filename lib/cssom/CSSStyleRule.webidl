
// https://drafts.csswg.org/cssom/#cssstylerule
[Exposed=Window]
interface CSSStyleRule : CSSRule {
    attribute CSSOMString selectorText;
    [SameObject, PutForwards=cssText] readonly attribute CSSStyleDeclaration style;
};
