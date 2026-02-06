/**
 * Theme management with manual override
 * Shared across all pages: index.html, script pages, config-builder.html
 */

let currentTheme = 'auto'; // 'auto', 'light', 'dark'

function getEffectiveTheme() {
    if (currentTheme === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return currentTheme;
}

function applyTheme() {
    const effectiveTheme = getEffectiveTheme();
    const body = document.body;

    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark');

    // Apply theme class (CSS will override system detection)
    if (currentTheme !== 'auto') {
        body.classList.add(`theme-${effectiveTheme}`);
    }

    updateThemeIndicator(effectiveTheme);
}

function updateThemeIndicator(effectiveTheme = null) {
    const indicator = document.getElementById('theme-indicator');
    if (!indicator) return;

    if (!effectiveTheme) effectiveTheme = getEffectiveTheme();

    let icon, text;
    if (currentTheme === 'auto') {
        icon = effectiveTheme === 'dark' ? 'moon' : 'sun';
        text = effectiveTheme === 'dark' ? 'Auto (Dark)' : 'Auto (Light)';
    } else {
        icon = effectiveTheme === 'dark' ? 'moon' : 'sun';
        text = effectiveTheme === 'dark' ? 'Dark Mode' : 'Light Mode';
    }

    indicator.innerHTML = `<i data-lucide="${icon}" style="width: 14px; height: 14px;"></i> ${text}`;

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function toggleTheme() {
    // Cycle through: auto -> light -> dark -> auto
    if (currentTheme === 'auto') {
        currentTheme = 'light';
    } else if (currentTheme === 'light') {
        currentTheme = 'dark';
    } else {
        currentTheme = 'auto';
    }

    // Save preference
    localStorage.setItem('theme-preference', currentTheme);
    applyTheme();
}

function setupThemeDetection() {
    // Guard: Ensure DOM is ready before accessing elements
    if (document.readyState === 'loading') {
        console.warn('setupThemeDetection called before DOM ready - deferring setup');
        document.addEventListener('DOMContentLoaded', setupThemeDetection);
        return;
    }

    // Load saved preference
    const savedTheme = localStorage.getItem('theme-preference');
    if (savedTheme && ['auto', 'light', 'dark'].includes(savedTheme)) {
        currentTheme = savedTheme;
    }

    // Apply initial theme
    applyTheme();

    // Listen for system theme changes (only when in auto mode)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
        if (currentTheme === 'auto') {
            applyTheme();
        }
    });

    // Add click handler for theme toggle
    const indicator = document.getElementById('theme-indicator');
    if (indicator) {
        indicator.addEventListener('click', toggleTheme);
        indicator.addEventListener('mouseenter', () => {
            indicator.style.opacity = '1';
        });
        indicator.addEventListener('mouseleave', () => {
            indicator.style.opacity = '0.7';
        });
    }
}
