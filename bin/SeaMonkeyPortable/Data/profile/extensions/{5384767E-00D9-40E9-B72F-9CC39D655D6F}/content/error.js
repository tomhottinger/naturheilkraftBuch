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

var epubError =
{
   init: function()
   {
      var url = window.location.href;
      var parts = url.match(/.*?message=(.*)&exception=(.*)&direction=(.*)/);
      
      document.getElementById("message").innerHTML = decodeURIComponent(epubError.escapeHtml(parts[1]));
      document.getElementById("message").style.direction = epubError.escapeHtml(parts[3]);
      document.getElementById("exception").innerHTML = decodeURIComponent(epubError.escapeHtml(parts[2]));
   },

   escapeHtml: function(str)
   {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
   }
}

window.addEventListener("DOMContentLoaded", epubError.init, true);
