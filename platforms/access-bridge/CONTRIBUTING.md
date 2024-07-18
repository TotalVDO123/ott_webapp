## Code Style

The Passport Bridge uses ESLint to enforce code style.

If you are using an IDE such as IntelliJ, you can also [enable ESLint automatically](https://www.jetbrains.com/help/idea/eslint.html#ws_js_eslint_automatic_configuration).

## Development Setup

**Husky Pre-commit Git Hook**
This repository uses Husky tools for adding pre-commit to Git hooks. Husky removes the manual part of copying pre-commit scripts to .git/hooks. The pre-commit should automatically run after running npm install. When you commit changes to this repository, it will run the JW Player [internal library](https://github.com/jwplayer/frontend-tools) for formatting TypeScript. If the tool modify the files that were staged for commits, the commit action will be aborted. The changes will be not be staged for commits.

To modify pre-commit commands, go to ./husky/pre-commit and modify the commands there. You can enable or disable the pre-commit workflow by commenting out the commands.

Example Workflow for pre-commit

1. Stage and commit changes
   ```
   git add example.ts
   git commit "example message"
   ```
2. Pre-commit runs before committing the changes. Linting tools makes changes and aborts commits. If the user makes changes to a file that has been staged for commit, pre-commit will exit. Developer will need to either stage those changes or stash it away for later. Example response provided below.
   ```log
   <filename1>: needs update
   <filename2>: needs update
   husky - pre-commit hook exited with code 1 (error)
   ```
3. Investigate format changes. It will be highlighted in red.
   ```
   git status
   git diff example.ts
   ```
4. Add changes and commit
   ```
   git add example.ts
   git commit "example message"
   ```
