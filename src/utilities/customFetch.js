const originalFetch = window.fetch;

const customFetch = (input, options = {}) => {
  try {
    // Try to construct a URL to check if it's absolute
    new URL(input);
    return originalFetch(input, options); // External URL
  } catch (e) {
    const correctedPath = input.startsWith("/") ? input : `/${input}`;
    const href = window.location.href;
    const correctedHref = href.endsWith("/")
      ? href.substring(0, href.length - 1)
      : href;
    const url = `${correctedHref}${correctedPath}`;
    return originalFetch(url, options); // Relative path
  }
};

// Override global fetch
window.fetch = customFetch;
