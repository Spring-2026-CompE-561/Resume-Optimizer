import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Field({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  const fieldId = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function SelectionList<T extends { id: number }>(props: {
  emptyMessage: string;
  getLabel: (item: T) => string;
  getMeta: (item: T) => string;
  items: T[];
  onSelect: (id: number) => void;
  selectedId: number | null;
}) {
  const { emptyMessage, getLabel, getMeta, items, onSelect, selectedId } = props;

  return (
    <div className="space-y-3">
      {items.length > 0 ? (
        items.map((item) => {
          const active = item.id === selectedId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/70 bg-background/75 hover:border-foreground/15"
              }`}
            >
              <p className="font-semibold">{getLabel(item)}</p>
              <p className={`mt-1 text-sm ${active ? "text-white/72" : "text-muted-foreground"}`}>
                {getMeta(item)}
              </p>
            </button>
          );
        })
      ) : (
        <EmptyState message={emptyMessage} />
      )}
    </div>
  );
}

export function SelectorField({
  disabled,
  emptyLabel,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  emptyLabel: string;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  const fieldId = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <select
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="flex h-11 w-full rounded-2xl border border-border bg-input px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.length === 0 ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-background/75 p-4">
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-sm leading-7 text-muted-foreground">{value}</p>
    </div>
  );
}

export function PreviewBlock({ content, title }: { content: string; title: string }) {
  return (
    <div className="rounded-[28px] border border-border/70 bg-background/75 p-4">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
        {content || "No content available yet."}
      </pre>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-border bg-background/55 p-5 text-sm leading-7 text-muted-foreground">
      {message}
    </div>
  );
}

export function KeywordBadge({ label }: { label: string }) {
  return <Badge className="bg-background text-foreground">{label}</Badge>;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
