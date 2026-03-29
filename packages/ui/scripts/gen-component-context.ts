/**
 * gen-component-context.ts
 *
 * Scans every .tsx file in src/components/ui/ and extracts:
 *   - exported component names
 *   - the HTML element each one extends (React.ComponentProps<"X">)
 *   - CVA variants with their options and defaults
 *   - own props with explicit default values
 *
 * Output: component-context.json  (next to this script)
 *
 * Run:
 *   pnpm tsx scripts/gen-component-context.ts
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { Project, SyntaxKind, ObjectLiteralExpression, Node } from 'ts-morph';
import { writeFileSync } from 'fs';
import { join, basename } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface VariantInfo {
  options: string[];
  default: string | null;
}

interface PropInfo {
  default: string | boolean | number | null;
  optional: boolean;
}

interface ComponentContext {
  file: string;
  extendsElement: string | null;  // "button", "input", "div", etc.
  variants: Record<string, VariantInfo>;
  ownProps: Record<string, PropInfo>;
  dataSlot: string | null;
  exports: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Pull a string literal value from a node, or null. */
const stringLit = (node: Node | undefined): string | null => {
  if (!node) return null;
  if (node.getKind() === SyntaxKind.StringLiteral) {
    return node.getText().replace(/^["']|["']$/g, '');
  }
  return null;
};

/** Extract { variants: {...}, defaultVariants: {...} } from a cva() call. */
const extractCva = (obj: ObjectLiteralExpression): {
  variants: Record<string, VariantInfo>;
} => {
  const variants: Record<string, VariantInfo> = {};

  const variantsProp = obj.getProperty('variants');
  const defaultsProp = obj.getProperty('defaultVariants');

  // Collect default values first
  const defaults: Record<string, string> = {};
  if (defaultsProp && Node.isPropertyAssignment(defaultsProp)) {
    const defaultsInit = defaultsProp.getInitializer();
    if (defaultsInit && Node.isObjectLiteralExpression(defaultsInit)) {
      for (const prop of defaultsInit.getProperties()) {
        if (Node.isPropertyAssignment(prop)) {
          const key = prop.getName();
          const val = stringLit(prop.getInitializer());
          if (val) defaults[key] = val;
        }
      }
    }
  }

  // Collect each variant and its options
  if (variantsProp && Node.isPropertyAssignment(variantsProp)) {
    const variantsInit = variantsProp.getInitializer();
    if (variantsInit && Node.isObjectLiteralExpression(variantsInit)) {
      for (const variantProp of variantsInit.getProperties()) {
        if (Node.isPropertyAssignment(variantProp)) {
          const variantName = variantProp.getName();
          const optionsObj = variantProp.getInitializer();
          if (optionsObj && Node.isObjectLiteralExpression(optionsObj)) {
            const options = optionsObj.getProperties()
              .filter(Node.isPropertyAssignment)
              .map(p => p.getName());
            variants[variantName] = {
              options,
              default: defaults[variantName] ?? null,
            };
          }
        }
      }
    }
  }

  return { variants };
};

/** Extract explicit props and defaults from a function's first destructured parameter. */
const extractProps = (
  paramText: string
): Record<string, PropInfo> => {
  // We parse the destructuring manually since the AST gives us the full parameter node
  const props: Record<string, PropInfo> = {};
  return props;
};

/** Get `data-slot` value from JSX in a function body. */
const extractDataSlot = (fnText: string): string | null => {
  const m = fnText.match(/data-slot=["']([^"']+)["']/);
  return m ? m[1] : null;
};

/** Extract `React.ComponentProps<"X">` element name from a type string. */
const extractElement = (typeText: string): string | null => {
  const m = typeText.match(/React\.ComponentProps<["']([^"']+)["']>/);
  return m ? m[1] : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

const project = new Project({
  tsConfigFilePath: join(__dirname, '..', 'tsconfig.json'),
  addFilesFromTsConfig: false,
});

const uiDir = join(__dirname, '..', 'src', 'components', 'ui');
project.addSourceFilesAtPaths(`${uiDir}/**/*.tsx`);

const output: Record<string, ComponentContext> = {};

for (const sourceFile of project.getSourceFiles()) {
  const fileName = basename(sourceFile.getFilePath(), '.tsx');

  // Skip barrel / utility files
  if (fileName === 'index' || fileName === 'utils') continue;

  // ── Collect CVA variants ────────────────────────────────────────────────
  let mergedVariants: Record<string, VariantInfo> = {};

  const cvaCallExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(call => {
      const expr = call.getExpression();
      return expr.getText() === 'cva';
    });

  for (const call of cvaCallExpressions) {
    const args = call.getArguments();
    if (args.length >= 2 && Node.isObjectLiteralExpression(args[1])) {
      const { variants } = extractCva(args[1] as ObjectLiteralExpression);
      mergedVariants = { ...mergedVariants, ...variants };
    }
  }

  // ── Find exported function components ──────────────────────────────────
  const exportedFunctions = [
    ...sourceFile.getFunctions().filter(f => f.isExported() || f.getName()?.match(/^[A-Z]/)),
    // Also check variable declarations (const Foo = ...) that are exported
  ];

  for (const fn of exportedFunctions) {
    const name = fn.getName();
    if (!name || !name.match(/^[A-Z]/)) continue;

    // ── Extract props from first parameter ──
    const params = fn.getParameters();
    const ownProps: Record<string, PropInfo> = {};
    let extendsElement: string | null = null;

    if (params.length > 0) {
      const firstParam = params[0];

      // Get extends element from type annotation
      const typeNode = firstParam.getTypeNode();
      if (typeNode) {
        extendsElement = extractElement(typeNode.getText());
      }

      // Extract destructured props with defaults
      const nameNode = firstParam.getNameNode();
      if (Node.isObjectBindingPattern(nameNode)) {
        for (const element of nameNode.getElements()) {
          const propName = element.getName();
          if (propName === 'className' || propName === 'props') continue; // skip spreads/className

          const initializer = element.getInitializer();
          let defaultVal: string | boolean | number | null = null;

          if (initializer) {
            const kind = initializer.getKind();
            if (kind === SyntaxKind.StringLiteral) {
              defaultVal = initializer.getText().replace(/^["']|["']$/g, '');
            } else if (kind === SyntaxKind.TrueKeyword) {
              defaultVal = true;
            } else if (kind === SyntaxKind.FalseKeyword) {
              defaultVal = false;
            } else if (kind === SyntaxKind.NumericLiteral) {
              defaultVal = Number(initializer.getText());
            } else {
              defaultVal = initializer.getText(); // raw expression string
            }
          }

          // Skip props already covered by CVA variants
          if (propName in mergedVariants) continue;

          ownProps[propName] = {
            default: defaultVal,
            optional: element.getDotDotDotToken() === undefined && defaultVal !== null,
          };
        }
      }
    }

    // ── data-slot ──
    const fnText = fn.getText();
    const dataSlot = extractDataSlot(fnText);

    // ── Exports from this file ──
    const exports = sourceFile.getExportedDeclarations().keys().toArray()
      .filter(k => !k.endsWith('Variants') && !k.endsWith('variants'));

    output[name] = {
      file: fileName,
      extendsElement,
      variants: mergedVariants,
      ownProps,
      dataSlot,
      exports: [...exports],
    };
  }

  // ── Handle files with only variable-declared components (arrow fns) ──
  if (Object.keys(output).filter(k => output[k].file === fileName).length === 0) {
    const varDecls = sourceFile.getVariableDeclarations()
      .filter(v => v.getName().match(/^[A-Z]/) && v.isExported());

    for (const decl of varDecls) {
      const name = decl.getName();
      const exports = sourceFile.getExportedDeclarations().keys().toArray()
        .filter(k => !k.endsWith('Variants'));
      output[name] = {
        file: fileName,
        extendsElement: null,
        variants: mergedVariants,
        ownProps: {},
        dataSlot: null,
        exports: [...exports],
      };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Write output
// ─────────────────────────────────────────────────────────────────────────────

const outPath = join(__dirname, 'component-context.json');
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`✓ Written to ${outPath}`);
console.log(`  ${Object.keys(output).length} components found`);

// Print a quick summary
for (const [name, ctx] of Object.entries(output)) {
  const variantSummary = Object.entries(ctx.variants)
    .map(([k, v]) => `${k}(${v.options.join('|')})`)
    .join(', ');
  const propSummary = Object.entries(ctx.ownProps)
    .map(([k, v]) => `${k}=${JSON.stringify(v.default)}`)
    .join(', ');

  const parts = [
    ctx.extendsElement ? `<${ctx.extendsElement}>` : null,
    variantSummary || null,
    propSummary || null,
  ].filter(Boolean);

  console.log(`  ${name.padEnd(24)} ${parts.join('  |  ')}`);
}
