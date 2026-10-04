/**
 * Small, reusable JavaScript examples used by the CareDesk dashboard.
 * They are kept in one module so the capstone concepts are easy to review.
 */

// HOISTING: this call appears before the function declaration below. JavaScript
// moves the declaration into scope during creation of the execution context.
const hoistingExample = formatConceptLabel('doctor_appointment_system');

function formatConceptLabel(value) {
  return String(value).trim().replaceAll('_', ' ');
}

// CLOSURE: every tracker keeps its own private count after createTracker returns.
function createRequestTracker(initialCount = 0) {
  let count = initialCount;
  return function trackRequest() {
    count += 1;
    return count;
  };
}

// CALLBACK STYLE: retained to demonstrate how older callback APIs are wrapped.
function loadWithCallback(loader, callback) {
  loader((error, value) => callback(error, value));
}

// PROMISE STYLE: converts the callback contract to a Promise for async/await.
function callbackToPromise(loader) {
  return new Promise((resolve, reject) => {
    loadWithCallback(loader, (error, value) => {
      if (error) reject(error);
      else resolve(value);
    });
  });
}

// EVENT LOOP: synchronous work runs first, then Promise microtasks, then timers.
async function demonstrateEventLoop() {
  const order = ['synchronous'];
  const timer = new Promise(resolve => {
    setTimeout(() => {
      order.push('timer macrotask');
      resolve();
    }, 0);
  });
  Promise.resolve().then(() => order.push('promise microtask'));
  await timer;
  return order;
}

module.exports = {
  formatConceptLabel,
  hoistingExample,
  createRequestTracker,
  loadWithCallback,
  callbackToPromise,
  demonstrateEventLoop
};
