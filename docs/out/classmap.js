YAHOO.env.classMap = {"STYLES": "formaterrors", "StackFormat": "formaterrors", "formaterrors": "formaterrors", "StackTheme": "formaterrors"};

YAHOO.env.resolveClass = function(className) {
    var a=className.split('.'), ns=YAHOO.env.classMap;

    for (var i=0; i<a.length; i=i+1) {
        if (ns[a[i]]) {
            ns = ns[a[i]];
        } else {
            return null;
        }
    }

    return ns;
};
