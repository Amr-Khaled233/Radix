import { z } from "zod";

// No runtime code generation: Zod's JIT probe (`new Function`) would trip the CSP (no 'unsafe-eval').
z.config({ jitless: true });

export { z };
