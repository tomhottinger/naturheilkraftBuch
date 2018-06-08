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

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cm = Components.manager;
const Cu = Components.utils;

var EXPORTED_SYMBOLS = ['EpubreaderSynchronizer'];

Cu.import("chrome://epubreader/content/Epubreader.jsm");

var synchronizer =
{
   syncDir: null,
   mode: null,
   counter: 0,
   counterFailed: 0,

   task_start: 0,
   task_delete_library: 1,
   task_delete_sync_dir: 2,
   task_export: 3,
   task_import: 4,

   mode_sync: 1,
   mode_export: 2,
   mode_import: 3,

   dir_import: 1,
   dir_export: 2,

   exception_encrypted: -1,
   exception_corrupted: -2,
   exception_too_large: -3,
   exception_invalid_characters: -4,
   exception_container_missing: -5,
   exception_opf_missing: -6,

   synchronizeEpubs: function()
   {
      var dir = synchronizer.getSyncDir(false);

      if(dir)
      {
         synchronizer.syncDir = dir;
      }
      else
      {
         return;
      }

      synchronizer.mode = synchronizer.mode_sync;
      synchronizer.controllerSync(synchronizer.task_start, null);
   },

   exportOnlyEpubs: function()
   {
      var dir = synchronizer.getDir(synchronizer.dir_export);

      if(dir)
      {
         synchronizer.syncDir = dir;
      }
      else
      {
         return;
      }

      synchronizer.mode = synchronizer.mode_export;
      synchronizer.controllerExport(synchronizer.task_start, null);
   },

   importOnlyEpubs: function()
   {
      var dir = synchronizer.getDir(synchronizer.dir_import);

      if(dir)
      {
         synchronizer.syncDir = dir;
      }
      else
      {
         return;
      }

      synchronizer.mode = synchronizer.mode_import;
      synchronizer.controllerImport(synchronizer.task_start, null);
   },

   controllerSync: function(task, count)
   {
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("extensions.epubreader.");

      var prefDom = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("dom.");

      try
      {
         if(task == synchronizer.task_start)
         {
            var last = pref.getIntPref("sync.last");

            if(last == 0)
            {
               var displayLast = synchronizer.getProperty("sync.never");
            }
            else
            {
               var dateLast = new Date((last*1000));
               var displayLast = dateLast.toLocaleString();
            }

            prefDom.setIntPref("max_script_run_time", 0);
            var date = new Date();

            synchronizer.setWaitStatus();

            synchronizer.showProgress("");
            var msg = synchronizer.getProperty("sync.last");
            msg = msg.replace(/%last%/, displayLast);
            synchronizer.showProgress(msg);
            synchronizer.showProgress(" ");
            synchronizer.showProgress(date.toLocaleString());
            var msg = synchronizer.getProperty("sync.start");
            synchronizer.showProgress(msg);
            synchronizer.showProgress("===============================");

            var msg = synchronizer.getProperty("sync.delete_library.start");
            synchronizer.showProgress(msg);
            synchronizer.deleteLibraryEpubs(0);
         }
         else if(task == synchronizer.task_delete_library)
         {
            if(count >= 0)
            {
               var msg = synchronizer.getProperty("sync.delete_library.finished");
               msg = msg.replace(/%count%/, count);
               synchronizer.showProgress(msg);
               synchronizer.showProgress("-------------------------------");

               var msg = synchronizer.getProperty("sync.delete_sync.start");
               synchronizer.showProgress(msg);
               synchronizer.deleteSyncEpubs(0);
            }
            else
            {
               var msg = synchronizer.getProperty("sync.delete_library.failed");
               synchronizer.showProgress(msg);
               throw("deleteLibrary failed.");
            }
         }
         else if(task == synchronizer.task_delete_sync_dir)
         {
            if(count >= 0)
            {
               var msg = synchronizer.getProperty("sync.delete_sync.finished");
               msg = msg.replace(/%count%/, count);
               synchronizer.showProgress(msg);
               synchronizer.showProgress("-------------------------------");

               var msg = synchronizer.getProperty("sync.export.start");
               synchronizer.showProgress(msg);
               synchronizer.exportEpubs(0);
            }
            else
            {
               var msg = synchronizer.getProperty("sync.delete_sync.failed");
               synchronizer.showProgress(msg);
               throw("deleteSync failed.");
            }
         }
         else if(task == synchronizer.task_export)
         {
            if(count >= 0)
            {
               var msg = synchronizer.getProperty("sync.export.finished");
               msg = msg.replace(/%count%/, count);
               synchronizer.showProgress(msg);
               synchronizer.showProgress("-------------------------------");

               var msg = synchronizer.getProperty("sync.import.start");
               synchronizer.showProgress(msg);

               try
               {
                  var entries = synchronizer.getSyncEpubs();
                  synchronizer.importEpubs(0, null, entries);
               }
               catch(e)
               {
                  var msg = synchronizer.getProperty("sync.import.failed");
                  synchronizer.showProgress(msg);
                  throw("import failed.");
               }
            }
            else
            {
               var msg = synchronizer.getProperty("sync.export.failed");
               synchronizer.showProgress(msg);
               throw("export failed.");
            }
         }
         else if(task == synchronizer.task_import)
         {
            if(count >= 0)
            {
               var date = new Date();

               var msg = synchronizer.getProperty("sync.import.finished");
               msg = msg.replace(/%count%/, count);
               synchronizer.showProgress(msg);

               synchronizer.showProgress("===============================");
               var msg = synchronizer.getProperty("sync.finished");
               synchronizer.showProgress(msg);
               synchronizer.showProgress(date.toLocaleString());

               synchronizer.saveSyncTime();
               synchronizer.setDefaultStatus();

               prefDom.clearUserPref("max_script_run_time");

               synchronizer.reloadLibrary();
            }
            else
            {
               var msg = synchronizer.getProperty("sync.import.failed");
               synchronizer.showProgress(msg);
               throw("import failed.");
            }
         }
      }
      catch(e)
      {
         dump("sync failed: " + e + "\n");

         var date = new Date();

         synchronizer.showProgress("===============================");
         var msg = synchronizer.getProperty("sync.failed");
         synchronizer.showProgress(msg);
         synchronizer.showProgress(date.toLocaleString());

         synchronizer.setDefaultStatus();
         prefDom.clearUserPref("max_script_run_time");

         synchronizer.reloadLibrary();
      }
   },

   controllerExport: function(task, count)
   {
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("dom.");

      try
      {
         if(task == synchronizer.task_start)
         {
            pref.setIntPref("max_script_run_time", 0);

            synchronizer.setWaitStatus();

            synchronizer.showProgress("");
            synchronizer.showProgress("===============================");
            var msg = synchronizer.getProperty("sync.export.start");
            synchronizer.showProgress(msg);

            synchronizer.exportEpubs(0);
         }
         else if(task == synchronizer.task_export)
         {
            if(count >= 0)
            {
               var msg = synchronizer.getProperty("sync.export.finished");
               msg = msg.replace(/%count%/, count);
               synchronizer.showProgress(msg);
               synchronizer.showProgress("===============================");

               synchronizer.setDefaultStatus();

               pref.clearUserPref("max_script_run_time");
            }
            else
            {
               throw("export failed.");
            }
         }
      }
      catch(e)
      {
         var msg = synchronizer.getProperty("sync.export.failed");
         synchronizer.showProgress(msg);
         synchronizer.showProgress("===============================");

         synchronizer.setDefaultStatus();

         pref.clearUserPref("max_script_run_time");
      }
   },

   controllerImport: function(task, count)
   {
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("dom.");

      try
      {
         if(task == synchronizer.task_start)
         {
            pref.setIntPref("max_script_run_time", 0);

            synchronizer.setWaitStatus();

            synchronizer.showProgress("");
            synchronizer.showProgress("===============================");
            var msg = synchronizer.getProperty("sync.import.start");
            synchronizer.showProgress(msg);

            var entries = synchronizer.getSyncEpubs();
            synchronizer.importEpubs(0, null, entries);
         }
         else if(task == synchronizer.task_import)
         {
            var msg = synchronizer.getProperty("sync.import.finished");
            msg = msg.replace(/%count%/, count);
            synchronizer.showProgress(msg);
            synchronizer.showProgress("===============================");

            synchronizer.setDefaultStatus();
            pref.clearUserPref("max_script_run_time");

            synchronizer.reloadLibrary();
         }
      }
      catch(e)
      {
         var msg = synchronizer.getProperty("sync.import.failed");
         synchronizer.showProgress(msg);
         synchronizer.showProgress("===============================");

         synchronizer.setDefaultStatus();
         pref.clearUserPref("max_script_run_time");

         synchronizer.reloadLibrary();
      }
   },

   doit: function(func)
   {
      var tm = Components.classes["@mozilla.org/thread-manager;1"]
               .getService(Components.interfaces.nsIThreadManager);

      tm.mainThread.dispatch(
      {
         run: function()
         {
            func();
         }
      }, Components.interfaces.nsIThread.DISPATCH_NORMAL);
   },

   deleteLibraryEpubs: function(pos, data, epubsDelete, epub, success)
   {
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("extensions.epubreader.");

      var msgDoing = synchronizer.getProperty("sync.delete_library.doing");

      if(pos == 0)
      {
         if(!synchronizer.syncDir)
         {
            synchronizer.controllerSync(synchronizer.task_delete_library, -1);
         }

         synchronizer.counter = 0;

         pos++;
         Epubreader.getEpubs(synchronizer.deleteLibraryEpubs, pos);
      }
      else if(pos == 1)
      {
         var epubs = data;
         var last = null;
         var counter = 0;
         var epubsDelete = [];

         try
         {
            last = pref.getIntPref("sync.last");
         }
         catch(e)
         {
            last = 0;
         }

         var ids = synchronizer.getEpubIdentifiers();

         for(var i = 0; i < epubs.length; i++)
         {
            var epub = epubs[i];
            var found = false;

            for(var j = 0; j < ids.length; j++)
            {
               if(epub['identifier'] == ids[j]['id'])
               {
                  found = true;
                  break;
               }
            }

            if(found == false)
            {
               if(epub['timestamp'] <= last)
               {
                  epubsDelete[counter] = epub;
                  counter++;
               }
            }
         }

         if(epubsDelete.length > 0)
         {
            var result = synchronizer.confirmDeletion(epubsDelete);

            if(result == false)
            {
               synchronizer.controllerSync(synchronizer.task_delete_library, -1);
            }
            else
            {
               pos++;
               synchronizer.deleteLibraryEpubs(pos, null, epubsDelete);
            }
         }
         // no epubs to delete
         else
         {
            synchronizer.controllerSync(synchronizer.task_delete_library, 0);
         }
      }
      else if(pos == 2)
      {
         var epub = epubsDelete.pop();

         if(epub)
         {
            var msg = msgDoing;
            msg = msg.replace(/%name%/, epub['title']);
            synchronizer.showProgress(msg);

            pos++;
            Epubreader.deleteEpub(synchronizer.deleteLibraryEpubs, pos, epub['id'], epubsDelete, epub);
         }
         // epub list is empty -> finalize
         else
         {
            synchronizer.deleteLibraryEpubs(4);
         }
      }
      // delete epub finished
      else if(pos == 3)
      {
         if(success == true)
         {
            synchronizer.counter++;
         }
         else
         {
            var msg = synchronizer.getProperty("sync.delete_library.doing.failed");
            msg = msg.replace(/%name%/, epub['title']);
            synchronizer.showProgress(msg);
         }

         synchronizer.deleteLibraryEpubs(2, null, epubsDelete);
      }
      // all epubs deleted
      else if(pos == 4)
      {
         synchronizer.controllerSync(synchronizer.task_delete_library, synchronizer.counter);
      }
   },

   deleteSyncEpubs: function(pos, data, epubsDelete, epub, success)
   {
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("extensions.epubreader.");

      var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

      var msgDoing = synchronizer.getProperty("sync.delete_sync.doing");

      if(pos == 0)
      {
         if(!synchronizer.syncDir)
         {
            synchronizer.controllerSync(synchronizer.task_delete_sync_dir, -1);
         }

         synchronizer.counter = 0;

         pos++;
         Epubreader.getDeletedEpubs(synchronizer.deleteSyncEpubs, pos);
      }
      else if(pos == 1)
      {
         var epubs = data;
         var epubsDelete = [];
         var counter = 0;
         var ids = synchronizer.getEpubIdentifiers();

         try
         {
            var last = pref.getIntPref("sync.last");
         }
         catch(e)
         {
            var last = 0;
         }

         for(var i = 0; i < epubs.length; i++)
         {
            var epub = epubs[i];

            for(var j = 0; j < ids.length; j++)
            {
               if(epub['identifier'] == ids[j]['id'])
               {
                  if(epub['timestamp'] > last)
                  {
                     epubsDelete[counter] = epub;
                     counter++;

                     try
                     {
                        file.initWithPath(synchronizer.syncDir);
                        file.append(ids[j]['name']);
                        var msg = msgDoing;
                        msg = msg.replace(/%name%/, file.leafName);
                        synchronizer.showProgress(msg);
                        file.remove(false);
                     }
                     catch(e)
                     {
                        var msg = synchronizer.getProperty("sync.delete_sync.doing.failed");
                        msg = msg.replace(/%name%/, file.leafName);
                        synchronizer.showProgress(msg);
                     }

                     break;
                  }
               }
            }
         }

         synchronizer.deleteSyncEpubs(2, null, epubsDelete);
      }
      else if(pos == 2)
      {
         var epub = epubsDelete.pop();

         if(epub)
         {
            pos++;
            Epubreader.deleteEpubPermanent(synchronizer.deleteSyncEpubs, pos, epub['id'], epubsDelete, epub);
         }
         // epub list is empty -> finalize
         else
         {
            synchronizer.deleteSyncEpubs(4);
         }
      }
      // epub deleted
      else if(pos == 3)
      {
         if(success == true)
         {
            synchronizer.counter++;
         }
         else
         {
            var msg = synchronizer.getProperty("sync.delete_sync.doing.failed");
            msg = msg.replace(/%name%/, epub['name']);
            synchronizer.showProgress(msg);
         }

         synchronizer.deleteSyncEpubs(2, null, epubsDelete);
      }
      // all epubs deleted
      else if(pos == 4)
      {
         synchronizer.controllerSync(synchronizer.task_delete_sync_dir, synchronizer.counter);
      }
   },

   exportEpubs: function(pos, data, epubsExport, epub, success)
   {
      var msgDoing = synchronizer.getProperty("sync.export.doing");

      if(pos == 0)
      {
         if(!synchronizer.syncDir)
         {
            synchronizer.controllerExport(synchronizer.task_export, -1);
         }

         synchronizer.counter = 0;
         synchronizer.counterFailed = 0;

         pos++;
         Epubreader.getEpubs(synchronizer.exportEpubs, pos);
      }
      else if(pos == 1)
      {
         var epubs = data;
         var epubsExport = [];
         var ids = synchronizer.getEpubIdentifiers();

         for(var i = 0; i < epubs.length; i++)
         {
            var found = false;

            for(var j = 0; j < ids.length; j++)
            {
               if(epubs[i]['identifier'] == ids[j]['id'])
               {
                  found = true;
                  break;
               }
            }

            if(found == false)
            {
               epubsExport.push(epubs[i]);
            }
         }

         pos++;
         synchronizer.exportEpubs(pos, null, epubsExport);
      }
      else if(pos == 2)
      {
         var epub = epubsExport.pop();

         if(epub)
         {
            var msg = msgDoing;
            msg = msg.replace(/%name%/, epub['title']);
            synchronizer.showProgress(msg);

            pos++;
            Epubreader.exportEpub(synchronizer.exportEpubs, pos, epub['id'], synchronizer.syncDir, epubsExport, epub);
         }
         // epub list is empty -> finalize
         else
         {
            synchronizer.exportEpubs(4);
         }
      }
      // export finished
      else if(pos == 3)
      {
         if(success == true)
         {
            synchronizer.counter++;
         }
         else
         {
            synchronizer.counterFailed++;
            var msg = synchronizer.getProperty("sync.delete_sync.doing.failed");
            msg = msg.replace(/%name%/, epub['title']);
            synchronizer.showProgress(msg);
         }

         synchronizer.exportEpubs(2, null, epubsExport);
      }
      // all epubs exported
      else if(pos == 4)
      {
         if(synchronizer.mode == synchronizer.mode_sync)
         {
            synchronizer.controllerSync(synchronizer.task_export, synchronizer.counter);
         }
         else if(synchronizer.mode == synchronizer.mode_export)
         {
            synchronizer.controllerExport(synchronizer.task_export, synchronizer.counter);
         }
      }
   },

   importEpubs: function(pos, data, entries, entry, success)
   {
      var dir = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
      var msgDoing = synchronizer.getProperty("sync.import.doing");

      if(!synchronizer.syncDir)
      {
         synchronizer.controllerSync(synchronizer.task_import, -1);
      }

      if(pos == 0)
      {
         synchronizer.counter = 0;
         synchronizer.counterFailed = 0;

         var entriesFile = [];

         while(entries.hasMoreElements())
         {
            var entry = entries.getNext();
            entry.QueryInterface(Components.interfaces.nsIFile);
            entriesFile.push(entry);
         }

         pos++;
         synchronizer.importEpubs(pos, null, entriesFile);
      }
      else if(pos == 1)
      {
         var entry = entries.pop();

         if(entry)
         {
            if(entry.isFile())
            {
               if(entry.leafName.match(/.*\.epub$/i))
               {
                  var id = Epubreader.getEpubIdentifier(entry);

                  pos++;
                  Epubreader.getEpubByIdentifier(synchronizer.importEpubs, pos, id, entries, entry);
               }
               // no epub
               else
               {
                  synchronizer.importEpubs(pos, null, entries);
               }
            }
            // no file
            else
            {
               synchronizer.importEpubs(pos, null, entries);
            }
         }
         // epub list is empty -> finalize
         else
         {
            synchronizer.importEpubs(4);
         }
      }
      else if(pos == 2)
      {
         var ebook = data[0];

         if(!ebook)
         {
            var msg = msgDoing;
            msg = msg.replace(/%name%/, entry.leafName);
            synchronizer.showProgress(msg);

            pos++;
            var success = Epubreader.importEpub(synchronizer.importEpubs, pos, entry, entries);
         }
         // epub already exists in library
         else
         {
            synchronizer.importEpubs(1, null, entries);
         }
      }
      // import finished
      else if(pos == 3)
      {
         if(success == true)
         {
            synchronizer.counter++;
            synchronizer.importEpubs(1, null, entries);
         }
         else
         {
            synchronizer.counterFailed++;

            if(success == synchronizer.exception_encrypted)
            {
               var reason = synchronizer.getProperty("sync.import.doing.failed.reason_drm");
            }
            else if(success == synchronizer.exception_corrupted)
            {
               var reason = synchronizer.getProperty("sync.import.doing.failed.reason_corrupted");
            }
            else if(success == synchronizer.exception_too_large)
            {
               var reason = synchronizer.getProperty("sync.import.doing.failed.reason_too_large");
            }
            else if(success == synchronizer.exception_invalid_characters)
            {
               var reason = synchronizer.getProperty("sync.import.doing.failed.reason_invalid_characters");
            }
            else if(success == synchronizer.exception_container_missing)
            {
               var reason = synchronizer.getProperty("sync.import.doing.failed.reason_container_missing");
            }
            else if(success == synchronizer.exception_opf_missing)
            {
               var reason = synchronizer.getProperty("sync.import.doing.failed.reason_opf_missing");
            }
            else
            {
               var reason = synchronizer.getProperty("sync.import.doing.failed.reason_general");
            }

            var msg = synchronizer.getProperty("sync.import.doing.failed");
            msg = msg.replace(/%name%/g, entry.leafName);
            msg = msg.replace(/%reason%/, reason);
            synchronizer.showProgress(msg);
            entry.moveTo(null, entry.leafName + ".error");

            synchronizer.importEpubs(1, null, entries);
         }
      }
      // all epubs imported
      else if(pos == 4)
      {
         var result = synchronizer.counter;

         if(synchronizer.mode == synchronizer.mode_sync)
         {
            synchronizer.controllerSync(synchronizer.task_import, result);
         }
         else if(synchronizer.mode == synchronizer.mode_import)
         {
            synchronizer.controllerImport(synchronizer.task_import, result);
         }
      }
   },

   getSyncEpubs: function()
   {
      var dir = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

      try
      {
         if(!synchronizer.syncDir)
         {
            throw("no syncDir");
         }

         dir.initWithPath(synchronizer.syncDir);
         var entries = dir.directoryEntries;
      }
      catch(e)
      {
         dump("getSyncEpubs: failed. " + e + "\n");
         throw(e);
      }

      return entries;
   },

   getEpubIdentifiers: function()
   {
      var dir = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

      try
      {
         var ids = [];
         var counter = 0;

         if(!synchronizer.syncDir)
         {
            throw("no syncDir");
         }

         dir.initWithPath(synchronizer.syncDir);
         var entries = dir.directoryEntries;

         while(entries.hasMoreElements())
         {
            var entry = entries.getNext();
            entry.QueryInterface(Components.interfaces.nsIFile);

            if(entry.isFile())
            {
               if(entry.leafName.match(/.*\.epub$/i))
               {
                  var info = [];

                  var id = Epubreader.getEpubIdentifier(entry);

                  if(id)
                  {
                     info['id'] = id;
                     info['name'] = entry.leafName;

                     ids[counter] = info;
                     counter++;
                  }
               }
            }
         }
      }
      catch(e)
      {
         dump("getEpubIdentifiers: failed. " + e + "\n");
      }

      return ids;
   },

   pseudoThread: function(gen)
   {
      var thisGen = this;

      var callback =
      {
         observe: function(subject, topic, data)
         {
            if(!topic == "timer-callback") return;

            try
            {
               gen.next();
            }
            catch(e)
            {
               threadTimer.cancel();
               threadTimer = null;
               gen.close();

               if(!(e instanceof StopIteration))
               {
                  Components.utils.reportError(e);
               }
            };
         }
      }

      var threadTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
      threadTimer.init(callback, 0, Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
   },

   getSyncDir: function(forceNew)
   {
      var dir = null;

      var testDir = Components.classes["@mozilla.org/file/local;1"]
                    .createInstance(Components.interfaces.nsILocalFile);

      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("extensions.epubreader.");

      try
      {
         dir = pref.getCharPref("dir.sync");
      }
      catch(e)
      {
      }

      if(dir)
      {
         testDir.initWithPath(dir);

         if(!testDir.exists())
         {
            dir = null;
         }
      }

      if(!dir || forceNew == true)
      {
         var defaultDir = Components.classes["@mozilla.org/file/local;1"]
                          .createInstance(Components.interfaces.nsILocalFile);

         var prefDom = Components.classes["@mozilla.org/preferences-service;1"]
                       .getService(Components.interfaces.nsIPrefService).getBranch("dom.");

         var filePicker = Components.classes["@mozilla.org/filepicker;1"]
                          .createInstance(Components.interfaces.nsIFilePicker);

         var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                  .getService(Components.interfaces.nsIWindowWatcher);

         prefDom.setIntPref("max_script_run_time", 0);

         if(dir)
         {
            defaultDir.initWithPath(dir);
            filePicker.displayDirectory = defaultDir;
         }

         var title = synchronizer.getProperty("sync.dir");

         filePicker.init(ww.activeWindow, title, Components.interfaces.nsIFilePicker.modeGetFolder);
         var ret = filePicker.show();

         if(ret == Components.interfaces.nsIFilePicker.returnOK)
         {
            var dirOld = dir;
            dir = filePicker.file.path;
            pref.setCharPref("dir.sync", dir);

            if(dirOld != dir)
            {
               pref.setIntPref("sync.last", 0);
               Epubreader.deleteEpubsPermanent();
            }
         }

         prefDom.clearUserPref("max_script_run_time");
      }

      if(!forceNew)
      {
         return dir;
      }
   },

   getDir: function(type)
   {
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("extensions.epubreader.");

      var prefDom = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefService).getBranch("dom.");

      var filePicker = Components.classes["@mozilla.org/filepicker;1"]
                       .createInstance(Components.interfaces.nsIFilePicker);

      var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
               .getService(Components.interfaces.nsIWindowWatcher);

      var dir = null;

      prefDom.setIntPref("max_script_run_time", 0);

      if(type == synchronizer.dir_export)
      {
         var prefName = "dir.export";
         var title = synchronizer.getProperty("export.dir");
      }
      else
      {
         var prefName = "dir.import";
         var title = synchronizer.getProperty("import.dir");
      }

      try
      {
         var defaultDirName = pref.getCharPref(prefName);

         var defaultDir = Components.classes["@mozilla.org/file/local;1"]
                          .createInstance(Components.interfaces.nsILocalFile);

         defaultDir.initWithPath(defaultDirName);
         filePicker.displayDirectory = defaultDir;
      }
      catch(e)
      {
      }

      filePicker.init(ww.activeWindow, title, Components.interfaces.nsIFilePicker.modeGetFolder);
      var ret = filePicker.show();

      if(ret == Components.interfaces.nsIFilePicker.returnOK)
      {
         dir = filePicker.file.path;
         pref.setCharPref(prefName, dir);
      }

      prefDom.clearUserPref("max_script_run_time");

      return dir;
   },

   saveSyncTime: function()
   {
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("extensions.epubreader.");

      var date = new Date();
      var time = Math.round(date.getTime()/1000);

      pref.setIntPref("sync.last", time);
   },

   showProgress: function(text)
   {
      var mm = Components.classes['@mozilla.org/globalmessagemanager;1'].getService(Components.interfaces.nsIMessageListenerManager);
      mm.broadcastAsyncMessage("Epubreader:Sync:showProgress", {text:text});
   },

   setWaitStatus: function()
   {
      var mm = Components.classes['@mozilla.org/globalmessagemanager;1'].getService(Components.interfaces.nsIMessageListenerManager);
      mm.broadcastAsyncMessage("Epubreader:Sync:setWaitStatus");
   },

   setDefaultStatus: function()
   {
      var mm = Components.classes['@mozilla.org/globalmessagemanager;1'].getService(Components.interfaces.nsIMessageListenerManager);
      mm.broadcastAsyncMessage("Epubreader:Sync:setDefaultStatus");
   },

   confirmDeletion: function(epubs)
   {
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("extensions.epubreader.");

      var confirm = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                    .getService(Components.interfaces.nsIPromptService);

      var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
               .getService(Components.interfaces.nsIWindowWatcher);

      var ask = pref.getBoolPref("sync.delete_library.confirm");

      if(ask == false)
      {
         return true;
      }

      var check = {value: false};
      var title = synchronizer.getProperty("sync.delete_library.confirm.title");
      var checkbox = synchronizer.getProperty("sync.delete_library.confirm.checkbox");

      var msg = synchronizer.getProperty("sync.delete_library.confirm.message");
      var epubsTitle = "";

      for(var i = 0; i < epubs.length; i++)
      {
         epubsTitle = epubsTitle + "'" + epubs[i]['title'] + "'" + "\n";
      }

      msg = msg.replace(/%epubs%/, epubsTitle);

      var result = confirm.confirmCheck(ww.activeWindow, title, msg, checkbox, check);

      if(check.value == true)
      {
         pref.setBoolPref("sync.delete_library.confirm", false);
      }

      return result;
   },

   getProperty: function(name)
   {
      var bundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
                   .getService(Components.interfaces.nsIStringBundleService)
                   .createBundle("chrome://epubreader/locale/epubreader.properties");

      var property = bundle.GetStringFromName(name);

      return property;
   },

   reloadLibrary: function()
   {
      var url = "chrome://epubreader/content/catalog.xul";

      var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
               .getService(Components.interfaces.nsIWindowMediator);

      var browser = wm.getMostRecentWindow("navigator:browser").getBrowser();
      var regExp = new RegExp(url);
      var tab = null;
      var numTabs = browser.browsers.length;

      for(var i = 0; i < numTabs; i++)
      {
         var currentBrowser = browser.getBrowserAtIndex(i);

         if(unescape(currentBrowser.currentURI.spec).match(regExp))
         {
            tab = browser.tabContainer.childNodes[i];
            var myBrowser = browser.getBrowserForTab(tab);
            var contentDocument = myBrowser.contentDocument;
            var location = contentDocument.getElementById("catalog_page_frame").contentWindow.location;

            if(location == "chrome://epubreader/content/library.xul")
            {
               var contentWindow = myBrowser.contentWindow;
               contentWindow.location.reload(true);
            }
         }
      }
   }
}

var EpubreaderSynchronizer =
{
   init: function()
   {
      synchronizer.init();
   },

   getSyncDir: function(message)
   {
      var force = Boolean(message.json.force);
      synchronizer.getSyncDir(force);
   },

   synchronizeEpubs: function()
   {
      synchronizer.synchronizeEpubs();
   },

   exportOnlyEpubs: function()
   {
      synchronizer.exportOnlyEpubs();
   },

   importOnlyEpubs: function()
   {
      synchronizer.importOnlyEpubs();
   }
}