/** Moves focus to the first invalid field once React has rendered the errors. */
export function focusFirstInvalid(form: HTMLFormElement) {
  requestAnimationFrame(() =>
    form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
  );
}
