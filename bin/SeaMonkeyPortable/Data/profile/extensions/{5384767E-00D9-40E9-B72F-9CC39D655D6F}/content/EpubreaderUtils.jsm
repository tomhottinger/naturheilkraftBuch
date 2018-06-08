/*
 EPUBReader Firefox Extension: http://www.epubread.com/
 Copyright (C) 2014 Michael Volz (epubread@gmail.com)

 This program is free software: you can redistribute it under
 the terms of the attached license (license.txt).

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 attached license (license.txt) for more details.

 You should have received a copy of the license (license.txt)
 along with this program. If not, see <http://www.epubread.com/license/>.
*/
var EXPORTED_SYMBOLS=["EpubreaderUtils"],a=Components.classes,b=Components.interfaces,c=Components.utils;c.import("chrome://epubreader/content/Epubreader.jsm");c.import("chrome://epubreader/content/EpubreaderRegistrar.jsm");c.import("chrome://epubreader/content/EpubreaderSynchronizer.jsm");
var EpubreaderUtils={a:!1,init:function(){!1==this.a&&(EpubreaderRegistrar.register(),a["@mozilla.org/globalmessagemanager;1"].getService(b.nsIMessageListenerManager).loadFrameScript("chrome://epubreader/content/content.js",!0),a["@mozilla.org/parentprocessmessagemanager;1"].getService(b.nsIMessageBroadcaster).addMessageListener("Epubreader:readEpub",Epubreader.readEpub),a["@mozilla.org/parentprocessmessagemanager;1"].getService(b.nsIMessageBroadcaster).addMessageListener("Epubreader:getCurrentUri",
EpubreaderUtils.getCurrentUri),a["@mozilla.org/parentprocessmessagemanager;1"].getService(b.nsIMessageBroadcaster).addMessageListener("Epubreader:Sync:getSyncDir",EpubreaderSynchronizer.getSyncDir),a["@mozilla.org/parentprocessmessagemanager;1"].getService(b.nsIMessageBroadcaster).addMessageListener("Epubreader:Sync:synchronizeEpubs",EpubreaderSynchronizer.synchronizeEpubs),a["@mozilla.org/parentprocessmessagemanager;1"].getService(b.nsIMessageBroadcaster).addMessageListener("Epubreader:Sync:exportOnlyEpubs",
EpubreaderSynchronizer.exportOnlyEpubs),a["@mozilla.org/parentprocessmessagemanager;1"].getService(b.nsIMessageBroadcaster).addMessageListener("Epubreader:Sync:importOnlyEpubs",EpubreaderSynchronizer.importOnlyEpubs),this.a=!0)},getCurrentUri:function(){return Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher).activeWindow.getBrowser().currentURI.spec}},d=EpubreaderUtils,e;for(e in d)d.name=d.name;EpubreaderUtils.init=EpubreaderUtils.init;
EpubreaderUtils.getCurrentUri=EpubreaderUtils.getCurrentUri;EpubreaderUtils.EXPORTED_SYMBOLS=EXPORTED_SYMBOLS;
