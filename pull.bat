@echo off
call setEnv.bat
set http_proxy=http://hottinth:DHimH.Mwnm.@proxy.gsdnet.ch:8080
set https_proxy=https://hottinth:DHimH.Mwnm.@proxy.gsdnet.ch:8080
set GIT_SSL_NO_VERIFY=true
rm -rf *~
rm -rf chapters\*~
@echo on
git pull 
pause