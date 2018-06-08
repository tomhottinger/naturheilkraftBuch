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

Components.utils.import("chrome://epubreader/content/Epubreader.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

var catalog =
{
   excerptUrl: null,
   items: null,
   selectedItem: null,
   selectedRow: null,
   currentPage: null,
   navPages: null,
   navPageNumber: null,
   navBackwards: null,
   navForwards: null,
   mode: null,
   catalogs: null,
   selectedCatalog: null,
   epubreader: null,
   pref: null,
   opdsLang: null,

   menu_private: -2,

   tag_library: -1,
   tag_add: -2,

   catalog_shop: "ef57c8cbcb29d1453265e807bf91afdf",

   mode_none: 0,
   mode_navigate_backwards: 1,
   mode_navigate_forwards: 2,
   mode_navigate_reload: 3,
   mode_details: 4,

   nav_backwards: 1,
   nav_forwards: 2,

   error_timeout: -1,
   error_no_connection: -2,
   error_other: -3,

   message_error: 1,
   message_info: 2,

   init: function()
   {
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("extensions.epubreader.");

      catalog.pref = pref;

      catalog.epubreader = Epubreader;
      catalog.epubreader.setCatalog(catalog);

      catalog.fillCatalogMenulist(0);
      catalog.mode = catalog.mode_none;

      var title = catalog.getProperty("catalog.title");
      document.title = title;

      var catalogTreeWidth = catalog.pref.getCharPref("width.catalog.tree");

      var catalogTree = document.getElementById("catalog_tree_box");
      catalogTree.width = catalogTreeWidth;

      var itemsFrame = document.getElementById("catalog_items_frame");
      itemsFrame.addEventListener("load", catalog.reloadItems, true);
   },

   fillCatalogMenulist: function(pos, data)
   {
      const xul_ns = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

      if(pos == 0)
      {
         pos++;
         catalog.epubreader.getCatalogs(catalog.fillCatalogMenulist, pos);
      }
      else if(pos == 1)
      {
         var catalogs = data;
         catalog.catalogs = catalog.check(catalogs);

         var catalogList = document.getElementById("catalog_menulist");
         var library = catalog.getProperty("catalog.library");

         var catalogListPrivate = document.getElementById("catalog_menulist_private");
         catalogListPrivate.setAttribute("label", library);
         catalogListPrivate.setAttribute("value", catalog.menu_private);

         var count = catalogList.itemCount;

         for(var i = count - 1; i > 1; i--)
         {
            catalogList.removeItemAt(i);
         }

         for(var i = 0; i < catalog.catalogs.length; i++)
         {
            if(catalog.catalogs[i]['code'] != catalog.catalog_shop)
            {
               var name = catalog.catalogs[i]['name'];
               var languageShort = catalog.catalogs[i]['language'];

               if(languageShort != "")
               {
                  var languageLong = catalog.getProperty("lang." + languageShort);
                  var desc = name + ", " + languageLong;
               }
               else
               {
                  var desc = name;
               }

               catalogList.appendItem(desc, i);
            }
         }

         catalog.selectCatalog(catalog.menu_private);
      }
   },

   selectCatalog: function(id)
   {
      if(!id || id == catalog.menu_private ||
         (id >= 0 && catalog.catalogs[id]['name'] == "Gutenberg.org"))
      {
         var tree = document.getElementById("catalog_tree");
         var list = document.getElementById("catalog_list");
         tree.setAttribute("hidden", "true");
         list.removeAttribute("hidden");

         var tag = catalog.pref.getIntPref("library_last_tag");
         var pageFrame = document.getElementById("catalog_page_frame");

         if(id >= 0 && catalog.catalogs[id]['name'] == "Gutenberg.org")
         {
            var location = catalog.catalogs[id]['start'];

            catalog.selectedCatalog = id;
            catalog.resetCatalogListLibrary();

            var list = document.getElementById("catalog_list");
            var start = catalog.getProperty("catalog.start");
            list.appendItem(start, 0);
         }
         else
         {
            var location = "chrome://epubreader/content/library.xul?tag_id=" + tag;

            catalog.selectedCatalog = catalog.menu_private;
            catalog.resetCatalogListLibrary();
            catalog.fillCatalogListLibrary(0);
         }

         var searchBox = document.getElementById("catalog_search_box");
         searchBox.setAttribute("hidden", "true");

         pageFrame.contentWindow.location = location;
         pageFrame.style.display = "inline";

         var itemsFrame = document.getElementById("catalog_items_frame");
         itemsFrame.style.display = "none";

         var navFrame = document.getElementById("catalog_nav_frame");
         navFrame.style.display = "none";
      }
      else if(id >= 0)
      {
         var url = catalog.catalogs[id]['start'];

         if(url)
         {
            var tree = document.getElementById("catalog_tree");
            var list = document.getElementById("catalog_list");
            list.setAttribute("hidden", "true");
            tree.removeAttribute("hidden");

            var pageFrame = document.getElementById("catalog_page_frame");
            pageFrame.style.display = "none";
            pageFrame.contentWindow.location = "about:blank";

            if(catalog.catalogs[id]['search'])
            {
               var searchBox = document.getElementById("catalog_search_box");
               var search = catalog.getProperty("catalog.search");
               searchBox.removeAttribute("hidden");
               searchBox.setAttribute("emptytext", search);
            }
            else
            {
               var searchBox = document.getElementById("catalog_search_box");
               searchBox.setAttribute("hidden", "true");
            }

            var navFrame = document.getElementById("catalog_nav_frame");
            navFrame.style.display = "none";

            catalog.selectedCatalog = id;

            catalog.setWaitStatus(true);
            catalog.selectedItem = null;
            catalog.selectedRow = null;
            catalog.resetCatalogList();
            catalog.resetItemList();

            catalog.getContent(url);
         }
         else
         {
            catalog.selectedCatalog = null;
         }
      }
   },

   fillCatalogList: function(content, selectedItem)
   {
      const xul_ns = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

      var children = document.createElementNS(xul_ns, "treechildren");
      var entries = content['data'];

      for(var i = 0; i < entries.length; i++)
      {
         var item = document.createElementNS(xul_ns, "treeitem");
         item.setAttribute("container", "true");

         var row = document.createElementNS(xul_ns, "treerow");

         var cell = document.createElementNS(xul_ns, "treecell");
         cell.setAttribute("label", entries[i]['title']);
         row.appendChild(cell);

         var cell = document.createElementNS(xul_ns, "treecell");
         cell.setAttribute("label", entries[i]['details']['data']);
         row.appendChild(cell);

         var cell = document.createElementNS(xul_ns, "treecell");
         cell.setAttribute("label", entries[i]['details']['type']);
         row.appendChild(cell);

         var cell = document.createElementNS(xul_ns, "treecell");
         cell.setAttribute("label", "false");
         row.appendChild(cell);

         item.appendChild(row);
         children.appendChild(item);
      }

      if(selectedItem)
      {
         selectedItem.appendChild(children);
      }
      else
      {
         var tree = document.getElementById("catalog_tree");

         catalog.resetCatalogList();
         tree.appendChild(children);
      }

      catalog.setWaitStatus(false);
   },

   fillCatalogListLibrary: function(pos, data)
   {
      var last = catalog.pref.getIntPref("library_last_tag");
      var list = document.getElementById("catalog_list");

      if(pos == 0)
      {
         pos++;
         catalog.epubreader.getTags(catalog.fillCatalogListLibrary, pos);
      }
      else if(pos == 1)
      {
         var entries = data;

         var library = catalog.getProperty("catalog.library");
         var itemLibrary = list.appendItem(library, catalog.tag_library);

         if(last == catalog.tag_library)
         {
            var itemLast = itemLibrary;
         }

         if(entries.length > 0)
         {
            var item = list.appendItem("---------------", "");
         }

         for(var i = 0; i < entries.length; i++)
         {
            var item = list.appendItem(entries[i].name + " (" + entries[i].book_count + ")", entries[i].id);

            if(!itemLast && entries[i].id == last)
            {
               var itemLast = item;
            }
         }

         var item = list.appendItem("---------------", "");

         var tag = catalog.getProperty("catalog.tag");
         var item = list.appendItem("+ " + tag, catalog.tag_add);
         item.style.fontSize = "9pt";
         item.style.color = "grey";

         if(!itemLast)
         {
            var itemLast = itemLibrary;
            catalog.pref.setIntPref("library_last_tag", catalog.tag_library);
         }

         list.focus();
         list.selectItem(itemLast);
      }
   },

   resetCatalogList: function()
   {
      var tree = document.getElementById("catalog_tree");
      var treeChildren = tree.getElementsByTagName("treechildren")[0];

      if(treeChildren)
      {
         tree.removeChild(treeChildren);
      }
   },

   resetCatalogListLibrary: function()
   {
      var list = document.getElementById("catalog_list");

      for(var i = list.getRowCount() - 1; i >= 0 ; i--)
      {
         list.removeItemAt(i);
      }
   },

   fillItemList: function(items, nav)
   {
      function get(items, shop, template)
      {
         var repeat_begin = "%repeat-begin%";
         var repeat_end = "%repeat-end%";
         var repeat = template.substring(template.search(new RegExp(repeat_begin)) + repeat_begin.length, template.search(new RegExp(repeat_end)));

         var separator_begin = "%separator-begin%";
         var separator_end = "%separator-end%";
         var separator = template.substring(template.search(new RegExp(separator_begin)) + separator_begin.length, template.search(new RegExp(separator_end)));

         var navigation_begin = "%navigation-begin%";
         var navigation_end = "%navigation-end%";
         var navigation = template.substring(template.search(new RegExp(navigation_begin)) + navigation_begin.length, template.search(new RegExp(navigation_end)));

         var excerpt = catalog.getProperty("catalog.excerpt");

         var content = "";

         for(var i = 0; i < items.length; i++)
         {
            var element = repeat;

            if(items[i]['author'])
            {
               var title = items[i]['title'] + " / " + items[i]['author'];
            }
            else
            {
               var title = items[i]['title'];
            }

            element = element.replace(/%title_author%/, catalog.escapeHtml(title));
            element = element.replace(/%id%/, i);

            if(items[i]['epub'])
            {
               var display = "inline";
            }
            else
            {
               var display = "none";
            }

            element = element.replace(/%epub_display%/, display);
            element = element.replace(/%epub%/, catalog.escapeHtml(items[i]['epub']));

            var shortened = false;
            var summary = items[i]['summary'];

            if(summary)
            {
               if(summary.length > 250)
               {
                  summary = summary.substr(0, 250);

                  var search = summary.search(/<[^>]*$/);

                  if(search != -1)
                  {
                     summary = summary.substr(0, search);
                  }

                  summary = summary + "...";
                  shortened = true;
               }
            }

            element = element.replace(/%summary%/, catalog.escapeHtml(summary));

            if(items[i]['thumbnail'])
            {
               element = element.replace(/%thumbnail%/, catalog.escapeHtml(items[i]['thumbnail']));
               var display = "inline";
            }
            else
            {
               var display = "none";
            }

            element = element.replace(/%thumbnail_display%/, display);

            if(shortened == false && !items[i]['cover'] && !items[i]['details'])
            {
               var display = "none";
            }
            else
            {
               var display = "inline";
            }

            element = element.replace(/%details_display%/, display);

            if(items[i]['buy'] && shop == true)
            {
               element = element.replace(/%buy_url%/, catalog.escapeHtml(items[i]['buy']));
               var display = "inline";
            }
            else
            {
               var display = "none";
            }

            element = element.replace(/%buy_display%/, display);

            if(items[i]['site'])
            {
               element = element.replace(/%site_url%/, catalog.escapeHtml(items[i]['site']));
               var display = "inline";
            }
            else
            {
               var display = "none";
            }

            element = element.replace(/%site_display%/, display);

            if(items[i]['excerpt'])
            {
               element = element.replace(/%excerpt_url%/, catalog.escapeHtml(items[i]['excerpt']));
               element = element.replace(/%excerpt_desc%/, excerpt);
               var display = "inline";
            }
            else
            {
               var display = "none";
            }

            element = element.replace(/%excerpt_display%/, display);

            content = content + element;

            if(i < items.length - 1)
            {
               content = content + separator;
            }
         }

         if(catalog.navBackwards || catalog.navForwards)
         {
            content = content + separator;

            var element = navigation;

            if(!catalog.navBackwards)
            {
               element = element.replace(/%nav_backwards_src%/, "chrome://epubreader/skin/nav_page_backwards_disabled.png");
            }
            else
            {
               element = element.replace(/%nav_backwards_src%/, "chrome://epubreader/skin/nav_page_backwards_enabled.png");
            }

            if(!catalog.navForwards)
            {
               element = element.replace(/%nav_forwards_src%/, "chrome://epubreader/skin/nav_page_forwards_disabled.png");
            }
            else
            {
               element = element.replace(/%nav_forwards_src%/, "chrome://epubreader/skin/nav_page_forwards_enabled.png");
            }

            content = content + element;
         }

         template = template.replace(/%repeat-begin%(.|\s)*%navigation-end%/, content);
         return template;
      }

      catalog.items = items;

      var url = "chrome://epubreader/content/catalog_items_template.html";
      var template = catalog.epubreader.readURL(url);
      var shop = catalog.checkShop();

      var content = get(items, shop, template);

      var catalogFrame = document.getElementById("catalog_items_frame");
      var table = catalogFrame.contentDocument.getElementById("catalog_table");

      table.innerHTML = content;

      var pageFrame = document.getElementById("catalog_page_frame");

      pageFrame.style.display = "none";
      pageFrame.contentWindow.location = "about:blank";
      catalogFrame.style.display = "";

      catalog.setWaitStatus(false);
   },

   resetItemList: function()
   {
      var frame = document.getElementById("catalog_items_frame");
      var table = frame.contentDocument.getElementById("catalog_table");
      table.innerHTML = "";
   },

   navigate: function(direction)
   {
      var url = null;

      if(direction == catalog.nav_backwards && catalog.navBackwards)
      {
         url = catalog.navBackwards;
         catalog.mode = catalog.mode_navigate_backwards;
      }
      else if(direction == catalog.nav_forwards && catalog.navForwards)
      {
         url = catalog.navForwards;
         catalog.mode = catalog.mode_navigate_forwards;
      }

      if(url)
      {
         catalog.resetItemList();

         var text = catalog.getProperty("catalog.loading");
         catalog.showMessageBox(text, catalog.message_info, false);
         catalog.showWaitCursor();

         catalog.getContent(url);
      }
   },

   search: function(query)
   {
      var url = catalog.catalogs[catalog.selectedCatalog]['search'];

      //url = url.replace(/[<>&]/g, " ");
      query = query.replace(/ /g, "+");
      url = url.replace(/%search%/, query);

      catalog.resetItemList();
      catalog.setWaitStatus(true);

      frame = document.getElementById("catalog_page_frame");
      frame.style.display = "none"
      frame.contentWindow.location = "about:blank";

      catalog.getContent(url);
   },

   showDetails: function(id)
   {
      if(catalog.items[id]['details'])
      {
         catalog.setWaitStatus(true);
         catalog.mode = catalog.mode_details;
         catalog.getContent(catalog.items[id]['details']);
      }
      else
      {
         catalog.getDetails(catalog.items[id]);
      }
   },

   getDetails: function(data)
   {
      function get(details, shop, template)
      {
         var repeat_begin = "%repeat-begin%";
         var repeat_end = "%repeat-end%";
         var repeat = template.substring(template.search(new RegExp(repeat_begin)) + repeat_begin.length, template.search(new RegExp(repeat_end)));

         var content = "";

         var element = repeat;

         if(details['author'])
         {
            var title = details['title'] + " / " + details['author'];
         }
         else
         {
            var title = details['title'];
         }

         element = element.replace(/%title_author%/, catalog.escapeHtml(title));
         element = element.replace(/%summary%/, catalog.escapeHtml(details['summary']));

         if(details['epub'])
         {
            display = "inline";
         }
         else
         {
            display = "none";
         }

         element = element.replace(/%epub_display%/, display);
         element = element.replace(/%epub%/, catalog.escapeHtml(details['epub']));

         if(details['cover'])
         {
            var display = "inline";
         }
         else
         {
            var display = "none";
         }

         element = element.replace(/%cover_display%/, display);
         element = element.replace(/%cover%/, catalog.escapeHtml(details['cover']));

         if(details['buy'] && shop == true)
         {
            display = "inline";
         }
         else
         {
            display = "none";
         }

         element = element.replace(/%buy_display%/, display);
         element = element.replace(/%buy_url%/, catalog.escapeHtml(details['buy']));

         if(details['excerpt'])
         {
            display = "inline";
         }
         else
         {
            display = "none";
         }

         var excerpt = catalog.getProperty("catalog.excerpt");

         element = element.replace(/%excerpt_display%/, display);
         element = element.replace(/%excerpt_url%/, catalog.escapeHtml(details['excerpt']));
         element = element.replace(/%excerpt_desc%/, excerpt);

         content = content + element;

         template = template.replace(/%repeat-begin%(.|\s)*%repeat-end%/, content);
         return template;
      }

      var url = "chrome://epubreader/content/catalog_item_details_template.html";
      var template = catalog.epubreader.readURL(url);
      var shop = catalog.checkShop();

      var content = get(data, shop, template);

      var frame = document.getElementById("catalog_item_details_frame");
      var table = frame.contentDocument.getElementById("catalog_item_details");
      table.innerHTML = content;

      frame.style.paddingLeft = "10px";
      frame.style.paddingTop = "5px";
      frame.style.display = "";

      catalog.setWaitStatus(false);
   },

   closeDetails: function()
   {
      var frame = document.getElementById("catalog_item_details_frame");
      frame.style.display = "none";
   },

   handleContent: function(content)
   {
      if(!content || !catalog.checkCalibre(content['id']))
      {
         if(catalog.selectedItem)
         {
            var tree = document.getElementById("catalog_tree");
            var loadedColumn = tree.treeBoxObject.columns.getNamedColumn("catalog_tree_col_loaded");

            tree.view.setCellText(catalog.selectedRow, loadedColumn, "true");
            catalog.selectedItem.setAttribute("container", "false");
         }

         catalog.showDefaultCursor();
         var text = catalog.getProperty("catalog.nodata");
         catalog.showMessageBox(text, catalog.message_info, true);
      }
      else
      {
         if(catalog.selectedItem)
         {
            var tree = document.getElementById("catalog_tree");

            try
            {
               var loadedColumn = tree.treeBoxObject.columns.getNamedColumn("catalog_tree_col_loaded");
               tree.view.setCellText(catalog.selectedRow, loadedColumn, "true");
            }
            catch(e)
            {
            }
         }

         catalog.opdsLang = content['lang'];

         if(content['type'] == "categories")
         {
            catalog.fillCatalogList(content, catalog.selectedItem);
         }
         else
         {
            if(catalog.mode == catalog.mode_details)
            {
               catalog.getDetails(content['data'][0]);
            }
            else
            {
               if(catalog.mode == catalog.mode_navigate_backwards)
               {
                  catalog.navPageNumber--;

                  if(catalog.navPageNumber == 0)
                  {
                     catalog.navBackwards = null;
                  }
                  else
                  {
                     catalog.navBackwards = catalog.navPages[catalog.navPageNumber - 1];
                  }
               }
               else if(catalog.mode == catalog.mode_navigate_forwards)
               {
                  catalog.navPageNumber++;
                  catalog.navBackwards = catalog.navPages[catalog.navPageNumber - 1];
               }
               else if(catalog.mode == catalog.mode_navigate_reload)
               {
                  if(catalog.navPageNumber > 0)
                  {
                     catalog.navBackwards = catalog.navPages[catalog.navPageNumber - 1];
                  }
               }

               catalog.navPages[catalog.navPageNumber] = catalog.currentPage;

               if(content['nav'] && content['nav']['forwards'])
               {
                  catalog.navForwards = content['nav']['forwards'];
               }
               else
               {
                  catalog.navForwards = null;
               }

               if(catalog.selectedItem)
               {
                  catalog.selectedItem.setAttribute("container", "false");
               }

               catalog.fillItemList(content['data'], content['nav']);
            }
         }
      }

      catalog.mode = catalog.mode_none;
      catalog.selectedItem = null;
      catalog.selectedRow = null;

      var searchBox = document.getElementById("catalog_search_box");
      searchBox.value = "";
   },

   handleSelection: function(row, items, type)
   {
      var tree = document.getElementById("catalog_tree");
      var item = tree.view.getItemAtIndex(row);
      var url = items;

      catalog.resetItemList();
      catalog.setWaitStatus(true);

      if(type == "items")
      {
         catalog.selectedItem = item;
         catalog.selectedRow = row;

         frame = document.getElementById("catalog_page_frame");
         frame.style.display = "none"
         frame.contentWindow.location = "about:blank";

         catalog.getContent(url);
      }
      else if(type == "page")
      {
         item.setAttribute("container", "false");
         catalog.loadPage(url);
      }
   },

   treeSelected: function(event)
   {
      var tree = document.getElementById("catalog_tree").treeBoxObject;
      var valueColumn = tree.columns.getNamedColumn("catalog_tree_col_value");
      var typeColumn = tree.columns.getNamedColumn("catalog_tree_col_type");
      var loadedColumn = tree.columns.getNamedColumn("catalog_tree_col_loaded");

      var row = tree.getRowAt(event.clientX, event.clientY);

      var loaded = tree.view.getCellText(row, loadedColumn);
      var type = tree.view.getCellText(row, typeColumn);
      var item = tree.view.getItemAtIndex(row);

      if((loaded != "true" ||
          item.getAttribute("container") == "false") ||
         (type == "page"))
      {
         var items = tree.view.getCellText(row, valueColumn);
         catalog.handleSelection(row, items, type);
      }
   },

   listSelected: function()
   {
      if(catalog.selectedCatalog == catalog.menu_private)
      {
         var list = document.getElementById("catalog_list");
         var item = list.getItemAtIndex(list.currentIndex);
         var id = item.value;

         if(id == catalog.tag_add)
         {
            catalog.pref.setIntPref("library_last_tag", catalog.tag_library);
            catalog.openTagDialog(false);
         }
         else if(id == catalog.tag_library || id > 0)
         {
            catalog.pref.setIntPref("library_last_tag", id);
            var pageFrame = document.getElementById("catalog_page_frame");
            pageFrame.contentWindow.location = "chrome://epubreader/content/library.xul?tag_id=" + id;
         }
      }
      else
      {
         var pageFrame = document.getElementById("catalog_page_frame");
         pageFrame.contentWindow.location = catalog.catalogs[catalog.selectedCatalog]['start'];
      }
   },

   getContent: function(url)
   {
      if(catalog.mode == catalog.mode_none)
      {
         catalog.navPageNumber = 0;
         catalog.navPages = [];
         catalog.navBackwards = null;
         catalog.navForwards = null;
      }

      catalog.currentPage = url;
      opdsreader.getContent(url);
   },

   handleError: function(type)
   {
      catalog.showDefaultCursor();
      catalog.mode = catalog.mode_none;

      var searchBox = document.getElementById("catalog_search_box");
      searchBox.value = "";

      if(type == catalog.error_timeout)
      {
         var text = catalog.getProperty("catalog.error.timeout");
      }
      else if(type == catalog.error_no_connection)
      {
         var text = catalog.getProperty("catalog.error.no_connection");
      }
      else
      {
         var text = catalog.getProperty("catalog.error.other");
      }

      catalog.showMessageBox(text, catalog.message_error, true);
   },

   setWaitStatus: function(set)
   {
      if(set == true)
      {
         catalog.showWaitCursor();
         var text = catalog.getProperty("catalog.loading");
         catalog.showMessageBox(text, catalog.message_info, false);
      }
      else
      {
         catalog.showDefaultCursor();
         catalog.closeMessageBox();
      }
   },

   showMessageBox: function(text, type, autoclose)
   {
      var box = document.getElementById("catalog_message_box");
      var table = document.getElementById("catalog_message_table");
      var message = document.getElementById("catalog_message_box_message");

      if(message.hasChildNodes())
      {
         var textNode = message.firstChild;
      }
      else
      {
         var textNode = document.createTextNode("");
         message.appendChild(textNode);
      }

      textNode.nodeValue = text;

      if(type == catalog.message_info)
      {
         table.setAttribute("class", "info");
      }
      else if(type == catalog.message_error)
      {
         table.setAttribute("class", "error");
      }

      var treeBox = document.getElementById("catalog_tree_box");
      var stack = document.getElementById("catalog_items_stack");
      var top = 70;
      var left = treeBox.clientWidth + stack.clientWidth/2 - 125;

      box.top = top;
      box.left = left;
      box.style.display = "";

      if(autoclose == true)
      {
         window.setTimeout(catalog.closeMessageBox, 3000);
      }
   },

   closeMessageBox: function()
   {
      var box = document.getElementById("catalog_message_box");
      box.style.display = "none";
   },

   showWaitCursor: function()
   {
      var catalog = document.getElementById("catalog");
      var items = document.getElementById("catalog_items_frame").contentDocument;
      var itemsHtml = items.getElementsByTagName("html")[0];
      var itemsTable = items.getElementById("catalog_table");

      catalog.style.cursor = "wait";
      itemsHtml.style.cursor = "wait";
      itemsTable.style.cursor = "wait";
   },

   showDefaultCursor: function()
   {
      var catalog = document.getElementById("catalog");
      var items = document.getElementById("catalog_items_frame").contentDocument;
      var itemsHtml = items.getElementsByTagName("html")[0];
      var itemsTable = items.getElementById("catalog_table");

      catalog.style.cursor = "default";
      itemsHtml.style.cursor = "default";
      itemsTable.style.cursor = "default";
   },

   loadPage: function(url)
   {
      catalog.showDefaultCursor();
      catalog.closeMessageBox();

      var pageFrame = document.getElementById("catalog_page_frame");
      pageFrame.contentWindow.location = url;
      pageFrame.style.display = "inline";
   },

   showBuy: function(url)
   {
      var pageFrame = document.getElementById("catalog_page_frame");

      pageFrame.style.display = "inline";
      pageFrame.contentWindow.location = url;

      if(catalog.checkShop())
      {
         var navFrame = document.getElementById("catalog_nav_frame");

         var shopping = navFrame.contentDocument.getElementById("shopping");
         var shoppingText = catalog.getProperty("catalog.shopping");
         shopping.innerHTML = shoppingText;

         var basket = navFrame.contentDocument.getElementById("basket");
         var basketText = catalog.getProperty("catalog.basket");
         basket.innerHTML = basketText;

         navFrame.style.display = "inline";
      }
   },

   showBasket: function()
   {
      var pageFrame = document.getElementById("catalog_page_frame");

      var url = catalog.catalogs[catalog.selectedCatalog]['start'];
      var baseUrl = "https" + url.substring(url.indexOf(":"), url.lastIndexOf("/") + 1);

      if(catalog.opdsLang == "en")
      {
         baseUrl = baseUrl + "en/";
      }

      pageFrame.contentWindow.location = baseUrl + "order.php";
      pageFrame.style.display = "inline";
   },

   showExcerpt: function(url)
   {
      catalog.excerptUrl = url;

      var pageFrame = document.getElementById("catalog_page_frame");
      pageFrame.addEventListener("load", catalog.loadExcerpt, true);

      pageFrame.style.display = "inline";
      pageFrame.contentWindow.location = "chrome://epubreader/content/excerpt.html";
   },

   loadExcerpt: function()
   {
      var pageFrame = document.getElementById("catalog_page_frame");

      pageFrame.removeEventListener("load", catalog.loadExcerpt, true);

      var excerptFrame = pageFrame.contentDocument.getElementById("excerpt_frame");
      excerptFrame.addEventListener("load", catalog.modifyExcerpt, true);
      excerptFrame.contentWindow.location = catalog.excerptUrl;

      catalog.excerptUrl = null;
   },

   modifyExcerpt: function()
   {
      var pageFrame = document.getElementById("catalog_page_frame");
      var excerptFrame = pageFrame.contentDocument.getElementById("excerpt_frame");
      excerptFrame.removeEventListener("load", catalog.modifyExcerpt, true);

      var doc = excerptFrame.contentDocument;
      doc.body.style.backgroundColor = "#ffffff";
      doc.body.style.fontFamily = "arial";
      doc.body.style.fontSize = "11pt";
      doc.body.style.color = "#777";
      doc.body.style.paddingLeft = "10px";
      doc.body.style.paddingRight = "10px";
   },

   close: function()
   {
      var pageFrame = document.getElementById("catalog_page_frame");
      pageFrame.style.display = "none";
      pageFrame.contentWindow.location = "about:blank";
   },

   openTagDialog: function(update)
   {
      var list = document.getElementById("catalog_list");
      var item = list.getItemAtIndex(list.currentIndex);

      window.openDialog("chrome://epubreader/content/library_tags.xul", "", "modal=yes,left=100,top=200", update, item.value, item.label);
      window.location.reload();
   },

   modifyTagMenu: function()
   {
      var list = document.getElementById("catalog_list");
      var item = list.getItemAtIndex(list.currentIndex);
      var id = item.value;

      var popup = document.getElementById("tag_popup");

      if(id > 0)
      {
         document.getElementById("tag_popup_change").hidden = false;
         document.getElementById("tag_popup_delete").hidden = false;
      }
      else
      {
         document.getElementById("tag_popup_change").hidden = true;
         document.getElementById("tag_popup_delete").hidden = true;
      }
   },

   deleteTag: function()
   {
      var list = document.getElementById("catalog_list");
      var item = list.getItemAtIndex(list.currentIndex);
      var id = item.value;

      if(id > 0)
      {
         var last = catalog.pref.getIntPref("library_last_tag");

         if(last == id)
         {
            catalog.pref.setIntPref("library_last_tag", catalog.tag_library);
         }

         catalog.epubreader.deleteTag(id);
         window.location.reload();
      }
   },

   getProperty: function(name)
   {
      var bundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
                   .getService(Components.interfaces.nsIStringBundleService)
                   .createBundle("chrome://epubreader/locale/epubreader.properties");

      var property = bundle.GetStringFromName(name);

      return property;
   },

   checkCalibre: function(id)
   {
      var catalogMenulist = document.getElementById("catalog_menulist");

      if(catalogMenulist.selectedItem.label == "Calibre2Opds")
      {
         if(!id || !id.match(/calibre.*/i))
         {
            return false;
         }
         else
         {
            return true;
         }
      }
      else
      {
         return true;
      }
   },

   checkShop: function()
   {
      var code = catalog.catalogs[catalog.selectedCatalog]['code'];

      if(code == catalog.catalog_shop)
      {
         var shop = true;
      }
      else
      {
         var shop = false;
      }

      return shop;
   },

   saveTreeWidth: function()
   {
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("extensions.epubreader.");

      var treeWidth = document.getElementById("catalog_tree_box").width;

      if(treeWidth > 0)
      {
         pref.setCharPref("width.catalog.tree", treeWidth + "px");
      }
   },

   getLocale: function()
   {
      try
      {
         var chromeRegService = Components.classes["@mozilla.org/chrome/chrome-registry;1"].getService();
         var xulChromeReg = chromeRegService.QueryInterface(Components.interfaces.nsIXULChromeRegistry);
         var toolkitChromeReg = chromeRegService.QueryInterface(Components.interfaces.nsIToolkitChromeRegistry);
         var locale = toolkitChromeReg.getSelectedLocale("epubreader");
      }
      catch(e)
      {
         var locale = "";
      }

      return locale;
   },

   reloadItems: function()
   {
      catalog.mode = catalog.mode_navigate_reload;
      catalog.getContent(catalog.currentPage);
   },

   showSite: function(url)
   {
      const Cc = Components.classes;
      const Ci = Components.interfaces;

      var found = false;
      var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
      var browserEnumerator = wm.getEnumerator("navigator:browser");

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

   check: function(catalogs)
   {
      function toHexString(charCode)
      {
         return ("0" + charCode.toString(16)).slice(-2);
      }

      var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                      .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);

      var ch = Components.classes["@mozilla.org/security/hash;1"]
               .createInstance(Components.interfaces.nsICryptoHash);

      var catalogsOut = [];
      var catalogsCounter = 0;

      for(var i = 0; i < catalogs.length; i++)
      {
         var string = catalogs[i]['start'] + catalogs[i]['search'] + "6sx4Al";

         converter.charset = "UTF-8";
         var result = {};
         var data = converter.convertToByteArray(string, result);

         ch.init(ch.MD5);
         ch.update(data, data.length);
         var hash = ch.finish(false);

         var hashString = "";
         
         for(var j = 0; j < hash.length; j++)
         {
            hashString = hashString + toHexString(hash.charCodeAt(j));
         }       

         if(hashString == catalogs[i]['code'] || catalogs[i]['name'] == "Calibre2Opds")
         {
            catalogsOut[catalogsCounter] = catalogs[i];
            catalogsCounter++;
         }
      }

      return catalogsOut;
   },

   escapeHtml: function(text)
   {
      if(text)
      {
         text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
         text = text.replace(/&lt;p&gt;/g, "<p>").replace(/&lt;\/p&gt;/g, "</p>").replace(/&lt;b&gt;/g, "<b>").replace(/&lt;\/b&gt;/g, "</b>").replace(/&lt;br\s*\/&gt;/g, "<br/>");
      }

      return text;
   }
}

window.addEventListener("load", catalog.init, true);