/*
 * JavaScript hoisting demonstration used by the React interface.
 * A function declaration is available before its position in the source file.
 */
export const hoistedApplicationName = demonstrateHoisting();

// This function is invoked above its declaration (function declaration hoisting).
export function createApplicationName(product, area) {
  return `${product} ${area}`;
}

export function demonstrateHoisting() {
  // `applicationName` is declared later with `var`, so its declaration is
  // hoisted to the top of this function and initially has value `undefined`.
  const valueBeforeVarAssignment = applicationName;
  var applicationName = createApplicationName('CareDesk', 'Healthcare');

  if (valueBeforeVarAssignment !== undefined) {
    throw new Error('The var declaration was not hoisted as expected.');
  }
  return applicationName;
}
