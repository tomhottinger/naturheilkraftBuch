Components.utils.import("chrome://epubreader/content/Epubreader.jsm");

var picker =
{
   save: function(pos, data, id)
   {
      const Cc = Components.classes;
      const Ci = Components.interfaces;

      var pref = Cc["@mozilla.org/preferences-service;1"]
                 .getService(Ci.nsIPrefService).getBranch("extensions.epubreader.");

      var filePicker = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);

      if(pos == 0)
      {
         pos++;
         Epubreader.getEpub(picker.save, pos, id);
      }
      else if(pos == 1)
      {
         var epub = data[0];
      
         try
         {
            var saveDir = pref.getCharPref("dir.save");
         }
         catch(e)
         {
         }

         if(saveDir)
         {
            var dir = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);

            try
            {
               dir.initWithPath(saveDir);
               filePicker.displayDirectory = dir;
            }
            catch(e)
            {
               pref.clearUserPref("dir.save");
            }
         }

         var title = picker.getProperty("file.save.title");

         filePicker.init(window, title, Ci.nsIFilePicker.modeSave);
         filePicker.defaultExtension = "epub";
         filePicker.defaultString = epub['name'];
         filePicker.appendFilter("epub", "*.epub");

         var ret = filePicker.show();

         if(ret == Ci.nsIFilePicker.returnOK || ret == Ci.nsIFilePicker.returnReplace)
         {
            var source = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
            var root = Epubreader.getEpubRoot();

            if(filePicker.file.exists())
            {
               filePicker.file.remove(false);
            }

            source.initWithPath(root);
            source.append(epub['path']);
            source.append(epub['path'] + ".epub");
            source.copyTo(filePicker.file.parent, filePicker.file.leafName);

            pref.setCharPref("dir.save", filePicker.file.parent.path);
         }
      }
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