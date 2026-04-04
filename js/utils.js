/**
 * Utility functions for the After Effects Scripts Portfolio
 */

/**
 * Debounce function to limit function calls
 */
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * Create element with attributes and content
 */
function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (/^on/i.test(key)) {
            console.warn(`createElement: blocked unsafe attribute "${key}"`);
        } else {
            element.setAttribute(key, value);
        }
    });

    if (content) {
        if (typeof content === 'string') {
            element.textContent = content;
        } else {
            element.appendChild(content);
        }
    }

    return element;
}

/**
 * Sanitize HTML content
 */
function sanitizeHTML(str) {
    if (str === null || str === undefined) return '';
    const temp = document.createElement('div');
    temp.textContent = String(str);
    return temp.innerHTML;
}

/**
 * Get URL parameters
 */
function getURLParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

/**
 * Set URL parameter without reload
 */
function setURLParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url);
}

/**
 * Remove URL parameter without reload
 */
function removeURLParam(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.pushState({}, '', url);
}

/**
 * Compare two semver strings numerically.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
function compareSemver(a, b) {
    const parse = v => String(v).split('.').map(n => parseInt(n, 10) || 0);
    const [aMaj, aMin, aPatch] = parse(a);
    const [bMaj, bMin, bPatch] = parse(b);
    return (aMaj - bMaj) || (aMin - bMin) || (aPatch - bPatch);
}

/**
 * Local storage helpers
 */
const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Failed to read from localStorage:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Failed to remove from localStorage:', e);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Failed to clear localStorage:', e);
            return false;
        }
    }
};

// Export utilities if in module environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce, createElement,
        sanitizeHTML, getURLParams, setURLParam, removeURLParam,
        storage, compareSemver
    };
}
