/*
 * JavaScript hoisting demonstration used by the React interface.
 * A function declaration is available before its position in the source file.
 */
export const hoistedApplicationName = createApplicationName('CareDesk', 'Healthcare');

// This declaration is intentionally below the call above.
export function createApplicationName(product, area) {
  return `${product} ${area}`;
}
