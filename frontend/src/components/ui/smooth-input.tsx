"use client";

import {
	motion,
	useMotionValue,
	useReducedMotion,
	useSpring,
} from "motion/react";
import {
	type ComponentPropsWithoutRef,
	useEffect,
	useRef,
	useState,
} from "react";

import { cn } from "@/lib/utils";

const DEFAULT_SPRING = { stiffness: 500, damping: 30, mass: 0.5 } as const;

function getPasswordChar() {
	if (typeof navigator === "undefined") {
		return "•";
	}
	return navigator.userAgent.match(/firefox|fxios/i) ? "●" : "•";
}

const shellClassName = cn(
	"relative flex h-11 w-full items-center rounded-xl border border-input bg-transparent pl-4 text-sm transition-colors",
	"focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 focus-within:ring-inset",
	"[&:has(input:disabled)]:cursor-not-allowed [&:has(input:disabled)]:opacity-50",
	"[&:has(input[aria-invalid=true])]:border-destructive [&:has(input[aria-invalid=true])]:ring-2 [&:has(input[aria-invalid=true])]:ring-destructive/30 [&:has(input[aria-invalid=true])]:ring-inset",
);

function EyeIcon({ open }: { open: boolean }) {
	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon; button has aria-label
		<svg
			aria-hidden
			className="size-4"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.6"
			viewBox="0 0 24 24"
		>
			{open ? (
				<>
					<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
					<circle cx="12" cy="12" r="3" />
				</>
			) : (
				<>
					<path d="M3 3l18 18" />
					<path d="M10.6 5.1A9.9 9.9 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-2.2 3.1M6.6 6.6A17.3 17.3 0 0 0 2 12s3.5 7 10 7a9.9 9.9 0 0 0 3.4-.6" />
					<path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
				</>
			)}
		</svg>
	);
}

type SmoothInputProps = ComponentPropsWithoutRef<"input"> & {
	wrapperClassName?: string;
	spring?: { stiffness: number; damping: number; mass: number };
	showPasswordToggle?: boolean;
};

const SELECTABLE_TYPES = new Set(["text", "search", "url", "tel", "password"]);

const INPUT_MODE_BY_TYPE: Record<
	string,
	ComponentPropsWithoutRef<"input">["inputMode"]
> = {
	email: "email",
	tel: "tel",
	number: "decimal",
	search: "search",
	url: "url",
};

