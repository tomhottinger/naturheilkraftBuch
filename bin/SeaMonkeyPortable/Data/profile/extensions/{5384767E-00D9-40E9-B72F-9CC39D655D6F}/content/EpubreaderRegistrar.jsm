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
var EXPORTED_SYMBOLS=["EpubreaderRegistrar"],c=Components.classes,d=Components.interfaces,f=Components.manager,g=Components.utils;g.import("resource://gre/modules/XPCOMUtils.jsm");g.import("resource://gre/modules/Services.jsm");g.import("chrome://epubreader/content/EpubreaderConverter.jsm");function h(){this.b=this.c=this.a=null}
h.prototype={register:function(a,e){var b=a.prototype;this.a=b.classID;var l=XPCOMUtils._getFactory(a);this.b=l;this.c=e;var m=f.QueryInterface(d.nsIComponentRegistrar);!1==m.isContractIDRegistered(b.contractID)&&m.registerFactory(b.classID,b.classDescription,b.contractID,l);c["@mozilla.org/categorymanager;1"].getService(d.nsICategoryManager).addCategoryEntry("net-content-sniffers",e,"@mozilla.org/streamconv;1?from=application/epub+zip&to=*/*",!1,!0)},unregister:function(){var a=f.QueryInterface(d.nsIComponentRegistrar);
try{a.unregisterFactory(this.a,this.b)}catch(e){}a=c["@mozilla.org/categorymanager;1"].getService(d.nsICategoryManager);try{a.deleteCategoryEntry("net-content-sniffers",this.c,!0)}catch(b){}}};var k=new h,EpubreaderRegistrar={register:function(){k.register(EpubreaderConverter,"EpubreaderConverter")},unregister:function(){k.unregister()}},n=EpubreaderRegistrar,p;for(p in n)n.name=n.name;EpubreaderRegistrar.register=EpubreaderRegistrar.register;EpubreaderRegistrar.unregister=EpubreaderRegistrar.unregister;
EpubreaderRegistrar.EXPORTED_SYMBOLS=EXPORTED_SYMBOLS;
