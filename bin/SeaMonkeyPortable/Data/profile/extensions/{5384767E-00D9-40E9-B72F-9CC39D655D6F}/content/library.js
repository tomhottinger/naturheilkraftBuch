Components.utils.import("chrome://epubreader/content/Epubreader.jsm");

var library =
{
   app: null,
   epubreader: null,

   sort_none: 0,
   sort_title: -1,
   sort_title_asc: 1,
   sort_title_desc: 2,
   sort_author: -2,
   sort_author_asc: 3,
   sort_author_desc: 4,
   sort_timestamp: -3,
   sort_timestamp_asc: 5,
   sort_timestamp_desc: 6,

   tag_library: -1,

   init: function()
   {
      var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
      library.app = appInfo.ID;

      library.epubreader = Epubreader;

      var sync = library.getProperty("sync");
      var exp = library.getProperty("export");
      var imp = library.getProperty("import");
      var text = sync + "/" + exp + "/" + imp;

      var synchronize = document.getElementById("synchronize");
      synchronize.setAttribute("title", text);

      var url = window.location.href;
      var matches = url.match(/.*\?tag_id=(.*)/);

      if(matches && matches[1] != library.tag_library)
      {
         var id = matches[1];
      }

      library.getEpubList(0, null, id);
   },

   getEpubList: function(pos, data, tag_id)
   {
      if(pos == 0)
      {
         pos++;
         library.epubreader.getEpubList(library.getEpubList, pos, tag_id);
      }
      else if(pos == 1)
      {
         var epub_list = data;
         epub_list = library.setText(epub_list);

         var list = document.getElementById("epub");
         list.innerHTML = epub_list;
      }
   },

   setText: function(list)
   {
      var title = library.getProperty("library.header.title");
      var author = library.getProperty("library.header.author");
      var added = library.getProperty("library.header.added");

      var tooltip_sort_title = library.getProperty("library.tooltip.sort_title");
      var tooltip_sort_author = library.getProperty("library.tooltip.sort_author");
      var tooltip_sort_added = library.getProperty("library.tooltip.sort_added");

      var tooltip_open = library.getProperty("library.tooltip.open");
      var tooltip_meta = library.getProperty("library.tooltip.meta");
      var tooltip_tag = library.getProperty("library.tooltip.tag");
      var tooltip_save = library.getProperty("library.tooltip.save");
      var tooltip_delete = library.getProperty("library.tooltip.delete");

      list = list.replace(/%title%/, title).replace(/%author%/, author).replace(/%added%/, added);
      list = list.replace(/%tooltip_sort_title%/, tooltip_sort_title).replace(/%tooltip_sort_author%/, tooltip_sort_author).replace(/%tooltip_sort_added%/, tooltip_sort_added);
      list = list.replace(/%tooltip_open%/g, tooltip_open).replace(/%tooltip_meta%/g, tooltip_meta).replace(/%tooltip_tag%/g, tooltip_tag).replace(/%tooltip_save%/g, tooltip_save).replace(/%tooltip_delete%/g, tooltip_delete);

      return list;
   },

   getProperty: function(name)
   {
      var bundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
                   .getService(Components.interfaces.nsIStringBundleService)
                   .createBundle("chrome://epubreader/locale/epubreader.properties");

      var property = bundle.GetStringFromName(name);

      return property;
   },

   deleteEpub: function(pos, data, id)
   {
      if(pos == 0)
      {
         pos++;
         library.epubreader.deleteEpub(library.deleteEpub, pos, id);
      }
      else if(pos == 1)
      {
         window.location.reload();
      }
   },

   deleteEpubs: function(pos, data, epubsDelete)
   {
      if(pos == 0)
      {
         var result = confirm("Really delete all checked eBooks?");

         if(result == true)
         {
            var epubsDelete = [];
            var inputs = document.getElementsByTagName("html:input");

            for(var i = 0; i < inputs.length; i++)
            {
               if(inputs[i].type == "checkbox" && inputs[i].checked == true)
               {
                  epubsDelete.push(inputs[i].name);
               }
            }

            if(epubsDelete.length > 0)
            {
               pos++;
               library.deleteEpubs(pos, null, epubsDelete);
            }
         }
      }
      else if(pos == 1)
      {
         var epub = epubsDelete.pop();

         if(epub)
         {
            pos++;
            library.epubreader.deleteEpub(library.deleteEpubs, pos, epub, epubsDelete);
         }
         // epub list is empty -> finalize
         else
         {
            library.deleteEpubs(3);
         }
      }
      // delete epub finished
      else if(pos == 2)
      {
         library.deleteEpubs(1, null, epubsDelete);
      }
      // all epubs deleted
      else if(pos == 3)
      {
         window.location.reload();
      }
   },

   showMetadata: function(pos, data, id)
   {
      const meta_title = 1;
      const meta_creator = 2;
      const meta_subject = 3;
      const meta_description = 4;
      const meta_publisher = 5;
      const meta_contributor = 6;
      const meta_date = 7;
      const meta_type = 8;
      const meta_format = 9;
      const meta_identifier = 10;
      const meta_source = 11;
      const meta_language = 12;
      const meta_relation = 13;
      const meta_coverage = 14;
      const meta_rights = 15;

      function get(meta, template)
      {
         var repeat_begin = "%repeat-begin%";
         var repeat_end = "%repeat-end%";
         var repeat = template.substring(template.search(new RegExp(repeat_begin)) + repeat_begin.length, template.search(new RegExp(repeat_end)));

         var direction = library.getProperty("lang.direction");

         var content = "";

         for(var i = 0; i < meta.length; i++)
         {
            var element = repeat;

            element = element.replace(/%name%/, getName(meta[i]['type']));
            element = element.replace(/%data%/, library.escapeHtml(meta[i]['data']));
            element = element.replace(/%direction%/g, direction);

            content = content + element;
         }

         template = template.replace(/%repeat-begin%(.|\s)*%no-data-end%/, content);
         return template;
      }

      function getNoData(message, template)
      {
         var no_data_begin = "%no-data-begin%";
         var no_data_end = "%no-data-end%";
         var no_data = template.substring(template.search(new RegExp(no_data_begin)) + no_data_begin.length, template.search(new RegExp(no_data_end)));

         var content = "";
         var element = no_data;

         element = element.replace(/%message%/, message);
         content = content + element;

         template = template.replace(/%repeat-begin%(.|\s)*%no-data-end%/, content);
         return template;
      }

      function getName(type)
      {
         var property = "";

         if(type == meta_title)
         {
            property = "title";
         }
         else if(type == meta_creator)
         {
            property = "creator";
         }
         else if(type == meta_subject)
         {
            property = "subject";
         }
         else if(type == meta_description)
         {
            property = "description";
         }
         else if(type == meta_publisher)
         {
            property = "publisher";
         }
         else if(type == meta_contributor)
         {
            property = "contributor";
         }
         else if(type == meta_date)
         {
            property = "date";
         }
         else if(type == meta_type)
         {
            property = "type";
         }
         else if(type == meta_format)
         {
            property = "format";
         }
         else if(type == meta_identifier)
         {
            property = "identifier";
         }
         else if(type == meta_source)
         {
            property = "source";
         }
         else if(type == meta_language)
         {
            property = "language";
         }
         else if(type == meta_relation)
         {
            property = "relation";
         }
         else if(type == meta_coverage)
         {
            property = "coverage";
         }
         else if(type == meta_rights)
         {
            property = "rights";
         }

         property = "library.meta." + property;
         var name = library.getProperty(property);

         return name;
      }

      function getRoleDesc(role)
      {
         var desc = "";

         if(role == "adp")
         {
            desc = "Adapter";
         }
         else if(role == "ann")
         {
            desc = "Annotator";
         }
         else if(role == "arr")
         {
            desc = "Arranger";
         }
         else if(role == "asn")
         {
            desc = "Associated name";
         }
         else if(role == "aut")
         {
            desc = "Author";
         }
         else if(role == "aqt")
         {
            desc = "Author in quotations or text extracts";
         }
         else if(role == "aft")
         {
            desc = "Author of afterword, colophon, etc.";
         }
         else if(role == "aui")
         {
            desc = "Author of introduction, etc. ";
         }
         else if(role == "ant")
         {
            desc = "Bibliographic antecedent";
         }
         else if(role == "bkp")
         {
            desc = "Book producer";
         }
         else if(role == "clb")
         {
            desc = "Collaborator";
         }
         else if(role == "cmm")
         {
            desc = "Commentator";
         }
         else if(role == "dsr")
         {
            desc = "Designer";
         }
         else if(role == "edt")
         {
            desc = "Editor";
         }
         else if(role == "ill")
         {
            desc = "Illustrator";
         }
         else if(role == "lyr")
         {
            desc = "Lyricist";
         }
         else if(role == "mdc")
         {
            desc = "Metadata contact";
         }
         else if(role == "mus")
         {
            desc = "Musician";
         }
         else if(role == "nrt")
         {
            desc = "Narrator";
         }
         else if(role == "oth")
         {
            desc = "Other";
         }
         else if(role == "pht")
         {
            desc = "Photographer";
         }
         else if(role == "prt")
         {
            desc = "Printer";
         }
         else if(role == "red")
         {
            desc = "Redactor";
         }
         else if(role == "rev")
         {
            desc = "Reviewer";
         }
         else if(role == "spn")
         {
            desc = "Sponsor";
         }
         else if(role == "ths")
         {
            desc = "Thesis advisor";
         }
         else if(role == "trc")
         {
            desc = "Transcriber";
         }
         else if(role == "trl")
         {
            desc = "Translator";
         }
         else
         {
            desc = role;
         }

         return desc;
      }

      function prepareData(meta)
      {
         var metaOut = [];
         var counter = 0;
         var subject = "";
         var contributor = "";

         for(var i = 0; i < meta.length; i++)
         {
            if(meta[i]['type'] == meta_subject)
            {
               if(subject.length > 0)
               {
                  subject = subject + ", ";
               }

               subject = subject + meta[i]['data'];
            }
            else if(meta[i]['type'] == meta_contributor)
            {
               if(contributor.length > 0)
               {
                  contributor = contributor + ", ";
               }

               contributor = contributor + meta[i]['data'];

               if(meta[i]['subtype'] != "")
               {
                  var role = getRoleDesc(meta[i]['subtype']);

                  contributor = contributor + " (" + role + ")";
               }
            }
            else
            {
               if(subject.length > 0)
               {
                  var metaSubject = [];
                  metaSubject['id'] = 0;
                  metaSubject['type'] = meta_subject;
                  metaSubject['subtype'] = "";
                  metaSubject['data'] = subject;

                  metaOut[counter] = metaSubject;
                  counter++;

                  subject = "";
               }
               else if(contributor.length > 0)
               {
                  var metaContributor = [];
                  metaContributor['id'] = 0;
                  metaContributor['type'] = meta_contributor;
                  metaContributor['subtype'] = "";
                  metaContributor['data'] = contributor;

                  metaOut[counter] = metaContributor;
                  counter++;

                  contributor = "";
               }

               var record = meta[i];

               if(record['subtype'] != "")
               {
                  record['data'] = record['data'] + " (" + record['subtype'] + ")";
               }

               metaOut[counter] = record;
               counter++;
            }
         }

         return metaOut;
      }

      if(pos == 0)
      {
         pos++;
         library.epubreader.getMetadata(library.showMetadata, pos, id);
      }
      else if(pos == 1)
      {
         var meta = data;

         var url = "chrome://epubreader/content/library_metadata_template.html";
         var template = library.epubreader.readURL(url);

         if(meta && meta.length > 0)
         {
            meta = prepareData(meta);
            var content = get(meta, template);
         }
         else
         {
            var message = library.getProperty("library.meta.no_data");
            var content = getNoData(message, template);
         }

         var table = document.getElementById("meta");

         table.innerHTML = content;
         table.style.display = "";
      }
   },

   closeMetadata: function()
   {
      var metaTable = document.getElementById("meta");
      metaTable.style.display = "none";
   },

   openEditTags: function(id)
   {
      window.openDialog("chrome://epubreader/content/library_book_tags.xul", "", "modal=yes,centerscreen=yes", id);

      var url = "about:epubcatalog";
      library.openUrl(url);
   },

   openEpub: function(id)
   {
      var baseUrl = "about:epubreader";
      var url = baseUrl + "?id=" + id;

      library.openUrl(url);
   },

   openSync: function()
   {
      var url = "chrome://epubreader/content/synchronize.html";

      library.openUrl(url);
   },

   openUrl: function(url)
   {
      const Cc = Components.classes;
      const Ci = Components.interfaces;

      var baseUrl = url.match(/([^?]*)/)[1];
      var regExp = new RegExp(baseUrl + ".*");

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

            if(unescape(currentBrowser.currentURI.spec).match(regExp))
            {
               currentBrowser.contentWindow.location.href = url;
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

   sort: function(sort)
   {
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService).getBranch("extensions.epubreader.");

      var sortPref = pref.getIntPref("library_sort");

      if(sort == library.sort_title)
      {
         if(sortPref == library.sort_title_asc)
         {
            sortPref = library.sort_title_desc;
         }
         else
         {
            sortPref = library.sort_title_asc;
         }
      }
      else if(sort == library.sort_author)
      {
         if(sortPref == library.sort_author_asc)
         {
            sortPref = library.sort_author_desc;
         }
         else
         {
            sortPref = library.sort_author_asc;
         }
      }
      else if(sort == library.sort_timestamp)
      {
         if(sortPref == library.sort_timestamp_asc)
         {
            sortPref = library.sort_timestamp_desc;
         }
         else
         {
            sortPref = library.sort_timestamp_asc;
         }
      }

      pref.setIntPref("library_sort", sortPref);
      window.location.reload();
   },

   toggleDeleteCheckboxes: function()
   {
      var toggle = document.getElementById("toggle");
      var inputs = document.getElementsByTagName("html:input");

      for(var i = 0; i < inputs.length; i++)
      {
         if(inputs[i].type == "checkbox")
         {
            inputs[i].checked = toggle.checked;
         }
      }
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

window.addEventListener("load", library.init, true);