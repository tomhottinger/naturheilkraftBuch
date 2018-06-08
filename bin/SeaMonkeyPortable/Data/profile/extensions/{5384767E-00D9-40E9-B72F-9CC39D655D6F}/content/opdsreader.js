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

var opdsreader =
{
   timeout: null,
   channel: null,
   data: null,

   getContent: function(url)
   {
      if(!opdsreader.timeout)
      {
         var pref = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefService).getBranch("extensions.epubreader.");

         opdsreader.timeout = pref.getIntPref("catalog.load.timeout");
      }

      dump(url + "\n");

      try
      {
         opdsreader.channel = opdsreader.readData(url);

         var channel = opdsreader.channel;
         window.setTimeout(opdsreader.handleTimeout, opdsreader.timeout, channel);
      }
      catch(e)
      {
         dump("no connection\n");
         catalog.handleError(catalog.error_no_connection);
      }
   },

   onStreamComplete: function(aLoader, aContext, aStatus, aLength, aResult)
   {
      var utf8Converter = Components.classes["@mozilla.org/intl/utf8converterservice;1"]
                          .getService(Components.interfaces.nsIUTF8ConverterService);

      var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
                   .createInstance(Components.interfaces.nsIDOMParser);

      dump("status: " + aStatus + "\n");

      aContext.QueryInterface(Components.interfaces.nsIChannel);
      var uri = aContext.URI;

      if(!opdsreader.channel || aContext != opdsreader.channel)
      {
         return;
      }

      opdsreader.channel = null;

      if(aStatus > 0)
      {
         catalog.handleError(catalog.error_no_connection);
         return;
      }

      var raw = "";

      for(var i = 0; i < aLength; i++)
      {
         raw += String.fromCharCode(aResult[i]);
      }

      var data = utf8Converter.convertURISpecToUTF8(raw, "UTF-8");

      try
      {
         var feed = parser.parseFromString(data, "text/xml");
      }
      catch(e)
      {
         dump("error parsing xml\n");
         catalog.handleError(catalog.error_other);
         return;
      }

      var id = null;

      try
      {
         id = feed.getElementsByTagNameNS("*", "id")[0].childNodes[0].nodeValue;
      }
      catch(e)
      {
      }

      try
      {
         var lang = feed.documentElement.getAttribute("xml:lang");
      }
      catch(e)
      {
         var lang = "en";
      }

      var links = feed.getElementsByTagNameNS("*", "link");
      var previous = null;
      var next = null;

      for(var i = 0; i < links.length; i++)
      {
         var rel = links[i].getAttribute("rel");

         if(rel == "previous")
         {
            previous = links[i].getAttribute("href");

            if(!previous.match(/http:.*/))
            {
               previous = uri.resolve(previous);
            }
         }
         else if(rel == "next")
         {
            next = links[i].getAttribute("href");

            if(!next.match(/http:.*/))
            {
               next = uri.resolve(next);
            }
         }
      }

      var entries = feed.getElementsByTagNameNS("*", "entry");

      if(entries.length == 0)
      {
         dump("no entries\n");
         catalog.handleContent(null);
         return;
      }

      var contentType = opdsreader.getContentType(entries);

      var opds = [];
      var counter = 0;

      for(var i = 0; i < entries.length; i++)
      {
         var entry = [];
         var acq = false;

         if(contentType == "items")
         {
            entry['title'] = entries[i].getElementsByTagNameNS("*", "title")[0].textContent;

            try
            {
               entry['author'] = entries[i].getElementsByTagNameNS("*", "author")[0]
                                 .getElementsByTagNameNS("*", "name")[0].textContent;
            }
            catch(e)
            {
               entry['author'] = "";
            }

            try
            {
               entry['summary'] = entries[i].getElementsByTagNameNS("*", "content")[0].textContent;
            }
            catch(e)
            {
               try
               {
                  entry['summary'] = entries[i].getElementsByTagNameNS("*", "summary")[0].textContent;
               }
               catch(e)
               {
                  entry['summary'] = "";
               }
            }

            var links = entries[i].getElementsByTagNameNS("*", "link");

            for(var j = 0; j < links.length; j++)
            {
               var type = links[j].getAttribute("type");
               var href = links[j].getAttribute("href");

               if(!href.match(/http:.*/))
               {
                  href = uri.resolve(href);
               }

               var rel = links[j].getAttribute("rel");
               var title = links[j].getAttribute("title");

               if(rel == "http://opds-spec.org/acquisition/buy")
               {
                  entry['buy'] = href;
               }
               else if(type.match(/\s*application\/epub\+zip\s*/))
               {
                  entry['epub'] = href;
               }
               else if(rel == "alternate" && type.match(/application\/atom\+xml;type=entry.*/))
               {
                  entry['details'] = href;
               }
               else if(rel == "excerpt" && type.match(/text\/html/))
               {
                  entry['excerpt'] = href;
               }
               else if(rel == "http://opds-spec.org/cover" || rel == "http://opds-spec.org/image" || rel == "x-stanza-cover-image-thumbnail")
               {
                  entry['cover'] = href;
               }
               else if(rel == "http://opds-spec.org/thumbnail" || rel == "http://opds-spec.org/image/thumbnail")
               {
                  entry['thumbnail'] = href;
               }
               else if(rel == "site")
               {
                  entry['site'] = href;
               }
            }
         }
         else if(contentType == "categories")
         {
            try
            {
               entry['title'] = entries[i].getElementsByTagNameNS("*", "title")[0].textContent;
            }
            catch(e)
            {
               entry['title'] = "";
            }

            var items = null;
            var page = null;
            var links = entries[i].getElementsByTagNameNS("*", "link");

            for(var j = 0; j < links.length; j++)
            {
               var type = links[j].getAttribute("type");
               var href = links[j].getAttribute("href");

               if(!href.match(/http:.*/))
               {
                  href = uri.resolve(href);
               }

               if(type.match(/application\/atom\+xml.*/))
               {
                  items = href;
               }
               else if(type == "text/html" || type== "application/xhtml+xml")
               {
                  page = href;
               }
               else if(type == "image/png")
               {
                  entry['thumbnail'] = href;
               }

               if(type.match(/acquisition/))
               {
                  acq = true;
               }
            }

            if(items)
            {
               entry['details'] = [];
               entry['details']['type'] = "items";
               entry['details']['data'] = items;
            }
            else if(page)
            {
               entry['details'] = [];
               entry['details']['type'] = "page";
               entry['details']['data'] = page;
            }
         }

         if(acq == false)
         {
            opds[counter] = entry;
            counter++;
         }
      }

      var content = [];

      if(id)
      {
         content['id'] = id;
      }

      content['type'] = contentType;
      content['data'] = opds;
      content['lang'] = lang;

      if(previous || next)
      {
         content['nav'] = [];

         if(previous)
         {
            content['nav']['backwards'] = previous;
         }

         if(next)
         {
            content['nav']['forwards'] = next;
         }
      }

      catalog.handleContent(content);
   },

   getContentType: function(entries)
   {
      var test = null;

      if(entries.length == 1)
      {
         test = 0
      }
      else
      {
         test = entries.length - 2;
      }

      var contentType = null;

      if(!contentType)
      {
         var links = entries[test].getElementsByTagNameNS("*", "link");

         for(var i = 0; i < links.length; i++)
         {
            var type = links[i].getAttribute("type");

            if(type == "application/epub+zip")
            {
               contentType = "items";
               break;
            }
         }
      }

      if(!contentType)
      {
         var author = entries[test].getElementsByTagNameNS("*", "author");

         if(author.length > 0)
         {
            contentType = "items";
         }
      }

      if(!contentType)
      {
         contentType = "categories";
      }

      dump("type: " + contentType + "\n");
      return contentType;
   },

   readData: function(url)
   {
      var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                      .getService(Components.interfaces.nsIIOService);

      var streamLoader = Components.classes["@mozilla.org/network/stream-loader;1"]
                         .createInstance(Components.interfaces.nsIStreamLoader);

      var channel = ioService.newChannel(url, null, null);
      streamLoader.init(opdsreader);
      channel.asyncOpen(streamLoader, channel);

      return channel;
   },

   handleTimeout: function(channel)
   {
      //dump("handleTimeout. channel: " + channel + ", opdsreader.channel: " + opdsreader.channel + "\n");

      if(opdsreader.channel && channel == opdsreader.channel)
      {
         //dump("time is out\n");
         opdsreader.channel = null;
         catalog.handleError(catalog.error_timeout);
      }
   }
}