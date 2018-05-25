@echo off
call setEnv.bat


set ChapterDir="chapters"
del /Q build\*.*
rem set ChapterFiles
setlocal enabledelayedexpansion enableextensions
set LIST=
for %%x in (%ChapterDir%\*.md) do set LIST=!LIST! %%x
set LIST=%LIST:~1%
 
pandoc.exe -o build\book.epub  %LIST% --epub-cover-image=meta\cover.png --css=meta\TomsStyle.css --epub-metadata=meta\metadata.xml --table-of-contents


cd build
 rem ..\bin\kindlegen\kindlegen.exe book.epub
cd ..
 rem explorer build\book.epub
ebook-viewer.exe build\book.epub
   rem explorer build\booka2.epub
 pause