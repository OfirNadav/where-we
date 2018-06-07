Run the project
===============
- gulp
- run chrome from command line with the params --disable-web-security --user-data-dir 
- open browser in http://localhost:3000

Dev
------
u: 36934420
p: 1

Pre
------
u: 39931480
p: 1


dev: https://d24x2ri5nvrcys.cloudfront.net/
pre: https://d26rnbumo0q03.cloudfront.net/


Upload To Prod
================
-Run ```gulp dist --num 1.0 --env prod --upload true --lang v53 --sure```

-- num => version number (default: leave existing)
-- env => environment dev/pre/prod (default: dev)
-- upload => true to upload to AWS s3 (default: false)
-- lang => language file version (default: leave existing)
-- sure => required only for prod, true to allow prod upload (default: false), 
