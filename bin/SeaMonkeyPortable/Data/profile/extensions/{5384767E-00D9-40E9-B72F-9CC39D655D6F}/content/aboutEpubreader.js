const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function aboutEpubreader() { }
aboutEpubreader.prototype = {
  classDescription: "about:epubreader",
  contractID: "@mozilla.org/network/protocol/about;1?what=epubreader",
  classID: Components.ID("be85f49c-68b4-4c67-a611-97061d60a09c"),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),

  getURIFlags: function(aURI) {
    return Ci.nsIAboutModule.ALLOW_SCRIPT;
  },

  newChannel: function(aURI) {
    let ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    let channel = ios.newChannel("chrome://epubreader/content/reader.xul", null, null);
    channel.originalURI = aURI;
    return channel;
  }
};
const NSGetFactory = XPCOMUtils.generateNSGetFactory([aboutEpubreader]);