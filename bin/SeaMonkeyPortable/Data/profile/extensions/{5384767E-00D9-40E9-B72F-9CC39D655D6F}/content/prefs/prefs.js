Components.utils.import("chrome://epubreader/content/Epubreader.jsm");

var epubPrefs =
{
   contentBackgroundColorDefault: "#ffffff",
   contentFontSizeDefault: "12pt",
   contentFontColorDefault: "#000000",
   contentMarginDefault: "20px",
   contentLineHeightDefault: "1.2em",
   contentColumnDefault: "120mm",
   contentPagingDirHorizontal: 1,
   contentPagingDirVertical: 2,
   navBackgroundColorDefault: "#fff8dc",
   navUnvisitedLinkColorDefault: "#0000EE",
   navVisitedLinkColorDefault: "#551A8B",
   navHoverLinkColorDefault: "#CC9966",
   navLinkFontSizeDefault: "9pt",
   navLinkFontFamilyDefault: "Arial",
   windowWidth:600,
   windowHeight:705,
   screenX:100,
   screenY:30,

   openingDocument: null,
   openingWindow: null,

   init: function()
   {
      if(window.arguments)
      {
         this.openingDocument = window.arguments[0];
         this.openingWindow = window.arguments[1];
      }

      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("extensions.epubreader.");

      var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
                    .getService(Components.interfaces.nsIXULAppInfo);

      var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
                           .getService(Components.interfaces.nsIVersionComparator);


      if(window.screen.availHeight - screenY < epubPrefs.windowHeight)
      {
         var height = window.screen.availHeight - screenY;
      }
      else
      {
         var height = epubPrefs.windowHeight;
      }

      window.resizeTo(epubPrefs.windowWidth, height);
      window.moveTo(epubPrefs.screenX, epubPrefs.screenY);

      var bgColorContent = pref.getCharPref("color.content.background");

      if(bgColorContent == "parent")
      {
         document.getElementById("contentBackgroundColorGroup").selectedIndex = 0;
         document.getElementById("contentBackgroundColorPicker").color = this.contentBackgroundColorDefault;
         document.getElementById("contentBackgroundColorPicker").disabled = true;
      }
      else
      {
         document.getElementById("contentBackgroundColorGroup").selectedIndex = 1;
         document.getElementById("contentBackgroundColorPicker").color = bgColorContent;
      }

      var fontFamilyMenulist = document.getElementById("contentFontFamilyMenulist");
      this.fillFontList(fontFamilyMenulist);

      var fontFamilyContent = pref.getCharPref("font.family.content");

      if(fontFamilyContent == "parent")
      {
         document.getElementById("contentFontFamilyGroup").selectedIndex = 0;
         fontFamilyMenulist.disabled = true;
      }
      else
      {
         document.getElementById("contentFontFamilyGroup").selectedIndex = 1;

         for(var i = 0; i < fontFamilyMenulist.itemCount; i++)
         {
            var item = fontFamilyMenulist.getItemAtIndex(i);

            if(item.label == fontFamilyContent)
            {
               fontFamilyMenulist.selectedIndex = i;
               break;
            }
         }
      }

      var fontSizeContent = pref.getCharPref("font.size.content");

      if(fontSizeContent == "parent")
      {
         document.getElementById("contentFontSizeGroup").selectedIndex = 0;
         document.getElementById("contentFontSizeTextBox").value = parseInt(this.contentFontSizeDefault);
         document.getElementById("contentFontSizeTextBox").disabled = true;
      }
      else
      {
         document.getElementById("contentFontSizeGroup").selectedIndex = 1;
         document.getElementById("contentFontSizeTextBox").value = parseInt(fontSizeContent);
      }

      var fontColorContent = pref.getCharPref("font.color.content");

      if(fontColorContent == "parent")
      {
         document.getElementById("contentFontColorGroup").selectedIndex = 0;
         document.getElementById("contentFontColorPicker").color = this.contentFontColorDefault;
         document.getElementById("contentFontColorPicker").disabled = true;
      }
      else
      {
         document.getElementById("contentFontColorGroup").selectedIndex = 1;
         document.getElementById("contentFontColorPicker").color = fontColorContent;
      }

      var paddingContent = pref.getCharPref("padding.content");

      if(paddingContent == "parent")
      {
         document.getElementById("contentMarginGroup").selectedIndex = 0;
         document.getElementById("contentMarginTextBox").value = parseInt(this.contentMarginDefault);
         document.getElementById("contentMarginTextBox").disabled = true;
      }
      else
      {
         document.getElementById("contentMarginGroup").selectedIndex = 1;
         document.getElementById("contentMarginTextBox").value = parseInt(paddingContent);
      }

      var lineHeightContent = pref.getCharPref("line_height.content");

      if(lineHeightContent == "normal")
      {
         document.getElementById("contentLineHeightGroup").selectedIndex = 0;
         document.getElementById("contentLineHeightTextBox").value = parseFloat(this.contentLineHeightDefault);
         document.getElementById("contentLineHeightTextBox").disabled = true;
      }
      else
      {
         document.getElementById("contentLineHeightGroup").selectedIndex = 1;
         document.getElementById("contentLineHeightTextBox").value = parseFloat(lineHeightContent);
      }

      var columnCountContent = pref.getCharPref("count.column.content");
      var columnWidthContent = pref.getCharPref("width.column.content");

      if(columnCountContent == "single")
      {
         document.getElementById("contentColumnGroup").selectedIndex = 0;
         document.getElementById("contentColumnTextBox").value = parseInt(this.contentColumnDefault);
         document.getElementById("contentColumnTextBox").disabled = true;
      }
      else
      {
         document.getElementById("contentColumnGroup").selectedIndex = 1;
         document.getElementById("contentColumnTextBox").value = parseInt(columnWidthContent);
      }

      if(versionChecker.compare(appInfo.platformVersion, "1.9.2") < 0)
      {
         document.getElementById("contentColumnAuto").disabled = true;
         document.getElementById("contentColumnTextBox").disabled = true;
      }

      var pagingDirContent = pref.getIntPref("paging_dir.content");

      if(pagingDirContent == epubPrefs.contentPagingDirHorizontal)
      {
         document.getElementById("contentPagingGroup").selectedIndex = 0;
      }
      else
      {
         document.getElementById("contentPagingGroup").selectedIndex = 1;
      }

      if(versionChecker.compare(appInfo.platformVersion, "1.9.2") < 0)
      {
         document.getElementById("contentPagingHorizontal").disabled = true;
      }

      epubPrefs.updateStyle();

      if(versionChecker.compare(appInfo.platformVersion, "1.9.2") < 0)
      {
         document.getElementById("contentStyleBook").disabled = true;
      }

      var bgColor = pref.getCharPref("color.nav.background");
      document.getElementById("navColorPicker").color = bgColor;

      document.getElementById("navColorPreviewBox").style.backgroundColor = bgColor;

      var unvisitedColor = pref.getCharPref("color.nav.link.unvisited");
      document.getElementById("navLinkUnvisitedColorPicker").color = unvisitedColor;

      var visitedColor = pref.getCharPref("color.nav.link.visited");
      document.getElementById("navLinkVisitedColorPicker").color = visitedColor;

      var hoverColor = pref.getCharPref("color.nav.link.hover");
      document.getElementById("navLinkHoverColorPicker").color = hoverColor;

      var size = pref.getCharPref("size.nav.link");
      document.getElementById("navLinkFontSizeTextBox").value = parseInt(size);

      var fontFamily = pref.getCharPref("font.nav.link");

      var fontFamilyMenulist = document.getElementById("navLinkFontFamilyMenulist");
      this.fillFontList(fontFamilyMenulist);

      for(var i = 0; i < fontFamilyMenulist.itemCount; i++)
      {
         var item = fontFamilyMenulist.getItemAtIndex(i);

         if(item.label == fontFamily)
         {
            fontFamilyMenulist.selectedIndex = i;
            break;
         }
      }

      document.getElementById("navColorPreviewLinkUnvisited").style.color = unvisitedColor;
      document.getElementById("navColorPreviewLinkUnvisited").style.fontSize = size;
      document.getElementById("navColorPreviewLinkUnvisited").style.fontFamily = fontFamily;
      document.getElementById("navColorPreviewLinkUnvisited").onmouseover = function(){this.style.color = hoverColor;}
      document.getElementById("navColorPreviewLinkUnvisited").onmouseout = function(){this.style.color = unvisitedColor;}

      document.getElementById("navColorPreviewLinkVisited").style.color = visitedColor;
      document.getElementById("navColorPreviewLinkVisited").style.fontSize = size;
      document.getElementById("navColorPreviewLinkVisited").style.fontFamily = fontFamily;
      document.getElementById("navColorPreviewLinkVisited").onmouseover = function(){this.style.color = hoverColor;}
      document.getElementById("navColorPreviewLinkVisited").onmouseout = function(){this.style.color = visitedColor;}

      var jsEnabled = pref.getBoolPref("js_enabled");
      document.getElementById("jsEnabled").checked = jsEnabled;

      var pluginsEnabled = pref.getBoolPref("plugins_enabled");
      document.getElementById("pluginsEnabled").checked = pluginsEnabled;

      var pagingClickEnabled = pref.getBoolPref("paging_click_enabled");
      document.getElementById("pagingClickEnabled").checked = pagingClickEnabled;
      
      epubPrefs.setCalibreCatalog(0);           
   },

   setCalibreCatalog: function(pos, data)
   {
      if(pos == 0)
      {
         pos++;
         Epubreader.getCatalogByName(epubPrefs.setCalibreCatalog, pos, "Calibre2Opds");
      }
      else if(pos == 1)
      {
         var catalog = data;
      
         if(catalog)
         {
            catalog = catalog[0];
            document.getElementById("calibreUrl").value = catalog['start'];
         }
      }
   },
   
   updatePagingColumns: function()
   {
      if(document.getElementById("contentStyleGroup").selectedIndex == 0)
      {
         document.getElementById("contentPagingGroup").selectedIndex = 0;
         document.getElementById("contentColumnGroup").selectedIndex = 1;
      }
      else
      {
         document.getElementById("contentPagingGroup").selectedIndex = 1;
         document.getElementById("contentColumnGroup").selectedIndex = 0;
      }
   },

   updateStyle: function()
   {
      var horizontal = document.getElementById("contentPagingHorizontal").selected;
      var auto = document.getElementById("contentColumnAuto").selected;

      if(horizontal == true && auto == true)
      {
         document.getElementById("contentStyleGroup").selectedIndex = 0;
      }
      else if(horizontal == false && auto == false)
      {
         document.getElementById("contentStyleGroup").selectedIndex = 1;
      }
      else
      {
         document.getElementById("contentStyleGroup").selectedIndex = -1;
      }
   },

   resetNavDefaults: function()
   {
      var bgColor = this.navBackgroundColorDefault;
      var unvisitedColor = this.navUnvisitedLinkColorDefault;
      var visitedColor = this.navVisitedLinkColorDefault;
      var hoverColor = this.navHoverLinkColorDefault;
      var size = this.navLinkFontSizeDefault;
      var fontFamily = this.navLinkFontFamilyDefault;

      document.getElementById("navColorPicker").color = bgColor;
      document.getElementById("navLinkUnvisitedColorPicker").color = unvisitedColor;
      document.getElementById("navLinkVisitedColorPicker").color = visitedColor;
      document.getElementById("navLinkHoverColorPicker").color = hoverColor;
      document.getElementById("navLinkFontSizeTextBox").value = parseInt(size);

      var fontFamilyMenulist = document.getElementById("navLinkFontFamilyMenulist");

      for(var i = 0; i < fontFamilyMenulist.itemCount; i++)
      {
         var item = fontFamilyMenulist.getItemAtIndex(i);

         if(item.label == fontFamily)
         {
            fontFamilyMenulist.selectedIndex = i;
            break;
         }
      }
   },

   updateNavPreview: function()
   {
      var bgColor = document.getElementById("navColorPicker").color;
      var unvisitedColor = document.getElementById("navLinkUnvisitedColorPicker").color;
      var visitedColor = document.getElementById("navLinkVisitedColorPicker").color;
      var hoverColor = document.getElementById("navLinkHoverColorPicker").color;
      var size = document.getElementById("navLinkFontSizeTextBox").value;

      var fontList = document.getElementById("navLinkFontFamilyMenulist");
      var item = fontList.getItemAtIndex(fontList.selectedIndex);
      var fontFamily = item.label;

      document.getElementById("navColorPreviewBox").style.backgroundColor = bgColor;

      document.getElementById("navColorPreviewLinkUnvisited").style.color = unvisitedColor;
      document.getElementById("navColorPreviewLinkUnvisited").style.fontSize = size + "pt";
      document.getElementById("navColorPreviewLinkUnvisited").style.fontFamily = fontFamily;
      document.getElementById("navColorPreviewLinkUnvisited").onmouseover = function(){this.style.color = hoverColor;}
      document.getElementById("navColorPreviewLinkUnvisited").onmouseout = function(){this.style.color = unvisitedColor;}

      document.getElementById("navColorPreviewLinkVisited").style.color = visitedColor;
      document.getElementById("navColorPreviewLinkVisited").style.fontSize = size + "pt";
      document.getElementById("navColorPreviewLinkVisited").style.fontFamily = fontFamily;
      document.getElementById("navColorPreviewLinkVisited").onmouseover = function(){this.style.color = hoverColor;}
      document.getElementById("navColorPreviewLinkVisited").onmouseout = function(){this.style.color = visitedColor;}
   },

   fillFontList: function(list)
   {
      var fontEnumerator = Components.classes["@mozilla.org/gfx/fontenumerator;1"]
                           .createInstance(Components.interfaces.nsIFontEnumerator);


      var fonts = fontEnumerator.EnumerateAllFonts({});

      for(var i = 0; i < fonts.length; i++)
      {
         list.appendItem(fonts[i]);
      }
   },

   save: function()
   {
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("extensions.epubreader.");

      if(document.getElementById("contentBackgroundColorAuthor").selected)
      {
         var color = "parent";
      }
      else
      {
         var color = document.getElementById("contentBackgroundColorPicker").color;
      }

      pref.setCharPref("color.content.background", color);

      if(document.getElementById("contentFontFamilyAuthor").selected)
      {
         var font = "parent";
      }
      else
      {
         var list = document.getElementById("contentFontFamilyMenulist");
         var item = list.getItemAtIndex(list.selectedIndex);

         if(item)
         {
            var font = item.label;
         }
         else
         {
            var font = "parent";
         }
      }

      pref.setCharPref("font.family.content", font);

      if(document.getElementById("contentFontSizeAuthor").selected)
      {
         var size = "parent";
      }
      else
      {
         var size = document.getElementById("contentFontSizeTextBox").value + "pt";
      }

      pref.setCharPref("font.size.content", size);

      if(document.getElementById("contentFontColorAuthor").selected)
      {
         var color = "parent";
      }
      else
      {
         var color = document.getElementById("contentFontColorPicker").color;
      }

      pref.setCharPref("font.color.content", color);

      if(document.getElementById("contentMarginAuthor").selected)
      {
         var margin = "parent";
         var padding = "parent";
      }
      else
      {
         var margin = "0px";
         var padding = document.getElementById("contentMarginTextBox").value + "px";
      }

      pref.setCharPref("margin.content", margin);
      pref.setCharPref("padding.content", padding);

      if(document.getElementById("contentLineHeightDefault").selected)
      {
         var lineHeight = "normal";
      }
      else
      {
         var lineHeight = document.getElementById("contentLineHeightTextBox").value + "em";
      }

      pref.setCharPref("line_height.content", lineHeight);

      if(document.getElementById("contentColumnSingle").selected)
      {
         var count = "single";
      }
      else
      {
         var count = "auto";

         var width = document.getElementById("contentColumnTextBox").value + "mm";
         pref.setCharPref("width.column.content", width);
      }

      pref.setCharPref("count.column.content", count);

      if(document.getElementById("contentPagingVertical").selected)
      {
         var dir = epubPrefs.contentPagingDirVertical;
      }
      else
      {
         var dir = epubPrefs.contentPagingDirHorizontal;
      }

      pref.setIntPref("paging_dir.content", dir);

      var color = document.getElementById("navColorPicker").color;
      pref.setCharPref("color.nav.background", color);

      var color = document.getElementById("navLinkUnvisitedColorPicker").color;
      pref.setCharPref("color.nav.link.unvisited", color);

      var color = document.getElementById("navLinkVisitedColorPicker").color;
      pref.setCharPref("color.nav.link.visited", color);

      var color = document.getElementById("navLinkHoverColorPicker").color;
      pref.setCharPref("color.nav.link.hover", color);

      var size = document.getElementById("navLinkFontSizeTextBox").value;
      pref.setCharPref("size.nav.link", size + "pt");

      var list = document.getElementById("navLinkFontFamilyMenulist");
      var item = list.getItemAtIndex(list.selectedIndex);

      if(item)
      {
         var font = item.label;
      }
      else
      {
         var font = "Arial";
      }

      pref.setCharPref("font.nav.link", font);

      var url = document.getElementById("calibreUrl").value;
      var catalog = [];
      catalog['name'] = "Calibre2Opds";
      catalog['start'] = url;
      catalog['search'] = "";
      catalog['language'] = "";
      catalog['code'] = "";
      Epubreader.storeCatalog(catalog);

      var jsEnabled = document.getElementById("jsEnabled").checked;
      pref.setBoolPref("js_enabled", jsEnabled);

      var pluginsEnabled = document.getElementById("pluginsEnabled").checked;
      pref.setBoolPref("plugins_enabled", pluginsEnabled);

      var pagingClickEnabled = document.getElementById("pagingClickEnabled").checked;
      pref.setBoolPref("paging_click_enabled", pagingClickEnabled);

      Epubreader.updateCSS();

      if(window.arguments)
      {
         this.openingWindow.utils.registerCSS(true);

         this.openingDocument.getElementById("nav_frame").contentWindow.location.reload();
         this.openingDocument.getElementById("content_frame").contentWindow.location.reload();
      }
   }
}