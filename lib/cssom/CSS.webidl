
// https://drafts.csswg.org/cssom-1/#namespacedef-css
// https://drafts.css-houdini.org/css-animation-worklet-1/#dom-css-animationworklet
// https://drafts.css-houdini.org/css-layout-api-1/#dom-css-layoutworklet
// https://drafts.css-houdini.org/css-paint-api-1/#dom-css-paintworklet
// https://drafts.css-houdini.org/css-properties-values-api-1/#dom-css-registerproperty
// https://drafts.csswg.org/css-conditional-3/#the-css-namespace
// https://drafts.csswg.org/css-highlight-api-1/#dom-css-highlights
// https://drafts.csswg.org/css-images-4/#dom-css-elementsources
// https://github.com/w3c/csswg-drafts/issues/9372
[Exposed=Window]
// `namespace` is not supported by `webidl2js`
//namespace CSS {
interface CSS {

    //[SameObject] readonly attribute Worklet animationWorklet;
    //[SameObject] readonly attribute any elementSources;
    readonly attribute HighlightRegistry highlights;
    //[SameObject] readonly attribute Worklet layoutWorklet;
    //[SameObject] readonly attribute Worklet paintWorklet;

    CSSOMString escape(CSSOMString ident);
	undefined registerProperty(PropertyDefinition definition);
    boolean supports(CSSOMString property, CSSOMString value);
    boolean supports(CSSOMString conditionText);
};

// https://drafts.css-houdini.org/css-properties-values-api-1/#dictdef-propertydefinition
dictionary PropertyDefinition {
    required boolean inherits;
    DOMString initialValue;
    required DOMString name;
    DOMString syntax = "*";
};
