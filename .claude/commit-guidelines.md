# Commit Message Guidelines

## Format

```
<type>(<scope>): <description>
[optional body]
[optional footer]
```

## Types

- **feat**: New features or functionality
- **fix**: Bug fixes
- **refactor**: Code changes that neither fix bugs nor add features
- **docs**: Documentation updates
- **style**: Code formatting, missing semicolons (no functional changes)
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates
- **build**: Build system or external dependencies
- **ci**: CI/CD configuration changes

## Rules

- Use imperative mood ("add" not "added")
- No period at end of description
- Keep description under 50 chars when possible
- Body explains why, not what
- Reference issues in footer: "Fixes #123"
- Breaking changes: Add "!" or "BREAKING CHANGE:" footer

## Examples

```
feat(auth): add OAuth2 integration
fix(ui): resolve button alignment on mobile
docs: update API documentation
refactor(database): optimize query performance
style: fix indentation in user service
test: add unit tests for validation logic
chore: update dependencies to latest versions
```

## Scope Examples

Common development scopes:

- `(api)`: API endpoints and routes
- `(auth)`: Authentication and authorization
- `(ui)`: User interface components
- `(db)`: Database operations and schemas
- `(config)`: Configuration files and settings
- `(utils)`: Utility functions and helpers
- `(tests)`: Test files and testing utilities
- `(docs)`: Documentation files
- `(deps)`: Dependencies and package management
- `(scripts)`: Build scripts and automation
- `(security)`: Security-related changes
- `(performance)`: Performance optimizations