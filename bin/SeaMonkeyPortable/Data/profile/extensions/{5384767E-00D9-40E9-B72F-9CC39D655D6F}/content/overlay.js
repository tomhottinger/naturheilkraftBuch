var Ci = Components.interfaces;
var Cc = Components.classes;
var Cu = Components.utils;

Cu.import("chrome://epubreader/content/Epubreader.jsm");
Cu.import("chrome://epubreader/content/EpubreaderUtils.jsm");

var epubOverlay =
{
   init: function()
   {
      var version = "1.5.0.12";

      var pref = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.epubreader.");
      var lastVersion = "";

      try
      {
         lastVersion = pref.getCharPref("version");
      }
      catch(e)
      {
      }

      if(lastVersion == "") // EPUBReader never before started -> show welcome
      {
         var date = new Date();
         var time = Math.round(date.getTime()/1000);
         pref.setIntPref("update.last", time);

         epubOverlay.modifyPreferences(lastVersion, version);

         window.setTimeout
         (
            function()
            {
               pref.setCharPref("version", version);

               var browser = document.getElementById("content");
               var tab = browser.addTab("http://www.epubread.com/welcome.php");
               browser.selectedTab = tab;
            },
            2000
         );

         epubOverlay.createBookmark();
      }
      else if(!lastVersion.match(version)) // Just a new version installed -> show whatsnew
      {
         var date = new Date();
         var time = Math.round(date.getTime()/1000);
         pref.setIntPref("update.last", time);

         epubOverlay.modifyPreferences(lastVersion, version);

         window.setTimeout
         (
            function()
            {
               pref.setCharPref("version", version);

               var browser = document.getElementById("content");
               var tab = browser.addTab("chrome://epubreader/locale/whatsnew.html");
               browser.selectedTab = tab;
            },
            2000
         );

         epubOverlay.updateBookmark();
      }
      else if(lastVersion.match(version) && version == "1.5.0.12") // Current version matches last version -> show teaser
      {
         var lastUpdate = pref.getIntPref("update.last");
         var teaserShown = pref.getBoolPref("teaser_final_shown");

         var date = new Date();
         var time = Math.round(date.getTime()/1000);
         var diff = (time - lastUpdate)/(60*60*24);

         var dateFinal = new Date(2017, 1, 28);
         var timeFinal = Math.round(dateFinal.getTime()/1000);
         console.log("final: " + timeFinal);

         var dateMax = new Date(2017, 2, 5);
         var timeMax = Math.round(dateMax.getTime()/1000);
         console.log("max: " + timeMax);

         if(teaserShown == false && diff > 3 && time >= timeFinal && time <= timeMax)
         {
            pref.setBoolPref("teaser_final_shown", true);

            window.setTimeout
            (
               function()
               {
                  var browser = document.getElementById("content");
                  var tab = browser.addTab("chrome://epubreader/locale/whatsnew.html");
                  browser.selectedTab = tab;
               },
               2000
            );
         }
      }

      epubOverlay.addButton();

      /* if old version was installed, replace epub.html */
      var dirLocator = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
      var file = dirLocator.get("ProfD", Ci.nsIFile);

      file.append("epub");
      file.append("epub.html");

      if(file.exists())
      {
         var MODE_WRONLY = 0x02;
         var MODE_CREATE = 0x08;
         var MODE_TRUNCATE = 0x20;

         var os = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);

         os.init(file, MODE_WRONLY | MODE_CREATE | MODE_TRUNCATE, 0644, 0);
         var data = '<html><body style="margin:50px;"><center><font face="arial" size="2">The ePub-Library has moved. Please open it via the bookmark "ePub-Library" you find at the end of your bookmark list.</body></html>';
         os.write(data, data.length);
         os.close();
      }

      EpubreaderUtils.init();
   },

   createBookmark: function()
   {
      var bm = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
      var title = epubOverlay.getProperty("catalog.title");

      var url = "about:epubcatalog";
      var io = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
      var uri = io.newURI(url, null, null);

      if(!bm.isBookmarked(uri))
      {
         bm.insertBookmark(bm.bookmarksMenuFolder, uri, -1, title);
      }
   },

   updateBookmark: function()
   {
      var bm = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
      var title = epubOverlay.getProperty("catalog.title");

      var url = "about:epubcatalog";
      var io = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
      var uri = io.newURI(url, null, null);

      var url = "chrome://epubreader/content/catalog.xul";
      var io = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
      var uriCheck = io.newURI(url, null, null);

      if(bm.isBookmarked(uriCheck))
      {
         var bookmarks = bm.getBookmarkIdsForURI(uriCheck, {});

         for(var i = 0; i < bookmarks.length; i++)
         {
            bm.changeBookmarkURI(bookmarks[i], uri);
            bm.setItemTitle(bookmarks[i], title);
         }
      }

      var url = "chrome://epubreader/content/index.html";
      var io = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
      var uriCheck = io.newURI(url, null, null);

      if(bm.isBookmarked(uriCheck))
      {
         var bookmarks = bm.getBookmarkIdsForURI(uriCheck, {});

         for(var i = 0; i < bookmarks.length; i++)
         {
            bm.changeBookmarkURI(bookmarks[i], uri);
            bm.setItemTitle(bookmarks[i], title);
         }
      }

      var url = "about:epubreader";
      var io = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
      var uriCheck = io.newURI(url, null, null);

      if(bm.isBookmarked(uriCheck))
      {
         var bookmarks = bm.getBookmarkIdsForURI(uriCheck, {});

         for(var i = 0; i < bookmarks.length; i++)
         {
            bm.changeBookmarkURI(bookmarks[i], uri);
            bm.setItemTitle(bookmarks[i], title);
         }
      }
   },

   addButton: function()
   {
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("extensions.epubreader.");

      var buttonAdded = pref.getBoolPref("button_added");

      if(buttonAdded == false)
      {
         try
         {
            var nav = document.getElementById("nav-bar");
            var set = nav.currentSet;

            if(!set.match(/.*epubreader-catalog-button.*/))
            {
               set = set + ",epubreader-catalog-button";

               nav.setAttribute("currentset", set);
               nav.currentSet = set;
               document.persist("nav-bar", "currentset");

               try
               {
                  BrowserToolboxCustomizeDone(true);
               }
               catch(e)
               {
               }

               window.setTimeout
               (
                  function()
                  {
                     var button = document.getElementById("epubreader-catalog-button");
                     var notification = document.getElementById("epubreader-button-notification");
                     notification.openPopup(button, "after_end", 0, 0, false, false);
                  },
                  5000
               );
            }

            pref.setBoolPref("button_added", true);
         }
         catch(e)
         {
         }
      }
   },

   modifyPreferences: function(oldVersion, newVersion)
   {
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("extensions.epubreader.");

      var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
                    .getService(Components.interfaces.nsIXULAppInfo);

      var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
                           .getService(Components.interfaces.nsIVersionComparator);


      if(versionChecker.compare(oldVersion, "1.4.0.0") < 0 &&
         versionChecker.compare(newVersion, "1.4.0.0") >= 0)
      {
         if(versionChecker.compare(appInfo.platformVersion, "1.9.2") < 0 ||
            oldVersion != "")
         {
            pref.setCharPref("count.column.content", "single");
            pref.setIntPref("paging_dir.content", 2);
         }

         if(versionChecker.compare(appInfo.platformVersion, "1.9.2") >= 0 &&
            oldVersion != "")
         {
            pref.setBoolPref("paging_hint_shown", false);
         }

         if(oldVersion != "")
         {
            var width = pref.getCharPref("width.column.content");

            if(width == "parent")
            {
               pref.setCharPref("width.column.content", "120mm");
            }
         }
      }
   },

   closeNotification: function()
   {
      var notification = document.getElementById("epubreader-button-notification");
      notification.hidePopup();
   },

   loadPage: function(page)
   {
      var url = "";
      var found = false;
      var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
      var browserEnumerator = wm.getEnumerator("navigator:browser");

      if(page == "catalog")
      {
         url = "about:epubcatalog";
      }

      while(!found && browserEnumerator.hasMoreElements())
      {
         var browserWin = browserEnumerator.getNext();
         var tabbrowser = browserWin.gBrowser;

         var numTabs = tabbrowser.browsers.length;

         for(var index = 0; index < numTabs; index++)
         {
            var currentBrowser = tabbrowser.getBrowserAtIndex(index);

            if(url == unescape(currentBrowser.currentURI.spec))
            {
               tabbrowser.selectedTab = tabbrowser.tabContainer.childNodes[index];
               browserWin.focus();

               found = true;
               break;
            }
         }
      }

      if(!found)
      {
         var recentWindow = wm.getMostRecentWindow("navigator:browser");

         if(recentWindow)
         {
            if("delayedOpenTab" in recentWindow)
            {
               recentWindow.delayedOpenTab(url);
            }
            else if("openNewTabWith" in recentWindow)
            {
               recentWindow.openNewTabWith(url);
            }
         }
         else
         {
            window.open(url);
         }
      }
   },

   getProperty: function(name)
   {
      var properties = document.getElementById("epubreader_properties");
      var text = properties.getString(name);

      return text;
   }
}

window.addEventListener("load", epubOverlay.init, true);

epubOverlay['loadPage'] = epubOverlay.loadPage;