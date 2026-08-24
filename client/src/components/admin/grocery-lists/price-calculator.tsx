import { useMemo, useState } from "react";
import { Calculator, Delete } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// A small, safe arithmetic evaluator for the four operators with the usual
// precedence (× ÷ before + −). Deliberately NOT eval() — input is limited to
// digits and these operators, and this parser handles them directly.
function evaluate(expr: string): number | null {
  const tokens = expr.match(/(\d+\.?\d*|[+\-×÷])/g);
  if (!tokens || !tokens.length) return null;

  const parsed: (number | string)[] = tokens.map((t) =>
    /[+\-×÷]/.test(t) ? t : Number(t),
  );

  // First pass: resolve × and ÷ left to right.
  const afterMulDiv: (number | string)[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const cur = parsed[i];
    if (cur === "×" || cur === "÷") {
      const prev = afterMulDiv.pop();
      const next = parsed[i + 1];
      if (typeof prev !== "number" || typeof next !== "number") return null;
      if (cur === "÷" && next === 0) return null;
      afterMulDiv.push(cur === "×" ? prev * next : prev / next);
      i++; // consumed `next`
    } else {
      afterMulDiv.push(cur);
    }
  }

  // Second pass: resolve + and −.
  let result = typeof afterMulDiv[0] === "number" ? afterMulDiv[0] : NaN;
  for (let i = 1; i < afterMulDiv.length; i += 2) {
    const op = afterMulDiv[i];
    const val = afterMulDiv[i + 1];
    if (typeof val !== "number") return null;
    if (op === "+") result += val;
    else if (op === "-") result -= val;
    else return null;
  }

  if (!Number.isFinite(result)) return null;
  return result;
}

// Round to at most 2 decimals and drop trailing zeros → clean price string.
function formatResult(value: number): string {
  return String(Math.round(value * 100) / 100);
}

// If the quantity begins with a number (e.g. "9", "2 kg"), seed the calculator
// with "9×" so the shopkeeper only types the unit price. Their exact example:
// 9 items at ₹30 → opens as "9×", type 30 → 270.
function leadingNumber(quantity?: string): string {
  const match = (quantity ?? "").trim().match(/^(\d+\.?\d*)/);
  return match ? match[1] : "";
}

type Key = { label: string; value: string; op?: boolean; span?: boolean };

// 4-column pad. "0" spans two cells so the last row stays aligned.
const PAD: Key[] = [
  { label: "7", value: "7" },
  { label: "8", value: "8" },
  { label: "9", value: "9" },
  { label: "÷", value: "÷", op: true },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
  { label: "6", value: "6" },
  { label: "×", value: "×", op: true },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "−", value: "-", op: true },
  { label: "0", value: "0", span: true },
  { label: ".", value: "." },
  { label: "+", value: "+", op: true },
];

type PriceCalculatorProps = {
  quantity?: string;
  onResult: (value: string) => void;
};

function PriceCalculator({ quantity, onResult }: PriceCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [expr, setExpr] = useState("");

  const result = useMemo(() => evaluate(expr), [expr]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      const seed = leadingNumber(quantity);
      setExpr(seed ? `${seed}×` : "");
    }
  }

  function press(key: string) {
    setExpr((prev) => {
      const isOp = /[+\-×÷]/.test(key);
      if (isOp) {
        if (!prev) return prev; // no leading operator
        // replace a trailing operator instead of stacking two
        if (/[+\-×÷]$/.test(prev)) return prev.slice(0, -1) + key;
        return prev + key;
      }
      if (key === ".") {
        // only one dot per number segment
        const segment = prev.split(/[+\-×÷]/).pop() ?? "";
        if (segment.includes(".")) return prev;
      }
      return prev + key;
    });
  }

  function insert() {
    if (result == null) return;
    onResult(formatResult(result));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          title="Calculator"
          aria-label="Open calculator"
        >
          <Calculator className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        {/* Display: the expression on top, the live result below */}
        <div className="mb-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-right">
          <div className="min-h-4 truncate text-xs text-muted-foreground">
            {expr || "0"}
          </div>
          <div className="truncate text-lg font-semibold text-foreground">
            {result == null ? "—" : formatResult(result)}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {/* Controls row: clear + backspace */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="col-span-2 h-9"
            onClick={() => setExpr("")}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="col-span-2 h-9"
            onClick={() => setExpr((p) => p.slice(0, -1))}
            aria-label="Backspace"
          >
            <Delete className="h-4 w-4" />
          </Button>

          {/* Digits + operators */}
          {PAD.map((key) => (
            <Button
              key={key.label}
              type="button"
              variant={key.op ? "secondary" : "outline"}
              size="sm"
              className={cn("h-9 text-base", key.span && "col-span-2")}
              onClick={() => press(key.value)}
            >
              {key.label}
            </Button>
          ))}
        </div>

        <Button
          type="button"
          className="mt-2 w-full"
          disabled={result == null}
          onClick={insert}
        >
          {result == null ? "Enter a calculation" : `Use ₹${formatResult(result)}`}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export default PriceCalculator;