const SmoothInput = ({
	className,
	wrapperClassName,
	value,
	defaultValue,
	onChange,
	onBlur,
	onFocus,
	type = "text",
	inputMode,
	placeholder,
	style,
	spring = DEFAULT_SPRING,
	showPasswordToggle,
	...props
}: SmoothInputProps) => {
	const [passwordVisible, setPasswordVisible] = useState(false);
	const isPasswordField = type === "password";
	const showToggle = showPasswordToggle ?? isPasswordField;

	const effectiveType =
		isPasswordField && passwordVisible ? "text" : (type ?? "text");
	const domType = SELECTABLE_TYPES.has(effectiveType) ? effectiveType : "text";
	const resolvedInputMode = inputMode ?? INPUT_MODE_BY_TYPE[type ?? "text"];

	const [internalValue, setInternalValue] = useState(defaultValue ?? "");
	const caretX = useMotionValue(0);
	const caretOpacity = useMotionValue(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const measureRef = useRef<HTMLSpanElement>(null);
	const prefersReducedMotion = useReducedMotion();

	const isControlled = value !== undefined;

	const springCaretX = useSpring(
		caretX,
		prefersReducedMotion
			? { stiffness: 10000, damping: 100, mass: 0.1 }
			: spring,
	);

	const inputValue = isControlled ? String(value) : internalValue;

	const syncMeasureSpan = () => {
		const input = inputRef.current;
		const measureSpan = measureRef.current;
		if (!input || !measureSpan) return;

		const styles = window.getComputedStyle(input);
		const isPassword = input.type === "password";
		const passwordChar = getPasswordChar();

		let fontSize = styles.fontSize;
		if (
			passwordChar === "•" &&
			isPassword &&
			!navigator.userAgent.match(/chrome|chromium|crios/i)
		) {
			fontSize = `${Number.parseFloat(fontSize) + 6.25}px`;
		}

		measureSpan.style.font = `${styles.fontStyle} ${styles.fontWeight} ${fontSize} ${styles.fontFamily}`;
		measureSpan.style.letterSpacing = styles.letterSpacing;
		measureSpan.style.fontFeatureSettings = styles.fontFeatureSettings;
		measureSpan.style.fontVariationSettings = styles.fontVariationSettings;
	};

	const measurePrefixWidth = (text: string) => {
		const input = inputRef.current;
		const measureSpan = measureRef.current;
		if (!input || !measureSpan) return null;

		syncMeasureSpan();
		measureSpan.textContent = text;

		const paddingLeft =
			Number.parseFloat(window.getComputedStyle(input).paddingLeft) || 0;

		return text.length > 0
			? measureSpan.getBoundingClientRect().width + paddingLeft
			: paddingLeft - 1;
	};

	const scrollCaretIntoView = (
		target: HTMLInputElement,
		absoluteWidth: number,
	) => {
		const styles = window.getComputedStyle(target);
		const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
		const paddingRight = Number.parseFloat(styles.paddingRight) || 0;
		const maxScroll = Math.max(0, target.scrollWidth - target.clientWidth);
		const visibleRight = target.scrollLeft + target.clientWidth - paddingRight;
		const visibleLeft = target.scrollLeft + paddingLeft;

		if (absoluteWidth > visibleRight) {
			target.scrollLeft = Math.min(
				absoluteWidth - target.clientWidth + paddingRight,
				maxScroll,
			);
			return;
		}

		if (absoluteWidth < visibleLeft) {
			target.scrollLeft = Math.max(0, absoluteWidth - paddingLeft);
		}
	};

	const getCaretIndex = (target: HTMLInputElement) => {
		const selectionStart = target.selectionStart ?? 0;
		const selectionEnd = target.selectionEnd ?? 0;

		if (selectionStart === selectionEnd) {
			return selectionStart;
		}

		return target.selectionDirection === "backward"
			? selectionStart
			: selectionEnd;
	};

	const updateCaretFromInput = (target: HTMLInputElement | null) => {
		if (!target) return;
		const selectionStart = target.selectionStart ?? 0;
		const selectionEnd = target.selectionEnd ?? 0;
		const hasSelection = selectionStart !== selectionEnd;
		const caretIndex = getCaretIndex(target);
		const isPassword = target.type === "password";
		const textBeforeCaret = isPassword
			? getPasswordChar().repeat(caretIndex)
			: target.value.slice(0, caretIndex);

		const absoluteWidth = measurePrefixWidth(textBeforeCaret);
		if (absoluteWidth === null) return;

		scrollCaretIntoView(target, absoluteWidth);

		const styles = window.getComputedStyle(target);
		const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
		const paddingRight = Number.parseFloat(styles.paddingRight) || 0;
		const caretPosition = absoluteWidth - target.scrollLeft;
		const minX = paddingLeft - 1;
		const maxX = target.clientWidth - paddingRight;
		const isCaretVisible = caretPosition >= minX && caretPosition <= maxX + 1;

		caretX.set(Math.min(caretPosition, maxX));

		if (!isCaretVisible || hasSelection) {
			caretOpacity.set(0);
			return;
		}

		caretOpacity.set(1);
	};

	const updateCaretRef = useRef(updateCaretFromInput);
	updateCaretRef.current = updateCaretFromInput;
	const caretOpacityRef = useRef(caretOpacity);
	caretOpacityRef.current = caretOpacity;

	// biome-ignore lint/correctness/useExhaustiveDependencies: value/type are intentional re-run triggers
	useEffect(() => {
		const input = inputRef.current;
		if (input && document.activeElement === input) {
			updateCaretRef.current(input);
		}
	}, [inputValue, type]);

	useEffect(() => {
		const input = inputRef.current;
		const container = containerRef.current;
		if (!input || !container) return;

		const updateCaretIfFocused = () => {
			if (document.activeElement === input) {
				updateCaretRef.current(input);
			}
		};

		const handleSelectionChange = () => {
			if (document.activeElement !== input) return;

			requestAnimationFrame(() => {
				if (document.activeElement === input) {
					updateCaretRef.current(input);
				}
			});
		};

		document.addEventListener("selectionchange", handleSelectionChange);
		document.fonts.addEventListener("loadingdone", updateCaretIfFocused);
		void document.fonts.ready.then(updateCaretIfFocused);
		input.addEventListener("scroll", updateCaretIfFocused);

		const resizeObserver = new ResizeObserver(updateCaretIfFocused);
		resizeObserver.observe(container);

		updateCaretIfFocused();

		return () => {
			document.removeEventListener("selectionchange", handleSelectionChange);
			document.fonts.removeEventListener("loadingdone", updateCaretIfFocused);
			input.removeEventListener("scroll", updateCaretIfFocused);
			resizeObserver.disconnect();
		};
	}, []);

	return (
		<div
			className={cn(
				shellClassName,
				showToggle ? "pr-1.5" : "pr-4",
				wrapperClassName,
			)}
		>
			<div
				ref={containerRef}
				className="relative grid min-w-0 flex-1 grid-cols-1 text-sm"
				style={{ caretColor: "transparent" }}
			>
				<input
					{...props}
					ref={inputRef}
					type={domType}
					inputMode={resolvedInputMode}
					placeholder={placeholder}
					className={cn(
						"col-start-1 col-end-2 row-start-1 row-end-2 w-full bg-transparent text-inherit text-foreground caret-transparent outline-none placeholder:text-muted-foreground",
						className,
					)}
					style={style}
					value={inputValue}
					onChange={(event) => {
						if (!isControlled) setInternalValue(event.target.value);
						onChange?.(event);
						requestAnimationFrame(() => {
							updateCaretRef.current(inputRef.current);
						});
					}}
					onFocus={(event) => {
						onFocus?.(event);
						requestAnimationFrame(() => {
							updateCaretRef.current(inputRef.current);
						});
					}}
					onBlur={(event) => {
						caretOpacityRef.current.set(0);
						onBlur?.(event);
					}}
				/>
				<span
					ref={measureRef}
					aria-hidden
					className="pointer-events-none invisible absolute top-0 left-0 whitespace-pre"
				/>
				<motion.div
					className="pointer-events-none col-start-1 col-end-2 row-start-1 row-end-2 h-[1.1em] w-0.5 self-center rounded-full bg-foreground"
					style={{ x: springCaretX, opacity: caretOpacity }}
				/>
			</div>
			{showToggle ? (
				<button
					type="button"
					aria-label={passwordVisible ? "Hide password" : "Show password"}
					aria-pressed={passwordVisible}
					onMouseDown={(event) => event.preventDefault()}
					onClick={() => {
						const input = inputRef.current;
						const start = input?.selectionStart ?? null;
						const end = input?.selectionEnd ?? null;
						setPasswordVisible((visible) => !visible);
						requestAnimationFrame(() => {
							const el = inputRef.current;
							if (!el) return;
							el.focus();
							if (start !== null && end !== null) {
								el.setSelectionRange(start, end);
							}
							updateCaretRef.current(el);
						});
					}}
					className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
				>
					<EyeIcon open={passwordVisible} />
				</button>
			) : null}
		</div>
	);
};

export { SmoothInput };
