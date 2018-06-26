# Call Monitor Tracking
Repository created to auto-update the call monitor tracking app.

## Environment
.env file sets the database locations. At a minimum the prodPath must be set - devPath can be default.

| Variable | Location |
|:----------:|:----------:|
| prodPath | Path for the databases in production environment |
| devPath  | Path for the databases in Dev environment |

## Start Scripts
| Script | Explanation |
|:------:|:-----------:|
| npm start | Start the app in production mode |
| npm run dev | Start the app in dev |
| npm run dist | compile a Windows exe |
| npm run release | compile a Windows exe and publish to github |

## Publishing to GitHub for Auto Updates
1. package.json must be updated with the repository and owner
2. Generate a GitHub access token by going to <https://github.com/settings/tokens/new>.  The access token should have the `repo` scope/permission.  Once you have the token, assign it to an environment variable
    * On macOS/linux:
      * export GH_TOKEN="<YOUR_TOKEN_HERE>"
    * On Windows, run in powershell:
      * [Environment]::SetEnvironmentVariable("GH_TOKEN","<YOUR_TOKEN_HERE>","User")
    * Make sure to restart IDE/Terminal to inherit latest env variable.
3. '''npm run release'''
4. Release the release on GitHub, editing the release and clicking "Publish release."
5. Download and install the app from your releases.
    * Unless you paid for a Microsoft Code Signing certificate, Windows Defender Smart Screen will probably block the app the first time.
6. Update the version in `package.json`, commit and push to GitHub.
7. Do steps 3 and 4 again.
8. Open the installed version of the app and see that it updates itself.