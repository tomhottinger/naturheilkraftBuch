@echo off
::Get the current batch file's short path
for %%x in (%0) do set ThisBase=%%~dpsx
for %%x in (%ThisBase%) do set ThisBase=%%~dpsx

set PATH=%ThisBase%\bin\pandoc\;%ThisBase%\bin\wbin\;%ThisBase%\bin\PortableGit\cmd\;%ThisBase%\bin\kindlegen\;%ThisBase%\bin\SeaMonkeyPortable\;%ThisBase%\bin\Caret\;%PATH%

set http_proxy=http://hottinth:DHimH.Mwnm.@proxy.gsdnet.ch:8080
set https_proxy=https://hottinth:DHimH.Mwnm.@proxy.gsdnet.ch:8080
set GIT_SSL_NO_VERIFY=true