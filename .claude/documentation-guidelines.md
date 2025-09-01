# Documentation Writing Guidelines

## Avoid Generic Filler Words

### ❌ Don’t Use These Meaningless Prefixes

- “Enhanced [feature]” 
- “Improved [functionality]”
- “Optimized [process]”
- “Better [implementation]”
- “Advanced [capability]”
- “Streamlined [workflow]”

### ✅ Instead, Be Specific About What Changed

👎 **Bad**: “Enhanced batch processing”
👍 **Good**: “Batch processing handles 500+ layers without UI blocking”

👎 **Bad**: “Improved error handling” 
👍 **Good**: “Script recovers from missing footage without crashing”

👎 **Bad**: “Optimized rendering pipeline”
👍 **Good**: “Renders process in background, UI remains responsive”

## Write Like You’re Explaining to Yourself in 6 Months

When you can’t remember why you made a decision, you need:
- **What** exactly does it do
- **Why** this approach over alternatives  
- **What** breaks if you change it
- **How** to test if it’s working

## Focus on Concrete Implementation Details

Instead of abstract descriptions, document:
- Specific file paths and naming patterns
- Exact layer types and property names
- Performance numbers and limits
- Error conditions and recovery behavior
- Dependencies on project structure

## Additional Anti-Patterns from Real Examples

### ❌ Avoid These Meaningless Phrases

- “Sophisticated multi-phase engine” → Just say “7-phase processing pipeline”
- “Revolutionary change” → Describe what actually changed
- “Breakthrough solution” → Explain the technical approach
- “Enhanced capabilities” → List specific new functions
- “Advanced pattern recognition” → Detail the algorithm used
- “Streamlined workflow” → Show before/after user steps

### ❌ Don’t Use Emotional/Marketing Language

- “Revolutionary”, “Breakthrough”, “Advanced”, “Sophisticated”
- “Seamless”, “Robust”, “Elegant”, “Powerful”
- “State-of-the-art”, “Cutting-edge”, “Next-generation”
- “Game-changing”, “Industry-leading”, “Best-in-class”

### ✅ Focus on Measurable Implementation Details

**Instead of**: “Enhanced pattern matching with sophisticated algorithms”
**Write**: “Token-based pattern matching replaces regex to eliminate over-matching (例: ‘这些X’ now matches exactly ‘这些材料’, not ‘这些材料实在’)”

**Instead of**: “Robust error handling system”  
**Write**: “Script wraps operations in try/catch with `app.beginUndoGroup()`, shows specific error messages, preserves project state on failure”

**Instead of**: “Streamlined user experience”
**Write**: “Removed engine selection toggle, reduced translation steps from 3 to 1, automatic proper noun dictionary detection”

## Document Implementation Impact, Not Features

### ❌ Feature Lists Without Context

```
- Multi-phase processing
- Advanced tokenization  
- Robust error handling
- Enhanced performance
```

### ✅ Implementation Impact Documentation

```
- 7-phase sequential processing prevents character-level fallback before phrase recognition
- Tokenization groups multi-character words (材料) as single semantic units for pattern matching
- try/catch with beginUndoGroup() preserves project state when footage replacement fails
- Single engine architecture eliminates 850 lines of legacy code, removes dual-engine complexity
```

## Document Breaking Changes and Dependencies

### ✅ Critical Architecture Dependencies

- “Requires standardized composition template hierarchy (SHOT_XXX_CC → Subject folders)”
- “Pattern variables restricted to proper nouns dictionary entries only”
- “Network path scanning assumes stable connection to project storage”

### ✅ Breaking Change Documentation

- “X variables now require proper nouns dictionary - pronouns support removed”
- “Token limits eliminated - removes 200-token processing restriction”
- “Legacy engine removed - all text processed through optimized pipeline”

## Document Architectural Patterns Over Individual Incidents

### ❌ Historical Bug Documentation

Individual bug fixes with limited reusability:

```markdown
### Buffer Overflow in Parser (Fixed)
- Input: "very long string here..."  
- Expected: Parse successfully
- Got: Segmentation fault
- Root Cause: Buffer allocated only 256 bytes
- Fix: Increased buffer to 1024 bytes
- Files Modified: parser.c:142
```

**Problems**: 
- Future developers must memorize each incident
- No architectural understanding
- Becomes outdated when implementation changes
- Limited applicability to new similar issues

### ✅ Architectural Pattern Documentation

Recurring failure patterns with systematic solutions:

```markdown
### Memory Allocation Boundary Violations

**Symptoms**: Segmentation faults; memory corruption; inconsistent crashes with variable input lengths.

**Root Cause**: Fixed-size buffers assume maximum input constraints without validation or dynamic allocation.

**Common Patterns**:
- **Static buffer assumptions**: 256-byte buffers with unchecked input
- **Missing boundary validation**: No length checking before buffer operations  
- **Stack allocation limits**: Large inputs exceed stack-allocated arrays

**Diagnostic Steps**:
- Check buffer allocation size vs maximum expected input
- Verify boundary checking before memory operations
- Test with inputs exceeding expected maximums

**Architectural Solution**: Dynamic allocation with explicit boundary validation and graceful degradation for oversized inputs.

**Prevention Strategy**: All input processing requires upfront size validation and appropriate allocation strategy.
```

