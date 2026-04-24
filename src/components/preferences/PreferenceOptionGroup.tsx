import { useId } from 'react';
import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface PreferenceOption {
  value: string;
  label: string;
  help?: string;
  icon?: ReactNode;
}

export default function PreferenceOptionGroup({
  label,
  help,
  value,
  options,
  onChange,
}: {
  label: string;
  help?: string;
  value: string;
  options: PreferenceOption[];
  onChange: (value: string) => void;
}) {
  const groupId = useId();
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {help ? <p className="text-xs text-text-muted mt-0.5">{help}</p> : null}
      </div>
      <RadioGroup value={value} onValueChange={onChange} className="grid gap-2 md:grid-cols-2">
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`;
          return (
          <Label
            key={option.value}
            htmlFor={optionId}
            className="flex cursor-pointer items-start gap-2 rounded-md border border-white/10 bg-surface-0/20 p-3"
            onClick={() => onChange(option.value)}
          >
            <RadioGroupItem id={optionId} value={option.value} className="mt-0.5" />
            {option.icon ? <span className="mt-0.5 text-primary">{option.icon}</span> : null}
            <span>
              <span className="block text-sm text-text-primary">{option.label}</span>
              {option.help ? <span className="block text-xs text-text-muted mt-0.5">{option.help}</span> : null}
            </span>
          </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
