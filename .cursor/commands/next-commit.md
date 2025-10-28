# Next Commit Command

## Purpose

This command creates a new commit on the current branch with staged changes and pushes it to the remote repository.

## What it does

1. **Stage Changes**: Adds all modified and untracked files to the staging area
2. **Create New Commit**: Creates a new commit with the staged changes (using `git commit`)
3. **Push Updates**: Pushes the new commit to the current branch on the remote repository

## Usage

- Use this when you want to create a new commit with your current changes
- Ideal for adding new features, fixes, or improvements as separate commits
- Creates a clean commit history with each change as its own commit
- Safe to use on any branch, including shared branches

## Commands Executed

```bash
git add .
git commit -m "feat: descriptive commit message"
git push
```

## Commit Message Guidelines

- Use conventional commit format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Keep descriptions concise but descriptive
- Use present tense ("add feature" not "added feature")

## Safety Notes

- Creates a new commit without modifying existing history
- Safe to use on shared branches
- No force pushing required
- Maintains clean git history
