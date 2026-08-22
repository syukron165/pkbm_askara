"use client";

import React, { useMemo } from "react";

// Standard Code 128 (Subset B) Encoding Table
// Encodes all standard ASCII characters 32 to 127
const CODE128_PATTERNS: number[] = [
  212222, 222122, 222221, 121223, 121322, 131222, 122213, 122312, 132212, 221213, // 0-9
  221312, 231212, 112232, 122132, 122231, 113222, 123122, 123221, 223211, 221132, // 10-19
  221231, 213212, 223112, 312131, 311222, 321122, 321221, 312212, 322112, 322211, // 20-29
  212123, 212321, 232121, 111323, 131123, 131321, 112313, 132113, 132311, 211313, // 30-39
  231113, 231311, 112133, 112331, 132131, 113123, 113321, 133121, 313121, 211331, // 40-49
  231131, 213113, 213311, 213131, 311123, 311321, 331121, 312113, 312311, 332111, // 50-59
  314111, 221411, 431111, 111224, 111422, 121124, 121421, 141122, 141221, 112214, // 60-69
  112412, 122114, 122411, 142112, 142211, 241211, 221114, 413111, 241112, 134111, // 70-79
  111242, 121142, 121241, 114212, 124112, 124211, 411212, 421112, 421211, 212141, // 80-89
  214121, 412121, 111143, 111341, 131141, 114113, 114311, 411113, 411311, 113141, // 90-99
  114131, 311141, 411131, 211412, 211214, 211232, 2331112,                          // 100-106 (106 is STOP)
];

const START_CODE_B = 104;
const STOP_CODE = 106;

function encodeCode128B(text: string): { modules: boolean[]; checkDigit: number } {
  const cleanText = text.replace(/[^\x20-\x7E]/g, "") || "ASKARA";
  
  // Calculate checksum
  let checksum = START_CODE_B;
  const charCodes: number[] = [START_CODE_B];

  for (let i = 0; i < cleanText.length; i++) {
    const code = cleanText.charCodeAt(i) - 32;
    charCodes.push(code);
    checksum += code * (i + 1);
  }

  const checkDigit = checksum % 103;
  charCodes.push(checkDigit);
  charCodes.push(STOP_CODE);

  // Convert char codes to boolean bars/spaces
  const modules: boolean[] = [];
  
  for (let i = 0; i < charCodes.length; i++) {
    const val = charCodes[i];
    const pattern = CODE128_PATTERNS[val];
    const patternStr = pattern.toString();
    
    let isBar = true;
    for (let p = 0; p < patternStr.length; p++) {
      const width = parseInt(patternStr[p], 10);
      for (let w = 0; w < width; w++) {
        modules.push(isBar);
      }
      isBar = !isBar;
    }
  }

  // Add final termination bar for Code 128 (width 2)
  modules.push(true);
  modules.push(true);

  return { modules, checkDigit };
}

export interface BarcodeGeneratorProps {
  value: string;
  width?: number;
  height?: number;
  barColor?: string;
  backgroundColor?: string;
  showText?: boolean;
  textColor?: string;
  fontSize?: number;
  className?: string;
}

export function BarcodeGenerator({
  value,
  width = 160,
  height = 36,
  barColor = "#000000",
  backgroundColor = "transparent",
  showText = true,
  textColor = "#1e293b",
  fontSize = 9,
  className = "",
}: BarcodeGeneratorProps) {
  const { modules } = useMemo(() => encodeCode128B(value), [value]);
  const totalModules = modules.length;

  // Generate SVG path for crisp rasterization at any resolution
  const pathD = useMemo(() => {
    let d = "";
    const moduleWidth = 1;
    const barHeight = showText ? height - (fontSize + 4) : height;

    for (let i = 0; i < totalModules; i++) {
      if (modules[i]) {
        const x = i * moduleWidth;
        d += `M${x},0 h${moduleWidth} v${barHeight} h-${moduleWidth} Z `;
      }
    }
    return d;
  }, [modules, totalModules, height, showText, fontSize]);

  const viewBoxWidth = totalModules;
  const viewBoxHeight = height;

  return (
    <div className={`flex flex-col items-center select-none ${className}`} style={{ width }}>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        style={{ backgroundColor, display: "block" }}
      >
        <path d={pathD} fill={barColor} shapeRendering="crispEdges" />
        {showText && (
          <text
            x={viewBoxWidth / 2}
            y={height - 1}
            textAnchor="middle"
            fill={textColor}
            fontSize={fontSize}
            fontWeight="bold"
            letterSpacing="0.1em"
            fontFamily="ui-monospace, monospace"
          >
            {value}
          </text>
        )}
      </svg>
    </div>
  );
}
