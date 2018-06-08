/**
 * EPUBReader Firefox Extension: http://www.epubread.com/
 * Copyright (C) 2014 Michael Volz (epubread@gmail.com)
 *
 * This program is free software: you can redistribute it under
 * the terms of the attached license (license.txt).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * attached license (license.txt) for more details.
 *
 * You should have received a copy of the license (license.txt)
 * along with this program. If not, see <http://www.epubread.com/license/>.
**/

Components.utils.import("resource://gre/modules/Services.jsm");

var synchronizer =
{
   init: function()
   {
      var sync = synchronizer.getProperty("sync");
      var exp = synchronizer.getProperty("export");
      var imp = synchronizer.getProperty("import");
      var text = sync + "/" + exp + "/" + imp;
      document.title = text;

      var text = synchronizer.getProperty("sync");
      var link = document.getElementById("synchronize");
      link.innerHTML = text;

      var text = synchronizer.getProperty("sync.dir.new");
      var sync = document.getElementById("new_sync_dir");
      sync.setAttribute("title", text);

      var text = synchronizer.getProperty("export");
      var link = document.getElementById("export");
      link.innerHTML = text;

      var text = synchronizer.getProperty("import");
      var link = document.getElementById("import");
      link.innerHTML = text;
   },

   getSyncDir: function(forceNew)
   {
      var mm = Components.classes["@mozilla.org/childprocessmessagemanager;1"]
                       .getService(Components.interfaces.nsISyncMessageSender);

      mm.sendSyncMessage('Epubreader:Sync:getSyncDir', {force:forceNew});
   },
   
   synchronizeEpubs: function()
   {
      var mm = Components.classes["@mozilla.org/childprocessmessagemanager;1"]
                       .getService(Components.interfaces.nsIMessageSender);

      mm.sendAsyncMessage('Epubreader:Sync:synchronizeEpubs');
   },

   exportOnlyEpubs: function()
   {
      var mm = Components.classes["@mozilla.org/childprocessmessagemanager;1"]
                       .getService(Components.interfaces.nsIMessageSender);

      mm.sendAsyncMessage('Epubreader:Sync:exportOnlyEpubs');
   },

   importOnlyEpubs: function()
   {
      var mm = Components.classes["@mozilla.org/childprocessmessagemanager;1"]
                       .getService(Components.interfaces.nsIMessageSender);

      mm.sendAsyncMessage('Epubreader:Sync:importOnlyEpubs');
   },

   getProperty: function(name)
   {
      var bundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
                   .getService(Components.interfaces.nsIStringBundleService)
                   .createBundle("chrome://epubreader/locale/epubreader.properties");

      var property = bundle.GetStringFromName(name);

      return property;
   }
}

window.addEventListener("load", synchronizer.init, true);