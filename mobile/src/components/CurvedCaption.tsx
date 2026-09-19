/**
 * Curved text that stays correctly shaped in complex scripts like Devanagari.
 *
 * @remarks
 * SVG TextPath lays text out one codepoint at a time, which breaks shaping:
 * in लिस्ट the zero-width ि matra and the स्ट conjunct fall apart and ल/स
 * collide. Letter-spacing cannot fix that - it moves glyphs but never
 * reattaches a matra to its consonant.
 *
 * So the text is split into aksharas (syllable clusters) instead. Each cluster
 * is a normal `<Text>`, shaped by the platform's own engine exactly as it would
 * be anywhere else in the app, then placed along the arc and rotated to it.
 * Spacing is added BETWEEN clusters, never inside one.
 *
 * @packageDocumentation
 */

import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

// Marks that attach to the preceding base: chandrabindu, anusvara, visarga,
// nukta, every vowel sign (matra), the virama, stress signs, and ZWJ/ZWNJ.
const COMBINING =
  /[\u0900-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u200C\u200D]/;
const VIRAMA = "\u094D";

/**
 * Splits text into aksharas — syllable clusters that must stay whole.
 *
 * @remarks
 * A mark joins the base before it, and a consonant after a virama joins the
 * conjunct. Spaces come back as their own cluster, which is what lets the
 * caller widen the word breaks without touching the spacing inside a word.
 *
 * Latin text passes through as one cluster per character, so the same code
 * path works in both languages.
 *
 * @example
 * ```ts
 * splitClusters("लिस्ट लिखें"); // ["लि", "स्ट", " ", "लि", "खें"]
 * ```
 */
export function splitClusters(text: string): string[] {
  const out: string[] = [];
  const codepoints = [...text];
  for (let i = 0; i < codepoints.length; i++) {
    const c = codepoints[i];
    const prev = i > 0 ? codepoints[i - 1] : "";
    // A mark joins its base; a consonant after a virama joins the conjunct.
    if (out.length && (COMBINING.test(c) || prev === VIRAMA)) {
      out[out.length - 1] += c;
    } else {
      out.push(c);
    }
  }
  return out;
}

type CurvedCaptionProps = {
  text: string;
  cx: number;
  cy: number;
  radius: number;
  fontSize: number;
  color: string;
  gap: number;
  wordGap: number;
};

type Box = { w: number; h: number };

/**
 * A short caption bent around a circle, used for the label under the tab bar's
 * centre button.
 *
 * @remarks
 * Draws `text` along the lower half of a circle, reading left to right with the
 * tops of the letters toward the centre. Render it keyed by `text`, so a
 * language switch remounts it and the clusters are measured afresh.
 *
 * It renders twice. The first pass lays the clusters out invisibly to learn
 * their real widths, because the spacing along the arc depends on them; the
 * second places each one. So it is briefly blank on first mount, and a caller
 * should not expect it to draw synchronously.
 *
 * Absolutely positioned over its parent and `pointerEvents="none"`, so it
 * never takes a tap from the button it labels.
 *
 * @param cx - Centre of the circle the text follows.
 * @param radius - Distance from that centre to each cluster's middle.
 * @param gap - Space between clusters, measured along the arc.
 * @param wordGap - Extra space added at each word break.
 */
export function CurvedCaption({
  text,
  cx,
  cy,
  radius,
  fontSize,
  color,
  gap,
  wordGap,
}: CurvedCaptionProps) {
  const clusters = splitClusters(text);
  const [boxes, setBoxes] = useState<(Box | undefined)[]>(() =>
    clusters.map(() => undefined),
  );

  const textStyle = { fontSize, fontWeight: "700" as const, color };
  const measured = boxes.length === clusters.length && boxes.every(Boolean);

  // Pass 1: lay every cluster out invisibly to learn its real width, since the
  // spacing along the arc depends on it.
  if (!measured) {
    return (
      <View pointerEvents="none" style={styles.measure}>
        {clusters.map((cluster, i) => (
          <Text
            key={i}
            style={[textStyle, styles.noShrink]}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setBoxes((prev) => {
                const next = [...prev];
                next[i] = { w: width, h: height };
                return next;
              });
            }}
          >
            {cluster}
          </Text>
        ))}
      </View>
    );
  }

  // Pass 2: place each cluster along the arc, centred on the bottom point.
  const advances = clusters.map(
    (cluster, i) => (boxes[i] as Box).w + (/\s/.test(cluster) ? wordGap : 0),
  );
  const runLength =
    advances.reduce((sum, advance) => sum + advance, 0) +
    gap * (clusters.length - 1);

  let travelled = 0;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {clusters.map((cluster, i) => {
        const { w, h } = boxes[i] as Box;
        const middle = travelled + advances[i] / 2;
        travelled += advances[i] + gap;

        // PI/2 points straight down. Moving right along the text moves the
        // angle back toward 0, so the run is centred under the button.
        const theta = Math.PI / 2 + (runLength / 2 - middle) / radius;
        const x = cx + radius * Math.cos(theta);
        const y = cy + radius * Math.sin(theta);

        // Turning by (theta - 90deg) points each cluster's top at the centre.
        const rotate = `${(theta * 180) / Math.PI - 90}deg`;
        const boxWidth = Math.ceil(w) + 2; // a hair of slack so it never wraps

        return (
          <Text
            key={i}
            numberOfLines={1}
            style={[
              textStyle,
              {
                position: "absolute",
                width: boxWidth,
                left: x - boxWidth / 2,
                top: y - h / 2,
                textAlign: "center",
                transform: [{ rotate }],
              },
            ]}
          >
            {cluster}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  measure: {
    position: "absolute",
    top: 0,
    left: 0,
    opacity: 0,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  noShrink: { flexShrink: 0 },
});
