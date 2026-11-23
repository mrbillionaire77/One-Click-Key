import type { SVGProps } from 'react';

interface BrandLogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * Custom minimalist geometric SVG monogram for One-Click Key.
 * Architectural chamfered key bow with warm-bronze click-actuator core and stepped security ward.
 */
export function BrandLogo({ size = 32, className, ...props }: BrandLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        className="fill-[#0D0D0D] stroke-[#2A2622] dark:fill-[#161616] dark:stroke-[#3D3833]"
        strokeWidth="2"
      />
      <path
        d="M14 23L18 19H31V29H51V35H47V43H42V35H38V40H34V35H31V45H18L14 41V23Z"
        fill="#F7F5F2"
      />
      <rect x="20" y="27" width="7" height="10" rx="1" fill="#0D0D0D" />
      <rect x="21.5" y="29" width="4" height="6" rx="0.5" fill="#A47148" />
      <rect x="42" y="35" width="5" height="8" fill="#A47148" />
    </svg>
  );
}
