import { Search } from "lucide-react";

type HiddenField = {
  name: string;
  value: string;
};

export function WikiSearchForm({
  action,
  query,
  placeholder,
  hiddenFields = [],
}: {
  action: string;
  query?: string;
  placeholder: string;
  hiddenFields?: HiddenField[];
}) {
  return (
    <form action={action} className="portal-panel-soft flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      {hiddenFields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}

      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={placeholder}
          className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-slate-500"
        />
      </div>

      <button
        type="submit"
        className="portal-chip h-12 justify-center px-5 text-sm font-medium text-white hover:border-white/18 hover:bg-white/[0.08]"
      >
        Search
      </button>
    </form>
  );
}
