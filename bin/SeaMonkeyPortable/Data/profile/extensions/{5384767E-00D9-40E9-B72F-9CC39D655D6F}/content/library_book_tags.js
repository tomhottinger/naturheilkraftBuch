Components.utils.import("chrome://epubreader/content/Epubreader.jsm");

var bookTag =
{
   id: null,
   tags: null,

   init: function()
   {
      bookTag.id = window.arguments[0];
      bookTag.fillList(0);
   },

   fillList: function(pos, data)
   {
      if(pos == 0)
      {
         bookTag.tags = null;

         pos++;
         Epubreader.getTags(bookTag.fillList, pos);
      }
      else if(pos == 1)
      {
         bookTag.tags = data;
      
         if(bookTag.tags.length == 0)
         {
            var list = document.getElementById("tag_list");
            var message = bookTag.getProperty("book_tag.add_new_tags_hint");
            list.appendItem(message);
         }
         else
         {
            pos++;
            Epubreader.getBookTags(bookTag.fillList, pos, bookTag.id);
         }
      }
      else if(pos == 2)
      {
         var bookTags = data;
         var list = document.getElementById("tag_list");

         for(var i = 0; i < bookTag.tags.length; i++)
         {
            var item = list.appendItem(bookTag.tags[i].name, bookTag.tags[i].id);
            item.setAttribute("type", "checkbox");

            for(var j = 0; j < bookTags.length; j++)
            {
               if(bookTags[j].id == bookTag.tags[i].id)
               {
                  item.setAttribute("checked", "true");
               }
            }
         }
      }
   },

   save: function()
   {
      var list = document.getElementById("tag_list");
      var tags = [];

      for(var i = 0; i < list.itemCount; i++)
      {
         var item = list.getItemAtIndex(i);

         if(item.checked == true)
         {
            tags.push(item.value);
         }
      }

      Epubreader.storeBookTags(this.id, tags);
      return true;
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