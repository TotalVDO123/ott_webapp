export function debounce<T extends (...args: any[]) => void>(callback: T, wait = 200) {
  let timeout: NodeJS.Timeout | null;
  const callable = (...args: unknown[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), wait);
  };
  return callable;
}

/**
 * Parse hex color and return the RGB colors
 * @param color
 * @return {{r: number, b: number, g: number}|undefined}
 */
export function hexToRgb(color: string) {
  if (color.indexOf('#') === 0) {
    color = color.slice(1);
  }

  // convert 3-digit hex to 6-digits.
  if (color.length === 3) {
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
  }

  if (color.length !== 6) {
    return undefined;
  }

  return {
    r: parseInt(color.slice(0, 2), 16),
    g: parseInt(color.slice(2, 4), 16),
    b: parseInt(color.slice(4, 6), 16),
  };
}

/**
 * Get the contrast color based on the given color
 * @param {string} color Hex or RGBA color string
 * @link {https://stackoverflow.com/a/35970186/1790728}
 * @return {string}
 */
export function calculateContrastColor(color: string) {
  const rgb = hexToRgb(color);

  if (!rgb) {
    return '';
  }

  // http://stackoverflow.com/a/3943023/112731
  return rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114 > 186 ? '#000000' : '#FFFFFF';
}

// NODE_ENV_COMPILE_CONST is defined at compile time using the webpack define plugin.
// NODE_ENV_COMPILE_CONST is undefined when running the snowpack dev server, so allow test code in that case
export const isDevCompileTimeConstant = typeof NODE_ENV_COMPILE_CONST === 'undefined' || NODE_ENV_COMPILE_CONST !== 'production';
