import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

export type ButtonVariant = "solid" | "secondary" | "tertiary" | "ghost" | "light" | "danger" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  solid: "border-primary bg-primary text-white hover:border-primary-deep hover:bg-primary-deep",
  secondary:
    "border-secondary bg-secondary text-ink hover:border-secondary-deep hover:bg-secondary-deep",
  tertiary: "border-tertiary bg-tertiary text-white hover:border-tertiary-deep hover:bg-tertiary-deep",
  ghost: "border-primary bg-transparent text-primary hover:bg-primary-soft",
  light: "border-white bg-white text-ink hover:border-primary-soft hover:bg-primary-soft",
  danger: "border-danger bg-danger text-white hover:opacity-90",
  quiet: "border-line-strong bg-transparent text-ink-2 hover:border-ink-2 hover:text-ink",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-[0.9rem]",
  md: "px-[22px] py-[13px] text-base",
  lg: "px-7 py-4 text-[1.05rem]",
};

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-card border-[1.5px] font-semibold no-underline transition-[background-color,border-color,transform,opacity] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-45";

export const buttonClasses = (
  variant: ButtonVariant = "solid",
  size: ButtonSize = "md",
  className = "",
  fullWidth = false
) => `${base} ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? "w-full" : ""} ${className}`;

interface Shared {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children?: ReactNode;
}

/** <button>. Defaults to type="button" so it never submits a form by accident. */
export function Button({
  variant,
  size,
  fullWidth,
  className = "",
  type = "button",
  children,
  ...rest
}: Shared & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={buttonClasses(variant, size, className, fullWidth)} {...rest}>
      {children}
    </button>
  );
}

/** <a href> for anchors, mailto and external links. */
export function ButtonAnchor({
  variant,
  size,
  fullWidth,
  className = "",
  children,
  ...rest
}: Shared & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={buttonClasses(variant, size, className, fullWidth)} {...rest}>
      {children}
    </a>
  );
}

/** Router navigation without a page reload. */
export function ButtonLink({
  variant,
  size,
  fullWidth,
  className = "",
  children,
  ...rest
}: Shared & LinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className, fullWidth)} {...rest}>
      {children}
    </Link>
  );
}
