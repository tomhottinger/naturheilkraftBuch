Components.utils.import("chrome://epubreader/content/Epubreader.jsm");

var tag =
{
   update: null,
   id: null,

   init: function()
   {
      tag.update = window.arguments[0];

      if(tag.update == true)
      {
         var title = tag.getProperty("tag.update");
         document.title = title;

         tag.id = window.arguments[1];

         var name = window.arguments[2];
         document.getElementById("name").value = name.substr(0, name.lastIndexOf("(") - 1);
      }
      else
      {
         var title = tag.getProperty("tag.add");
         document.title = title;
      }
   },

   save: function(pos, data)
   {
      if(pos == 0)
      {
         var name = document.getElementById("name").value;

         if(name.length == 0)
         {
            var message = tag.getProperty("tag.min_characters");
            alert(message);
            return false;
         }

         pos++;
         name = name.replace(/'/g, "''");

         if(tag.update == true)
         {
            Epubreader.updateTag(tag.save, pos, tag.id, name);
         }
         else
         {
            Epubreader.storeTag(tag.save, pos, name);
         }
      }
      else if(pos == 1)
      {
         var ret = data;

         if(ret == 0)
         {
            var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                     .getService(Components.interfaces.nsIWindowWatcher);

            var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                     .getService(Components.interfaces.nsIPromptService);

            var message = tag.getProperty("tag.save_error");

            ps.alert(ww.activeWindow, "", message);
            return false;
         }
         else if(ret == -1)
         {
            var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                     .getService(Components.interfaces.nsIWindowWatcher);

            var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                     .getService(Components.interfaces.nsIPromptService);

            var message = tag.getProperty("tag.already_exists");

            ps.alert(ww.activeWindow, "", message);
            return false;
         }
         else
         {
            return true;
         }
      }
   },

   cancel: function()
   {
      return true;
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