"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import { Form as FormPrimitive } from "@base-ui/react/form";
import type * as React from "react";

import { cn } from "@/lib/utils";

const Form = FormPrimitive;

function Field({
	className,
	...props
}: React.ComponentProps<typeof FieldPrimitive.Root>) {
	return (
		<FieldPrimitive.Root
			data-slot="field"
			className={cn("flex flex-col gap-1.5", className)}
			{...props}
		/>
	);
}

function FieldLabel({
	className,
	...props
}: React.ComponentProps<typeof FieldPrimitive.Label>) {
	return (
		<FieldPrimitive.Label
			data-slot="field-label"
			className={cn(
				"text-sm font-medium text-foreground data-[disabled]:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

const FieldControl = FieldPrimitive.Control;

function FieldDescription({
	className,
	...props
}: React.ComponentProps<typeof FieldPrimitive.Description>) {
	return (
		<FieldPrimitive.Description
			data-slot="field-description"
			className={cn("text-xs text-muted-foreground", className)}
			{...props}
		/>
	);
}

function FieldError({
	className,
	...props
}: React.ComponentProps<typeof FieldPrimitive.Error>) {
	return (
		<FieldPrimitive.Error
			data-slot="field-error"
			className={cn("text-xs text-destructive", className)}
			{...props}
		/>
	);
}

export { Field, FieldControl, FieldDescription, FieldError, FieldLabel, Form };
