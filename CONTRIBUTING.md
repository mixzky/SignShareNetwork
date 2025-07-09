# Contributing to SignShareNetwork

Thank you for your interest in contributing to SignShareNetwork! This document provides guidelines and instructions for contributing to the project.

## 🎯 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it before contributing.

- Be respectful and inclusive
- Focus on constructive feedback
- Maintain professionalism
- Report inappropriate behavior

## 🚀 Getting Started

1. **Fork the Repository**
   - Click the 'Fork' button on GitHub
   - Clone your fork locally
   ```bash
   git clone https://github.com/mixzky/SignShareNetwork.git
   cd SignShareNetwork
   ```

2. **Set Up Development Environment**
   - Install dependencies
   ```bash
   npm install
   ```
   - Set up environment variables (see README.md)
   - Start the development server
   ```bash
   npm run dev
   ```

## 🔄 Development Workflow

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
   
   Branch naming conventions:
   - `feature/` - for new features
   - `fix/` - for bug fixes
   - `docs/` - for documentation
   - `test/` - for test improvements
   - `refactor/` - for code refactoring

2. **Make Changes**
   - Write clean, maintainable code
   - Follow the existing code style
   - Add comments where necessary
   - Update documentation if needed

3. **Testing**
   - Add tests for new features
   - Ensure all tests pass
   ```bash
   npm run tes
   ```
   - Run E2E tests
   ```bash
   npm run test:e2e
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "type: brief description"
   ```
   
   Commit message conventions:
   - `feat:` - new feature
   - `fix:` - bug fix
   - `docs:` - documentation changes
   - `test:` - adding or updating tests
   - `style:` - code style changes
   - `refactor:` - code refactoring
   - `perf:` - performance improvements
   - `chore:` - maintenance tasks

5. **Push Changes**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to GitHub and create a new Pull Request
   - Fill in the PR template
   - Link relevant issues
   - Request review from maintainers

## 📝 Pull Request Guidelines

1. **PR Title**
   - Clear and descriptive
   - Start with type (e.g., "feat:", "fix:")
   - Reference issue number if applicable

2. **PR Description**
   - Explain the changes made
   - List any breaking changes
   - Include screenshots for UI changes
   - Add steps to test the changes

3. **Code Quality**
   - Follow TypeScript best practices
   - Maintain consistent code style
   - Keep changes focused and minimal
   - Add necessary comments and documentation

4. **Testing**
   - Include relevant tests
   - Ensure all tests pass
   - Test edge cases
   - Verify browser compatibility

## 🧪 Testing Guidelines

1. **Unit Tests**
   - Write tests for new functionality
   - Use meaningful test descriptions
   - Follow AAA pattern (Arrange, Act, Assert)
   - Mock external dependencies

2. **E2E Tests**
   - Add E2E tests for critical user flows
   - Test across different browsers
   - Include mobile responsive testing
   - Document test scenarios

## 📚 Documentation

1. **Code Documentation**
   - Add JSDoc comments for functions
   - Document complex algorithms
   - Include usage examples
   - Update type definitions

2. **Component Documentation**
   - Document props and their types
   - Include usage examples
   - Document any side effects
   - Add accessibility notes

3. **README Updates**
   - Keep installation steps current
   - Document new features
   - Update troubleshooting guide
   - Maintain changelog

## 🐛 Bug Reports

When reporting bugs:

1. **Search Existing Issues**
   - Check if the bug has already been reported
   - Look for workarounds in closed issues

2. **Provide Information**
   - Clear bug description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Screenshots/videos if applicable

3. **Create Minimal Example**
   - Isolate the problem
   - Remove unnecessary code
   - Share reproduction steps

## 💡 Feature Requests

When suggesting features:

1. **Check Existing Requests**
   - Search for similar suggestions
   - Look for related discussions

2. **Provide Details**
   - Clear feature description
   - Use cases and benefits
   - Implementation suggestions
   - Potential challenges

## 🔧 Development Setup Tips

1. **Environment Setup**
   - Use recommended VS Code extensions
   - Configure ESLint and Prettier
   - Set up Git hooks
   - Configure debugging tools

2. **Database Development**
   - Use Supabase local development
   - Follow migration practices
   - Test database changes locally

3. **AI Integration**
   - Set up local AI testing
   - Use mock responses in tests
   - Document API changes

Thank you for contributing to SignShareNetwork! 🎉 
