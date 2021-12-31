
// https://drafts.csswg.org/cssom/#cssimportrule
[Exposed=Window]
interface CSSImportRule : CSSRule {
    readonly attribute USVString href;
    [SameObject, PutForwards=mediaText] readonly attribute MediaList media;
    [SameObject] readonly attribute CSSStyleSheet styleSheet;
};
