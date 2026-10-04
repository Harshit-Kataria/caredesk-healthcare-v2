/*
 * CareDesk frontend JavaScript hoisting demonstration.
 * This browser script is loaded before the React application in index.html.
 */
(function demonstrateJavaScriptHoisting(globalObject) {
  const report = {};

  // 1. FUNCTION DECLARATION HOISTING
  // The function works even though its declaration appears later in this scope.
  report.functionBeforeDeclaration = getHoistedMessage();

  // 2. VAR DECLARATION HOISTING
  // JavaScript behaves as if `var appointmentStatus` were declared at the top
  // of this function. Only the assignment remains here, so the first value is
  // undefined and the second value is "scheduled".
  report.varBeforeAssignment = appointmentStatus;
  var appointmentStatus = 'scheduled';
  report.varAfterAssignment = appointmentStatus;

  // 3. LET/CONST TEMPORAL DEAD ZONE
  // Unlike `var`, accessing a `let` binding before initialization throws a
  // ReferenceError. The error is caught so the application continues safely.
  try {
    report.letBeforeInitialization = appointmentOwner;
  } catch (error) {
    report.temporalDeadZone = error.name;
  }
  let appointmentOwner = 'practice administrator';
  report.letAfterInitialization = appointmentOwner;

  function getHoistedMessage() {
    return 'Function declarations are hoisted';
  }

  globalObject.CareDeskHoistingReport = Object.freeze(report);
})(window);
