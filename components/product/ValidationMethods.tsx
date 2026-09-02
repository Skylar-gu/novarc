export interface ValidationMethod {
  /** Name of the test. */
  name: string;
  /** The question the test settles. */
  question: string;
}

export interface ValidationMethodsProps {
  methods: ValidationMethod[];
}

/**
 * The pre-launch validation tests as a description list: each test name paired
 * with the question it answers. Two columns from the `sm` breakpoint up,
 * stacked below. No headings — the wrapping section's `<h2>` is the only one.
 */
export function ValidationMethods({ methods }: ValidationMethodsProps) {
  return (
    <dl className="max-w-3xl">
      {methods.map((method) => (
        <div
          key={method.name}
          className="grid gap-1.5 border-t border-border py-5 last:border-b sm:grid-cols-[13rem_1fr] sm:gap-6"
        >
          <dt className="font-sans text-sm font-medium text-text">
            {method.name}
          </dt>
          <dd className="leading-relaxed text-text-muted">{method.question}</dd>
        </div>
      ))}
    </dl>
  );
}
