# Commit and Push Workflow

This workflow automates the process of creating a branch, committing changes, pushing to GitHub, and creating a pull request.

## Steps:

1. **Create a new branch**
   - Generate a descriptive branch name based on the changes made
   - Use format: `feature/description` or `fix/description` or `refactor/description`
   - Example: `feature/add-user-authentication` or `fix/login-validation-bug`

2. **Stage all changes**
   - Run `git add .` to stage all modified and new files
   - Verify staged changes with `git status`

3. **Commit changes**
   - Create a descriptive commit message following conventional commits format
   - Format: `type(scope): description`
   - Examples: `feat(auth): add user login functionality`, `fix(ui): resolve button alignment issue`
   - Run `git commit -m "your commit message"`

4. **Push branch to remote**
   - Push the new branch to the remote repository
   - Run `git push -u origin branch-name`

5. **Create Pull Request**
   - Use GitHub MCP server to create a PR
   - Set appropriate title and description
   - Add relevant labels if needed
   - Request reviews from appropriate team members

6. **Return to main branch**
   - Checkout to main branch: `git checkout main`
   - Pull latest changes: `git pull origin main`

## Notes:

- Always ensure tests pass before committing
- Write clear, descriptive commit messages
- Include relevant context in PR descriptions
- Follow the project's branching and naming conventions