**Benefits**:
- **Pattern Recognition**: Developers identify similar issues across codebase
- **Preventive Development**: Architectural understanding prevents introducing similar bugs
- **Systematic Debugging**: Structured approach works for all instances of this pattern  
- **Maintainable Knowledge**: Focus on stable architectural principles vs changing implementation details

### Transform Individual Fixes Into Patterns

**When consolidating bug documentation**, group by architectural similarity:

1. **Identify Common Root Causes**: Group fixes that share underlying architectural issues
2. **Extract Failure Patterns**: Document why this class of problems occurs
3. **Create Diagnostic Framework**: Provide systematic steps for identifying similar issues
4. **Focus on Prevention**: Explain architectural principles that prevent entire pattern classes

**Example Groupings**:
- **State Management Conflicts** → Race conditions, inconsistent updates, missing synchronization
- **Input Validation Failures** → Boundary violations, injection attacks, malformed data handling  
- **Resource Lifecycle Issues** → Memory leaks, file handle exhaustion, connection pooling problems
- **Configuration Dependency Violations** → Missing files, incorrect permissions, environment assumptions

## Document Debugging Methodologies Over Specific Solutions

### ❌ Solution-Focused Documentation

```markdown
### Login Timeout Issue (Fixed)
- Problem: Users couldn't log in after 30 seconds
- Solution: Increased timeout to 60 seconds  
- Files: auth.js:23
```

### ✅ Methodology-Focused Documentation  

````markdown
### Authentication Flow Debugging

**When Authentication Fails**: Systematic diagnosis framework for auth-related issues.

**Step 1: Isolate Failure Point**
```javascript
// Test each auth stage independently
console.log('1. Network connectivity:', await testConnection());
console.log('2. Credentials validation:', await validateCredentials(user, pass));
console.log('3. Token generation:', await generateToken(validatedUser));
console.log('4. Session persistence:', await storeSession(token));
```

**Step 2: Verify Dependencies**
- **Database connectivity**: Can auth service reach user database?
- **External services**: Are OAuth providers/LDAP servers responding?
- **Configuration**: Are timeout values, endpoints, secrets correctly set?

**Step 3: Trace Request Lifecycle**
- **Client → Server**: Network latency, request formatting, SSL handshake
- **Server Processing**: Database queries, validation logic, token generation
- **Server → Client**: Response formatting, cookie setting, redirect handling

**Common Failure Patterns**:
- **Timeout Issues**: Network latency exceeds configured timeouts
- **Credential Problems**: Hash mismatches, case sensitivity, encoding issues
- **State Management**: Session conflicts, concurrent login attempts, token expiration
- **Environment Issues**: Missing environment variables, firewall blocks, DNS resolution

**Diagnostic Questions**:
1. **Does it fail consistently?** Intermittent = network/timing, Consistent = logic/config
2. **Which auth method fails?** Isolates failure to specific provider or general auth flow
3. **What's the exact error timing?** Pre-submission, during processing, post-auth redirect
4. **Does it work in other environments?** Isolates environment-specific vs code issues
````

**Benefits**:
- **Reusable Framework**: Same methodology applies to all auth issues
- **Systematic Approach**: Prevents missing obvious diagnostic steps
- **Educational Value**: Teaches architectural understanding, not just solutions
- **Future-Proof**: Framework works regardless of specific implementation changes

## Test Your Documentation

If someone else (or future you) can’t use the documentation to:
- Understand the current implementation
- Safely modify the code  
- Debug issues when they arise
- Deploy updates correctly
- **Recognize and prevent similar architectural issues**
- **Apply systematic debugging methodologies to new problems**

Then it needs more specific detail and less marketing language.

## Documentation Quality Checklist

Before finalizing documentation, verify:

### Core Quality Standards
- [ ] No “enhanced/improved/optimized” without specific metrics
- [ ] Concrete examples for each major feature
- [ ] Dependencies and constraints clearly stated
- [ ] Breaking changes explicitly documented
- [ ] Implementation details over feature descriptions
- [ ] Measurable before/after comparisons where applicable

### Architectural Pattern Standards
- [ ] Individual bug fixes grouped into recurring patterns
- [ ] Root causes explained at architectural level
- [ ] Diagnostic steps work for entire pattern class, not just one instance
- [ ] Prevention strategies address underlying architectural issues
- [ ] Failure patterns documented with clear symptoms → cause → solution flow

### Debugging Methodology Standards  
- [ ] Systematic frameworks provided for complex debugging scenarios
- [ ] Step-by-step diagnostic approaches that work regardless of specific implementation
- [ ] Clear diagnostic questions with measurable yes/no answers
- [ ] Dependencies and failure points explicitly identified
- [ ] Methods focus on understanding, not just fixing

### Future-Proof Documentation Standards
- [ ] Content remains valuable when implementation details change
- [ ] Principles and patterns applicable to similar future issues
- [ ] Knowledge transfers architectural understanding, not just procedural steps
- [ ] Documentation teaches “why” things fail, not just “how” they were fixed
- [ ] Systematic approaches work for new team members without extensive context
