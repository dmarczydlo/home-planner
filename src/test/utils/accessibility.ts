import { type AxeResults } from "axe-core";
import { type ReactElement } from "react";
import { render } from "./render";

/**
 * Runs accessibility checks on a rendered component
 * Note: Requires @axe-core/react to be installed
 * 
 * @param component - The component to test
 * @returns Promise that resolves to axe results
 */
export async function checkAccessibility(component: ReactElement): Promise<AxeResults> {
  const { container } = render(component);
  
  // Dynamic import to avoid requiring axe-core in all tests
  const axe = await import("axe-core");
  
  return new Promise((resolve, reject) => {
    axe.run(container, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

/**
 * Asserts that a component has no accessibility violations
 * Throws an error if violations are found
 */
export async function assertNoAccessibilityViolations(component: ReactElement): Promise<void> {
  const results = await checkAccessibility(component);
  
  if (results.violations.length > 0) {
    const violations = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map((n) => ({
        html: n.html,
        target: n.target,
      })),
    }));
    
    throw new Error(
      `Accessibility violations found:\n${JSON.stringify(violations, null, 2)}`
    );
  }
}
