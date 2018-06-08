const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function aboutEpubcatalog() { }
aboutEpubcatalog.prototype = {
  classDescription: "about:epubcatalog",
  contractID: "@mozilla.org/network/protocol/about;1?what=epubcatalog",
  classID: Components.ID("a196022c-d2e5-4f76-bb81-675f488f2ed8"),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),
  
  getURIFlags: function(aURI) {
    return Ci.nsIAboutModule.ALLOW_SCRIPT;
  },
  
  newChannel: function(aURI) {
    let ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    let channel = ios.newChannel("chrome://epubreader/content/catalog.xul", null, null);
    channel.originalURI = aURI;
    return channel;
  }
};
const NSGetFactory = XPCOMUtils.generateNSGetFactory([aboutEpubcatalog]);